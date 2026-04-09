import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { LoginDto, ChangePasswordDto } from './dto/index.js';
import { JwtPayload } from './interfaces/index.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private buildPayload(user: { id: string; email: string | null; username: string | null; rol: string; debeCambiarPassword: boolean }): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      username: user.username,
      rol: user.rol,
      debeCambiarPassword: user.debeCambiarPassword,
    };
  }

  private buildUserResponse(user: any) {
    return {
      id: user.id,
      nombre: user.nombre,
      nombres: user.nombres,
      primerApellido: user.primerApellido,
      email: user.email,
      username: user.username,
      rol: user.rol,
      debeCambiarPassword: user.debeCambiarPassword,
      usernameEditado: user.usernameEditado,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByIdentifier(dto.identifier);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.activo) {
      throw new UnauthorizedException('Tu cuenta ha sido desactivada. Contacta al administrador.');
    }

    // Check brute force lock
    if (this.usersService.isBlocked(user)) {
      const remaining = Math.ceil((user.bloqueadoHasta!.getTime() - Date.now()) / 1000);
      throw new ForbiddenException(
        `Demasiados intentos fallidos. Intenta de nuevo en ${remaining} segundos.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      const result = await this.usersService.recordFailedAttempt(user.id);
      if (result.blocked) {
        throw new ForbiddenException(
          'Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por 2 minutos.',
        );
      }
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Successful login — clear failed attempts
    await this.usersService.clearFailedAttempts(user.id);

    const payload = this.buildPayload(user);
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      data: {
        token,
        user: this.buildUserResponse(user),
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    await this.usersService.updatePassword(userId, dto.newPassword);
    
    // Re-generar token con debeCambiarPassword=false
    const user = await this.usersService.findById(userId);
    const payload = this.buildPayload({ ...user, debeCambiarPassword: false });
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
      data: {
        token,
        user: this.buildUserResponse({ ...user, debeCambiarPassword: false }),
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    return {
      success: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        nombres: user.nombres,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        email: user.email,
        username: user.username,
        telefono: user.telefono,
        rol: user.rol,
        debeCambiarPassword: user.debeCambiarPassword,
        usernameEditado: user.usernameEditado,
      },
    };
  }
}
