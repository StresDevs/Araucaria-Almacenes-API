import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sectorizacion } from './sectorizacion.entity.js';

@Entity('sectorizacion_sectores')
export class SectorizacionSector {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sectorizacion_id', type: 'uuid' })
  sectorizacionId: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 20 })
  color: string;

  @Column({ type: 'int' })
  numero: number;

  @ManyToOne(() => Sectorizacion, (s) => s.sectores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectorizacion_id' })
  sectorizacion: Sectorizacion;
}
