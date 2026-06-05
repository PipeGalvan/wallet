import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransferenciasService } from './transferencias.service';
import { TransferenciasController } from './transferencias.controller';
import { Transferencia } from '../../entities/transferencia.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { Ingreso } from '../../entities/ingreso.entity';
import { Egreso } from '../../entities/egreso.entity';
import { TipoIngreso } from '../../entities/tipoingreso.entity';
import { TipoEgreso } from '../../entities/tipoegreso.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transferencia, CajaDiaria, Ingreso, Egreso, TipoIngreso, TipoEgreso])],
  controllers: [TransferenciasController],
  providers: [TransferenciasService],
  exports: [TransferenciasService],
})
export class TransferenciasModule {}
