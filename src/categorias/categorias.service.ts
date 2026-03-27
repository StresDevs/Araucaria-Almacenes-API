import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './entities/index.js';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/index.js';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
  ) {}

  async findAll(): Promise<Categoria[]> {
    return this.categoriaRepo.find({ order: { nombre: 'ASC' } });
  }

  async findById(id: string): Promise<Categoria> {
    const cat = await this.categoriaRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async create(dto: CreateCategoriaDto): Promise<Categoria> {
    const exists = await this.categoriaRepo.findOne({
      where: { nombre: dto.nombre.trim() },
    });
    if (exists) throw new ConflictException('Ya existe una categoría con ese nombre');

    const cat = this.categoriaRepo.create({
      nombre: dto.nombre.trim(),
      descripcion: dto.descripcion?.trim() || null,
    });
    return this.categoriaRepo.save(cat);
  }

  async update(id: string, dto: UpdateCategoriaDto): Promise<Categoria> {
    const cat = await this.findById(id);
    if (dto.nombre !== undefined) cat.nombre = dto.nombre.trim();
    if (dto.descripcion !== undefined) cat.descripcion = dto.descripcion?.trim() || null;
    return this.categoriaRepo.save(cat);
  }

  async remove(id: string): Promise<void> {
    const cat = await this.findById(id);
    await this.categoriaRepo.remove(cat);
  }
}
