# AWS Serverless Deployment Feasibility

Status: Proposed  
Version: 0.1  
Phase: 5 / P5-02A  
Last Updated: 2026-10-22

## 1. Scope and conclusion

This study evaluates a serverless replacement for the P5-01 EC2 runtime. It does not create AWS, Neon, Supabase, or hosting resources and does not change application code, Domain v1, recommendation behavior, or the existing Docker deployment assets.

The technically preferred candidate is:

```text
Browser
  -> Vercel Next.js
  -> same-origin POST /api/recommendations
  -> Vercel Route Handler
  -> HTTPS + server-to-server authentication
  -> API Gateway HTTP API (ap-northeast-2)
  -> AWS Lambda, Node.js 22, arm64, 512 MB initial sizing
  -> TLS pooled connection
  -> Neon PostgreSQL, nearest validated region
```

This is a recommendation for the next implementation phase, not an approved deployment. The P5-01 EC2 architecture remains documented and valid as a container/operations learning path.

## 2. Current implementation findings

- `apps/api/src/main.ts` creates a normal NestJS Express application and binds `0.0.0.0` to `PORT`. It does not export a Lambda handler.
- `AppModule` imports the database, health, and recommendation modules. The HTTP contract can remain unchanged when the Express application is wrapped for Lambda.
- The API already uses `@nestjs/platform-express`; no Fastify-to-Express conversion is required.
- `apps/api/package.json` has no Lambda event types, serverless Express adapter, bundler, or infrastructure-as-code dependency.
- Runtime TypeORM configuration uses five discrete database variables, creates a normal `pg` connection pool, retries three times, and keeps `synchronize: false`.
- The migration `DataSource` uses the same discrete variables. Migration and seed are explicit commands and are not run during API startup.
- The Vercel Route Handler keeps the backend origin server-side in `API_BASE_URL`, forwards the existing JSON contract, and maps network failures to HTTP 502. It currently has no explicit upstream timeout, retry, or server credential.
- The P5-02 Docker image proves Node.js 22 and both amd64/arm64 dependency compatibility. A Lambda zip/container artifact and handler are nevertheless different deliverables and require separate validation.
- The current health readiness endpoint reaches PostgreSQL. In Lambda, it is useful for release smoke tests but must not be polled frequently merely to keep the function or database awake.

## 3. NestJS and Lambda compatibility

### Feasibility

