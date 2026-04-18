import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MovimientosRecurrentesService } from './movimientos-recurrentes.service';
import { CreateMovimientoRecurrenteDto } from './dto/create-movimiento-recurrente.dto';
import { UpdateMovimientoRecurrenteDto } from './dto/update-movimiento-recurrente.dto';
import { ConfirmMovimientoRecurrenteDto } from './dto/confirm-movimiento-recurrente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('movimientos-recurrentes')
export class MovimientosRecurrentesController {
  constructor(private mrService: MovimientosRecurrentesService) {}

  @Get()
  findAll(
    @TenantId() tenantId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tipo') tipo?: string,
    @Query('activo') activo?: string,
  ) {
    return this.mrService.findAll(tenantId, parseInt(page || '1'), parseInt(limit || '20'), {
      tipo,
      activo,
    });
  }

  // IMPORTANT: static routes BEFORE :id routes to avoid param conflict
  @Get('pendientes')
  getPendientes(@TenantId() tenantId: number) {
    return this.mrService.getPendientes(tenantId);
  }

  // IMPORTANT: static routes BEFORE :id routes to avoid param conflict
  @Post('confirmar-lote')
  confirmarLote(
    @TenantId() tenantId: number,
    @Body() body: { items: Array<{ id: number; importe: number; observacion?: string; fecha?: string }> },
  ) {
    return this.mrService.confirmarLote(tenantId, body.items);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.mrService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateMovimientoRecurrenteDto) {
    return this.mrService.create(tenantId, dto);
  }

  @Post(':id/confirmar')
  confirmar(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmMovimientoRecurrenteDto,
  ) {
    return this.mrService.confirmar(tenantId, id, dto);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMovimientoRecurrenteDto,
  ) {
    return this.mrService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.mrService.remove(tenantId, id);
  }

  @Put(':id/pausar')
  pause(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.mrService.pause(tenantId, id);
  }

  @Put(':id/reanudar')
  resume(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.mrService.resume(tenantId, id);
  }
}
