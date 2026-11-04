import { Controller, Get, Module } from '@nestjs/common';
import { APP_FILTER, NestFactory } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import * as Sentry from '@sentry/nestjs';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

@Controller('sentry-test')
class TestController {
  @Get()
  throwError(): never {
    throw new Error('Sentry HTTP exception test');
  }
}

@Module({
  controllers: [TestController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
class TestModule {}

describe('SentryGlobalFilter', () => {
  afterEach(async () => {
    await Sentry.close(1000);
  });

  it('HTTP 500 응답을 반환하고 Sentry 이벤트를 생성한다', async () => {
    const capturedEvents: Sentry.Event[] = [];

    Sentry.init({
      dsn: 'https://public@example.com/1',
      defaultIntegrations: false,
      tracesSampleRate: 0,
      beforeSend(event) {
        capturedEvents.push(event);
        return null;
      },
    });

    const app = await NestFactory.create(TestModule, {
      logger: false,
    });

    try {
      await app.init();

      await request(app.getHttpServer()).get('/sentry-test').expect(500);

      await Sentry.flush(1000);

      expect(capturedEvents).toHaveLength(1);
      expect(capturedEvents[0]?.exception?.values?.[0]?.value).toBe(
        'Sentry HTTP exception test',
      );
    } finally {
      await app.close();
    }
  });
});
