# Serverless Deployment Decision

Status: Selected for Deployment Validation
Version: 0.3
Phase: 5 / P5-04
Last Updated: 2026-10-23

## 1. Decision

Proceed to implementation planning with **Vercel + API Gateway HTTP API + AWS Lambda + Neon PostgreSQL** as the preferred Phase 5 portfolio architecture.

P5-03 proved the Lambda adapter, Payload Format 2.0 contract, bounded database reconnection, and local PostgreSQL path. P5-04 locally implements body HMAC authentication, timeout/retry behavior, verified-TLS defaults, safe boundary errors, throttling configuration, and cost controls. The decision remains provisional until a separately approved deployment proves the real AWS/Neon cold path and current provider limits. It does not authorize resource creation or paid deployment. Existing EC2 and Docker documents/assets remain intact as an alternative.

## 2. Why this candidate

- It keeps the existing Next.js, NestJS, PostgreSQL, HTTP contract, Domain v1, and deterministic recommendation algorithm.
- Lambda and Neon both scale down when unused yet can resume from a real visitor request. This is compatible with unpredictable interview visits without paying for an always-on VM.
- The modeled AWS charge at 10,000 recommendations/month is about KRW 16 including VAT after the recurring Lambda Free Tier, or about KRW 285 if the Lambda allowance is already exhausted. Both are far below KRW 10,000 under the documented assumptions.
- API Gateway, Lambda, IAM, CloudWatch, budgets, deployment packaging, and least-privilege CI/CD provide relevant AWS experience.
- It removes OS, Docker daemon, TLS proxy, EBS, and colocated PostgreSQL maintenance from the live path.
- Neon Free's request-driven compute resume better matches unattended portfolio availability than Supabase Free's possible low-activity project pause.

## 3. Why the other candidates are not selected

### A. Vercel + EC2 + PostgreSQL

P5-01 estimated the technically preferred `t4g.small` stack at about $20.32/month before VAT, approximately KRW 32,410 including VAT. It is always-on and offers strong EC2/Docker experience, but it misses the budget by a wide margin and has the highest patching, backup, and recovery burden.

### C. Vercel + Lambda + Supabase PostgreSQL

It is cost-compatible and provides a good serverless pooler. It is rejected as the default because Supabase may pause a Free project after seven days of low activity, and resumption is an owner action in Supabase Studio. An interviewer's first request cannot be relied on to restore it. Supabase Pro avoids that issue but starts above the entire monthly budget.

### D. Vercel + Render + PostgreSQL

Render Free can reuse the Docker work but spins down after 15 minutes and documents roughly a one-minute wake. Combined with a sleeping database and Vercel upstream time limits, this creates a poor first-request experience. The paid runtime estimate of $7/month becomes about KRW 11,165 after the stated conversion and VAT, already above budget. It also provides less AWS experience.

## 4. Availability interpretation

“24-hour access” means the public URL can receive a request at any time and the managed services can automatically start work. It does not mean zero cold-start latency or a formal uptime SLA on free plans.

For the recommended architecture after seven idle days:

```text
Visitor submits 8 answers
  -> Vercel Route Handler
  -> API Gateway authenticates/routes/throttles
  -> Lambda cold-starts NestJS if necessary
  -> TypeORM opens/revalidates one pooled TLS connection
  -> Neon wakes compute if necessary
  -> existing recommendation use case runs
  -> response returns; answers remain recoverable on transient failure
```

The first attempt is expected to be viable, but the combined cold path must be measured. A bounded retry and honest “server waking” message are required safeguards, consistent with P-006 Recoverable Failure. Provisioned Concurrency and keep-warm traffic are not the default because they add cost or deliberately evade idle policies.

## 5. Implemented in P5-03

