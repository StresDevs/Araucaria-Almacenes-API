import { IsNotEmpty, IsString, MaxLength, IsInt, Min } from 'class-validator';

export class AddArchivoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombreOriginal: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombreArchivo: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mimetype: string;

  @IsInt()
  @Min(1)
  tamanio: number;
}
