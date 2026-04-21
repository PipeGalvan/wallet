import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateConversionDto {
  @IsNumber()
  cajaId: number;

  @IsNumber()
  monedaOrigenId: number;

  @IsNumber()
  monedaDestinoId: number;

  @IsNumber()
  @Min(0.000001)
  tipoCambio: number;

  @IsNumber()
  @Min(0.01)
  importe: number;

  @IsOptional()
  @IsNumber()
  tipoCambioDisplay?: number;
}
