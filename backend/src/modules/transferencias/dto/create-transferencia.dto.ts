import { IsDateString, IsNumber, Min } from 'class-validator';

export class CreateTransferenciaDto {
  @IsDateString()
  fecha: string;

  @IsNumber()
  cajaOrigenId: number;

  @IsNumber()
  cajaDestinoId: number;

  @IsNumber()
  monedaId: number;

  @IsNumber()
  @Min(0.01)
  importe: number;
}
