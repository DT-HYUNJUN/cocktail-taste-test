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

export type DatabaseConnectionPurpose = 'runtime' | 'maintenance';

const databaseFields = ['HOST', 'PORT', 'USER', 'PASSWORD', 'NAME'] as const;

function readDatabaseEnvironment(
  field: (typeof databaseFields)[number] | 'SSL_MODE' | 'POOL_MAX',
  purpose: DatabaseConnectionPurpose,
): string | undefined {
  if (purpose === 'maintenance') {
    const maintenanceValue = process.env[`MIGRATION_DATABASE_${field}`]?.trim();
    if (maintenanceValue) return maintenanceValue;
    if (process.env.NODE_ENV === 'production') return undefined;
  }
  return process.env[`DATABASE_${field}`]?.trim();
}

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

function readSslOptions(
  purpose: DatabaseConnectionPurpose,
): DatabaseConnectionOptions['ssl'] {
  const productionDefault =
    process.env.NODE_ENV === 'production' || process.env.AWS_LAMBDA_FUNCTION_NAME
      ? 'verify-full'
      : 'disable';
  const mode =
    readDatabaseEnvironment('SSL_MODE', purpose)?.toLowerCase() ??
    productionDefault;

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

export function createDatabaseConnectionOptions(
  purpose: DatabaseConnectionPurpose = 'runtime',
): DatabaseConnectionOptions {
  const values = Object.fromEntries(
    databaseFields.map((field) => [
      field,
      readDatabaseEnvironment(field, purpose),
    ]),
  ) as Record<(typeof databaseFields)[number], string | undefined>;

  for (const field of databaseFields) {
    if (!values[field]) {
      const prefix = purpose === 'maintenance' ? 'MIGRATION_DATABASE' : 'DATABASE';
      throw new Error(`Missing database environment variable: ${prefix}_${field}`);
    }
  }

  const port = Number(values.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DATABASE_PORT must be a valid TCP port');
  }

  const defaultPoolSize = process.env.AWS_LAMBDA_FUNCTION_NAME ? 1 : 10;
  const configuredPoolSize = readDatabaseEnvironment('POOL_MAX', purpose);
  const poolSize = configuredPoolSize
    ? Number(configuredPoolSize)
    : purpose === 'maintenance'
      ? 1
      : defaultPoolSize;
  if (!Number.isInteger(poolSize) || poolSize < 1) {
    throw new Error(
      `${purpose === 'maintenance' ? 'MIGRATION_DATABASE' : 'DATABASE'}_POOL_MAX must be a positive integer`,
    );
  }
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
    host: values.HOST,
    port,
    username: values.USER,
    password: values.PASSWORD,
    database: values.NAME,
    ssl: readSslOptions(purpose),
    poolSize,
    extra: {
      max: poolSize,
      connectionTimeoutMillis,
      idleTimeoutMillis,
    },
  };
}
