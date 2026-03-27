import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Obra } from './entities/index.js';
import { ObraEstado } from './enums/index.js';
import { CreateObraDto, UpdateObraDto, CloseObraDto } from './dto/index.js';

@Injectable()
export class ObrasService {
  constructor(
    @InjectRepository(Obra)
    private readonly obraRepository: Repository<Obra>,
  ) {}

  async findAll(): Promise<Obra[]> {
    return this.obraRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Obra> {
    const obra = await this.obraRepository.findOne({ where: { id } });
    if (!obra) {
      throw new NotFoundException('Obra no encontrada');
    }
    return obra;
  }

  async create(dto: CreateObraDto): Promise<Obra> {
    const obra = this.obraRepository.create({
      nombre: dto.nombre,
      ubicacion: dto.ubicacion ?? null,
      responsable: dto.responsable ?? null,
      fechaInicio: dto.fechaInicio,
      estado: ObraEstado.ACTIVA,
    });
    return this.obraRepository.save(obra);
  }

  async update(id: string, dto: UpdateObraDto): Promise<Obra> {
    const obra = await this.findById(id);

    if (dto.nombre !== undefined) obra.nombre = dto.nombre;
    if (dto.ubicacion !== undefined) obra.ubicacion = dto.ubicacion ?? null;
    if (dto.responsable !== undefined) obra.responsable = dto.responsable ?? null;
    if (dto.fechaInicio !== undefined) obra.fechaInicio = dto.fechaInicio;

    return this.obraRepository.save(obra);
  }

  async close(id: string, dto: CloseObraDto): Promise<Obra> {
    const obra = await this.findById(id);
    obra.estado = ObraEstado.FINALIZADA;
    obra.fechaFin = dto.fechaFin ?? new Date().toISOString().split('T')[0];
    return this.obraRepository.save(obra);
  }

  async remove(id: string): Promise<void> {
    const obra = await this.findById(id);
    await this.obraRepository.remove(obra);
  }
}
