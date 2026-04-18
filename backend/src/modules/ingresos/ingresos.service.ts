import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingreso } from '../../entities/ingreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';

@Injectable()
export class IngresosService {
  constructor(
    @InjectRepository(Ingreso)
    private ingresoRepo: Repository<Ingreso>,
    @InjectRepository(CajaDiaria)
    private cajaDiariaRepo: Repository<CajaDiaria>,
  ) {}

  async findAll(tenantId: number, page = 1, limit = 20, filters?: any) {
    const query = this.ingresoRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.tipoIngreso', 'ti')
      .leftJoinAndSelect('i.moneda', 'm')
      .leftJoinAndSelect('i.cliente', 'c')
      .where('i.IngresoPropietarioId = :tenantId', { tenantId })
      .orderBy('i.IngresoFechaHora', 'DESC');

    if (filters?.fechaDesde) {
      query.andWhere('i.IngresoFecha >= :fechaDesde', { fechaDesde: filters.fechaDesde });
    }
    if (filters?.fechaHasta) {
      query.andWhere('i.IngresoFecha <= :fechaHasta', { fechaHasta: filters.fechaHasta });
    }
    if (filters?.monedaId) {
      query.andWhere('i.MonedaId = :monedaId', { monedaId: filters.monedaId });
    }
    if (filters?.tipoIngresoId) {
      query.andWhere('i.TipoIngresoId = :tipoIngresoId', { tipoIngresoId: filters.tipoIngresoId });
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: number, id: number) {
    const ingreso = await this.ingresoRepo.findOne({
      where: { id, propietarioId: tenantId },
      relations: ['tipoIngreso', 'moneda', 'cliente'],
    });
    if (!ingreso) throw new NotFoundException('Ingreso no encontrado');
    return ingreso;
  }

  async create(tenantId: number, dto: CreateIngresoDto) {
    let cajaDiaria = await this.cajaDiariaRepo.findOne({
      where: { cajaId: dto.cajaId },
      order: { id: 'DESC' },
    });

    if (!cajaDiaria) {
      cajaDiaria = this.cajaDiariaRepo.create({
        cajaId: dto.cajaId,
        fechaApertura: new Date(),
      });
      await this.cajaDiariaRepo.save(cajaDiaria);
    }

    const ingreso = this.ingresoRepo.create({
      fecha: dto.fecha as any,
      tipoIngresoId: dto.tipoIngresoId,
      clienteId: dto.clienteId || undefined,
      observacion: dto.observacion || undefined,
      importe: dto.importe,
      monedaId: dto.monedaId,
      cajaDiariaId: cajaDiaria.id,
      propietarioId: tenantId,
      fechaHora: new Date(),
      movimientoRecurrenteId: dto.movimientoRecurrenteId || undefined,
    });

    return this.ingresoRepo.save(ingreso);
  }

  async update(tenantId: number, id: number, dto: UpdateIngresoDto) {
    const ingreso = await this.findOne(tenantId, id);
    if (dto.fecha) ingreso.fecha = dto.fecha as any;
    if (dto.tipoIngresoId) ingreso.tipoIngresoId = dto.tipoIngresoId;
    if (dto.clienteId !== undefined) ingreso.clienteId = dto.clienteId;
    if (dto.observacion !== undefined) ingreso.observacion = dto.observacion;
    if (dto.monedaId) ingreso.monedaId = dto.monedaId;
    if (dto.importe) ingreso.importe = dto.importe;
    return this.ingresoRepo.save(ingreso);
  }

  async remove(tenantId: number, id: number) {
    const ingreso = await this.findOne(tenantId, id);
    await this.ingresoRepo.remove(ingreso);
    return { deleted: true };
  }
}
