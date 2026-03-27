import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';
import { ItemOrigen } from '../enums/index.js';

export class CreateItemDto {
  @IsEnum(ItemOrigen)
  tipoOrigen: ItemOrigen;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  itemNumero?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  codigo: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unidad: string;

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

  // Initial stock (only on creation)
  @IsOptional()
  @IsInt()
  @Min(1)
  stockInicial?: number;

  @IsOptional()
  @IsUUID()
  almacenId?: string;
}
