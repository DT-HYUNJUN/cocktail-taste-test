# Deployment Environments and Operations

Status: Implemented Locally / Production Pending
Version: 0.2
Phase: 5 / P5-05
Last Updated: 2026-10-23

## 1. Environment model

| Environment | Web | API/DB | Purpose |
|---|---|---|---|
| Local | Next.js dev server | local NestJS + Docker PostgreSQL | implementation and integration testing |
| CI | GitHub Actions | service-container PostgreSQL | deterministic validation; no deployment |
| Production/demo candidate | Vercel | API Gateway + Lambda + Neon | approved public demonstration only |

A permanent AWS staging stack is excluded by the budget. Validation uses local Docker and isolated test databases; real AWS/Neon validation requires separate approval. Production and test data must never share a database or branch.

## 2. Runtime configuration

Existing code requires:

| Boundary | Variable | Production meaning |
|---|---|---|
| Vercel server runtime | `API_BASE_URL`, `API_HMAC_SECRET`, `API_REQUEST_TIMEOUT_MS` | API Gateway origin and server-only signing configuration |
| Lambda runtime | `DATABASE_*` | Neon pooled endpoint and least-privilege runtime role |
| Migration/Seed | `MIGRATION_DATABASE_*` | Neon direct endpoint and approved maintenance role |
| Backup | `BACKUP_DATABASE_*` | direct endpoint and read-only backup role |
| Local API | `PORT`, `DATABASE_*` | NestJS listener and Docker PostgreSQL |

`apps/web/.env.local` and API `.env` files remain local only. Production values belong in approved Vercel/AWS secret injection. Do not place secrets in Compose YAML, SAM parameter files, Lambda ZIPs, GitHub logs, shell history, command arguments, or repository files.

## 3. Database lifecycle

- Keep TypeORM `synchronize: false` in every environment.
- Back up and verify the target, then run `pnpm --filter api db:migrate` through the direct endpoint as a release step before switching Lambda traffic.
- Run `pnpm --filter api db:show` to confirm no pending migrations after release.
- Seed is a separate, manual, idempotent action. Current seed code rejects `is_active=true`; catalog activation requires the existing separate approval process.
- Never run integration-test cleanup helpers against production. They already restrict the database name and local host, and production procedures must not weaken those guards.
- Do not recreate or initialize the PostgreSQL volume during ordinary releases.

## 4. Backup and restore

Implemented local baseline and proposed production policy:

1. Run `pg_dump` with a dedicated backup role and a consistent custom-format logical dump.
2. Client-side encrypt with `age`; if approved, upload to one private S3 bucket/prefix with SSE-S3.
3. Block public access, enable default encryption, restrict role access to the exact prefix, and apply lifecycle retention after an approved period.
4. Keep backup logs free of row data and credentials. Treat dumps as sensitive because they may contain assessment/result data now or in future.
5. Alert on backup failure and monitor object age/size.
6. At least quarterly, restore the newest backup into an isolated non-production database, run migrations if required, and execute a recommendation smoke test.

See `database-backup.md` and `database-restore.md`. Neon snapshot/instant restore is useful but is not a substitute for an independently restorable logical backup.

## 5. Legacy EC2 volume management

- Use a dedicated named volume path for PostgreSQL and document its EBS mapping.
- Enable delete-on-termination only after verifying the off-host backup policy; otherwise explicitly remove the volume during teardown.
- Monitor filesystem utilization and PostgreSQL growth. Expand gp3 deliberately; do not rely on an unbounded auto-growth mechanism.
- Tag instance, volume, snapshot, and bucket with project/environment/owner.

## 6. Legacy scheduled EC2 demo mode

If the budget owner selects scenario B, automation starts the instance only for published demo windows and stops it afterward. EBS and a retained Elastic IP continue billing. Health/readiness must pass after every start before the demo is announced. Scheduled operation is not represented as 24/7 availability.

## 7. Decision Required

- Neon project/branch/database names, Singapore region approval, role grants, and credential rotation interval.
- Backup frequency, retention, RPO, and RTO.
- Whether Vercel production remains free under the user's actual plan/usage; Vercel cost is outside the AWS estimate.
- Backup destination and client-side encryption recipient/key custody.

