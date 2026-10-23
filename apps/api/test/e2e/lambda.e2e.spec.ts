import 'reflect-metadata';

import { createHmac } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';
import { bootstrapLambdaRuntime, type LambdaRuntime } from '../../src/lambda';
import {
  createTestDataSource,
  destroyTestDatabase,
  getTestDatabaseConfig,
  initializeTestDatabase,
} from '../integration/database-test.helper';
import type { DataSource } from 'typeorm';

const answers = [
  { questionId: 'sweet', answerId: 'medium' },
  { questionId: 'sour', answerId: 'high' },
  { questionId: 'bitter', answerId: 'low' },
  { questionId: 'alcohol-intensity', answerId: 'medium' },
  { questionId: 'refreshing', answerId: 'very-high' },
  { questionId: 'preferred-flavors', answerIds: ['citrus'] },
  { questionId: 'avoided-flavors', answerIds: [] },
  { questionId: 'preferred-base-spirits', answerIds: ['gin'] },
];

const context: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'local',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:local:000000000000:function:local',
  memoryLimitInMB: '512',
  awsRequestId: 'request-id',
  logGroupName: '/aws/lambda/local',
  logStreamName: 'local',
  getRemainingTimeInMillis: () => 15000,
  done: () => undefined,
  fail: () => undefined,
  succeed: () => undefined,
};

function createEvent(method: string, path: string, body?: unknown): APIGatewayProxyEventV2 {
  const rawBody = body === undefined ? undefined : JSON.stringify(body);
  const timestamp = String(Date.now());
  const signature = createHmac('sha256', 'lambda-e2e-test-secret-at-least-32')
    .update([timestamp, method, path, rawBody ?? ''].join('\n'))
    .digest('hex');
  return {
    version: '2.0',
    routeKey: `${method} ${path}`,
    rawPath: path,
    rawQueryString: '',
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      'x-cocktail-timestamp': timestamp,
      'x-cocktail-signature': signature,
    },
    requestContext: {
      accountId: 'local',
      apiId: 'local',
      domainName: 'localhost',
      domainPrefix: 'local',
      http: {
        method,
        path,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'vitest',
      },
      requestId: 'request-id',
      routeKey: `${method} ${path}`,
      stage: '$default',
      time: '22/Oct/2026:00:00:00 +0000',
      timeEpoch: 0,
    },
    body: rawBody,
    isBase64Encoded: false,
  };
}

function requireHttpResponse(
  response: APIGatewayProxyResultV2 | void,
): Exclude<APIGatewayProxyResultV2, string> {
  if (!response || typeof response === 'string') {
    throw new Error('Expected an API Gateway HTTP response object');
  }
  return response;
}

describe('Lambda HTTP API payload 2.0 E2E', () => {
  let setupDataSource: DataSource;
  let runtime: LambdaRuntime;

  beforeAll(async () => {
    const config = getTestDatabaseConfig();
    vi.stubEnv('DATABASE_HOST', config.host);
    vi.stubEnv('DATABASE_PORT', String(config.port));
    vi.stubEnv('DATABASE_USER', config.username);
    vi.stubEnv('DATABASE_PASSWORD', config.password);
    vi.stubEnv('DATABASE_NAME', config.database);
    vi.stubEnv('DATABASE_SSL_MODE', 'disable');
    vi.stubEnv('DATABASE_POOL_MAX', '1');
    vi.stubEnv('API_HMAC_SECRET', 'lambda-e2e-test-secret-at-least-32');

    setupDataSource = createTestDataSource();
    await initializeTestDatabase(setupDataSource);
    runtime = await bootstrapLambdaRuntime();
  });

  afterAll(async () => {
    try {
      await runtime?.close?.();
    } finally {
      try {
        await destroyTestDatabase(setupDataSource);
      } finally {
        vi.unstubAllEnvs();
      }
    }
  });

  it('serves GET /health through an HTTP API v2 event', async () => {
    const response = requireHttpResponse(
      await runtime.invoke(createEvent('GET', '/health'), context, vi.fn()),
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body ?? '{}')).toEqual({ status: 'ok' });
  });

  it('serves POST /recommendations with the existing contract', async () => {
    await runtime.ensureReady();
    const response = requireHttpResponse(
      await runtime.invoke(
        createEvent('POST', '/recommendations', { answers }),
        context,
        vi.fn(),
      ),
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body ?? '{}').recommendations).toEqual([]);
  });

  it('returns HTTP 400 for an invalid recommendation request', async () => {
    await runtime.ensureReady();
    const response = requireHttpResponse(
      await runtime.invoke(
        createEvent('POST', '/recommendations', { answers: [] }),
        context,
        vi.fn(),
      ),
    );

    expect(response.statusCode).toBe(400);
  });
});
