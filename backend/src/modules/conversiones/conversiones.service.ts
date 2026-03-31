import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConversionMoneda } from '../../entities/conversionmoneda.entity';
import { Ingreso } from '../../entities/ingreso.entity';
import { Egreso } from '../../entities/egreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { CreateConversionDto } from './dto/create-conversion.dto';
import Decimal from 'decimal.js';

@Injectable()
export class ConversionesService {
  constructor(
    @InjectRepository(ConversionMoneda)
    private conversionRepo: Repository<ConversionMoneda>,
    @InjectRepository(Ingreso)
    private ingresoRepo: Repository<Ingreso>,
    @InjectRepository(Egreso)
    private egresoRepo: Repository<Egreso>,
    @InjectRepository(CajaDiaria)
    private cajaDiariaRepo: Repository<CajaDiaria>,
    private dataSource: DataSource,
  ) {}

  async findAll(tenantId: number, page = 1, limit = 20) {
    const [data, total] = await this.conversionRepo.findAndCount({
      where: { propietarioId: tenantId },
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(tenantId: number, dto: CreateConversionDto) {
    if (dto.monedaOrigenId === dto.monedaDestinoId) {
      throw new BadRequestException('Las monedas deben ser diferentes');
    }

    const importeDestino = new Decimal(dto.importe).mul(new Decimal(dto.tipoCambio)).toNumber();

    return this.dataSource.transaction(async (manager) => {
      let cajaDiaria = await manager.findOne(CajaDiaria, {
        where: { cajaId: dto.cajaId },
        order: { id: 'DESC' },
      });
      if (!cajaDiaria) {
        cajaDiaria = manager.create(CajaDiaria, { cajaId: dto.cajaId, fechaApertura: new Date() });
        cajaDiaria = await manager.save(cajaDiaria);
      }

      const egreso = manager.create(Egreso, {
        fecha: new Date(),
        fechaHora: new Date(),
        tipoEgresoId: 47,
        observacion: `CONVERSION ${dto.monedaOrigenId}->${dto.monedaDestinoId}`,
        importe: dto.importe,
        cajaDiariaId: cajaDiaria.id,
        monedaId: dto.monedaOrigenId,
        propietarioId: tenantId,
      });
      await manager.save(egreso);

      const ingreso = manager.create(Ingreso, {
        fecha: new Date(),
        fechaHora: new Date(),
        tipoIngresoId: 10,
        observacion: `CONVERSION ${dto.monedaOrigenId}->${dto.monedaDestinoId}`,
        importe: importeDestino,
        cajaDiariaId: cajaDiaria.id,
        monedaId: dto.monedaDestinoId,
        propietarioId: tenantId,
      });
      await manager.save(ingreso);

      const conversion = manager.create(ConversionMoneda, {
        cajaId: dto.cajaId,
        monedaOrigenId: dto.monedaOrigenId,
        monedaDestinoId: dto.monedaDestinoId,
        tipoCambio: dto.tipoCambio,
        importeOrigen: dto.importe,
        importeDestino,
        propietarioId: tenantId,
      });
      return manager.save(conversion);
    });
  }
}
