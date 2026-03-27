import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SectorizacionPiso } from './sectorizacion-piso.entity.js';

@Entity('sectorizacion_departamentos')
export class SectorizacionDepartamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'piso_id', type: 'uuid' })
  pisoId: string;

  @Column({ length: 10 })
  letra: string;

  @Column({ length: 100, default: '' })
  nombre: string;

  @Column({ name: 'sector_numero', type: 'int' })
  sectorNumero: number;

  @ManyToOne(() => SectorizacionPiso, (p) => p.departamentos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'piso_id' })
  piso: SectorizacionPiso;
}
