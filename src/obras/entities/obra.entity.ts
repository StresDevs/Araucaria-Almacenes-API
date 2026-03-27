import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ObraEstado } from '../enums/index.js';

@Entity('obras')
export class Obra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  nombre: string;

  @Column({ type: 'enum', enum: ObraEstado, default: ObraEstado.ACTIVA })
  estado: ObraEstado;

  @Column({ type: 'varchar', length: 300, nullable: true })
  ubicacion: string | null;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  responsable: string | null;

  @Column({ name: 'items_total', type: 'int', default: 0 })
  itemsTotal: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
