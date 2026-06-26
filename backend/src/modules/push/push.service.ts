import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscribeDto } from './dto/subscribe.dto';

/**
 * STUB — behavior is driven by push.service.spec.ts (Phase 4 TDD).
 * This scaffold exists only so PushController can be typed/wired (Phase 3).
 * Every method will be implemented and covered by tests before this is done.
 */
@Injectable()
export class PushService implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    // Implemented in Phase 4 (setVapidDetails fail-fast).
  }

  async subscribe(_tenantId: number, _dto: SubscribeDto): Promise<void> {
    // Implemented in Phase 4.
  }

  async unsubscribe(_tenantId: number, _endpoint: string): Promise<void> {
    // Implemented in Phase 4.
  }

  @Cron('0 9 * * *')
  async sendDailyReminders(): Promise<void> {
    // Implemented in Phase 4.
  }
}
