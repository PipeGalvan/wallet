import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFacturaGastoDto {
  @IsDateString()
  fecha: string;

  @IsNumber()
  tipoEgresoId: number;

  @IsNumber()
  @Min(0.01)
  importe: number;

  @IsNumber()
  monedaId: number;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;
}
