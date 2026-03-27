import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateEntradaStockDto {
  @IsUUID()
  @IsNotEmpty()
  almacenId: string;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
