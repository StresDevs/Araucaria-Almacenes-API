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
import { CategoriasService } from './categorias.service.js';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/index.js';

@Controller('categorias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  async findAll() {
    const categorias = await this.categoriasService.findAll();
    return {
      success: true,
      data: categorias.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        descripcion: c.descripcion,
        created_at: c.createdAt,
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const c = await this.categoriasService.findById(id);
    return {
      success: true,
      data: { id: c.id, nombre: c.nombre, descripcion: c.descripcion },
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(@Body() dto: CreateCategoriaDto) {
    const c = await this.categoriasService.create(dto);
    return {
      success: true,
      message: 'Categoría creada correctamente',
      data: { id: c.id, nombre: c.nombre, descripcion: c.descripcion },
    };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoriaDto,
  ) {
    const c = await this.categoriasService.update(id, dto);
    return {
      success: true,
      message: 'Categoría actualizada correctamente',
      data: { id: c.id, nombre: c.nombre, descripcion: c.descripcion },
    };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriasService.remove(id);
    return { success: true, message: 'Categoría eliminada correctamente' };
  }
}
