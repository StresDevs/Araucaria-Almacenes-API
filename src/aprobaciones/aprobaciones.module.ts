import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudAprobacion } from './entities/index.js';
import { SolicitudBaja } from '../bajas/entities/index.js';
import { Item, AlmacenItem } from '../inventario/entities/index.js';
import { Solicitud, SolicitudItem } from '../solicitudes/entities/index.js';
import { AprobacionesService } from './aprobaciones.service.js';
import { AprobacionesController } from './aprobaciones.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([SolicitudAprobacion, SolicitudBaja, Item, AlmacenItem, Solicitud, SolicitudItem])],
  controllers: [AprobacionesController],
  providers: [AprobacionesService],
  exports: [AprobacionesService],
})
export class AprobacionesModule {}
