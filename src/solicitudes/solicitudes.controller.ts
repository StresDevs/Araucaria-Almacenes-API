import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service.js';
import { CreateSolicitudDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/index.js';
import { UserRole } from '../users/enums/index.js';

function mapSolicitud(s: any) {
  return {
    id: s.id,
    numero_orden: s.numeroOrden,
    obra_id: s.obraId,
    obra_nombre: s.obra?.nombre ?? null,
    contratista_id: s.contratistaId,
    contratista_nombre: s.contratista?.nombre ?? null,
    contratista_telefono: s.contratista?.telefono ?? null,
    tipo_trabajo: s.tipoTrabajo,
    titulo: s.titulo,
    descripcion: s.descripcion,
    sector: s.sector,
    piso: s.piso,
    departamento: s.departamento ?? '',
    duracion_dias: s.duracionDias,
    items: (s.items ?? []).map((si: any) => ({
      id: si.item?.id ?? si.itemId,
      codigo_fab: si.item?.codigo ?? '',
      descripcion: si.item?.descripcion ?? si.item?.nombre ?? '',
      cantidad: si.cantidad,
      unidad: si.item?.unidad ?? 'unidad',
    })),
    total_items: s.totalItems,
    total_unidades: s.totalUnidades,
    estado: s.estado,
    creado_por: s.createdBy,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

@Controller('solicitudes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  /** POST /api/solicitudes — Create an order */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(
    @Body() dto: CreateSolicitudDto,
    @CurrentUser('id') userId: string,
  ) {
    const solicitud = await this.solicitudesService.create(dto, userId);
    return {
      success: true,
      message: 'Orden de entrega creada correctamente',
      data: mapSolicitud(solicitud),
    };
  }

  /** GET /api/solicitudes?page=1&pageSize=20&obraId=...&fechaDesde=...&fechaHasta=... */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('obraId') obraId?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize ?? '20', 10) || 20));
    const { data, total } = await this.solicitudesService.findAll(
      p,
      ps,
      obraId,
      fechaDesde,
      fechaHasta,
    );
    return {
      success: true,
      data: data.map(mapSolicitud),
      meta: { page: p, pageSize: ps, total },
    };
  }

  /** GET /api/solicitudes/items-disponibles?almacenId=... */
  @Get('items-disponibles')
  async getItemsDisponibles(@Query('almacenId') almacenId?: string) {
    const items = await this.solicitudesService.getItemsDisponibles(almacenId);
    return {
      success: true,
      data: items,
    };
  }

  /** GET /api/solicitudes/:id */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const s = await this.solicitudesService.findById(id);
    return { success: true, data: mapSolicitud(s) };
  }
}
