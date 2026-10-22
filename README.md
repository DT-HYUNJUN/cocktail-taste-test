# Cocktail Taste Test

Cocktail Taste Test is a pnpm/Turborepo workspace containing a Next.js Web application, NestJS API, shared HTTP contracts, and deterministic recommendation Domain.

## Quality gates

```bash
pnpm check
pnpm test:e2e:web
pnpm test:integration
```

The browser and PostgreSQL test layers are intentionally separate. See [Frontend Integration and E2E](docs/testing/frontend-e2e.md) for local Web/API setup, `API_BASE_URL`, database migration and seed behavior, Playwright usage, CI behavior, and known activation constraints.

## Local development

```bash
docker compose up -d postgres
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

Run the API on port 3001 and configure `apps/web/.env.local` with `API_BASE_URL=http://localhost:3001`, then run the Web application. Detailed Windows and cross-platform commands are in the testing guide.
