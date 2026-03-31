import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PlanillaGastos } from '../../entities/planillagastos.entity';
import { PlanillaGastosDetalle } from '../../entities/planillagastosdetalle.entity';
import { Egreso } from '../../entities/egreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { CreatePlanillaGastoDto, CreatePlanillaGastoItemDto, PagarPlanillaItemDto } from './dto/create-planilla-gasto.dto';

@Injectable()
export class PlanillasGastosService {
  constructor(
    @InjectRepository(PlanillaGastos)
    private planillaRepo: Repository<PlanillaGastos>,
    @InjectRepository(PlanillaGastosDetalle)
    private detalleRepo: Repository<PlanillaGastosDetalle>,
    @InjectRepository(Egreso)
    private egresoRepo: Repository<Egreso>,
    @InjectRepository(CajaDiaria)
    private cajaDiariaRepo: Repository<CajaDiaria>,
    private dataSource: DataSource,
  ) {}

  async findAll(tenantId: number) {
    return this.planillaRepo.find({
      where: { propietarioId: tenantId },
      order: { anio: 'DESC', mes: 'DESC' },
    });
  }

  async findOne(tenantId: number, id: number) {
    const planilla = await this.planillaRepo.findOne({
      where: { id, propietarioId: tenantId },
      relations: ['detalles', 'detalles.tipoEgreso', 'detalles.moneda'],
    });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    return planilla;
  }

  async create(tenantId: number, dto: CreatePlanillaGastoDto) {
    const planilla = this.planillaRepo.create({
      mes: dto.mes,
      anio: dto.anio,
      nroDet: 0,
      propietarioId: tenantId,
    });
    return this.planillaRepo.save(planilla);
  }

  async addItem(tenantId: number, planillaId: number, dto: CreatePlanillaGastoItemDto) {
    const planilla = await this.findOne(tenantId, planillaId);
    const detalleId = (planilla.nroDet || 0) + 1;

    const detalle = this.detalleRepo.create({
      planillaId: planilla.id,
      detalleId,
      tipoEgresoId: dto.tipoEgresoId,
      importe: dto.importe,
      saldo: dto.importe,
      monedaId: dto.monedaId,
      pagado: false,
    });

    planilla.nroDet = detalleId;
    await this.planillaRepo.save(planilla);
    return this.detalleRepo.save(detalle);
  }

  async pagarItem(tenantId: number, planillaId: number, detalleId: number, dto: PagarPlanillaItemDto) {
    const planilla = await this.findOne(tenantId, planillaId);
    const detalle = planilla.detalles.find((d) => d.detalleId === detalleId);
    if (!detalle) throw new NotFoundException('Item no encontrado');

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
        tipoEgresoId: detalle.tipoEgresoId,
        observacion: `Planilla gastos ${planilla.mes}/${planilla.anio}`,
        importe: detalle.importe,
        cajaDiariaId: cajaDiaria.id,
        monedaId: detalle.monedaId,
        propietarioId: tenantId,
      });
      await manager.save(egreso);

      detalle.pagado = true;
      detalle.saldo = 0;
      await manager.save(detalle);

      return { detalle, egreso };
    });
  }
}
