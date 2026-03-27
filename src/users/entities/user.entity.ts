import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enums/index.js';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombres: string;

  @Column({ name: 'primer_apellido', length: 100 })
  primerApellido: string;

  @Column({ type: 'varchar', name: 'segundo_apellido', length: 100, nullable: true })
  segundoApellido: string | null;

  @Column({ length: 150 })
  nombre: string; // nombre completo (generado)

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string | null;

  @Column({ length: 255 })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.LECTOR })
  rol: UserRole;

  @Column({ default: true })
  activo: boolean;

  @Column({ name: 'debe_cambiar_password', default: true })
  debeCambiarPassword: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
