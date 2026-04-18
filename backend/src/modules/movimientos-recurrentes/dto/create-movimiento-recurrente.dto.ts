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

export class CreateMovimientoRecurrenteDto {
  @IsIn(['INGRESO', 'EGRESO'])
  tipo: string;

  @IsNumber()
  tipoMovimientoId: number;

  @IsOptional()
  @IsNumber()
  clienteId?: number;

  @IsNumber()
  monedaId: number;

  @IsNumber()
  @Min(0.01)
  montoEstimado: number;

  @IsNumber()
  cajaId: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  observacion?: string;

  @IsString()
  frecuencia: string = 'mensual';

  @IsNumber()
  @Min(1)
  @Max(31)
  diaDelMes: number;

  @IsDateString()
  fechaInicio: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  cantidadOcurrencias?: number;
}
