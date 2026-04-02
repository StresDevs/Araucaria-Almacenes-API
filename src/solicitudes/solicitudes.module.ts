import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Solicitud, SolicitudItem } from './entities/index.js';
import { AlmacenItem, Item } from '../inventario/entities/index.js';
import { SolicitudesService } from './solicitudes.service.js';
import { SolicitudesController } from './solicitudes.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Solicitud, SolicitudItem, AlmacenItem, Item]),
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService],
})
export class SolicitudesModule {}
