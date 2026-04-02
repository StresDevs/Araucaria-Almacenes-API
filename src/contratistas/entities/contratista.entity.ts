import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Obra } from '../../obras/entities/index.js';

@Entity('contratistas')
export class Contratista {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ length: 200, default: '—' })
  empresa: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string | null;

  @Column({ name: 'obra_id', type: 'uuid', nullable: true })
  obraId: string | null;

  @ManyToOne(() => Obra, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'obra_id' })
  obra: Obra | null;

  @Column({ type: 'varchar', length: 20, default: 'activo' })
  estado: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
