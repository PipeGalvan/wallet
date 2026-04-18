import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovimientoRecurrente } from '../../entities/movimientorecurrente.entity';
import { CreateMovimientoRecurrenteDto } from './dto/create-movimiento-recurrente.dto';
import { UpdateMovimientoRecurrenteDto } from './dto/update-movimiento-recurrente.dto';
import { ConfirmMovimientoRecurrenteDto } from './dto/confirm-movimiento-recurrente.dto';
import { IngresosService } from '../ingresos/ingresos.service';
import { EgresosService } from '../egresos/egresos.service';

@Injectable()
export class MovimientosRecurrentesService {
  constructor(
    @InjectRepository(MovimientoRecurrente)
    private mrRepo: Repository<MovimientoRecurrente>,
    private ingresosService: IngresosService,
    private egresosService: EgresosService,
  ) {}

  async findAll(tenantId: number, page = 1, limit = 20, filters?: any) {
    const query = this.mrRepo
      .createQueryBuilder('mr')
      .leftJoinAndSelect('mr.caja', 'caja')
      .leftJoinAndSelect('mr.moneda', 'moneda')
      .leftJoinAndSelect('mr.cliente', 'cliente')
      .where('mr.propietarioId = :tenantId', { tenantId })
      .orderBy('mr.createdAt', 'DESC');

    if (filters?.tipo) {
      query.andWhere('mr.tipo = :tipo', { tipo: filters.tipo });
    }
    if (filters?.activo !== undefined && filters?.activo !== null && filters?.activo !== '') {
      query.andWhere('mr.activo = :activo', { activo: filters.activo === 'true' });
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
    const template = await this.mrRepo.findOne({
      where: { id, propietarioId: tenantId },
      relations: ['caja', 'moneda', 'cliente', 'propietario'],
    });
    if (!template) throw new NotFoundException('Movimiento recurrente no encontrado');
    return template;
  }

  async create(tenantId: number, dto: CreateMovimientoRecurrenteDto) {
    const fechaInicio = new Date(dto.fechaInicio);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let fechaProxima: Date;
    if (fechaInicio >= today) {
      fechaProxima = fechaInicio;
    } else {
      fechaProxima = this.calcularProximaFecha(dto.diaDelMes, today);
    }

    const template = this.mrRepo.create();
    template.tipo = dto.tipo;
    template.tipoMovimientoId = dto.tipoMovimientoId;
    if (dto.clienteId) template.clienteId = dto.clienteId;
    template.cajaId = dto.cajaId;
    template.monedaId = dto.monedaId;
    template.montoEstimado = dto.montoEstimado;
    if (dto.observacion) template.observacion = dto.observacion;
    template.frecuencia = dto.frecuencia || 'mensual';
    template.diaDelMes = dto.diaDelMes;
    if (dto.cantidadOcurrencias) template.ocurrenciasTotales = dto.cantidadOcurrencias;
    template.ocurrenciasConfirmadas = 0;
    template.activo = true;
    template.pausado = false;
    template.propietarioId = tenantId;
    template.fechaInicio = fechaInicio;
    template.fechaProxima = fechaProxima;

    return this.mrRepo.save(template);
  }

  async update(tenantId: number, id: number, dto: UpdateMovimientoRecurrenteDto) {
    const template = await this.findOne(tenantId, id);

    if (dto.tipo !== undefined) template.tipo = dto.tipo;
    if (dto.tipoMovimientoId !== undefined) template.tipoMovimientoId = dto.tipoMovimientoId;
    if (dto.clienteId !== undefined) template.clienteId = dto.clienteId;
    if (dto.monedaId !== undefined) template.monedaId = dto.monedaId;
    if (dto.montoEstimado !== undefined) template.montoEstimado = dto.montoEstimado;
    if (dto.cajaId !== undefined) template.cajaId = dto.cajaId;
    if (dto.observacion !== undefined) template.observacion = dto.observacion;
    if (dto.frecuencia !== undefined) template.frecuencia = dto.frecuencia;
    if (dto.fechaInicio !== undefined) template.fechaInicio = new Date(dto.fechaInicio);
    if (dto.cantidadOcurrencias !== undefined) template.ocurrenciasTotales = dto.cantidadOcurrencias;

    // Recalculate fechaProxima if relevant fields changed
    if (dto.diaDelMes !== undefined || dto.fechaInicio !== undefined) {
      template.diaDelMes = dto.diaDelMes ?? template.diaDelMes;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      template.fechaProxima = this.calcularProximaFecha(template.diaDelMes, today);
    }

    return this.mrRepo.save(template);
  }

  async remove(tenantId: number, id: number) {
    const template = await this.findOne(tenantId, id);
    template.activo = false;
    return this.mrRepo.save(template);
  }

  async pause(tenantId: number, id: number) {
    const template = await this.findOne(tenantId, id);
    template.pausado = true;
    return this.mrRepo.save(template);
  }

  async resume(tenantId: number, id: number) {
    const template = await this.findOne(tenantId, id);
    template.pausado = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    template.fechaProxima = this.calcularProximaFecha(template.diaDelMes, today);
    return this.mrRepo.save(template);
  }

  /**
   * Returns templates that have a pending occurrence:
   * - activo = true, pausado = false
   * - fechaProxima <= today
   * - ocurrenciasTotales IS NULL OR confirmadas < totales
   */
  async getPendientes(tenantId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.mrRepo
      .createQueryBuilder('mr')
      .leftJoinAndSelect('mr.caja', 'caja')
      .leftJoinAndSelect('mr.moneda', 'moneda')
      .leftJoinAndSelect('mr.cliente', 'cliente')
      .where('mr.propietarioId = :tenantId', { tenantId })
      .andWhere('mr.activo = :activo', { activo: true })
      .andWhere('mr.pausado = :pausado', { pausado: false })
      .andWhere('mr.fechaProxima <= :today', { today })
      .andWhere(
        '(mr.ocurrenciasTotales IS NULL OR mr.ocurrenciasConfirmadas < mr.ocurrenciasTotales)',
      )
      .orderBy('mr.fechaProxima', 'ASC')
      .getMany();
  }

  /**
   * Confirm a single pending occurrence:
   * 1. Validate template (exists, active, pending)
   * 2. Create real Ingreso/Egreso via injected services
   * 3. Increment ocurrenciasConfirmadas, recalculate fechaProxima
   * 4. If exhausted, set activo=false and fechaProxima=null
   */
  async confirmar(tenantId: number, id: number, dto: ConfirmMovimientoRecurrenteDto) {
    const template = await this.findOne(tenantId, id);

    if (!template.activo) {
      throw new BadRequestException('El movimiento recurrente no está activo');
    }
    if (template.pausado) {
      throw new BadRequestException('El movimiento recurrente está pausado');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fechaProxima = template.fechaProxima ? new Date(template.fechaProxima) : null;
    if (fechaProxima) fechaProxima.setHours(0, 0, 0, 0);
    if (!fechaProxima || fechaProxima > today) {
      throw new BadRequestException('El movimiento recurrente no tiene ocurrencias pendientes');
    }

    const fecha = dto.fecha || today.toISOString().split('T')[0];
    let movement: any;

    if (template.tipo === 'EGRESO') {
      movement = await this.egresosService.create(tenantId, {
        fecha,
        tipoEgresoId: template.tipoMovimientoId,
        observacion: dto.observacion || template.observacion,
        importe: dto.importe,
        monedaId: template.monedaId,
        cajaId: template.cajaId,
        movimientoRecurrenteId: template.id,
      });
    } else {
      movement = await this.ingresosService.create(tenantId, {
        fecha,
        tipoIngresoId: template.tipoMovimientoId,
        clienteId: template.clienteId || undefined,
        observacion: dto.observacion || template.observacion,
        importe: dto.importe,
        monedaId: template.monedaId,
        cajaId: template.cajaId,
        movimientoRecurrenteId: template.id,
      });
    }

    template.ocurrenciasConfirmadas++;

    if (
      template.ocurrenciasTotales &&
      template.ocurrenciasConfirmadas >= template.ocurrenciasTotales
    ) {
      template.activo = false;
      (template as any).fechaProxima = null;
    } else {
      template.fechaProxima = this.calcularProximaFecha(template.diaDelMes, today);
    }

    const updatedTemplate = await this.mrRepo.save(template);

    return { movement, template: updatedTemplate };
  }

  /**
   * Batch confirmation: iterate items, confirm each individually.
   * Individual try/catch — partial success: if one fails, others still commit.
   */
  async confirmarLote(
    tenantId: number,
    items: Array<{ id: number; importe: number; observacion?: string; fecha?: string }>,
  ) {
    const results: Array<{
      id: number;
      success: boolean;
      movement?: any;
      template?: any;
      error?: string;
    }> = [];

    for (const item of items) {
      try {
        const result = await this.confirmar(tenantId, item.id, {
          importe: item.importe,
          observacion: item.observacion,
          fecha: item.fecha,
        });
        results.push({
          id: item.id,
          success: true,
          movement: result.movement,
          template: result.template,
        });
      } catch (error) {
        results.push({
          id: item.id,
          success: false,
          error: error.message || 'Error desconocido',
        });
      }
    }

    return results;
  }

  /**
   * Pure function: calculates the next date with the given diaDelMes
   * on or after the fromDate.
   *
   * - Clamps diaDelMes to daysInMonth if month has fewer days
   * - If fromDate's day < diaDelMes (and month hasn't passed), use current month
   * - Otherwise, use next month
   */
  calcularProximaFecha(diaDelMes: number, fromDate: Date): Date {
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();
    const day = fromDate.getDate();

    const daysInCurrentMonth = this.getDaysInMonth(year, month);
    const clampedDayCurrent = Math.min(diaDelMes, daysInCurrentMonth);

    // If the target day hasn't passed yet this month, use current month
    if (day < clampedDayCurrent) {
      return new Date(year, month, clampedDayCurrent);
    }

    // Otherwise, go to next month
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear = year + 1;
    }

    const daysInNextMonth = this.getDaysInMonth(nextYear, nextMonth);
    const clampedDayNext = Math.min(diaDelMes, daysInNextMonth);

    return new Date(nextYear, nextMonth, clampedDayNext);
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }
}
