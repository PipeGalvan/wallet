import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Factura } from '../../entities/factura.entity';
import { Ingreso } from '../../entities/ingreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { CobrarFacturaDto } from './dto/cobrar-factura.dto';

@Injectable()
export class FacturasService {
  constructor(
    @InjectRepository(Factura)
    private facturaRepo: Repository<Factura>,
    @InjectRepository(Ingreso)
    private ingresoRepo: Repository<Ingreso>,
    @InjectRepository(CajaDiaria)
    private cajaDiariaRepo: Repository<CajaDiaria>,
    private dataSource: DataSource,
  ) {}

  async findAll(tenantId: number, page = 1, limit = 20) {
    const [data, total] = await this.facturaRepo.findAndCount({
      where: { propietarioId: tenantId },
      relations: ['cliente', 'moneda'],
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findPendientes(tenantId: number) {
    return this.facturaRepo.find({
      where: { propietarioId: tenantId },
      relations: ['cliente', 'moneda'],
      order: { id: 'DESC' },
    });
  }

  async findOne(tenantId: number, id: number) {
    const factura = await this.facturaRepo.findOne({
      where: { id, propietarioId: tenantId },
      relations: ['cliente', 'moneda'],
    });
    if (!factura) throw new NotFoundException('Factura no encontrada');
    return factura;
  }

  async create(tenantId: number, dto: CreateFacturaDto) {
    const factura = this.facturaRepo.create({
      fecha: dto.fecha as any,
      clienteId: dto.clienteId,
      importe: dto.importe,
      saldo: dto.importe,
      observacion: dto.observacion || undefined,
      monedaId: dto.monedaId,
      propietarioId: tenantId,
    });
    return this.facturaRepo.save(factura);
  }

  async update(tenantId: number, id: number, dto: Partial<CreateFacturaDto>) {
    const factura = await this.findOne(tenantId, id);
    if (dto.fecha) factura.fecha = dto.fecha as any;
    if (dto.clienteId) factura.clienteId = dto.clienteId;
    if (dto.observacion !== undefined) factura.observacion = dto.observacion;
    if (dto.monedaId) factura.monedaId = dto.monedaId;
    return this.facturaRepo.save(factura);
  }

  async cobrar(tenantId: number, id: number, dto: CobrarFacturaDto) {
    const factura = await this.findOne(tenantId, id);

    if (Number(factura.saldo) <= 0) {
      throw new BadRequestException('La factura ya esta cobrada');
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

      const ingreso = manager.create(Ingreso, {
        fecha: new Date(),
        tipoIngresoId: 1,
        observacion: `Cobro factura #${factura.id} - ${factura.observacion || ''}`,
        importe: dto.importe,
        cajaDiariaId: cajaDiaria.id,
        monedaId: dto.monedaId,
        clienteId: factura.clienteId,
        propietarioId: tenantId,
        fechaHora: new Date(),
      });
      await manager.save(ingreso);

      factura.saldo = Number(factura.saldo) - dto.importe;
      await manager.save(factura);

      return { factura, ingreso };
    });
  }
}
