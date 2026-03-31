import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePlanillaGastoDto {
  @IsNumber()
  mes: number;

  @IsNumber()
  anio: number;
}

export class CreatePlanillaGastoItemDto {
  @IsNumber()
  tipoEgresoId: number;

  @IsNumber()
  @Min(0.01)
  importe: number;

  @IsNumber()
  monedaId: number;
}

export class PagarPlanillaItemDto {
  @IsNumber()
  cajaId: number;
}
