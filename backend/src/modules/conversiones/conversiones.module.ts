import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversionesService } from './conversiones.service';
import { ConversionesController } from './conversiones.controller';
import { ConversionMoneda } from '../../entities/conversionmoneda.entity';
import { Ingreso } from '../../entities/ingreso.entity';
import { Egreso } from '../../entities/egreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { TipoIngreso } from '../../entities/tipoingreso.entity';
import { TipoEgreso } from '../../entities/tipoegreso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConversionMoneda, Ingreso, Egreso, CajaDiaria, TipoIngreso, TipoEgreso])],
  controllers: [ConversionesController],
  providers: [ConversionesService],
  exports: [ConversionesService],
})
export class ConversionesModule {}
