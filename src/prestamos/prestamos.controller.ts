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
import { PrestamosService } from './prestamos.service.js';
import { CreatePrestamoDto, DevolverPrestamoDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/index.js';
import { UserRole } from '../users/enums/index.js';

function mapPrestamo(p: any) {
  return {
    id: p.id,
    item_id: p.itemId,
    item_codigo: p.item?.codigo ?? '',
    item_nombre: p.item?.nombre ?? '',
    item_descripcion: p.item?.descripcion ?? '',
    item_categoria: p.item?.categoria?.nombre ?? 'Sin categoría',
    cantidad: p.cantidad,
    unidad: p.unidad,
    obra_id: p.obraId,
    obra_nombre: p.obra?.nombre ?? null,
    seccion: p.seccion,
    persona_prestamo: p.personaPrestamo,
    contratista_id: p.contratistaId,
    contratista_nombre: p.contratista?.nombre ?? null,
    contratista_empresa: p.contratista?.empresa ?? null,
    estado: p.estado,
    hora_prestamo: p.horaPrestamo,
    hora_devolucion: p.horaDevolucion,
    fecha_devolucion: p.fechaDevolucion,
    notas: p.notas,
    registrado_por: p.registradoPor?.nombre ?? '',
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

@Controller('prestamos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrestamosController {
  constructor(private readonly prestamosService: PrestamosService) {}

  /** POST /api/prestamos — Register a new loan (salida) */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(
    @Body() dto: CreatePrestamoDto,
    @CurrentUser('id') userId: string,
  ) {
    const prestamo = await this.prestamosService.create(dto, userId);
    const full = await this.prestamosService.findOne(prestamo.id);
    return { success: true, data: mapPrestamo(full), message: 'Préstamo registrado' };
  }

  /** GET /api/prestamos?estado=&obraId=&search= */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async findAll(
    @Query('estado') estado?: string,
    @Query('obraId') obraId?: string,
    @Query('search') search?: string,
  ) {
    const list = await this.prestamosService.findAll(estado, obraId, search);
    return { success: true, data: list.map(mapPrestamo) };
  }

  /** GET /api/prestamos/stats */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async stats() {
    const stats = await this.prestamosService.getStats();
    return { success: true, data: stats };
  }

  /** GET /api/prestamos/:id */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const p = await this.prestamosService.findOne(id);
    return { success: true, data: mapPrestamo(p) };
  }

  /** PATCH /api/prestamos/:id/devolver — Mark as returned or consumed */
  @Patch(':id/devolver')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async devolver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DevolverPrestamoDto,
  ) {
    const p = await this.prestamosService.devolver(
      id,
      dto.estado || 'devuelto',
      dto.notas,
    );
    const full = await this.prestamosService.findOne(p.id);
    return { success: true, data: mapPrestamo(full), message: 'Préstamo actualizado' };
  }
}
