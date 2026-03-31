import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateIngresoDto {
  @IsDateString()
  fecha: string;

  @IsNumber()
  tipoIngresoId: number;

  @IsOptional()
  @IsNumber()
  clienteId?: number;

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
