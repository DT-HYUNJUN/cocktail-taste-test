# NestJS AWS Lambda Adapter

Status: Implemented Locally  
Version: 0.1  
Phase: 5 / P5-03  
Last Updated: 2026-10-23

## 1. Scope

P5-03 adds a local, deployable-shaped AWS Lambda entry point for the existing NestJS API. It does not create AWS or Neon resources, deploy code, issue certificates, or create production secrets. The Docker Compose and TCP-listening NestJS entry point remain supported.

## 2. Runtime structure

```text
Local/Docker
  main.ts -> createNestApplication() -> app.listen(PORT, 0.0.0.0)

Lambda
  API Gateway HTTP API payload 2.0
    -> lambda.ts handler
    -> cached Nest initialization
    -> database probe / at most one reconnect (except liveness)
    -> @codegenie/serverless-express
    -> existing controllers and contracts
```

`@codegenie/serverless-express` 4.17.1 is pinned. Its package declares Node.js `>=18`, works with Express applications, and was tested here with NestJS 11/Express 5 and Node.js 22. Version 5 was not selected because its published upgrade guide states official support starts at Node.js 24.

`createLambdaHandler` caches the single initialization promise so simultaneous first invocations do not create duplicate Nest applications. A rejected promise is removed from the cache, allowing a later invocation to retry initialization. Adapter errors do not expose stack traces in HTTP responses.

`GET /health` remains DB-independent liveness. Other routes validate DB connectivity first; `GET /health/ready` also retains its controller-level database probe.

## 3. Database connection policy

The existing discrete database variables remain supported so Docker Compose is unchanged:

| Variable | Local default | Lambda/Neon proposal |
|---|---|---|
| `DATABASE_HOST` | local/Compose host | Neon pooled hostname |
| `DATABASE_PORT` | `5432` | provider pooled port |
| `DATABASE_USER` | local user | least-privilege application role |
| `DATABASE_PASSWORD` | local secret | encrypted runtime secret |
| `DATABASE_NAME` | local database | Neon database |
| `DATABASE_SSL_MODE` | `disable` | `require`; evaluate `verify-full` with CA configuration |
| `DATABASE_POOL_MAX` | `10` | `1` |
| `DATABASE_CONNECTION_TIMEOUT_MS` | `5000` | `5000` initial |
| `DATABASE_IDLE_TIMEOUT_MS` | `30000` | `30000` initial |

Accepted SSL modes are `disable`, `require`, and `verify-full`. `require` encrypts the connection but sets `rejectUnauthorized: false`; production should prefer `verify-full` after the provider CA path is defined and tested.

Before a DB-dependent invocation, the cached TypeORM `DataSource` receives `SELECT 1`. On failure it is destroyed when initialized, initialized once, and probed once more. A second failure is propagated. There is no unbounded reconnect loop. Concurrent validation/recovery in one warm environment shares one recovery promise.

`synchronize: false` remains set in both application and migration configuration. Migrations and seed remain explicit release operations and never run during Lambda initialization.

## 4. ZIP packaging

Build on Windows PowerShell:

```powershell
pnpm.cmd package:lambda
```

The script:

1. builds `contracts`, `domain`, and `api`;
2. bundles the compiled Lambda entry with esbuild for Node.js 22;
3. excludes unused optional NestJS transports/validation packages;
4. installs only the external pure-JavaScript `pg` runtime tree in an isolated temporary directory;
5. writes `.lambda/package/index.js` and `.lambda/cocktail-taste-api.zip`;
6. prints compressed and uncompressed sizes.

Verification result:

- bundled application: approximately 5.5 MB;
- ZIP: 1,154,836 bytes;
- uncompressed package: 6,223,489 bytes;
- no `.env` file in the archive;
- no native `.node` dependency required by the runtime package.

The artifact is architecture-neutral JavaScript and targets the Lambda Node.js 22 runtime. The SAM template selects `arm64`. Native Lambda arm64 execution still requires P5-04 because local build success is not an AWS runtime proof.

TypeORM and NestJS contain dynamic/optional imports. The bundle explicitly externalizes unused optional NestJS WebSocket/microservice and class validation packages. `pg` remains external because TypeORM loads it dynamically; the packaging script installs its exact runtime version next to the bundle.

## 5. SAM draft

`infrastructure/sam/template.yaml` defines:

- Node.js `nodejs22.x` and `arm64`;
- 512 MB memory and 15-second timeout;
- reserved concurrency 2;
- API Gateway HTTP API payload format 2.0;
- 14-day CloudWatch log retention;
- database environment-variable names;
- no application IAM policies beyond SAM's basic Lambda logging role;
- a required external request-authorizer ARN.

The template intentionally has no unauthenticated public default. Authentication implementation remains Decision Required. The draft has not been deployed or validated by SAM CLI.

## 6. Local verification

Executed against the repository's local PostgreSQL test database:

- handler initialization and cached reuse: passed;
- simultaneous initialization sharing: passed;
- rejected initialization can retry: passed;
- healthy/stale/unavailable DB connection behavior: passed;
- API Gateway HTTP API Payload 2.0 `GET /health`: passed;
- Payload 2.0 valid `POST /recommendations`: passed;
- Payload 2.0 invalid request returns HTTP 400: passed;
- existing TCP-based NestJS HTTP E2E: 4 passed;
- Lambda Payload 2.0 E2E: 3 passed;
- API unit tests: 78 passed.

AWS SAM CLI was unavailable on the workstation, so `sam local start-api` was not executed. Direct invocation of realistic Payload 2.0 events through the real adapter provides the local equivalent, but does not reproduce the Lambda OS/runtime boundary.

## 7. P5-04 entry conditions

- Decide Vercel-to-API Gateway authentication and implement the selected authorizer/caller flow.
- Approve the SAM draft and explicit creation/cost scope before any AWS action.
- Create/select Neon only after explicit approval; select a region and pooled endpoint.
- Define a verified CA strategy if `verify-full` is required.
- Run migration and seed through an approved one-shot path, never Lambda startup.
- Measure warm, Lambda-cold, Neon-cold, and combined-cold latency on real services.
- Verify the ZIP on native Lambda arm64 and record memory/duration.
- Add API Gateway throttling, Vercel timeout/retry behavior, budget alerts, backup, and rollback procedures.
