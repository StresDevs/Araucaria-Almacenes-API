import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transferencia, TransferenciaItem } from './entities/index.js';
import { AlmacenItem } from '../inventario/entities/index.js';
import { CreateTransferenciaDto } from './dto/index.js';
import { TransferenciaEstado } from './enums/index.js';

@Injectable()
export class TransferenciasService {
  constructor(
    @InjectRepository(Transferencia)
    private readonly transferenciaRepo: Repository<Transferencia>,
    @InjectRepository(TransferenciaItem)
    private readonly transferenciaItemRepo: Repository<TransferenciaItem>,
    @InjectRepository(AlmacenItem)
    private readonly almacenItemRepo: Repository<AlmacenItem>,
  ) {}

  async create(dto: CreateTransferenciaDto, userId?: string): Promise<Transferencia> {
    // Group items by (itemId, almacenOrigenId) to validate stock
    const stockNeeded = new Map<string, number>();
    for (const ti of dto.items) {
      const key = ti.itemId;
      stockNeeded.set(key, (stockNeeded.get(key) ?? 0) + ti.cantidad);
    }

    // Validate origin stock sufficiency
    for (const [itemId, totalNeeded] of stockNeeded) {
      const ai = await this.almacenItemRepo.findOne({
        where: { itemId, almacenId: dto.almacenOrigenId },
      });
      const available = ai?.cantidad ?? 0;
      if (available < totalNeeded) {
        throw new BadRequestException(
          `Stock insuficiente para ítem ${itemId}: disponible ${available}, solicitado ${totalNeeded}`,
        );
      }
    }

    // Create transfer header
    const transferencia = this.transferenciaRepo.create({
      almacenOrigenId: dto.almacenOrigenId,
      observaciones: dto.observaciones?.trim() || null,
      estado: TransferenciaEstado.COMPLETADA,
      createdBy: userId ?? null,
    });
    const saved = await this.transferenciaRepo.save(transferencia);

    // Create detail items
    const detailEntities = dto.items.map((ti) =>
      this.transferenciaItemRepo.create({
        transferenciaId: saved.id,
        almacenDestinoId: ti.almacenDestinoId,
        itemId: ti.itemId,
        cantidad: ti.cantidad,
      }),
    );
    await this.transferenciaItemRepo.save(detailEntities);

    // Update stock: deduct from origin, add to destinations
    for (const ti of dto.items) {
      // Deduct from origin
      const originAi = await this.almacenItemRepo.findOne({
        where: { itemId: ti.itemId, almacenId: dto.almacenOrigenId },
      });
      if (originAi) {
        originAi.cantidad -= ti.cantidad;
        if (originAi.cantidad <= 0) {
          await this.almacenItemRepo.remove(originAi);
        } else {
          await this.almacenItemRepo.save(originAi);
        }
      }

      // Add to destination
      let destAi = await this.almacenItemRepo.findOne({
        where: { itemId: ti.itemId, almacenId: ti.almacenDestinoId },
      });
      if (destAi) {
        destAi.cantidad += ti.cantidad;
      } else {
        destAi = this.almacenItemRepo.create({
          itemId: ti.itemId,
          almacenId: ti.almacenDestinoId,
          cantidad: ti.cantidad,
        });
      }
      await this.almacenItemRepo.save(destAi);
    }

    return this.findById(saved.id);
  }

  async findAll(page = 1, pageSize = 20): Promise<{ data: Transferencia[]; total: number }> {
    const [data, total] = await this.transferenciaRepo.findAndCount({
      relations: [
        'almacenOrigen',
        'items',
        'items.almacenDestino',
        'items.item',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { data, total };
  }

  async findById(id: string): Promise<Transferencia> {
    const t = await this.transferenciaRepo.findOne({
      where: { id },
      relations: [
        'almacenOrigen',
        'items',
        'items.almacenDestino',
        'items.item',
      ],
    });
    if (!t) throw new NotFoundException('Transferencia no encontrada');
    return t;
  }

  async setEvidenciaUrl(id: string, url: string): Promise<Transferencia> {
    const t = await this.findById(id);
    t.evidenciaUrl = url;
    return this.transferenciaRepo.save(t);
  }
}
