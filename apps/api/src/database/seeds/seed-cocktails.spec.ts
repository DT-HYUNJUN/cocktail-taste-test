import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const execute = vi.fn();

  const queryBuilder = {
    insert: vi.fn(),
    into: vi.fn(),
    values: vi.fn(),
    orIgnore: vi.fn(),
    returning: vi.fn(),
    execute,
  };

  return {
    initialize: vi.fn(),
    destroy: vi.fn(),
    transaction: vi.fn(),
    getRepository: vi.fn(),
    createQueryBuilder: vi.fn(),
    queryBuilder,
    execute,
  };
});

vi.mock('../data-source', () => ({
  AppDataSource: {
    initialize: mocks.initialize,
    destroy: mocks.destroy,
    transaction: mocks.transaction,
  },
}));

import { CocktailEntity } from '../../cocktails/entities/cocktail.entity';
import { isSeedCliEntry, seedCocktails } from './seed-cocktails';
import type { CocktailSeed } from './cocktail-seed.types';

function createSeed(overrides: Partial<CocktailSeed> = {}): CocktailSeed {
  return {
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
    isActive: false,
    ...overrides,
  };
}

describe('seedCocktails', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.initialize.mockResolvedValue(undefined);
    mocks.destroy.mockResolvedValue(undefined);
    mocks.execute.mockResolvedValue({ raw: [{ id: 'inserted' }] });

    const builder = mocks.queryBuilder;

    builder.insert.mockReturnValue(builder);
    builder.into.mockReturnValue(builder);
    builder.values.mockReturnValue(builder);
    builder.orIgnore.mockReturnValue(builder);
    builder.returning.mockReturnValue(builder);

    mocks.createQueryBuilder.mockReturnValue(builder);

    mocks.getRepository.mockReturnValue({
      createQueryBuilder: mocks.createQueryBuilder,
    });

    mocks.transaction.mockImplementation(
      async (
        callback: (manager: {
          getRepository: typeof mocks.getRepository;
        }) => Promise<void>,
      ) =>
        callback({
          getRepository: mocks.getRepository,
        }),
    );
  });

  it('빈 데이터는 DB에 연결하지 않고 0을 반환한다', async () => {
    await expect(seedCocktails([])).resolves.toBe(0);

    expect(mocks.initialize).not.toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it('새로운 Seed를 비활성 상태로 INSERT한다', async () => {
    const seed = createSeed();

    await expect(seedCocktails([seed])).resolves.toBe(1);

    expect(mocks.initialize).toHaveBeenCalledOnce();
    expect(mocks.transaction).toHaveBeenCalledOnce();

    expect(mocks.queryBuilder.insert).toHaveBeenCalledOnce();
    expect(mocks.queryBuilder.into).toHaveBeenCalledWith(CocktailEntity);
    expect(mocks.queryBuilder.values).toHaveBeenCalledWith({
      ...seed,
      isActive: false,
    });

    expect(mocks.queryBuilder.orIgnore).toHaveBeenCalledOnce();
    expect(mocks.queryBuilder.returning).toHaveBeenCalledWith(['id']);
    expect(mocks.execute).toHaveBeenCalledOnce();
    expect(mocks.destroy).toHaveBeenCalledOnce();
  });

  it('여러 Seed를 처리한다', async () => {
    const seeds = [
      createSeed(),
      createSeed({
        id: 'negroni',
        name: 'Negroni',
      }),
    ];

    await expect(seedCocktails(seeds)).resolves.toBe(2);

    expect(mocks.execute).toHaveBeenCalledTimes(2);
    expect(mocks.queryBuilder.orIgnore).toHaveBeenCalledTimes(2);
  });

  it('returns zero when every stable ID already exists', async () => {
    mocks.execute.mockResolvedValue({ raw: [] });

    await expect(seedCocktails([createSeed()])).resolves.toBe(0);

    expect(mocks.queryBuilder.orIgnore).toHaveBeenCalledOnce();
  });

  it('충돌을 무시하는 INSERT 정책을 사용한다', async () => {
    await seedCocktails([createSeed()]);

    // ON CONFLICT DO NOTHING을 생성하는 TypeORM 메서드.
    expect(mocks.queryBuilder.orIgnore).toHaveBeenCalledOnce();

    // UPDATE나 UPSERT를 호출하는 경로는 사용하지 않는다.
    expect(mocks.queryBuilder.insert).toHaveBeenCalledOnce();
  });

  it('중복 ID를 DB 연결 전에 거부한다', async () => {
    const seeds = [createSeed(), createSeed({ name: 'Duplicate Mojito' })];

    await expect(seedCocktails(seeds)).rejects.toThrow(
      'Duplicate seed ID: mojito',
    );

    expect(mocks.initialize).not.toHaveBeenCalled();
  });

  it('잘못된 맛 점수를 거부한다', async () => {
    const seed = createSeed({
      sweet: 6 as CocktailSeed['sweet'],
    });

    await expect(seedCocktails([seed])).rejects.toThrow(
      'Invalid cocktail row field: sweet',
    );

    expect(mocks.initialize).not.toHaveBeenCalled();
  });

  it('알 수 없는 Flavor를 거부한다', async () => {
    const seed = createSeed({
      flavors: ['chocolate' as CocktailSeed['flavors'][number]],
    });

    await expect(seedCocktails([seed])).rejects.toThrow(
      'Invalid cocktail row field: flavors',
    );

    expect(mocks.initialize).not.toHaveBeenCalled();
  });

  it('Seed를 통한 활성화 요청을 거부한다', async () => {
    await expect(
      seedCocktails([createSeed({ isActive: true })]),
    ).rejects.toThrow('Seed activation requires separate approval: mojito');

    expect(mocks.initialize).not.toHaveBeenCalled();
  });

  it('DB 저장 실패 시 연결을 종료하고 오류를 전파한다', async () => {
    mocks.execute.mockRejectedValueOnce(new Error('Database write failed'));

    await expect(seedCocktails([createSeed()])).rejects.toThrow(
      'Database write failed',
    );

    expect(mocks.destroy).toHaveBeenCalledOnce();
  });
});

describe('isSeedCliEntry', () => {
  it.each([
    '/workspace/apps/api/src/database/seeds/seed-cocktails.ts',
    '/app/dist/database/seeds/seed-cocktails.js',
    'C:\\app\\dist\\database\\seeds\\seed-cocktails.js',
  ])('accepts source and compiled CLI entry paths: %s', (entryPath) => {
    expect(isSeedCliEntry(entryPath)).toBe(true);
  });

  it('rejects imports from another entry point', () => {
    expect(isSeedCliEntry('/app/dist/main.js')).toBe(false);
  });
});
