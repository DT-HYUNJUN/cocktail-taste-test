import * as Sentry from '@sentry/nestjs';
import { sanitizeSentryEvent } from './sentry/sanitize-sentry-event';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0,
    beforeSend: sanitizeSentryEvent,
  });
}
