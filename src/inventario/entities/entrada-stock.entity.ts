import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Item } from './item.entity.js';
import { Almacen } from '../../almacenes/entities/index.js';

@Entity('entradas_stock')
export class EntradaStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'almacen_id', type: 'uuid' })
  almacenId: string;

  @ManyToOne(() => Almacen, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'registrado_por', type: 'uuid', nullable: true })
  registradoPor: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
