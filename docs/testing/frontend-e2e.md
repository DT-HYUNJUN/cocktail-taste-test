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

The suite applies migrations, inserts deterministic seed fixtures, confirms active-candidate filtering, exercises the real NestJS `POST /recommendations` boundary, and validates ranks and reasons with the shared runtime Contract.

## CI

The pull-request workflow performs:

1. frozen pnpm install;
2. `pnpm check`;
3. Chromium installation and Mock browser E2E;
4. PostgreSQL integration tests;
5. NestJS HTTP E2E tests;
6. Playwright report and failure artifact upload when browser tests fail.

## Manual accessibility checklist

- Complete Q1–Q8 using only keyboard controls.
- Confirm focus moves to each new question title.
- Confirm pending submission disables navigation and submit controls.
- Confirm errors are announced and retain the selected answers.
- Confirm cocktail images have alternative text and missing images have an accessible replacement.
- Inspect the assessment and result pages at 390 px width for horizontal overflow.
