import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function createDatabaseConfig(): TypeOrmModuleOptions {
  const required = [
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
  ] as const;

  for (const key of required) {
    if (!process.env[key]?.trim()) {
      throw new Error(`Missing database environment variable: ${key}`);
    }
  }

  const port = Number(process.env.DATABASE_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DATABASE_PORT must be a valid TCP port');
  }

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    autoLoadEntities: true,
    synchronize: false,
    retryAttempts: 3,
    retryDelay: 1000,
  };
}
