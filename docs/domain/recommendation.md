Status: Accepted
Version: v1
Phase: 1
Last Updated: 2026-10-01

# Recommendation

## RecommendationMatch v1

`RecommendationMatch` is an internal domain model containing evidence between one `UserTasteProfile` and one `CocktailProfile`; it is not a public API contract.

It distinguishes core dimension distance, preferred Flavor matches, avoided Flavor collisions, and preferred BaseSpirit matches. Core comparison uses known user dimensions only:

```text
dimensionDistance = |userScore - cocktailScore|
```

Unknown user dimensions are excluded, not neutral or zero matches.

## Ranking Policy v1

Core taste match takes priority over Flavor/BaseSpirit secondary signals. Secondary preference must not overtake a substantial core mismatch. Ranking must deterministically handle core comparisons, partial profiles, preferred/avoided Flavor, BaseSpirit, secondary caps, unavailable signals, zero matches, and ties. Stable technical ties are not semantic superiority.

The formula, normalization, caps, adjustment values, and dataset-specific candidate filtering are deferred: no accepted Phase 1 definition exists in this repository, so this consolidation does not invent constants.

`rankingScore`, `averageDistance`, `coreSimilarity`, `flavorAdjustment`, `baseAdjustment`, and `secondaryAdjustment` are internal and must not leak through `RecommendationResult`.

## Invariants

- **REC-001 — Determinism:** same versioned profile, dataset, and policy yield the same result.
- **REC-002 — Core priority:** secondary signals cannot dominate material core mismatch.
- **REC-003 — Partial comparison:** unknown dimensions are excluded.
- **REC-004 — Explainability:** reasons derive from actual positive match evidence.
- **REC-005 — Boundary:** calculation evidence is not a transport contract.
