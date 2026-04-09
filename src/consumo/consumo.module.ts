import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsumoDepartamento } from './entities/index.js';
import { ConsumoService } from './consumo.service.js';
import { ConsumoController } from './consumo.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ConsumoDepartamento])],
  controllers: [ConsumoController],
  providers: [ConsumoService],
  exports: [ConsumoService],
})
export class ConsumoModule {}
