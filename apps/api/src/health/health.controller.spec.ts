import { ServiceUnavailableException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const query = vi.fn();

  beforeEach(async () => {
    query.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getDataSourceToken(),
          useValue: { query },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns a non-sensitive liveness response without querying the database', () => {
    expect(controller.liveness()).toEqual({ status: 'ok' });
    expect(query).not.toHaveBeenCalled();
  });

  it('returns ready after a successful database probe', async () => {
    query.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.readiness()).resolves.toEqual({ status: 'ok' });
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns a generic unavailable error when the database probe fails', async () => {
    query.mockRejectedValue(new Error('connection details'));

    await expect(controller.readiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
