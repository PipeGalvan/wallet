import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private clientesService: ClientesService) {}

  @Get()
  findAll(@TenantId() tenantId: number, @Query('all') all?: string) {
    return this.clientesService.findAll(tenantId, all === 'true');
  }

  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateClienteDto) {
    return this.clientesService.create(tenantId, dto);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(tenantId, id);
  }
}
