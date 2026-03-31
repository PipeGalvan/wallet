import {
  Controller, Get, Post, Body, Query,
  UseGuards,
} from '@nestjs/common';
import { ConversionesService } from './conversiones.service';
import { CreateConversionDto } from './dto/create-conversion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('conversiones')
export class ConversionesController {
  constructor(private conversionesService: ConversionesService) {}

  @Get()
  findAll(
    @TenantId() tenantId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversionesService.findAll(tenantId, parseInt(page || '1'), parseInt(limit || '20'));
  }

  @Post()
  create(@TenantId() tenantId: number, @Body() dto: CreateConversionDto) {
    return this.conversionesService.create(tenantId, dto);
  }
}
