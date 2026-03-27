import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class UpdateItemDto {
  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  itemNumero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  codigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unidad?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rendimiento?: string;

  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @IsOptional()
  @IsNumber()
  precioUnitarioBob?: number;

  @IsOptional()
  @IsNumber()
  precioUnitarioUsd?: number;
}
