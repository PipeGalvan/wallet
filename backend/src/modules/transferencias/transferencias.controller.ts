import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TransferenciasService } from './transferencias.service';
import { CreateTransferenciaDto } from './dto/create-transferencia.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('transferencias')
export class TransferenciasController {
  constructor(private transferenciasService: TransferenciasService) {}

  @Get()
  findAll(
    @TenantId() tenantId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transferenciasService.findAll(tenantId, parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Get(':id')
  findOne(@TenantId() tenantId: number, @Param('id', ParseIntPipe) id: number) {
    return this.transferenciasService.findOne(tenantId, id);
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateTransferenciaDto) {
    return this.transferenciasService.create(tenantId, dto);
  }
}
