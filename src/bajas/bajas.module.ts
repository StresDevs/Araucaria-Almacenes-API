import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudBaja } from './entities/index.js';
import { Item } from '../inventario/entities/item.entity.js';
import { BajasService } from './bajas.service.js';
import { BajasController } from './bajas.controller.js';
import { AprobacionesModule } from '../aprobaciones/aprobaciones.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([SolicitudBaja, Item]),
    forwardRef(() => AprobacionesModule),
  ],
  controllers: [BajasController],
  providers: [BajasService],
  exports: [BajasService],
})
export class BajasModule {}
