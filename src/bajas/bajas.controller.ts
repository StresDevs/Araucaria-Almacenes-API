import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { BajasService } from './bajas.service.js';
import { CreateBajaDto, RevisarBajaDto } from './dto/index.js';
import { EstadoBaja, MotivoBaja } from './enums/index.js';
import { AprobacionesService } from '../aprobaciones/aprobaciones.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/index.js';
import { UserRole } from '../users/enums/index.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'evidencias');

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const evidenciaStorage = diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const imageFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Solo se permiten imágenes (jpg, png, webp)'), false);
  }
};

function mapBaja(b: any) {
  return {
    id: b.id,
    item_id: b.itemId,
    item_codigo: b.item?.codigo ?? '',
    item_descripcion: b.item?.descripcion ?? b.item?.nombre ?? '',
    item_categoria: b.item?.categoria?.nombre ?? 'Sin categoría',
    cantidad: b.cantidad,
    motivo: b.motivo,
    descripcion_motivo: b.descripcionMotivo,
    evidencia_url: b.evidenciaUrl,
    evidencia_nombre: b.evidenciaNombre,
    estado: b.estado,
    solicitante: b.solicitante?.nombre ?? '',
    solicitante_id: b.solicitanteId,
    fecha_solicitud: b.createdAt,
    revisado_por: b.revisadoPor?.nombre ?? null,
    fecha_revision: b.fechaRevision,
    notas_revision: b.notasRevision,
  };
}

@Controller('bajas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BajasController {
  constructor(
    private readonly bajasService: BajasService,
    private readonly aprobacionesService: AprobacionesService,
  ) {}

  /** POST /api/bajas — Create a baja request with optional evidence photo */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @UseInterceptors(
    FileInterceptor('evidencia', {
      storage: evidenciaStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() dto: CreateBajaDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const evidenciaUrl = file ? `uploads/evidencias/${file.filename}` : null;
    const evidenciaNombre = file ? file.originalname : null;

    const baja = await this.bajasService.create(dto, userId, evidenciaUrl, evidenciaNombre);
    const full = await this.bajasService.findOne(baja.id);

    // Automatically create an aprobación entry for the admin to review
    await this.aprobacionesService.createFromBaja(full, full.solicitante?.nombre ?? '');

    return { success: true, data: mapBaja(full), message: 'Solicitud de baja creada correctamente' };
  }

  /** GET /api/bajas?estado=pendiente */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async findAll(@Query('estado') estado?: string) {
    const valid = Object.values(EstadoBaja);
    const filtro = estado && valid.includes(estado as EstadoBaja) ? (estado as EstadoBaja) : undefined;
    const bajas = await this.bajasService.findAll(filtro);
    return { success: true, data: bajas.map(mapBaja) };
  }

  /** GET /api/bajas/:id */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const baja = await this.bajasService.findOne(id);
    return { success: true, data: mapBaja(baja) };
  }

  /** PATCH /api/bajas/:id/aprobar — Admin approves */
  @Patch(':id/aprobar')
  @Roles(UserRole.ADMIN)
  async aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
  ) {
    const baja = await this.bajasService.aprobar(id, adminId);
    const full = await this.bajasService.findOne(baja.id);
    return { success: true, data: mapBaja(full), message: 'Solicitud aprobada' };
  }

  /** PATCH /api/bajas/:id/rechazar — Admin rejects */
  @Patch(':id/rechazar')
  @Roles(UserRole.ADMIN)
  async rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevisarBajaDto,
    @CurrentUser('id') adminId: string,
  ) {
    const baja = await this.bajasService.rechazar(id, adminId, dto.notasRevision);
    const full = await this.bajasService.findOne(baja.id);
    return { success: true, data: mapBaja(full), message: 'Solicitud rechazada' };
  }
}
