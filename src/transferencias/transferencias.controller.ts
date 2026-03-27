import {
  Controller,
  Get,
  Post,
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
import { TransferenciasService } from './transferencias.service.js';
import { CreateTransferenciaDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/index.js';
import { UserRole } from '../users/enums/index.js';

const EVIDENCE_DIR = join(process.cwd(), 'uploads', 'evidencias');
if (!existsSync(EVIDENCE_DIR)) {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const evidenceStorage = diskStorage({
  destination: (_req, _file, cb) => cb(null, EVIDENCE_DIR),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const evidenceFileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Solo se permiten archivos PDF, JPG o PNG'), false);
  }
};

function mapTransferencia(t: any) {
  return {
    id: t.id,
    almacen_origen_id: t.almacenOrigenId,
    almacen_origen_nombre: t.almacenOrigen?.nombre ?? null,
    observaciones: t.observaciones,
    evidencia_url: t.evidenciaUrl,
    estado: t.estado,
    created_by: t.createdBy,
    items: (t.items ?? []).map((ti: any) => ({
      id: ti.id,
      almacen_destino_id: ti.almacenDestinoId,
      almacen_destino_nombre: ti.almacenDestino?.nombre ?? null,
      item_id: ti.itemId,
      item_codigo: ti.item?.codigo ?? null,
      item_nombre: ti.item?.nombre ?? null,
      item_descripcion: ti.item?.descripcion ?? null,
      cantidad: ti.cantidad,
    })),
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

@Controller('transferencias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransferenciasController {
  constructor(private readonly transferenciasService: TransferenciasService) {}

  /** POST /api/transferencias — Create a transfer */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(
    @Body() dto: CreateTransferenciaDto,
    @CurrentUser('id') userId: string,
  ) {
    const transferencia = await this.transferenciasService.create(dto, userId);
    return {
      success: true,
      message: 'Transferencia realizada correctamente',
      data: mapTransferencia(transferencia),
    };
  }

  /** GET /api/transferencias?page=1&pageSize=20 */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize ?? '20', 10) || 20));
    const { data, total } = await this.transferenciasService.findAll(p, ps);
    return {
      success: true,
      data: data.map(mapTransferencia),
      meta: { page: p, pageSize: ps, total },
    };
  }

  /** GET /api/transferencias/:id */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const t = await this.transferenciasService.findById(id);
    return { success: true, data: mapTransferencia(t) };
  }

  /** POST /api/transferencias/:id/evidencia — Upload evidence */
  @Post(':id/evidencia')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @UseInterceptors(
    FileInterceptor('evidencia', {
      storage: evidenceStorage,
      fileFilter: evidenceFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async uploadEvidencia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se envió ningún archivo');

    const relativePath = `uploads/evidencias/${file.filename}`;
    await this.transferenciasService.setEvidenciaUrl(id, relativePath);

    return {
      success: true,
      message: 'Evidencia subida correctamente',
      data: { evidencia_url: relativePath },
    };
  }
}
