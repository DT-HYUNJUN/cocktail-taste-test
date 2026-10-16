import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  destroy: vi.fn(),
  transaction: vi.fn(),
  getRepository: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock('../data-source', () => ({
  AppDataSource: {
    initialize: mocks.initialize,
    destroy: mocks.destroy,
    transaction: mocks.transaction,
  },
}));

import { seedCocktails } from './seed-cocktails';
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
    mocks.upsert.mockResolvedValue(undefined);

    mocks.getRepository.mockReturnValue({
      upsert: mocks.upsert,
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
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('정상 데이터를 저장한다', async () => {
    const seed = createSeed();

    await expect(seedCocktails([seed])).resolves.toBe(1);

    expect(mocks.initialize).toHaveBeenCalledOnce();
    expect(mocks.transaction).toHaveBeenCalledOnce();

    expect(mocks.upsert).toHaveBeenCalledWith(
      {
        ...seed,
        isActive: false,
      },
      ['id'],
    );

    expect(mocks.destroy).toHaveBeenCalledOnce();
  });

  it('여러 데이터를 저장한다', async () => {
    const seeds = [
      createSeed({ id: 'mojito' }),
      createSeed({ id: 'negroni', name: 'Negroni' }),
    ];

    await expect(seedCocktails(seeds)).resolves.toBe(2);

    expect(mocks.upsert).toHaveBeenCalledTimes(2);
  });

  it('중복 ID를 거부한다', async () => {
    const seeds = [createSeed(), createSeed({ name: 'Another Mojito' })];

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
  });

  it('승인되지 않은 활성화 요청을 거부한다', async () => {
    const seed = createSeed({
      isActive: true,
    });

    await expect(seedCocktails([seed])).rejects.toThrow(
      'Seed activation requires separate approval: mojito',
    );

    expect(mocks.initialize).not.toHaveBeenCalled();
  });

  it('DB 저장 실패 시 연결을 종료하고 오류를 전파한다', async () => {
    mocks.upsert.mockRejectedValueOnce(new Error('Database write failed'));

    await expect(seedCocktails([createSeed()])).rejects.toThrow(
      'Database write failed',
    );

    expect(mocks.destroy).toHaveBeenCalledOnce();
  });
});
