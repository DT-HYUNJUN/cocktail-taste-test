# API Containerization and Local Compose

Status: Implemented  
Version: 0.1  
Phase: 5 / P5-02  
Last Updated: 2026-10-22

## 1. Scope

P5-02 packages the existing NestJS API and its workspace dependencies for local Docker Compose verification. It creates no AWS resources, production secrets, public certificates, or production data. The original `compose.yaml` remains the development-only PostgreSQL configuration; the deployment-shaped stack is isolated in `compose.deploy.yaml`.

## 2. Image structure

`apps/api/Dockerfile` uses three stages:

1. `base`: Node.js 22 and the repository-pinned pnpm 11.0.9 through Corepack.
2. `dependencies`/`build`: frozen workspace install, then builds `contracts`, `domain`, and `api`; `pnpm deploy --prod` creates a production-only API package.
3. `runtime`: copies only the deployed package manifest, production `node_modules`, and compiled `dist`; runs as the existing non-root `node` user.

The build context is the repository root so `workspace:*` dependencies resolve normally. The runtime image contains the compiled `@cocktail-taste-test/contracts` and `@cocktail-taste-test/domain` packages under production dependencies, but excludes repository source, tests, package-manager tooling, and development dependencies. The API listens on `0.0.0.0` and reads `PORT`, defaulting to 3000.

## 3. Compose topology

```text
host 127.0.0.1:8080
  -> Caddy (edge + internal backend networks)
  -> NestJS API (internal backend only)
  -> PostgreSQL (internal backend only, persistent named volume)
```

The local Caddy configuration disables automatic HTTPS and uses `http://127.0.0.1:8080`; it never requests a public certificate. EC2 HTTPS and a real hostname remain P5-03 work.

Images are versioned (`postgres:17.6-alpine`, `caddy:2.10.2-alpine`, Node 22 family). P5-03 must pin approved production images by digest before release.

## 4. Environment variables

Copy `.env.compose.example` to the git-ignored `.env.compose` and replace the local placeholder password:

```powershell
Copy-Item .env.compose.example .env.compose
docker compose --env-file .env.compose -f compose.deploy.yaml config --quiet
```

| Variable | Purpose |
|---|---|
| `POSTGRES_USER` | PostgreSQL bootstrap/application user for local verification |
| `POSTGRES_PASSWORD` | Local-only password; Compose rejects a missing value |
| `POSTGRES_DB` | Database name |
| `COMPOSE_HTTP_PORT` | Loopback-only Caddy port, default 8080 |

Compose maps these to the API's existing `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME`. PostgreSQL has no published host port.

## 5. Build and start

```powershell
docker compose --env-file .env.compose -f compose.deploy.yaml build api
docker compose --env-file .env.compose -f compose.deploy.yaml up -d
docker compose --env-file .env.compose -f compose.deploy.yaml ps
```

The API waits for PostgreSQL health, and Caddy waits for API readiness. Restarts do not run migrations or seed automatically.

## 6. Migration and seed

The production image contains compiled database commands, so no TypeScript runner or development dependencies are needed:

```powershell
docker compose --env-file .env.compose -f compose.deploy.yaml run --rm api npm run db:migrate:prod
docker compose --env-file .env.compose -f compose.deploy.yaml run --rm api npm run db:show:prod
docker compose --env-file .env.compose -f compose.deploy.yaml run --rm api npm run db:seed:prod
```

`synchronize: false` remains unchanged. Seed remains insert-only and rejects active records; activation is not part of deployment startup.

## 7. Health checks

- `GET /health`: liveness only. Returns `{"status":"ok"}` without querying or exposing database details.
- `GET /health/ready`: readiness. Runs `SELECT 1`; returns the same minimal response or a generic HTTP 503.
- Docker checks readiness directly inside the API container. Caddy is considered healthy only when the proxied readiness request succeeds.

Local check:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/health
Invoke-RestMethod http://127.0.0.1:8080/health/ready
```

## 8. Recommendation smoke request

After migration and seed, the seed policy leaves every cocktail inactive, so a valid request must return an empty `recommendations` array. Tests that need an active candidate must activate a fixture only in an isolated disposable database and revert/delete it afterward; never activate production catalog data as a deployment side effect.

## 9. Persistence check and teardown

Restart PostgreSQL and verify the seeded row count is unchanged:

```powershell
docker compose --env-file .env.compose -f compose.deploy.yaml restart postgres
docker compose --env-file .env.compose -f compose.deploy.yaml exec postgres `
  psql -U cocktail -d cocktail_taste -tAc "SELECT count(*) FROM cocktails;"
```

Stop while retaining data:

```powershell
docker compose --env-file .env.compose -f compose.deploy.yaml down
```

For a disposable local verification stack only, remove its named volume explicitly:

```powershell
docker compose --env-file .env.compose -f compose.deploy.yaml down --volumes
```

Never use `--volumes` for a deployed database without an approved, verified backup.

## 10. ARM64 verification

Build independently for each target:

```powershell
docker buildx build --platform linux/amd64 -f apps/api/Dockerfile -t cocktail-taste-api:amd64 --load .
docker buildx build --platform linux/arm64 -f apps/api/Dockerfile -t cocktail-taste-api:arm64 --load .
```

A successful arm64 build proves dependency packaging for that target. Runtime proof additionally requires starting the arm64 API and PostgreSQL (native Graviton or configured emulation), running migration/seed, and exercising both health and recommendation endpoints. Build and runtime results are reported separately because an amd64 workstation may build but not reliably execute arm64 images.

## 11. P5-02 verification record

Verified on 2026-10-22 with Docker Desktop Linux/amd64 and buildx:

- Compose model validation: passed with required environment variables.
- `linux/amd64` API image build: passed.
- amd64 Compose startup: PostgreSQL, API, and Caddy became healthy. The workstation reserved port 8080, so the smoke run used `COMPOSE_HTTP_PORT=18080`; this is an environment-specific port choice.
- Migration: passed; `db:show:prod` reported no pending migration.
- Seed: passed with 12 records, all inactive. Verification exposed and fixed the compiled JavaScript CLI-entry check.
- `GET /health` and `GET /health/ready`: HTTP 200 with `{"status":"ok"}`.
- Valid recommendation with no active cocktails: HTTP 200 with an empty recommendation list.
- Disposable local activation scenario: Tom Collins was returned as the top recommendation, then immediately restored to inactive.
- Persistence: 12 rows existed before and after a PostgreSQL container restart.
- `linux/arm64` API image build: passed, including pnpm install, native esbuild postinstall, workspace package builds, NestJS build, and production deployment packaging.
- arm64 runtime under Docker Desktop emulation: passed. The running API reported `aarch64`; compiled migration, pending-migration check, and seed succeeded against PostgreSQL; Caddy-proxied liveness/readiness returned HTTP 200; the empty and temporarily activated Tom Collins recommendation scenarios passed. Native Graviton validation remains a P5-03 release check because emulation does not prove EC2 host behavior or performance.
- Cleanup: the disposable Compose containers, networks, and `postgres_deploy_data` test volume were removed after verification.

## 12. Known constraints and P5-03 entry conditions

- Local Caddy is HTTP-only by design; production TLS configuration is not implemented.
- The stack has one PostgreSQL volume and no backup automation or high availability.
- Resource limits require measurement on the selected EC2 size before they are fixed.
- API server-to-server authentication and abuse controls from `security.md` remain required before public exposure.
- P5-03 requires approved instance size/budget, production DNS, pinned image digests, secret delivery, backup policy, registry/artifact channel, and an arm64 runtime result if `t4g` is selected.
