# Serverless Deployment Decision

Status: Proposed  
Version: 0.1  
Phase: 5 / P5-02A  
Last Updated: 2026-10-22

## 1. Decision

Proceed to implementation planning with **Vercel + API Gateway HTTP API + AWS Lambda + Neon PostgreSQL** as the preferred Phase 5 portfolio architecture.

This decision is provisional until P5-03 proves the cold path, TypeORM pooling, migrations, authentication, and current provider limits. It does not authorize resource creation or paid deployment. Existing EC2 and Docker documents/assets remain intact as an alternative deployment and operational-learning path.

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

## 5. Implementation guardrails for P5-03

1. Add a Lambda entry point without removing the Docker/local `main.ts` entry point.
2. Cache Nest application initialization and TypeORM state per warm environment, but handle stale or absent connections.
3. Use Neon pooled TLS connection details for runtime. Use the provider-approved direct/session endpoint for migration tooling when required.
4. Start with Lambda arm64, 512 MB, 15-second timeout, and reserved concurrency 2; tune only from measurements.
5. Do not attach Lambda to a customer VPC and do not create a NAT Gateway for a public managed database.
6. Route only through API Gateway HTTP API; the browser continues to call the Vercel same-origin Route Handler.
7. Add server-to-server authentication, explicit timeout, one bounded transient retry, request-size validation, throttling, and secret/log redaction.
8. Keep `synchronize: false`; run migration as an explicit release gate, seed explicitly, and never initialize production data during Lambda startup.
9. Preserve completed answers when cold-start or database wake fails. Do not change recommendation scoring, filtering, ranking, or reasons.
10. Add infrastructure as code and a plan/dry-run review. Creating AWS/Neon resources still requires explicit user approval.

## 6. Required proof before final selection

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

## 7. Decision Required before implementation

- **Endpoint:** approve API Gateway HTTP API as preferred, retaining Function URL only as a fallback.
- **Authentication:** decide between SigV4 with a narrowly scoped caller identity and a rotated HMAC/shared secret. Confirm Vercel's current workload-identity capability before storing any long-lived AWS credential.
- **Database:** approve Neon Free for the portfolio workload and select the nearest available region after latency testing.
- **Artifact:** bundled zip versus Lambda-compatible container image.
- **Infrastructure as code:** AWS SAM, CDK, or Terraform; choose one before adding deployment configuration.
- **Secrets:** encrypted Lambda variables/SSM Parameter Store versus Secrets Manager after including its exact monthly price.
- **Backup:** destination, retention, encryption key ownership, RPO/RTO, and restore cadence.
- **User experience:** final timeout, single-retry conditions, and Korean/English cold-start error copy.
- **Budget ownership:** billing alert recipients and incident owner; acknowledge that AWS Budgets is not a hard cap.

## 8. Final status

The feasibility study selects candidate B as the strongest fit, with Neon preferred over Supabase for unattended wake behavior and API Gateway preferred over Function URL for a negligible incremental cost. The architecture is **not yet final or deployed**. P5-03 may begin only after the Decision Required items are resolved and explicit approval is given for any cloud resource or charge.

