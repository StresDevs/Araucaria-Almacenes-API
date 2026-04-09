import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsInt,
  Min,
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
  @IsString()
  @MaxLength(100)
  aplicacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  medida?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  piezasPorCaja?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  espacioDeUso?: string;

  @IsOptional()
  @IsUUID()
  proveedorId?: string;

  @IsOptional()
  @IsNumber()
  precioUnitarioBob?: number;

  @IsOptional()
  @IsNumber()
  precioUnitarioUsd?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stockMinimo?: number;
}
