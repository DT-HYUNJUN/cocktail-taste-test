Status: Accepted
Version: v1
Phase: 1
Last Updated: 2026-10-01

# Flavor and BaseSpirit Vocabulary

This document is the canonical Phase 1 vocabulary source for the secondary `Flavor` and `BaseSpirit` recommendation signals. Both are separate from the five [core taste dimensions](taste-profile.md).

## Flavor Vocabulary v1

```ts
type Flavor =
  | "citrus"
  | "fruity"
  | "tropical"
  | "herbal"
  | "floral"
  | "creamy"
  | "coffee"
  | "spicy"
  | "smoky";
```

### FV-001 — Presence only

Flavor has no intensity score. A cocktail records only whether a Flavor is present or absent.

### FV-002 — Completed-drink semantics

Do not create Flavor values automatically from ingredient presence. Assign a Flavor only when it is a meaningful sensory characteristic of the completed cocktail.

### FV-003 — Core separation

`sweet`, `sour`, `bitter`, `alcoholIntensity`, and `refreshing` are core dimensions, not Flavor values.

### FV-004 — BaseSpirit separation

`gin`, `vodka`, `rum`, and other BaseSpirit values are not Flavors.

### FV-005 — Independent vocabulary

`citrus`, `fruity`, and `tropical` are independent v1 values. `tropical` does not automatically add `fruity`, and no automatic hierarchy is implied.

### FV-006 — Normalized vocabulary

Do not extend this enum with every tasting note. Normalize tasting notes to the canonical abstraction when appropriate—for example, `mint` → `herbal` and `ginger` → `spicy`. The complete tasting-note normalization table is deferred.

### FV-007 — Empty allowed

```yaml
flavors: []
preferredFlavors: []
avoidedFlavors: []
```

Empty preference arrays mean the Flavor signal is unavailable; they are not a negative match.

## BaseSpirit Vocabulary v1

```ts
type BaseSpirit =
  | "gin"
  | "vodka"
  | "rum"
  | "tequila"
  | "whiskey"
  | "mezcal";
```

These six values are the canonical known Phase 1 values.

### BS-001 — Presence based

Cocktails may contain one or more `BaseSpirit` values, and a user may prefer one or more:

```ts
baseSpirits: BaseSpirit[];
preferredBaseSpirits: BaseSpirit[];
```

### BS-002 — Recommendation signal

BaseSpirit is a recommendation preference signal, not an ingredient inventory.

### BS-003 — Whiskey normalization

At the recommendation vocabulary level, Bourbon, Rye Whiskey, and Scotch may be normalized to `whiskey` when appropriate. This does not remove or redefine an ingredient vocabulary.

### BS-004 — Tequila / Mezcal separation

`tequila` and `mezcal` remain separate BaseSpirit values.

### BS-005 — Flavor / Base separation

`mezcal` preference and `smoky` Flavor preference are independent signals. Neither is automatically inferred from the other.

### BS-006 — Liqueur exclusion

Liqueurs and aperitivos are not automatically BaseSpirit values merely because they are alcoholic ingredients. This includes Triple Sec, Campari, Aperol, Amaretto, and Coffee Liqueur.

## Documentation Gap

Phase 1 records indicate a seventh BaseSpirit value existed, but its value cannot be reliably recovered from this repository. Do not infer or add `brandy`, `cognac`, `other`, or another replacement. The seventh value remains a documentation gap.

## Deferred Decisions

- The missing seventh BaseSpirit value
- Complete ingredient → BaseSpirit normalization
- Complete tasting-note → Flavor normalization
- Production cocktail dataset and persistence representation
