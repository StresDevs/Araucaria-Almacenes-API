import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Sectorizacion } from './sectorizacion.entity';

@Entity('sectorizacion_archivos')
export class SectorizacionArchivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sectorizacion_id', type: 'uuid' })
  sectorizacionId: string;

  @Column({ name: 'nombre_archivo', length: 255 })
  nombreArchivo: string;

  @Column({ name: 'nombre_original', length: 255 })
  nombreOriginal: string;

  @Column({ length: 100, default: 'application/pdf' })
  mimetype: string;

  @Column({ name: 'tamanio', type: 'int' })
  tamanio: number;

  @Column({ type: 'text' })
  url: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Sectorizacion, (s) => s.archivos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sectorizacion_id' })
  sectorizacion: Sectorizacion;
}
