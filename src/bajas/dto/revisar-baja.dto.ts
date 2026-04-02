import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RevisarBajaDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notasRevision?: string;
}
