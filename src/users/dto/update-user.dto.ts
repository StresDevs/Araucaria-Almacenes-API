import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../enums/index.js';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nombres?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  primerApellido?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  segundoApellido?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'El username solo puede contener letras, números, puntos, guiones y guiones bajos' })
  username?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefono?: string;

  @IsEnum(UserRole, { message: 'Rol inválido' })
  @IsOptional()
  rol?: UserRole;
}
