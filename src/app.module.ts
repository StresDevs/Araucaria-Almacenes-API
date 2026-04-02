import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ObrasModule } from './obras/obras.module.js';
import { AlmacenesModule } from './almacenes/almacenes.module.js';
import { SectorizacionModule } from './sectorizacion/sectorizacion.module.js';
import { CategoriasModule } from './categorias/categorias.module.js';
import { ProveedoresModule } from './proveedores/proveedores.module.js';
import { InventarioModule } from './inventario/inventario.module.js';
import { TransferenciasModule } from './transferencias/transferencias.module.js';
import { ContratistasModule } from './contratistas/contratistas.module.js';
import { SolicitudesModule } from './solicitudes/solicitudes.module.js';
import { BajasModule } from './bajas/bajas.module.js';
import { AprobacionesModule } from './aprobaciones/aprobaciones.module.js';
import { PrestamosModule } from './prestamos/prestamos.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

// Ensure uploads dir exists for local dev (ignored in Vercel)
const uploadsPath = join(process.cwd(), 'uploads');
if (!existsSync(uploadsPath)) {
  try { mkdirSync(uploadsPath, { recursive: true }); } catch { /* noop in serverless */ }
}

@Module({
  imports: [
    // Env config
    ConfigModule.forRoot({ isGlobal: true }),

    // Serve uploaded images as static files: /uploads/*
    ServeStaticModule.forRoot({
      rootPath: uploadsPath,
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),

    // TypeORM con Neon PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        ssl: { rejectUnauthorized: false },
        autoLoadEntities: true,
        synchronize: false, // Usamos SQL manual, nunca sync automático
      }),
    }),

    AuthModule,
    UsersModule,
    ObrasModule,
    AlmacenesModule,
    SectorizacionModule,
    CategoriasModule,
    ProveedoresModule,
    InventarioModule,
    TransferenciasModule,
    ContratistasModule,
    SolicitudesModule,
    BajasModule,
    AprobacionesModule,
    PrestamosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
