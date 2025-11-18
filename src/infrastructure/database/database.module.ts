import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * DatabaseModule - TypeORM configuration for PostgreSQL (Supabase)
 * Implements connection with security best practices
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [__dirname + '/../../domain/entities/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        // Security: Disable synchronize in production
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        // Disable SQL logging for cleaner logs - only log errors
        logging: ['error'],
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        // Connection pooling for better performance
        extra: {
          max: 20, // Maximum number of connection pool
          idleTimeoutMillis: 30000, // Close connections after 30s of inactivity
          connectionTimeoutMillis: 2000, // Return error after 2s if connection could not be established
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
