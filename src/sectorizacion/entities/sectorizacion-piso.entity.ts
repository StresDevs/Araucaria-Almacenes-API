import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Sectorizacion } from './sectorizacion.entity.js';
import { SectorizacionDepartamento } from './sectorizacion-departamento.entity.js';

@Entity('sectorizacion_pisos')
export class SectorizacionPiso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sectorizacion_id', type: 'uuid' })
  sectorizacionId: string;

  @Column({ type: 'int' })
  numero: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @ManyToOne(() => Sectorizacion, (s) => s.pisos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectorizacion_id' })
  sectorizacion: Sectorizacion;

  @OneToMany(() => SectorizacionDepartamento, (d) => d.piso, { cascade: true, eager: true })
  departamentos: SectorizacionDepartamento[];
}
