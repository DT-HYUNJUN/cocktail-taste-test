# AWS Deployment Security

Status: Proposed  
Version: 0.1  
Phase: 5 / P5-01  
Last Updated: 2026-10-22

## 1. Traffic and network policy

- Caddy terminates TLS on EC2 and redirects port 80 to 443. Automatic certificate renewal requires working public DNS and inbound 80/443 during validation/renewal.
- Security Group inbound: TCP 80/443 from the internet; no `5432`; administration has no permanent world-open SSH rule.
- Preferred administration is AWS Systems Manager Session Manager when its required agent/connectivity and cost are validated. If SSH is retained, use key authentication, disable password/root login, and restrict port 22 to a current operator IP only for the maintenance window.
- API and PostgreSQL communicate only through a private Docker network. PostgreSQL has no host port mapping.
- Do not add a NAT Gateway, public RDS, or broad `0.0.0.0/0` administrative rule to simplify setup.

## 2. Public API policy

The browser continues to call only Vercel's same-origin Route Handler. EC2 nevertheless has a public HTTPS endpoint because Vercel outbound addresses are not assumed to be a stable allowlist.

Before production exposure, P5-02 must add a server-to-server authentication mechanism between the Route Handler and NestJS (for example, a rotated high-entropy shared request credential), reject missing/invalid credentials at the API boundary, and avoid logging the credential. This is defense-in-depth, not end-user authentication, and must preserve anonymous test completion.

Also require:

- request body/size limits and existing runtime Contract validation;
- rate limiting at Caddy and/or NestJS with conservative burst limits;
- timeouts and maximum upstream body sizes;
- generic public errors with diagnostic details only in protected logs;
- no permissive browser CORS. Current same-origin Route Handler architecture does not require it;
- abuse monitoring for request rate, 4xx/5xx, CPU credits, logs, and transfer.

IP allowlisting Vercel is **Decision Required** unless a supported stable-egress product is explicitly selected and priced.

## 3. Identity and access

- Protect the AWS root user with phishing-resistant MFA where possible, store recovery material securely, and never use root for daily work.
- Use an administrative IAM identity/role with MFA and a separate deployment role.
- Attach a least-privilege EC2 instance role only for the approved backup prefix and explicitly required monitoring actions. Do not store AWS access keys on EC2.
- GitHub deployment should use OIDC to assume a narrowly scoped AWS role if AWS APIs are needed. Restrict trust by repository, branch/environment, and audience; issue short-lived credentials.
- SSH-only deployment can avoid AWS API credentials but puts a long-lived private key and public SSH surface in the delivery path. If used initially, restrict the key, host, command, and environment and rotate it.
- Never grant deployment permission to modify IAM, networking, budgets, or unrelated resources.

## 4. Secret handling

- Vercel stores `API_BASE_URL` and the server-to-server credential as encrypted server-side environment variables.
- EC2 stores database and API secrets outside Git in files readable only by root/the runtime service. Compose references those files at runtime.
- Prefer SSM Parameter Store SecureString or Secrets Manager only after pricing and access paths are approved; Secrets Manager introduces a recurring per-secret cost.
- Rotate the database password and Route Handler credential with an overlap procedure that avoids downtime.
- Backups inherit database sensitivity: encrypt, block public access, minimize readers, log access, and test deletion/retention.

## 5. Host and container controls

- Supported minimal Linux AMI; unattended/security patch procedure with a maintenance window.
- IMDSv2 required; no instance metadata credentials exposed to containers that do not need them.
- Run application containers as non-root where image support permits; drop unnecessary capabilities and use read-only filesystems except declared writable paths.
- Pin images and scan them in CI in a later approved security step. Never use mutable `latest` tags.
- Keep Docker socket out of application containers.

## 6. Cost and security monitoring

Create one monthly AWS Budget with 50%, 80%, and 100% actual/forecast notifications to a monitored address. Budgets notifications are not instantaneous and **do not hard-stop spending**. Evaluate Cost Anomaly Detection for unexpected service or usage changes, checking notification configuration and any applicable downstream messaging cost.

Weekly during initial operation and monthly thereafter, inspect Cost Explorer/billing by service and tag; check idle Elastic IPs, unattached EBS volumes, old snapshots, S3 versions, CloudWatch log retention, and surplus CPU credits.

## 7. Teardown checklist

1. Export and verify the final backup if retention is required.
2. Stop traffic and remove Vercel production variables/integration credentials.
3. Terminate EC2.
4. Delete or deliberately retain the exact EBS volume and snapshots; retained items continue billing.
5. Release the Elastic IP/public IPv4 allocation.
6. Apply the approved S3 retention/deletion decision, including versions and incomplete multipart uploads.
7. Remove DNS records/certificates, IAM roles/policies, log groups, alarms, and schedules that are no longer needed.
8. Confirm Cost Explorer and the next invoice show no residual resources.

## 8. Decision Required

- Server-to-server credential design and rotation mechanism.
- Session Manager versus restricted SSH after endpoint/connectivity cost validation.
- Log destination and retention period.
- Backup KMS choice: S3-managed encryption or a customer-managed KMS key with added cost.

