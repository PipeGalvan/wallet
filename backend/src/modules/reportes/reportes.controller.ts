import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private reportesService: ReportesService) {}

  @Get('resumen')
  getResumen(
    @TenantId() tenantId: number,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.reportesService.getResumen(tenantId, fechaDesde, fechaHasta);
  }

  @Get('saldos')
  getSaldos(@TenantId() tenantId: number) {
    return this.reportesService.getSaldos(tenantId);
  }

  @Get('facturas-pendientes')
  getFacturasPendientes(@TenantId() tenantId: number) {
    return this.reportesService.getFacturasPendientes(tenantId);
  }

  @Get('agrupado-por-tipo')
  getAgrupadoPorTipo(
    @TenantId() tenantId: number,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.reportesService.getAgrupadoPorTipo(tenantId, fechaDesde, fechaHasta);
  }
}
