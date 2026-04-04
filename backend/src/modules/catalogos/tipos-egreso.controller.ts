import {
  Controller, Get, Post, Put, Delete, Body, Param,
  ParseIntPipe, UseGuards, Query,
} from '@nestjs/common';
import { CatalogosService } from './catalogos.service';
import { CreateTipoDto } from './dto/create-tipo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('tipos-egreso')
export class TiposEgresoController {
  constructor(private catalogosService: CatalogosService) {}

  @Get()
  findAll(@TenantId() tenantId: number, @Query('all') all?: string) {
    return this.catalogosService.findTiposEgreso(tenantId, all === 'true');
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateTipoDto) {
    return this.catalogosService.createTipoEgreso(tenantId, dto.nombre);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTipoDto,
  ) {
    return this.catalogosService.updateTipoEgreso(id, dto.nombre, dto.activo);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.deleteTipoEgreso(id);
  }
}
