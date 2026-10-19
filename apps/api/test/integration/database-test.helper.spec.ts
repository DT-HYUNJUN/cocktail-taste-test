import { describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';

import {
  clearTestCocktails,
  createTestDataSource,
  destroyTestDatabase,
  initializeTestDatabase,
} from './database-test.helper';

describe('Integration Database Helper', () => {
  it('테스트 전용 DB 연결 설정을 생성한다', () => {
    const dataSource = createTestDataSource();

    expect(dataSource.options.database).toBe('cocktail_taste_test');
    expect(dataSource.options.synchronize).toBe(false);
  });

  it('다른 DB 이름으로 연결하려는 요청을 거부한다', () => {
    vi.stubEnv('TEST_DATABASE_NAME', 'cocktail_taste');

    try {
      expect(() => createTestDataSource()).toThrow(
        'Integration tests must use cocktail_taste_test',
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('DB 초기화 후 Migration을 실행한다', async () => {
    const initialize = vi.fn().mockResolvedValue(undefined);
    const runMigrations = vi.fn().mockResolvedValue([]);

    const dataSource = {
      isInitialized: false,
      initialize,
      runMigrations,
    } as unknown as DataSource;

    await initializeTestDatabase(dataSource);

    expect(initialize).toHaveBeenCalledOnce();
    expect(runMigrations).toHaveBeenCalledWith({
      transaction: 'all',
    });
  });

  it('테스트 DB의 칵테일 데이터만 삭제한다', async () => {
    const query = vi.fn().mockResolvedValue([]);

    const dataSource = {
      isInitialized: true,
      options: { database: 'cocktail_taste_test' },
      query,
    } as unknown as DataSource;

    await clearTestCocktails(dataSource);

    expect(query).toHaveBeenCalledWith('DELETE FROM cocktails');
  });

  it('개발 DB 데이터 삭제를 거부한다', async () => {
    const query = vi.fn();

    const dataSource = {
      isInitialized: true,
      options: { database: 'cocktail_taste' },
      query,
    } as unknown as DataSource;

    await expect(clearTestCocktails(dataSource)).rejects.toThrow(
      'Refusing to clear a non-test database',
    );

    expect(query).not.toHaveBeenCalled();
  });

  it('초기화되지 않은 연결은 종료하지 않는다', async () => {
    const destroy = vi.fn();

    const dataSource = {
      isInitialized: false,
      destroy,
    } as unknown as DataSource;

    await destroyTestDatabase(dataSource);

    expect(destroy).not.toHaveBeenCalled();
  });

  it('초기화된 연결은 종료한다', async () => {
    const destroy = vi.fn().mockResolvedValue(undefined);

    const dataSource = {
      isInitialized: true,
      destroy,
    } as unknown as DataSource;

    await destroyTestDatabase(dataSource);

    expect(destroy).toHaveBeenCalledOnce();
  });

  it('원격 DB 연결을 거부한다', () => {
    vi.stubEnv('TEST_DATABASE_HOST', 'production.example.com');

    try {
      expect(() => createTestDataSource()).toThrow(
        'Integration tests require a local database host',
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
