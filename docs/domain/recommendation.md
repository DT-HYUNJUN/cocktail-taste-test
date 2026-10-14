Status: Accepted  
Version: v1  
Phase: 1  
Last Updated: 2026-10-03

# Recommendation

## RecommendationMatch v1

`RecommendationMatch` is an internal domain model containing recommendation evidence between one `UserTasteProfile` and one `CocktailProfile`.

It is not a public API contract.

The model preserves Core and secondary evidence separately rather than collapsing heterogeneous evidence into a single weighted score.

### Core Evidence

For every Core Dimension known in the user profile:

```text
dimensionDistance = |userScore - cocktailScore|
```

Total Core distance is:

```text
totalCoreDistance =
  sum of dimensionDistance across known user dimensions
```

Unknown user dimensions are excluded from the calculation. They are not treated as neutral `3`, zero-distance matches, or inferred preferences.

### Secondary Evidence

Secondary evidence is preserved independently as:

```text
preferredFlavorMatches
avoidedFlavorCollisions
preferredBaseSpiritMatches
```

Flavor and BaseSpirit remain distinct signals.

Preferred Flavor matches represent positive Flavor evidence.

Avoided Flavor collisions represent explicit negative Flavor evidence and are not merely negative preferred-Flavor matches.

Preferred BaseSpirit matches represent BaseSpirit preference evidence.

No Flavor intensity is inferred.

## Ranking Policy v1

Ranking Policy v1 uses semantic dominance rather than a weighted scalar ranking score.

The policy intentionally does not define:

```text
rankingScore
coreSimilarity
secondaryScore
flavorWeight
avoidanceWeight
baseSpiritWeight
secondaryAdjustment
secondaryCap
normalization constants
```

These values are not deferred tuning parameters for v1. They are intentionally absent from the v1 ranking model.

### Close-Core Boundary

The v1 close-Core boundary is:

```text
MAX_CLOSE_CORE_DISTANCE_GAP = 1
```

For two candidates:

```text
coreGap =
  |candidateA.totalCoreDistance
   - candidateB.totalCoreDistance|
```

A total Core-distance difference of at most one TasteScore distance step is considered close-Core.

This boundary reflects the minimum discrete difference available in the accepted `TasteScore = 1 | 2 | 3 | 4 | 5` scale.

### Material Core Dominance

When:

```text
coreGap > 1
```

the candidate with the lower `totalCoreDistance` has a material Core advantage and semantically dominates the other candidate.

Secondary evidence cannot overturn or block material Core dominance.

This rule enforces the Phase 1 principle that Core taste match outranks secondary preference signals.

### Close-Core Comparison

When:

```text
coreGap <= 1
```

the candidates are compared across the complete applicable evidence vector:

```text
lower totalCoreDistance
more preferredFlavorMatches
fewer avoidedFlavorCollisions
more preferredBaseSpiritMatches
```

No numeric exchange rate or weight is assigned between these evidence categories.

### Semantic Dominance

For close-Core candidates, candidate A semantically dominates candidate B when A is:

```text
not worse in every applicable evidence category
and
better in at least one applicable evidence category
```

This is a Pareto-style evidence comparison.

### Semantic Tie

Two candidates are semantically tied when all applicable ranking evidence is identical.

A semantic tie means that Ranking Policy v1 contains no evidence that makes either candidate superior to the other.

### Semantic Incomparability

Two candidates are semantically incomparable when different applicable evidence categories favor different candidates and neither candidate semantically dominates the other.

For example:

```text
Candidate A
- better Core distance

Candidate B
- more preferred Flavor matches
```

when the Core difference remains inside the close-Core boundary.

Ranking Policy v1 does not invent an exchange rate between these conflicting signals in order to force a semantic winner.

Semantic incomparability is distinct from a semantic tie.

## Semantic Ranking Layers

Recommendation candidates are partitioned into successive non-dominated semantic layers.

The first layer contains candidates that are not semantically dominated by another remaining candidate.

After removing that layer, the same rule is applied to the remaining candidates to construct the next layer.

