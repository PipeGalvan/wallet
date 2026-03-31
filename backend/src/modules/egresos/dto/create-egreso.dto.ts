import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEgresoDto {
  @IsDateString()
  fecha: string;

  @IsNumber()
  tipoEgresoId: number;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsNumber()
  monedaId: number;

  @IsNumber()
  @Min(0.01)
  importe: number;

  @IsNumber()
  cajaId: number;
}
