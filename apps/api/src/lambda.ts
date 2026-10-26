import { loadRuntimeSecrets } from './secrets/load-runtime-secrets';
import serverlessExpress from '@codegenie/serverless-express';
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context,
} from 'aws-lambda';
import { DataSource } from 'typeorm';
import { createNestApplication } from './app.bootstrap';
import { ensureDatabaseConnection } from './database/database-connection';
import {
  createAuthenticationErrorResponse,
  verifySignedRequest,
} from './request-auth';

type HttpApiHandler = (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback<APIGatewayProxyResultV2>,
) => Promise<APIGatewayProxyResultV2>;

export interface LambdaRuntime {
  readonly invoke: HttpApiHandler;
  ensureReady(): Promise<void>;
  close?(): Promise<void>;
}

export type LambdaRuntimeBootstrap = () => Promise<LambdaRuntime>;

function exceedsBodyLimit(event: APIGatewayProxyEventV2): boolean {
  const configured = Number(process.env.API_MAX_BODY_BYTES ?? 65536);
  const limit =
    Number.isInteger(configured) && configured > 0 ? configured : 65536;
  if (!event.body) return false;
  return (
    Buffer.byteLength(event.body, event.isBase64Encoded ? 'base64' : 'utf8') >
    limit
  );
}

export async function bootstrapLambdaRuntime(): Promise<LambdaRuntime> {
  const app = await createNestApplication();

  try {
    await app.init();
    const dataSource = app.get(DataSource);
    let recoveryPromise: Promise<void> | undefined;

    const expressHandler = serverlessExpress<
      APIGatewayProxyEventV2,
      APIGatewayProxyResultV2
    >({
      app: app.getHttpAdapter().getInstance(),
      respondWithErrors: false,
    });

    return {
      invoke: async (event, context, callback) => {
        const response = await expressHandler(event, context, callback);
        if (response === undefined) {
          throw new Error('Lambda adapter returned no HTTP response');
        }
        return response;
      },
      ensureReady: async () => {
        recoveryPromise ??= ensureDatabaseConnection(dataSource).finally(() => {
          recoveryPromise = undefined;
        });
        await recoveryPromise;
      },
      close: () => app.close(),
    };
  } catch (error) {
    await app.close().catch(() => undefined);
    throw error;
  }
}

export function createLambdaHandler(
  bootstrap: LambdaRuntimeBootstrap = bootstrapLambdaRuntime,
): HttpApiHandler {
  let runtimePromise: Promise<LambdaRuntime> | undefined;

  const getRuntime = (): Promise<LambdaRuntime> => {
    runtimePromise ??= bootstrap().catch((error: unknown) => {
      runtimePromise = undefined;
      throw error;
    });
    return runtimePromise;
  };

  return async (event: APIGatewayProxyEventV2, context: Context, callback) => {
    if (exceedsBodyLimit(event)) {
      return {
        statusCode: 413,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Request body is too large' }),
      };
    }

    try {
      await loadRuntimeSecrets();
    } catch {
      return {
        statusCode: 503,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'Recommendation API is unavailable',
        }),
      };
    }

    const authentication = verifySignedRequest(event);
    if (!authentication.authenticated) {
      return createAuthenticationErrorResponse(authentication.statusCode);
    }

    try {
      const runtime = await getRuntime();
      if (event.rawPath !== '/health') {
        await runtime.ensureReady();
      }
      return await runtime.invoke(event, context, callback);
    } catch {
      return {
        statusCode: 503,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'Recommendation API is unavailable' }),
      };
    }
  };
}

export const handler = createLambdaHandler();