Conceptually:

```text
Layer 1
  non-dominated candidates

Layer 2
  non-dominated candidates after Layer 1 removal

Layer 3
  ...
```

Candidates in the same semantic layer are not necessarily semantically tied. They may be incomparable.

Semantic ranking relations must not be implemented directly as an `Array.sort()` comparator because semantic incomparability is not equivalent to comparator equality.

## Presentation Ordering

A deterministic technical order is required when multiple candidates occur within the same semantic layer.

Ranking Policy v1 uses:

```text
1. lower exact totalCoreDistance
2. stable canonical cocktail ID
```

as the presentation ordering within a semantic layer.

Presentation ordering is technical only.

It must not be interpreted as semantic superiority.

Therefore:

```text
earlier presentation position
!=
better semantic recommendation evidence
```

Stable technical ordering exists only to produce deterministic results.

## Public Boundary

`RecommendationMatch`, Core distances, evidence counts, semantic dominance relations, semantic layers, and technical ordering metadata are internal ranking concerns.

They must not leak through `RecommendationResult`.

In particular, public recommendation results do not expose:

```text
rankingScore
totalCoreDistance
dimensionDistance
preferredFlavorMatchCount
avoidedFlavorCollisionCount
preferredBaseSpiritMatchCount
semanticLayer
```

unless a future explicitly versioned public contract introduces such information.

## Reason Builder Boundary

Reason Builder operates independently from presentation ordering.

Reasons must derive from actual positive recommendation evidence defined by the Reason Builder contract.

A candidate's semantic layer, technical position, or hidden ranking mechanics are not themselves valid recommendation reasons.

Structured positive-only reasons remain independent of ranking calculations.

## Candidate Filtering

Dataset-specific candidate eligibility and filtering are outside Ranking Policy v1.

Ranking Policy assumes that it receives an eligible candidate set and ranks that set according to the rules defined here.

Candidate filtering may be specified separately without changing the semantic meaning of Ranking Policy v1.

## Invariants

- **REC-001 — Determinism:** The same versioned user profile, cocktail profiles, eligible dataset, and ranking policy produce the same semantic layers and presentation order.
- **REC-002 — Core priority:** A total Core-distance advantage greater than one cannot be overturned or blocked by secondary evidence.
- **REC-003 — Partial comparison:** Unknown user Core Dimensions are excluded from Core distance calculation.
- **REC-004 — Evidence preservation:** Core, preferred Flavor, avoided Flavor, and preferred BaseSpirit evidence remain distinct.
- **REC-005 — No scalar ranking:** Ranking Policy v1 does not collapse heterogeneous evidence into a weighted scalar ranking score.
- **REC-006 — Close-Core boundary:** A total Core-distance gap of at most one is close-Core.
- **REC-007 — Semantic dominance:** Close-Core candidates use Pareto-style evidence dominance.
- **REC-008 — Semantic tie:** Identical applicable ranking evidence produces a semantic tie.
- **REC-009 — Semantic incomparability:** Conflicting applicable evidence without dominance produces semantic incomparability.
- **REC-010 — Layered ranking:** Candidates are organized into successive non-dominated semantic layers.
- **REC-011 — Stable presentation:** Candidates within a semantic layer receive deterministic technical presentation ordering.
- **REC-012 — No semantic meaning from technical order:** Presentation position within a semantic layer does not imply semantic superiority.
- **REC-013 — Explainability:** Reasons derive from actual permitted recommendation evidence, not ranking position.
- **REC-014 — Boundary:** Internal ranking evidence and mechanics are not public transport contracts.

## Phase 1 Decision

Ranking Policy v1 is accepted as a semantic-dominance model with:

```text
Core distance
+
separate secondary evidence
+
close-Core boundary of 1
+
Pareto-style semantic dominance
+
semantic tie / incomparability
+
non-dominated ranking layers
+
deterministic technical presentation ordering
```

Weighted ranking formulas, normalization, secondary adjustment values, and secondary caps are intentionally not part of Phase 1 Ranking Policy v1.