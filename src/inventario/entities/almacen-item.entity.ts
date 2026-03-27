import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Item } from './item.entity.js';
import { Almacen } from '../../almacenes/entities/index.js';

@Entity('almacen_items')
@Unique('uq_almacen_item', ['almacenId', 'itemId'])
export class AlmacenItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'almacen_id', type: 'uuid' })
  almacenId: string;

  @ManyToOne(() => Almacen, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'almacen_id' })
  almacen: Almacen;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ManyToOne(() => Item, (item) => item.almacenItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'int', default: 0 })
  cantidad: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
