import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';

import type { CocktailEntity } from '../entities/cocktail.entity';
import { TypeOrmCocktailReader } from './typeorm-cocktail.reader';

function createRow(overrides: Partial<CocktailEntity> = {}): CocktailEntity {
  return {
    id: 'mojito',
    name: 'Mojito',
    imageUrl: null,
    sweet: 3,
    sour: 4,
    bitter: 1,
    alcoholIntensity: 2,
    refreshing: 5,
    flavors: ['herbal', 'citrus'],
    baseSpirits: ['rum'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as CocktailEntity;
}

describe('TypeOrmCocktailReader', () => {
  const find = vi.fn();

  let reader: TypeOrmCocktailReader;

  beforeEach(() => {
    find.mockReset();

    const repository = {
      find,
    } as unknown as Repository<CocktailEntity>;

    reader = new TypeOrmCocktailReader(repository);
  });

  it('활성화된 칵테일만 조회하도록 요청한다', async () => {
    find.mockResolvedValue([]);

    await reader.findEligibleCandidates();

    expect(find).toHaveBeenCalledWith({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  });

  it('조회 결과가 없으면 빈 목록을 반환한다', async () => {
    find.mockResolvedValue([]);

    const result = await reader.findEligibleCandidates();

    expect(result.cocktails).toEqual([]);
    expect(result.imageUrlsByCocktailId).toEqual({});
  });

  it('Entity를 Domain Profile로 변환한다', async () => {
    find.mockResolvedValue([
      createRow({
        imageUrl: 'https://example.com/mojito.jpg',
      }),
    ]);

    const result = await reader.findEligibleCandidates();

    expect(result.cocktails).toHaveLength(1);

    expect(result.cocktails[0]).toMatchObject({
      id: 'mojito',
      name: 'Mojito',
      dimensions: {
        sweet: 3,
        sour: 4,
        bitter: 1,
        alcoholIntensity: 2,
        refreshing: 5,
      },
      flavors: ['citrus', 'herbal'],
      baseSpirits: ['rum'],
    });

    expect(result.imageUrlsByCocktailId).toEqual({
      mojito: 'https://example.com/mojito.jpg',
    });
  });

  it('5개보다 많은 후보도 잘라내지 않는다', async () => {
    const rows = Array.from({ length: 8 }, (_, index) =>
      createRow({
        id: `cocktail-${index + 1}`,
        name: `Cocktail ${index + 1}`,
      }),
    );

    find.mockResolvedValue(rows);

    const result = await reader.findEligibleCandidates();

    expect(result.cocktails).toHaveLength(8);
  });

  it('중복 ID를 거부한다', async () => {
    find.mockResolvedValue([
      createRow({ id: 'mojito' }),
      createRow({ id: 'mojito' }),
    ]);

    await expect(reader.findEligibleCandidates()).rejects.toThrow(
      'Duplicate cocktail ID: mojito',
    );
  });

  it('잘못된 DB 데이터가 있으면 오류를 전파한다', async () => {
    find.mockResolvedValue([createRow({ sweet: 6 })]);

    await expect(reader.findEligibleCandidates()).rejects.toThrow(
      'Invalid cocktail row field: sweet',
    );
  });

  it('DB 조회 실패를 숨기지 않는다', async () => {
    find.mockRejectedValue(new Error('Database unavailable'));

    await expect(reader.findEligibleCandidates()).rejects.toThrow(
      'Database unavailable',
    );
  });
});
