Status: Accepted  
Version: v1  
Phase: 1  
Last Updated: 2026-10-11

# Domain Overview

This document is the Phase 1 entry point and index for the Cocktail Taste Test domain. It summarizes accepted domain contracts and their boundaries; detailed normative rules live in the linked canonical documents. Implementation, persistence, transport, and production dataset choices are outside this overview unless explicitly stated.

## 1. Canonical Pipeline

```text
Assessment Definition v1 (8 questions)
        ↓
AssessmentAnswer[]
        ↓ validate and directly map
Assessment Transformer v1
        ↓
UserTasteProfile v1 ───────────────┐
                                   ├→ RecommendationMatch v1
CocktailProfile v1[] ──────────────┘          ↓
                                  Ranking Policy v1
                                             ↓
                                  Ranked candidates
                                             ↓
                                   Reason Builder v1
                                             ↓
                                RecommendationResult v1
```

The ranking engine operates on eligible candidates. Dataset-specific candidate filtering is outside Ranking Policy v1. Reason Builder selects supported positive evidence after ranking; it does not change ranking or generate user-facing prose.

## 2. Canonical Documents

| Document | Responsibility |
| --- | --- |
| [Assessment](assessment.md) | Eight direct-preference questions, canonical question/answer IDs, submission validation, and deterministic answer-to-profile transformation. |
| [Taste Profile](taste-profile.md) | Five Core Dimensions, `TasteScore`, partial `UserTasteProfile`, and evidence preservation. |
| [Cocktail Profile](cocktail-profile.md) | Recommendation-facing cocktail identity, complete Core scores, and presence-only secondary signals. |
| [Flavor Vocabulary](flavor-vocabulary.md) | Canonical Flavor and BaseSpirit values and their distinct semantics. |
| [Recommendation](recommendation.md) | Internal matching evidence, Ranking Policy v1, semantic relations, layers, and deterministic technical ordering. |
| [Recommendation Result](recommendation-result.md) | Public, transport-safe profile summary and recommendation items. |
| [Reason Builder](reason-builder.md) | Structured positive-only reasons selected from supported evidence. |
| [Golden Cases](golden-cases.md) | Five canonical personas, twelve fixed cocktail fixtures, semantic ranking expectations, and reason expectations. |
| [Testing Strategy](../testing/strategy.md) | Domain, policy, integration, Golden, architecture, and regression test expectations. |

The canonical document names above refer to the repository paths, not upload filenames with suffixes such as `(1)` or `(5)`.

## 3. Domain Responsibilities

| Area | Responsibility | Does not do |
| --- | --- | --- |
| Assessment | Collects explicit preference evidence and validates eight responses. | Infer hidden preferences or calculate recommendations. |
| Taste | Represents known user preferences and preserves missing evidence. | Turn unknown dimensions into neutral scores. |
| Cocktail | Represents the completed cocktail's recommendation-relevant characteristics. | Infer Flavor automatically from ingredient presence. |
| Recommendation | Constructs matching evidence and ranks eligible candidates. | Expose internal ranking mechanics in public results. |
| Reason Builder | Selects valid structured positive explanations. | Re-rank candidates or generate prose. |
| Recommendation Result | Publishes presentation-ready, transport-safe recommendation data. | Expose semantic layers, distance values, or evidence counts. |

An Assessment option must never map directly to a cocktail recommendation. The required path is answer → evidence → user taste profile → matching and ranking → reasons → public result.

## 4. Accepted Phase 1 Decisions

### 4.1 Core Taste and Profile Semantics

- Core Dimensions: `sweet`, `sour`, `bitter`, `alcoholIntensity`, and `refreshing`.
- `TasteScore = 1 | 2 | 3 | 4 | 5`.
- A known score of `3` is valid; unknown is represented by an absent user dimension, never an implicit `3`.
- `UserTasteProfile.dimensions` may be partial; `CocktailProfile.dimensions` contains all five dimensions.
- Flavor and BaseSpirit are distinct presence/preference signals, not additional scored Core Dimensions.

### 4.2 Secondary Vocabulary

- Canonical Flavor v1 has nine values: `citrus`, `fruity`, `tropical`, `herbal`, `floral`, `creamy`, `coffee`, `spicy`, `smoky`.
- Canonical confirmed BaseSpirit v1 has six values: `gin`, `vodka`, `rum`, `tequila`, `whiskey`, `mezcal`.
- The previously referenced seventh BaseSpirit value remains an explicit documentation gap; no substitute value is inferred.
- Preferred and avoided Flavor signals are separate. Neither Flavor nor BaseSpirit implies a Core score or the other secondary signal.

### 4.3 Assessment Definition v1

- Eight questions: five direct Core Dimension questions, preferred Flavors, avoided Flavors, and preferred BaseSpirits.
- Core answers use `very-low`, `low`, `medium`, `high`, `very-high`, or `unknown`, with direct mapping to scores `1..5` or absence.
- Preferred Flavors: zero to two unique canonical values; avoided Flavors: zero or more unique canonical values; preferred BaseSpirits: zero to two unique canonical values.
- A valid submission includes exactly one response for each of the eight canonical Question IDs; preferred and avoided Flavor sets must not overlap.
- Transformation is direct and deterministic: no weighting, aggregation, normalization, clamping, or inference.
- The canonical Question IDs, Answer IDs, answer shapes, and transformation rules are defined in [Assessment](assessment.md) and are **not deferred**.

