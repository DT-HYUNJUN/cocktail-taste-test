import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssessmentValidationError } from '@cocktail-taste-test/domain';
import { describe, expect, it, vi } from 'vitest';

import { SharedResultController } from './shared-result.controller';
import type { SharedResultService } from './shared-result.service';

describe('SharedResultController', () => {
  const create = vi.fn();
  const find = vi.fn();
  const controller = new SharedResultController({ create, find } as unknown as SharedResultService);

  it('creates a shared result from assessment answers', async () => {
    const answers = [{ questionId: 'sweet', answerId: 'high' }];
    const created = { shareId: 'abcdefghijklmnopqrstuv', expiresAt: '2026-12-17T00:00:00.000Z' };
    create.mockResolvedValueOnce(created);
    await expect(controller.create({ answers })).resolves.toEqual(created);
    expect(create).toHaveBeenCalledWith(answers);
  });

  it.each([null, [], {}, { answers: [], extra: true }])('rejects malformed create requests', async (body) => {
    await expect(controller.create(body)).rejects.toThrow(BadRequestException);
  });

  it('maps invalid assessment answers to 400', async () => {
    create.mockRejectedValueOnce(new AssessmentValidationError('invalid'));
    await expect(controller.create({ answers: [] })).rejects.toThrow(BadRequestException);
  });

  it('returns a stored result and maps missing results to 404', async () => {
    find.mockResolvedValueOnce({ result: {}, createdAt: '', expiresAt: '' });
    await expect(controller.find('abcdefghijklmnopqrstuv')).resolves.toBeDefined();
    find.mockResolvedValueOnce(null);
    await expect(controller.find('abcdefghijklmnopqrstuv')).rejects.toThrow(NotFoundException);
  });
});
