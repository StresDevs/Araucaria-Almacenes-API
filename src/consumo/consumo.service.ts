import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumoDepartamento } from './entities/index.js';
import { SaveConsumoDto } from './dto/index.js';

@Injectable()
export class ConsumoService {
  constructor(
    @InjectRepository(ConsumoDepartamento)
    private readonly consumoRepo: Repository<ConsumoDepartamento>,
  ) {}

  async findByObra(obraId: string): Promise<ConsumoDepartamento[]> {
    return this.consumoRepo.find({ where: { obraId } });
  }

  async save(dto: SaveConsumoDto): Promise<number> {
    let upserted = 0;

    for (const val of dto.valores) {
      await this.consumoRepo
        .createQueryBuilder()
        .insert()
        .into(ConsumoDepartamento)
        .values({
          obraId: dto.obraId,
          itemId: val.itemId,
          departamentoId: val.departamentoId,
          cantidad: String(val.cantidad),
        })
        .orUpdate(['cantidad', 'updated_at'], ['obra_id', 'item_id', 'departamento_id'])
        .execute();
      upserted++;
    }

    return upserted;
  }
}
