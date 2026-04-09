import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto, UpdateUserDto, UpdateCredentialsDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UserRole } from './enums/index.js';
import { EmailService } from '../email/email.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  private mapUser(u: any) {
    return {
      id: u.id,
      nombre: u.nombre,
      nombres: u.nombres,
      primerApellido: u.primerApellido,
      segundoApellido: u.segundoApellido,
      email: u.email,
      username: u.username,
      telefono: u.telefono,
      rol: u.rol,
      activo: u.activo,
      debeCambiarPassword: u.debeCambiarPassword,
      usernameEditado: u.usernameEditado,
      createdAt: u.createdAt,
    };
  }

  /** POST /api/users — Solo admin puede crear usuarios */
  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateUserDto) {
    const { user, temporaryPassword, username } = await this.usersService.create(dto);

    // Send welcome email if user has email (fire-and-forget)
    if (user.email) {
      this.emailService.sendWelcomeCredentials(user.email, user.nombre, temporaryPassword)
        .catch(() => { /* already logged inside service */ });
    }

    return {
      success: true,
      message: 'Usuario creado correctamente',
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        username,
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
      data: users.map((u) => this.mapUser(u)),
    };
  }

  /** GET /api/users/check-username?username=xxx — Verificar disponibilidad */
  @Get('check-username')
  async checkUsername(
    @Query('username') username: string,
    @CurrentUser('id') userId: string,
  ) {
    if (!username || username.length < 2) {
      return { success: true, data: { available: false } };
    }
    const available = await this.usersService.checkUsernameAvailable(username, userId);
    return { success: true, data: { available } };
  }

  /** PATCH /api/users/me/credentials — Actualizar propias credenciales */
  @Patch('me/credentials')
  async updateMyCredentials(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCredentialsDto,
  ) {
    const user = await this.usersService.updateCredentials(userId, dto);
    return {
      success: true,
      message: 'Credenciales actualizadas',
      data: this.mapUser(user),
    };
  }

  /** PATCH /api/users/:id — Admin editar usuario */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async adminUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.usersService.adminUpdate(id, dto);
    return {
      success: true,
      message: 'Usuario actualizado',
      data: this.mapUser(user),
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

  /** PATCH /api/users/:id/reset-password — Admin resetear contraseña */
  @Patch(':id/reset-password')
  @Roles(UserRole.ADMIN)
  async resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findById(id);
    const temporaryPassword = await this.usersService.resetPassword(id);

    // Send reset email if user has email (fire-and-forget)
    if (user.email) {
      this.emailService.sendPasswordReset(user.email, user.nombre, temporaryPassword)
        .catch(() => { /* already logged inside service */ });
    }

    return {
      success: true,
      message: 'Contraseña reseteada',
      data: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        username: user.username,
        temporaryPassword,
      },
    };
  }
}
