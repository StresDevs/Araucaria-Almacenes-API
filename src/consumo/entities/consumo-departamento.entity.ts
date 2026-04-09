import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('consumo_departamento')
export class ConsumoDepartamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'obra_id', type: 'uuid' })
  obraId: string;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @Column({ name: 'departamento_id', type: 'uuid' })
  departamentoId: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  cantidad: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
