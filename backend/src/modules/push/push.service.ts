import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from '../../entities/push-subscription.entity';
import { MovimientosRecurrentesService } from '../movimientos-recurrentes/movimientos-recurrentes.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { buildReminderPayload } from './push-payload';

/**
 * Owns the Web Push lifecycle: VAPID setup, subscription upsert, the daily
 * reminder cron, and stale-subscription pruning (410/404).
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(PushSubscription)
    private readonly repo: Repository<PushSubscription>,
    private readonly mrService: MovimientosRecurrentesService,
  ) {}

  /**
   * Fail-fast VAPID configuration. The module MUST NOT boot without the
   * VAPID env vars — a missing key is a deployment error, not a runtime
   * condition to swallow.
   */
  async onModuleInit(): Promise<void> {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
      throw new Error(
        'VAPID_* env vars missing — set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT',
      );
    }

    webpush.setVapidDetails(`mailto:${subject}`, publicKey, privateKey);
  }

  /**
   * Idempotent upsert. A second subscribe with the same (tenantId, endpoint)
   * refreshes the keys instead of duplicating the row — the UNIQUE constraint
   * backs this, and we resolve in code to avoid relying on a thrown duplicate.
   */
  async subscribe(
    tenantId: number,
    dto: SubscribeDto,
  ): Promise<PushSubscription> {
    const existing = await this.repo.findOne({
      where: { propietarioId: tenantId, endpoint: dto.endpoint },
    });

    if (existing) {
      existing.keysP256dh = dto.keys.p256dh;
      existing.keysAuth = dto.keys.auth;
      existing.expirationTime = dto.expirationTime ?? null;
      return this.repo.save(existing);
    }

    const sub = this.repo.create();
    sub.propietarioId = tenantId;
    sub.endpoint = dto.endpoint;
    sub.keysP256dh = dto.keys.p256dh;
    sub.keysAuth = dto.keys.auth;
    sub.expirationTime = dto.expirationTime ?? null;
    return this.repo.save(sub);
  }

  /**
   * Remove the (tenantId, endpoint) subscription. Scoped to the tenant so a
   * user can only unsubscribe their own devices.
   */
  async unsubscribe(tenantId: number, endpoint: string): Promise<void> {
    await this.repo.delete({ propietarioId: tenantId, endpoint });
  }

  /**
   * Daily 09:00 reminder. For each owner that has at least one subscription,
   * count pending recurrent movements; if any, send one push per device.
   * Owners without subscriptions are never queried — skipped implicitly.
   * Stale subscriptions (410 Gone / 404) are pruned so the others still
   * receive their push.
   */
  @Cron('0 9 * * *')
  async sendDailyReminders(): Promise<void> {
    const subscriptions = await this.repo.find();
    if (subscriptions.length === 0) return;

    const ownerIds = [...new Set(subscriptions.map((s) => s.propietarioId))];

    for (const ownerId of ownerIds) {
      const pendientes = await this.mrService.getPendientes(ownerId);
      if (pendientes.length === 0) continue;

      const payload = buildReminderPayload(pendientes.length);
      const ownerSubs = subscriptions.filter((s) => s.propietarioId === ownerId);

      for (const sub of ownerSubs) {
        try {
          await this.sendToSubscription(sub, payload);
        } catch (error) {
          if (this.isStale(error)) {
            await this.repo.delete(sub.id);
          } else {
            this.logger.error(
              `Failed to send push to subscription ${sub.id}: ${error.message}`,
            );
          }
        }
      }
    }
  }

  /** Maps the stored entity to the web-push subscription shape and sends. */
  private async sendToSubscription(
    sub: PushSubscription,
    payload: ReturnType<typeof buildReminderPayload>,
  ): Promise<void> {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keysP256dh, auth: sub.keysAuth },
        expirationTime: sub.expirationTime ?? undefined,
      },
      JSON.stringify(payload),
    );
  }

  /** A 410 Gone / 404 response means the subscription is permanently dead. */
  private isStale(error: any): boolean {
    return error?.statusCode === 410 || error?.statusCode === 404;
  }
}
