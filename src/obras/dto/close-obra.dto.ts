import { IsOptional, IsString, IsDateString } from 'class-validator';

export class CloseObraDto {
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
