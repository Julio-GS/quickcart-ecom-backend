import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../../domain/entities/user.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * AuthModule - Módulo de autenticación y autorización
 * Configura JWT, Passport strategies y guards para seguridad robusta
 * Implementa inyección de dependencias siguiendo DIP (Dependency Inversion Principle)
 */
@Module({
  imports: [
    // Configuración de Passport
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),

    // Configuración de JWT de forma asíncrona para acceder a ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'),
          algorithm: 'HS256', // Algoritmo explícito para prevenir ataques
          issuer: 'quickcart-api', // Identificador del emisor
          audience: 'quickcart-client', // Audiencia del token
        },
      }),
      inject: [ConfigService],
    }),

    // TypeORM para acceso a datos de usuarios
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
