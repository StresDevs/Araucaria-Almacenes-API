import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from './enums/index.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** POST /api/users — Solo admin puede crear usuarios */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateUserDto) {
    const { user, temporaryPassword } = await this.usersService.create(dto);
    return {
      success: true,
      message: 'Usuario creado correctamente',
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        temporaryPassword,
      },
    };
  }

  /** GET /api/users — Lista de usuarios (solo admin) */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        nombres: u.nombres,
        primerApellido: u.primerApellido,
        segundoApellido: u.segundoApellido,
        email: u.email,
        telefono: u.telefono,
        rol: u.rol,
        activo: u.activo,
        debeCambiarPassword: u.debeCambiarPassword,
        createdAt: u.createdAt,
      })),
    };
  }

  /** PATCH /api/users/:id/toggle-active — Activar/desactivar usuario */
  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN)
  async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.toggleActive(id);
    return {
      success: true,
      message: user.activo ? 'Usuario activado' : 'Usuario desactivado',
      data: { id: user.id, activo: user.activo },
    };
  }
}
