import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../enums/index.js';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Los nombres son requeridos' })
  @MaxLength(100)
  nombres: string;

  @IsString()
  @IsNotEmpty({ message: 'El primer apellido es requerido' })
  @MaxLength(100)
  primerApellido: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  segundoApellido?: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  telefono?: string;

  @IsEnum(UserRole, { message: 'Rol inválido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  rol: UserRole;
}
