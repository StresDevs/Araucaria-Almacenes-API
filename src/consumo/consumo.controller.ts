import {
  Controller,
  Get,
  Patch,
  Query,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConsumoService } from './consumo.service.js';
import { SaveConsumoDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Controller('consumo')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsumoController {
  constructor(private readonly consumoService: ConsumoService) {}

  /** GET /api/consumo?obraId=X — Get all consumo records for an obra */
  @Get()
  async findByObra(@Query('obraId', ParseUUIDPipe) obraId: string) {
    const records = await this.consumoService.findByObra(obraId);
    return {
      success: true,
      data: records.map((r) => ({
        id: r.id,
        obra_id: r.obraId,
        item_id: r.itemId,
        departamento_id: r.departamentoId,
        cantidad: parseFloat(r.cantidad),
      })),
    };
  }

  /** PATCH /api/consumo — Save/update consumo values (upsert) */
  @Patch()
  async save(@Body() dto: SaveConsumoDto) {
    const count = await this.consumoService.save(dto);
    return {
      success: true,
      message: `${count} registros actualizados`,
    };
  }
}
