import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prestamo } from './entities/index.js';
import { Item } from '../inventario/entities/item.entity.js';
import { PrestamosController } from './prestamos.controller.js';
import { PrestamosService } from './prestamos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Prestamo, Item])],
  controllers: [PrestamosController],
  providers: [PrestamosService],
  exports: [PrestamosService],
})
export class PrestamosModule {}
