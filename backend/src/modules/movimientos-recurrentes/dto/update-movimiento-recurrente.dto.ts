import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class UpdateMovimientoRecurrenteDto {
  @IsOptional()
  @IsIn(['INGRESO', 'EGRESO'])
  tipo?: string;

  @IsOptional()
  @IsNumber()
  tipoMovimientoId?: number;

  @IsOptional()
  @IsNumber()
  clienteId?: number;

  @IsOptional()
  @IsNumber()
  monedaId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  montoEstimado?: number;

  @IsOptional()
  @IsNumber()
  cajaId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  observacion?: string;

  @IsOptional()
  @IsString()
  frecuencia?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  diaDelMes?: number;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  cantidadOcurrencias?: number;
}
