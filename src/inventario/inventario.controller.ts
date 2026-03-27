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
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { randomUUID } from 'crypto';
import { InventarioService } from './inventario.service.js';
import { CreateItemDto, UpdateItemDto, SetAlmacenStockDto, CreateEntradaStockDto } from './dto/index.js';
import { ItemOrigen } from './enums/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/index.js';
import { UserRole } from '../users/enums/index.js';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'items');

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const imageStorage = diskStorage({
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
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Solo se permiten imágenes (jpg, png, webp, gif)'), false);
  }
};

function mapItem(item: any) {
  return {
    id: item.id,
    tipo_origen: item.tipoOrigen,
    categoria_id: item.categoriaId,
    categoria_nombre: item.categoria?.nombre ?? null,
    item_numero: item.itemNumero,
    codigo: item.codigo,
    nombre: item.nombre,
    descripcion: item.descripcion,
    unidad: item.unidad,
    rendimiento: item.rendimiento,
    proveedor_id: item.proveedorId,
    proveedor_nombre: item.proveedor?.nombre ?? null,
    precio_unitario_bob: item.precioUnitarioBob ? parseFloat(item.precioUnitarioBob) : null,
    precio_unitario_usd: item.precioUnitarioUsd ? parseFloat(item.precioUnitarioUsd) : null,
    foto_url: item.fotoUrl,
    stock_total: item.stockTotal,
    activo: item.activo,
    ubicaciones: (item.almacenItems ?? []).map((ai: any) => ({
      almacen_id: ai.almacenId,
      almacen_nombre: ai.almacen?.nombre ?? null,
      cantidad: ai.cantidad,
    })),
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

@Controller('inventario')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  /** GET /api/inventario?tipo=importacion_nueva */
  @Get()
  async findAll(@Query('tipo') tipo?: string) {
    const tipoOrigen = tipo && Object.values(ItemOrigen).includes(tipo as ItemOrigen)
      ? (tipo as ItemOrigen)
      : undefined;
    const items = await this.inventarioService.findAll(tipoOrigen);
    return { success: true, data: items.map(mapItem) };
  }

  /** GET /api/inventario/check-item-numero?itemNumero=XXX&excludeId=YYY */
  @Get('check-item-numero')
  async checkItemNumero(
    @Query('itemNumero') itemNumero?: string,
    @Query('excludeId') excludeId?: string,
  ) {
    if (!itemNumero || !itemNumero.trim()) {
      return { success: true, data: { exists: false } };
    }
    const exists = await this.inventarioService.existsByItemNumero(itemNumero.trim(), excludeId);
    return { success: true, data: { exists } };
  }

  /** GET /api/inventario/:id */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const item = await this.inventarioService.findById(id);
    return { success: true, data: mapItem(item) };
  }

  /** GET /api/inventario/almacen/:almacenId */
  @Get('almacen/:almacenId')
  async findByAlmacen(@Param('almacenId', ParseUUIDPipe) almacenId: string) {
    const almacenItems = await this.inventarioService.findByAlmacen(almacenId);
    return {
      success: true,
      data: almacenItems.map((ai) => ({
        id: ai.id,
        almacen_id: ai.almacenId,
        item_id: ai.itemId,
        cantidad: ai.cantidad,
        item: ai.item ? mapItem(ai.item) : null,
      })),
    };
  }

  /** POST /api/inventario */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(
    @Body() dto: CreateItemDto,
    @CurrentUser('id') userId: string,
  ) {
    const item = await this.inventarioService.create(dto, userId);
    const full = await this.inventarioService.findById(item.id);
    return {
      success: true,
      message: 'Ítem creado correctamente',
      data: mapItem(full),
    };
  }

  /** PATCH /api/inventario/:id */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateItemDto,
  ) {
    await this.inventarioService.update(id, dto);
    const full = await this.inventarioService.findById(id);
    return {
      success: true,
      message: 'Ítem actualizado correctamente',
      data: mapItem(full),
    };
  }

  /** POST /api/inventario/:id/foto — Upload item image */
  @Post(':id/foto')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: imageStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  async uploadFoto(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se envió ninguna imagen');

    // Remove old photo if exists
    const item = await this.inventarioService.findById(id);
    if (item.fotoUrl) {
      const oldPath = join(process.cwd(), item.fotoUrl);
      if (existsSync(oldPath)) unlinkSync(oldPath);
    }

    const relativePath = `uploads/items/${file.filename}`;
    await this.inventarioService.setFotoUrl(id, relativePath);

    return {
      success: true,
      message: 'Imagen subida correctamente',
      data: { foto_url: relativePath },
    };
  }

  /** PATCH /api/inventario/:id/stock — Set stock for a specific almacen */
  @Patch(':id/stock')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async setAlmacenStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAlmacenStockDto,
  ) {
    await this.inventarioService.setAlmacenStock(id, dto);
    const full = await this.inventarioService.findById(id);
    return {
      success: true,
      message: 'Stock actualizado correctamente',
      data: mapItem(full),
    };
  }

  /** DELETE /api/inventario/:id/stock/:almacenId — Remove item from almacen */
  @Delete(':id/stock/:almacenId')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async removeAlmacenStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('almacenId', ParseUUIDPipe) almacenId: string,
  ) {
    await this.inventarioService.removeAlmacenStock(id, almacenId);
    return { success: true, message: 'Stock eliminado del almacén' };
  }

  /** DELETE /api/inventario/:id */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.inventarioService.remove(id);
    return { success: true, message: 'Ítem eliminado correctamente' };
  }

  /** POST /api/inventario/:id/entradas — Register stock entry */
  @Post(':id/entradas')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async createEntradaStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateEntradaStockDto,
    @CurrentUser('id') userId: string,
  ) {
    const entrada = await this.inventarioService.createEntradaStock(id, dto, userId);
    const full = await this.inventarioService.findById(id);
    return {
      success: true,
      message: 'Entrada de stock registrada correctamente',
      data: {
        entrada: {
          id: entrada.id,
          item_id: entrada.itemId,
          almacen_id: entrada.almacenId,
          cantidad: entrada.cantidad,
          descripcion: entrada.descripcion,
          registrado_por: entrada.registradoPor,
          created_at: entrada.createdAt,
        },
        item: mapItem(full),
      },
    };
  }

  /** GET /api/inventario/:id/entradas — Get stock entry history */
  @Get(':id/entradas')
  async getEntradasStock(@Param('id', ParseUUIDPipe) id: string) {
    const entradas = await this.inventarioService.getEntradasByItem(id);
    return {
      success: true,
      data: entradas.map((e) => ({
        id: e.id,
        item_id: e.itemId,
        almacen_id: e.almacenId,
        almacen_nombre: e.almacen?.nombre ?? null,
        cantidad: e.cantidad,
        descripcion: e.descripcion,
        registrado_por: e.registradoPor,
        created_at: e.createdAt,
      })),
    };
  }
}
