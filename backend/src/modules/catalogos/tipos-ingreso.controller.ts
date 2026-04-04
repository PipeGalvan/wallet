import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { CatalogosService } from './catalogos.service';
import { CreateTipoDto } from './dto/create-tipo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tipos-ingreso')
export class TiposIngresoController {
  constructor(private catalogosService: CatalogosService) {}

  @Get()
  findAll(@TenantId() tenantId: number, @Query('all') all?: string) {
    return this.catalogosService.findTiposIngreso(tenantId, all === 'true');
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateTipoDto) {
    return this.catalogosService.createTipoIngreso(tenantId, dto.nombre);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTipoDto,
  ) {
    return this.catalogosService.updateTipoIngreso(id, dto.nombre, dto.activo);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.deleteTipoIngreso(id);
  }
}
