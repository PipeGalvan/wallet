import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturasService } from './facturas.service';
import { FacturasController } from './facturas.controller';
import { Factura } from '../../entities/factura.entity';
import { Ingreso } from '../../entities/ingreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Factura, Ingreso, CajaDiaria])],
  controllers: [FacturasController],
  providers: [FacturasService],
  exports: [FacturasService],
})
export class FacturasModule {}
