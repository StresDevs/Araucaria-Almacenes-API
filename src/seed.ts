import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module.js';
import { UsersService } from './users/users.service.js';
import { UserRole } from './users/enums/index.js';

/**
 * Script para crear el usuario administrador inicial.
 * Ejecutar: npx ts-node -r tsconfig-paths/register src/seed.ts
 * O bien: npm run seed
 */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const existingAdmin = await usersService.findByEmail('admin@araucaria.com');
  if (existingAdmin) {
    console.log('⚠️  El usuario admin ya existe. No se creó uno nuevo.');
    await app.close();
    return;
  }

  const { user, temporaryPassword } = await usersService.create({
    nombres: 'Admin',
    primerApellido: 'Sistema',
    email: 'admin@araucaria.com',
    rol: UserRole.ADMIN,
  });

  console.log('✅ Usuario administrador creado:');
  console.log(`   Email:      ${user.email}`);
  console.log(`   Contraseña: ${temporaryPassword}`);
  console.log(`   Rol:        ${user.rol}`);
  console.log('');
  console.log('⚠️  Guarda esta contraseña temporal. Se solicitará cambiarla en el primer inicio de sesión.');

  await app.close();
}

seed().catch((err) => {
  console.error('Error al ejecutar seed:', err);
  process.exit(1);
});
