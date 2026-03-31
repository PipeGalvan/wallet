import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CajasService } from './cajas.service';
import { CajasController } from './cajas.controller';
import { Caja } from '../../entities/caja.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { Ingreso } from '../../entities/ingreso.entity';
import { Egreso } from '../../entities/egreso.entity';
import { Moneda } from '../../entities/moneda.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Caja, CajaDiaria, Ingreso, Egreso, Moneda])],
  controllers: [CajasController],
  providers: [CajasService],
  exports: [CajasService],
})
export class CajasModule {}
