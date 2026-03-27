import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class SetAlmacenStockDto {
  @IsUUID()
  @IsNotEmpty()
  almacenId: string;

  @IsInt()
  @Min(0)
  cantidad: number;
}
