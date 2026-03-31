import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transferencia } from '../../entities/transferencia.entity';
import { CajaDiaria } from '../../entities/cajadiaria.entity';
import { Ingreso } from '../../entities/ingreso.entity';
import { Egreso } from '../../entities/egreso.entity';
import { CreateTransferenciaDto } from './dto/create-transferencia.dto';

@Injectable()
export class TransferenciasService {
  constructor(
    @InjectRepository(Transferencia)
    private transferenciaRepo: Repository<Transferencia>,
    @InjectRepository(CajaDiaria)
    private cajaDiariaRepo: Repository<CajaDiaria>,
    private dataSource: DataSource,
  ) {}

  async findAll(tenantId: number, page = 1, limit = 20) {
    const [data, total] = await this.transferenciaRepo.findAndCount({
      where: { propietarioId: tenantId },
      relations: ['origenCajaDiaria', 'destinoCajaDiaria', 'moneda'],
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: number, id: number) {
    const transferencia = await this.transferenciaRepo.findOne({
      where: { id, propietarioId: tenantId },
      relations: ['origenCajaDiaria', 'destinoCajaDiaria', 'moneda'],
    });
    if (!transferencia) throw new NotFoundException('Transferencia no encontrada');
    return transferencia;
  }

  async create(tenantId: number, dto: CreateTransferenciaDto) {
    if (dto.cajaOrigenId === dto.cajaDestinoId) {
      throw new BadRequestException('La caja origen y destino deben ser diferentes');
    }

    return this.dataSource.transaction(async (manager) => {
      const origenCD = await this.getOrCreateCajaDiaria(manager, dto.cajaOrigenId);
      const destinoCD = await this.getOrCreateCajaDiaria(manager, dto.cajaDestinoId);

      const egreso = manager.create(Egreso, {
        fecha: new Date(dto.fecha),
        fechaHora: new Date(),
        tipoEgresoId: 24,
        observacion: 'TRANSFERENCIA',
        importe: dto.importe,
        cajaDiariaId: origenCD.id,
        monedaId: dto.monedaId,
        propietarioId: tenantId,
      });
      await manager.save(egreso);

      const ingreso = manager.create(Ingreso, {
        fecha: new Date(dto.fecha),
        fechaHora: new Date(),
        tipoIngresoId: 5,
        observacion: 'TRANSFERENCIA',
        importe: dto.importe,
        cajaDiariaId: destinoCD.id,
        monedaId: dto.monedaId,
        propietarioId: tenantId,
      });
      await manager.save(ingreso);

      const transferencia = manager.create(Transferencia, {
        fecha: new Date(dto.fecha),
        origenCajaDiariaId: origenCD.id,
        destinoCajaDiariaId: destinoCD.id,
        monedaId: dto.monedaId,
        importe: dto.importe,
        propietarioId: tenantId,
      });
      return manager.save(transferencia);
    });
  }

  private async getOrCreateCajaDiaria(manager: any, cajaId: number): Promise<CajaDiaria> {
    let cd = await manager.findOne(CajaDiaria, {
      where: { cajaId },
      order: { id: 'DESC' },
    });

    if (!cd) {
      cd = manager.create(CajaDiaria, {
        cajaId,
        fechaApertura: new Date(),
      });
      cd = await manager.save(cd);
    }

    return cd;
  }
}
