import type { RecommendationResponse } from '@cocktail-taste-test/contracts';
import { describe, expect, it, vi } from 'vitest';

import type { RecommendationService } from '../recommendations/recommendation.service';
import type { SharedResultEntity } from './entities/shared-result.entity';
import { SharedResultService } from './shared-result.service';

const result: RecommendationResponse = {
  profile: {
    dimensions: [{ dimension: 'sweet', score: 3 }],
    preferredFlavors: [],
    avoidedFlavors: [],
    preferredBaseSpirits: [],
  },
  recommendations: [],
};

function setup() {
  const recommend = vi.fn().mockResolvedValue(result);
  const insert = vi.fn().mockResolvedValue({});
  const deleteExpired = vi.fn().mockResolvedValue({ affected: 0 });
  const findOne = vi.fn();
  const service = new SharedResultService(
    { recommend } as unknown as RecommendationService,
    { insert, delete: deleteExpired, findOne } as never,
  );
  return { service, recommend, insert, deleteExpired, findOne };
}

describe('SharedResultService', () => {
  it('recomputes an authoritative result and stores only the snapshot with a 30-day expiry', async () => {
    const { service, recommend, insert, deleteExpired } = setup();
    const answers = [{ questionId: 'sweet', answerId: 'medium' }];
    const created = await service.create(answers);

    expect(recommend).toHaveBeenCalledWith(answers);
    expect(deleteExpired).toHaveBeenCalledOnce();
    expect(created.shareId).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      id: created.shareId,
      schemaVersion: 1,
      result,
      expiresAt: expect.any(Date),
    }));
    expect(Date.parse(created.expiresAt)).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
  });

  it('returns only valid, unexpired snapshots and rejects malformed IDs before querying', async () => {
    const { service, findOne } = setup();
    expect(await service.find('bad')).toBeNull();
    expect(findOne).not.toHaveBeenCalled();

    const createdAt = new Date('2026-11-17T00:00:00.000Z');
    const expiresAt = new Date('2026-12-17T00:00:00.000Z');
    findOne.mockResolvedValueOnce({ result, createdAt, expiresAt } satisfies Partial<SharedResultEntity>);
    await expect(service.find('abcdefghijklmnopqrstuv')).resolves.toEqual({
      result,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  });
});