### 4.4 RecommendationMatch and Ranking Policy v1

- Core distance is the sum of absolute user-to-cocktail score differences over **known** user Core Dimensions only.
- Preferred Flavor matches, avoided Flavor collisions, and preferred BaseSpirit matches are preserved as separate evidence.
- If the total Core-distance gap is greater than `1`, the candidate with lower Core distance semantically dominates regardless of secondary evidence.
- If the gap is at most `1`, candidates use Pareto-style comparison across lower Core distance, more preferred Flavor matches, fewer avoided Flavor collisions, and more preferred BaseSpirit matches.
- The policy distinguishes semantic dominance (`A > B`), tie (`A = B`), and incomparability (`A ↔ B`).
- Candidates are organized into successive non-dominated semantic layers. Within a layer, presentation order is deterministic: lower exact total Core distance, then stable canonical cocktail ID.
- Presentation order is not itself semantic superiority. The policy does not use a weighted scalar ranking score or secondary adjustment weights/caps.

### 4.5 Reason Builder v1

- Reasons are structured positive evidence only: `core-match`, `flavor-match`, and `base-spirit-match`.
- Core reason candidates require a known user dimension and a dimension distance of at most `1`; select at most two, ordered by distance ascending, user distinctiveness (`|userScore - 3|`) descending, then canonical dimension order.
- Flavor reasons require actual preferred Flavor matches and include at most two; BaseSpirit reasons require actual preferred BaseSpirit matches and include at most one.
- Avoided Flavor collisions, ranking position, semantic layers, and technical tie-breaks never create positive reasons.
- Empty reasons are valid. Reason Builder does not produce user-facing prose.

### 4.6 Public RecommendationResult Boundary

- The public result contains a user taste summary and recommendation items with structured reasons.
- Unknown user dimensions remain absent from the public taste summary.
- `RecommendationItem.rank` is a deterministic **presentation ordinal**, not a public semantic-dominance or semantic-layer field.
- Internal Core distances, evidence counts, dominance relations, semantic layers, and technical ordering metadata are not public contracts.

### 4.7 Golden Cases and Testing

- Golden Cases v1 defines five canonical personas (G-001 through G-005) and twelve fixed CocktailProfile fixtures.
- Golden expectations protect specific semantic pairwise relationships, not a complete total-order snapshot.
- The accepted Ranking Policy v1 is unchanged by the 2026-10-05 Golden fixture calibration.
- Golden reasons must be evaluated using Reason Builder v1's actual selection limits and ordering, not merely the set of potentially positive evidence.
- Canonical Assessment Question/Answer IDs are now documented, allowing AssessmentAnswer-to-UserTasteProfile traces to be specified and tested; automated test execution and repository fixture implementation are separate work.
- See [Golden Cases](golden-cases.md) and [Testing Strategy](../testing/strategy.md) for exact fixtures, expected relations, and verification scope.

## 5. Public/Internal Boundary

```text
Internal domain evidence:
  RecommendationMatch
  totalCoreDistance / per-dimension distances
  secondary match and collision counts
  semantic dominance / incomparability / tie
  semantic layers and technical ordering metadata

Public contract:
  RecommendationResult
  UserTasteSummary
  RecommendationItem (presentation rank, cocktail summary, structured reasons)
```

The public `rank` field must not be interpreted as proof that an earlier item semantically dominates a later item.

## 6. Deferred Decisions and Known Gaps

The following remain outside accepted Phase 1 domain semantics or require future work:

- Production cocktail dataset selection, candidate eligibility/filtering policy, and persistence/database schema.
- Anonymous Assessment/session persistence and API/transport implementation details.
- Runtime validation library and production DTO implementation.
- Final number of recommendations returned, browser E2E implementation, and production UI copy.
- Analytics, authentication, result sharing, and recommendation confidence model.
- Complete ingredient-to-BaseSpirit and tasting-note-to-Flavor normalization tables.
- The unidentified seventh BaseSpirit value (explicit documentation gap; do not guess a replacement).
- Implementation and automated execution of the accepted Assessment, Ranking Policy, Reason Builder, and Golden regression tests.

**Not deferred:** Assessment v1's eight questions and canonical Answer IDs; direct Assessment transformation; Ranking Policy v1's close-Core boundary and semantic rules; Golden Cases v1's fixed fixtures and accepted semantic expectations; Reason Builder v1's structured reason selection rules.

## 7. Superseded Phase 0 Candidates

Earlier candidate dimensions (including `citrus`, `rich`, `dry`, `strength`, and scored Flavor values), `0..100`-style score examples, and unspecified score ranges are superseded for Phase 1. Flavor is presence-only; `alcoholIntensity` is a Core Dimension.

## 8. Document Change Discipline

A substantive change to an accepted domain rule must be reflected in its canonical document first, then checked against dependent contracts, Golden expectations, and the Testing Strategy. Documentation synchronization does not by itself demonstrate that implementation tests have passed.
