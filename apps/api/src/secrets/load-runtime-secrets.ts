import { GetParametersCommand, SSMClient } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({});

let loadPromise: Promise<void> | undefined;

async function fetchRuntimeSecrets(): Promise<void> {
  const hmacParameterName = process.env.API_HMAC_SECRET_PARAMETER_NAME;

  const databaseParameterName = process.env.DATABASE_PASSWORD_PARAMETER_NAME;

  const isLambdaRuntime = Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (!hmacParameterName && !databaseParameterName) {
    if (isLambdaRuntime) {
      throw new Error('SSM secret configuration is required in Lambda');
    }

    return;
  }

  if (!hmacParameterName || !databaseParameterName) {
    throw new Error('Incomplete SSM secret configuration');
  }

  const response = await ssmClient.send(
    new GetParametersCommand({
      Names: [hmacParameterName, databaseParameterName],
      WithDecryption: true,
    }),
  );

  if (response.InvalidParameters?.length) {
    throw new Error('One or more SSM parameters are unavailable');
  }

  const values = new Map(
    response.Parameters?.map((parameter) => [parameter.Name, parameter.Value]),
  );

  const hmacSecret = values.get(hmacParameterName);
  const databasePassword = values.get(databaseParameterName);

  if (!hmacSecret || hmacSecret.length < 32 || !databasePassword) {
    throw new Error('Invalid or missing runtime secrets');
  }

  process.env.API_HMAC_SECRET = hmacSecret;
  process.env.DATABASE_PASSWORD = databasePassword;
}

export function loadRuntimeSecrets(): Promise<void> {
  loadPromise ??= fetchRuntimeSecrets().catch((error: unknown) => {
    loadPromise = undefined;
    throw error;
  });

  return loadPromise;
}
