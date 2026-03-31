import { IsString, IsOptional } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
