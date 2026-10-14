Status: Accepted  
Version: v1  
Phase: 1  
Last Updated: 2026-10-11

# Recommendation Result

## 1. Purpose

`RecommendationResult` is the public, transport-safe representation of a user's taste summary and recommended cocktails. It is derived from the accepted `UserTasteProfile`, eligible `CocktailProfile` candidates, Ranking Policy v1, and Reason Builder v1.

The public result communicates **deterministic presentation order** and **structured positive evidence**, not the internal evidence vector or semantic ranking relationships.

## 2. Public Contract

```ts
type RecommendationResult = {
  profile: UserTasteSummary;
  recommendations: RecommendationItem[];
};

type UserTasteSummary = {
  dimensions: TasteDimensionSummary[];
  preferredFlavors: Flavor[];
  avoidedFlavors: Flavor[];
  preferredBaseSpirits: BaseSpirit[];
};

type TasteDimensionSummary = {
  dimension: TasteDimension;
  score: TasteScore;
};

type RecommendationItem = {
  rank: number;
  cocktail: CocktailSummary;
  reasons: RecommendationReason[];
};

type CocktailSummary = {
  id: CocktailId;
  name: string;
  imageUrl: string | null;
  dimensions: TasteDimensions;
  flavors: Flavor[];
  baseSpirits: BaseSpirit[];
};
```

`RecommendationReason` is defined by [Reason Builder v1](reason-builder.md). `Flavor`, `BaseSpirit`, `TasteDimension`, and `TasteScore` retain their canonical domain meanings.

The contract above is the accepted v1 public shape. It does not prescribe a particular API framework, runtime validation library, persistence model, or image source.

## 3. Rank Is a Presentation Ordinal

`RecommendationItem.rank` is the **one-based presentation position** of an item in the returned recommendation list. The first displayed item has `rank: 1`, the next has `rank: 2`, and so on.

Ranking Policy v1 first constructs internal non-dominated semantic layers. Candidates within each layer receive deterministic technical presentation ordering using:

```text
1. lower exact totalCoreDistance
2. stable canonical cocktail ID
```

The public result serializes that final order into consecutive `rank` values. The internal layers and tie-breaking evidence are not serialized.

**A lower numerical `rank` does not, by itself, establish semantic dominance.** Two candidates can be semantically tied (`A = B`) or incomparable (`A ↔ B`) while still having different presentation ranks. Conversely, an accepted semantic dominance relation must not be contradicted by the final presentation ordering.

The public contract does not expose `semanticLayer`, semantic ties, incomparability, or dominance edges. Clients must not infer these relationships solely from `rank` or array position.

## 4. User Taste Summary

`UserTasteSummary.dimensions` contains only Core Dimensions explicitly known in `UserTasteProfile`.

```text
unknown Core Dimension → omitted
known score 3         → included as score 3
```

Unknown evidence must not be converted into a neutral `3`, a zero-distance match, or an inferred preference.

The three secondary preference arrays preserve the user's accepted canonical evidence:

- `preferredFlavors`
- `avoidedFlavors`
- `preferredBaseSpirits`

Empty arrays are valid. A missing preference must not be invented from cocktail ingredients, Flavor labels, or BaseSpirit labels.

## 5. Cocktail Summary

Each `CocktailSummary` identifies one recommended cocktail and includes its five complete Core Dimensions and presence-only Flavor/BaseSpirit values.

`imageUrl: null` is valid when no image is available. Image retrieval, URL sourcing, and production enrichment remain implementation concerns and must not change recommendation semantics.

The `CocktailSummary` is a public representation, not a persistence entity or a complete ingredient inventory.

## 6. Structured Recommendation Reasons

`reasons` contains only structured, actual positive evidence permitted by [Reason Builder v1](reason-builder.md).

Reason groups are ordered as Core, Flavor, then BaseSpirit, with each group occurring at most once. Within those groups, the accepted Reason Builder selection and ordering rules apply:

