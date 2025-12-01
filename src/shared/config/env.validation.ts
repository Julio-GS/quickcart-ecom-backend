import * as Joi from 'joi';

/**
 * Environment variables validation schema
 * OWASP A05: Security Misconfiguration prevention
 */
export const configValidationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  // Database (PostgreSQL/Supabase)
  DATABASE_HOST: Joi.string().optional(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USERNAME: Joi.string().optional(),
  DATABASE_PASSWORD: Joi.string().optional(),
  DATABASE_NAME: Joi.string().optional(),
  DATABASE_URL: Joi.string().optional(),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).optional(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // CORS - Support comma-separated list of origins (frontend on port 3000)
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().positive().default(60),
  RATE_LIMIT_LIMIT: Joi.number().positive().default(100),

  // Security
  BCRYPT_SALT_ROUNDS: Joi.number().min(10).max(15).default(12),

  // Stripe Payment
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),

  // Checkout Session
  SESSION_EXPIRATION_HOURS: Joi.number().positive().default(1),
}).unknown(true); // Allow unknown environment variables
