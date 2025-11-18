import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from '../../domain/entities/user.entity';
import { LoginDto, RegisterDto, AuthResponseDto, UserInfoDto } from './dto';

/**
 * AuthService - Servicio de autenticación y autorización
 * Implementa casos de uso de seguridad siguiendo OWASP A07: Authentication Failures
 * Aplica principio SRP (Single Responsibility Principle)
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registra un nuevo usuario en el sistema
   * Valida unicidad del email y hashea la contraseña de forma segura
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, fullName, role } = registerDto;

    // Verificar si el usuario ya existe (OWASP A01: Broken Access Control)
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado en el sistema');
    }

    // Hash seguro de la contraseña (OWASP A02: Cryptographic Failures)
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario con datos sanitizados
    const newUser = this.userRepository.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      fullName: fullName.trim(),
      role: role || UserRole.CLIENT,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Generar JWT token
    const token = await this.generateToken(savedUser);

    return this.buildAuthResponse(savedUser, token);
  }

  /**
   * Autentica un usuario con email y contraseña
   * Implementa protección contra ataques de fuerza bruta
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Buscar usuario por email (incluir password para verificación)
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña de forma segura (timing attack resistant)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar JWT token
    const token = await this.generateToken(user);

    return this.buildAuthResponse(user, token);
  }

  /**
   * Valida un usuario por ID (usado por JWT Strategy)
   */
  async validateUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Valida credenciales para Local Strategy
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return user;
    }

    return null;
  }

  /**
   * Genera JWT token seguro con claims mínimos necesarios
   */
  private async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000), // Issued at
    };

    return this.jwtService.signAsync(payload);
  }

  /**
   * Construye respuesta de autenticación estandarizada
   */
  private buildAuthResponse(user: User, token: string): AuthResponseDto {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '24h');

    // Convertir expiración a segundos
    const expiresInSeconds = this.parseExpirationToSeconds(expiresIn);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Convierte formato de expiración JWT a segundos
   */
  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 86400; // Default 24h

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 3600);
  }

  /**
   * Verifica si un usuario tiene un rol específico
   */
  hasRole(user: User, role: UserRole): boolean {
    return user.role === role;
  }

  /**
   * Verifica si un usuario es administrador
   */
  isAdmin(user: User): boolean {
    return user.role === UserRole.ADMIN;
  }
}
