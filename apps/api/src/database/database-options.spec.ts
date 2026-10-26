import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDatabaseConnectionOptions } from './database-options';

function setRequiredEnvironment(): void {
  vi.stubEnv('DATABASE_HOST', 'localhost');
  vi.stubEnv('DATABASE_PORT', '5432');
  vi.stubEnv('DATABASE_USER', 'cocktail');
  vi.stubEnv('DATABASE_PASSWORD', 'secret');
  vi.stubEnv('DATABASE_NAME', 'cocktail_test');
}

describe('createDatabaseConnectionOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('preserves local PostgreSQL defaults without TLS', () => {
    setRequiredEnvironment();

    const options = createDatabaseConnectionOptions();

    expect(options.ssl).toBe(false);
    expect(options.poolSize).toBe(10);
  });

  it('uses a one-connection pool and TLS for Lambda with Neon', () => {
    setRequiredEnvironment();
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'cocktail-api');
    vi.stubEnv('DATABASE_SSL_MODE', 'require');

    const options = createDatabaseConnectionOptions();

    expect(options.poolSize).toBe(1);
    expect(options.ssl).toEqual({ rejectUnauthorized: false });
    expect(options.extra).toEqual(
      expect.objectContaining({ max: 1, connectionTimeoutMillis: 5000 }),
    );
  });

  it('defaults Lambda connections to verified TLS', () => {
    setRequiredEnvironment();
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'cocktail-api');

    expect(createDatabaseConnectionOptions().ssl).toEqual({
      rejectUnauthorized: true,
    });
  });

  it('uses a separate direct endpoint for production maintenance commands', () => {
    setRequiredEnvironment();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('MIGRATION_DATABASE_HOST', 'direct.example.neon.tech');
    vi.stubEnv('MIGRATION_DATABASE_PORT', '5432');
    vi.stubEnv('MIGRATION_DATABASE_USER', 'migration_role');
    vi.stubEnv('MIGRATION_DATABASE_PASSWORD', 'migration_secret');
    vi.stubEnv('MIGRATION_DATABASE_NAME', 'cocktail');
    vi.stubEnv('MIGRATION_DATABASE_SSL_MODE', 'verify-full');

    const options = createDatabaseConnectionOptions('maintenance');

    expect(options).toEqual(
      expect.objectContaining({
        host: 'direct.example.neon.tech',
        username: 'migration_role',
        database: 'cocktail',
        poolSize: 1,
        ssl: { rejectUnauthorized: true },
      }),
    );
  });

  it('requires explicit maintenance variables in production', () => {
    setRequiredEnvironment();
    vi.stubEnv('NODE_ENV', 'production');

    expect(() => createDatabaseConnectionOptions('maintenance')).toThrow(
      'Missing database environment variable: MIGRATION_DATABASE_HOST',
    );
  });

  it('rejects invalid SSL and pool configuration', () => {
    setRequiredEnvironment();
    vi.stubEnv('DATABASE_SSL_MODE', 'sometimes');
    expect(() => createDatabaseConnectionOptions()).toThrow(
      'DATABASE_SSL_MODE must be one of',
    );

    vi.stubEnv('DATABASE_SSL_MODE', 'disable');
    vi.stubEnv('DATABASE_POOL_MAX', '0');
    expect(() => createDatabaseConnectionOptions()).toThrow(
      'DATABASE_POOL_MAX must be a positive integer',
    );
  });
});
