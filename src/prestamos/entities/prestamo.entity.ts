import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EstadoPrestamo } from '../enums/index.js';
import { Item } from '../../inventario/entities/item.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Obra } from '../../obras/entities/obra.entity.js';
import { Contratista } from '../../contratistas/entities/contratista.entity.js';

@Entity('prestamos')
export class Prestamo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─── Item prestado ──
  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ length: 50, default: 'unidad' })
  unidad: string;

  // ─── Obra/Sección ──
  @Column({ name: 'obra_id', type: 'uuid', nullable: true })
  obraId: string | null;

  @ManyToOne(() => Obra, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'obra_id' })
  obra: Obra | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  seccion: string | null;

  // ─── Persona / Contratista ──
  @Column({ name: 'persona_prestamo', length: 200 })
  personaPrestamo: string;

  @Column({ name: 'contratista_id', type: 'uuid', nullable: true })
  contratistaId: string | null;

  @ManyToOne(() => Contratista, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contratista_id' })
  contratista: Contratista | null;

  // ─── Estado y tiempos ──
  @Column({ type: 'enum', enum: EstadoPrestamo, default: EstadoPrestamo.PRESTADO })
  estado: EstadoPrestamo;

  @Column({ name: 'hora_prestamo', type: 'varchar', length: 10 })
  horaPrestamo: string;

  @Column({ name: 'hora_devolucion', type: 'varchar', length: 10, nullable: true })
  horaDevolucion: string | null;

  @Column({ name: 'fecha_devolucion', type: 'timestamptz', nullable: true })
  fechaDevolucion: Date | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  // ─── Auditoría ──
  @Column({ name: 'registrado_por_id', type: 'uuid' })
  registradoPorId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registrado_por_id' })
  registradoPor: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
