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
import { SectorizacionService } from './sectorizacion.service.js';
import { CreateSectorizacionDto, UpdateSectorizacionDto, AddArchivoDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/index.js';

@Controller('sectorizacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SectorizacionController {
  constructor(private readonly sectorizacionService: SectorizacionService) {}

  /** GET /api/sectorizacion — Lista sectorizaciones activas */
  @Get()
  async findAll() {
    const items = await this.sectorizacionService.findAll();
    return {
      success: true,
      data: items.map((s) => this.mapToResponse(s)),
    };
  }

  /** GET /api/sectorizacion/desactivadas — Lista sectorizaciones desactivadas */
  @Get('desactivadas')
  async findDesactivadas() {
    const items = await this.sectorizacionService.findDesactivadas();
    return {
      success: true,
      data: items.map((s) => this.mapToResponse(s)),
    };
  }

  /** GET /api/sectorizacion/:id — Detalle de una sectorización */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const s = await this.sectorizacionService.findById(id);
    return {
      success: true,
      data: this.mapToResponse(s),
    };
  }

  /** POST /api/sectorizacion — Crear sectorización (admin y supervisor) */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(@Body() dto: CreateSectorizacionDto) {
    const s = await this.sectorizacionService.create(dto);
    return {
      success: true,
      message: 'Sectorización creada correctamente',
      data: this.mapToResponse(s),
    };
  }

  /** PATCH /api/sectorizacion/:id — Actualizar sectorización (admin y supervisor) */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSectorizacionDto,
  ) {
    const s = await this.sectorizacionService.update(id, dto);
    return {
      success: true,
      message: 'Sectorización actualizada correctamente',
      data: this.mapToResponse(s),
    };
  }

  /** PATCH /api/sectorizacion/:id/toggle-active — Activar/desactivar */
  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    const s = await this.sectorizacionService.toggleActive(id);
    return {
      success: true,
      message:
        s.estado === 'activa'
          ? 'Sectorización activada'
          : 'Sectorización desactivada',
      data: { id: s.id, estado: s.estado },
    };
  }

  /** POST /api/sectorizacion/:id/archivos — Agregar archivo PDF */
  @Post(':id/archivos')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async addArchivo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddArchivoDto,
  ) {
    const archivo = await this.sectorizacionService.addArchivo(id, dto);
    return {
      success: true,
      message: 'Archivo agregado correctamente',
      data: {
        id: archivo.id,
        nombre_original: archivo.nombreOriginal,
        nombre_archivo: archivo.nombreArchivo,
        url: archivo.url,
        mimetype: archivo.mimetype,
        tamanio: archivo.tamanio,
        created_at: archivo.createdAt,
      },
    };
  }

  /** DELETE /api/sectorizacion/archivos/:archivoId — Eliminar archivo */
  @Delete('archivos/:archivoId')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async removeArchivo(@Param('archivoId', ParseUUIDPipe) archivoId: string) {
    await this.sectorizacionService.removeArchivo(archivoId);
    return {
      success: true,
      message: 'Archivo eliminado correctamente',
    };
  }

  /* ── helpers ───────────────────────────────────────────────── */

  private mapToResponse(s: any) {
    return {
      id: s.id,
      obra_id: s.obraId,
      nombre_obra: s.obra?.nombre ?? null,
      estado: s.estado,
      sectores: (s.sectores || [])
        .sort((a: any, b: any) => a.numero - b.numero)
        .map((sec: any) => ({
          id: sec.id,
          nombre: sec.nombre,
          color: sec.color,
          numero: sec.numero,
        })),
      pisos: (s.pisos || [])
        .sort((a: any, b: any) => a.orden - b.orden)
        .map((p: any) => ({
          id: p.id,
          numero: p.numero,
          nombre: p.nombre,
          departamentos: (p.departamentos || []).map((d: any) => ({
            id: d.id,
            letra: d.letra,
            nombre: d.nombre || '',
            sector_numero: d.sectorNumero,
          })),
        })),
      archivos: (s.archivos || []).map((a: any) => ({
        id: a.id,
        nombre_original: a.nombreOriginal,
        nombre_archivo: a.nombreArchivo,
        url: a.url,
        mimetype: a.mimetype,
        tamanio: a.tamanio,
        created_at: a.createdAt,
      })),
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    };
  }
}
