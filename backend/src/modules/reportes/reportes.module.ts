import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';
import { Ingreso } from '../../entities/ingreso.entity';
import { Egreso } from '../../entities/egreso.entity';
import { Caja } from '../../entities/caja.entity';
import { Factura } from '../../entities/factura.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingreso, Egreso, Caja, Factura])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
