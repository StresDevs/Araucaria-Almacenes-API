import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ObrasModule } from './obras/obras.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    // Env config
    ConfigModule.forRoot({ isGlobal: true }),

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
