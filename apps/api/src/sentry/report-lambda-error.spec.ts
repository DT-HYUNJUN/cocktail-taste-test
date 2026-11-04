import * as Sentry from '@sentry/nestjs';
import { afterEach, describe, expect, it } from 'vitest';
import { reportLambdaError } from './report-lambda-error';

describe('reportLambdaError', () => {
  const originalDsn = process.env.SENTRY_DSN;

  afterEach(async () => {
    await Sentry.close(1000);

    if (originalDsn === undefined) {
      delete process.env.SENTRY_DSN;
    } else {
      process.env.SENTRY_DSN = originalDsn;
    }
  });

  it('원본 오류 메시지 대신 오류 유형을 수집한다', async () => {
    const capturedEvents: Sentry.Event[] = [];

    process.env.SENTRY_DSN = 'https://public@example.com/1';

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      defaultIntegrations: false,
      tracesSampleRate: 0,
      beforeSend(event) {
        capturedEvents.push(event);
        return null;
      },
    });

    await reportLambdaError(
      new Error('SECRET_VALUE_SHOULD_NOT_BE_SENT'),
      'secrets',
    );

    expect(capturedEvents).toHaveLength(1);

    const event = capturedEvents[0];

    expect(event?.exception?.values?.[0]?.value).toBe('Lambda secrets failure');

    expect(event?.tags?.errorCategory).toBe('secrets');
    expect(event?.tags?.originalErrorType).toBe('Error');

    expect(JSON.stringify(event)).not.toContain(
      'SECRET_VALUE_SHOULD_NOT_BE_SENT',
    );
  });

  it('SENTRY_DSN이 없으면 오류 수집을 건너뛴다', async () => {
    delete process.env.SENTRY_DSN;

    const capturedEvents: Sentry.Event[] = [];

    Sentry.init({
      dsn: 'https://public@example.com/1',
      defaultIntegrations: false,
      beforeSend(event) {
        capturedEvents.push(event);
        return null;
      },
    });

    await expect(
      reportLambdaError(new Error('Test error'), 'runtime'),
    ).resolves.toBeUndefined();

    await Sentry.flush(1000);

    expect(capturedEvents).toHaveLength(0);
  });

  it('Sentry 이벤트 처리 중 오류가 발생해도 예외를 전파하지 않는다', async () => {
    process.env.SENTRY_DSN = 'https://public@example.com/1';

    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      defaultIntegrations: false,
      beforeSend() {
        throw new Error('Sentry processing failure');
      },
    });

    await expect(
      reportLambdaError(new Error('Original error'), 'runtime'),
    ).resolves.toBeUndefined();
  });
});
