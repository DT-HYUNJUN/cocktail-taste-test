Status: Proposed
Version: v1
Phase: 3 / P3-03
Date: 2026-10-14

# Cocktail Dataset v1 — Design Proposal

## 1. Purpose and scope
Define the initial production cocktail catalog, its provenance, calibration, validation, and seed workflow. This document does not change Phase 1 canonical vocabulary, Phase 2 domain policy, or fixed Golden fixtures. No production ratings are approved by this proposal alone.

## 2. Dataset approach
- Start with a **reviewable pilot of 12 cocktail identities**, corresponding to the names used by the canonical Golden fixtures: Mojito, Tom Collins, Negroni, Margarita, Mezcal Margarita, Piña Colada, Tequila Sunrise, Espresso Martini, Old Fashioned, Manhattan, Dry Martini, Americano.
- The list is a **candidate catalog**, not approved production data. Confirm recipes, variants, legal image usage, and ratings individually.
- Use the existing `cocktails` single-table schema from P3-02 as the intended storage target; verify the actual database document before implementation.
- A future dataset can expand only after the pilot passes coverage and review checks.

## 3. Golden fixture isolation
Golden fixture scores are regression inputs, **not automatically production ratings**. Production profiles must be calibrated independently, not copied to make expected rankings pass. Do not modify Golden fixtures to fit the production dataset. Keep test fixtures and production seed files in different directories.

## 4. Source and provenance policy
For each candidate, maintain an authoring record (separate from the domain profile):
- stable cocktail ID and display name
- recipe/variant identity and preparation assumptions
- ingredient and method references, URLs, access date, attribution/license if applicable
- reviewer, review date, review status and calibration notes
- image source and permission status, or null
Use reputable recipe references, but no specific external source has been verified for this proposal. Do not invent a source or claim authoritative numeric taste scores.

## 5. Profile calibration rubric
Five core dimensions: sweet, sour, bitter, alcoholIntensity, refreshing; integer score 1..5. Assess the *completed drink*, using the selected recipe/serving style. Document sensory justification for each score. `alcoholIntensity` describes perceived alcohol presence, not ABV. Score 3 means moderate, not unknown. All five scores are required for production cocktails.

Flavor is presence-only from: citrus, fruity, tropical, herbal, floral, creamy, coffee, spicy, smoky. Assign only salient completed-drink sensory traits; ingredient presence alone is insufficient. No flavor intensity or implied hierarchy. Empty list is valid.

BaseSpirit is presence-only from: gin, vodka, rum, tequila, whiskey, mezcal. Spirits are not inferred from flavors; liqueurs/aperitivos do not automatically count. Empty list is valid (e.g. Americano fixture has no canonical BaseSpirit). The unresolved seventh BaseSpirit remains deferred; do not invent a substitute.

## 6. Review and acceptance
- Two-pass review recommended: author proposes a profile with evidence; reviewer confirms each of five scores and all secondary tags. For solo development, use separate author/review sessions and retain rationale.
- Review disagreements are resolved against source recipe and sensory rubric; record the resolution.
- Do not activate (`is_active=true`) records with incomplete review, missing dimensions, unsupported tags, duplicate IDs, or missing source identity.
- Every active row must map to a valid `CocktailProfile` and yield deterministic recommendations for a fixed dataset snapshot.
- Candidate coverage should include all six BaseSpirit tags where sensible, flavor variety, low/high examples on each core dimension, and legitimate empty BaseSpirit arrays; coverage is a goal, not permission to fabricate tags.

## 7. Storage and seed workflow
- **Migration** owns schema and constraints, not mutable catalog content.
- **Seed** owns idempotent, versioned catalog records; use stable IDs and explicit upsert policy. Keep destructive deletions out of ordinary seed runs; deactivation is deliberate.
- Preserve `created_at` for existing rows and update `updated_at` when content changes.
- Reject unknown tags, duplicates, null scores, scores outside 1..5, and malformed arrays before writing; DB constraints provide defense in depth.
- Map DB entity to Domain profile with runtime validation before recommendation execution. Handle missing/invalid production data as a data-integrity error, not as an inferred neutral score.
- Store image URL separately; nullable URL does not affect ranking.

## 8. Candidate selection and recommendation count
Not decided by this document. The Domain `buildRecommendationResult` receives an *already eligible* set and does not filter or truncate it. Define candidate eligibility, active filtering, and result limit explicitly before implementing the endpoint. Database query order must not change deterministic domain output.

## 9. Proposed implementation layout
```text
apps/api/src/modules/cocktail/
  cocktail.entity.ts
  cocktail.mapper.ts
  cocktail.repository.ts
apps/api/src/database/
  migrations/
  seeds/
    cocktail-catalog.v1.ts
    cocktail-catalog.validation.ts
    cocktail-catalog.provenance.md
```
File names are proposals; align with accepted backend/database docs during implementation.

## 10. Tests and quality gate
1. Seed schema/vocabulary/score validation, including invalid-input rejection.
2. Stable ID uniqueness and idempotent re-seeding.
3. Entity-to-Domain mapping, including rejection of corrupted database rows.
4. Active candidate selection, deterministic ordering independent of DB return order.
5. Integration test with an isolated test DB when infrastructure is available.
6. Fixed Golden tests remain independent and unchanged.

## 11. Deferred decisions
- Actual approved production ratings and source verification.
- Final recipe variants, catalog size beyond pilot, image licensing.
- Eligibility/filtering rules and number of results returned.
- Database infrastructure and migration/seed execution environment.

## 12. Acceptance criteria for P3-03 design
- [ ] Confirm initial catalog candidates and variant policy.
- [ ] Approve score/tag rubric and evidence review policy.
- [ ] Approve seed/migration separation and Golden isolation.
- [ ] Resolve active-candidate selection and result-limit policy before API implementation.
- [ ] Review compatibility with the actual committed P3-02 schema.

Decision requested: approve this proposal as the basis for collecting independently reviewed production profiles, without treating Golden fixture scores as production truth.
