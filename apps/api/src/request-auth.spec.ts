import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { verifySignedRequest } from './request-auth';

const now = 1_700_000_000_000;
const secret = 'test-secret-that-is-not-used-in-production';

function createEvent(body = '{"answers":[]}'): APIGatewayProxyEventV2 {
  const timestamp = String(now);
  const signature = createHmac('sha256', secret)
    .update([timestamp, 'POST', '/recommendations', body].join('\n'))
    .digest('hex');
  return {
    version: '2.0',
    routeKey: 'POST /recommendations',
    rawPath: '/recommendations',
    rawQueryString: '',
    headers: {
      'x-cocktail-timestamp': timestamp,
      'x-cocktail-signature': signature,
    },
    requestContext: {
      accountId: 'local', apiId: 'local', domainName: 'localhost', domainPrefix: 'local',
      http: { method: 'POST', path: '/recommendations', protocol: 'HTTP/1.1', sourceIp: '127.0.0.1', userAgent: 'vitest' },
      requestId: 'id', routeKey: 'POST /recommendations', stage: '$default', time: 'now', timeEpoch: now,
    },
    body,
    isBase64Encoded: false,
  };
}

describe('verifySignedRequest', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('accepts a valid signature', () => {
    vi.stubEnv('API_HMAC_SECRET', secret);
    expect(verifySignedRequest(createEvent(), now)).toEqual({ authenticated: true });
  });

  it('rejects missing and invalid signatures', () => {
    vi.stubEnv('API_HMAC_SECRET', secret);
    const missing = createEvent();
    missing.headers = {};
    expect(verifySignedRequest(missing, now)).toEqual({ authenticated: false, statusCode: 401 });
    const invalid = createEvent();
    invalid.headers['x-cocktail-signature'] = 'invalid';
    expect(verifySignedRequest(invalid, now)).toEqual({ authenticated: false, statusCode: 403 });
  });

  it('rejects expired timestamps and modified bodies', () => {
    vi.stubEnv('API_HMAC_SECRET', secret);
    expect(verifySignedRequest(createEvent(), now + 300_001)).toEqual({ authenticated: false, statusCode: 401 });
    const modified = createEvent();
    modified.body = '{"answers":["modified"]}';
    expect(verifySignedRequest(modified, now)).toEqual({ authenticated: false, statusCode: 403 });
  });

  it('fails closed without a configured secret', () => {
    expect(verifySignedRequest(createEvent(), now)).toEqual({ authenticated: false, statusCode: 503 });
  });
});
