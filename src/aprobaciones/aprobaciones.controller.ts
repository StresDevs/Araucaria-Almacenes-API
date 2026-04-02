import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AprobacionesService } from './aprobaciones.service.js';
import { RevisarAprobacionDto } from './dto/index.js';
import { TipoAprobacion, EstadoAprobacion } from './enums/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/index.js';
import { UserRole } from '../users/enums/index.js';

function mapAprobacion(a: any) {
  return {
    id: a.id,
    tipo: a.tipo,
    titulo: a.titulo,
    descripcion: a.descripcion,
    estado: a.estado,
    solicitante: a.solicitanteUser?.nombre ?? '',
    solicitante_id: a.solicitanteId,
    fecha_solicitud: a.createdAt,
    revisado_por: a.revisadoPorUser?.nombre ?? null,
    fecha_revision: a.fechaRevision,
    notas_revision: a.notasRevision,
    // baja
    item_codigo: a.itemCodigo,
    item_descripcion: a.itemDescripcion,
    item_cantidad: a.itemCantidad,
    motivo_baja: a.motivoBaja,
    evidencia_url: a.evidenciaUrl,
    baja_ref_id: a.bajaRefId,
    // edicion_stock
    campo_editado: a.campoEditado,
    valor_anterior: a.valorAnterior,
    valor_nuevo: a.valorNuevo,
    // transferencia_atrasada
    almacen_origen: a.almacenOrigen,
    almacen_destino: a.almacenDestino,
    fecha_transferencia: a.fechaTransferencia,
    fecha_registro: a.fechaRegistro,
    items_transferencia: a.itemsTransferencia,
  };
}

@Controller('aprobaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AprobacionesController {
  constructor(private readonly aprobacionesService: AprobacionesService) {}

  /** GET /api/aprobaciones?tipo=baja_producto&estado=pendiente */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('tipo') tipo?: string,
    @Query('estado') estado?: string,
  ) {
    const validTipos = Object.values(TipoAprobacion);
    const validEstados = Object.values(EstadoAprobacion);
    const tipoFiltro = tipo && validTipos.includes(tipo as TipoAprobacion) ? (tipo as TipoAprobacion) : undefined;
    const estadoFiltro = estado && validEstados.includes(estado as EstadoAprobacion) ? (estado as EstadoAprobacion) : undefined;

    const solicitudes = await this.aprobacionesService.findAll(tipoFiltro, estadoFiltro);
    return { success: true, data: solicitudes.map(mapAprobacion) };
  }

  /** GET /api/aprobaciones/:id */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const sol = await this.aprobacionesService.findOne(id);
    return { success: true, data: mapAprobacion(sol) };
  }

  /** PATCH /api/aprobaciones/:id/aprobar */
  @Patch(':id/aprobar')
  @Roles(UserRole.ADMIN)
  async aprobar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
  ) {
    const sol = await this.aprobacionesService.aprobar(id, adminId);
    const full = await this.aprobacionesService.findOne(sol.id);
    return { success: true, data: mapAprobacion(full), message: 'Solicitud aprobada correctamente' };
  }

  /** PATCH /api/aprobaciones/:id/rechazar */
  @Patch(':id/rechazar')
  @Roles(UserRole.ADMIN)
  async rechazar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevisarAprobacionDto,
    @CurrentUser('id') adminId: string,
  ) {
    const sol = await this.aprobacionesService.rechazar(id, adminId, dto.notasRevision);
    const full = await this.aprobacionesService.findOne(sol.id);
    return { success: true, data: mapAprobacion(full), message: 'Solicitud rechazada' };
  }
}