1. Added a Lambda entry point while retaining Docker/local `main.ts`.
2. Cached one in-flight/successful Nest initialization per warm environment and cleared a rejected initialization promise.
3. Added Lambda-aware pool size, TLS mode, connection timeout, idle timeout, connection probe, and one bounded reconnect.
4. Built a Node.js 22 ZIP bundle with application/workspace code, TypeORM entities/migration, and the pure-JavaScript `pg` runtime.
5. Added a SAM draft for arm64, 512 MB, 15-second timeout, reserved concurrency 2, HTTP API v2, and 14-day logs.
6. Required an external request-authorizer ARN in the template rather than creating a public unauthenticated API default.
7. Kept `synchronize: false`, explicit migration/seed commands, Docker Compose, and Domain v1 unchanged.

## 6. P5-03 verification record

- API unit tests: 78 passed, including initialization reuse, concurrent initialization, failed-initialization retry, and bounded DB reconnect.
- Existing NestJS HTTP E2E: 4 passed.
- Lambda HTTP API Payload 2.0 E2E: 3 passed (`GET /health`, valid `POST /recommendations`, invalid request HTTP 400).
- ZIP build: passed; approximately 1.15 MB compressed and 6.22 MB uncompressed on the verification workstation.
- SAM CLI was unavailable during P5-03. It was installed later, and the P5-04 template passed `sam validate --lint` with SAM CLI 1.170.0 on 2026-10-23.
- Native AWS arm64 and Neon execution were not run because creating those resources is outside P5-03.

## 7. Required proof before production selection

- Bundle/deploy artifact builds for Node.js 22 arm64 with `contracts` and `domain` included.
- NestJS handler starts and serves API Gateway v2 events without calling `listen()`.
- Existing contract tests pass through the Lambda adapter.
- Warm, Lambda-cold, Neon-cold, and both-cold p50/p95/max latency measurements are recorded in Seoul-to-selected-DB-region conditions.
- `GET /health`, readiness, migration, seed, empty-catalog recommendation, active-catalog recommendation, and recovery after stale pooled connection pass.
- Ten or more parallel cold/warm requests do not exhaust the database pool; reserved concurrency behavior is verified.
- Vercel Route Handler timeout/retry preserves answers and does not duplicate unsafe work.
- Missing/invalid server credential is rejected and valid Vercel-originated requests succeed.
- API Gateway throttling and emergency Lambda concurrency-zero runbook are tested.
- Current AWS/Neon prices and limits are rechecked, and an AWS Pricing Calculator estimate is saved.
- Logical backup and isolated restore test succeeds.
- `pnpm.cmd check` and existing integration/E2E suites pass without skips.

## 8. P5-04 security decision

- **Authentication selected:** Vercel signs the exact body and request metadata; the NestJS Lambda entry verifies it before bootstrap or business handling.
- **Authorizer rejected for body HMAC:** the documented HTTP API authorizer event lacks the original body. A header-only authorizer would add cost but could not establish body integrity.
- **Replay scope:** five-minute timestamp window, with a documented residual replay possibility inside that window.
- **Retry:** at most once for network errors and 502/503/504 because recommendation is read-only.
- **TLS:** production/Lambda defaults to certificate and hostname validation (`verify-full`); local Docker remains non-TLS.

## 9. Decision Required before deployment

- **Endpoint:** approve API Gateway HTTP API as preferred, retaining Function URL only as a fallback.
- **Secret injection:** approve the mechanism that supplies the shared secret without exposing it in command history, change sets, logs, or source control.
- **Database:** approve Neon Free for the portfolio workload and select the nearest available region after latency testing.
- **Artifact:** approve the verified ZIP approach or request a container comparison.
- **Infrastructure as code:** approve the current AWS SAM draft.
- **Secrets:** encrypted Lambda variables/SSM Parameter Store versus Secrets Manager after including its exact monthly price.
- **Backup:** destination, retention, encryption key ownership, RPO/RTO, and restore cadence.
- **User experience:** final timeout, single-retry conditions, and Korean/English cold-start error copy.
- **Budget ownership:** billing alert recipients and incident owner; acknowledge that AWS Budgets is not a hard cap.

## 10. Final status

The feasibility study selects candidate B as the strongest fit, P5-03 establishes its Lambda baseline, and P5-04 establishes the local security/resilience baseline. The architecture is **not deployed**. A later deployment phase may create or invoke cloud resources only after the remaining decisions and explicit cost approval.

