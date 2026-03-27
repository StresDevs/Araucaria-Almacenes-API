import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AlmacenesService } from './almacenes.service.js';
import { CreateAlmacenDto, UpdateAlmacenDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/index.js';

@Controller('almacenes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlmacenesController {
  constructor(private readonly almacenesService: AlmacenesService) {}

  /** GET /api/almacenes — Lista todos los almacenes */
  @Get()
  async findAll(@Query('obraId') obraId?: string) {
    const almacenes = obraId
      ? await this.almacenesService.findByObraId(obraId)
      : await this.almacenesService.findAll();

    return {
      success: true,
      data: almacenes.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        tipo_almacen: a.tipoAlmacen,
        direccion: a.direccion,
        estado: a.estado,
        items_count: a.itemsCount,
        obra_id: a.obraId,
        obra_nombre: a.obra?.nombre ?? null,
      })),
    };
  }

  /** GET /api/almacenes/:id — Detalle de un almacén */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const a = await this.almacenesService.findById(id);
    return {
      success: true,
      data: {
        id: a.id,
        nombre: a.nombre,
        tipo_almacen: a.tipoAlmacen,
        direccion: a.direccion,
        estado: a.estado,
        items_count: a.itemsCount,
        obra_id: a.obraId,
        obra_nombre: a.obra?.nombre ?? null,
      },
    };
  }

  /** POST /api/almacenes — Crear almacén (admin y supervisor) */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(@Body() dto: CreateAlmacenDto) {
    const a = await this.almacenesService.create(dto);
    return {
      success: true,
      message: 'Almacén creado correctamente',
      data: {
        id: a.id,
        nombre: a.nombre,
        tipo_almacen: a.tipoAlmacen,
        direccion: a.direccion,
        estado: a.estado,
        items_count: a.itemsCount,
        obra_id: a.obraId,
      },
    };
  }

  /** PATCH /api/almacenes/:id — Actualizar almacén (admin y supervisor) */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlmacenDto,
  ) {
    const a = await this.almacenesService.update(id, dto);
    return {
      success: true,
      message: 'Almacén actualizado correctamente',
      data: {
        id: a.id,
        nombre: a.nombre,
        tipo_almacen: a.tipoAlmacen,
        direccion: a.direccion,
        estado: a.estado,
        items_count: a.itemsCount,
        obra_id: a.obraId,
      },
    };
  }

  /** PATCH /api/almacenes/:id/toggle-active — Activar/desactivar almacén */
  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    const a = await this.almacenesService.toggleActive(id);
    return {
      success: true,
      message: a.estado === 'activo' ? 'Almacén activado' : 'Almacén desactivado',
      data: { id: a.id, estado: a.estado },
    };
  }

  /** DELETE /api/almacenes/:id — Eliminar almacén (solo admin) */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.almacenesService.remove(id);
    return {
      success: true,
      message: 'Almacén eliminado correctamente',
    };
  }
}
