import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AlmacenTipo } from '../enums/index.js';

export class CreateAlmacenDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(200)
  nombre: string;

  @IsEnum(AlmacenTipo, { message: 'Tipo de almacén inválido (fijo | obra)' })
  @IsNotEmpty({ message: 'El tipo de almacén es obligatorio' })
  tipoAlmacen: AlmacenTipo;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  direccion?: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID de obra inválido' })
  obraId?: string;
}
