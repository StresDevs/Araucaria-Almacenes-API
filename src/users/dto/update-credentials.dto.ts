import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateCredentialsDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'El username solo puede contener letras, números, puntos, guiones y guiones bajos' })
  username?: string;
}
