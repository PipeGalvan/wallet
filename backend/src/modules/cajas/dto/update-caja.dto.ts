import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCajaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsBoolean()
  totalizar?: boolean;
}
