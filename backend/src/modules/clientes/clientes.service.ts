import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../../entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {}

  async findAll(tenantId: number, includeInactive = false) {
    const where: any = { propietarioId: tenantId };
    if (!includeInactive) where.activo = true;
    return this.clienteRepo.find({
      where,
      order: { nombre: 'ASC' },
    });
  }

  async findOne(tenantId: number, id: number) {
    const cliente = await this.clienteRepo.findOne({
      where: { id, propietarioId: tenantId },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async create(tenantId: number, dto: CreateClienteDto) {
    const cliente = this.clienteRepo.create({
      nombre: dto.nombre,
      observaciones: dto.observaciones || undefined,
      propietarioId: tenantId,
      activo: true,
    });
    return this.clienteRepo.save(cliente);
  }

  async update(tenantId: number, id: number, dto: UpdateClienteDto) {
    const cliente = await this.findOne(tenantId, id);
    if (dto.nombre !== undefined) cliente.nombre = dto.nombre;
    if (dto.observaciones !== undefined) cliente.observaciones = dto.observaciones;
    if (dto.activo !== undefined) cliente.activo = dto.activo;
    return this.clienteRepo.save(cliente);
  }

  async remove(tenantId: number, id: number) {
    const cliente = await this.findOne(tenantId, id);
    cliente.activo = false;
    return this.clienteRepo.save(cliente);
  }
}
