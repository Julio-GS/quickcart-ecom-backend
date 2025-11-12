import { Module, Global } from '@nestjs/common';

/**
 * SharedModule - Global utilities and services
 * Contains cross-cutting concerns like validation, logging, etc.
 */
@Global()
@Module({
  imports: [],
  providers: [
    // Add shared services here (Logger, Cache, etc.)
  ],
  exports: [
    // Export shared services to make them available globally
  ],
})
export class SharedModule {}
