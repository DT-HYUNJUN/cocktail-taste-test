import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { createDatabaseConnectionOptions } from './database/database-options';

export function createDatabaseConfig(): TypeOrmModuleOptions {
  return {
    ...createDatabaseConnectionOptions(),
    autoLoadEntities: true,
    synchronize: false,
    retryAttempts: 3,
    retryDelay: 1000,
  };
}
