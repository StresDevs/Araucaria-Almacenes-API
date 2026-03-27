import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { LoginDto, ChangePasswordDto } from './dto/index.js';
import { JwtPayload } from './interfaces/index.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      debeCambiarPassword: user.debeCambiarPassword,
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          debeCambiarPassword: user.debeCambiarPassword,
        },
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    await this.usersService.updatePassword(userId, dto.newPassword);
    
    // Re-generar token con debeCambiarPassword=false
    const user = await this.usersService.findById(userId);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      debeCambiarPassword: false,
    };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
      data: {
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          debeCambiarPassword: false,
        },
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
        telefono: user.telefono,
        rol: user.rol,
        debeCambiarPassword: user.debeCambiarPassword,
      },
    };
  }
}
