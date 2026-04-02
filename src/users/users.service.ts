import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/index.js';
import { CreateUserDto } from './dto/index.js';
import { generateTemporaryPassword } from './utils/index.js';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<{ user: User; temporaryPassword: string }> {
    // Verificar email único
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    // Generar contraseña temporal
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, this.SALT_ROUNDS);

    // Componer nombre completo
    const nombreCompleto = [dto.nombres, dto.primerApellido, dto.segundoApellido]
      .filter(Boolean)
      .join(' ');

    const user = this.usersRepository.create({
      nombres: dto.nombres.trim(),
      primerApellido: dto.primerApellido.trim(),
      segundoApellido: dto.segundoApellido?.trim() || null,
      nombre: nombreCompleto,
      email: dto.email.toLowerCase().trim(),
      telefono: dto.telefono?.trim() || null,
      password: hashedPassword,
      rol: dto.rol,
      activo: true,
      debeCambiarPassword: true,
    });

    const saved = await this.usersRepository.save(user);
    return { user: saved, temporaryPassword };
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await this.usersRepository.update(userId, {
      password: hashed,
      debeCambiarPassword: false,
    });
  }

  async toggleActive(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.activo = !user.activo;
    return this.usersRepository.save(user);
  }
}
