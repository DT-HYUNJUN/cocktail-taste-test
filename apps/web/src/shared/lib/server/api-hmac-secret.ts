import {
  GetParameterCommand,
  SSMClient,
} from "@aws-sdk/client-ssm";

let cachedSecretKey: string | undefined;
let secretPromise: Promise<string> | undefined;

function validateSecret(secret: string | undefined): string {
  if (!secret || secret.length < 32) {
    throw new Error("Invalid API HMAC secret");
  }

  return secret;
}

export function clearApiHmacSecretCache(): void {
  cachedSecretKey = undefined;
  secretPromise = undefined;
}

export function loadApiHmacSecret(): Promise<string> {
  if (process.env.NODE_ENV !== "production") {
    return Promise.resolve(validateSecret(process.env.API_HMAC_SECRET?.trim()));
  }

  const region = process.env.API_AWS_REGION?.trim();
  const parameterName = process.env.API_HMAC_SECRET_PARAMETER_NAME?.trim();

  if (!region || !parameterName) {
    return Promise.reject(new Error("Missing API HMAC SSM configuration"));
  }

  const secretKey = `${region}:${parameterName}`;

  if (cachedSecretKey !== secretKey) {
    cachedSecretKey = secretKey;
    secretPromise = undefined;
  }

  secretPromise ??= new SSMClient({ region })
    .send(
      new GetParameterCommand({
        Name: parameterName,
        WithDecryption: true,
      }),
    )
    .then(({ Parameter }) => validateSecret(Parameter?.Value?.trim()))
    .catch((error: unknown) => {
      clearApiHmacSecretCache();
      throw error;
    });

  return secretPromise;
}
