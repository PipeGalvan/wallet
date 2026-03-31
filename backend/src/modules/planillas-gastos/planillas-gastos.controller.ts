import {
  Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { PlanillasGastosService } from './planillas-gastos.service';
import { CreatePlanillaGastoDto, CreatePlanillaGastoItemDto, PagarPlanillaItemDto } from './dto/create-planilla-gasto.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('planillas-gastos')
export class PlanillasGastosController {
  constructor(private planillasService: PlanillasGastosService) {}

  @Get()
  findAll(@TenantId() tenantId: number) {
    return this.planillasService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.planillasService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreatePlanillaGastoDto) {
    return this.planillasService.create(tenantId, dto);
  }

  @Post(':id/items')
  addItem(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePlanillaGastoItemDto,
  ) {
    return this.planillasService.addItem(tenantId, id, dto);
  }

  @Post(':id/items/:detalleId/pagar')
  pagarItem(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('detalleId', ParseIntPipe) detalleId: number,
    @Body() dto: PagarPlanillaItemDto,
  ) {
    return this.planillasService.pagarItem(tenantId, id, detalleId, dto);
  }
}
