# PostgreSQL Restore Procedure

Status: Verified Locally / Neon Validation Pending
Version: 0.2
Phase: 5 / P5-06A
Last Updated: 2026-10-23

## 1. Safety rule

Never restore directly over the production database. Restore into a newly created isolated database or Neon branch, validate it, and perform a separately approved cutover. The local automation permits destructive cleanup only for the exact database name `cocktail_taste_restore_test`.

## 2. Restore workflow

1. Select a backup by timestamp and recorded release/migration version.
2. Download over TLS and verify the recorded SHA-256 before decryption.
3. Decrypt into a restricted temporary directory; do not retain plaintext longer than necessary.
4. Inspect with `pg_restore --list`.
5. Create an empty isolated database using the direct endpoint.
6. Restore with `pg_restore --no-owner --no-privileges --exit-on-error`.
7. Compare migration history, Cocktail count, stable IDs, required non-null fields, and activation count.
8. Run readiness and a signed recommendation smoke test against the isolated target.
9. Record operator, source checksum, start/end time, row checks, and result without recording secrets or row contents.
10. Destroy the isolated target only after the evidence is retained.

Local command:

```powershell
pnpm.cmd db:verify-restore
```

This uses the Docker PostgreSQL container and does not contact Neon or AWS.

## 3. Consistency checks

Minimum SQL-level checks:

- `typeorm_migrations` contains the expected migration IDs;
- total and distinct Cocktail IDs match;
- required text fields are nonblank;
- taste dimensions remain within 1–5 via constraints;
- flavors/base spirits satisfy the migration constraints;
- active count matches the backup and is not changed by Seed;
- inactive-only data returns an empty but valid recommendation response;
- at least one approved active fixture returns the established Domain v1 recommendation contract.

## 4. Failed restore

- Stop immediately on checksum mismatch or `pg_restore` error.
- Preserve the encrypted source, checksum, sanitized stderr, and database name for diagnosis.
- Do not retry repeatedly against production or run `db:revert` automatically.
- Drop only the confirmed isolated failed target.
- Attempt the previous verified backup in a new isolated target.
- If every retained generation fails, freeze deployment/data-changing work and escalate recovery ownership.
- Any restore verification failure is a deployment stop condition. Never cut the production connection string over to the failed target.

## 5. Pending production proof

- restore encrypted backup downloaded from the selected storage provider;
- restore through a Neon direct endpoint into an isolated branch/database;
- measure recovery time against the approved RTO;
- verify role grants, certificate validation, audit evidence, and cutover/rollback;
- confirm how the Free plan's snapshot/instant-restore limits interact with independent logical backups.
