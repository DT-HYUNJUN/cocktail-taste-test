# PostgreSQL Backup Policy

Status: Encryption Enforced Locally / Storage Decision Required
Version: 0.2
Phase: 5 / P5-06A
Last Updated: 2026-10-23

## 1. Logical backup format

Use `pg_dump --format=custom --no-owner --no-privileges` against the direct, unpooled endpoint. The custom format supports integrity listing and selective/parallel `pg_restore`. The password is supplied through a temporary `PGPASSFILE`, never a command-line argument, and the temporary file is deleted in `finally`.

PowerShell entry point:

```powershell
pnpm.cmd db:backup
```

Required server-only variables:

```text
BACKUP_DATABASE_HOST
BACKUP_DATABASE_PORT
BACKUP_DATABASE_USER
BACKUP_DATABASE_PASSWORD
BACKUP_DATABASE_NAME
BACKUP_DATABASE_SSL_MODE=verify-full
```

The script writes under ignored `.backups/` and creates a SHA-256 sidecar. The repository command always supplies `-RequireEncryption`, so `BACKUP_AGE_RECIPIENT` and the `age` executable are mandatory and no plaintext artifact survives a failed production backup. No production password, private key, or recipient is committed.

## 2. Encryption and storage

Candidate policy:

1. Encrypt the dump locally with `age` to an offline-approved recipient.
2. Upload only the `.age` file and checksum over TLS.
3. If S3 is approved, require private access, public-access block, version/lifecycle controls, and default SSE-S3 in addition to client-side encryption.
4. Never upload plaintext dumps. Treat object names, checksums, and logs as metadata that must not contain credentials or row data.

SSE-S3 has no additional encryption fee. A customer-managed KMS key costs $1/month before request charges, approximately KRW 1,595 including VAT at USD 1 = KRW 1,450, so it is not the default for this budget. Official references checked 2026-10-23:

- S3 pricing: https://aws.amazon.com/s3/pricing/
- SSE-S3 pricing: https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingServerSideEncryption.html
- KMS pricing: https://aws.amazon.com/kms/pricing/

## 3. Retention and estimated cost

Initial candidate: daily backup, retain seven daily objects, then delete automatically. Keep at least one independently verified restore artifact before deleting an older generation. Lifecycle expiry must cover current, non-current, and incomplete multipart objects if versioning/multipart upload is used.

Illustrative 10 MB/day dump:

- retained storage: about 70 MB (`0.07 GB-month` maximum steady state);
- uploads: about 30 PUT requests/month;
- restore test: one GET/month;
- internet transfer into S3: no charge under the documented pricing model;
- S3 Standard storage/request estimate: materially below $0.01/month, or below about KRW 16 including VAT.

The exact Seoul-region amount is **Estimate / Pending** until an AWS Pricing Calculator record is saved. Neon Free remains $0 while within current limits. No bucket, key, or paid secret service was created.

## 4. Local verification record

On 2026-10-23, `verify-local-backup-restore.ps1` created a PostgreSQL custom-format dump from local Docker PostgreSQL, calculated SHA-256, restored it into `cocktail_taste_restore_test`, compared source/restored counts, activation state, stable IDs, all recommendation-relevant fields, required text validity, and migration history, and removed the restore database.

The current run result is recorded in `aws-deployment-readiness.md`; it depends on the local database contents at verification time.

P5-06A result: 12 rows, 0 active, 12 distinct stable IDs, zero blank required ID/name fields, matching recommendation-field digest, and one migration row. The isolated restore database was removed after verification.

The retained local artifact is ignored by Git and contains development-only data. This local test did not verify client-side encryption, S3 upload, lifecycle deletion, or Neon direct endpoint access.

## 5. Failure handling

- Non-zero `pg_dump`, encryption, checksum, or upload status fails the job.
- Never delete the last verified generation after a failed backup.
- Alert on missing/newest-object age and unexpected size changes.
- Pause release if the pre-migration backup or checksum cannot be verified.
- Do not log `PGPASSFILE`, passwords, connection strings, SQL row data, or encryption private keys.
