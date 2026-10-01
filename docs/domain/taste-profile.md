Status: Accepted
Version: v1
Phase: 1
Last Updated: 2026-10-01

# Taste Profile

## Core taste model

```ts
type TasteScore = 1 | 2 | 3 | 4 | 5;
type TasteDimension = "sweet" | "sour" | "bitter" | "alcoholIntensity" | "refreshing";
type TasteDimensions = {
  sweet: TasteScore; sour: TasteScore; bitter: TasteScore;
  alcoholIntensity: TasteScore; refreshing: TasteScore;
};
```

`3` is valid but is never an implicit default for unknown preference.

## UserTasteProfile v1

```ts
type UserTasteProfile = {
  dimensions: Partial<TasteDimensions>;
  preferredFlavors: Flavor[];
  avoidedFlavors: Flavor[];
  preferredBaseSpirits: BaseSpirit[];
};
```

The profile deliberately permits partial evidence. A missing dimension is unknown and must not be materialized as `3`.

## Invariants

- **TP-001 — Known dimensions:** only these five dimensions occur.
- **TP-002 — Valid score:** every supplied score is a `TasteScore`.
- **TP-003 — Partial preservation:** absent evidence remains absent.
- **TP-004 — Determinism:** identical assessment answers and versions produce the same profile.
- **TP-005 — Evidence only:** each profile value/preference is traceable to assessment evidence.

See [Flavor Vocabulary](flavor-vocabulary.md) for `Flavor` and `BaseSpirit` semantics.
