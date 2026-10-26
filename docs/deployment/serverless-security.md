# Serverless API Security and Resilience

Status: Implemented Locally
Version: 0.1
Phase: 5 / P5-04
Last Updated: 2026-10-23

## 1. Selected authentication design

The selected design is **B: HMAC verification at the NestJS Lambda entry point**.

An HTTP API Lambda authorizer payload contains headers, route data, query data, and request context, but its documented payload does not contain the original request body. It therefore cannot prove body integrity. A header-only authorizer plus a second body check would add another paid Lambda invocation without removing the integration-level verification. IAM/SigV4 would require an AWS caller credential or a verified workload-identity path in Vercel, which is not yet approved.

The browser remains anonymous and calls only the same-origin Vercel Route Handler. Vercel serializes the validated JSON once and signs:

```text
timestamp-milliseconds + "\n"
+ uppercase HTTP method + "\n"
+ raw path + "\n"
+ exact forwarded body bytes
```

The signature is lowercase HMAC-SHA256 hex in `X-Cocktail-Signature`; the timestamp is in `X-Cocktail-Timestamp`. The Lambda entry point validates body size, secret availability, timestamp age, and signature before NestJS initialization, database probing, or business handling. Signature comparison uses `timingSafeEqual` after an equal-length check.

Missing credentials return 401, an invalid or body-mismatched signature returns 403, and missing server configuration returns 503. Responses contain no signature, secret, stack, database address, or provider error.

Both runtimes fail closed when the current shared secret is absent or shorter than 32 characters. Production values must be generated randomly; the examples are placeholders, not secrets.

Official basis checked 2026-10-23:

- AWS HTTP API Lambda authorizer payload and identity sources: https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-lambda-authorizer.html
- AWS HTTP API quotas, including the non-adjustable 10 MB payload maximum: https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-quotas.html

## 2. Replay and rotation policy

The default acceptance window is five minutes (`API_HMAC_MAX_AGE_MS=300000`). Requests outside the window are rejected. Each retry receives a timestamp that is strictly newer within that Route Handler invocation and therefore a new signature.

This bounds replay exposure but does not provide one-time nonce storage. An intercepted request can still be replayed inside the window. TLS, a short window, throttling, a read-only recommendation operation, and secret rotation reduce impact. Full single-use replay prevention would require a shared nonce store and is deferred because it adds cost and operational state.

For rotation, deploy the new value as `API_HMAC_SECRET` in Vercel, retain the old value temporarily as Lambda `API_HMAC_PREVIOUS_SECRET`, switch Vercel traffic, then remove the previous value after the maximum request window plus deployment propagation time. Never log either value.

## 3. Timeout and retry

- Default upstream timeout: 12 seconds per attempt (`API_REQUEST_TIMEOUT_MS`).
- Maximum attempts: two (one initial request plus one retry).
- Retry: network/timeout failures and HTTP 502, 503, or 504 only.
- No retry: 2xx, validation/authentication 4xx, 429, or other permanent responses.
- Final timeout response: 504; final network failure: 502.

The retry is allowed only because recommendation generation is read-only and deterministic for the same versioned input. If the endpoint gains writes or side effects, retry requires an idempotency design first.

## 4. Lambda and database failure behavior

The Lambda boundary converts initialization and database-readiness failures to a generic HTTP 503. The adapter continues to map normal NestJS validation and application responses. `GET /health` remains DB-independent liveness, but it is still HMAC-protected at the Lambda endpoint. `/health/ready` performs the existing database readiness check.

Database recovery remains bounded to one reconnect. No exception stack or connection secret is returned. CloudWatch access logs contain request ID, route key, status, and response length only.

## 5. PostgreSQL TLS

Local Docker PostgreSQL explicitly uses `DATABASE_SSL_MODE=disable`. Lambda/production defaults to `verify-full`, represented for `pg` as `rejectUnauthorized: true`, so the Node TLS trust store validates the certificate chain and hostname. `require` remains available only as an explicit compatibility escape hatch and uses `rejectUnauthorized: false`; it must not be the production default.

Neon's guidance identifies `verify-full` as the traditional fully verified mode, while its generated connection strings commonly require TLS and may add channel binding. Before production, verify the selected pooled endpoint using the exact Node.js `pg` runtime and record whether channel binding configuration is required. Official Neon reference checked 2026-10-23: https://neon.com/blog/postgres-needs-better-connection-security-defaults

## 6. Cost controls

The SAM draft applies a default HTTP API rate of 5 requests/second with a burst of 10, Lambda reserved concurrency of 2, and 14-day retention for Lambda and API access logs. The application also rejects bodies above 64 KiB, although API Gateway can still receive and charge for a request before Lambda rejects it.

Because authentication occurs in the integration Lambda, unauthorized traffic still incurs API Gateway and Lambda request cost. A Lambda authorizer would also incur authorizer invocations and cannot validate the body. Operational controls remain AWS Budgets alerts at 50/80/100%, Cost Anomaly Detection review, throttling review, and an emergency procedure to set function reserved concurrency to zero. Budgets are alerts, not a hard spending limit.

## 7. SAM status and deployment boundary

The SAM template is a local draft only. It has no Lambda authorizer because the selected body-HMAC design makes authorizer invoke permission inapplicable. SAM-generated API integration permission is still required and is produced by the `HttpApi` event transform.

Local validation on 2026-10-23:

```powershell
sam validate --lint --template-file infrastructure/sam/template.yaml
```

Result: valid SAM template with SAM CLI 1.170.0. This validates template structure and lint rules; it is not proof of successful CloudFormation deployment or runtime behavior.

`ApiHmacSecret` is a `NoEcho` parameter only to make the draft fail closed. `NoEcho` is not a complete production secret-management solution. Before deployment, choose an approved injection path (for example encrypted deployment parameters or a managed secret service after cost review), prevent values from entering command history or change sets, and test rotation.

No AWS or Neon resource was created or modified in P5-04.

## 8. Remaining risks

- Replay inside the five-minute window is possible without a nonce store.
- Public malformed traffic reaches API Gateway and the lightweight Lambda authentication boundary before rejection.
- Shared HMAC secrets require coordinated Vercel/Lambda rotation and compromise response.
- Actual API Gateway throttling, native arm64 behavior, CloudWatch redaction, Neon certificate validation, and combined cold-start latency require an approved AWS/Neon environment.
- API Gateway's 10 MB platform limit cannot be lowered directly for HTTP API; the implemented 64 KiB application limit occurs after invocation.
