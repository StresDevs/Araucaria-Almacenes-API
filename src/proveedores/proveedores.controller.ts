import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProveedoresService } from './proveedores.service.js';
import { CreateProveedorDto, UpdateProveedorDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/index.js';

@Controller('proveedores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Get()
  async findAll() {
    const proveedores = await this.proveedoresService.findAll();
    return {
      success: true,
      data: proveedores.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        telefono: p.telefono,
        created_at: p.createdAt,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const p = await this.proveedoresService.findById(id);
    return {
      success: true,
      data: { id: p.id, nombre: p.nombre, telefono: p.telefono },
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(@Body() dto: CreateProveedorDto) {
    const p = await this.proveedoresService.create(dto);
    return {
      success: true,
      message: 'Proveedor creado correctamente',
      data: { id: p.id, nombre: p.nombre, telefono: p.telefono },
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProveedorDto,
  ) {
    const p = await this.proveedoresService.update(id, dto);
    return {
      success: true,
      message: 'Proveedor actualizado correctamente',
      data: { id: p.id, nombre: p.nombre, telefono: p.telefono },
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.proveedoresService.remove(id);
    return { success: true, message: 'Proveedor eliminado correctamente' };
  }
}
