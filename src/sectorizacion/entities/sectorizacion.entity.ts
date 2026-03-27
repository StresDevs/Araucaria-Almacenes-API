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
import { Obra } from '../../obras/entities/index.js';
import { SectorizacionEstado } from '../enums/index.js';
import { SectorizacionSector } from './sectorizacion-sector.entity.js';
import { SectorizacionPiso } from './sectorizacion-piso.entity.js';
import { SectorizacionArchivo } from './sectorizacion-archivo.entity.js';

@Entity('sectorizaciones')
export class Sectorizacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'obra_id', type: 'uuid' })
  obraId: string;

  @Column({
    type: 'enum',
    enum: SectorizacionEstado,
    default: SectorizacionEstado.ACTIVA,
  })
  estado: SectorizacionEstado;

  @ManyToOne(() => Obra, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obra_id' })
  obra: Obra;

  @OneToMany(() => SectorizacionSector, (s) => s.sectorizacion, {
    cascade: true,
    eager: true,
  })
  sectores: SectorizacionSector[];

  @OneToMany(() => SectorizacionPiso, (p) => p.sectorizacion, {
    cascade: true,
    eager: true,
  })
  pisos: SectorizacionPiso[];

  @OneToMany(() => SectorizacionArchivo, (a) => a.sectorizacion, {
    cascade: true,
    eager: true,
  })
  archivos: SectorizacionArchivo[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
