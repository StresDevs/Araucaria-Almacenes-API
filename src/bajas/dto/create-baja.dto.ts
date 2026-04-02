import { IsNotEmpty, IsUUID, IsInt, Min, IsEnum, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { MotivoBaja } from '../enums/index.js';

export class CreateBajaDto {
  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad: number;

  @IsEnum(MotivoBaja)
  motivo: MotivoBaja;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  descripcionMotivo: string;
}
