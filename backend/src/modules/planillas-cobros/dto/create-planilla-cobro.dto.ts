import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePlanillaCobroDto {
  @IsNumber()
  mes: number;

  @IsNumber()
  anio: number;
}

export class CreatePlanillaCobroItemDto {
  @IsNumber()
  tipoIngresoId: number;

  @IsOptional()
  @IsNumber()
  clienteId?: number;

  @IsNumber()
  @Min(0.01)
  importe: number;

  @IsNumber()
  monedaId: number;
}

export class CobrarPlanillaItemDto {
  @IsNumber()
  cajaId: number;
}
