import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SectorizacionController } from './sectorizacion.controller.js';
import { SectorizacionService } from './sectorizacion.service.js';
import {
  Sectorizacion,
  SectorizacionSector,
  SectorizacionPiso,
  SectorizacionDepartamento,
  SectorizacionArchivo,
} from './entities/index.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sectorizacion,
      SectorizacionSector,
      SectorizacionPiso,
      SectorizacionDepartamento,
      SectorizacionArchivo,
    ]),
  ],
  controllers: [SectorizacionController],
  providers: [SectorizacionService],
  exports: [SectorizacionService],
})
export class SectorizacionModule {}
