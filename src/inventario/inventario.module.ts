import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, AlmacenItem } from './entities/index.js';
import { InventarioService } from './inventario.service.js';
import { InventarioController } from './inventario.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Item, AlmacenItem])],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
