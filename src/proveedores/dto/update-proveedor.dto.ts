import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProveedorDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;
}
