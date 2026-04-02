import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudBaja } from './entities/index.js';
import { CreateBajaDto } from './dto/index.js';
import { EstadoBaja, MotivoBaja } from './enums/index.js';
import { Item } from '../inventario/entities/item.entity.js';

@Injectable()
export class BajasService {
  constructor(
    @InjectRepository(SolicitudBaja)
    private readonly bajaRepo: Repository<SolicitudBaja>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
  ) {}

  /** Create a new baja request */
  async create(
    dto: CreateBajaDto,
    solicitanteId: string,
    evidenciaUrl: string | null,
    evidenciaNombre: string | null,
  ): Promise<SolicitudBaja> {
    // Validate item exists
    const item = await this.itemRepo.findOne({ where: { id: dto.itemId } });
    if (!item) {
      throw new NotFoundException('El item no existe');
    }

    // Validate cantidad doesn't exceed stock
    if (dto.cantidad > item.stockTotal) {
      throw new BadRequestException(
        `La cantidad (${dto.cantidad}) excede el stock disponible (${item.stockTotal})`,
      );
    }

    // For daño or vencimiento, evidence is mandatory
    if (
      (dto.motivo === MotivoBaja.DANO || dto.motivo === MotivoBaja.VENCIMIENTO) &&
      !evidenciaUrl
    ) {
      throw new BadRequestException(
        'Para motivos de daño o vencimiento, la evidencia fotográfica es obligatoria',
      );
    }

    const baja = this.bajaRepo.create({
      itemId: dto.itemId,
      cantidad: dto.cantidad,
      motivo: dto.motivo,
      descripcionMotivo: dto.descripcionMotivo,
      evidenciaUrl,
      evidenciaNombre,
      solicitanteId,
      estado: EstadoBaja.PENDIENTE,
    });

    return this.bajaRepo.save(baja);
  }

  /** List all bajas (optionally filter by estado) */
  async findAll(estado?: EstadoBaja): Promise<SolicitudBaja[]> {
    const qb = this.bajaRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.item', 'item')
      .leftJoinAndSelect('item.categoria', 'categoria')
      .leftJoinAndSelect('b.solicitante', 'solicitante')
      .leftJoinAndSelect('b.revisadoPor', 'revisadoPor')
      .orderBy('b.createdAt', 'DESC');

    if (estado) {
      qb.where('b.estado = :estado', { estado });
    }

    return qb.getMany();
  }

  /** Find by id */
  async findOne(id: string): Promise<SolicitudBaja> {
    const baja = await this.bajaRepo.findOne({
      where: { id },
      relations: ['item', 'item.categoria', 'solicitante', 'revisadoPor'],
    });
    if (!baja) {
      throw new NotFoundException('Solicitud de baja no encontrada');
    }
    return baja;
  }

  /** Approve a baja – admin only */
  async aprobar(id: string, adminId: string): Promise<SolicitudBaja> {
    const baja = await this.findOne(id);
    if (baja.estado !== EstadoBaja.PENDIENTE) {
      throw new BadRequestException('Esta solicitud ya fue revisada');
    }

    baja.estado = EstadoBaja.APROBADA;
    baja.revisadoPorId = adminId;
    baja.fechaRevision = new Date();

    // Discount stock
    const item = await this.itemRepo.findOne({ where: { id: baja.itemId } });
    if (item) {
      item.stockTotal = Math.max(0, item.stockTotal - baja.cantidad);
      await this.itemRepo.save(item);
    }

    return this.bajaRepo.save(baja);
  }

  /** Reject a baja – admin only */
  async rechazar(
    id: string,
    adminId: string,
    notasRevision?: string,
  ): Promise<SolicitudBaja> {
    const baja = await this.findOne(id);
    if (baja.estado !== EstadoBaja.PENDIENTE) {
      throw new BadRequestException('Esta solicitud ya fue revisada');
    }

    baja.estado = EstadoBaja.RECHAZADA;
    baja.revisadoPorId = adminId;
    baja.fechaRevision = new Date();
    baja.notasRevision = notasRevision || null;

    return this.bajaRepo.save(baja);
  }
}
