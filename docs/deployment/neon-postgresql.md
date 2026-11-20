# Neon PostgreSQL Integration

Status: Deployment Ready Locally / Neon Validation Pending
Version: 0.3
Phase: 5 / P5-06A
Last Updated: 2026-11-19

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

Neon does not list Seoul. Production Lambda and Neon use Singapore (`ap-southeast-1` / `aws-ap-southeast-1`). A Neon project region is fixed after creation; moving region requires a new project and migration. Real client-to-Singapore and cold/warm latency must remain part of production monitoring.

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

- runtime role: connect and use the `public` schema, `SELECT` approved cocktail data, and `SELECT`, `INSERT`, and `DELETE` on `shared_results`;
- migration role: schema DDL and migration-table access, used only in an approved release job;
- seed role: `INSERT` on catalog tables without general schema administration;
- backup role: `CONNECT` and read access needed by `pg_dump`.

`shared_results` is intentionally writable by the runtime role. `POST /shared-results` inserts an immutable result snapshot, `GET /shared-results/:id` reads it, and a later share creation opportunistically deletes expired rows. The runtime role does not need `UPDATE`, `TRUNCATE`, `REFERENCES`, or `TRIGGER` on this table.

The currently deployed runtime role is named `cocktail_runtime_ro`. The `_ro` suffix is a legacy name from the earlier read-only recommendation flow and no longer describes its table-scoped permissions. Renaming or replacing the role requires coordinated credential and Lambda configuration rotation; until then, grants remain least-privilege by table and operation rather than by role name.

After a migration creates a runtime-accessed table, verify and apply its grants before deploying code that uses it. For `shared_results`, the required grant shape is:

```sql
GRANT USAGE ON SCHEMA public TO cocktail_runtime_ro;
GRANT SELECT, INSERT, DELETE ON TABLE public.shared_results TO cocktail_runtime_ro;
```

Verify the effective privileges rather than relying on the migration owner:

```sql
SELECT
  has_table_privilege('cocktail_runtime_ro', 'public.shared_results', 'SELECT') AS can_select,
  has_table_privilege('cocktail_runtime_ro', 'public.shared_results', 'INSERT') AS can_insert,
  has_table_privilege('cocktail_runtime_ro', 'public.shared_results', 'DELETE') AS can_delete;
```

Do not place connection strings in browser variables, GitHub output, shell history, command arguments, or committed files.

## 8. Provisioning acceptance gate

Before Lambda receives traffic, verify both endpoint hostnames and table-level runtime grants against the actual project, run migration twice, run Seed twice, confirm the second Seed inserts zero rows, and restore one encrypted dump into a separate branch/database. A failed TLS, grant, migration, Seed, backup, or restore check stops deployment. Production is never overwritten directly.

The Free plan remains the selected budget assumption at USD 0. Exceeding compute, storage, transfer, or project policy is not assumed to auto-upgrade safely; monitor Neon usage and treat exhaustion behavior as Pending until verified in the created account.
