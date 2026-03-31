import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class CreateCajaDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsBoolean()
  totalizar?: boolean;
}
