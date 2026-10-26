# Serverless Monthly Cost Comparison

Status: Proposed  
Version: 0.1  
Phase: 5 / P5-02A  
Last Updated: 2026-10-22

## 1. Evaluation basis

Prices and plan terms were checked on 2026-10-22. AWS region preference is Asia Pacific (Seoul), `ap-northeast-2`. AWS pricing pages are dynamic and some examples publish US-region unit rates; values without a confirmed Seoul table are explicitly estimates and must be rechecked in AWS Pricing Calculator before provisioning.

Planning conversion:

```text
USD 1 = KRW 1,450
VAT = 10%
KRW including VAT = USD x 1,450 x 1.10 = USD x 1,595
Budget ceiling including VAT = KRW 10,000 = approximately USD 6.27
```

AWS new-account promotional credits are excluded. Ordinary published free allowances are shown separately because they are part of standard service pricing, but they are not treated as guaranteed forever. Taxes, card exchange rates, foreign transaction fees, regional rates, and provider plan changes can alter the invoice.

## 2. Workload assumptions

- One Lambda invocation and one HTTP API request per recommendation request.
- Node.js 22, arm64 preferred, 512 MB memory.
- Conservative modeled duration: 2.0 seconds per invocation, including an averaged cold/DB-wake allowance. Actual billing must use measured duration.
- Request plus response transfer: 20 KB per recommendation.
- CloudWatch log volume: 2 KB per request, 30-day retention, no Logs Insights scanning in normal operation.
- PostgreSQL data below 500 MB; Neon compute, storage, and egress remain within Free limits.
- No Provisioned Concurrency, NAT Gateway, VPC endpoint, WAF, custom domain, Route 53 hosted zone, or paid observability product.
- Vercel plan cost and an already-owned domain are outside this AWS estimate.

At 512 MB for 2 seconds, each invocation consumes 1 GB-second. This intentionally overstates a likely warm recommendation request but does not model an extreme timeout.

## 3. Unit prices and allowances

