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
import { SolicitudEstado } from '../enums/index.js';
import { Obra } from '../../obras/entities/index.js';
import { Contratista } from '../../contratistas/entities/index.js';
import { SolicitudItem } from './solicitud-item.entity.js';

@Entity('solicitudes')
export class Solicitud {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'numero_orden', type: 'varchar', length: 30, unique: true })
  numeroOrden: string;

  @Column({ name: 'obra_id', type: 'uuid' })
  obraId: string;

  @ManyToOne(() => Obra, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'obra_id' })
  obra: Obra;

  @Column({ name: 'contratista_id', type: 'uuid' })
  contratistaId: string;

  @ManyToOne(() => Contratista, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: Contratista;

  @Column({ name: 'tipo_trabajo', type: 'varchar', length: 100, nullable: true })
  tipoTrabajo: string | null;

  @Column({ type: 'varchar', length: 250 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'varchar', length: 100 })
  sector: string;

  @Column({ type: 'varchar', length: 100 })
  piso: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  departamento: string | null;

  @Column({ name: 'duracion_dias', type: 'int', nullable: true, default: null })
  duracionDias: number | null;

  @Column({ name: 'total_items', type: 'int', default: 0 })
  totalItems: number;

  @Column({ name: 'total_unidades', type: 'int', default: 0 })
  totalUnidades: number;

  @Column({ type: 'enum', enum: SolicitudEstado, default: SolicitudEstado.COMPLETADA })
  estado: SolicitudEstado;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @OneToMany(() => SolicitudItem, (si) => si.solicitud, { cascade: true })
  items: SolicitudItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
