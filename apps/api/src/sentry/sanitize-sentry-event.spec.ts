import type { ErrorEvent } from '@sentry/nestjs';
import { describe, expect, it } from 'vitest';
import { sanitizeSentryEvent } from './sanitize-sentry-event';

describe('sanitizeSentryEvent', () => {
  it('민감한 이벤트 정보와 오류 메시지를 제거한다', () => {
    const secret = 'SECRET_VALUE_SHOULD_NOT_BE_SENT';

    const event: ErrorEvent = {
      type: undefined,
      message: secret,
      request: {
        url: `https://example.com?token=${secret}`,
      },
      user: {
        email: 'private@example.com',
      },
      extra: {
        password: secret,
      },
      contexts: {
        custom: {
          token: secret,
        },
      },
      breadcrumbs: [
        {
          message: secret,
        },
      ],
      exception: {
        values: [
          {
            type: 'Error',
            value: secret,
            stacktrace: {
              frames: [
                {
                  filename: 'src/example.ts',
                  function: 'example',
                  vars: {
                    password: secret,
                  },
                  context_line: secret,
                  pre_context: [secret],
                  post_context: [secret],
                },
              ],
            },
          },
        ],
      },
    };

    const sanitized = sanitizeSentryEvent(event);

    expect(sanitized.request).toBeUndefined();
    expect(sanitized.user).toBeUndefined();
    expect(sanitized.extra).toBeUndefined();
    expect(sanitized.contexts).toBeUndefined();
    expect(sanitized.breadcrumbs).toBeUndefined();
    expect(sanitized.message).toBeUndefined();

    expect(sanitized.exception?.values?.[0]?.value).toBe('Application error');

    expect(
      sanitized.exception?.values?.[0]?.stacktrace?.frames?.[0]?.vars,
    ).toBeUndefined();

    expect(JSON.stringify(sanitized)).not.toContain(secret);
  });
});
