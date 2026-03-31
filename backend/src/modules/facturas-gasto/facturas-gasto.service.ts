import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FacturaGasto } from '../../entities/facturagasto.entity';
import { Egreso } from '../../entities/egreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { CreateFacturaGastoDto } from './dto/create-factura-gasto.dto';
import { PagarFacturaGastoDto } from './dto/pagar-factura-gasto.dto';

@Injectable()
export class FacturasGastoService {
  constructor(
    @InjectRepository(FacturaGasto)
    private facturaGastoRepo: Repository<FacturaGasto>,
    @InjectRepository(Egreso)
    private egresoRepo: Repository<Egreso>,
    @InjectRepository(CajaDiaria)
    private cajaDiariaRepo: Repository<CajaDiaria>,
    private dataSource: DataSource,
  ) {}

  async findAll(tenantId: number, page = 1, limit = 20) {
    const [data, total] = await this.facturaGastoRepo.findAndCount({
      where: { propietarioId: tenantId },
      relations: ['tipoEgreso', 'moneda'],
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(tenantId: number, id: number) {
    const factura = await this.facturaGastoRepo.findOne({
      where: { id, propietarioId: tenantId },
      relations: ['tipoEgreso', 'moneda'],
    });
    if (!factura) throw new NotFoundException('Factura de gasto no encontrada');
    return factura;
  }

  async create(tenantId: number, dto: CreateFacturaGastoDto) {
    const factura = this.facturaGastoRepo.create({
      fecha: new Date(dto.fecha),
      tipoEgresoId: dto.tipoEgresoId,
      importe: dto.importe,
      saldo: dto.importe,
      monedaId: dto.monedaId,
      observacion: dto.observacion || undefined,
      fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
      propietarioId: tenantId,
    });
    return this.facturaGastoRepo.save(factura);
  }

  async update(tenantId: number, id: number, dto: Partial<CreateFacturaGastoDto>) {
    const factura = await this.findOne(tenantId, id);
    if (dto.fecha) factura.fecha = new Date(dto.fecha);
    if (dto.tipoEgresoId) factura.tipoEgresoId = dto.tipoEgresoId;
    if (dto.observacion !== undefined) factura.observacion = dto.observacion;
    if (dto.monedaId) factura.monedaId = dto.monedaId;
    if (dto.fechaVencimiento) factura.fechaVencimiento = new Date(dto.fechaVencimiento);
    return this.facturaGastoRepo.save(factura);
  }

  async pagar(tenantId: number, id: number, dto: PagarFacturaGastoDto) {
    const factura = await this.findOne(tenantId, id);

    if (Number(factura.saldo) <= 0) {
      throw new BadRequestException('La factura ya esta pagada');
    }
    if (dto.importe > Number(factura.saldo)) {
      throw new BadRequestException('El importe excede el saldo pendiente');
    }

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
        tipoEgresoId: factura.tipoEgresoId,
        observacion: `Pago factura gasto #${factura.id} - ${factura.observacion || ''}`,
        importe: dto.importe,
        cajaDiariaId: cajaDiaria.id,
        monedaId: dto.monedaId,
        propietarioId: tenantId,
      });
      await manager.save(egreso);

      factura.saldo = Number(factura.saldo) - dto.importe;
      await manager.save(factura);

      return { factura, egreso };
    });
  }
}
