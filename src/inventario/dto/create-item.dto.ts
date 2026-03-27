import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  MaxLength,
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
}
