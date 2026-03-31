import {
  Controller, Get, Post, Put, Body, Param, Query,
  ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { FacturasGastoService } from './facturas-gasto.service';
import { CreateFacturaGastoDto } from './dto/create-factura-gasto.dto';
import { PagarFacturaGastoDto } from './dto/pagar-factura-gasto.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('facturas-gasto')
export class FacturasGastoController {
  constructor(private facturasGastoService: FacturasGastoService) {}

  @Get()
  findAll(
    @TenantId() tenantId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.facturasGastoService.findAll(tenantId, parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.facturasGastoService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateFacturaGastoDto) {
    return this.facturasGastoService.create(tenantId, dto);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateFacturaGastoDto,
  ) {
    return this.facturasGastoService.update(tenantId, id, dto);
  }

  @Post(':id/pagar')
  pagar(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PagarFacturaGastoDto,
  ) {
    return this.facturasGastoService.pagar(tenantId, id, dto);
  }
}
