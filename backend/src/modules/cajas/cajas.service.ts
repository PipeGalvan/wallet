import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Caja } from '../../entities/caja.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { Ingreso } from '../../entities/ingreso.entity';
import { Egreso } from '../../entities/egreso.entity';
import { Moneda } from '../../entities/moneda.entity';
import { CreateCajaDto } from './dto/create-caja.dto';
import { UpdateCajaDto } from './dto/update-caja.dto';

@Injectable()
export class CajasService {
  constructor(
    @InjectRepository(Caja)
    private cajaRepo: Repository<Caja>,
    @InjectRepository(CajaDiaria)
    private cajaDiariaRepo: Repository<CajaDiaria>,
    @InjectRepository(Ingreso)
    private ingresoRepo: Repository<Ingreso>,
    @InjectRepository(Egreso)
    private egresoRepo: Repository<Egreso>,
    @InjectRepository(Moneda)
    private monedaRepo: Repository<Moneda>,
  ) {}

  async findAll(tenantId: number, activoOnly = false) {
    const where: any = { propietarioId: tenantId };
    if (activoOnly) where.activo = true;
    const cajas = await this.cajaRepo.find({
      where,
      order: { id: 'ASC' },
    });

    const cajasConSaldo = await Promise.all(
      cajas.map(async (caja) => {
        const saldos = await this.calcularSaldos(caja.id);
        return { ...caja, saldos };
      }),
    );

    return cajasConSaldo;
  }

  async findOne(tenantId: number, id: number) {
    const caja = await this.cajaRepo.findOne({
      where: { id, propietarioId: tenantId },
    });
    if (!caja) throw new NotFoundException('Caja no encontrada');

    const saldos = await this.calcularSaldos(id);
    return { ...caja, saldos };
  }

  async create(tenantId: number, dto: CreateCajaDto) {
    const caja = this.cajaRepo.create({
      nombre: dto.nombre,
      fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
      activo: true,
      propietarioId: tenantId,
      totalizar: dto.totalizar ?? true,
    });
    const saved = await this.cajaRepo.save(caja);

    const cajaDiaria = this.cajaDiariaRepo.create({
      cajaId: saved.id,
      fechaApertura: new Date(),
    });
    await this.cajaDiariaRepo.save(cajaDiaria);

    return saved;
  }

  async update(tenantId: number, id: number, dto: UpdateCajaDto) {
    const caja = await this.findOne(tenantId, id);
    Object.assign(caja, dto);
    return this.cajaRepo.save(caja);
  }

  async remove(tenantId: number, id: number) {
    const caja = await this.findOne(tenantId, id);
    caja.activo = false;
    return this.cajaRepo.save(caja);
  }

  async getMovimientos(tenantId: number, cajaId: number, page = 1, limit = 20) {
    const caja = await this.findOne(tenantId, cajaId);
    const cajaDiaria = await this.cajaDiariaRepo.find({
      where: { cajaId: caja.id },
      select: ['id'],
    });
    const cdIds = cajaDiaria.map((cd) => cd.id);

    if (cdIds.length === 0) {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    const [ingresos, egresos] = await Promise.all([
      this.ingresoRepo.find({
        where: cdIds.map((id) => ({ cajaDiariaId: id, propietarioId: tenantId })),
        relations: ['tipoIngreso', 'moneda', 'cliente'],
        order: { fechaHora: 'DESC' },
      }),
      this.egresoRepo.find({
        where: cdIds.map((id) => ({ cajaDiariaId: id, propietarioId: tenantId })),
        relations: ['tipoEgreso', 'moneda'],
        order: { fechaHora: 'DESC' },
      }),
    ]);

    const movimientos = [
      ...ingresos.map((i) => ({
        id: i.id,
        tipo: 'ingreso' as const,
        fecha: i.fecha,
        fechaHora: i.fechaHora,
        concepto: i.tipoIngreso?.nombre || '',
        observacion: i.observacion,
        importe: Number(i.importe),
        moneda: i.moneda?.nombre || '',
        cliente: i.cliente?.nombre,
      })),
      ...egresos.map((e) => ({
        id: e.id,
        tipo: 'egreso' as const,
        fecha: e.fecha,
        fechaHora: e.fechaHora,
        concepto: e.tipoEgreso?.nombre || '',
        observacion: e.observacion,
        importe: -Number(e.importe),
        moneda: e.moneda?.nombre || '',
        cliente: null,
      })),
    ].sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

    const total = movimientos.length;
    const start = (page - 1) * limit;
    const data = movimientos.slice(start, start + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async calcularSaldos(cajaId: number) {
    const cajaDiaria = await this.cajaDiariaRepo.find({
      where: { cajaId },
      select: ['id'],
    });
    const cdIds = cajaDiaria.map((cd) => cd.id);

    if (cdIds.length === 0) return [];

    const monedas = await this.monedaRepo.find();

    const saldos = await Promise.all(
      monedas.map(async (moneda) => {
        const ingresoTotal = await this.ingresoRepo
          .createQueryBuilder('i')
          .select('COALESCE(SUM(i.IngresoImporte), 0)', 'total')
          .where('i.CajaDiariaId IN (:...cdIds)', { cdIds })
          .andWhere('i.MonedaId = :monedaId', { monedaId: moneda.id })
          .getRawOne();

        const egresoTotal = await this.egresoRepo
          .createQueryBuilder('e')
          .select('COALESCE(SUM(e.EgresoImporte), 0)', 'total')
          .where('e.CajaDiariaId IN (:...cdIds)', { cdIds })
          .andWhere('e.MonedaId = :monedaId', { monedaId: moneda.id })
          .getRawOne();

        const saldo = Number(ingresoTotal?.total || 0) - Number(egresoTotal?.total || 0);

        return {
          monedaId: moneda.id,
          moneda: moneda.nombre,
          saldo,
        };
      }),
    );

    return saldos;
  }
}
