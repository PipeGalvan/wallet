import { IsNumber } from 'class-validator';

export class SelectAccountDto {
  @IsNumber()
  propietarioId: number;
}
