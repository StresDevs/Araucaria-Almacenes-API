import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TipoAprobacion, EstadoAprobacion } from '../enums/index.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('solicitudes_aprobacion')
export class SolicitudAprobacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoAprobacion })
  tipo: TipoAprobacion;

  @Column({ length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'enum', enum: EstadoAprobacion, default: EstadoAprobacion.PENDIENTE })
  estado: EstadoAprobacion;

  // ─── Solicitante ──
  @Column({ name: 'solicitante_id', type: 'uuid' })
  solicitanteId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'solicitante_id' })
  solicitanteUser: User;

  // ─── Revisado por ──
  @Column({ name: 'revisado_por_id', type: 'uuid', nullable: true })
  revisadoPorId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'revisado_por_id' })
  revisadoPorUser: User | null;

  @Column({ name: 'fecha_revision', type: 'timestamptz', nullable: true })
  fechaRevision: Date | null;

  @Column({ name: 'notas_revision', type: 'text', nullable: true })
  notasRevision: string | null;

  // ─── baja_producto fields ──
  @Column({ name: 'item_codigo', type: 'varchar', length: 150, nullable: true })
  itemCodigo: string | null;

  @Column({ name: 'item_descripcion', type: 'text', nullable: true })
  itemDescripcion: string | null;

  @Column({ name: 'item_cantidad', type: 'int', nullable: true })
  itemCantidad: number | null;

  @Column({ name: 'motivo_baja', type: 'varchar', length: 50, nullable: true })
  motivoBaja: string | null;

  @Column({ name: 'evidencia_url', type: 'varchar', length: 500, nullable: true })
  evidenciaUrl: string | null;

  // ─── baja_ref: FK to solicitudes_baja ──
  @Column({ name: 'baja_ref_id', type: 'uuid', nullable: true })
  bajaRefId: string | null;

  // ─── edicion_stock fields ──
  @Column({ name: 'campo_editado', type: 'varchar', length: 100, nullable: true })
  campoEditado: string | null;

  @Column({ name: 'valor_anterior', type: 'varchar', length: 255, nullable: true })
  valorAnterior: string | null;

  @Column({ name: 'valor_nuevo', type: 'varchar', length: 255, nullable: true })
  valorNuevo: string | null;

  // ─── edicion_inventario fields ──
  @Column({ name: 'item_id', type: 'uuid', nullable: true })
  itemId: string | null;

  @Column({ name: 'justificacion', type: 'text', nullable: true })
  justificacion: string | null;

  @Column({ name: 'cambios_propuestos', type: 'jsonb', nullable: true })
  cambiosPropuestos: { campo: string; anterior: string; nuevo: string }[] | null;

  @Column({ name: 'update_dto', type: 'jsonb', nullable: true })
  updateDto: Record<string, any> | null;

  // ─── transferencia_atrasada fields ──
  @Column({ name: 'almacen_origen', type: 'varchar', length: 255, nullable: true })
  almacenOrigen: string | null;

  @Column({ name: 'almacen_destino', type: 'varchar', length: 255, nullable: true })
  almacenDestino: string | null;

  @Column({ name: 'fecha_transferencia', type: 'date', nullable: true })
  fechaTransferencia: string | null;

  @Column({ name: 'fecha_registro', type: 'date', nullable: true })
  fechaRegistro: string | null;

  @Column({ name: 'items_transferencia', type: 'jsonb', nullable: true })
  itemsTransferencia: { codigo: string; descripcion: string; cantidad: number; unidad: string }[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
