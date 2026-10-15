Status: Accepted
Version: v1
Phase: 3 / P3-02
Last Updated: 2026-10-15

# Database Design — Cocktail Catalog v1

## 1. Scope and source of truth

Design the PostgreSQL persistence model for the cocktail catalog used by `POST /recommendations`. This is an **accepted v1 design**, not a migration or implemented schema. Phase 2 `CocktailProfile` is the recommendation-domain contract; database rows are not domain objects.

In scope: cocktail identity, display metadata, five core scores, canonical flavor/base-spirit signals, active status, migration/validation strategy, repository mapping. Out of scope: user accounts, saving assessment submissions, ingredients/recipes, ratings, and analytics. Candidate eligibility is `is_active = true` after provenance/profile review; the application returns up to five results after Domain ranking, never by SQL `LIMIT 5`.

## 2. Decision DB-001: one table with native arrays

Use one `cocktails` table with five `SMALLINT` columns and `TEXT[]` columns for flavors and base spirits. These are presence-only sets, not weighted intensities. Avoid premature join tables and JSONB for the stable v1 profile. Revisit if richer ingredient relationships or DB-side multi-dimensional queries become necessary.

| Column | PostgreSQL type | Null | Purpose |
| --- | --- | --- | --- |
| `id` | `TEXT` | NO | Stable canonical cocktail ID; source-independent string |
| `name` | `TEXT` | NO | Display name |
| `image_url` | `TEXT` | YES | Optional presentation image, not part of `CocktailProfile` |
| `sweet` | `SMALLINT` | NO | Core score 1–5 |
| `sour` | `SMALLINT` | NO | Core score 1–5 |
| `bitter` | `SMALLINT` | NO | Core score 1–5 |
| `alcohol_intensity` | `SMALLINT` | NO | Perceived alcohol presence, **not** ABV |
| `refreshing` | `SMALLINT` | NO | Core score 1–5 |
| `flavors` | `TEXT[]` | NO | Unique canonical flavors; default empty array |
| `base_spirits` | `TEXT[]` | NO | Unique canonical base spirits; default empty array |
| `is_active` | `BOOLEAN` | NO | Catalog availability flag; default false (requires explicit approval to activate) |
| `created_at` | `TIMESTAMPTZ` | NO | Persistence metadata |
| `updated_at` | `TIMESTAMPTZ` | NO | Persistence metadata |

Do not use a generated UUID as the domain ID until source/identity policy is decided. IDs must remain stable across data imports. `image_url`, timestamps and `is_active` are persistence/presentation fields and do not change recommendation semantics.

## 3. Constraints DB-002

- Primary key on `id`; nonempty trimmed `id` and `name`.
- Each core score is within `[1,5]` using `CHECK` constraints.
- `flavors` and `base_spirits` are non-null arrays with no null elements, duplicate values or unknown vocabulary members.
- Allowed flavors: `citrus, fruity, tropical, herbal, floral, creamy, coffee, spicy, smoky`.
- Allowed spirits: `gin, vodka, rum, tequila, whiskey, mezcal`.
- Keep vocabulary definitions in the Domain package as the application authority; DB constraints must be kept in sync by reviewed migrations. A PostgreSQL helper function or carefully validated seed/import pipeline may enforce array set rules; **do not claim a plain `CHECK` with `unnest()` works**, as PostgreSQL does not allow set-returning expressions/subqueries directly in `CHECK` expressions.
- Database integrity is necessary but insufficient: the API mapper must validate untrusted row data at runtime before calling Domain.

Example of score constraints (illustrative only):

```sql
CONSTRAINT cocktails_sweet_range CHECK (sweet BETWEEN 1 AND 5),
CONSTRAINT cocktails_sour_range CHECK (sour BETWEEN 1 AND 5),
CONSTRAINT cocktails_bitter_range CHECK (bitter BETWEEN 1 AND 5),
CONSTRAINT cocktails_alcohol_intensity_range CHECK (alcohol_intensity BETWEEN 1 AND 5),
CONSTRAINT cocktails_refreshing_range CHECK (refreshing BETWEEN 1 AND 5)
```

## 4. Domain mapping DB-003

`CocktailEntity` (TypeORM, in `apps/api`) → validated mapper → `CocktailProfile` (in `packages/domain`). Map snake_case columns to camelCase fields. Explicitly construct the five-dimensional object, reject missing/out-of-range scores, invalid vocabularies, duplicates, malformed IDs/names. Preserve canonical arrays as sets and normalize their order to the accepted vocabulary order for deterministic output. Never invent default score `3` for missing DB data.

