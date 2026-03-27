import * as crypto from 'crypto';

/**
 * Genera una contraseña temporal legible y segura.
 * Formato: 3 letras mayúsculas + 4 dígitos + 2 caracteres especiales = 9 chars
 * Ejemplo: ABC1234#!
 */
export function generateTemporaryPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I, O para evitar confusión
  const digits = '23456789'; // sin 0, 1
  const special = '#!@$%';

  let password = '';

  // 3 letras mayúsculas
  for (let i = 0; i < 3; i++) {
    password += upper[crypto.randomInt(upper.length)];
  }

  // 4 dígitos
  for (let i = 0; i < 4; i++) {
    password += digits[crypto.randomInt(digits.length)];
  }

  // 2 caracteres especiales
  for (let i = 0; i < 2; i++) {
    password += special[crypto.randomInt(special.length)];
  }

  return password;
}
