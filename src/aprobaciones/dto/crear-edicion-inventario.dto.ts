import {
  IsUUID,
  IsString,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CambiosPropuestosDto {
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
  @Type(() => Number)
  precioUnitarioBob?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  precioUnitarioUsd?: number;
}

export class CrearEdicionInventarioDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  justificacion: string;

  @ValidateNested()
  @Type(() => CambiosPropuestosDto)
  cambios: CambiosPropuestosDto;
}
