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

  return async (
    event: APIGatewayProxyEventV2,
    context: Context,
    callback,
  ) => {
    const runtime = await getRuntime();
    if (event.rawPath !== '/health') {
      await runtime.ensureReady();
    }
    return runtime.invoke(event, context, callback);
  };
}

export const handler = createLambdaHandler();
