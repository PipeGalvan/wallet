import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingreso } from '../../entities/ingreso.entity';
import { Egreso } from '../../entities/egreso.entity';
import { Caja } from '../../entities/caja.entity';
import { Factura } from '../../entities/factura.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Ingreso)
    private ingresoRepo: Repository<Ingreso>,
    @InjectRepository(Egreso)
    private egresoRepo: Repository<Egreso>,
    @InjectRepository(Caja)
    private cajaRepo: Repository<Caja>,
    @InjectRepository(Factura)
    private facturaRepo: Repository<Factura>,
  ) {}

  async getResumen(tenantId: number, fechaDesde?: string, fechaHasta?: string) {
    const ingresoQuery = this.ingresoRepo
      .createQueryBuilder('i')
      .leftJoin('i.tipoIngreso', 'ti')
      .select('i.MonedaId', 'monedaId')
      .addSelect('COALESCE(SUM(i.IngresoImporte), 0)', 'total')
      .where('i.IngresoPropietarioId = :tenantId', { tenantId })
      .andWhere('(ti.TipoIngresoTransferencia IS NULL OR ti.TipoIngresoTransferencia = 0)')
      .andWhere('(ti.TipoIngresoCambio IS NULL OR ti.TipoIngresoCambio = 0)');

    const egresoQuery = this.egresoRepo
      .createQueryBuilder('e')
      .leftJoin('e.tipoEgreso', 'te')
      .select('e.MonedaId', 'monedaId')
      .addSelect('COALESCE(SUM(e.EgresoImporte), 0)', 'total')
      .where('e.EgresoPropietarioId = :tenantId', { tenantId })
      .andWhere('(te.TipoEgresoTransferencia IS NULL OR te.TipoEgresoTransferencia = 0)')
      .andWhere('(te.TipoEgresoCambio IS NULL OR te.TipoEgresoCambio = 0)');

    if (fechaDesde) {
      ingresoQuery.andWhere('i.IngresoFecha >= :fechaDesde', { fechaDesde });
      egresoQuery.andWhere('e.EgresoFecha >= :fechaDesde', { fechaDesde });
    }
    if (fechaHasta) {
      ingresoQuery.andWhere('i.IngresoFecha <= :fechaHasta', { fechaHasta });
      egresoQuery.andWhere('e.EgresoFecha <= :fechaHasta', { fechaHasta });
    }

    const ingresos = await ingresoQuery.groupBy('i.MonedaId').getRawMany();
    const egresos = await egresoQuery.groupBy('e.MonedaId').getRawMany();

    return { ingresos, egresos };
  }

  async getSaldos(tenantId: number) {
    const cajas = await this.cajaRepo.find({
      where: { propietarioId: tenantId, activo: true },
    });

    const saldos = await Promise.all(
      cajas.map(async (caja) => {
        const ingresos = await this.ingresoRepo
          .createQueryBuilder('i')
          .leftJoin('i.cajaDiaria', 'cd')
          .select('i.MonedaId', 'monedaId')
          .addSelect('COALESCE(SUM(i.IngresoImporte), 0)', 'total')
          .where('cd.CajaId = :cajaId', { cajaId: caja.id })
          .andWhere('i.IngresoPropietarioId = :tenantId', { tenantId })
          .groupBy('i.MonedaId')
          .getRawMany();

        const egresos = await this.egresoRepo
          .createQueryBuilder('e')
          .leftJoin('e.cajaDiaria', 'cd')
          .select('e.MonedaId', 'monedaId')
          .addSelect('COALESCE(SUM(e.EgresoImporte), 0)', 'total')
          .where('cd.CajaId = :cajaId', { cajaId: caja.id })
          .andWhere('e.EgresoPropietarioId = :tenantId', { tenantId })
          .groupBy('e.MonedaId')
          .getRawMany();

        return {
          caja: { id: caja.id, nombre: caja.nombre },
          saldos: { ingresos, egresos },
        };
      }),
    );

    return saldos;
  }

  async getFacturasPendientes(tenantId: number) {
    return this.facturaRepo.find({
      where: { propietarioId: tenantId },
      relations: ['cliente', 'moneda'],
      order: { id: 'DESC' },
    });
  }

  async getEvolucionMensual(tenantId: number, meses: number = 6) {
    const clampedMeses = Math.min(Math.max(meses, 1), 12);

    const ingresoQuery = this.ingresoRepo
      .createQueryBuilder('i')
      .leftJoin('i.tipoIngreso', 'ti')
      .select("DATE_FORMAT(i.IngresoFecha, '%Y-%m')", 'mes')
      .addSelect('COALESCE(SUM(i.IngresoImporte), 0)', 'total')
      .where('i.IngresoPropietarioId = :tenantId', { tenantId })
      .andWhere('i.MonedaId = 1')
      .andWhere("i.IngresoFecha >= DATE_SUB(CURDATE(), INTERVAL :meses MONTH)", { meses: clampedMeses })
      .andWhere('(ti.TipoIngresoTransferencia IS NULL OR ti.TipoIngresoTransferencia = 0)')
      .andWhere('(ti.TipoIngresoCambio IS NULL OR ti.TipoIngresoCambio = 0)')
      .groupBy("DATE_FORMAT(i.IngresoFecha, '%Y-%m')");

    const egresoQuery = this.egresoRepo
      .createQueryBuilder('e')
      .leftJoin('e.tipoEgreso', 'te')
      .select("DATE_FORMAT(e.EgresoFecha, '%Y-%m')", 'mes')
      .addSelect('COALESCE(SUM(e.EgresoImporte), 0)', 'total')
      .where('e.EgresoPropietarioId = :tenantId', { tenantId })
      .andWhere('e.MonedaId = 1')
      .andWhere("e.EgresoFecha >= DATE_SUB(CURDATE(), INTERVAL :meses MONTH)", { meses: clampedMeses })
      .andWhere('(te.TipoEgresoTransferencia IS NULL OR te.TipoEgresoTransferencia = 0)')
      .andWhere('(te.TipoEgresoCambio IS NULL OR te.TipoEgresoCambio = 0)')
      .groupBy("DATE_FORMAT(e.EgresoFecha, '%Y-%m')");

    const [ingresos, egresos] = await Promise.all([
      ingresoQuery.getRawMany(),
      egresoQuery.getRawMany(),
    ]);

    // Generate full month range
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const months: { mes: string; label: string }[] = [];
    const now = new Date();
    for (let i = clampedMeses - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      months.push({ mes, label });
    }

    // Build lookup maps from query results
    const ingresoMap = new Map(ingresos.map((r: any) => [r.mes, Number(r.total)]));
    const egresoMap = new Map(egresos.map((r: any) => [r.mes, Number(r.total)]));

    // Merge into final shape, filling gaps with zeros
    const result = months.map(({ mes, label }) => {
      const ing = ingresoMap.get(mes) || 0;
      const egr = egresoMap.get(mes) || 0;
      return {
        mes,
        label,
        monedaId: 1,
        ingresos: ing,
        egresos: egr,
        balance: ing - egr,
      };
    });

    return { meses: result };
  }

  async getAgrupadoPorTipo(tenantId: number, fechaDesde?: string, fechaHasta?: string) {
    const ingresoQuery = this.ingresoRepo
      .createQueryBuilder('i')
      .leftJoin('i.tipoIngreso', 'ti')
      .select('i.TipoIngresoId', 'tipoId')
      .addSelect('ti.TipoIngresoNombre', 'tipoNombre')
      .addSelect('i.MonedaId', 'monedaId')
      .addSelect('COALESCE(SUM(i.IngresoImporte), 0)', 'total')
      .addSelect('MAX(ti.TipoIngresoTransferencia)', 'esTransferencia')
      .addSelect('MAX(ti.TipoIngresoCambio)', 'esCambio')
      .where('i.IngresoPropietarioId = :tenantId', { tenantId });

    const egresoQuery = this.egresoRepo
      .createQueryBuilder('e')
      .leftJoin('e.tipoEgreso', 'te')
      .select('e.TipoEgresoId', 'tipoId')
      .addSelect('te.TipoEgresoNombre', 'tipoNombre')
      .addSelect('e.MonedaId', 'monedaId')
      .addSelect('COALESCE(SUM(e.EgresoImporte), 0)', 'total')
      .addSelect('MAX(te.TipoEgresoTransferencia)', 'esTransferencia')
      .addSelect('MAX(te.TipoEgresoCambio)', 'esCambio')
      .where('e.EgresoPropietarioId = :tenantId', { tenantId });

    if (fechaDesde) {
      ingresoQuery.andWhere('i.IngresoFecha >= :fechaDesde', { fechaDesde });
      egresoQuery.andWhere('e.EgresoFecha >= :fechaDesde', { fechaDesde });
    }
    if (fechaHasta) {
      ingresoQuery.andWhere('i.IngresoFecha <= :fechaHasta', { fechaHasta });
      egresoQuery.andWhere('e.EgresoFecha <= :fechaHasta', { fechaHasta });
    }

    const ingresos = await ingresoQuery
      .groupBy('i.TipoIngresoId')
      .addGroupBy('ti.TipoIngresoNombre')
      .addGroupBy('i.MonedaId')
      .getRawMany();

    const egresos = await egresoQuery
      .groupBy('e.TipoEgresoId')
      .addGroupBy('te.TipoEgresoNombre')
      .addGroupBy('e.MonedaId')
      .getRawMany();

    return { ingresos, egresos };
  }
}
