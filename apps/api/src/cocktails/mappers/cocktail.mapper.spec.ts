import { describe, expect, it } from 'vitest';
import type { CocktailEntity } from '../entities/cocktail.entity';
import { InvalidCocktailRowError, mapCocktailEntity } from './cocktail.mapper';

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

describe('mapCocktailEntity', () => {
  it('정상 Entity를 Domain 모델로 변환한다', () => {
    const result = mapCocktailEntity(createRow());

    expect(result.cocktail).toEqual({
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

    expect(result.imageUrl).toBeNull();
  });

  it.each([
    ['sweet', 0],
    ['sour', 6],
    ['bitter', 2.5],
    ['alcoholIntensity', null],
    ['refreshing', undefined],
  ])('잘못된 점수 %s=%s를 거부한다', (field, value) => {
    const row = createRow({ [field]: value } as Partial<CocktailEntity>);

    expect(() => mapCocktailEntity(row)).toThrow(InvalidCocktailRowError);
  });

  it('알 수 없는 Flavor를 거부한다', () => {
    expect(() =>
      mapCocktailEntity(createRow({ flavors: ['chocolate'] })),
    ).toThrow(InvalidCocktailRowError);
  });

  it('중복 Flavor를 거부한다', () => {
    expect(() =>
      mapCocktailEntity(createRow({ flavors: ['citrus', 'citrus'] })),
    ).toThrow(InvalidCocktailRowError);
  });

  it('알 수 없는 BaseSpirit를 거부한다', () => {
    expect(() =>
      mapCocktailEntity(createRow({ baseSpirits: ['brandy'] })),
    ).toThrow(InvalidCocktailRowError);
  });

  it('중복 BaseSpirit를 거부한다', () => {
    expect(() =>
      mapCocktailEntity(createRow({ baseSpirits: ['gin', 'gin'] })),
    ).toThrow(InvalidCocktailRowError);
  });

  it('빈 ID와 이름을 거부한다', () => {
    expect(() => mapCocktailEntity(createRow({ id: '   ' }))).toThrow(
      InvalidCocktailRowError,
    );

    expect(() => mapCocktailEntity(createRow({ name: '' }))).toThrow(
      InvalidCocktailRowError,
    );
  });

  it('이미지 URL을 Domain 모델과 분리한다', () => {
    const result = mapCocktailEntity(
      createRow({ imageUrl: 'https://example.com/mojito.jpg' }),
    );

    expect(result.imageUrl).toBe('https://example.com/mojito.jpg');
    expect(result.cocktail).not.toHaveProperty('imageUrl');
  });
});
