import * as Sentry from '@sentry/nestjs';

export async function reportLambdaError(
  error: unknown,
  category: 'secrets' | 'runtime',
): Promise<void> {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    Sentry.captureException(new Error(`Lambda ${category} failure`), {
      tags: {
        errorCategory: category,
        originalErrorType: error instanceof Error ? error.name : 'Unknown',
      },
    });

    await Sentry.flush(2000);
  } catch {
    // Sentry 오류가 기존 API 응답에 영향을 주지 않도록 처리
  }
}