- Core: known dimensions with distance at most 1; select at most 2 using distance ascending, `|userScore - 3|` descending, then canonical Dimension order.
- Flavor: actual preferred Flavor matches, in canonical Flavor vocabulary order (`citrus`, `fruity`, `tropical`, `herbal`, `floral`, `creamy`, `coffee`, `spicy`, `smoky`); at most 2.
- BaseSpirit: actual preferred BaseSpirit matches, in canonical BaseSpirit vocabulary order (`gin`, `vodka`, `rum`, `tequila`, `whiskey`, `mezcal`); at most 1.

`reasons: []` is valid. Avoided Flavor collisions, ranking position, semantic layers, and technical tie-breaks are not positive reasons.

The public result does not generate user-facing explanatory prose; presentation text is a separate concern.

## 7. Public / Internal Boundary

The following remain internal to RecommendationMatch and Ranking Policy v1 and must not appear as public result fields:

```text
rankingScore
totalCoreDistance
dimensionDistance
preferredFlavorMatchCount
avoidedFlavorCollisionCount
preferredBaseSpiritMatchCount
semanticLayer
semantic dominance / tie / incomparability metadata
technical tie-break metadata
```

The public `rank` field is the **presentation ordinal only**; it is not an exception allowing internal ranking metadata to leak. A future public semantic-ranking contract would require an explicit versioned decision.

## 8. Invariants

- **RR-001 — Ordered presentation:** `recommendations` is sorted by `rank ASC` and follows Ranking Policy v1's final deterministic presentation order.
- **RR-002 — Unique consecutive ranks:** ranks are unique, one-based, and consecutive within the returned list (`1..N`); an empty recommendation list is valid if no eligible recommendations are returned.
- **RR-003 — Unique cocktail:** a cocktail ID occurs at most once in `recommendations`.
- **RR-004 — Supported Flavor reason:** every Flavor reason value occurs in both the user's `preferredFlavors` and the cocktail's `flavors`.
- **RR-005 — Supported BaseSpirit reason:** every BaseSpirit reason value occurs in both the user's `preferredBaseSpirits` and the cocktail's `baseSpirits`.
- **RR-006 — Supported Core reason:** every Core reason refers to a known user Dimension and an existing cocktail Dimension, with distance `<= 1` and Reason Builder v1 selection rules applied.
- **RR-007 — Internal boundary:** internal ranking scores, evidence counts, semantic layers, and semantic relation metadata are not exposed.
- **RR-008 — Unknown preservation:** unknown user Dimensions remain absent from `UserTasteSummary`; score `3` is never inserted as an implicit default.
- **RR-009 — Determinism:** the same versioned inputs and accepted ordering/reason policies produce the same result.
- **RR-010 — Presentation is not dominance:** rank or array position alone must not be interpreted as semantic superiority.
- **RR-011 — Reason limits and ordering:** Core, Flavor, and BaseSpirit reason groups follow Reason Builder v1's cardinality and deterministic ordering rules; `reasons: []` is valid.
- **RR-013 — Preference permutation invariance:** Reordering `preferredFlavors` or `preferredBaseSpirits` without changing their members must not change the emitted reasons or the semantic recommendation result.
- **RR-012 — Canonical vocabulary:** public Dimension, Flavor, and BaseSpirit values remain within their accepted v1 vocabularies.

## 9. Deferred Decisions

The following are outside the RecommendationResult v1 domain contract:

- Production image sourcing and enrichment.
- API framework, serialization tooling, and runtime validation library.
- Final recommendation count and dataset-specific candidate eligibility/filtering.
- User-facing explanatory copy and UI treatment of recommendations.
- Persistence, analytics, sharing, and authentication.
- Any future public contract for semantic layer or dominance metadata.

## 10. Phase 1 Decision

`RecommendationResult` v1 is a deterministic, transport-safe **presentation result**. It exposes the accepted user evidence, recommended cocktail summaries, presentation ordinals, and structured positive reasons while keeping Ranking Policy's semantic layers and intermediate evidence internal.

```text
UserTasteProfile + eligible CocktailProfiles
  → RecommendationMatch (internal)
  → Ranking Policy v1 (internal semantic layers)
  → deterministic presentation order
  → Reason Builder v1 (positive evidence)
  → RecommendationResult v1 (public)
```
