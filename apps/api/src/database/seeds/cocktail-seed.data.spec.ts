import { describe, expect, it } from 'vitest';
import { BASE_SPIRITS, FLAVORS } from '@cocktail-taste-test/domain';

import { cocktailSeeds } from './cocktail-seed.data';

describe('Cocktail Dataset v1 Seed', () => {
  it('승인된 12개 칵테일을 포함한다', () => {
    expect(cocktailSeeds).toHaveLength(12);

    expect(cocktailSeeds.map(({ id }) => id)).toEqual([
      'mojito',
      'tom-collins',
      'negroni',
      'margarita',
      'mezcal-margarita',
      'pina-colada',
      'tequila-sunrise',
      'espresso-martini',
      'old-fashioned',
      'manhattan',
      'dry-martini',
      'americano',
    ]);
  });

  it('ID는 중복되지 않고 kebab-case를 사용한다', () => {
    const ids = cocktailSeeds.map(({ id }) => id);

    expect(new Set(ids).size).toBe(ids.length);

    for (const id of ids) {
      expect(id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
    }
  });

  it('모든 맛 점수는 1~5 범위의 정수다', () => {
    for (const seed of cocktailSeeds) {
      const scores = [
        seed.sweet,
        seed.sour,
        seed.bitter,
        seed.alcoholIntensity,
        seed.refreshing,
      ];

      for (const score of scores) {
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(5);
      }
    }
  });

  it('Flavor와 BaseSpirit는 표준 어휘를 사용한다', () => {
    for (const seed of cocktailSeeds) {
      for (const flavor of seed.flavors) {
        expect(FLAVORS).toContain(flavor);
      }

      for (const spirit of seed.baseSpirits) {
        expect(BASE_SPIRITS).toContain(spirit);
      }

      expect(new Set(seed.flavors).size).toBe(seed.flavors.length);
      expect(new Set(seed.baseSpirits).size).toBe(seed.baseSpirits.length);
    }
  });

  it('모든 칵테일은 이미지 없이 비활성 상태로 시작한다', () => {
    for (const seed of cocktailSeeds) {
      expect(seed.imageUrl).toBeNull();
      expect(seed.isActive).toBe(false);
    }
  });

  it('검토 과정에서 결정한 주요 Flavor를 유지한다', () => {
    const byId = new Map(cocktailSeeds.map((seed) => [seed.id, seed]));

    expect(byId.get('negroni')?.flavors).toEqual(['herbal']);
    expect(byId.get('americano')?.flavors).toEqual(['herbal']);
    expect(byId.get('old-fashioned')?.flavors).toEqual([]);
    expect(byId.get('manhattan')?.flavors).toEqual(['herbal']);
    expect(byId.get('tom-collins')?.flavors).toEqual(['citrus']);
  });

  it('Americano는 표준 BaseSpirit가 없어 빈 배열을 사용한다', () => {
    const americano = cocktailSeeds.find((seed) => seed.id === 'americano');

    expect(americano?.baseSpirits).toEqual([]);
  });
});
