# AWS and Neon Deployment Readiness

Status: Ready for Approved Provisioning / External Validation Pending  
Version: 0.1  
Phase: 5 / P5-06A  
Last Updated: 2026-10-23

## 1. Readiness decision

The repository is locally ready to enter an explicitly approved P5-06B provisioning run. No AWS or Neon resource has been created or changed in P5-06A.

```text
Browser -> Vercel Route Handler -> API Gateway HTTP API (Seoul)
        -> Lambda Node.js 22 arm64 -> Neon PostgreSQL (Singapore candidate)
```

The SAM draft provides HTTP API payload v2.0 routes, 512 MB/15-second Lambda limits, reserved concurrency 2, stage throttling at 5 requests/second with burst 10, 14-day API/Lambda log retention, and no VPC. The function has no application AWS API permissions; SAM supplies only its generated basic logging role. X-Ray active tracing was removed because it is not required for launch and adds permissions, telemetry, and potential cost.

## 2. Blocking issues, in priority order

| Priority | Blocking issue | Exit condition |
|---|---|---|
| P0 | No approved AWS account/Neon project or production secrets exist | User explicitly approves provisioning and identifies accounts/owners |
| P0 | Secret injection is not final | Choose SSM Parameter Store Standard `SecureString` with an AWS-managed KMS key, or approve Secrets Manager cost/rotation; never pass values in shell history |
| P0 | Neon endpoints and least-privilege roles are unverified | Create Singapore project; verify pooled runtime and direct maintenance/backup connections with `verify-full` |
| P0 | Backup destination, `age` recipient custody, RPO/RTO are undecided | Approve private S3/prefix, seven-day candidate retention, encryption owner, and restore target |
| P0 | New AWS account concurrency quota is unknown | Confirm reserved concurrency 2 can be allocated while preserving the account's required unreserved concurrency |
| P1 | Regional live cost and latency are estimates | Save an AWS Pricing Calculator estimate and measure Seoul Lambda to Singapore Neon cold/warm latency |
| P1 | Public origin has not been live-tested | Verify HMAC, tamper/replay rejection, throttling, timeout/retry and sanitized logs after deployment |
| P1 | Catalog activation is not approved | Migrate, seed inactive rows, then use a separately reviewed activation operation |

## 3. AWS preflight

- Region must be explicitly `ap-northeast-2`; never rely on a CLI default.
- Runtime/artifact must remain Node.js 22 and `arm64`; verify ZIP checksum before upload.
- Use HTTP API, not REST API, Function URL, VPC, NAT Gateway, WAF, or provisioned concurrency for the initial budgeted release.
- Review the SAM change set before execution. Scope its deployment role to this stack and artifact bucket and use GitHub OIDC for automation; do not create a long-lived AWS access key.
- Configure 50%, 80%, and 100% budget notifications and Cost Anomaly Detection. Neither is a spending hard stop.
- Observe Lambda errors/duration/throttles and API 4xx/5xx. Access logs deliberately omit headers and bodies.
- Reserved concurrency and API throttling limit blast radius but do not guarantee a maximum bill; rejected requests and logs may still cost money.

`template.yaml` accepts secret values as `NoEcho` parameters only as a portable draft. `NoEcho` does not make CLI arguments safe and is not the final operator interface. P5-06B must inject secrets from the approved store without printing them. Standard Parameter Store has no additional parameter charge, but no automatic rotation; Secrets Manager is purpose-built and costs about USD 0.40 per secret-month plus API calls. This is a Decision Required.

## 4. Neon preflight

Neon Free currently advertises 100 projects, 100 CU-hours/project/month, 1 GB/project, up to 2 CU, 10 branches, a six-hour instant-restore window, and scale-to-zero after five idle minutes. Singapore (`aws-ap-southeast-1`) is the closest listed AWS region; Seoul is not listed. Limits were checked on 2026-10-23 and must be rechecked on creation day.

- Lambda uses the `-pooler` hostname, runtime read-only role, and pool size 1.
- migration, seed, and `pg_dump` use the direct hostname and separate credentials.
- `DATABASE_SSL_MODE=verify-full`; do not approve `require` for production.
- migration and seed remain explicit and never run during Lambda initialization.
- measure a seven-day-idle-equivalent first request: Lambda cold start plus Neon resume must complete within the Vercel timeout/retry policy.

## 5. P5-06B approval boundary

Separate user approval is required before each state-changing group:

1. create the Neon project/database/roles and record the Singapore choice;
2. create AWS secret parameters, artifact bucket/stack, budgets, and anomaly monitor;
3. migrate, seed inactive catalog data, and separately activate approved rows;
4. deploy the SAM stack and set Vercel production variables;
5. create the backup bucket/lifecycle policy and upload encrypted backups.

Before approval, record the expected CloudFormation resources, regional cost estimate, secret owner, backup owner, rollback owner, and deletion checklist.

## 6. Official references

Checked 2026-10-23:

- AWS Lambda pricing: https://aws.amazon.com/lambda/pricing/
- API Gateway pricing: https://aws.amazon.com/api-gateway/pricing/
- CloudWatch pricing: https://aws.amazon.com/cloudwatch/pricing/
- S3 pricing: https://aws.amazon.com/s3/pricing/
- Parameter Store pricing: https://aws.amazon.com/systems-manager/pricing/
- Neon pricing: https://neon.com/pricing
- Neon regions: https://neon.com/docs/introduction/regions
- Neon pooling: https://neon.com/docs/connect/connection-pooling

## 7. P5-06A verification record

Executed on 2026-10-23 without contacting AWS or Neon:

| Command | Result |
|---|---|
| `pnpm.cmd check` | Passed: lint, typecheck, unit tests, architecture checks, and production builds |
| `pnpm.cmd package:lambda` | Passed: 1,156,227-byte ZIP; 6,228,713 bytes uncompressed; SHA-256 `ac20d936d18a3f8e281edd27e2d2c9687e0e31020a5c996984b504aef0ab1a8e` |
| `sam validate --lint --template-file infrastructure/sam/template.yaml` | Passed with SAM CLI; template is valid |
| `pnpm.cmd db:verify-restore` | Passed: 12 cocktails, 0 active, 12 distinct IDs, zero blank ID/name fields, matching field digest, one migration row |

The first sandboxed `pnpm check`/packaging attempts were blocked by Windows `spawn EPERM`, the first SAM process exited after validation because its telemetry metadata file was inaccessible, and the first Docker attempt could not access the Docker Desktop named pipe. The same commands were rerun with the required local permissions (SAM telemetry disabled) and exited 0. These were environment permission failures, not application failures.
