import {
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrestamoDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  personaPrestamo: string;

  @IsOptional()
  @IsUUID()
  obraId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  seccion?: string;

  @IsOptional()
  @IsUUID()
  contratistaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notas?: string;
}
