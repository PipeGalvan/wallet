import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogosService } from './catalogos.service';
import { TiposIngresoController } from './tipos-ingreso.controller';
import { TiposEgresoController } from './tipos-egreso.controller';
import { TipoIngreso } from '../../entities/tipoingreso.entity';
import { TipoEgreso } from '../../entities/tipoegreso.entity';
import { Moneda } from '../../entities/moneda.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TipoIngreso, TipoEgreso, Moneda])],
  controllers: [TiposIngresoController, TiposEgresoController],
  providers: [CatalogosService],
  exports: [CatalogosService],
})
export class CatalogosModule {}
