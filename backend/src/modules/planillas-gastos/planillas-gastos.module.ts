import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanillasGastosService } from './planillas-gastos.service';
import { PlanillasGastosController } from './planillas-gastos.controller';
import { PlanillaGastos } from '../../entities/planillagastos.entity';
import { PlanillaGastosDetalle } from '../../entities/planillagastosdetalle.entity';
import { Egreso } from '../../entities/egreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlanillaGastos, PlanillaGastosDetalle, Egreso, CajaDiaria])],
  controllers: [PlanillasGastosController],
  providers: [PlanillasGastosService],
  exports: [PlanillasGastosService],
})
export class PlanillasGastosModule {}
