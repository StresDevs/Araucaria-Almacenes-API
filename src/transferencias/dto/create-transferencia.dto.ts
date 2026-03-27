import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransferenciaItemDto {
  @IsUUID()
  @IsNotEmpty()
  almacenDestinoId: string;

  @IsUUID()
  @IsNotEmpty()
  itemId: string;

  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CreateTransferenciaDto {
  @IsUUID()
  @IsNotEmpty()
  almacenOrigenId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TransferenciaItemDto)
  items: TransferenciaItemDto[];

  @IsOptional()
  @IsString()
  observaciones?: string;
}
