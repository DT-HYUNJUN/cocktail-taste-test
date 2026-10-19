import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { DataSource } from 'typeorm';

import { CocktailEntity } from '../../src/cocktails/entities/cocktail.entity';
import { TypeOrmCocktailReader } from '../../src/cocktails/infrastructure/typeorm-cocktail.reader';
import { cocktailSeeds } from '../../src/database/seeds/cocktail-seed.data';
import { RecommendationService } from '../../src/recommendations/recommendation.service';

import {
  clearTestCocktails,
  createTestDataSource,
  destroyTestDatabase,
  initializeTestDatabase,
} from './database-test.helper';

const answers = [
  { questionId: 'sweet', answerId: 'medium' },
  { questionId: 'sour', answerId: 'high' },
  { questionId: 'bitter', answerId: 'low' },
  { questionId: 'alcohol-intensity', answerId: 'medium' },
  { questionId: 'refreshing', answerId: 'very-high' },
  { questionId: 'preferred-flavors', answerIds: ['citrus'] },
  { questionId: 'avoided-flavors', answerIds: [] },
  { questionId: 'preferred-base-spirits', answerIds: ['gin'] },
];

describe('Recommendation Integration', () => {
  let dataSource: DataSource;
  let service: RecommendationService;

  async function insertCocktails(activeIds: readonly string[]): Promise<void> {
    const activeSet = new Set(activeIds);

    const rows = cocktailSeeds.map((seed) => ({
      ...seed,
      isActive: activeSet.has(seed.id),
    }));

    await dataSource.getRepository(CocktailEntity).insert(rows);
  }

  beforeAll(async () => {
    dataSource = createTestDataSource();

    try {
      await initializeTestDatabase(dataSource);

      const repository = dataSource.getRepository(CocktailEntity);

      const reader = new TypeOrmCocktailReader(repository);
      service = new RecommendationService(reader);
    } catch (error) {
      await destroyTestDatabase(dataSource);
      throw error;
    }
  });

  beforeEach(async () => {
    await clearTestCocktails(dataSource);
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await clearTestCocktails(dataSource);
    }
  });

  afterAll(async () => {
    if (dataSource) {
      try {
        if (dataSource.isInitialized) {
          await clearTestCocktails(dataSource);
        }
      } finally {
        await destroyTestDatabase(dataSource);
      }
    }
  });

  it('모든 칵테일이 비활성화되면 추천 결과가 비어 있다', async () => {
    await insertCocktails([]);

    const result = await service.recommend(answers);

    expect(result.recommendations).toEqual([]);
    expect(result.profile.dimensions).toHaveLength(5);
  });

  it('활성화된 칵테일만 추천한다', async () => {
    await insertCocktails(['mojito', 'tom-collins', 'negroni']);

    const result = await service.recommend(answers);

    const recommendedIds = result.recommendations.map(
      ({ cocktail }) => cocktail.id,
    );

    expect(recommendedIds).toHaveLength(3);

    expect([...recommendedIds].sort()).toEqual([
      'mojito',
      'negroni',
      'tom-collins',
    ]);
  });

  it('후보가 5개를 초과하면 상위 5개만 반환한다', async () => {
    await insertCocktails(cocktailSeeds.map(({ id }) => id));

    const result = await service.recommend(answers);

    expect(result.recommendations).toHaveLength(5);

    const recommendedIds = result.recommendations.map(
      ({ cocktail }) => cocktail.id,
    );

    expect(new Set(recommendedIds).size).toBe(5);
  });

  it('동일한 입력에 대해 추천 결과가 안정적이다', async () => {
    await insertCocktails(cocktailSeeds.map(({ id }) => id));

    const first = await service.recommend(answers);
    const second = await service.recommend(answers);

    expect(second).toEqual(first);
  });

  it('DB의 활성화 상태 변경이 추천 결과에 반영된다', async () => {
    await insertCocktails([]);

    const before = await service.recommend(answers);

    expect(before.recommendations).toEqual([]);

    await dataSource
      .getRepository(CocktailEntity)
      .update({ id: 'mojito' }, { isActive: true });

    const after = await service.recommend(answers);

    expect(after.recommendations).toHaveLength(1);
    expect(after.recommendations[0].cocktail.id).toBe('mojito');
  });

  it('Migration을 재실행해도 기존 테이블을 유지한다', async () => {
    await insertCocktails(['mojito']);

    await dataSource.runMigrations({
      transaction: 'all',
    });

    const count = await dataSource.getRepository(CocktailEntity).count();

    expect(count).toBe(12);
  });
});
