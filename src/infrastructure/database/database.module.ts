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
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');

        if (databaseUrl) {
          // Use DATABASE_URL (preferred for production/Vercel)
          return {
            type: 'postgres',
            url: databaseUrl,
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
          };
        } else {
          // Fallback to individual config (development)
          return {
            type: 'postgres',
            host: configService.get<string>('DATABASE_HOST', 'localhost'),
            port: configService.get<number>('DATABASE_PORT', 5432),
            username: configService.get<string>(
              'DATABASE_USERNAME',
              'postgres',
            ),
            password: configService.get<string>(
              'DATABASE_PASSWORD',
              'password',
            ),
            database: configService.get<string>('DATABASE_NAME', 'quickcart'),
            entities: [__dirname + '/../../domain/entities/*.entity{.ts,.js}'],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            logging: ['error'],
            ssl: false,
            extra: {
              max: 20,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 2000,
            },
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
