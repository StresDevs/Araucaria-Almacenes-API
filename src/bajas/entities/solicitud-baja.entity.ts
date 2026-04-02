import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MotivoBaja, EstadoBaja } from '../enums/index.js';
import { Item } from '../../inventario/entities/item.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('solicitudes_baja')
export class SolicitudBaja {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'enum', enum: MotivoBaja })
  motivo: MotivoBaja;

  @Column({ name: 'descripcion_motivo', type: 'text' })
  descripcionMotivo: string;

  @Column({ name: 'evidencia_url', type: 'varchar', length: 500, nullable: true })
  evidenciaUrl: string | null;

  @Column({ name: 'evidencia_nombre', type: 'varchar', length: 255, nullable: true })
  evidenciaNombre: string | null;

  @Column({ type: 'enum', enum: EstadoBaja, default: EstadoBaja.PENDIENTE })
  estado: EstadoBaja;

  @Column({ name: 'solicitante_id', type: 'uuid' })
  solicitanteId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'solicitante_id' })
  solicitante: User;

  @Column({ name: 'revisado_por_id', type: 'uuid', nullable: true })
  revisadoPorId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'revisado_por_id' })
  revisadoPor: User | null;

  @Column({ name: 'fecha_revision', type: 'timestamptz', nullable: true })
  fechaRevision: Date | null;

  @Column({ name: 'notas_revision', type: 'text', nullable: true })
  notasRevision: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
