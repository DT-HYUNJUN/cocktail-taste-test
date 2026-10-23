import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';
import {
  createLambdaHandler,
  type LambdaRuntime,
  type LambdaRuntimeBootstrap,
} from './lambda';

const event: APIGatewayProxyEventV2 = {
  version: '2.0',
  routeKey: 'GET /health',
  rawPath: '/health',
  rawQueryString: '',
  headers: {},
  requestContext: {
    accountId: 'local',
    apiId: 'local',
    domainName: 'localhost',
    domainPrefix: 'local',
    http: {
      method: 'GET',
      path: '/health',
      protocol: 'HTTP/1.1',
      sourceIp: '127.0.0.1',
      userAgent: 'vitest',
    },
    requestId: 'request-id',
    routeKey: 'GET /health',
    stage: '$default',
    time: '22/Oct/2026:00:00:00 +0000',
    timeEpoch: 0,
  },
  isBase64Encoded: false,
};

function signEvent(target: APIGatewayProxyEventV2): void {
  const timestamp = String(Date.now());
  const payload = [
    timestamp,
    target.requestContext.http.method,
    target.rawPath,
    target.body ?? '',
  ].join('\n');
  target.headers['x-cocktail-timestamp'] = timestamp;
  target.headers['x-cocktail-signature'] = createHmac(
    'sha256',
    'lambda-unit-test-secret-at-least-32',
  )
    .update(payload)
    .digest('hex');
}

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

const expectedResponse: APIGatewayProxyResultV2 = {
  statusCode: 200,
  body: JSON.stringify({ status: 'ok' }),
};

const databaseEvent: APIGatewayProxyEventV2 = {
  ...event,
  headers: { ...event.headers },
  routeKey: 'POST /recommendations',
  rawPath: '/recommendations',
  requestContext: {
    ...event.requestContext,
    routeKey: 'POST /recommendations',
    http: {
      ...event.requestContext.http,
      method: 'POST',
      path: '/recommendations',
    },
  },
};

function createRuntime(): LambdaRuntime {
  return {
    ensureReady: vi.fn().mockResolvedValue(undefined),
    invoke: vi.fn().mockResolvedValue(expectedResponse),
  };
}

function responseStatus(response: APIGatewayProxyResultV2 | void): number | undefined {
  return response && typeof response !== 'string' ? response.statusCode : undefined;
}

describe('Lambda handler lifecycle', () => {
  beforeEach(() => {
    vi.stubEnv('API_HMAC_SECRET', 'lambda-unit-test-secret-at-least-32');
    signEvent(event);
    signEvent(databaseEvent);
  });

  afterEach(() => vi.unstubAllEnvs());

  it('reuses one initialization for sequential invocations', async () => {
    const runtime = createRuntime();
    const bootstrap = vi.fn<LambdaRuntimeBootstrap>().mockResolvedValue(runtime);
    const handler = createLambdaHandler(bootstrap);

    await handler(event, context, vi.fn());
    await handler(event, context, vi.fn());

    expect(bootstrap).toHaveBeenCalledTimes(1);
    expect(runtime.ensureReady).not.toHaveBeenCalled();
    expect(runtime.invoke).toHaveBeenCalledTimes(2);
  });

  it('shares initialization across concurrent invocations', async () => {
    const runtime = createRuntime();
    let resolveBootstrap: ((runtime: LambdaRuntime) => void) | undefined;
    const pending = new Promise<LambdaRuntime>((resolve) => {
      resolveBootstrap = resolve;
    });
    const bootstrap = vi.fn<LambdaRuntimeBootstrap>().mockReturnValue(pending);
    const handler = createLambdaHandler(bootstrap);

    const first = handler(event, context, vi.fn());
    const second = handler(event, context, vi.fn());
    resolveBootstrap?.(runtime);
    await Promise.all([first, second]);

    expect(bootstrap).toHaveBeenCalledTimes(1);
    expect(runtime.invoke).toHaveBeenCalledTimes(2);
  });

  it('does not permanently cache a rejected initialization promise', async () => {
    const runtime = createRuntime();
    const bootstrap = vi
      .fn<LambdaRuntimeBootstrap>()
      .mockRejectedValueOnce(new Error('temporary initialization failure'))
      .mockResolvedValueOnce(runtime);
    const handler = createLambdaHandler(bootstrap);

    expect(responseStatus(await handler(databaseEvent, context, vi.fn()))).toBe(503);
    await expect(handler(event, context, vi.fn())).resolves.toEqual(
      expectedResponse,
    );

    expect(bootstrap).toHaveBeenCalledTimes(2);
  });

  it('does not invoke Express when database readiness fails', async () => {
    const runtime = createRuntime();
    vi.mocked(runtime.ensureReady).mockRejectedValue(
      new Error('database unavailable'),
    );
    const handler = createLambdaHandler(async () => runtime);

    expect(responseStatus(await handler(databaseEvent, context, vi.fn()))).toBe(503);
    expect(runtime.invoke).not.toHaveBeenCalled();
  });
});
