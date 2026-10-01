Status: Accepted
Version: v1
Phase: 1
Last Updated: 2026-10-01

# Recommendation Result

`RecommendationResult` is public and transport-safe. Unknown user dimensions are omitted from `UserTasteSummary.dimensions`; ranking calculations are not exposed.

```ts
type RecommendationResult = { profile: UserTasteSummary; recommendations: RecommendationItem[] };
type UserTasteSummary = { dimensions: TasteDimensionSummary[]; preferredFlavors: Flavor[]; avoidedFlavors: Flavor[]; preferredBaseSpirits: BaseSpirit[] };
type TasteDimensionSummary = { dimension: TasteDimension; score: TasteScore };
type RecommendationItem = { rank: number; cocktail: CocktailSummary; reasons: RecommendationReason[] };
type CocktailSummary = { id: CocktailId; name: string; imageUrl: string | null; dimensions: TasteDimensions; flavors: Flavor[]; baseSpirits: BaseSpirit[] };
```

## Invariants

- **RR-001:** recommendations sort by `rank ASC`.
- **RR-002:** ranks are unique.
- **RR-003:** a cocktail appears at most once.
- **RR-004:** a Flavor reason exists in both user preference and cocktail Flavor.
- **RR-005:** a BaseSpirit reason exists in both user preference and cocktail BaseSpirit.
- **RR-006:** a core reason refers to known user evidence and an existing cocktail dimension.
- **RR-007:** no internal ranking score leaks publicly.
- **RR-008:** unknown dimensions are not materialized.
- **RR-009:** same versioned inputs produce the same result.
