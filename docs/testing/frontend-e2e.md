# Frontend Integration and E2E

Status: Current  
Phase: 4

## Test layers

- `pnpm check`: lint, TypeScript, unit/component/contract tests, architecture checks, production builds.
- `pnpm test:e2e:web`: Chromium browser tests against a real Next.js server. Recommendation HTTP responses are intercepted with deterministic Contract-valid fixtures.
- `pnpm test:integration`: real NestJS and PostgreSQL verification. It runs database integration tests and HTTP E2E tests against the isolated `cocktail_taste_test` database.

Mock browser E2E does not prove PostgreSQL connectivity. PostgreSQL integration tests do not replace browser behavior tests.

## Local Web and API

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Run migrations and seed the local catalog:

```bash
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

Seed records intentionally remain `is_active = false`. Production or shared database activation requires the separate dataset approval process. Integration tests use isolated copies of seed fixtures and explicitly activate them only in `cocktail_taste_test`.

Start the API on port 3001:

```powershell
$env:PORT = "3001"
pnpm --filter api start:dev
```

Configure `apps/web/.env.local`:

```dotenv
API_BASE_URL=http://localhost:3001
```

Then start Web:

```bash
pnpm --filter web dev
```

## Browser E2E

Install Chromium once:

```bash
pnpm --filter web exec playwright install chromium
```

Run the suite:

```bash
pnpm test:e2e:web
```

The Playwright server uses `http://localhost:3100`. Each test receives a separate browser context, which isolates cookies and sessionStorage. Failure traces, screenshots, and videos are written below `apps/web/test-results`; the HTML report is written below `apps/web/playwright-report`.

Covered flows:

- complete assessment and render result;
- revise an earlier answer;
- assessment and result refresh recovery;
- empty recommendations;
- API failure and explicit retry;
- restart and snapshot cleanup;
- direct result access without data;
- mobile viewport, keyboard operation, focus movement, and horizontal overflow.

## PostgreSQL integration

The test database must be named exactly `cocktail_taste_test`. The helpers reject non-local hosts and other database names before destructive cleanup.

```bash
pnpm test:integration
```

The suite applies migrations, inserts deterministic seed fixtures, confirms active-candidate filtering, exercises the real NestJS `POST /recommendations` boundary, and validates ranks and reasons with the shared runtime Contract. It also asserts that the exact request answers produce the expected Taste Profile and that each reason is supported by both the profile and the persisted cocktail data.

The local Compose database is `cocktail_taste`, while destructive test cleanup accepts only `cocktail_taste_test` on `127.0.0.1`, `localhost`, or `::1`. Tests reject any other database name or remote host. Ordinary seed execution is insert-only and rejects `is_active=true`; tests create active copies only inside the isolated test database.

## CI

The pull-request workflow performs:

1. frozen pnpm install;
2. `pnpm check`;
3. Chromium installation and Mock browser E2E;
4. PostgreSQL integration tests;
5. NestJS HTTP E2E tests;
6. Playwright report and failure artifact upload when browser tests fail.

The workflow is triggered only by `pull_request`. Local success must not be reported as GitHub Actions success; the pull request run and all job steps must complete successfully before merge.

## Phase 4 release verification

Run the following from the repository root:

```bash
pnpm check
pnpm test:e2e:web
pnpm test:integration
```

The browser fixture uses five `medium` core answers, preferred `citrus`, avoided `smoky`, and preferred base spirit `gin`. Its profile scores, Tom Collins data, and core/flavor/base-spirit reasons are consistent with the Domain transformation and reason builder. This is still a Mock browser boundary; the separate PostgreSQL and HTTP E2E suites protect the real Backend path.

## Deployment preparation

Deployment is not implemented by Phase 4. The repository currently has no production Docker image, Infrastructure as Code, selected GCP runtime, production health endpoint, or observability integration. The NestJS application uses framework logging and listens on `PORT`; the Web Route Handler reads the server-only `API_BASE_URL`. Database configuration comes from `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME` with `synchronize: false`.

Prepare deployment in these independently verifiable steps:

1. Decide the GCP topology: recommended candidates are a managed Next.js-capable runtime for Web, Cloud Run for API, and Cloud SQL for PostgreSQL. Confirm regions, cost, scaling, and whether Web can reach API privately before implementation.
2. Add reproducible production builds/containers and local smoke tests without changing application boundaries.
3. Provision an isolated staging database, private connectivity, least-privilege service accounts, backups, and Secret Manager values.
4. Add API liveness/readiness endpoints and verify database dependency behavior. Configure structured logs, error reporting, dashboards, and alerts.
5. Add a release migration job that runs committed migrations once before traffic. Keep seed and activation separate; do not automatically activate the current catalog.
6. Deploy API, configure Web's server-only `API_BASE_URL`, then deploy Web. Terminate public traffic with HTTPS. Because the browser calls the same-origin Route Handler, the API does not need broad browser CORS.
7. Run staging smoke tests against the real API/database, verify at least one separately approved active cocktail, rollback behavior, and failure visibility before production promotion.

Known release constraints:

- the default seed intentionally yields zero recommendations until catalog activation is approved;
- sessionStorage results are tab-scoped and are not durable/shareable URLs;
- Mock Playwright and real Backend/DB verification remain separate suites;
- production hosting, secrets, health checks, monitoring, backups, and migration orchestration are pending deployment work.

## Manual accessibility checklist

- Complete Q1–Q8 using only keyboard controls.
- Confirm focus moves to each new question title.
- Confirm pending submission disables navigation and submit controls.
- Confirm errors are announced and retain the selected answers.
- Confirm cocktail images have alternative text and missing images have an accessible replacement.
- Inspect the assessment and result pages at 390 px width for horizontal overflow.
