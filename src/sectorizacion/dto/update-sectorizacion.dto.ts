import {
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SectorDto, PisoDto } from './create-sectorizacion.dto.js';

export class UpdateSectorizacionDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectorDto)
  sectores?: SectorDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PisoDto)
  pisos?: PisoDto[];
}
