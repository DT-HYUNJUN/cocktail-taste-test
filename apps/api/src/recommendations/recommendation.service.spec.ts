import { describe, expect, it, vi } from 'vitest';
import type { CocktailProfile } from '@cocktail-taste-test/domain';

import type { CocktailReader } from '../cocktails/ports/cocktail-reader.port';
import { RecommendationService } from './recommendation.service';

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

function createCocktail(id: string): CocktailProfile {
  return {
    id,
    name: id,
    dimensions: {
      sweet: 3,
      sour: 4,
      bitter: 2,
      alcoholIntensity: 3,
      refreshing: 5,
    },
    flavors: ['citrus'],
    baseSpirits: ['gin'],
  };
}

function setup(cocktails: CocktailProfile[]) {
  const findEligibleCandidates = vi.fn().mockResolvedValue({
    cocktails,
    imageUrlsByCocktailId: {},
  });

  const reader = {
    findEligibleCandidates,
  } as CocktailReader;

  return {
    service: new RecommendationService(reader),
    findEligibleCandidates,
  };
}

describe('RecommendationService', () => {
  it('후보가 없으면 빈 추천 결과를 반환한다', async () => {
    const { service } = setup([]);

    const result = await service.recommend(answers);

    expect(result.recommendations).toEqual([]);
    expect(result.profile.dimensions).toHaveLength(5);
  });

  it.each([1, 3, 5, 8])(
    '후보가 %i개일 때 최대 5개를 반환한다',
    async (count) => {
      const cocktails = Array.from({ length: count }, (_, i) =>
        createCocktail(`cocktail-${i + 1}`),
      );

      const { service, findEligibleCandidates } = setup(cocktails);

      const result = await service.recommend(answers);

      expect(findEligibleCandidates).toHaveBeenCalledOnce();
      expect(result.recommendations).toHaveLength(Math.min(count, 5));
    },
  );

  it('DB 조회 순서가 달라도 추천 결과가 같다', async () => {
    const cocktails = Array.from({ length: 8 }, (_, i) =>
      createCocktail(`cocktail-${i + 1}`),
    );

    const first = setup(cocktails);
    const second = setup([...cocktails].reverse());

    const resultA = await first.service.recommend(answers);
    const resultB = await second.service.recommend(answers);

    expect(resultA).toEqual(resultB);
  });

  it('잘못된 답변이면 DB를 조회하지 않는다', async () => {
    const { service, findEligibleCandidates } = setup([]);

    await expect(service.recommend([])).rejects.toThrow(
      'Exactly eight question answers are required',
    );

    expect(findEligibleCandidates).not.toHaveBeenCalled();
  });

  it('중복 칵테일 ID를 거부한다', async () => {
    const { service } = setup([
      createCocktail('mojito'),
      createCocktail('mojito'),
    ]);

    await expect(service.recommend(answers)).rejects.toThrow(
      'Duplicate cocktail ID: mojito',
    );
  });

  it('Repository 오류를 전파한다', async () => {
    const { service, findEligibleCandidates } = setup([]);

    findEligibleCandidates.mockRejectedValue(new Error('Database unavailable'));

    await expect(service.recommend(answers)).rejects.toThrow(
      'Database unavailable',
    );
  });
});
