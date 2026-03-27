import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AlmacenTipo, AlmacenEstado } from '../enums/index.js';
import { Obra } from '../../obras/entities/index.js';

@Entity('almacenes')
export class Almacen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ name: 'tipo_almacen', type: 'enum', enum: AlmacenTipo })
  tipoAlmacen: AlmacenTipo;

  @Column({ type: 'varchar', length: 300, nullable: true })
  direccion: string | null;

  @Column({ type: 'enum', enum: AlmacenEstado, default: AlmacenEstado.ACTIVO })
  estado: AlmacenEstado;

  @Column({ name: 'items_count', type: 'int', default: 0 })
  itemsCount: number;

  @Column({ name: 'obra_id', type: 'uuid', nullable: true })
  obraId: string | null;

  @ManyToOne(() => Obra, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'obra_id' })
  obra: Obra | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
