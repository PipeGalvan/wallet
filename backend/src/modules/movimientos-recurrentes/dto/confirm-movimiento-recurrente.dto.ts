import { IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class ConfirmMovimientoRecurrenteDto {
  @IsNumber()
  @Min(0.01)
  importe: number;

  @IsOptional()
  @IsString()
  observacion?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