| Item | Price input | Source / confidence |
|---|---:|---|
| Lambda requests | $0.20 per 1 million; 1 million/month free | [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/), official |
| Lambda compute | $0.0000166667 per GB-second x86 reference; 400,000 GB-seconds/month free | [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/), official; conservative reference because exact Seoul arm64 table is dynamic |
| API Gateway HTTP API | $1.00 per 1 million requests first tier reference | [API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/), official; Seoul rate must be reconfirmed |
| Lambda Function URL | no separate endpoint fee; Lambda and transfer still apply | Lambda pricing model; official service behavior |
| CloudWatch Logs | first 5 GB of logs free | [CloudWatch pricing](https://aws.amazon.com/cloudwatch/pricing/), official |
| AWS outbound transfer | assumed $0 within the account's first 100 GB aggregate allowance | [Lambda pricing](https://aws.amazon.com/lambda/pricing/); account-wide usage can consume allowance |
| Neon Free | $0 within 100 CU-hours/project, 1 GB storage/project, current included egress | [Neon Free update](https://neon.com/blog/neon-free-plan-1-gb-per-project); terms can change |
| Supabase Free | $0 within 500 MB DB and 5 GB egress | [Supabase pricing](https://supabase.com/pricing); inactivity pause applies |
| Render Free web | $0 within 750 workspace instance-hours and bandwidth/build limits | [Render Free](https://render.com/docs/free); spins down after 15 minutes |
| Render paid runtime | $7/month Starter reference | **Estimate pending checkout confirmation**; KRW 11,165 incl. VAT, above budget |

AWS Lambda's published Free Tier includes 1 million requests and 400,000 GB-seconds monthly. At the modeled workload, all three traffic cases fit. API Gateway's time-limited new-customer promotional allowance is not counted; its requests are priced from request one. CloudWatch and transfer remain zero only if the entire AWS account has not already consumed their shared allowances.

## 4. Lambda + HTTP API cost by traffic

Gross usage cost below means the cost before applying Lambda's monthly free request/compute allowances. It is useful if another workload has already consumed them.

```text
Lambda compute = requests x 1 GB-s x $0.0000166667
Lambda request = requests / 1,000,000 x $0.20
HTTP API = requests / 1,000,000 x $1.00
```

| Monthly recommendations | Lambda gross | HTTP API | Logs / transfer | Neon Free | Total after Lambda free allowance | KRW incl. VAT | Gross total if Lambda allowance exhausted | Gross KRW incl. VAT |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | $0.001687 | $0.0001 | $0.00 | $0.00 | $0.0001 | < KRW 1 | $0.001787 | about KRW 3 |
| 1,000 | $0.016867 | $0.0010 | $0.00 | $0.00 | $0.0010 | about KRW 2 | $0.017867 | about KRW 28 |
| 10,000 | $0.168667 | $0.0100 | $0.00 | $0.00 | $0.0100 | about KRW 16 | $0.178667 | about KRW 285 |

The tiny totals are not a promise of a zero invoice. Secret storage, custom metrics/alarms, high log volume, retries, malicious traffic, backup storage, or unrelated account usage can add charges. AWS Budgets should therefore still be configured.

## 5. Function URL sensitivity

Replacing HTTP API with a Function URL removes the HTTP API column:

| Monthly recommendations | Total after Lambda free allowance | Gross if Lambda allowance exhausted | Trade-off |
|---:|---:|---:|---|
| 100 | $0.00 | $0.001687 | Saves less than KRW 1 versus HTTP API |
| 1,000 | $0.00 | $0.016867 | Saves about KRW 2 versus HTTP API |
| 10,000 | $0.00 | $0.168667 | Saves about KRW 16 versus HTTP API |

The savings are immaterial at portfolio traffic. API Gateway HTTP API is preferable for throttling, routing, visibility, and AWS learning unless implementation testing reveals a blocking issue.

## 6. Architecture-level monthly comparison

| Candidate | 100 requests | 1,000 requests | 10,000 requests | Budget fit | Important exclusion/risk |
|---|---:|---:|---:|---|---|
| A. EC2 `t4g.small` + EBS/Postgres | about $20.32 before VAT / KRW 32,410 incl. VAT | same baseline | same baseline | No | From P5-01; variable transfer/log/backup growth excluded |
| B. Lambda + HTTP API + Neon Free | < KRW 1 modeled | about KRW 2 | about KRW 16 | Yes | Free limits and combined cold start; logical backup cost not yet selected |
| C. Lambda + HTTP API + Supabase Free | < KRW 1 modeled | about KRW 2 | about KRW 16 | Price yes, availability no | Free project may pause after seven low-activity days |
| D. Render Free + Neon Free | $0 | $0 | $0 within limits | Nominally yes | About one-minute API wake; free usage/suspension limits; less AWS experience |
| D paid runtime + Neon Free | about $7 / KRW 11,165 incl. VAT | same | same | No | Price is an estimate pending current checkout/region verification |

Candidate B is the only option that combines the budget, unattended wake behavior, and meaningful AWS runtime experience. Candidate D is a zero-cost fallback if Lambda adaptation fails, but its cold-start behavior is less suitable for a first-impression portfolio request.

## 7. Database limits and failure economics

| Provider | Free-plan cost | Idle behavior | Limit behavior relevant here | Backup/recovery |
|---|---:|---|---|---|
| Neon | $0 | Scale-to-zero; connection wakes compute | Project may be cut off when a resource allowance is exhausted; verify current account terms | Current 6-hour instant restore window; add off-site logical dumps |
| Supabase | $0 | Low activity over 7 days can pause project | Over 500 MB becomes read-only; paused project needs manual resume | Free users should make off-site dumps; platform restore for paused project is manual |

Automatic synthetic traffic intended only to bypass sleep/pause is not included and is not the proposed solution. It hides rather than solves availability-policy differences and can consume quotas.

## 8. Cost controls

- Create an AWS monthly cost budget with notifications at 50% (KRW 5,000), 80% (KRW 8,000), and 100% (KRW 10,000 equivalent in account currency).
- Enable Cost Anomaly Detection for the account/service scope.
- Budgets and anomaly alerts do not automatically stop spending and are not hard limits.
- Set Lambda reserved concurrency and API Gateway stage throttles before public release.
- Set CloudWatch log retention; do not log request bodies or full errors containing connection strings.
- Do not enable Provisioned Concurrency, VPC/NAT Gateway, WAF, paid API Gateway cache, or paid database plan without a new estimate and explicit approval.
- Compare AWS Cost Explorer actuals against Lambda invocations/duration, API Gateway request count, log ingestion, and transfer weekly during the first month, then monthly.
- Alert separately on Neon compute/storage/egress consumption and keep the dataset below the plan threshold.

## 9. Uncertainty and pre-deployment check

- **Estimate:** exact Seoul Lambda arm64 compute and HTTP API regional prices were not available as static values on the dynamic public pages used here. Conservative x86/reference rates were used; use AWS Pricing Calculator immediately before approval.
- **Unconfirmed:** Render Starter checkout price and regional availability must be checked if candidate D is revisited.
- Free plans can change or be withdrawn. Recheck Neon and Supabase terms on the provisioning date and record screenshots/exported calculator results.
- Measure actual Lambda duration for warm, Lambda-cold, DB-cold, and both-cold requests. Replace the 2-second assumption with observed p50/p95/max values.
- Confirm whether secret storage introduces a fixed cost. A paid Secrets Manager secret can dominate these request costs; Parameter Store Standard or encrypted Lambda variables may be adequate after security review.
- Decide and price off-site backups. Small compressed logical dumps may fit free S3 allowances, but that is not assumed until retention and size are known.

