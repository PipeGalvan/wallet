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
import { EgresosService } from './egresos.service';
import { CreateEgresoDto } from './dto/create-egreso.dto';
import { UpdateEgresoDto } from './dto/update-egreso.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('egresos')
export class EgresosController {
  constructor(private egresosService: EgresosService) {}

  @Get()
  findAll(
    @TenantId() tenantId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('monedaId') monedaId?: string,
    @Query('tipoEgresoId') tipoEgresoId?: string,
  ) {
    return this.egresosService.findAll(tenantId, parseInt(page || '1'), parseInt(limit || '20'), {
      fechaDesde,
      fechaHasta,
      monedaId: monedaId ? parseInt(monedaId) : undefined,
      tipoEgresoId: tipoEgresoId ? parseInt(tipoEgresoId) : undefined,
    });
  }

  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.egresosService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateEgresoDto) {
    return this.egresosService.create(tenantId, dto);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEgresoDto,
  ) {
    return this.egresosService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.egresosService.remove(tenantId, id);
  }
}
