import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoIngreso } from '../../entities/tipoingreso.entity';
import { TipoEgreso } from '../../entities/tipoegreso.entity';
import { Moneda } from '../../entities/moneda.entity';

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(TipoIngreso)
    private tipoIngresoRepo: Repository<TipoIngreso>,
    @InjectRepository(TipoEgreso)
    private tipoEgresoRepo: Repository<TipoEgreso>,
    @InjectRepository(Moneda)
    private monedaRepo: Repository<Moneda>,
  ) {}

  async findTiposIngreso(tenantId: number, includeInactive = false) {
    const qb = this.tipoIngresoRepo
      .createQueryBuilder('ti')
      .where('ti.propietarioId = :tenantId', { tenantId })
      .andWhere('(ti.esTransferencia = false OR ti.esTransferencia IS NULL)')
      .andWhere('(ti.esCambio = false OR ti.esCambio IS NULL)')
      .orderBy('ti.nombre', 'ASC');

    if (!includeInactive) {
      qb.andWhere('ti.activo = true');
    }

    return qb.getMany();
  }

  async createTipoIngreso(tenantId: number, nombre: string) {
    const tipo = this.tipoIngresoRepo.create({
      nombre,
      activo: true,
      propietarioId: tenantId,
      esTransferencia: false,
      esCambio: false,
    });
    return this.tipoIngresoRepo.save(tipo);
  }

  async updateTipoIngreso(id: number, nombre: string, activo?: boolean) {
    const tipo = await this.tipoIngresoRepo.findOne({ where: { id } });
    if (!tipo) throw new NotFoundException('Tipo de ingreso no encontrado');
    if (tipo.esTransferencia || tipo.esCambio) {
      throw new NotFoundException('Tipo de ingreso no encontrado');
    }
    if (nombre !== undefined) tipo.nombre = nombre;
    if (activo !== undefined) tipo.activo = activo;
    return this.tipoIngresoRepo.save(tipo);
  }

  async deleteTipoIngreso(id: number) {
    const tipo = await this.tipoIngresoRepo.findOne({ where: { id } });
    if (!tipo) throw new NotFoundException('Tipo de ingreso no encontrado');
    if (tipo.esTransferencia || tipo.esCambio) {
      throw new NotFoundException('Tipo de ingreso no encontrado');
    }
    tipo.activo = false;
    return this.tipoIngresoRepo.save(tipo);
  }

  async findTiposEgreso(tenantId: number, includeInactive = false) {
    const qb = this.tipoEgresoRepo
      .createQueryBuilder('te')
      .where('te.propietarioId = :tenantId', { tenantId })
      .andWhere('(te.esTransferencia = false OR te.esTransferencia IS NULL)')
      .andWhere('(te.esCambio = false OR te.esCambio IS NULL)')
      .orderBy('te.nombre', 'ASC');

    if (!includeInactive) {
      qb.andWhere('te.activo = true');
    }

    return qb.getMany();
  }

  async createTipoEgreso(tenantId: number, nombre: string) {
    const tipo = this.tipoEgresoRepo.create({
      nombre,
      activo: true,
      propietarioId: tenantId,
      esTransferencia: false,
      esCambio: false,
    });
    return this.tipoEgresoRepo.save(tipo);
  }

  async updateTipoEgreso(id: number, nombre: string, activo?: boolean) {
    const tipo = await this.tipoEgresoRepo.findOne({ where: { id } });
    if (!tipo) throw new NotFoundException('Tipo de egreso no encontrado');
    if (tipo.esTransferencia || tipo.esCambio) {
      throw new NotFoundException('Tipo de egreso no encontrado');
    }
    if (nombre !== undefined) tipo.nombre = nombre;
    if (activo !== undefined) tipo.activo = activo;
    return this.tipoEgresoRepo.save(tipo);
  }

  async deleteTipoEgreso(id: number) {
    const tipo = await this.tipoEgresoRepo.findOne({ where: { id } });
    if (!tipo) throw new NotFoundException('Tipo de egreso no encontrado');
    if (tipo.esTransferencia || tipo.esCambio) {
      throw new NotFoundException('Tipo de egreso no encontrado');
    }
    tipo.activo = false;
    return this.tipoEgresoRepo.save(tipo);
  }

  async findMonedas() {
    return this.monedaRepo.find();
  }
}
