# AWS Monthly Cost Estimate

Status: Serverless Candidate Budget-Approved / Live Billing Pending
Version: 0.2
Phase: 5 / P5-06A
Last Updated: 2026-10-23

## 1. Evaluation basis

Region is `ap-northeast-2` (Seoul), Linux On-Demand, shared tenancy. A month is 730 hours; scheduled mode is 4 hours/day x 20 days = 80 instance-hours. Planning conversion is **USD 1 = KRW 1,450** and Korean VAT is shown separately at 10%. The card issuer's exchange rate, overseas fee, tax treatment, and AWS price changes can alter the invoice.

The KRW 10,000 limit is assessed on standard charges without credits. At the planning rate this is about USD 6.90 before VAT or USD 6.27 when reserving 10% VAT.

Price inputs checked on 2026-10-22:

- EC2 Seoul On-Demand: `t4g.micro` $0.0104/hour, `t3.micro` approximately $0.013/hour, `t4g.small` $0.0208/hour, and `t3.small` approximately $0.026/hour. Exact regional values are sourced from the [AWS EC2 On-Demand price catalog/page](https://aws.amazon.com/ec2/pricing/on-demand/); the AWS page is dynamic, so values must be rechecked in Pricing Calculator before provisioning.
- One public IPv4 address: $0.005/hour, in use or idle, from [Amazon VPC pricing](https://aws.amazon.com/vpc/pricing/).
- gp3: estimate $0.096/GB-month in Seoul. AWS documents capacity billing and included 3,000 IOPS/125 MB/s on [EBS pricing](https://aws.amazon.com/ebs/pricing/); the Seoul regional number must be reconfirmed in the calculator.
- S3 Standard backup: estimate $0.025/GB-month in Seoul plus requests. Reconfirm on [S3 pricing](https://aws.amazon.com/s3/pricing/).
- Internet data transfer: first 100 GB/month aggregated across eligible AWS services/regions is currently free; see [EC2 data transfer pricing](https://aws.amazon.com/ec2/pricing/on-demand/#Data_Transfer). Estimate assumes this project remains below it.
- CloudWatch basic EC2 metrics are free and the published free tier includes 5 GB of logs, 10 custom/detailed metrics, and 10 standard alarm metrics; see [CloudWatch pricing](https://aws.amazon.com/cloudwatch/pricing/). Estimate assumes basic monitoring, short retention, and less than 5 GB logs.
- AWS Budgets monitoring/notifications are free; action-enabled budgets have separate rules. See [AWS Budgets pricing](https://aws.amazon.com/aws-cost-management/aws-budgets/pricing/).

## 2. Fixed assumptions

| Item | Quantity | Monthly estimate |
|---|---:|---:|
| EBS gp3 | 15 GB | $1.44 |
| Public IPv4 | 730 hours | $3.65 |
| S3 encrypted logical backups | 2 GB average | $0.05 + negligible requests |
| Data transfer out | <= 100 GB aggregate | $0.00 |
| CloudWatch | basic metrics, <= 5 GB logs | $0.00 |
| Budgets | notification budget | $0.00 |

Stopping EC2 does not remove EBS charges. A retained Elastic IP also continues to cost $0.005/hour; this estimate retains one stable IPv4 for the Vercel-to-EC2 endpoint. Domain registration, Route 53 hosted zone, paid support, NAT Gateway, load balancer, ECR storage/transfer, and backup growth are not included. If any becomes required, recalculate before deployment.

## 3. Standard paid-account scenarios

| Scenario | Compute | Fixed above | Total USD | KRW before VAT | KRW incl. 10% VAT | Budget fit |
|---|---:|---:|---:|---:|---:|---|
| A: `t4g.micro`, 24/7 | $7.59 | $5.14 | $12.73 | ₩18,459 | ₩20,305 | No |
| A: `t3.micro`, 24/7 | $9.49 | $5.14 | $14.63 | ₩21,214 | ₩23,335 | No |
| A: `t4g.small`, 24/7 | $15.18 | $5.14 | $20.32 | ₩29,464 | ₩32,410 | No |
| A: `t3.small`, 24/7 | $18.98 | $5.14 | $24.12 | ₩34,974 | ₩38,471 | No |
| B: `t4g.micro`, 80 h | $0.83 | $5.14 | $5.97 | ₩8,657 | ₩9,523 | Yes, but memory is not production-suitable |
| B: `t3.micro`, 80 h | $1.04 | $5.14 | $6.18 | ₩8,961 | ₩9,857 | Marginal, but memory is not production-suitable |
| B: `t4g.small`, 80 h | $1.66 | $5.14 | $6.80 | ₩9,860 | ₩10,846 | No after VAT |
| B: `t3.small`, 80 h | $2.08 | $5.14 | $7.22 | ₩10,469 | ₩11,516 | No |

Calculations intentionally retain IPv4 and EBS for all 730 hours. Scheduled start/stop saves compute only. The estimate also assumes no surplus CPU credits. A memory-safe 2 GiB candidate does not meet KRW 10,000 under the conservative VAT-inclusive test, even at 80 hours/month.

## 4. Credits and free plan

New customers currently receive $100 at sign-up and may earn up to $100 more. The Free plan ends at six months or credit exhaustion, while credits and eligibility have specific expiration/upgrade rules; see the [AWS Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/). Credits can temporarily reduce the invoice for scenarios C, but:

- credits are not included in the budget-fit decision;
- eligibility and service coverage must be checked in the actual account;
- Free-plan closure or credit expiry is an operational risk, not a hosting strategy;
- a nominally $0 invoice does not make the underlying architecture a sub-₩10,000 configuration.

## 5. Sensitivity and omitted-variable risk

- Every additional retained public IPv4 adds $3.65/month before tax.
- Every additional 10 GB gp3 adds an estimated $0.96/month.
- CloudWatch logs beyond the free allowance, detailed monitoring, custom metrics, alarms, and long retention add usage charges.
- S3 versioning/lifecycle mistakes, EBS snapshots, and orphaned volumes/IPs continue billing after the instance stops.
- Public API abuse can create compute-credit, log, and transfer charges even if application traffic is normally small.
- A DNS zone (for example Route 53), a domain, or a container registry may add fixed/usage costs and is excluded until selected.

## 6. Conclusion

**24/7 AWS operation is not possible within KRW 10,000/month at standard rates.** Scheduled 80-hour operation can fit only with a 1 GiB micro instance, which this design does not endorse as a production baseline. The technically preferred `t4g.small` is slightly over the limit even when scheduled, before unplanned usage. Therefore the Phase 5 architecture is cost-validated as a learning/demo design, not approved as an always-on sub-₩10,000 production design.

## 7. Decision Required

- Raise the budget, accept scheduled non-production availability, or change the database/hosting constraint.
- Re-run AWS Pricing Calculator with account tax address and current USD/KRW rate immediately before approval.
- Decide whether stable DNS uses an existing external provider or adds Route 53/domain cost.

## 8. Serverless deployment estimate

The current preferred architecture is Lambda + HTTP API + Neon Free, not the EC2 baseline above. Assumptions: 512 MB Lambda, two seconds per recommendation (1 GB-second), 20 KB request/response transfer, 2 KB logs/request, 14-day retention, 70 MB steady S3 backup storage, 30 PUT and one GET monthly, USD 1 = KRW 1,450, and 10% VAT. AWS credits and time-limited new-account promotions are excluded; always-free service allowances are shown separately.

| Monthly recommendations | Lambda after monthly free allowance | HTTP API estimate | Logs/transfer | S3 backup estimate | Neon Free | Total incl. VAT |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | $0.00 | $0.0001 | $0.00 within allowance | < $0.01 | $0.00 | < KRW 17 |
| 1,000 | $0.00 | $0.001 | $0.00 within allowance | < $0.01 | $0.00 | < KRW 18 |
| 10,000 | $0.00 | $0.01 | $0.00 within allowance | < $0.01 | $0.00 | < KRW 32 |

If Lambda's account-wide free allowance is already exhausted, conservative x86-reference compute plus requests adds approximately $0.001687, $0.016867, and $0.168667 respectively; arm64 is expected to be lower, but the exact Seoul dynamic price is **Estimate / Pending Calculator confirmation**. HTTP API uses the public $1/million first-tier reference and also requires Seoul confirmation. CloudWatch's published free tier includes 5 GB logs, and AWS advertises 100 GB aggregate internet egress free; both are account-wide assumptions, not guarantees for this project.

Secret choice changes fixed cost materially:

- SSM Parameter Store Standard `SecureString` with an AWS-managed KMS key: no additional parameter/key storage charge; manual rotation and redeployment are required.
- Secrets Manager: approximately $0.40/secret-month plus API calls. Two secrets are about $0.80, or KRW 1,276 including VAT, before calls; still within budget but requires approval.
- Customer-managed KMS key: approximately $1/key-month plus requests, so it is not the initial budget choice.

At the stated traffic and free-plan assumptions, serverless operation is comfortably below KRW 10,000/month. This is not a hard cap: abuse, retries, logs, other account workloads, Free-plan policy changes, or paid secret/KMS choices can increase it. AWS Budgets at 50/80/100 percent and Cost Anomaly Detection are alerts, not automatic spending stops.

Official inputs were checked 2026-10-23: [Lambda](https://aws.amazon.com/lambda/pricing/), [API Gateway](https://aws.amazon.com/api-gateway/pricing/), [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/), [S3](https://aws.amazon.com/s3/pricing/), [Parameter Store](https://aws.amazon.com/systems-manager/pricing/), and [Neon](https://neon.com/pricing).

