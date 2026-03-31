import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Sectorizacion,
  SectorizacionSector,
  SectorizacionPiso,
  SectorizacionDepartamento,
  SectorizacionArchivo,
} from './entities/index.js';
import { SectorizacionEstado } from './enums/index.js';
import { CreateSectorizacionDto, UpdateSectorizacionDto } from './dto/index.js';

@Injectable()
export class SectorizacionService {
  constructor(
    @InjectRepository(Sectorizacion)
    private readonly sectorizacionRepo: Repository<Sectorizacion>,
    @InjectRepository(SectorizacionSector)
    private readonly sectorRepo: Repository<SectorizacionSector>,
    @InjectRepository(SectorizacionPiso)
    private readonly pisoRepo: Repository<SectorizacionPiso>,
    @InjectRepository(SectorizacionDepartamento)
    private readonly departamentoRepo: Repository<SectorizacionDepartamento>,
    @InjectRepository(SectorizacionArchivo)
    private readonly archivoRepo: Repository<SectorizacionArchivo>,
  ) {}

  async findAll(includeDesactivadas = false): Promise<Sectorizacion[]> {
    const where = includeDesactivadas ? {} : { estado: SectorizacionEstado.ACTIVA };
    return this.sectorizacionRepo.find({
      where,
      relations: ['obra', 'sectores', 'pisos', 'pisos.departamentos', 'archivos'],
      order: { createdAt: 'DESC' },
    });
  }

  async findDesactivadas(): Promise<Sectorizacion[]> {
    return this.sectorizacionRepo.find({
      where: { estado: SectorizacionEstado.DESACTIVADA },
      relations: ['obra', 'sectores', 'pisos', 'pisos.departamentos', 'archivos'],
      order: { updatedAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Sectorizacion> {
    const sectorizacion = await this.sectorizacionRepo.findOne({
      where: { id },
      relations: ['obra', 'sectores', 'pisos', 'pisos.departamentos', 'archivos'],
    });
    if (!sectorizacion) {
      throw new NotFoundException('Sectorización no encontrada');
    }
    return sectorizacion;
  }

  async create(dto: CreateSectorizacionDto): Promise<Sectorizacion> {
    // Verificar que no exista una sectorización activa para esta obra
    const existing = await this.sectorizacionRepo.findOne({
      where: { obraId: dto.obraId, estado: SectorizacionEstado.ACTIVA },
    });
    if (existing) {
      throw new ConflictException('Ya existe una sectorización activa para esta obra');
    }

    // Crear la sectorización con cascada
    const sectorizacion = this.sectorizacionRepo.create({
      obraId: dto.obraId,
      estado: SectorizacionEstado.ACTIVA,
      sectores: dto.sectores.map((s) =>
        this.sectorRepo.create({
          nombre: s.nombre,
          color: s.color,
          numero: s.numero,
        }),
      ),
      pisos: dto.pisos.map((p, idx) =>
        this.pisoRepo.create({
          numero: p.numero,
          nombre: p.nombre,
          orden: p.orden ?? idx,
          departamentos: p.departamentos.map((d) =>
            this.departamentoRepo.create({
              letra: d.letra,
              sectorNumero: d.sectorNumero,
            }),
          ),
        }),
      ),
    });

    return this.sectorizacionRepo.save(sectorizacion);
  }

  async update(id: string, dto: UpdateSectorizacionDto): Promise<Sectorizacion> {
    const sectorizacion = await this.findById(id);

    // Reemplazar sectores si se envían
    if (dto.sectores !== undefined) {
      await this.sectorRepo.delete({ sectorizacionId: id });
      sectorizacion.sectores = dto.sectores.map((s) =>
        this.sectorRepo.create({
          sectorizacionId: id,
          nombre: s.nombre,
          color: s.color,
          numero: s.numero,
        }),
      );
    }

    // Reemplazar pisos y departamentos si se envían
    if (dto.pisos !== undefined) {
      // Eliminar pisos existentes (cascada elimina departamentos)
      await this.pisoRepo.delete({ sectorizacionId: id });
      sectorizacion.pisos = dto.pisos.map((p, idx) =>
        this.pisoRepo.create({
          sectorizacionId: id,
          numero: p.numero,
          nombre: p.nombre,
          orden: p.orden ?? idx,
          departamentos: p.departamentos.map((d) =>
            this.departamentoRepo.create({
              letra: d.letra,
              sectorNumero: d.sectorNumero,
            }),
          ),
        }),
      );
    }

    return this.sectorizacionRepo.save(sectorizacion);
  }

  async toggleActive(id: string): Promise<Sectorizacion> {
    const sectorizacion = await this.findById(id);
    sectorizacion.estado =
      sectorizacion.estado === SectorizacionEstado.ACTIVA
        ? SectorizacionEstado.DESACTIVADA
        : SectorizacionEstado.ACTIVA;
    return this.sectorizacionRepo.save(sectorizacion);
  }

  async addArchivos(
    id: string,
    files: Express.Multer.File[],
  ): Promise<SectorizacionArchivo[]> {
    await this.findById(id); // verificar que existe
    const archivos = files.map((file) =>
      this.archivoRepo.create({
        sectorizacionId: id,
        nombreOriginal: file.originalname,
        nombreArchivo: file.filename,
        mimetype: file.mimetype,
        tamanio: file.size,
        url: `/uploads/sectorizacion/${file.filename}`,
      }),
    );
    return this.archivoRepo.save(archivos);
  }

  async getArchivo(archivoId: string): Promise<SectorizacionArchivo> {
    const archivo = await this.archivoRepo.findOne({ where: { id: archivoId } });
    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return archivo;
  }

  async removeArchivo(archivoId: string): Promise<void> {
    const archivo = await this.archivoRepo.findOne({ where: { id: archivoId } });
    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }
    await this.archivoRepo.remove(archivo);
  }
}
