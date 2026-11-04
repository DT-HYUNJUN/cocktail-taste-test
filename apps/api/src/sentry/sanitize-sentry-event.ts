import type { ErrorEvent } from '@sentry/nestjs';

export function sanitizeSentryEvent(event: ErrorEvent): ErrorEvent {
  delete event.request;
  delete event.user;
  delete event.breadcrumbs;
  delete event.extra;
  delete event.contexts;
  delete event.message;

  if (event.exception?.values) {
    for (const exception of event.exception.values) {
      exception.value = 'Application error';

      if (exception.stacktrace?.frames) {
        for (const frame of exception.stacktrace.frames) {
          delete frame.vars;
          delete frame.context_line;
          delete frame.pre_context;
          delete frame.post_context;
        }
      }
    }
  }

  return event;
}
