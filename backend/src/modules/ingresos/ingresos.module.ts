import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngresosService } from './ingresos.service';
import { IngresosController } from './ingresos.controller';
import { Ingreso } from '../../entities/ingreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingreso, CajaDiaria])],
  controllers: [IngresosController],
  providers: [IngresosService],
  exports: [IngresosService],
})
export class IngresosModule {}
