import { IsNotEmpty, IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateObraDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MaxLength(200)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  ubicacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  responsable?: string;

  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @IsDateString({}, { message: 'Fecha de inicio inválida' })
  fechaInicio: string;
}
