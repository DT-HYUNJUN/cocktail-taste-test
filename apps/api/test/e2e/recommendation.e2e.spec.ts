import 'reflect-metadata';

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { CocktailEntity } from '../../src/cocktails/entities/cocktail.entity';
import {
  clearTestCocktails,
  createTestDataSource,
  destroyTestDatabase,
  getTestDatabaseConfig,
  initializeTestDatabase,
} from '../integration/database-test.helper';

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

describe('Recommendation HTTP E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let baseUrl: string;

  async function postRecommendation(body: unknown) {
    const response = await fetch(`${baseUrl}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return {
      status: response.status,
      body: await response.json(),
    };
  }

  beforeAll(async () => {
    // AppModule이 읽는 환경변수를 테스트 DB로 고정
    const config = getTestDatabaseConfig();

    vi.stubEnv('DATABASE_HOST', config.host);
    vi.stubEnv('DATABASE_PORT', String(config.port));
    vi.stubEnv('DATABASE_USER', config.username);
    vi.stubEnv('DATABASE_PASSWORD', config.password);
    vi.stubEnv('DATABASE_NAME', config.database);

    dataSource = createTestDataSource();

    try {
      await initializeTestDatabase(dataSource);

      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
      await app.listen(0, '127.0.0.1');

      const address = app.getHttpServer().address();

      if (!address || typeof address === 'string') {
        throw new Error('Failed to resolve E2E server port');
      }

      baseUrl = `http://127.0.0.1:${address.port}`;
    } catch (error) {
      try {
        await app?.close();
      } finally {
        try {
          await destroyTestDatabase(dataSource);
        } finally {
          vi.unstubAllEnvs();
        }
      }

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
    try {
      if (dataSource?.isInitialized) {
        await clearTestCocktails(dataSource);
      }
    } finally {
      try {
        await app?.close();
      } finally {
        try {
          if (dataSource) {
            await destroyTestDatabase(dataSource);
          }
        } finally {
          vi.unstubAllEnvs();
        }
      }
    }
  });

  it('정상적인 요청에 HTTP 200을 반환한다', async () => {
    const response = await postRecommendation({
      answers,
    });

    expect(response.status).toBe(200);
    expect(response.body.recommendations).toEqual([]);
  });

  it('잘못된 요청 형식에 HTTP 400을 반환한다', async () => {
    const response = await postRecommendation({
      answers,
      unexpected: true,
    });

    expect(response.status).toBe(400);
  });

  it('활성화된 DB 칵테일을 추천 결과에 포함한다', async () => {
    await dataSource.getRepository(CocktailEntity).insert({
      id: 'mojito',
      name: 'Mojito',
      imageUrl: null,
      sweet: 3,
      sour: 4,
      bitter: 1,
      alcoholIntensity: 2,
      refreshing: 5,
      flavors: ['citrus', 'herbal'],
      baseSpirits: ['rum'],
      isActive: true,
    });

    const response = await postRecommendation({
      answers,
    });

    expect(response.status).toBe(200);
    expect(response.body.recommendations).toHaveLength(1);
    expect(response.body.recommendations[0].cocktail.id).toBe('mojito');
  });

  it('잘못된 Assessment 답변에 HTTP 400을 반환한다', async () => {
    const response = await postRecommendation({
      answers: [],
    });

    expect(response.status).toBe(400);
    expect(response.body.statusCode).toBe(400);
    expect(response.body.message).toBe('Invalid assessment answers');
  });
});
