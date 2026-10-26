# AWS Deployment Architecture

Status: Proposed  
Version: 0.2
Phase: 5 / P5-03
Last Updated: 2026-10-23

## 1. Decision summary

비용 검토와 P5-03 로컬 검증을 반영한 우선 배포 후보는 다음과 같다.

```text
Browser
  -> Vercel (Next.js)
  -> same-origin POST /api/recommendations
  -> Next.js Route Handler
  -> API Gateway HTTP API
  -> AWS Lambda (Node.js 22, arm64)
  -> Neon pooled PostgreSQL over TLS
```

Lambda Handler와 API Gateway Payload Format 2.0 로컬 E2E는 구현되었다. AWS 및 Neon 리소스는 생성되지 않았으며, 서버 간 인증 방식과 실제 Neon cold-start 검증이 끝나기 전에는 이 구성을 운영 확정으로 취급하지 않는다.

P5-01/P5-02의 EC2 대안은 삭제하지 않는다.

```text
Browser
  -> Vercel (Next.js)
  -> same-origin POST /api/recommendations
  -> Next.js Route Handler
  -> HTTPS
  -> EC2 public endpoint (Caddy)
  -> private Docker network
       -> NestJS API
       -> PostgreSQL
```

EC2 구성은 Docker/호스트 운영 학습 또는 서버리스 부적합 판정 시의 대안이다. 이 문서는 설계안이며 AWS 리소스, DNS, 이미지 또는 운영 Secret을 생성하지 않는다. 기존 `docs/architecture/overview.md`의 GCP 방향과 충돌하므로 Phase 5에서는 이 문서를 AWS 배포의 우선 제안으로 취급하되, 전사 Architecture의 인프라 항목을 AWS로 바꾸는 일은 별도 Architecture Decision으로 남긴다.

## 2. Why this topology

- 브라우저는 기존과 같이 Next.js의 동일 출처 Route Handler만 호출한다. NestJS 주소와 내부 Contract를 브라우저에 직접 노출하지 않는다.
- Web은 Vercel의 관리형 Next.js 실행 환경을 사용하고, 비용과 운영 학습의 중심을 단일 EC2에 둔다.
- EC2 한 대에서 API와 PostgreSQL을 함께 운영하면 RDS, NAT Gateway, Load Balancer 비용을 피할 수 있다.
- 단일 호스트와 단일 EBS 볼륨은 장애 도메인도 하나다. 고가용성 구성이 아니며 개인 포트폴리오/저트래픽 환경으로만 적합하다.

## 3. AWS components

| Service | Planned use | Cost/architecture guardrail |
|---|---|---|
| EC2 | Linux host for Docker Compose | On-Demand, one instance, no ASG/ELB |
| EBS | OS, container data, PostgreSQL volume | gp3 15 GB starting point; deletion protection and snapshot policy required |
| VPC | One public subnet and Internet Gateway | NAT Gateway and paid VPC endpoints are excluded |
| Security Group | 80/443 public; administration restricted | PostgreSQL 5432 never allowed inbound |
| IAM | EC2 instance role for approved S3 backup prefix and optional CloudWatch | No long-lived AWS key on EC2 |
| AWS Budgets | Monthly cost notification | Alert only; not a hard spending cap |
| CloudWatch | EC2 basic metrics; logs only with caps/retention | Detailed monitoring disabled initially |
| S3 | Optional off-host encrypted PostgreSQL backups | Small lifecycle-managed bucket/prefix; public access blocked |

## 4. Instance sizing decision

| Type | vCPU / memory | Architecture | Assessment |
|---|---:|---|---|
| `t3.micro` | 2 / 1 GiB | x86_64 | Broad image compatibility, but 1 GiB is not a responsible production baseline for OS + Docker + NestJS + PostgreSQL + proxy. |
| `t4g.micro` | 2 / 1 GiB | arm64 | Lower price, same memory risk. Evaluation only; do not select solely to meet budget. |
| `t3.small` | 2 / 2 GiB | x86_64 | Operationally safer baseline and easiest compatibility; cost exceeds the budget. |
| `t4g.small` | 2 / 2 GiB | arm64 | Recommended technical candidate after ARM proof; lower than `t3.small`, but 24/7 cost exceeds the budget. |

