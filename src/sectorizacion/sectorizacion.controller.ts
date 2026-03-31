import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import type { Response } from 'express';
import { SectorizacionService } from './sectorizacion.service.js';
import { CreateSectorizacionDto, UpdateSectorizacionDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/index.js';

const ALLOWED_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const sectorizacionStorage = diskStorage({
  destination: join(process.cwd(), 'uploads', 'sectorizacion'),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

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

  /** GET /api/sectorizacion/archivos/:archivoId/download — Descargar archivo */
  @Get('archivos/:archivoId/download')
  async downloadArchivo(
    @Param('archivoId', ParseUUIDPipe) archivoId: string,
    @Res() res: Response,
  ) {
    const archivo = await this.sectorizacionService.getArchivo(archivoId);
    const filePath = join(
      process.cwd(),
      'uploads',
      'sectorizacion',
      archivo.nombreArchivo,
    );

    if (!existsSync(filePath)) {
      throw new BadRequestException('El archivo no existe en el servidor');
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(archivo.nombreOriginal)}"`,
    );
    res.setHeader('Content-Type', archivo.mimetype);
    res.sendFile(filePath);
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

  /** POST /api/sectorizacion/:id/archivos/upload — Subir archivos (PDF o imágenes) */
  @Post(':id/archivos/upload')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @UseInterceptors(
    FilesInterceptor('archivos', 10, {
      storage: sectorizacionStorage,
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max per file
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Tipo de archivo no permitido: ${file.mimetype}. Solo se aceptan PDF e imágenes.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadArchivos(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debe enviar al menos un archivo');
    }

    const archivos = await this.sectorizacionService.addArchivos(id, files);
    return {
      success: true,
      message: `${archivos.length} archivo(s) subido(s) correctamente`,
      data: archivos.map((a) => ({
        id: a.id,
        nombre_original: a.nombreOriginal,
        nombre_archivo: a.nombreArchivo,
        url: `/uploads/sectorizacion/${a.nombreArchivo}`,
        mimetype: a.mimetype,
        tamanio: a.tamanio,
        created_at: a.createdAt,
      })),
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
