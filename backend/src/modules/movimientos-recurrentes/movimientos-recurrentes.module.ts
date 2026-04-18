import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientosRecurrentesService } from './movimientos-recurrentes.service';
import { MovimientosRecurrentesController } from './movimientos-recurrentes.controller';
import { MovimientoRecurrente } from '../../entities/movimientorecurrente.entity';
import { IngresosModule } from '../ingresos/ingresos.module';
import { EgresosModule } from '../egresos/egresos.module';

@Module({
  imports: [TypeOrmModule.forFeature([MovimientoRecurrente]), IngresosModule, EgresosModule],
  controllers: [MovimientosRecurrentesController],
  providers: [MovimientosRecurrentesService],
  exports: [MovimientosRecurrentesService],
})
export class MovimientosRecurrentesModule {}