The recommendation is **`t4g.small` as the P5-02 technical candidate, not yet approved for paid deployment**. A 2 GiB baseline leaves materially more room for PostgreSQL shared buffers, Node heap, Caddy, Docker, and the OS. `t4g.micro` may be used only for a measured, non-production experiment with explicit memory limits and swap; it is not the final production recommendation.

The current lockfile includes Linux arm64 variants for native tooling such as esbuild, sharp, lightningcss, and Rollup, while application runtime dependencies (`pg`, NestJS, TypeORM) are JavaScript or publish supported Node artifacts. This is evidence of likely compatibility, not execution proof. P5-02 must build the production image for `linux/arm64`, run migrations, tests, health checks, and a recommendation smoke test on that image before `t4g` is approved.

T-family Unlimited mode can add surplus CPU-credit charges. Linux T4g surplus credits are $0.04/vCPU-hour and T3 are $0.05/vCPU-hour according to [EC2 On-Demand pricing](https://aws.amazon.com/ec2/pricing/on-demand/). Monitor `CPUCreditBalance` and `CPUSurplusCreditsCharged`; sustained CPU means resize or investigate rather than accept unbounded credits.

## 5. Docker Compose design for P5-02

Planned services:

- `reverse-proxy`: pinned Caddy image; only service publishing host ports 80 and 443; redirects HTTP to HTTPS.
- `api`: pinned Node runtime and immutable application image; exposes the NestJS port only on the internal network.
- `postgres`: pinned PostgreSQL major/minor image; no host port; named EBS-backed volume.

Required Compose controls:

- separate internal application network; no published `5432`;
- health checks for PostgreSQL, API readiness, and proxy-to-API path;
- `restart: unless-stopped` or an equivalent documented policy;
- explicit CPU/memory limits tested against the chosen instance;
- secrets supplied through root-readable host files or a runtime secret mechanism, never committed `.env` files;
- immutable image digests or pinned versions, not `latest`;
- PostgreSQL data and Caddy state/config on named persistent volumes;
- startup ordering based on health, while migrations remain a one-shot release action rather than API startup behavior.

## 6. Availability and failure model

There is no multi-AZ failover. EC2, its Availability Zone, and the attached EBS volume are single points of failure. Recovery uses a replacement instance, Compose configuration, the last tested off-host backup, and DNS reassignment. The browser's completed answers remain protected by the existing client recovery behavior; API failure must return an error without clearing them.

## 7. Alternatives considered

| Alternative | Benefit | Reason not selected for the base plan |
|---|---|---|
| RDS PostgreSQL | Managed backups, patching, isolation | Recurring instance/storage/public IPv4 or networking cost is incompatible with the budget. |
| ECS Fargate | Managed task scheduling and immutable deployments | Task plus database and networking costs exceed the single-host target; PostgreSQL still needs a durable service. |
| App Runner | Simple container deployment and HTTPS | Always-on compute cost plus separate database exceeds the target and provides less EC2 operations practice. |
| EC2 Spot | Lower compute price | Interruption is inappropriate for a colocated stateful PostgreSQL host. |

## 8. Decision Required

- Approve AWS as the replacement for the repository's previously documented GCP target.
- Choose paid always-on operation above budget, scheduled demo operation, or a higher monthly budget.
- Confirm ownership of a domain/DNS provider. Domain registration and external DNS charges are excluded from the estimate.
- Approve `t4g.small` only after P5-02 arm64 validation; otherwise use `t3.small` at the higher cost.
- Choose S3 backup retention and the acceptable recovery point/recovery time objectives.

