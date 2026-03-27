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
import { ObrasService } from './obras.service.js';
import { CreateObraDto, UpdateObraDto, CloseObraDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/index.js';

@Controller('obras')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  /** GET /api/obras — Lista todas las obras */
  @Get()
  async findAll() {
    const obras = await this.obrasService.findAll();
    return {
      success: true,
      data: obras.map((o) => ({
        id: o.id,
        nombre: o.nombre,
        estado: o.estado,
        ubicacion: o.ubicacion,
        fecha_inicio: o.fechaInicio,
        fecha_fin: o.fechaFin,
        responsable: o.responsable,
        items_total: o.itemsTotal,
      })),
    };
  }

  /** GET /api/obras/:id — Detalle de obra */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const obra = await this.obrasService.findById(id);
    return {
      success: true,
      data: {
        id: obra.id,
        nombre: obra.nombre,
        estado: obra.estado,
        ubicacion: obra.ubicacion,
        fecha_inicio: obra.fechaInicio,
        fecha_fin: obra.fechaFin,
        responsable: obra.responsable,
        items_total: obra.itemsTotal,
      },
    };
  }

  /** POST /api/obras — Crear obra (admin y supervisor) */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(@Body() dto: CreateObraDto) {
    const obra = await this.obrasService.create(dto);
    return {
      success: true,
      message: 'Obra creada correctamente',
      data: {
        id: obra.id,
        nombre: obra.nombre,
        estado: obra.estado,
        ubicacion: obra.ubicacion,
        fecha_inicio: obra.fechaInicio,
        responsable: obra.responsable,
        items_total: obra.itemsTotal,
      },
    };
  }

  /** PATCH /api/obras/:id — Actualizar obra (admin y supervisor) */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateObraDto,
  ) {
    const obra = await this.obrasService.update(id, dto);
    return {
      success: true,
      message: 'Obra actualizada correctamente',
      data: {
        id: obra.id,
        nombre: obra.nombre,
        estado: obra.estado,
        ubicacion: obra.ubicacion,
        fecha_inicio: obra.fechaInicio,
        responsable: obra.responsable,
        items_total: obra.itemsTotal,
      },
    };
  }

  /** PATCH /api/obras/:id/close — Cerrar obra (admin y supervisor) */
  @Patch(':id/close')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseObraDto,
  ) {
    const obra = await this.obrasService.close(id, dto);
    return {
      success: true,
      message: 'Obra cerrada correctamente',
      data: {
        id: obra.id,
        nombre: obra.nombre,
        estado: obra.estado,
        fecha_fin: obra.fechaFin,
      },
    };
  }

  /** DELETE /api/obras/:id — Eliminar obra (solo admin) */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.obrasService.remove(id);
    return {
      success: true,
      message: 'Obra eliminada correctamente',
    };
  }
}
