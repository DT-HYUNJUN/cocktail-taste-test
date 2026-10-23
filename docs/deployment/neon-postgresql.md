# Neon PostgreSQL Integration

Status: Implemented Locally / Neon Validation Pending
Version: 0.1
Phase: 5 / P5-05
Last Updated: 2026-10-23

## 1. Decision

Use separate Neon connection endpoints and credentials by workload:

```text
Lambda runtime -> DATABASE_* -> pooled endpoint (-pooler hostname), pool max 1
Migration/Seed/Backup -> MIGRATION_DATABASE_* / BACKUP_DATABASE_* -> direct endpoint
```

TypeORM and `pg` remain the client stack. `synchronize: false` remains mandatory. Lambda initialization never runs migrations or seed operations. Runtime connection validation still performs one bounded reconnect and never retries indefinitely.

Neon explicitly advises against `pg_dump` through a pooled connection. Schema operations and logical backup therefore use the direct endpoint. Official references checked 2026-10-23:

- Pricing and plan limits: https://neon.com/pricing
- Regions: https://neon.com/docs/introduction/regions
- Pooling: https://neon.com/docs/connect/connection-pooling
- `pg_dump` / `pg_restore`: https://neon.com/docs/import/migrate-from-postgres

## 2. Current Free plan and region

The current Free plan advertises $0 with no time limit or credit card requirement, 100 projects, 100 CU-hours per project/month, 1 GB database storage per project, up to 2 CU, 10 branches, one snapshot, an instant-restore window up to 6 hours or 1 GB of changes, 5 GB public network transfer per project, and one day of monitoring retention. Limits and enforcement can change and must be rechecked immediately before project creation.

Neon does not list Seoul. The nearest AWS-hosted candidate for Lambda `ap-northeast-2` is `aws-ap-southeast-1` (Singapore). A project region is fixed after creation; moving region requires a new project and migration. Singapore is the default candidate, but real Seoul-to-Singapore cold/warm latency remains Pending.

Scale to zero occurs after five inactive minutes on Free. A first request resumes compute and may add several hundred milliseconds plus Lambda/NestJS cold-start time. Do not use keep-warm traffic to defeat the idle policy. Vercel's one bounded retry and recoverable user flow remain required.

## 3. Environment variables

### Lambda runtime (pooled endpoint)

```text
DATABASE_HOST=<endpoint-id>-pooler.<region>.aws.neon.tech
DATABASE_PORT=5432
DATABASE_USER=<least-privilege-runtime-role>
DATABASE_PASSWORD=<secret>
DATABASE_NAME=<database>
DATABASE_SSL_MODE=verify-full
DATABASE_POOL_MAX=1
DATABASE_CONNECTION_TIMEOUT_MS=5000
DATABASE_IDLE_TIMEOUT_MS=30000
```

### Migration and Seed (direct endpoint)

```text
MIGRATION_DATABASE_HOST=<endpoint-id>.<region>.aws.neon.tech
MIGRATION_DATABASE_PORT=5432
MIGRATION_DATABASE_USER=<migration-role>
MIGRATION_DATABASE_PASSWORD=<secret>
MIGRATION_DATABASE_NAME=<database>
MIGRATION_DATABASE_SSL_MODE=verify-full
MIGRATION_DATABASE_POOL_MAX=1
```

Production maintenance commands fail closed if any `MIGRATION_DATABASE_*` value is absent. Local development may omit them and falls back to `DATABASE_*`, preserving Docker Compose compatibility.

Commands remain explicit:

```powershell
pnpm.cmd --filter api db:show
pnpm.cmd --filter api db:migrate
pnpm.cmd --filter api db:seed
```

Migration runs before Seed. Seed is never automatic. Catalog activation is a separate reviewed operation.

## 4. TLS and connection behavior

Production/Lambda defaults to `verify-full` (`rejectUnauthorized: true`) using Node's trusted CA store and hostname validation. `require` remains an explicit compatibility escape hatch with certificate verification disabled and is not approved as the production default. Local Docker explicitly uses `disable`.

The runtime pool remains one connection per warm Lambda environment; reserved concurrency 2 bounds the initial application-side pool total. Neon pooling protects the backend from many client connections, but actual parallel/cold behavior must be measured. Direct maintenance jobs also use pool size 1.

## 5. Seed safety

- Stable textual IDs are primary keys.
- Duplicate IDs in the seed file fail before DB connection.
- Every seed row is validated before connection.
- Seed data containing `isActive: true` is rejected.
- Inserts use `ON CONFLICT DO NOTHING`; existing names, profiles, timestamps, and activation state are not overwritten.
- `RETURNING id` reports the actual inserted count: first local run inserted 12; the second inserted 0.
- An explicitly activated local row remained active after the second Seed run.
- An all-inactive catalog returns a valid empty recommendation result.

## 6. Verification boundary

Locally verified: migration first/repeat execution, Seed first/repeat execution, stable IDs, field constraints, inactive filtering, recommendation behavior, bounded reconnect, logical dump, isolated restore, and restored counts/migration history.

Pending because no Neon project was created: pooled and direct endpoint authentication, Seoul-to-Singapore latency, scale-to-zero wake behavior, `verify-full` against the issued certificate, provider connection ceilings, usage exhaustion behavior, Neon restore tooling, and production-role grants.

## 7. Minimum privileges

Use distinct credentials where Neon role management permits:

- runtime role: connect and `SELECT` on approved application tables only for the current read-only recommendation flow;
- migration role: schema DDL and migration-table access, used only in an approved release job;
- seed role: `INSERT` on catalog tables without general schema administration;
- backup role: `CONNECT` and read access needed by `pg_dump`.

Do not place connection strings in browser variables, GitHub output, shell history, command arguments, or committed files.
