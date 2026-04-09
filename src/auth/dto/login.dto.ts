import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'El identificador es requerido' })
  identifier: string; // email or username

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password: string;
}
