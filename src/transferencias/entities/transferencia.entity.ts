import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { TransferenciaEstado } from '../enums/index.js';
import { Almacen } from '../../almacenes/entities/index.js';
import { TransferenciaItem } from './transferencia-item.entity.js';

@Entity('transferencias')
export class Transferencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'almacen_origen_id', type: 'uuid' })
  almacenOrigenId: string;

  @ManyToOne(() => Almacen, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'almacen_origen_id' })
  almacenOrigen: Almacen;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ name: 'evidencia_url', type: 'varchar', length: 500, nullable: true })
  evidenciaUrl: string | null;

  @Column({ type: 'enum', enum: TransferenciaEstado, default: TransferenciaEstado.COMPLETADA })
  estado: TransferenciaEstado;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @OneToMany(() => TransferenciaItem, (ti) => ti.transferencia, { cascade: true })
  items: TransferenciaItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
