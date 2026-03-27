import { IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';

export class UpdateObraDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  ubicacion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  responsable?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;
}
