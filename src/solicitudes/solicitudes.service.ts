import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Solicitud, SolicitudItem } from './entities/index.js';
import { AlmacenItem } from '../inventario/entities/index.js';
import { Item } from '../inventario/entities/index.js';
import { CreateSolicitudDto } from './dto/index.js';
import { SolicitudEstado } from './enums/index.js';
import { SolicitudAprobacion } from '../aprobaciones/entities/index.js';
import { TipoAprobacion, EstadoAprobacion } from '../aprobaciones/enums/index.js';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(Solicitud)
    private readonly solicitudRepo: Repository<Solicitud>,
    @InjectRepository(SolicitudItem)
    private readonly solicitudItemRepo: Repository<SolicitudItem>,
    @InjectRepository(AlmacenItem)
    private readonly almacenItemRepo: Repository<AlmacenItem>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(SolicitudAprobacion)
    private readonly aprobacionRepo: Repository<SolicitudAprobacion>,
  ) {}

  /** Generate next sequential order number */
  private async generateNumeroOrden(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `OE-${year}-`;

    const last = await this.solicitudRepo
      .createQueryBuilder('s')
      .where('s.numero_orden LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('s.created_at', 'DESC')
      .getOne();

    let seq = 1;
    if (last) {
      const parts = last.numeroOrden.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  async create(dto: CreateSolicitudDto, userId?: string): Promise<Solicitud> {
    // Validate that all items exist
    for (const si of dto.items) {
      const item = await this.itemRepo.findOne({ where: { id: si.itemId } });
      if (!item) {
        throw new BadRequestException(`Ítem no encontrado: ${si.itemId}`);
      }
    }

    // Validate stock availability per item (across all almacenes)
    for (const si of dto.items) {
      const totalStock = await this.almacenItemRepo
        .createQueryBuilder('ai')
        .select('COALESCE(SUM(ai.cantidad), 0)', 'total')
        .where('ai.item_id = :itemId', { itemId: si.itemId })
        .getRawOne();

      const available = parseInt(totalStock?.total ?? '0', 10);
      if (available < si.cantidad) {
        const item = await this.itemRepo.findOne({ where: { id: si.itemId } });
        throw new BadRequestException(
          `Stock insuficiente para "${item?.codigo ?? si.itemId}": disponible ${available}, solicitado ${si.cantidad}`,
        );
      }
    }

    const totalItems = dto.items.length;
    const totalUnidades = dto.items.reduce((sum, i) => sum + i.cantidad, 0);
    const numeroOrden = await this.generateNumeroOrden();

    // Determine if the fecha_entrega is in the past (retroactive)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fechaEntrega = dto.fechaEntrega ? new Date(dto.fechaEntrega) : null;
    const isRetroactiva = fechaEntrega !== null && fechaEntrega < today;

    // Create solicitud header
    const solicitud = this.solicitudRepo.create({
      numeroOrden,
      obraId: dto.obraId,
      contratistaId: dto.contratistaId,
      tipoTrabajo: dto.tipoTrabajo?.trim() || null,
      titulo: dto.titulo.trim(),
      descripcion: dto.descripcion?.trim() || null,
      sector: dto.sector.trim(),
      piso: dto.piso.trim(),
      departamento: dto.departamento?.trim() || null,
      duracionDias: dto.duracionDias ?? null,
      totalItems,
      totalUnidades,
      estado: isRetroactiva ? SolicitudEstado.PENDIENTE_APROBACION : SolicitudEstado.COMPLETADA,
      createdBy: userId ?? null,
      fechaEntrega: dto.fechaEntrega ?? null,
    });
    const saved = await this.solicitudRepo.save(solicitud);

    // Create detail items
    const detailEntities = dto.items.map((si) =>
      this.solicitudItemRepo.create({
        solicitudId: saved.id,
        itemId: si.itemId,
        cantidad: si.cantidad,
      }),
    );
    await this.solicitudItemRepo.save(detailEntities);

    // If retroactive, create an aprobacion request instead of deducting stock
    if (isRetroactiva) {
      // Fetch obra and contratista names for the aprobacion record
      const fullSolicitud = await this.findById(saved.id);
      const itemsSummary = await Promise.all(
        dto.items.map(async (si) => {
          const item = await this.itemRepo.findOne({ where: { id: si.itemId } });
          return {
            codigo: item?.codigo ?? '',
            descripcion: item?.descripcion ?? item?.nombre ?? '',
            cantidad: si.cantidad,
            unidad: item?.unidad ?? 'unidad',
          };
        }),
      );

      const aprobacion = this.aprobacionRepo.create({
        tipo: TipoAprobacion.ENTREGA_RETROACTIVA,
        titulo: `Entrega retroactiva: ${dto.titulo.trim()}`,
        descripcion: `Orden ${numeroOrden} con fecha de entrega ${dto.fechaEntrega} (anterior a la fecha actual)`,
        estado: EstadoAprobacion.PENDIENTE,
        solicitanteId: userId ?? '',
        solicitudRefId: saved.id,
        entregaObra: fullSolicitud.obra?.nombre ?? null,
        entregaContratista: fullSolicitud.contratista?.nombre ?? null,
        entregaTitulo: dto.titulo.trim(),
        entregaFecha: dto.fechaEntrega ?? null,
        entregaItems: itemsSummary,
        entregaTotalItems: totalItems,
        entregaTotalUnidades: totalUnidades,
      });
      await this.aprobacionRepo.save(aprobacion);

      return this.findById(saved.id);
    }

    // Normal flow: Deduct stock from almacenes (FIFO)
    for (const si of dto.items) {
      let remaining = si.cantidad;

      const almacenItems = await this.almacenItemRepo.find({
        where: { itemId: si.itemId },
        order: { createdAt: 'ASC' },
      });

      for (const ai of almacenItems) {
        if (remaining <= 0) break;

        const deduct = Math.min(ai.cantidad, remaining);
        ai.cantidad -= deduct;
        remaining -= deduct;

        if (ai.cantidad <= 0) {
          await this.almacenItemRepo.remove(ai);
        } else {
          await this.almacenItemRepo.save(ai);
        }
      }

      // Update item stockTotal
      const item = await this.itemRepo.findOne({ where: { id: si.itemId } });
      if (item) {
        item.stockTotal = Math.max(0, item.stockTotal - si.cantidad);
        await this.itemRepo.save(item);
      }
    }

    return this.findById(saved.id);
  }

  async findAll(
    page = 1,
    pageSize = 20,
    obraId?: string,
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<{ data: Solicitud[]; total: number }> {
    const qb = this.solicitudRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.obra', 'obra')
      .leftJoinAndSelect('s.contratista', 'contratista')
      .leftJoinAndSelect('s.items', 'items')
      .leftJoinAndSelect('items.item', 'item')
      .orderBy('s.createdAt', 'DESC');

    if (obraId) {
      qb.andWhere('s.obra_id = :obraId', { obraId });
    }
    if (fechaDesde) {
      qb.andWhere('s.created_at >= :fechaDesde', { fechaDesde });
    }
    if (fechaHasta) {
      qb.andWhere('s.created_at <= :fechaHasta', {
        fechaHasta: `${fechaHasta}T23:59:59.999Z`,
      });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { data, total };
  }

  async findById(id: string): Promise<Solicitud> {
    const s = await this.solicitudRepo.findOne({
      where: { id },
      relations: ['obra', 'contratista', 'items', 'items.item'],
    });
    if (!s) throw new NotFoundException('Orden de entrega no encontrada');
    return s;
  }

  /** Get available items with stock grouped by almacen */
  async getItemsDisponibles(almacenId?: string, obraId?: string): Promise<any[]> {
    const qb = this.almacenItemRepo
      .createQueryBuilder('ai')
      .leftJoinAndSelect('ai.item', 'item')
      .leftJoinAndSelect('ai.almacen', 'almacen')
      .where('ai.cantidad > 0')
      .andWhere('item.activo = true')
      .orderBy('item.codigo', 'ASC');

    if (almacenId) {
      qb.andWhere('ai.almacen_id = :almacenId', { almacenId });
    }

    if (obraId) {
      qb.andWhere('almacen.obra_id = :obraId', { obraId });
    }

    const almacenItems = await qb.getMany();

    return almacenItems.map((ai) => ({
      id: ai.item.id,
      codigo_fab: ai.item.codigo,
      descripcion: ai.item.descripcion ?? ai.item.nombre ?? ai.item.codigo,
      unidad: ai.item.unidad,
      cantidad: ai.cantidad,
      stock_disponible: ai.cantidad,
      almacen_id: ai.almacenId,
      almacen_nombre: ai.almacen?.nombre ?? null,
    }));
  }
}
