import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscription } from '../../entities/push-subscription.entity';
import { MovimientosRecurrentesModule } from '../movimientos-recurrentes/movimientos-recurrentes.module';
import { PushController } from './push.controller';
import { PushService } from './push.service';

/**
 * Push notifications module.
 *
 * Service behavior (cron + VAPID) is finalized in Phase 4 TDD.
 * Imported by AppModule alongside ScheduleModule.forRoot() (task 4.7).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PushSubscription]),
    MovimientosRecurrentesModule,
  ],
  controllers: [PushController],
  providers: [PushService],
})
export class PushModule {}
