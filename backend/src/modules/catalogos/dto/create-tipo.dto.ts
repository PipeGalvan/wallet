import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTipoDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
