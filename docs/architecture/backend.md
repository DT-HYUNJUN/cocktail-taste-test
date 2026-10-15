Status: Accepted
Version: v1
Phase: 3 / P3-01
Last Updated: 2026-10-15

# Backend Architecture — P3-01

## 1. Purpose and scope

The MVP exposes one synchronous recommendation use case through `POST /recommendations`. The backend accepts a complete eight-question Assessment, transforms it into a `UserTasteProfile`, obtains eligible cocktail candidates, and returns the existing `RecommendationResult` v1. Assessment responses are not persisted.

This document establishes architectural boundaries. P3-02 defines the database schema and P3-03 defines dataset approval. The agreed MVP policy is to consider only active, reviewed catalog records and return at most five recommendations after full Domain ranking. Deployment topology remains deferred.

## 2. Existing implementation baseline

- `apps/api` is a NestJS 11 scaffold (`AppModule`, `AppController`, `AppService`), with no feature modules or TypeORM dependency yet.
- `packages/contracts/src/index.ts` currently exports nothing.
- `packages/domain` exports `transformAssessmentAnswers(input: unknown): UserTasteProfile`, `validateAssessmentAnswers`, `AssessmentValidationError`, and `buildRecommendationResult(user, eligibleCocktails, options?): RecommendationResult`.
- `buildRecommendationResult` already composes recommendation matching, ranking, and reasons. It does **not** filter or truncate candidate lists and rejects duplicate cocktail IDs.
- The accepted `RecommendationResult` v1 contains a taste summary, ranked cocktail summaries, and structured reasons. Internal ranking evidence is not public.

## 3. Decisions

| ID | Decision |
|---|---|
| BA-001 | `packages/domain` remains pure TypeScript and does not depend on NestJS, TypeORM, `pg`, or application code. |
| BA-002 | `POST /recommendations` is the only Assessment/recommendation endpoint for MVP; no separate Assessment controller. |
| BA-003 | Controller owns HTTP parsing and response/error translation; application service orchestrates the use case. |
| BA-004 | Application service depends on a `CocktailReader` port, not on a TypeORM repository directly. |
| BA-005 | Persistence entities and domain `CocktailProfile` are separate; mapping and runtime validation happen at the infrastructure boundary. |
| BA-006 | The response preserves `RecommendationResult` v1, including presentation ranks and positive reasons, without exposing internal ranking metadata. |
| BA-007 | Identical assessment and identical eligible candidate snapshot produce the same recommendation result regardless of database row order. |
| BA-008 | Assessment submissions are not stored in MVP. |
| BA-009 | Only approved catalog entries with `is_active = true` are eligible. Approval is managed in seed/provenance review, not inferred from an `is_active` flag alone. |
| BA-010 | Evaluate and rank all eligible candidates through Domain, then return the first five presentation-ordered recommendations. Never apply SQL `LIMIT 5` before ranking. |

## 4. Dependency direction

```text
apps/web (Next.js)
    |
    | HTTP + transport contracts
    v
apps/api (NestJS)
    |  RecommendationController
    v
    RecommendationService (application use case)
       |                         |
       | uses                    | depends on port
       v                         v
packages/domain            CocktailReader interface
                                  ^
                                  | implements
                           TypeOrmCocktailReader
                                  |
                                  v
                           PostgreSQL / TypeORM

packages/contracts: framework-neutral transport types shared by web and API
```

Neither `packages/domain` nor `packages/contracts` imports `apps/api`, NestJS, or persistence packages. The application service may import Domain types and functions. The TypeORM adapter may import Domain types for its mapper; Domain must never import the adapter.

## 5. Proposed module and file layout

```text
apps/api/src/
  app.module.ts
  main.ts
  modules/
    recommendation/
      recommendation.module.ts
      recommendation.controller.ts
      recommendation.service.ts
      ports/cocktail-reader.port.ts
    cocktail/
      cocktail.module.ts
      infrastructure/typeorm-cocktail.reader.ts
      infrastructure/cocktail.entity.ts
      infrastructure/cocktail.mapper.ts
  database/
    database.module.ts
    migrations/
packages/
  domain/             # existing pure logic
  contracts/          # transport-safe request/response types (Phase 3)
```

The file names are proposed, not yet implemented. The `CocktailReader` token is bound to the TypeORM adapter in NestJS DI. The recommendation module imports the cocktail persistence module; the persistence module does not import recommendation business logic.

## 6. API contract (proposed)

**Endpoint:** `POST /recommendations`

**Request JSON:** `{ "answers": AssessmentAnswer[] }`, where `answers` contains exactly one answer for each of the eight canonical question IDs. This envelope is a Phase 3 HTTP design decision; Domain itself accepts the answer array directly.

**Success:** `200 OK` with `RecommendationResult` v1. An empty `recommendations` array is valid if no eligible candidates exist. No semantic layer, total distance, or matching counts are exposed.

