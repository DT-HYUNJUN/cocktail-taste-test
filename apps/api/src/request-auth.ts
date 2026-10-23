import { createHmac, timingSafeEqual } from 'node:crypto';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

const TIMESTAMP_HEADER = 'x-cocktail-timestamp';
const SIGNATURE_HEADER = 'x-cocktail-signature';
const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

export type RequestAuthenticationResult =
  | { authenticated: true }
  | { authenticated: false; statusCode: 401 | 403 | 503 };

function getHeader(event: APIGatewayProxyEventV2, name: string): string | undefined {
  const entry = Object.entries(event.headers).find(
    ([headerName]) => headerName.toLowerCase() === name,
  );
  return entry?.[1]?.trim();
}

function getRawBody(event: APIGatewayProxyEventV2): string {
  if (!event.body) {
    return '';
  }
  return event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
}

function createPayload(event: APIGatewayProxyEventV2, timestamp: string): string {
  return [
    timestamp,
    event.requestContext.http.method.toUpperCase(),
    event.rawPath,
    getRawBody(event),
  ].join('\n');
}

function readMaxAgeMs(): number {
  const raw = process.env.API_HMAC_MAX_AGE_MS?.trim();
  if (!raw) {
    return DEFAULT_MAX_AGE_MS;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('API_HMAC_MAX_AGE_MS must be a positive integer');
  }
  return value;
}

export function verifySignedRequest(
  event: APIGatewayProxyEventV2,
  now = Date.now(),
): RequestAuthenticationResult {
  const secret = process.env.API_HMAC_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return { authenticated: false, statusCode: 503 };
  }

  const timestamp = getHeader(event, TIMESTAMP_HEADER);
  const suppliedSignature = getHeader(event, SIGNATURE_HEADER);
  if (!timestamp || !suppliedSignature) {
    return { authenticated: false, statusCode: 401 };
  }

  const timestampMs = Number(timestamp);
  if (
    !Number.isSafeInteger(timestampMs) ||
    Math.abs(now - timestampMs) > readMaxAgeMs()
  ) {
    return { authenticated: false, statusCode: 401 };
  }

  const suppliedBuffer = Buffer.from(suppliedSignature, 'utf8');
  const secrets = [secret, process.env.API_HMAC_PREVIOUS_SECRET?.trim()].filter(
    (candidate): candidate is string =>
      Boolean(candidate && candidate.length >= 32),
  );
  let matched = false;
  for (const candidate of secrets) {
    const expectedBuffer = Buffer.from(
      createHmac('sha256', candidate)
        .update(createPayload(event, timestamp))
        .digest('hex'),
      'utf8',
    );
    if (
      suppliedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      matched = true;
    }
  }

  if (!matched) {
    return { authenticated: false, statusCode: 403 };
  }

  return { authenticated: true };
}

export function createAuthenticationErrorResponse(
  statusCode: 401 | 403 | 503,
) {
  const message =
    statusCode === 503
      ? 'Recommendation API is not configured'
      : 'Unauthorized request';
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message }),
  };
}
