import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

/**
 * JwtPayload - Interface para el payload del JWT token
 */
interface JwtPayload {
  id: string;
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp?: number;
}

/**
 * JwtStrategy - Estrategia Passport para validación de JWT tokens
 * Implementa verificación segura de tokens JWT siguiendo OWASP A02: Cryptographic Failures
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rechazar tokens expirados
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'], // Especificar algoritmo para prevenir ataques de confusión
    });
  }

  /**
   * Valida el payload del JWT token
   * Llamado automáticamente por Passport después de verificar la firma JWT
   */
  async validate(payload: JwtPayload) {
    try {
      // Verificar que el token no sea demasiado antiguo (opcional)
      const maxTokenAge = 7 * 24 * 60 * 60; // 7 días en segundos
      const tokenAge = Math.floor(Date.now() / 1000) - payload.iat;

      if (tokenAge > maxTokenAge) {
        throw new UnauthorizedException(
          'Token demasiado antiguo, inicia sesión nuevamente',
        );
      }

      // Validar que el usuario aún existe y está activo
      const user = await this.authService.validateUserById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Usuario no válido');
      }

      // Retornar información del usuario para el request (incluyendo 'sub' para compatibilidad con controladores)
      return {
        id: user.id,
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      };
    } catch (error) {
      throw new UnauthorizedException('Token JWT inválido');
    }
  }
}
