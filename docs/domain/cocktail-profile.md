Status: Accepted
Version: v1
Phase: 1
Last Updated: 2026-10-01

# Cocktail Profile

`CocktailProfile` is the recommendation-domain representation of a cocktail, not a production persistence entity.

```ts
type CocktailProfile = {
  id: CocktailId;
  name: string;
  dimensions: TasteDimensions;
  flavors: Flavor[];
  baseSpirits: BaseSpirit[];
};
```

Every cocktail has all five [core taste dimensions](taste-profile.md). Flavor and BaseSpirit are presence-only secondary signals and cannot outweigh a substantial core mismatch.

## Invariants

- **CP-001 — Complete core profile:** all five dimensions have valid scores.
- **CP-002 — Stable identity:** `id` identifies the recommendation candidate.
- **CP-003 — Vocabulary validity:** Flavor and BaseSpirit values use the [canonical vocabulary](flavor-vocabulary.md).
- **CP-004 — Dataset independence:** persistence/entity shape and source are deferred.
