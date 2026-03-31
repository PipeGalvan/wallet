import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanillasCobrosService } from './planillas-cobros.service';
import { PlanillasCobrosController } from './planillas-cobros.controller';
import { PlanillaCobros } from '../../entities/planillacobros.entity';
import { PlanillaCobrosDetalle } from '../../entities/planillacobrosdetalle.entity';
import { Ingreso } from '../../entities/ingreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlanillaCobros, PlanillaCobrosDetalle, Ingreso, CajaDiaria])],
  controllers: [PlanillasCobrosController],
  providers: [PlanillasCobrosService],
  exports: [PlanillasCobrosService],
})
export class PlanillasCobrosModule {}
