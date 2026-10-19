import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { CocktailEntity } from '../../src/cocktails/entities/cocktail.entity';
import { CreateCocktails1792022400000 } from '../../src/database/migrations/1792022400000-CreateCocktails';

const TEST_DATABASE_NAME = 'cocktail_taste_test';

function getTestDatabaseConfig() {
  const host = process.env.TEST_DATABASE_HOST ?? '127.0.0.1';
  const port = Number(process.env.TEST_DATABASE_PORT ?? '5432');
  const username = process.env.TEST_DATABASE_USER ?? 'cocktail';
  const password =
    process.env.TEST_DATABASE_PASSWORD ?? 'cocktail_dev_password';
  const database = process.env.TEST_DATABASE_NAME ?? TEST_DATABASE_NAME;

  if (database !== TEST_DATABASE_NAME) {
    throw new Error(
      `Integration tests must use ${TEST_DATABASE_NAME}, received: ${database}`,
    );
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid TEST_DATABASE_PORT');
  }

  return {
    host,
    port,
    username,
    password,
    database,
  };
}

export function createTestDataSource(): DataSource {
  const config = getTestDatabaseConfig();

  return new DataSource({
    type: 'postgres',
    ...config,
    entities: [CocktailEntity],
    migrations: [CreateCocktails1792022400000],
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    logging: false,
  });
}

export async function initializeTestDatabase(
  dataSource: DataSource,
): Promise<void> {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  await dataSource.runMigrations({
    transaction: 'all',
  });
}

export async function clearTestCocktails(
  dataSource: DataSource,
): Promise<void> {
  if (!dataSource.isInitialized) {
    throw new Error('Test database is not initialized');
  }

  if (dataSource.options.database !== TEST_DATABASE_NAME) {
    throw new Error('Refusing to clear a non-test database');
  }

  await dataSource.query('DELETE FROM cocktails');
}

export async function destroyTestDatabase(
  dataSource: DataSource,
): Promise<void> {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