NestJS with the Express adapter is compatible with Lambda through an HTTP event adapter such as [`@codegenie/serverless-express`](https://github.com/CodeGenieApp/serverless-express). The adapter supports API Gateway v2 events and caches an asynchronously initialized Express application. AWS recommends initializing reusable clients and database connections outside the handler so a warm execution environment can reuse them, while also warning that environment lifetime is not guaranteed ([AWS Lambda best practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html), [execution environment lifecycle](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)).

P5-03 should split the current bootstrap into two entry points:

- a reusable function that creates and initializes the Nest application without listening on a TCP port;
- the existing server entry point for Docker/local execution;
- a Lambda handler that lazily initializes and caches the serverless Express adapter.

The public routes and request/response contracts do not need to change. `POST /recommendations`, `GET /health`, and `GET /health/ready` can be routed through an API Gateway catch-all integration.

### Database connection lifecycle

The Nest application and TypeORM `DataSource` may be reused by subsequent invocations in the same warm Lambda environment. They cannot be treated as permanent:

- initialize once per execution environment, not once per request;
- use the provider's pooled endpoint and TLS;
- start with an application-side pool maximum of `1` per Lambda environment;
- validate stale connections and allow reconnection after a frozen environment resumes;
- cap Lambda reserved concurrency to protect the database from connection bursts;
- do not call `destroy()` after every request;
- keep migrations and seed outside the request handler.

The current configuration does not expose URL/SSL/pool controls, so P5-03 needs a small infrastructure-only configuration extension. It must leave `synchronize: false` unchanged. Supabase explicitly recommends its shared transaction pooler, pool size 1, disabled prepared statements where the driver requires it, and SSL for serverless clients ([Supabase connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres)). Neon provides a pooled endpoint intended to avoid direct Postgres connection exhaustion ([Neon compute management](https://neon.com/docs/manage/endpoints/)). TypeORM/`pg` behavior against the selected transaction pooler must be integration-tested, especially migrations, transactions, prepared statements, and stale-connection recovery.

## 4. Lambda platform design

### Function settings to validate

| Setting | Initial proposal | Reason |
|---|---|---|
| Region | `ap-northeast-2` | AWS learning target and low latency to Korean users; DB region proximity must be measured |
| Runtime | Node.js 22 | Matches the repository and P5-02 image |
| Architecture | arm64 | P5-02 build/runtime emulation passed; Lambda native smoke test remains required |
| Memory | 512 MB initially | More realistic than 128/256 MB for NestJS + TypeORM; tune with duration and max-memory metrics |
| Timeout | 15 seconds initially | Allows framework and DB cold starts but fails well before Lambda's 900-second maximum |
| Reserved concurrency | 2 initially | Limits DB connections and abuse cost; verify account concurrency availability |
| Provisioned concurrency | Disabled | Fixed cost conflicts with the budget and removes the low-idle-cost advantage |
| Deployment | Bundled zip preferred; container fallback | Smaller package normally improves cold start; container image is allowed up to 10 GB but the P5-02 image is not automatically optimal |

Standard Lambda quotas include 128–10,240 MB memory, a 900-second timeout, and 6 MB synchronous request/response payloads ([AWS Lambda quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)). The recommendation payload is far below those limits. API Gateway should enforce a much smaller application-specific request-body limit.

### Function URL versus API Gateway HTTP API

| Item | Lambda Function URL | API Gateway HTTP API |
|---|---|---|
| Endpoint charge | No separate endpoint request charge | About $1 per million requests in the first tier; regional price must be reconfirmed |
| Authentication | `AWS_IAM` or `NONE` | IAM/JWT/Lambda authorizer options plus stage throttling |
| Public risk | `NONE` allows anyone with the URL to invoke it | Still public by default, but central throttling/routing/metrics are stronger |
| Vercel integration | IAM requires SigV4 credentials; `NONE` needs application-layer secret/HMAC | Same IAM credential issue; shared-header/HMAC validation is simplest initially |
| Learning value | Lambda-focused | Lambda + API Gateway operational experience |
| Recommendation | Cost-minimum fallback | Preferred for this portfolio |

AWS documents that a Function URL with auth type `NONE` permits unauthenticated public invocation ([Function URL authorization](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html)). A secret header does not make the network endpoint private; it only lets application code reject unauthorized requests after an invocation has already incurred some work. API Gateway HTTP API is preferred because its low request cost buys explicit routing, throttling, and better AWS API practice. WAF is not included because its fixed cost is disproportionate to this budget.

### VPC decision

Do not attach the Lambda function to a customer VPC when using a public Neon or Supabase endpoint. Lambda has public internet access by default. Attaching it to a VPC makes outbound internet routing the owner's responsibility, commonly requiring a charged NAT Gateway ([AWS Lambda VPC internet access](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc-internet.html)). A NAT Gateway would defeat the monthly budget. Revisit VPC attachment only if the database moves to a private AWS network and the full network cost is approved.

## 5. PostgreSQL feasibility

### Neon Free

- Current published Free limits checked on 2026-10-22 include 100 CU-hours and 1 GB storage per project, autoscaling, and a 6-hour restore window ([Neon Free update](https://neon.com/blog/neon-free-plan-1-gb-per-project)).
- Compute scales to zero after inactivity and wakes on connection; the documented reactivation overhead is normally in the hundreds-of-milliseconds class, but end-to-end application latency is not guaranteed ([Neon compute management](https://neon.com/docs/manage/endpoints/)).
- A week without traffic does not by itself require an operator to restore the project. The first real connection is the wake trigger.
- Use the pooled hostname, TLS/`sslmode=require`, a small client pool, and a region close to Seoul Lambda.
- Free restore history is short. Scheduled encrypted logical backups outside Neon remain necessary for portfolio longevity.
- If free compute/storage/egress limits are reached, availability can be cut off until reset or upgrade. Current plan terms must be rechecked before deployment.

### Supabase Free

- Current Free limits checked on 2026-10-22 include two active projects, 500 MB database size, 5 GB egress, and shared CPU/500 MB RAM ([Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase), [pricing](https://supabase.com/pricing)).
- Free projects with low activity over seven days may be paused. Restoring requires the owner to open Supabase Studio and choose **Resume project**; an interviewer's database request does not automatically resume it ([Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)).
- The shared transaction pooler on port 6543 is the documented serverless path. Direct connections are IPv6-only on Free; the shared pooler is IPv4-accessible.
- Free projects do not receive the managed daily-backup access offered on paid plans. Supabase recommends regular off-site logical dumps ([Supabase backups](https://supabase.com/docs/guides/platform/backups)).
- Exceeding 500 MB places the database into read-only mode.

Supabase remains technically compatible with TypeORM/PostgreSQL, but its inactivity pause violates the unattended first-visit objective. The paid Pro plan avoids pausing but starts at $25/month, far over budget.

## 6. Candidate comparison

| Candidate | Cost / budget | Availability after idle | Cold start and first recommendation | Complexity | AWS learning | Operations |
|---|---|---|---|---|---|---|
| A. Vercel + EC2 + local PostgreSQL | About $20.32/month before VAT for `t4g.small` baseline | Always on while instance is healthy | No serverless cold start | Docker/OS/TLS/backup ownership | Strong EC2/IAM/VPC practice | Highest; single host and DB recovery |
| B. Vercel + Lambda + Neon | Near $0 at stated traffic within free allowances | URL always exists; Lambda and DB auto-resume | Combined Lambda + DB cold path; should succeed with adequate timeout/retry | Moderate initial adaptation, low steady maintenance | Strong Lambda/API Gateway/IAM/CloudWatch practice | Preferred; off-site backup still required |
| C. Vercel + Lambda + Supabase | Near $0 within free limits | **Not unattended:** Free project may pause after 7 low-activity days | Request can fail until owner manually resumes project | Moderate | Same AWS API learning | Inactivity monitoring/manual restore burden |
| D. Vercel + Render Free + Neon | $0 within both free limits | Render URL wakes after 15 minutes idle | Render documents roughly one-minute wake, plus DB wake; timeout risk | Reuses Docker most directly | Low AWS learning | Free service limits/suspension; paid $7 runtime exceeds budget after VAT |

For candidate D, Render Free spins down after 15 idle minutes and wakes on the next request, a process documented as taking about one minute. It provides 750 instance-hours per workspace; exhaustion suspends free services until the next month. Free Render PostgreSQL expires after 30 days, so Neon is used instead ([Render Free](https://render.com/docs/free)). Render can build the existing Dockerfile, but a prebuilt image deployment currently requires `linux/amd64` ([Render Docker image deployment](https://render.com/docs/deploying-an-image)). This candidate is a fallback, not the recommendation.

## 7. Seven-day idle portfolio scenario

1. The static/Next.js page remains reachable on Vercel.
2. The visitor completes eight questions locally; Product invariants remain unchanged.
3. The Route Handler validates JSON, adds server authentication, sets a bounded timeout, and calls API Gateway.
4. Lambda may cold-start Node.js, NestJS, and TypeORM.
5. Neon may simultaneously resume its suspended compute and establish a pooled TLS connection.
6. The recommendation query runs against already migrated and seeded data and returns the existing response contract.

The combined cold path can be several seconds and must be measured; neither provider promises a project-specific number. The first request should normally succeed with Neon, unlike a paused Supabase Free project, but transient DNS, TLS, stale socket, provider wake, or timeout failure remains possible.

P5-03 should therefore add:

- an explicit Vercel-to-AWS timeout longer than the measured p95 cold path but shorter than the user-facing platform limit;
- one bounded retry only for connection/502/503/504 failures, with jitter and an idempotent recommendation request;
- a user message such as “추천 서버를 깨우는 중입니다. 잠시 후 다시 시도해 주세요” while preserving all completed answers;
- no automatic periodic keep-warm calls as the default solution;
- a release and periodic operator smoke test that does not intentionally defeat DB sleep.

## 8. Security and operations

- Browser calls only the same-origin Vercel Route Handler. Do not expose the AWS URL in client code.
- Prefer API Gateway HTTP API. Apply route/body limits, throttling, and Lambda reserved concurrency.
- **Decision Required:** choose either SigV4 with a narrowly scoped AWS principal credential stored by Vercel, or application-layer HMAC/shared-secret authentication. Long-lived IAM user keys are not preferred; if unavoidable, scope only `execute-api:Invoke`, rotate, and monitor them. Vercel workload identity support must be verified before claiming keyless federation.
- Reject missing/invalid server credentials before Nest business handling. Use constant-time comparison and rotation overlap if HMAC/shared secret is selected.
- Keep DTO/runtime contract validation. Do not relax anonymous product access; this is server authentication, not user login.
- Store the DB credential and server-auth secret in an approved encrypted runtime secret mechanism. Do not commit them or print them in CloudWatch/Vercel logs.
- Lambda execution role: CloudWatch Logs only, plus the exact secret-read permission if Secrets Manager/Parameter Store is selected. No database or deployment administrator permissions.
- Set short CloudWatch retention, structured request IDs/status/duration, and redact bodies, answers, credentials, and connection strings.
- Configure AWS Budgets at 50%, 80%, and 100%, and Cost Anomaly Detection. Budgets alert; they are not a hard spending cap.
- Apply API Gateway throttling and Lambda reserved concurrency. Keep an emergency runbook to set reserved concurrency to zero if abuse occurs.
- Run migrations through a separate CI/manual job using the direct migration endpoint where required; never on every cold start.
- Maintain encrypted, access-controlled logical backups outside the database provider and test restoration.

## 9. Decision Required

- Approve API Gateway HTTP API rather than Function URL.
- Select Vercel-to-AWS authentication after confirming whether keyless workload identity is available; otherwise approve scoped credential versus rotated HMAC trade-off.
- Confirm Neon region availability/latency nearest `ap-northeast-2` and current Free terms in the account.
- Choose Lambda zip bundle versus container image after measuring artifact size and cold start.
- Approve initial 512 MB/arm64/15-second timeout/reserved concurrency 2 settings for a no-cost local/SAM and explicitly approved cloud validation.
- Define Vercel function timeout and retry UX based on an end-to-end cold-start test.
- Define logical backup destination, schedule, retention, RPO, and restore drill.

