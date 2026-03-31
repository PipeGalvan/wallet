import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateEgresoDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsNumber()
  tipoEgresoId?: number;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsNumber()
  monedaId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  importe?: number;
}
