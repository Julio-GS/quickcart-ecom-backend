import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

/**
 * LocalStrategy - Estrategia Passport para autenticación email/password
 * Implementa validación de credenciales locales de forma segura
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Usar email en lugar de username
      passwordField: 'password',
    });
  }

  /**
   * Valida las credenciales del usuario
   * Llamado automáticamente por Passport cuando se usa LocalAuthGuard
   */
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Retornar usuario sin contraseña para el request
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}
