import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { CobrarFacturaDto } from './dto/cobrar-factura.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('facturas')
export class FacturasController {
  constructor(private facturasService: FacturasService) {}

  @Get()
  findAll(
    @TenantId() tenantId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.facturasService.findAll(tenantId, parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Get('pendientes')
  findPendientes(@TenantId() tenantId: number) {
    return this.facturasService.findPendientes(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.facturasService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateFacturaDto) {
    return this.facturasService.create(tenantId, dto);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateFacturaDto,
  ) {
    return this.facturasService.update(tenantId, id, dto);
  }

  @Post(':id/cobrar')
  cobrar(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CobrarFacturaDto,
  ) {
    return this.facturasService.cobrar(tenantId, id, dto);
  }
}
