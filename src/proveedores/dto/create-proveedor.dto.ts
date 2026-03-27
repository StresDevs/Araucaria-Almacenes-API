import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;
}
