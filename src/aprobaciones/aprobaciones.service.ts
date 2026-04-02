import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudAprobacion } from './entities/index.js';
import { TipoAprobacion, EstadoAprobacion } from './enums/index.js';
import { SolicitudBaja } from '../bajas/entities/index.js';
import { EstadoBaja } from '../bajas/enums/index.js';
import { Item } from '../inventario/entities/item.entity.js';
import { CrearEdicionInventarioDto } from './dto/index.js';

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

  /** Create an aprobación entry for an inventory edit by a non-admin user */
  async createFromEdicion(
    dto: CrearEdicionInventarioDto,
    solicitanteId: string,
  ): Promise<SolicitudAprobacion> {
    const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });
    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    // Build human-readable list of changes
    const fieldLabels: Record<string, string> = {
      categoriaId: 'Categoría',
      itemNumero: 'Nro. Ítem',
      codigo: 'Código',
      nombre: 'Nombre',
      descripcion: 'Descripción',
      unidad: 'Unidad',
      rendimiento: 'Rendimiento',
      proveedorId: 'Proveedor',
      precioUnitarioBob: 'Precio BOB',
      precioUnitarioUsd: 'Precio USD',
    };

    const itemFieldMap: Record<string, string> = {
      categoriaId: 'categoriaId',
      itemNumero: 'itemNumero',
      codigo: 'codigo',
      nombre: 'nombre',
      descripcion: 'descripcion',
      unidad: 'unidad',
      rendimiento: 'rendimiento',
      proveedorId: 'proveedorId',
      precioUnitarioBob: 'precioUnitarioBob',
      precioUnitarioUsd: 'precioUnitarioUsd',
    };

    const cambios: { campo: string; anterior: string; nuevo: string }[] = [];
    for (const [key, value] of Object.entries(dto.cambios)) {
      if (value === undefined) continue;
      const entityField = itemFieldMap[key];
      if (!entityField) continue;
      const anterior = String((item as any)[entityField] ?? '');
      const nuevo = String(value ?? '');
      if (anterior !== nuevo) {
        cambios.push({
          campo: fieldLabels[key] || key,
          anterior,
          nuevo,
        });
      }
    }

    if (cambios.length === 0) {
      throw new BadRequestException('No se detectaron cambios');
    }

    const aprobacion = this.aprobacionRepo.create({
      tipo: TipoAprobacion.EDICION_INVENTARIO,
      titulo: `Edición: ${item.descripcion ?? item.nombre ?? item.codigo}`,
      descripcion: dto.justificacion,
      estado: EstadoAprobacion.PENDIENTE,
      solicitanteId,
      itemId: item.id,
      itemCodigo: item.codigo,
      itemDescripcion: item.descripcion ?? item.nombre ?? null,
      justificacion: dto.justificacion,
      cambiosPropuestos: cambios,
      updateDto: dto.cambios as any,
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

    // If it's an inventory edit, apply the proposed changes to the item
    if (sol.tipo === TipoAprobacion.EDICION_INVENTARIO && sol.itemId && sol.updateDto) {
      const item = await this.itemRepo.findOne({ where: { id: sol.itemId } });
      if (item) {
        const dto = sol.updateDto;
        if (dto.categoriaId !== undefined) item.categoriaId = dto.categoriaId ?? null;
        if (dto.itemNumero !== undefined) item.itemNumero = dto.itemNumero?.trim() || null;
        if (dto.codigo !== undefined) item.codigo = dto.codigo.trim();
        if (dto.nombre !== undefined) item.nombre = dto.nombre?.trim() || null;
        if (dto.descripcion !== undefined) item.descripcion = dto.descripcion?.trim() || null;
        if (dto.unidad !== undefined) item.unidad = dto.unidad.trim();
        if (dto.rendimiento !== undefined) item.rendimiento = dto.rendimiento?.trim() || null;
        if (dto.proveedorId !== undefined) item.proveedorId = dto.proveedorId ?? null;
        if (dto.precioUnitarioBob !== undefined) {
          item.precioUnitarioBob = dto.precioUnitarioBob != null ? String(dto.precioUnitarioBob) : null;
        }
        if (dto.precioUnitarioUsd !== undefined) {
          item.precioUnitarioUsd = dto.precioUnitarioUsd != null ? String(dto.precioUnitarioUsd) : null;
        }
        await this.itemRepo.save(item);
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
