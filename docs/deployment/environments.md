# Deployment Environments and Operations

Status: Proposed  
Version: 0.1  
Phase: 5 / P5-01  
Last Updated: 2026-10-22

## 1. Environment model

| Environment | Web | API/DB | Purpose |
|---|---|---|---|
| Local | Next.js dev server | local NestJS + Docker PostgreSQL | implementation and integration testing |
| CI | GitHub Actions | service-container PostgreSQL | deterministic validation; no deployment |
| Production/demo | Vercel | one EC2 Compose host | approved public demonstration only |

A permanent AWS staging stack is excluded by the budget. P5-02 validation should use local multi-architecture builds and, only after explicit cost approval, a short-lived EC2 validation window. Production and test data must never share a database.

## 2. Runtime configuration

Existing code requires:

| Boundary | Variable | Production meaning |
|---|---|---|
| Vercel server runtime | `API_BASE_URL` | HTTPS origin of Caddy, never a browser-exposed `NEXT_PUBLIC_*` value |
| API | `PORT` | internal NestJS listen port; current default is 3000 |
| API/migration | `DATABASE_HOST` | Compose service name such as `postgres` |
| API/migration | `DATABASE_PORT` | internal `5432` |
| API/migration | `DATABASE_USER` | least-privilege application role |
| API/migration | `DATABASE_PASSWORD` | generated secret, not committed |
| API/migration | `DATABASE_NAME` | production database name |

`apps/web/.env.local` and API `.env` files remain local only. Production values belong in Vercel encrypted environment variables and root-readable EC2 runtime secret files (or a later approved secret service). Do not place secrets in Compose YAML, AMIs, container layers, GitHub logs, shell history, or repository files.

## 3. Database lifecycle

- Keep TypeORM `synchronize: false` in every environment.
- Back up and verify the target, then run `pnpm --filter api db:migrate` exactly once as a release step before switching the API image.
- Run `pnpm --filter api db:show` to confirm no pending migrations after release.
- Seed is a separate, manual, idempotent action. Current seed code rejects `is_active=true`; catalog activation requires the existing separate approval process.
- Never run integration-test cleanup helpers against production. They already restrict the database name and local host, and production procedures must not weaken those guards.
- Do not recreate or initialize the PostgreSQL volume during ordinary releases.

## 4. Backup and restore

Proposed baseline:

1. Run `pg_dump` with a dedicated backup role and a consistent custom-format logical dump.
2. Encrypt in transit and at rest; upload through the EC2 instance role to one private S3 bucket/prefix.
3. Block public access, enable default encryption, restrict role access to the exact prefix, and apply lifecycle retention after an approved period.
4. Keep backup logs free of row data and credentials. Treat dumps as sensitive because they may contain assessment/result data now or in future.
5. Alert on backup failure and monitor object age/size.
6. At least quarterly, restore the newest backup into an isolated non-production database, run migrations if required, and execute a recommendation smoke test.

An EBS snapshot can shorten host recovery but is not a substitute for independently restorable logical backups. A backup only on the same EC2/EBS failure domain is not a backup.

## 5. Volume management

- Use a dedicated named volume path for PostgreSQL and document its EBS mapping.
- Enable delete-on-termination only after verifying the off-host backup policy; otherwise explicitly remove the volume during teardown.
- Monitor filesystem utilization and PostgreSQL growth. Expand gp3 deliberately; do not rely on an unbounded auto-growth mechanism.
- Tag instance, volume, snapshot, and bucket with project/environment/owner.

## 6. Scheduled demo mode

If the budget owner selects scenario B, automation starts the instance only for published demo windows and stops it afterward. EBS and a retained Elastic IP continue billing. Health/readiness must pass after every start before the demo is announced. Scheduled operation is not represented as 24/7 availability.

## 7. Decision Required

- Production database name and credential rotation interval.
- Backup frequency, retention, RPO, and RTO.
- Whether Vercel production remains free under the user's actual plan/usage; Vercel cost is outside the AWS estimate.
- Whether a short-lived staging EC2 run is approved for P5-02 arm64 verification.

