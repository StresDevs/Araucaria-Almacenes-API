import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Obra } from './entities/index.js';
import { ObrasService } from './obras.service.js';
import { ObrasController } from './obras.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Obra])],
  controllers: [ObrasController],
  providers: [ObrasService],
  exports: [ObrasService],
})
export class ObrasModule {}
