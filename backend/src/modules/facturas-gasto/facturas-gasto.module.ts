import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturasGastoService } from './facturas-gasto.service';
import { FacturasGastoController } from './facturas-gasto.controller';
import { FacturaGasto } from '../../entities/facturagasto.entity';
import { Egreso } from '../../entities/egreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FacturaGasto, Egreso, CajaDiaria])],
  controllers: [FacturasGastoController],
  providers: [FacturasGastoService],
  exports: [FacturasGastoService],
})
export class FacturasGastoModule {}
