import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContratistasService } from './contratistas.service.js';
import { CreateContratistaDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../users/enums/index.js';

function mapContratista(c: any) {
  return {
    id: c.id,
    nombre: c.nombre,
    empresa: c.empresa,
    telefono: c.telefono,
    obra_id: c.obraId,
    obra: c.obra?.nombre ?? c.empresa ?? '—',
    estado: c.estado,
    fecha_registro: c.createdAt
      ? new Date(c.createdAt).toISOString().split('T')[0]
      : null,
  };
}

@Controller('contratistas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContratistasController {
  constructor(private readonly contratistasService: ContratistasService) {}

  @Get()
  async findAll(@Query('obraId') obraId?: string) {
    const data = await this.contratistasService.findAll(obraId);
    return {
      success: true,
      data: data.map(mapContratista),
    };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async create(@Body() dto: CreateContratistaDto) {
    const c = await this.contratistasService.create(dto);
    return {
      success: true,
      message: 'Contratista creado correctamente',
      data: mapContratista(c),
    };
  }
}
