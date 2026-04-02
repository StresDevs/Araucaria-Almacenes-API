import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';

export class DevolverPrestamoDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notas?: string;

  @IsOptional()
  @IsEnum(['devuelto', 'consumido'])
  estado?: 'devuelto' | 'consumido';
}
