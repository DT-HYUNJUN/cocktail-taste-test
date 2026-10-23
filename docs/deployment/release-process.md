# Release Process

Status: Proposed
Version: 0.3
Phase: 5 / P5-05
Last Updated: 2026-10-22

## 1. Current CI baseline

`.github/workflows/ci.yml` runs only for pull requests and currently performs frozen install, `pnpm check`, Playwright Chromium E2E, PostgreSQL integration tests, NestJS HTTP E2E, and failure-artifact upload. Phase 5 must preserve this gate. This document does not modify or disable CI.

## 2. Proposed delivery flow

1. Pull request: existing CI completes successfully.
2. Merge to `main`: a protected deployment workflow starts only after required checks.
3. Build an immutable API image for the approved architecture; tag with commit SHA and record the digest.
4. Publish or transfer the artifact using the selected authenticated channel.
5. On EC2, fetch the exact digest and validate Compose configuration and required secrets.
6. Create and verify a pre-migration database backup.
7. Run the migration as a one-shot container/job with the release image.
8. If migration succeeds, replace the API container; do not recreate the PostgreSQL volume.
9. Wait for container health, API liveness/readiness, and Caddy HTTPS health.
10. Run a smoke test through Vercel's public Route Handler, including Contract-valid recommendation behavior and explanation fields.
11. Record deployed commit/image digest, migration result, operator, and timestamps.

No step may automatically seed or activate cocktail data. Domain v1 and the recommendation algorithm are unchanged.

## 3. Authentication options

| Method | Advantages | Risks / constraints | Position |
|---|---|---|---|
| GitHub Actions + SSH | Simple and low service cost | Long-lived key, exposed SSH path, host-key and command restrictions required | Acceptable temporary bootstrap only |
| GitHub OIDC + AWS role | Short-lived credentials; repository/branch trust conditions | Requires IAM setup and a deployment execution channel | Preferred when workflow calls AWS APIs |
| Long-lived AWS access keys in GitHub Secrets | Familiar | Rotation and exfiltration risk; broad accidental scope | Do not use |
| SSM Run Command with OIDC | No inbound SSH; auditable commands | Agent, IAM, connectivity, and possible log/storage costs must be validated | Preferred candidate after cost validation |

The deployment role must be least privilege and environment-protected. GitHub production environment approval is recommended before a paid resource or production release is touched.

## 4. Migration failure and rollback

- Migration runs before the new API receives traffic. Any non-zero exit stops the release.
- Capture sanitized migration output and keep the old API container/image available.
- Do not automatically run `db:revert`. TypeORM down migrations may be destructive and compatibility with already-written data must be reviewed.
- For a backward-compatible migration failure, keep the old API and diagnose before retry.
- For a partially applied or destructive failure, stop writes, preserve evidence, restore into an isolated database, validate it, then perform an approved restore/cutover.
- Application rollback switches to the previous known-good image digest only when its schema compatibility is documented.
- Prefer expand/migrate/contract schema changes so old and new application versions overlap safely.

## 5. Health and smoke requirements

P5-02 must implement separate endpoints:

- liveness: process/event loop can respond; no sensitive detail;
- readiness: API can reach PostgreSQL and required schema is usable;
- external smoke: HTTPS through Caddy and a deterministic, valid recommendation request through Vercel.

The smoke test must not mutate catalog approval state and must not change Golden Recommendation expectations merely to pass deployment.

## 6. Rollout and recovery record

Every release records the previous/current image digest, Compose/config version, migration identifiers, backup object/version, health results, and rollback decision. Secret values and database contents must never appear in artifacts or logs.

## 7. P5-02 entry criteria

- AWS/GCP direction conflict is resolved and a cost scenario is approved.
- Instance architecture/size is selected; `t4g` selection includes `linux/arm64` build-and-test acceptance criteria.
- Stable DNS ownership and TLS hostname are available.
- Backup retention, RPO/RTO, and S3 encryption choice are approved.
- Server-to-server API authentication and administration channel are decided.
- Image registry/artifact transfer is selected and added to the cost estimate.
- P5-02 is authorized to implement Dockerfiles, Compose, health endpoints, and deployment workflow, but still not to create paid AWS resources without separate approval.

## 8. Decision Required

- Container registry versus direct artifact transfer.
- OIDC + SSM Run Command versus restricted SSH bootstrap.
- Whether migration and deployment share a role or use separate least-privilege roles.
- Manual production approval and rollback owner.

## 9. Serverless release candidate flow

The preferred serverless path supersedes the EC2 flow only when its deployment decisions are approved; the EC2 procedure above remains an alternative.

1. Require the existing PR CI gate and protected production-environment approval.
2. Build the Node.js 22 ZIP with `pnpm.cmd package:lambda`; record commit SHA, ZIP checksum, compressed size, and uncompressed size.
3. Run `sam validate` and review the transformed change set without executing it.
4. Back up the database and run explicit migration from an approved one-shot environment. Never migrate or seed during Lambda cold start.
5. Configure the Lambda current HMAC secret and, only during rotation, its previous secret. Configure Vercel with the matching current secret. Do not print parameter values.
6. Deploy Lambda/API Gateway only after change-set and estimated-cost approval.
7. Verify signed liveness, readiness, invalid-signature rejection, valid recommendation, throttling, and sanitized logs.
8. Switch Vercel `API_BASE_URL`, then run the public same-origin smoke test.
9. For rotation, remove `API_HMAC_PREVIOUS_SECRET` after the five-minute acceptance window and deployment propagation time.
10. Record CloudWatch usage, API Gateway requests, Lambda duration/errors/throttles, and actual cost against the estimate.

Application rollback restores the prior ZIP/version only when schema-compatible. Authentication rollback may temporarily restore the previous secret as current, but must remain time-bounded and audited. Migration rollback remains manual and evidence-preserving as described above.

## 10. Neon data release gate

Before every schema/data release:

1. Confirm runtime points to the pooled endpoint and maintenance commands point to the direct endpoint.
2. Create an encrypted logical backup through the direct endpoint and verify its SHA-256.
3. Restore the selected backup into an isolated database/branch and run the checks in `database-restore.md`.
4. Run `db:show`, then `db:migrate`; run `db:show` again and require no pending migration.
5. Run Seed only when initial catalog rows are missing. A repeated run must report zero inserts and must not change `is_active`.
6. Require a separate reviewed statement for any catalog activation. Seed cannot activate data.
7. Run readiness, signed recommendation, inactive-filtering, and approved-active-data smoke tests.
8. Record backup checksum, migration IDs, actual inserted Seed count, active row count, artifact checksum, and rollback compatibility.

Migration or restore failure stops the release. Never automatically revert a production migration, overwrite production from a dump, or promote an unverified isolated restore.
