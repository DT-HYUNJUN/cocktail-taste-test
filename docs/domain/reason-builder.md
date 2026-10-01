Status: Accepted
Version: v1
Phase: 1
Last Updated: 2026-10-01

# Reason Builder

The Reason Builder selects actual positive evidence from an already ranked candidate. It does not decide recommendations, alter ranking order, or generate user-facing prose.

```ts
type RecommendationReason = CoreMatchReason | FlavorMatchReason | BaseSpiritMatchReason;
type CoreMatchReason = { type: "core-match"; dimensions: TasteDimension[] };
type FlavorMatchReason = { type: "flavor-match"; flavors: Flavor[] };
type BaseSpiritMatchReason = { type: "base-spirit-match"; baseSpirits: BaseSpirit[] };
```

Core candidates use known dimensions and `dimensionDistance <= 1`, ordered by distance ascending, distinctiveness (`|userScore - 3|`) descending, then: `sweet`, `sour`, `bitter`, `alcoholIntensity`, `refreshing`; include at most two. Flavor candidates are actual preferred matches in user-preference order (at most two). BaseSpirit candidates are actual preferred matches in user-preference order (at most one). Groups are core, Flavor, BaseSpirit and each occurs at most once. `reasons: []` is valid. Avoid collisions are not v1 reasons.

## Invariants

**RB-001** positive evidence only; **RB-002** no fabricated evidence; **RB-003** known core only; **RB-004** core threshold; **RB-005** core limit 2; **RB-006** Flavor limit 2; **RB-007** BaseSpirit limit 1; **RB-008** stable order; **RB-009** empty allowed; **RB-010** ranking independence; **RB-011** avoid separation; **RB-012** presentation independence.
