import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    beforeSend(event) {
      delete event.request;
      delete event.user;
      delete event.breadcrumbs;
      delete event.extra;
      delete event.contexts;
      delete event.message;

      if (event.exception?.values) {
        for (const exception of event.exception.values) {
          exception.value = "Application error";

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
    },
  });
}
