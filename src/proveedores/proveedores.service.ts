import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from './entities/index.js';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/index.js';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>,
  ) {}

  async findAll(): Promise<Proveedor[]> {
    return this.proveedorRepo.find({ order: { nombre: 'ASC' } });
  }

  async findById(id: string): Promise<Proveedor> {
    const prov = await this.proveedorRepo.findOne({ where: { id } });
    if (!prov) throw new NotFoundException('Proveedor no encontrado');
    return prov;
  }

  async create(dto: CreateProveedorDto): Promise<Proveedor> {
    const prov = this.proveedorRepo.create({
      nombre: dto.nombre.trim(),
      telefono: dto.telefono?.trim() || null,
    });
    return this.proveedorRepo.save(prov);
  }

  async update(id: string, dto: UpdateProveedorDto): Promise<Proveedor> {
    const prov = await this.findById(id);
    if (dto.nombre !== undefined) prov.nombre = dto.nombre.trim();
    if (dto.telefono !== undefined) prov.telefono = dto.telefono?.trim() || null;
    return this.proveedorRepo.save(prov);
  }

  async remove(id: string): Promise<void> {
    const prov = await this.findById(id);
    await this.proveedorRepo.remove(prov);
  }
}
