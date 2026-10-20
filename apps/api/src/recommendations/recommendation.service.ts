import { Inject, Injectable } from '@nestjs/common';
import {
  buildRecommendationResult,
  transformAssessmentAnswers,
  type RecommendationResult,
} from '@cocktail-taste-test/domain';

import {
  COCKTAIL_READER,
  type CocktailReader,
} from '../cocktails/ports/cocktail-reader.port';

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(COCKTAIL_READER)
    private readonly cocktailReader: CocktailReader,
  ) {}

  async recommend(answers: unknown): Promise<RecommendationResult> {
    // Domain이 8개 답변을 검증하고 취향 프로필로 변환
    const profile = transformAssessmentAnswers(answers);

    // 활성화된 모든 칵테일 조회 (LIMIT 5 없음)
    const { cocktails, imageUrlsByCocktailId } =
      await this.cocktailReader.findEligibleCandidates();

    // 모든 후보를 대상으로 추천 순위 계산
    const result = buildRecommendationResult(profile, cocktails, {
      imageUrlsByCocktailId,
    });

    // 순위 계산 이후에만 최대 5개로 제한
    return {
      ...result,
      recommendations: result.recommendations.slice(0, 5),
    };
  }
}
