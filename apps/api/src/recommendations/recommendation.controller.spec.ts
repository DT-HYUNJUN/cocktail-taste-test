import { describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AssessmentValidationError } from '@cocktail-taste-test/domain';

import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

describe('RecommendationController', () => {
  const recommend = vi.fn();

  const controller = new RecommendationController({
    recommend,
  } as unknown as RecommendationService);

  it('올바른 요청을 Service에 전달한다', async () => {
    const answers = [{ questionId: 'sweet', answerId: 'high' }];
    const result = { profile: {}, recommendations: [] };

    recommend.mockResolvedValueOnce(result);

    await expect(controller.recommend({ answers })).resolves.toEqual(result);

    expect(recommend).toHaveBeenCalledWith(answers);
  });

  it.each([null, [], {}, { answers: [], extra: true }])(
    '잘못된 요청 형식을 거부한다',
    async (body) => {
      await expect(controller.recommend(body)).rejects.toThrow(
        BadRequestException,
      );
    },
  );

  it('Assessment 검증 오류를 400으로 변환한다', async () => {
    recommend.mockRejectedValueOnce(
      new AssessmentValidationError('Invalid answers'),
    );

    await expect(controller.recommend({ answers: [] })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('예상치 못한 서버 오류를 400으로 바꾸지 않는다', async () => {
    recommend.mockRejectedValueOnce(new InternalServerErrorException());

    await expect(controller.recommend({ answers: [] })).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
