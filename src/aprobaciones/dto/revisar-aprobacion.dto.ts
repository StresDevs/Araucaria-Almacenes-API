import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RevisarAprobacionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notasRevision?: string;
}
