import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateIngresoDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsNumber()
  tipoIngresoId?: number;

  @IsOptional()
  @IsNumber()
  clienteId?: number;

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