**Invalid request:** `400 Bad Request` for malformed JSON, missing/wrong-shaped `answers`, or `AssessmentValidationError` from Domain. Define a consistent transport error envelope without leaking implementation details.

**Infrastructure failure:** `500 Internal Server Error` for unexpected DB failures or invalid persisted candidate data; log internally and do not expose stack traces. A later task may refine availability/error categories.

The HTTP transport type can be declared in `packages/contracts` using a type-only import from Domain or structurally equivalent framework-neutral types, subject to the existing architecture rules. Runtime validation must still happen in the API; TypeScript types alone are insufficient.

## 7. Use case sequence

1. `RecommendationController` receives JSON and extracts `answers`.
2. `RecommendationService` calls `transformAssessmentAnswers(answers)`; the function performs canonical runtime validation. Translate `AssessmentValidationError` to HTTP 400 at the API boundary.
3. `RecommendationService` requests eligible candidate records from `CocktailReader`. Eligibility is restricted to active catalog rows that have passed the dataset approval workflow; the repository must not invent domain ranking rules.
4. The infrastructure adapter maps persisted rows to `CocktailProfile`, validates all required canonical values and five core dimensions, rejects duplicate IDs, and supplies image URLs separately when available.
5. `RecommendationService` calls `buildRecommendationResult(profile, eligibleCocktails, { imageUrlsByCocktailId })`. This function already handles matching, ranking, and reason generation; do not reimplement those algorithms in NestJS.
6. Application service takes the first five entries of the fully ranked `recommendations` array; fewer than five candidates produce fewer results, and no candidates produce an empty array. Preserve original one-based presentation ranks. These ranks represent deterministic display order, not absolute semantic superiority among incomparable candidates.
7. Controller returns the resulting `RecommendationResult` as JSON.

The operation is read-only; no transaction is required solely to persist an Assessment, because none is stored. If candidate data consistency across multiple reads becomes relevant, choose a read-consistency strategy in the database design.

## 8. Port and adapter design

Conceptual interface (not executable implementation):

```ts
interface CocktailReader {
  findEligibleCandidates(): Promise<{
    cocktails: CocktailProfile[];
    imageUrlsByCocktailId: Partial<Record<CocktailId, string | null>>;
  }>;
}
```

The adapter queries `is_active = true` rows; only reviewed/approved catalog entries may be activated by the dataset workflow. The port returns all eligible profiles (not a DB-limited top five). Avoid coupling the service to TypeORM-specific `Repository<Entity>` or leaking database entities outside the adapter. Ensure image metadata does not influence recommendation semantics.

## 9. Validation and error ownership

- API boundary: validate top-level request envelope and translate exceptions into stable HTTP errors.
- Domain: validate all eight Assessment answers, unique IDs, canonical selections, cardinality, preferred/avoided conflict, and unknown core dimensions.
- Persistence adapter: validate stored cocktail data at runtime before constructing Domain profiles; do not fill missing core scores with defaults.
- Application service: orchestration and explicit post-ranking presentation limit of five; no duplicate ranking formulas or pre-ranking truncation.

## 10. Testing and quality gates

- Controller: valid request -> 200; malformed envelope/domain validation error -> 400; infrastructure failure -> sanitized server error.
- Presentation limit: 0, 1–4, 5, and more than 5 eligible candidates; verify limiting happens only after full ranking and display order is stable.
- Service: mock `CocktailReader`; verify Domain composition, zero-candidate response, duplicate ID handling, and independence from database row order.
- Mapper: invalid/missing core dimensions, unknown vocabulary, duplicate IDs, and null image handling.
- Integration: API + PostgreSQL fixture dataset (after P3-02/03), with deterministic expected result.
- Architecture: forbid Domain dependencies on framework/database packages and application imports; retain existing Contracts restrictions.
- CI: `pnpm check` and frozen lockfile install on pull requests.

## 11. Deferred decisions

1. P3-02: PostgreSQL schema, TypeORM entities, migrations, connection configuration, and persistence validation strategy.
2. P3-03: actual independently reviewed production profiles, recipe variants, and image source. Eligibility and five-result policy are accepted in this design.
3. P3-04/05: implementation of request contracts, controller, service, adapters, and runtime exception mapping.
4. P3-06/07: DB-backed integration tests, architecture enforcement extensions, and CI verification.
5. Authentication, persistence of answers, analytics, sharing, and rate limiting are not part of this initial MVP architecture decision.

## 12. P3-01 acceptance criteria

- [x] Single `POST /recommendations` API direction agreed.
- [x] Controller / application / repository / Domain responsibilities documented.
- [x] Dependency direction and framework independence documented.
- [x] Domain `Assessment` and `RecommendationResult` v1 contracts preserved.
- [x] Error boundaries and test plan documented.
- [x] Review and accept this document as `Status: Accepted` / `Version: v1`.
- [x] Confirm active/approved candidate eligibility and post-ranking five-result limit.
