import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { PushService } from './push.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

/**
 * REST controller for push subscription lifecycle.
 *
 * Base path `/api/v1/push` (global prefix applied in main.ts).
 *
 * subscribe/unsubscribe require authentication + tenant resolution.
 * vapid-public is intentionally PUBLIC (no guard) so the browser can fetch
 * the VAPID public key before the user decides to opt in.
 *
 * Note: guards are applied per-method (not at class level) because NestJS
 * method guards add to — rather than replace — class guards. A class-level
 * guard would wrongly require auth on vapid-public.
 */
@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Post('subscribe')
  @UseGuards(JwtAuthGuard, TenantGuard)
  subscribe(@TenantId() tenantId: number, @Body() dto: SubscribeDto) {
    // propietarioId comes exclusively from the JWT (@TenantId); the DTO
    // carries no propietarioId and forbidNonWhitelisted rejects any sent.
    return this.pushService.subscribe(tenantId, dto);
  }

  @Delete('subscribe')
  @UseGuards(JwtAuthGuard, TenantGuard)
  unsubscribe(@TenantId() tenantId: number, @Body('endpoint') endpoint: string) {
    return this.pushService.unsubscribe(tenantId, endpoint);
  }

  @Get('vapid-public')
  vapidPublic() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY };
  }

  /**
   * Admin-only manual trigger of the daily reminders cron. Useful for
   * integration testing in prod without waiting for 09:00, and as an
   * operational "send test notification" tool.
   *
   * Guarded by JwtAuthGuard (valid JWT required). Admin authorization is
   * enforced here via req.user.isAdmin (populated by JwtStrategy from the
   * JWT payload). No AdminGuard exists in the project yet.
   */
  @Post('admin/trigger-reminders')
  @UseGuards(JwtAuthGuard)
  async triggerReminders(
    @Req() req: { user?: { isAdmin?: boolean } },
  ): Promise<{ sent: number; pruned: number; totalSubscriptions: number }> {
    if (!req.user?.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }
    return this.pushService.sendDailyReminders();
  }
}
