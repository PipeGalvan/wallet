import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscription } from '../../entities/push-subscription.entity';
import { MovimientosRecurrentesModule } from '../movimientos-recurrentes/movimientos-recurrentes.module';

/**
 * Push notifications module.
 *
 * Controller and service are registered here once created (Phase 3/4).
 * Imported by AppModule alongside ScheduleModule.forRoot() (task 4.7).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PushSubscription]),
    MovimientosRecurrentesModule,
  ],
})
export class PushModule {}
