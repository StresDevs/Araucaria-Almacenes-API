import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item, AlmacenItem, EntradaStock } from './entities/index.js';
import { ItemOrigen } from './enums/index.js';
import { CreateItemDto, UpdateItemDto, SetAlmacenStockDto, CreateEntradaStockDto } from './dto/index.js';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(AlmacenItem)
    private readonly almacenItemRepo: Repository<AlmacenItem>,
    @InjectRepository(EntradaStock)
    private readonly entradaStockRepo: Repository<EntradaStock>,
  ) {}

  async findAll(tipoOrigen?: ItemOrigen): Promise<Item[]> {
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.categoria', 'categoria')
      .leftJoinAndSelect('item.proveedor', 'proveedor')
      .leftJoinAndSelect('item.almacenItems', 'ai')
      .leftJoinAndSelect('ai.almacen', 'almacen')
      .where('item.activo = :activo', { activo: true })
      .orderBy('item.createdAt', 'DESC');

    if (tipoOrigen) {
      qb.andWhere('item.tipoOrigen = :tipoOrigen', { tipoOrigen });
    }

    return qb.getMany();
  }

  async findById(id: string): Promise<Item> {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ['categoria', 'proveedor', 'almacenItems', 'almacenItems.almacen'],
    });
    if (!item) throw new NotFoundException('Ítem no encontrado');
    return item;
  }

  async findByAlmacen(almacenId: string): Promise<AlmacenItem[]> {
    return this.almacenItemRepo.find({
      where: { almacenId },
      relations: ['item', 'item.categoria', 'item.proveedor'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateItemDto, userId?: string): Promise<Item> {
    const item = this.itemRepo.create({
      tipoOrigen: dto.tipoOrigen,
      categoriaId: dto.categoriaId ?? null,
      itemNumero: dto.itemNumero?.trim() || null,
      codigo: dto.codigo.trim(),
      nombre: dto.nombre?.trim() || null,
      descripcion: dto.descripcion?.trim() || null,
      unidad: dto.unidad.trim(),
      rendimiento: dto.rendimiento?.trim() || null,
      aplicacion: dto.aplicacion?.trim() || null,
      medida: dto.medida?.trim() || null,
      piezasPorCaja: dto.piezasPorCaja ?? null,
      espacioDeUso: dto.espacioDeUso?.trim() || null,
      proveedorId: dto.proveedorId ?? null,
      precioUnitarioBob: dto.precioUnitarioBob != null ? String(dto.precioUnitarioBob) : null,
      precioUnitarioUsd: dto.precioUnitarioUsd != null ? String(dto.precioUnitarioUsd) : null,
      stockMinimo: dto.stockMinimo ?? 0,
    });
    const saved = await this.itemRepo.save(item);

    // Handle initial stock
    if (dto.stockInicial && dto.almacenId) {
      const ai = this.almacenItemRepo.create({
        itemId: saved.id,
        almacenId: dto.almacenId,
        cantidad: dto.stockInicial,
      });
      await this.almacenItemRepo.save(ai);

      // Log the entrada
      const entrada = this.entradaStockRepo.create({
        itemId: saved.id,
        almacenId: dto.almacenId,
        cantidad: dto.stockInicial,
        descripcion: 'Stock inicial al registrar ítem',
        registradoPor: userId ?? null,
      });
      await this.entradaStockRepo.save(entrada);
    }

    return saved;
  }

  async update(id: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.findById(id);

    if (dto.categoriaId !== undefined) item.categoriaId = dto.categoriaId ?? null;
    if (dto.itemNumero !== undefined) item.itemNumero = dto.itemNumero?.trim() || null;
    if (dto.codigo !== undefined) item.codigo = dto.codigo.trim();
    if (dto.nombre !== undefined) item.nombre = dto.nombre?.trim() || null;
    if (dto.descripcion !== undefined) item.descripcion = dto.descripcion?.trim() || null;
    if (dto.unidad !== undefined) item.unidad = dto.unidad.trim();
    if (dto.rendimiento !== undefined) item.rendimiento = dto.rendimiento?.trim() || null;
    if (dto.aplicacion !== undefined) item.aplicacion = dto.aplicacion?.trim() || null;
    if (dto.medida !== undefined) item.medida = dto.medida?.trim() || null;
    if (dto.piezasPorCaja !== undefined) item.piezasPorCaja = dto.piezasPorCaja ?? null;
    if (dto.espacioDeUso !== undefined) item.espacioDeUso = dto.espacioDeUso?.trim() || null;
    if (dto.proveedorId !== undefined) item.proveedorId = dto.proveedorId ?? null;
    if (dto.precioUnitarioBob !== undefined) {
      item.precioUnitarioBob = dto.precioUnitarioBob != null ? String(dto.precioUnitarioBob) : null;
    }
    if (dto.precioUnitarioUsd !== undefined) {
      item.precioUnitarioUsd = dto.precioUnitarioUsd != null ? String(dto.precioUnitarioUsd) : null;
    }
    if (dto.stockMinimo !== undefined) {
      item.stockMinimo = dto.stockMinimo;
    }

    return this.itemRepo.save(item);
  }

  async setFotoUrl(id: string, fotoUrl: string | null): Promise<Item> {
    const item = await this.findById(id);
    item.fotoUrl = fotoUrl;
    return this.itemRepo.save(item);
  }

  async setAlmacenStock(itemId: string, dto: SetAlmacenStockDto): Promise<AlmacenItem> {
    // Verify item exists
    await this.findById(itemId);

    let ai = await this.almacenItemRepo.findOne({
      where: { itemId, almacenId: dto.almacenId },
    });

    if (ai) {
      ai.cantidad = dto.cantidad;
    } else {
      ai = this.almacenItemRepo.create({
        itemId,
        almacenId: dto.almacenId,
        cantidad: dto.cantidad,
      });
    }

    return this.almacenItemRepo.save(ai);
  }

  async removeAlmacenStock(itemId: string, almacenId: string): Promise<void> {
    const ai = await this.almacenItemRepo.findOne({
      where: { itemId, almacenId },
    });
    if (ai) await this.almacenItemRepo.remove(ai);
  }

  async existsByItemNumero(itemNumero: string, excludeId?: string): Promise<boolean> {
    const qb = this.itemRepo
      .createQueryBuilder('item')
      .where('item.itemNumero = :itemNumero', { itemNumero })
      .andWhere('item.activo = :activo', { activo: true });

    if (excludeId) {
      qb.andWhere('item.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  async remove(id: string): Promise<void> {
    const item = await this.findById(id);
    await this.itemRepo.remove(item);
  }

  async createEntradaStock(
    itemId: string,
    dto: CreateEntradaStockDto,
    userId?: string,
  ): Promise<EntradaStock> {
    await this.findById(itemId);

    // Upsert almacen_items
    let ai = await this.almacenItemRepo.findOne({
      where: { itemId, almacenId: dto.almacenId },
    });
    if (ai) {
      ai.cantidad += dto.cantidad;
    } else {
      ai = this.almacenItemRepo.create({
        itemId,
        almacenId: dto.almacenId,
        cantidad: dto.cantidad,
      });
    }
    await this.almacenItemRepo.save(ai);

    // Log entrada
    const entrada = this.entradaStockRepo.create({
      itemId,
      almacenId: dto.almacenId,
      cantidad: dto.cantidad,
      descripcion: dto.descripcion?.trim() || null,
      registradoPor: userId ?? null,
    });
    return this.entradaStockRepo.save(entrada);
  }

  async getEntradasByItem(itemId: string): Promise<EntradaStock[]> {
    return this.entradaStockRepo.find({
      where: { itemId },
      relations: ['almacen'],
      order: { createdAt: 'DESC' },
    });
  }
}
