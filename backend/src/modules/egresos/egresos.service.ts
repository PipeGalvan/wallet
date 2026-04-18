import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Egreso } from '../../entities/egreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { CreateEgresoDto } from './dto/create-egreso.dto';
import { UpdateEgresoDto } from './dto/update-egreso.dto';

@Injectable()
export class EgresosService {
  constructor(
    @InjectRepository(Egreso)
    private egresoRepo: Repository<Egreso>,
    @InjectRepository(CajaDiaria)
    private cajaDiariaRepo: Repository<CajaDiaria>,
  ) {}

  async findAll(tenantId: number, page = 1, limit = 20, filters?: any) {
    const query = this.egresoRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.tipoEgreso', 'te')
      .leftJoinAndSelect('e.moneda', 'm')
      .where('e.EgresoPropietarioId = :tenantId', { tenantId })
      .orderBy('e.EgresoFechaHora', 'DESC');

    if (filters?.fechaDesde) {
      query.andWhere('e.EgresoFecha >= :fechaDesde', { fechaDesde: filters.fechaDesde });
    }
    if (filters?.fechaHasta) {
      query.andWhere('e.EgresoFecha <= :fechaHasta', { fechaHasta: filters.fechaHasta });
    }
    if (filters?.monedaId) {
      query.andWhere('e.MonedaId = :monedaId', { monedaId: filters.monedaId });
    }
    if (filters?.tipoEgresoId) {
      query.andWhere('e.TipoEgresoId = :tipoEgresoId', { tipoEgresoId: filters.tipoEgresoId });
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
    const egreso = await this.egresoRepo.findOne({
      where: { id, propietarioId: tenantId },
      relations: ['tipoEgreso', 'moneda'],
    });
    if (!egreso) throw new NotFoundException('Egreso no encontrado');
    return egreso;
  }

  async create(tenantId: number, dto: CreateEgresoDto) {
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

    const egreso = this.egresoRepo.create({
      fecha: dto.fecha as any,
      tipoEgresoId: dto.tipoEgresoId,
      observacion: dto.observacion || undefined,
      importe: dto.importe,
      monedaId: dto.monedaId,
      cajaDiariaId: cajaDiaria.id,
      propietarioId: tenantId,
      fechaHora: new Date(),
      movimientoRecurrenteId: dto.movimientoRecurrenteId || undefined,
    });

    return this.egresoRepo.save(egreso);
  }

  async update(tenantId: number, id: number, dto: UpdateEgresoDto) {
    const egreso = await this.findOne(tenantId, id);
    if (dto.fecha) egreso.fecha = dto.fecha as any;
    if (dto.tipoEgresoId) egreso.tipoEgresoId = dto.tipoEgresoId;
    if (dto.observacion !== undefined) egreso.observacion = dto.observacion;
    if (dto.monedaId) egreso.monedaId = dto.monedaId;
    if (dto.importe) egreso.importe = dto.importe;
    return this.egresoRepo.save(egreso);
  }

  async remove(tenantId: number, id: number) {
    const egreso = await this.findOne(tenantId, id);
    await this.egresoRepo.remove(egreso);
    return { deleted: true };
  }
}
