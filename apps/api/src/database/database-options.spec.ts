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
