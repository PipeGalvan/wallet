import { IsNumber, Min } from 'class-validator';

export class PagarFacturaGastoDto {
  @IsNumber()
  @Min(0.01)
  importe: number;

  @IsNumber()
  cajaId: number;

  @IsNumber()
  monedaId: number;
}
