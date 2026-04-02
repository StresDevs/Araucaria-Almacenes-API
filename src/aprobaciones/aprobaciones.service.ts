import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudAprobacion } from './entities/index.js';
import { TipoAprobacion, EstadoAprobacion } from './enums/index.js';
import { SolicitudBaja } from '../bajas/entities/index.js';
import { EstadoBaja } from '../bajas/enums/index.js';
import { Item } from '../inventario/entities/item.entity.js';

@Injectable()
export class AprobacionesService {
  constructor(
    @InjectRepository(SolicitudAprobacion)
    private readonly aprobacionRepo: Repository<SolicitudAprobacion>,
    @InjectRepository(SolicitudBaja)
    private readonly bajaRepo: Repository<SolicitudBaja>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
  ) {}

  /** Create an aprobación entry (called internally when a baja is created) */
  async createFromBaja(baja: SolicitudBaja, solicitanteNombre: string): Promise<SolicitudAprobacion> {
    const aprobacion = this.aprobacionRepo.create({
      tipo: TipoAprobacion.BAJA_PRODUCTO,
      titulo: `Baja: ${baja.item?.descripcion ?? baja.item?.nombre ?? 'Item'}`,
      descripcion: baja.descripcionMotivo,
      estado: EstadoAprobacion.PENDIENTE,
      solicitanteId: baja.solicitanteId,
      itemCodigo: baja.item?.codigo ?? null,
      itemDescripcion: baja.item?.descripcion ?? baja.item?.nombre ?? null,
      itemCantidad: baja.cantidad,
      motivoBaja: baja.motivo,
      evidenciaUrl: baja.evidenciaUrl,
      bajaRefId: baja.id,
    });
    return this.aprobacionRepo.save(aprobacion);
  }

  /** List all with filters */
  async findAll(
    tipo?: TipoAprobacion,
    estado?: EstadoAprobacion,
  ): Promise<SolicitudAprobacion[]> {
    const qb = this.aprobacionRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.solicitanteUser', 'solicitante')
      .leftJoinAndSelect('a.revisadoPorUser', 'revisadoPor')
      .orderBy('a.createdAt', 'DESC');

    if (tipo) {
      qb.andWhere('a.tipo = :tipo', { tipo });
    }
    if (estado) {
      qb.andWhere('a.estado = :estado', { estado });
    }

    return qb.getMany();
  }

  /** Find one by id */
  async findOne(id: string): Promise<SolicitudAprobacion> {
    const sol = await this.aprobacionRepo.findOne({
      where: { id },
      relations: ['solicitanteUser', 'revisadoPorUser'],
    });
    if (!sol) {
      throw new NotFoundException('Solicitud de aprobación no encontrada');
    }
    return sol;
  }

  /** Admin approves */
  async aprobar(id: string, adminId: string): Promise<SolicitudAprobacion> {
    const sol = await this.findOne(id);
    if (sol.estado !== EstadoAprobacion.PENDIENTE) {
      throw new BadRequestException('Esta solicitud ya fue revisada');
    }

    sol.estado = EstadoAprobacion.APROBADA;
    sol.revisadoPorId = adminId;
    sol.fechaRevision = new Date();

    // If it's a baja, also approve the underlying solicitud_baja and discount stock
    if (sol.tipo === TipoAprobacion.BAJA_PRODUCTO && sol.bajaRefId) {
      const baja = await this.bajaRepo.findOne({ where: { id: sol.bajaRefId } });
      if (baja && baja.estado === EstadoBaja.PENDIENTE) {
        baja.estado = EstadoBaja.APROBADA;
        baja.revisadoPorId = adminId;
        baja.fechaRevision = new Date();
        await this.bajaRepo.save(baja);

        // Discount stock
        const item = await this.itemRepo.findOne({ where: { id: baja.itemId } });
        if (item) {
          item.stockTotal = Math.max(0, item.stockTotal - baja.cantidad);
          await this.itemRepo.save(item);
        }
      }
    }

    return this.aprobacionRepo.save(sol);
  }

  /** Admin rejects */
  async rechazar(
    id: string,
    adminId: string,
    notasRevision?: string,
  ): Promise<SolicitudAprobacion> {
    const sol = await this.findOne(id);
    if (sol.estado !== EstadoAprobacion.PENDIENTE) {
      throw new BadRequestException('Esta solicitud ya fue revisada');
    }

    sol.estado = EstadoAprobacion.RECHAZADA;
    sol.revisadoPorId = adminId;
    sol.fechaRevision = new Date();
    sol.notasRevision = notasRevision || null;

    // If it's a baja, also reject the underlying solicitud_baja
    if (sol.tipo === TipoAprobacion.BAJA_PRODUCTO && sol.bajaRefId) {
      const baja = await this.bajaRepo.findOne({ where: { id: sol.bajaRefId } });
      if (baja && baja.estado === EstadoBaja.PENDIENTE) {
        baja.estado = EstadoBaja.RECHAZADA;
        baja.revisadoPorId = adminId;
        baja.fechaRevision = new Date();
        baja.notasRevision = notasRevision || null;
        await this.bajaRepo.save(baja);
      }
    }

    return this.aprobacionRepo.save(sol);
  }
}
