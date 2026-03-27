import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transferencia } from './transferencia.entity.js';
import { Almacen } from '../../almacenes/entities/index.js';
import { Item } from '../../inventario/entities/index.js';

@Entity('transferencia_items')
export class TransferenciaItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transferencia_id', type: 'uuid' })
  transferenciaId: string;

  @ManyToOne(() => Transferencia, (t) => t.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'transferencia_id' })
  transferencia: Transferencia;

  @Column({ name: 'almacen_destino_id', type: 'uuid' })
  almacenDestinoId: string;

  @ManyToOne(() => Almacen, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'almacen_destino_id' })
  almacenDestino: Almacen;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @ManyToOne(() => Item, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'int' })
  cantidad: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