```ts
const profile: CocktailProfile = {
  id: row.id,
  name: row.name,
  dimensions: {
    sweet: row.sweet,
    sour: row.sour,
    bitter: row.bitter,
    alcoholIntensity: row.alcoholIntensity,
    refreshing: row.refreshing,
  },
  flavors: validatedFlavors,
  baseSpirits: validatedBaseSpirits,
};
```

The snippet is conceptual; `row` is validated first and its numeric values must be narrowed to `TasteScore` before assignment. `image_url` is passed separately as `imageUrlsByCocktailId` to `buildRecommendationResult`, not added to `CocktailProfile`.

## 5. Repository boundary DB-004

Application Service depends on a `CocktailCatalogReader` interface/DI token; TypeORM implementation stays inside `apps/api`. Repository retrieves candidate rows and converts them to validated domain profiles plus display metadata. Do not import TypeORM from `packages/domain` or `packages/contracts`.

Repository result: `{ cocktails: CocktailProfile[]; imageUrlsByCocktailId: Partial<Record<CocktailId, string | null>> }`, matching the P3-01 `CocktailReader` port. The caller passes **all eligible** profiles into `buildRecommendationResult`. The reader filters `is_active = true` but must not apply a five-row limit. Only reviewed/approved records may be activated via the dataset workflow; `is_active` is an availability flag, not a stored review-status field. The application service takes up to five recommendations only **after** Domain has ranked the complete eligible set. Domain presentation order must not be misrepresented as absolute semantic superiority among incomparable candidates.

## 6. Migrations and seed strategy DB-005

- TypeORM migrations are reviewed, committed and run explicitly; `synchronize: false` in all shared/production environments.
- Initial migration creates `cocktails` with PK, nullability, `is_active DEFAULT false`, range checks, and appropriate array integrity enforcement.
- Import/seed is idempotent by stable cocktail ID, detects duplicates and rejects invalid records rather than coercing them.
- Changes to canonical vocabularies require coordinated Domain changes, DB migration/validation, and golden/integration tests.
- No index beyond PK is required by this design alone. Add indexes only after actual candidate queries are defined and measured.
- Database connection secrets are provided via environment variables and are never committed.

## 7. Error and transaction policy DB-006

- Malformed assessment JSON → `400` via `AssessmentValidationError` mapping in API.
- Corrupt catalog row or DB failure → internal server error with structured logs; do not expose raw SQL, credentials, or row internals.
- Recommendation reads are read-only; no transaction is needed merely to coordinate in-memory domain calculations. Reconsider consistency if later requirements involve multi-query snapshots.
- A valid empty candidate set can produce an empty recommendation list; do not fabricate results.

## 8. Validation and test plan DB-007

1. Migration test: create schema on disposable PostgreSQL and verify constraints.
2. Mapper unit tests: valid row; each invalid core score; unknown/duplicate flavors and spirits; null/malformed identity; missing image.
3. Repository integration tests: retrieve only active/approved fixtures, exclude inactive rows, prevent duplicate IDs, and verify stable mapping without pre-ranking SQL `LIMIT 5`.
4. API integration: valid eight-answer submission, malformed input `400`, DB/row failures as server errors, deterministic recommendation response.
5. Quality gate: existing 102 tests and Domain architecture constraints remain passing; add tests without rewriting ranking logic.

## 9. Deferred decisions / review questions

- **P3-03 production data:** catalog source and stable ID namespace, independently approved taste scores, seed fixtures and image rights. Candidate eligibility (`is_active = true` after review) and five-result post-ranking limit are accepted.
- **P3-02 implementation:** exact TypeORM column decorators and safe array-integrity SQL function/migration approach.
- Future: ingredients, localized names, external source IDs, admin edits, historical versioning, richer relations.

## 10. Acceptance checklist

- [x] Agree on single-table model and stable source-independent string ID policy; specific production IDs remain to be assigned.
- [x] Confirm score/array constraints and canonical vocabulary strategy.
- [x] Confirm entity-to-domain validation and repository boundary.
- [x] Confirm migrations, seeds and tests.
- [x] Mark this document `Accepted v1`; schema/migrations remain a separate implementation step.
