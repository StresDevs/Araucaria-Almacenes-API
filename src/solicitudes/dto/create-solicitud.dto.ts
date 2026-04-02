import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
  ArrayMinSize,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SolicitudItemDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CreateSolicitudDto {
  @IsUUID()
  @IsNotEmpty()
  obraId: string;

  @IsUUID()
  @IsNotEmpty()
  contratistaId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tipoTrabajo?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sector: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  piso: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  departamento?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  duracionDias?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SolicitudItemDto)
  items: SolicitudItemDto[];
}
