import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFacturaDto {
  @IsDateString()
  fecha: string;

  @IsNumber()
  clienteId: number;

  @IsNumber()
  @Min(0.01)
  importe: number;

  @IsNumber()
  monedaId: number;

  @IsOptional()
  @IsString()
  observacion?: string;
}
