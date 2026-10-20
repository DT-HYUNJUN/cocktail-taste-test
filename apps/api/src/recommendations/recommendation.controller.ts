import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { AssessmentValidationError } from '@cocktail-taste-test/domain';

import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
export class RecommendationController {
  constructor(
    @Inject(RecommendationService)
    private readonly recommendationService: RecommendationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async recommend(@Body() body: unknown) {
    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body) ||
      !('answers' in body) ||
      Object.keys(body).length !== 1
    ) {
      throw new BadRequestException('Invalid recommendation request');
    }

    try {
      return await this.recommendationService.recommend(body.answers);
    } catch (error) {
      if (error instanceof AssessmentValidationError) {
        throw new BadRequestException('Invalid assessment answers');
      }

      throw error;
    }
  }
}
