import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transferencia, TransferenciaItem } from './entities/index.js';
import { AlmacenItem } from '../inventario/entities/index.js';
import { TransferenciasService } from './transferencias.service.js';
import { TransferenciasController } from './transferencias.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Transferencia, TransferenciaItem, AlmacenItem])],
  controllers: [TransferenciasController],
  providers: [TransferenciasService],
  exports: [TransferenciasService],
})
export class TransferenciasModule {}
