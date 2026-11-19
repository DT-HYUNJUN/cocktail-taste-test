import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  parseRecommendationResponse,
  type CreateSharedResultResponse,
  type SharedResultResponse,
} from '@cocktail-taste-test/contracts';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, QueryFailedError, Repository } from 'typeorm';

import { RecommendationService } from '../recommendations/recommendation.service';
import { SharedResultEntity } from './entities/shared-result.entity';

const SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SHARED_RESULT_SCHEMA_VERSION = 1;

@Injectable()
export class SharedResultService {
  constructor(
    @Inject(RecommendationService)
    private readonly recommendationService: RecommendationService,
    @InjectRepository(SharedResultEntity)
    private readonly repository: Repository<SharedResultEntity>,
  ) {}

  async create(answers: unknown): Promise<CreateSharedResultResponse> {
    const result = parseRecommendationResponse(
      await this.recommendationService.recommend(answers),
    );
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SHARE_TTL_MS);

    await this.repository.delete({ expiresAt: LessThanOrEqual(now) });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const id = randomBytes(16).toString('base64url');
      try {
        await this.repository.insert({
          id,
          schemaVersion: SHARED_RESULT_SCHEMA_VERSION,
          result,
          expiresAt,
        });
        return { shareId: id, expiresAt: expiresAt.toISOString() };
      } catch (error) {
        const isDuplicate =
          error instanceof QueryFailedError &&
          typeof error.driverError === 'object' &&
          error.driverError !== null &&
          'code' in error.driverError &&
          error.driverError.code === '23505';
        if (!isDuplicate || attempt === 2) throw error;
      }
    }

    throw new Error('Unable to create shared result');
  }

  async find(id: string): Promise<SharedResultResponse | null> {
    if (!/^[A-Za-z0-9_-]{22}$/.test(id)) return null;

    const entity = await this.repository.findOne({
      where: {
        id,
        schemaVersion: SHARED_RESULT_SCHEMA_VERSION,
        expiresAt: MoreThan(new Date()),
      },
    });
    if (!entity) return null;

    return {
      result: parseRecommendationResponse(entity.result),
      createdAt: entity.createdAt.toISOString(),
      expiresAt: entity.expiresAt.toISOString(),
    };
  }
}
