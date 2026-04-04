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
import { CajasService } from './cajas.service';
import { CreateCajaDto } from './dto/create-caja.dto';
import { UpdateCajaDto } from './dto/update-caja.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('cajas')
export class CajasController {
  constructor(private cajasService: CajasService) {}

  @Get()
  findAll(@TenantId() tenantId: number, @Query('activo') activ?: string) {
    return this.cajasService.findAll(tenantId, activ === 'true');
  }

  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.cajasService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateCajaDto) {
    return this.cajasService.create(tenantId, dto);
  }

  @Put(':id')
  update(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCajaDto,
  ) {
    return this.cajasService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.cajasService.remove(tenantId, id);
  }

  @Get(':id/movimientos')
  getMovimientos(
    @TenantId() tenantId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.cajasService.getMovimientos(
      tenantId,
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
