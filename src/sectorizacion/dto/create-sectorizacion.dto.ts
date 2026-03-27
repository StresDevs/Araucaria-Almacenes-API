import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SectorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  color: string;

  @IsInt()
  @Min(1)
  numero: number;
}

export class DepartamentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  letra: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombre?: string;

  @IsInt()
  @Min(1)
  sectorNumero: number;
}

export class PisoDto {
  @IsInt()
  @Min(0)
  numero: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  orden?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartamentoDto)
  departamentos: DepartamentoDto[];
}

export class CreateSectorizacionDto {
  @IsUUID('4', { message: 'ID de obra inválido' })
  @IsNotEmpty({ message: 'La obra es obligatoria' })
  obraId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectorDto)
  sectores: SectorDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PisoDto)
  pisos: PisoDto[];
}
