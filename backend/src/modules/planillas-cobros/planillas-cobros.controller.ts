import {
  Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { PlanillasCobrosService } from './planillas-cobros.service';
import { CreatePlanillaCobroDto, CreatePlanillaCobroItemDto, CobrarPlanillaItemDto } from './dto/create-planilla-cobro.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('planillas-cobros')
export class PlanillasCobrosController {
  constructor(private planillasService: PlanillasCobrosService) {}

  @Get()
  findAll(@TenantId() tenantId: number) {
    return this.planillasService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.planillasService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreatePlanillaCobroDto) {
    return this.planillasService.create(tenantId, dto);
  }

  @Post(':id/items')
  addItem(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePlanillaCobroItemDto,
  ) {
    return this.planillasService.addItem(tenantId, id, dto);
  }

  @Post(':id/items/:detalleId/cobrar')
  cobrarItem(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('detalleId', ParseIntPipe) detalleId: number,
    @Body() dto: CobrarPlanillaItemDto,
  ) {
    return this.planillasService.cobrarItem(tenantId, id, detalleId, dto);
  }
}
