import type { PostgresDataSourceOptions } from 'typeorm/driver/postgres/PostgresDataSourceOptions';

type DatabaseConnectionOptions = Pick<
  PostgresDataSourceOptions,
  | 'type'
  | 'host'
  | 'port'
  | 'username'
  | 'password'
  | 'database'
  | 'ssl'
  | 'poolSize'
  | 'extra'
>;

const required = [
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
] as const;

function readPositiveInteger(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

function readSslOptions(): DatabaseConnectionOptions['ssl'] {
  const mode = process.env.DATABASE_SSL_MODE?.trim().toLowerCase() ?? 'disable';

  if (mode === 'disable') {
    return false;
  }

  if (mode === 'require') {
    return { rejectUnauthorized: false };
  }

  if (mode === 'verify-full') {
    return { rejectUnauthorized: true };
  }

  throw new Error(
    'DATABASE_SSL_MODE must be one of: disable, require, verify-full',
  );
}

export function createDatabaseConnectionOptions(): DatabaseConnectionOptions {
  for (const key of required) {
    if (!process.env[key]?.trim()) {
      throw new Error(`Missing database environment variable: ${key}`);
    }
  }

  const port = Number(process.env.DATABASE_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DATABASE_PORT must be a valid TCP port');
  }

  const defaultPoolSize = process.env.AWS_LAMBDA_FUNCTION_NAME ? 1 : 10;
  const poolSize = readPositiveInteger('DATABASE_POOL_MAX', defaultPoolSize);
  const connectionTimeoutMillis = readPositiveInteger(
    'DATABASE_CONNECTION_TIMEOUT_MS',
    5000,
  );
  const idleTimeoutMillis = readPositiveInteger(
    'DATABASE_IDLE_TIMEOUT_MS',
    30000,
  );

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: readSslOptions(),
    poolSize,
    extra: {
      max: poolSize,
      connectionTimeoutMillis,
      idleTimeoutMillis,
    },
  };
}
