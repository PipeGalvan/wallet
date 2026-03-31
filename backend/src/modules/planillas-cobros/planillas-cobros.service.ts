import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PlanillaCobros } from '../../entities/planillacobros.entity';
import { PlanillaCobrosDetalle } from '../../entities/planillacobrosdetalle.entity';
import { Ingreso } from '../../entities/ingreso.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { CreatePlanillaCobroDto, CreatePlanillaCobroItemDto, CobrarPlanillaItemDto } from './dto/create-planilla-cobro.dto';

@Injectable()
export class PlanillasCobrosService {
  constructor(
    @InjectRepository(PlanillaCobros)
    private planillaRepo: Repository<PlanillaCobros>,
    @InjectRepository(PlanillaCobrosDetalle)
    private detalleRepo: Repository<PlanillaCobrosDetalle>,
    @InjectRepository(Ingreso)
    private ingresoRepo: Repository<Ingreso>,
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
      relations: ['detalles', 'detalles.tipoIngreso', 'detalles.moneda', 'detalles.cliente'],
    });
    if (!planilla) throw new NotFoundException('Planilla no encontrada');
    return planilla;
  }

  async create(tenantId: number, dto: CreatePlanillaCobroDto) {
    const planilla = this.planillaRepo.create({
      mes: dto.mes,
      anio: dto.anio,
      nroDet: 0,
      propietarioId: tenantId,
    });
    return this.planillaRepo.save(planilla);
  }

  async addItem(tenantId: number, planillaId: number, dto: CreatePlanillaCobroItemDto) {
    const planilla = await this.findOne(tenantId, planillaId);
    const detalleId = (planilla.nroDet || 0) + 1;

    const detalle = this.detalleRepo.create({
      planillaId: planilla.id,
      detalleId,
      tipoIngresoId: dto.tipoIngresoId,
      clienteId: dto.clienteId || undefined,
      importe: dto.importe,
      saldo: dto.importe,
      monedaId: dto.monedaId,
      pagado: false,
    });

    planilla.nroDet = detalleId;
    await this.planillaRepo.save(planilla);
    return this.detalleRepo.save(detalle);
  }

  async cobrarItem(tenantId: number, planillaId: number, detalleId: number, dto: CobrarPlanillaItemDto) {
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

      const ingreso = manager.create(Ingreso, {
        fecha: new Date(),
        fechaHora: new Date(),
        tipoIngresoId: detalle.tipoIngresoId,
        observacion: `Planilla cobros ${planilla.mes}/${planilla.anio}`,
        importe: detalle.importe,
        cajaDiariaId: cajaDiaria.id,
        monedaId: detalle.monedaId,
        clienteId: detalle.clienteId,
        propietarioId: tenantId,
      });
      await manager.save(ingreso);

      detalle.pagado = true;
      detalle.saldo = 0;
      await manager.save(detalle);

      return { detalle, ingreso };
    });
  }
}
