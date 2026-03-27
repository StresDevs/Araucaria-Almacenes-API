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
import { ItemOrigen } from '../enums/index.js';
import { Categoria } from '../../categorias/entities/index.js';
import { Proveedor } from '../../proveedores/entities/index.js';
import { AlmacenItem } from './almacen-item.entity.js';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tipo_origen', type: 'enum', enum: ItemOrigen })
  tipoOrigen: ItemOrigen;

  @Column({ name: 'categoria_id', type: 'uuid', nullable: true })
  categoriaId: string | null;

  @ManyToOne(() => Categoria, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria | null;

  @Column({ name: 'item_numero', type: 'varchar', length: 50, nullable: true })
  itemNumero: string | null;

  @Column({ length: 150 })
  codigo: string;

  @Column({ type: 'varchar', length: 250, nullable: true })
  nombre: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ length: 50, default: 'unidad' })
  unidad: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  rendimiento: string | null;

  @Column({ name: 'proveedor_id', type: 'uuid', nullable: true })
  proveedorId: string | null;

  @ManyToOne(() => Proveedor, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor | null;

  @Column({ name: 'precio_unitario_bob', type: 'numeric', precision: 12, scale: 2, nullable: true })
  precioUnitarioBob: string | null;

  @Column({ name: 'precio_unitario_usd', type: 'numeric', precision: 12, scale: 2, nullable: true })
  precioUnitarioUsd: string | null;

  @Column({ name: 'foto_url', type: 'varchar', length: 500, nullable: true })
  fotoUrl: string | null;

  @Column({ name: 'stock_total', type: 'int', default: 0 })
  stockTotal: number;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => AlmacenItem, (ai) => ai.item)
  almacenItems: AlmacenItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
