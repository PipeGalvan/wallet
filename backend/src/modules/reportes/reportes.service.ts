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
      .select('i.MonedaId', 'monedaId')
      .addSelect('COALESCE(SUM(i.IngresoImporte), 0)', 'total')
      .where('i.IngresoPropietarioId = :tenantId', { tenantId });

    const egresoQuery = this.egresoRepo
      .createQueryBuilder('e')
      .select('e.MonedaId', 'monedaId')
      .addSelect('COALESCE(SUM(e.EgresoImporte), 0)', 'total')
      .where('e.EgresoPropietarioId = :tenantId', { tenantId });

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
}
