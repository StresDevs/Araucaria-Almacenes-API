import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('BREVO_API_KEY', '');
    this.senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL', 'no-reply@araucaria.com');
    this.senderName = this.config.get<string>('BREVO_SENDER_NAME', 'Araucaria Almacenes');
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  async send(options: SendEmailOptions): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn('Brevo API key not configured — email not sent');
      return false;
    }

    try {
      const payload = {
        sender: { name: this.senderName, email: this.senderEmail },
        to: [{ email: options.to, name: options.toName || options.to }],
        subject: options.subject,
        htmlContent: options.html,
      };

      this.logger.log(`Sending email to ${options.to} | subject: "${options.subject}" | sender: ${this.senderEmail}`);

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.text();

      if (!res.ok) {
        this.logger.error(`Brevo API error ${res.status} ${res.statusText}: ${body}`);
        return false;
      }

      this.logger.log(`Brevo response ${res.status}: ${body}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}:`, (err as Error).stack || err);
      return false;
    }
  }

  /** Send temporary password email after user creation */
  async sendWelcomeCredentials(
    email: string,
    nombre: string,
    temporaryPassword: string,
  ): Promise<boolean> {
    return this.send({
      to: email,
      toName: nombre,
      subject: 'Bienvenido a Araucaria Almacenes — Tus credenciales de acceso',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
    <div style="background: #18181b; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Araucaria Almacenes</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="color: #27272a; font-size: 16px; margin: 0 0 8px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color: #52525b; font-size: 14px; margin: 0 0 24px;">
        Se ha creado tu cuenta en el sistema de almacenes. A continuación se encuentran tus credenciales de acceso:
      </p>
      <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #71717a; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Correo electrónico</p>
        <p style="color: #18181b; font-size: 15px; font-weight: 600; margin: 0 0 16px; font-family: monospace;">${email}</p>
        <p style="color: #71717a; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Contraseña temporal</p>
        <p style="color: #18181b; font-size: 20px; font-weight: 700; margin: 0; font-family: monospace; letter-spacing: 2px;">${temporaryPassword}</p>
      </div>
      <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">
          <strong>Importante:</strong> Deberás cambiar esta contraseña en tu primer inicio de sesión.
        </p>
      </div>
      <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
        Este correo fue enviado automáticamente. No responder.
      </p>
    </div>
  </div>
</body>
</html>`,
    });
  }

  /** Send new temporary password after admin reset */
  async sendPasswordReset(
    email: string,
    nombre: string,
    temporaryPassword: string,
  ): Promise<boolean> {
    return this.send({
      to: email,
      toName: nombre,
      subject: 'Araucaria Almacenes — Tu contraseña ha sido reseteada',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
    <div style="background: #18181b; padding: 24px; text-align: center;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">Araucaria Almacenes</h1>
    </div>
    <div style="padding: 32px 24px;">
      <p style="color: #27272a; font-size: 16px; margin: 0 0 8px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color: #52525b; font-size: 14px; margin: 0 0 24px;">
        Un administrador ha reseteado tu contraseña. A continuación se encuentra tu nueva contraseña temporal:
      </p>
      <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #71717a; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px;">Nueva contraseña temporal</p>
        <p style="color: #18181b; font-size: 20px; font-weight: 700; margin: 0; font-family: monospace; letter-spacing: 2px;">${temporaryPassword}</p>
      </div>
      <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
        <p style="color: #92400e; font-size: 13px; margin: 0;">
          <strong>Importante:</strong> Deberás cambiar esta contraseña en tu próximo inicio de sesión.
        </p>
      </div>
      <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
        Este correo fue enviado automáticamente. No responder.
      </p>
    </div>
  </div>
</body>
</html>`,
    });
  }
}
