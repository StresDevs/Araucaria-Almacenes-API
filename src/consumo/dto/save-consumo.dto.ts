import {
  IsUUID,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConsumoValueDto {
  @IsUUID()
  itemId: string;

  @IsUUID()
  departamentoId: string;

  @IsNumber()
  @Min(0)
  cantidad: number;
}

export class SaveConsumoDto {
  @IsUUID()
  @IsNotEmpty()
  obraId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumoValueDto)
  valores: ConsumoValueDto[];
}
