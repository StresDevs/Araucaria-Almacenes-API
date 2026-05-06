import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prestamo } from './entities/index.js';
import { Item } from '../inventario/entities/item.entity.js';
import { CreatePrestamoDto } from './dto/index.js';
import { EstadoPrestamo } from './enums/index.js';

@Injectable()
export class PrestamosService {
  constructor(
    @InjectRepository(Prestamo)
    private readonly prestamoRepo: Repository<Prestamo>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
  ) {}

  /** Create a new préstamo (salida de material) */
  async create(dto: CreatePrestamoDto, userId: string): Promise<Prestamo> {
    const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException('Producto no encontrado');

    if (dto.cantidad > item.stockTotal) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${item.stockTotal} ${item.unidad}`,
      );
    }

    // Discount stock
    item.stockTotal -= dto.cantidad;
    await this.itemRepo.save(item);

    const now = new Date();
    const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const prestamo = this.prestamoRepo.create({
      itemId: dto.itemId,
      cantidad: dto.cantidad,
      unidad: item.unidad,
      obraId: dto.obraId ?? null,
      seccion: dto.seccion?.trim() || null,
      personaPrestamo: dto.personaPrestamo.trim(),
      contratistaId: dto.contratistaId ?? null,
      estado: EstadoPrestamo.PRESTADO,
      horaPrestamo: hora,
      notas: dto.notas?.trim() || null,
      registradoPorId: userId,
    });

    return this.prestamoRepo.save(prestamo);
  }

  /** List all préstamos with filters */
  async findAll(
    estado?: string,
    obraId?: string,
    search?: string,
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<Prestamo[]> {
    const qb = this.prestamoRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.item', 'item')
      .leftJoinAndSelect('item.categoria', 'cat')
      .leftJoinAndSelect('p.obra', 'obra')
      .leftJoinAndSelect('p.contratista', 'contratista')
      .leftJoinAndSelect('p.registradoPor', 'user')
      .orderBy('p.createdAt', 'DESC');

    if (estado) {
      qb.andWhere('p.estado = :estado', { estado });
    }

    if (obraId) {
      qb.andWhere('p.obra_id = :obraId', { obraId });
    }

    if (search) {
      qb.andWhere(
        '(item.codigo ILIKE :s OR item.descripcion ILIKE :s OR item.nombre ILIKE :s OR p.persona_prestamo ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    if (fechaDesde) {
      qb.andWhere('p.createdAt >= :desde', { desde: new Date(`${fechaDesde}T00:00:00.000Z`) });
    }

    if (fechaHasta) {
      qb.andWhere('p.createdAt <= :hasta', { hasta: new Date(`${fechaHasta}T23:59:59.999Z`) });
    }

    return qb.getMany();
  }

  /** Get one préstamo by id */
  async findOne(id: string): Promise<Prestamo> {
    const p = await this.prestamoRepo.findOne({
      where: { id },
      relations: ['item', 'item.categoria', 'obra', 'contratista', 'registradoPor'],
    });
    if (!p) throw new NotFoundException('Préstamo no encontrado');
    return p;
  }

  /** Mark as devuelto (ingreso) — returns stock */
  async devolver(
    id: string,
    finalizarComo: 'devuelto' | 'consumido' = 'devuelto',
    notas?: string,
  ): Promise<Prestamo> {
    const p = await this.findOne(id);

    if (p.estado !== EstadoPrestamo.PRESTADO) {
      throw new BadRequestException('Este préstamo ya fue finalizado');
    }

    const now = new Date();
    const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    p.estado =
      finalizarComo === 'consumido'
        ? EstadoPrestamo.CONSUMIDO
        : EstadoPrestamo.DEVUELTO;
    p.horaDevolucion = hora;
    p.fechaDevolucion = now;
    if (notas) p.notas = notas;

    // Only return stock if devuelto (not consumido)
    if (finalizarComo === 'devuelto') {
      const item = await this.itemRepo.findOne({ where: { id: p.itemId } });
      if (item) {
        item.stockTotal += p.cantidad;
        await this.itemRepo.save(item);
      }
    }

    return this.prestamoRepo.save(p);
  }

  /** Stats */
  async getStats(): Promise<{ prestados: number; devueltos: number; consumidos: number }> {
    const [prestados, devueltos, consumidos] = await Promise.all([
      this.prestamoRepo.count({ where: { estado: EstadoPrestamo.PRESTADO } }),
      this.prestamoRepo.count({ where: { estado: EstadoPrestamo.DEVUELTO } }),
      this.prestamoRepo.count({ where: { estado: EstadoPrestamo.CONSUMIDO } }),
    ]);
    return { prestados, devueltos, consumidos };
  }
}
