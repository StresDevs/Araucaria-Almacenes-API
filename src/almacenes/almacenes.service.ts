import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Almacen } from './entities/index.js';
import { AlmacenTipo, AlmacenEstado } from './enums/index.js';
import { CreateAlmacenDto, UpdateAlmacenDto } from './dto/index.js';

@Injectable()
export class AlmacenesService {
  constructor(
    @InjectRepository(Almacen)
    private readonly almacenRepository: Repository<Almacen>,
  ) {}

  async findAll(): Promise<Almacen[]> {
    return this.almacenRepository.find({
      relations: ['obra'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Almacen> {
    const almacen = await this.almacenRepository.findOne({
      where: { id },
      relations: ['obra'],
    });
    if (!almacen) {
      throw new NotFoundException('Almacén no encontrado');
    }
    return almacen;
  }

  async findByObraId(obraId: string): Promise<Almacen[]> {
    return this.almacenRepository.find({
      where: { obraId },
      relations: ['obra'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateAlmacenDto): Promise<Almacen> {
    // Si es tipo obra, debe tener obraId
    if (dto.tipoAlmacen === AlmacenTipo.OBRA && !dto.obraId) {
      throw new BadRequestException(
        'Los almacenes de tipo "obra" requieren un ID de obra',
      );
    }

    // Si es tipo fijo, no debe tener obraId
    if (dto.tipoAlmacen === AlmacenTipo.FIJO && dto.obraId) {
      throw new BadRequestException(
        'Los almacenes de tipo "fijo" no deben tener un ID de obra',
      );
    }

    const almacen = this.almacenRepository.create({
      nombre: dto.nombre.trim(),
      tipoAlmacen: dto.tipoAlmacen,
      direccion: dto.direccion?.trim() || null,
      estado: AlmacenEstado.ACTIVO,
      obraId: dto.obraId ?? null,
    });

    return this.almacenRepository.save(almacen);
  }

  async update(id: string, dto: UpdateAlmacenDto): Promise<Almacen> {
    const almacen = await this.findById(id);

    if (dto.nombre !== undefined) almacen.nombre = dto.nombre.trim();
    if (dto.direccion !== undefined) almacen.direccion = dto.direccion?.trim() || null;
    if (dto.obraId !== undefined) almacen.obraId = dto.obraId ?? null;

    return this.almacenRepository.save(almacen);
  }

  async toggleActive(id: string): Promise<Almacen> {
    const almacen = await this.findById(id);
    almacen.estado =
      almacen.estado === AlmacenEstado.ACTIVO
        ? AlmacenEstado.INACTIVO
        : AlmacenEstado.ACTIVO;
    return this.almacenRepository.save(almacen);
  }

  async remove(id: string): Promise<void> {
    const almacen = await this.findById(id);
    await this.almacenRepository.remove(almacen);
  }
}
