import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/index.js';
import { CreateUserDto, UpdateUserDto, UpdateCredentialsDto } from './dto/index.js';
import { generateTemporaryPassword } from './utils/index.js';

@Injectable()
export class UsersService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /** Generate a username from names: j.garcia, j.garcia1, j.garcia2... */
  private async generateUsername(nombres: string, primerApellido: string): Promise<string> {
    const initial = nombres.charAt(0).toLowerCase();
    const apellido = primerApellido.toLowerCase().replace(/[^a-z]/g, '');
    const base = `${initial}.${apellido}`;

    let candidate = base;
    let counter = 0;

    while (true) {
      const existing = await this.usersRepository.findOne({ where: { username: candidate } });
      if (!existing) return candidate;
      counter++;
      candidate = `${base}${counter}`;
    }
  }

  async create(dto: CreateUserDto): Promise<{ user: User; temporaryPassword: string; username: string | null }> {
    // Verificar que tenga email o sinCorreo
    const hasEmail = dto.email && !dto.sinCorreo;

    if (hasEmail) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email!.toLowerCase().trim() },
      });
      if (existing) {
        throw new ConflictException('Ya existe un usuario con ese email');
      }
    }

    // Generar contraseña temporal
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, this.SALT_ROUNDS);

    // Componer nombre completo
    const nombreCompleto = [dto.nombres, dto.primerApellido, dto.segundoApellido]
      .filter(Boolean)
      .join(' ');

    // Si no tiene email, generar username automáticamente
    let username: string | null = null;
    if (!hasEmail) {
      username = await this.generateUsername(dto.nombres, dto.primerApellido);
    }

    const user = this.usersRepository.create({
      nombres: dto.nombres.trim(),
      primerApellido: dto.primerApellido.trim(),
      segundoApellido: dto.segundoApellido?.trim() || null,
      nombre: nombreCompleto,
      email: hasEmail ? dto.email!.toLowerCase().trim() : null,
      username,
      telefono: dto.telefono?.trim() || null,
      password: hashedPassword,
      rol: dto.rol,
      activo: true,
      debeCambiarPassword: true,
      usernameEditado: false,
      intentosFallidos: 0,
      bloqueadoHasta: null,
    });

    const saved = await this.usersRepository.save(user);
    return { user: saved, temporaryPassword, username };
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

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username: username.toLowerCase().trim() },
    });
  }

  /** Find by email or username for login */
  async findByIdentifier(identifier: string): Promise<User | null> {
    const trimmed = identifier.trim().toLowerCase();
    // Try email first, then username
    const byEmail = await this.usersRepository.findOne({ where: { email: trimmed } });
    if (byEmail) return byEmail;
    return this.usersRepository.findOne({ where: { username: trimmed } });
  }

  async checkUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const existing = await this.usersRepository.findOne({
      where: { username: username.toLowerCase().trim() },
    });
    if (!existing) return true;
    if (excludeUserId && existing.id === excludeUserId) return true;
    return false;
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
    await this.usersRepository.update(userId, {
      password: hashed,
      debeCambiarPassword: false,
    });
  }

  async resetPassword(userId: string): Promise<string> {
    const user = await this.findById(userId);
    const temporaryPassword = generateTemporaryPassword();
    const hashed = await bcrypt.hash(temporaryPassword, this.SALT_ROUNDS);
    await this.usersRepository.update(userId, {
      password: hashed,
      debeCambiarPassword: true,
    });
    return temporaryPassword;
  }

  async toggleActive(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.activo = !user.activo;
    return this.usersRepository.save(user);
  }

  /** Admin update: can change anything freely */
  async adminUpdate(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    if (dto.email !== undefined) {
      if (dto.email) {
        const existing = await this.usersRepository.findOne({
          where: { email: dto.email.toLowerCase().trim() },
        });
        if (existing && existing.id !== userId) {
          throw new ConflictException('Ya existe un usuario con ese email');
        }
        user.email = dto.email.toLowerCase().trim();
      } else {
        // Can't remove email if no username
        if (!user.username) {
          throw new BadRequestException('El usuario debe tener al menos email o nombre de usuario');
        }
        user.email = null;
      }
    }

    if (dto.username !== undefined) {
      if (dto.username) {
        const available = await this.checkUsernameAvailable(dto.username, userId);
        if (!available) {
          throw new ConflictException('El nombre de usuario ya está en uso');
        }
        user.username = dto.username.toLowerCase().trim();
      } else {
        if (!user.email) {
          throw new BadRequestException('El usuario debe tener al menos email o nombre de usuario');
        }
        user.username = null;
      }
    }

    if (dto.nombres) user.nombres = dto.nombres.trim();
    if (dto.primerApellido) user.primerApellido = dto.primerApellido.trim();
    if (dto.segundoApellido !== undefined) user.segundoApellido = dto.segundoApellido?.trim() || null;
    if (dto.telefono !== undefined) user.telefono = dto.telefono?.trim() || null;
    if (dto.rol) user.rol = dto.rol;

    // Recompute nombre completo
    user.nombre = [user.nombres, user.primerApellido, user.segundoApellido]
      .filter(Boolean)
      .join(' ');

    return this.usersRepository.save(user);
  }

  /** Self-service credential update: username can only be set once */
  async updateCredentials(userId: string, dto: UpdateCredentialsDto): Promise<User> {
    const user = await this.findById(userId);

    if (dto.username !== undefined && dto.username) {
      if (user.usernameEditado) {
        throw new BadRequestException('El nombre de usuario solo puede ser editado una vez');
      }
      const available = await this.checkUsernameAvailable(dto.username, userId);
      if (!available) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }
      user.username = dto.username.toLowerCase().trim();
      user.usernameEditado = true;
    }

    if (dto.email !== undefined && dto.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Ya existe un usuario con ese email');
      }
      user.email = dto.email.toLowerCase().trim();
    }

    return this.usersRepository.save(user);
  }

  /** Record a failed login attempt */
  async recordFailedAttempt(userId: string): Promise<{ blocked: boolean; blockedUntil: Date | null }> {
    const user = await this.findById(userId);
    user.intentosFallidos += 1;

    if (user.intentosFallidos >= 5) {
      user.bloqueadoHasta = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    }

    await this.usersRepository.save(user);
    return {
      blocked: user.intentosFallidos >= 5,
      blockedUntil: user.bloqueadoHasta,
    };
  }

  /** Clear failed attempts on successful login */
  async clearFailedAttempts(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      intentosFallidos: 0,
      bloqueadoHasta: null,
    });
  }

  /** Check if user is currently blocked */
  isBlocked(user: User): boolean {
    if (!user.bloqueadoHasta) return false;
    return new Date() < user.bloqueadoHasta;
  }
}
