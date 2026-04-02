import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contratista } from './entities/index.js';
import { ContratistasService } from './contratistas.service.js';
import { ContratistasController } from './contratistas.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Contratista])],
  controllers: [ContratistasController],
  providers: [ContratistasService],
  exports: [ContratistasService],
})
export class ContratistasModule {}
