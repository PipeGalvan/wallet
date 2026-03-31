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
import { IngresosService } from './ingresos.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('ingresos')
export class IngresosController {
  constructor(private ingresosService: IngresosService) {}

  @Get()
  findAll(
    @TenantId() tenantId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('monedaId') monedaId?: string,
    @Query('tipoIngresoId') tipoIngresoId?: string,
  ) {
    return this.ingresosService.findAll(tenantId, parseInt(page || '1'), parseInt(limit || '20'), {
      fechaDesde,
      fechaHasta,
      monedaId: monedaId ? parseInt(monedaId) : undefined,
      tipoIngresoId: tipoIngresoId ? parseInt(tipoIngresoId) : undefined,
    });
  }

  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.ingresosService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateIngresoDto) {
    return this.ingresosService.create(tenantId, dto);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIngresoDto,
  ) {
    return this.ingresosService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.ingresosService.remove(tenantId, id);
  }
}
