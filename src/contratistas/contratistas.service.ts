import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contratista } from './entities/index.js';
import { CreateContratistaDto } from './dto/index.js';

@Injectable()
export class ContratistasService {
  constructor(
    @InjectRepository(Contratista)
    private readonly contratistaRepo: Repository<Contratista>,
  ) {}

  async findAll(obraId?: string): Promise<Contratista[]> {
    const qb = this.contratistaRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.obra', 'obra')
      .where('c.estado = :estado', { estado: 'activo' })
      .orderBy('c.nombre', 'ASC');

    if (obraId) {
      qb.andWhere('c.obra_id = :obraId', { obraId });
    }

    return qb.getMany();
  }

  async findById(id: string): Promise<Contratista> {
    const c = await this.contratistaRepo.findOne({
      where: { id },
      relations: ['obra'],
    });
    if (!c) throw new NotFoundException('Contratista no encontrado');
    return c;
  }

  async create(dto: CreateContratistaDto): Promise<Contratista> {
    const contratista = this.contratistaRepo.create({
      nombre: dto.nombre.trim(),
      empresa: dto.empresa?.trim() || '—',
      telefono: dto.telefono?.trim() || null,
      obraId: dto.obraId ?? null,
      estado: 'activo',
    });
    return this.contratistaRepo.save(contratista);
  }
}
