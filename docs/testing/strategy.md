Status: Accepted  
Version: v1  
Phase: 1  
Last Updated: 2026-10-11

# Testing Strategy

Testing Strategy v1 defines the canonical Phase 1 verification strategy for the cocktail taste recommendation domain.

The strategy protects domain semantics across:

- Assessment transformation,
- `UserTasteProfile`,
- `CocktailProfile`,
- `RecommendationMatch`,
- Ranking Policy v1,
- `RecommendationResult`,
- Reason Builder v1,
- Golden Cases v1.

Tests must protect domain behavior rather than incidental implementation structure.

---

# 1. Testing Principles

## TEST-001 — Test Domain Semantics

Tests should verify externally meaningful domain behavior.

Prefer assertions such as:

```text
Mojito > Tom Collins
```

or:

```text
Manhattan ↔ Dry Martini
```

over assertions against private intermediate calculations unless the intermediate value itself is the subject of the unit test.

---

## TEST-002 — Separate Policy Layers

Different policy layers require different tests.

```text
Assessment Tests
→ answer transformation

Profile Tests
→ domain representation

RecommendationMatch Tests
→ evidence construction

Ranking Policy Tests
→ semantic candidate relationships

Reason Builder Tests
→ explanation evidence

Golden Tests
→ representative end-to-end domain behavior
```

One test category must not silently replace another.

---

## TEST-003 — Golden Tests Are Not Complete Ranking Snapshots

Golden Tests protect canonical semantic relationships.

They do not require one complete total order across every candidate.

Prefer:

```text
A > B
C ↔ D
E = F
```

when those are the intended semantic guarantees.

Do not convert semantic incomparability or semantic ties into artificial strict ordering assertions.

---

## TEST-004 — Synthetic Tests Protect Policy Boundaries

Golden Cases use realistic fixed cocktail fixtures.

Synthetic tests use deliberately constructed profiles to isolate Ranking Policy boundaries and invariants.

Both are required.

A realistic Golden Case disappearing for one synthetic edge condition is not a reason to remove the synthetic test.

---

## TEST-005 — Fixed Golden Fixtures

Golden Tests must use versioned fixed fixtures.

They must not query or derive expected behavior from a mutable production cocktail dataset.

Golden Cocktail Fixtures v1 are the canonical Phase 1 fixtures.

---

## TEST-006 — No Golden Backsolving

Tests must not alter cocktail fixture values merely to make an expected Golden relationship pass.

When fixture evidence and a Golden expectation disagree:

```text
inspect fixture
→ inspect policy
→ inspect expectation
```

Do not reverse-engineer the fixture from the expected output.

---

## TEST-007 — Determinism

Given the same:

```text
domain version
user profile
cocktail fixtures
ranking policy
reason policy
```

the result must be deterministic.

Technical presentation ordering must also be deterministic where required, even when semantic candidates are tied or incomparable.

---

# 2. Test Layers

Phase 1 uses five major test layers.

| Layer        | Primary responsibility                      |
| ------------ | ------------------------------------------- |
| Unit         | Local domain rules                          |
| Policy       | Ranking and Reason Builder semantics        |
| Integration  | Multiple domain components working together |
| Golden       | Canonical representative user behavior      |
| Architecture | Domain boundaries and dependency direction  |

These layers overlap intentionally but have different failure meanings.

---

# 3. Assessment Tests

Assessment tests protect the canonical transformation from answers into `UserTasteProfile`.

They must verify:

```text
AssessmentAnswer[]
        ↓
UserTasteProfile
```

without involving recommendation ranking.

---

## 3.1 Core Dimension Transformation

Tests must verify that Assessment answers produce the intended known Core Dimension evidence.

Required behavior includes:

- canonical score values remain within `TasteScore`,
- known dimensions aggregate according to the accepted transformation rules,
- missing evidence does not silently create a dimension,
- unknown dimensions remain absent.

Example semantic assertion:

```text
no evidence for bitter
→ profile.bitter is absent
```

Not:

```text
no evidence for bitter
→ profile.bitter = 3
```

---

## 3.2 Flavor Preference Transformation

Tests must independently verify:

```text
preferredFlavors
avoidedFlavors
```

including:

- canonical vocabulary only,
- no accidental duplication,
- preference and avoidance semantics remain distinct,
- missing evidence does not create a preference.

---

## 3.3 BaseSpirit Preference Transformation

Tests must verify canonical BaseSpirit preference evidence separately from Flavor evidence.

BaseSpirit must not be inferred from Flavor.

Flavor must not be inferred from BaseSpirit.

---

## 3.4 Canonical Assessment-to-Golden Tests

Assessment Definition v1 specifies all eight canonical Question IDs, the valid scale Answer IDs, and the canonical Flavor/BaseSpirit selection values. Golden Cases v1 §15.1 defines complete eight-answer submissions for G-001 through G-005. The former *undocumented Assessment Answer IDs* gap is resolved at the documentation-contract level.

For each persona, construct exactly one answer for every Question ID and assert the resulting `UserTasteProfile` exactly equals the canonical Golden profile:

| Golden | Core answers (`sweet`, `sour`, `bitter`, `alcohol-intensity`, `refreshing`) | Preferred flavors | Avoided flavors | Preferred bases |
| --- | --- | --- | --- | --- |
| G-001 | `very-low`, `very-high`, `very-low`, `very-low`, `very-high` | `citrus`, `herbal` | `smoky` | `[]` |
| G-002 | `very-high`, `very-low`, `very-low`, `very-low`, `low` | `tropical`, `creamy` | `coffee` | `rum` |
| G-003 | `very-low`, `very-low`, `medium`, `very-high`, `very-low` | `spicy` | `[]` | `whiskey` |
| G-004 | `very-low`, `very-low`, `very-high`, `medium`, `medium` | `herbal`, `smoky` | `creamy` | `gin`, `mezcal` |
| G-005 | `unknown`, `high`, `unknown`, `unknown`, `very-high` | `[]` | `[]` | `[]` |

Scale responses use `answerId`; multi-select responses use `answerIds`, including empty arrays. G-005 is a **complete submission** but must yield a **partial profile** with only `sour: 4` and `refreshing: 5`.

Additional Assessment validation tests must cover:

- exactly eight distinct Question IDs; reject missing or duplicated responses;
- reject mismatched scale/multi-select answer shapes and unknown Answer IDs;
- reject duplicate values within multi-select arrays;
- enforce maximum two preferred Flavors and maximum two preferred BaseSpirits, without an arbitrary maximum on avoided Flavors;
- reject non-canonical Flavor/BaseSpirit values and preferred/avoided Flavor overlap;
- accept empty secondary selections and all-`unknown` Core answers;
- preserve `unknown` as absence, never neutral `3`;
- preserve deterministic meaning when question order or multi-select order changes (without interpreting order as preference strength).

These are **required tests**, not claims that tests have already executed. The missing seventh BaseSpirit value remains a separate vocabulary documentation gap.

---

# 4. UserTasteProfile Tests

`UserTasteProfile` tests protect representation semantics.

Required tests include:

- known Core Dimension values,
- absent unknown dimensions,
- preferred Flavor presence,
- avoided Flavor presence,
- preferred BaseSpirit presence,
- empty secondary preference sets,
- deterministic normalization where normalization is part of the accepted model.

The key invariant is:

```text
unknown
≠ neutral 3
```

Absence must remain observable as absence.

---

# 5. CocktailProfile Tests

`CocktailProfile` tests protect canonical recommendation evidence.

Required tests include:

- five Core Dimension values,
- canonical Flavor vocabulary,
- canonical BaseSpirit vocabulary,
- Flavor and BaseSpirit separation,
- empty BaseSpirit presence when no canonical BaseSpirit applies,
- deterministic fixture identity.

For example:

```text
Americano
baseSpirits = []
```

is valid canonical fixture evidence.

Tests must not fabricate:

```text
Americano
baseSpirits = ["gin"]
```

merely to make a recommendation relation easier to express.

---

# 6. RecommendationMatch Tests

`RecommendationMatch` tests verify evidence construction between one `UserTasteProfile` and one `CocktailProfile`.

These tests should inspect internal evidence because evidence construction itself is the unit under test.

---

## 6.1 Core Distance

For every known user Core Dimension:

```text
dimensionDistance
=
|userScore - cocktailScore|
```

Unknown user dimensions must be excluded.

Required boundary examples include:

```text
|1 - 1| = 0
|1 - 2| = 1
|1 - 5| = 4
```

---

## 6.2 Partial Core Comparison

Given:

```text
user:
sour = 4
refreshing = 5
```

and no other known Core Dimensions, RecommendationMatch must compare only:

```text
sour
refreshing
```

It must not create synthetic distance entries for:

```text
sweet
bitter
alcoholIntensity
```

---

## 6.3 Preferred Flavor Evidence

Tests must verify actual intersections:

```text
user.preferredFlavors
∩
cocktail.flavors
```

No user preference alone is sufficient.

No cocktail Flavor alone is sufficient.

---

## 6.4 Avoided Flavor Evidence

Tests must verify actual collisions:

```text
user.avoidedFlavors
∩
cocktail.flavors
```

Avoided Flavor evidence remains distinct from preferred Flavor evidence.

---

## 6.5 Preferred BaseSpirit Evidence

Tests must verify:

```text
user.preferredBaseSpirits
∩
cocktail.baseSpirits
```

BaseSpirit evidence must not be inferred from Flavor evidence.

---

# 7. Ranking Policy Tests

Ranking Policy tests are synthetic policy tests.

Their purpose is to protect Recommendation v1 semantics independently from realistic Golden fixtures.

They must cover both Core-priority and close-Core behavior.

---

# 8. Core Priority Tests

## RP-001 — Material Core Advantage Wins

Given:

```text
A coreDistance = 2
B coreDistance = 4
```

then:

```text
coreGap = 2
```

which exceeds the close-Core boundary.

Expected:

```text
A > B
```

Secondary preference evidence must not overturn the material Core advantage.

---

## RP-002 — Large Secondary Advantage Cannot Reverse Material Core Mismatch

Construct:

```text
A
→ materially better Core
→ no secondary matches

B
→ materially worse Core
→ multiple preferred Flavor matches
→ preferred BaseSpirit match
```

Expected:

```text
A > B
```

This protects Core priority.

---

## RP-003 — Material Core Boundary

Explicitly test:

```text
coreGap = 2
```

Expected:

```text
material Core comparison
```

This protects the boundary immediately outside close-Core comparison.

---

# 9. Close-Core Ranking Tests

The accepted close-Core boundary is:

```text
coreGap <= 1
```

Within this boundary, applicable Core and secondary evidence participate in semantic Pareto comparison.

---

## RP-004 — Same Core + Better Flavor

Construct:

```text
A Core = B Core

A preferred Flavor matches = 2
B preferred Flavor matches = 1

all other applicable evidence equal
```

Expected:

```text
A > B
```

This synthetic rule is represented realistically by G-001:

```text
Mojito > Tom Collins
```

---

## RP-005 — Same Core + Better BaseSpirit

Construct:

```text
A Core = B Core
Flavor evidence equal
Avoided evidence equal

A preferred BaseSpirit match = 1
B preferred BaseSpirit match = 0
```

Expected:

```text
A > B
```

This synthetic rule is represented realistically by G-004:

```text
Negroni > Americano
```

---

## RP-006 — Same Core + Avoided Flavor Collision

Construct two otherwise equivalent candidates.

```text
A avoided Flavor collisions = 0
B avoided Flavor collisions = 1
```

Expected:

```text
A > B
```

Avoided Flavor evidence must remain ranking evidence and must not become a positive reason.

---

## RP-007 — Better Core vs Better Flavor

Construct close-Core candidates:

```text
A
→ better Core

B
→ better preferred Flavor evidence
```

with neither candidate no worse across all applicable evidence.

Expected:

```text
A ↔ B
```

---

## RP-008 — Better Core vs Better BaseSpirit

Construct:

```text
A
→ better Core

B
→ better preferred BaseSpirit evidence
```

within the close-Core boundary.

Expected:

```text
A ↔ B
```

---

## RP-009 — Better Core vs Multiple Secondary Advantages

Construct:

```text
A
→ better Core

B
→ better Flavor
→ better BaseSpirit
```

within the close-Core boundary.

Expected:

```text
A ↔ B
```

This behavior has a realistic Golden representative:

```text
Manhattan ↔ Dry Martini
```

where Dry Martini has better Core evidence while Manhattan has preferred Flavor and preferred BaseSpirit evidence.

---

# 10. Tie Tests

## RP-010 — Identical Applicable Evidence

Given two candidates with identical applicable:

```text
Core evidence
preferred Flavor evidence
avoided Flavor evidence
preferred BaseSpirit evidence
```

Expected:

```text
A = B
```

This is a semantic tie.

---

## RP-011 — Partial-Profile Tie

Unknown user dimensions must not break a tie.

Construct a partial user profile where two candidates are identical across all known and applicable evidence.

Expected:

```text
A = B
```

G-005 provides the canonical realistic example:

```text
Tom Collins = Mojito
```

---

# 11. Incomparability Tests

## RP-012 — Conflicting Applicable Evidence

Construct close-Core candidates where different applicable dimensions favor different candidates.

Expected:

```text
A ↔ B
```

Do not force a semantic winner through technical ordering.

---

## RP-013 — Incomparability Is Not Tie

For an incomparable pair:

```text
A ↔ B
```

assert that the relationship is not:

```text
A = B
```

and not:

```text
A > B
B > A
```

G-003 provides the canonical realistic example:

```text
Manhattan ↔ Dry Martini
```

---

# 12. Semantic Layer Construction Tests

Ranking Policy v1 may produce a partial order rather than one strict total order.

Tests must verify semantic layer construction independently from presentation ordering.

Example:

```text
A > C
B > C
A ↔ B
```

Expected semantic layers:

```text
Layer 1
A, B

Layer 2
C
```

The relative technical presentation order of `A` and `B` does not change their semantic relationship.

---

## RP-014 — Non-Dominated Layer Construction

Construct multiple candidates with:

- dominance,
- incomparability,
- tie.

Verify that all non-dominated candidates enter the same semantic layer where appropriate.

---

## RP-015 — Dominated Candidate Cannot Enter Higher Layer

If:

```text
A > B
```

then `B` must not appear in a semantic layer above `A`.

---

# 13. Deterministic Presentation Tests

Semantic ties and incomparability may still require deterministic output ordering.

Presentation tests must verify:

```text
same inputs
→ same technical order
```

without converting that order into semantic superiority.

For:

```text
A ↔ B
```

it is valid for technical output to consistently show:

```text
A before B
```

provided tests do not reinterpret that as:

```text
A > B
```

The same applies to:

```text
A = B
```

---

# 14. RecommendationResult Tests

`RecommendationResult` tests protect the public recommendation boundary.

Public results must expose only accepted public recommendation information.

Internal ranking evidence must not leak.

Examples of prohibited public fields include:

```text
rankingScore
averageDistance
coreSimilarity
flavorAdjustment
baseAdjustment
secondaryAdjustment
```

or equivalent future private calculation fields.

---

## 14.1 Semantic Result Integrity

`RecommendationResult.recommendations` must follow the deterministic presentation ordering produced by Ranking Policy v1. The public `rank` is a unique, ascending **presentation ordinal**, not a semantic dominance score or semantic layer identifier.

Internal `semanticLayer`, `totalCoreDistance`, per-dimension distances, secondary evidence counts, and technical tie-break metadata must not be exposed through the public result. Assert their absence from serialized public results, not only from TypeScript interfaces.

Presentation order alone must never be interpreted as semantic dominance: candidates in the same layer may be incomparable or tied even when their public `rank` values differ.

---

# 15. Reason Builder Tests

Reason Builder tests are independent from Ranking Policy tests.

A candidate ranking highly does not automatically create a reason.

Reasons must derive from actual positive evidence.

---

## RB-001 — Positive Core Evidence

A Core reason may be generated only from a known user dimension and actual cocktail comparison evidence accepted by Reason Builder v1.

Unknown user dimensions cannot create reasons.

---

## RB-002 — Preferred Flavor Evidence

Given:

```text
user prefers herbal
cocktail has herbal
```

`herbal` may become a reason where allowed by the canonical reason policy.

---

## RB-003 — Preferred Flavor Without Cocktail Presence

Given:

```text
user prefers herbal
cocktail does not have herbal
```

Expected:

```text
no herbal reason
```

---

## RB-004 — Preferred BaseSpirit Evidence

Given:

```text
user prefers gin
cocktail baseSpirits includes gin
```

`gin` may become a BaseSpirit reason where permitted.

---

## RB-005 — Preferred BaseSpirit Without Cocktail Presence

Given:

```text
user prefers gin
cocktail baseSpirits = []
```

Expected:

```text
no gin reason
```

G-004's Americano fixture protects this scenario realistically.

---

## RB-006 — Avoided Flavor Is Not Positive Reason

An avoided Flavor collision may affect ranking evidence.

It must not be emitted as a positive recommendation reason.

---

## RB-007 — Ranking Position Is Not Reason Evidence

Do not generate reasons from:

```text
rank
semantic layer
technical tie-break
presentation order
```

---

## RB-008 — Deterministic Reason Construction

Same accepted evidence and same Reason Builder version must produce the same structured reason result.

---

## 15.1 Exact Reason Selection Boundaries

In addition to RB-001–RB-008, test the canonical Reason Builder v1 selection mechanics:

- Core candidates require known user evidence and `dimensionDistance <= 1`; exclude distance `2` and above.
- Sort qualifying Core dimensions by distance ascending, then `|userScore - 3|` descending, then canonical dimension order: `sweet`, `sour`, `bitter`, `alcoholIntensity`, `refreshing`.
- Emit **at most two** Core dimensions, even when more than two qualify.
- Emit preferred Flavor intersections in canonical Flavor vocabulary order (`citrus`, `fruity`, `tropical`, `herbal`, `floral`, `creamy`, `coffee`, `spicy`, `smoky`), maximum two.
- Emit preferred BaseSpirit intersections in canonical BaseSpirit vocabulary order (`gin`, `vodka`, `rum`, `tequila`, `whiskey`, `mezcal`), maximum one.
- Emit groups at most once each, in Core → Flavor → BaseSpirit order; omit empty groups; `reasons: []` is valid.
- Do not infer reasons from avoided Flavor collisions, semantic layers, rank, or technical ordering.
- Verify permutation invariance: changing only the order of `preferredFlavors` or `preferredBaseSpirits` does not change the selected reasons.
- Use a synthetic cocktail with `flavors: ["herbal", "citrus", "fruity"]` and user `preferredFlavors: ["herbal", "fruity", "citrus"]`; expected emitted Flavor reasons are `["citrus", "fruity"]` for every permutation of the same preference set.
- Use a synthetic cocktail with `baseSpirits: ["mezcal", "gin"]` and user `preferredBaseSpirits: ["mezcal", "gin"]`; expected emitted BaseSpirit reason is `["gin"]` for either preference order. These are synthetic tests, not changes to the 12 Golden cocktail fixtures.

---

# 16. Golden Tests

Golden Tests combine canonical personas with Golden Cocktail Fixtures v1.

They protect representative Recommendation v1 behavior.

They must use stable fixture IDs.

---

# 17. G-001 Integration — Bright & Refreshing

Canonical semantic assertions:

```text
Mojito > Tom Collins

Mojito > Negroni

Tom Collins > Negroni

Margarita > Mezcal Margarita
```

Primary behavior:

```text
same-Core + preferred Flavor advantage
→ semantic dominance
```

The test must specifically protect:

```text
Mojito > Tom Collins
```

because both candidates have identical canonical Core evidence while Mojito has additional preferred `herbal` evidence.

The test must not assert:

```text
Mojito ↔ Tom Collins
```

---

# 18. G-002 Integration — Sweet & Tropical

Canonical semantic assertions:

```text
Piña Colada > Tequila Sunrise

Piña Colada > Mojito

Piña Colada > Espresso Martini
```

This Golden protects:

- strong Core compatibility,
- preferred Flavor support,
- preferred BaseSpirit support,
- avoided Flavor behavior,
- material Core priority.

---

# 19. G-003 Integration — Dry & Spirit-forward

Canonical semantic assertions:

```text
Old Fashioned > Manhattan

Old Fashioned > Dry Martini

Manhattan ↔ Dry Martini
```

Primary behavior:

```text
material Core priority
+
close-Core Core-vs-secondary trade-off
```

The critical incomparability assertion is:

```text
Manhattan ↔ Dry Martini
```

because:

```text
Dry Martini
→ better Core evidence

Manhattan
→ preferred spicy evidence
→ preferred whiskey evidence
```

and the Core gap remains inside the close-Core boundary.

The test must explicitly verify that this pair is:

```text
not a tie
not Manhattan > Dry Martini
not Dry Martini > Manhattan
```

---

# 20. G-004 Integration — Bitter & Smoky

Canonical semantic assertions:

```text
Negroni > Americano

Americano > Mezcal Margarita

Negroni > Mezcal Margarita
```

Primary behavior:

```text
same-Core + preferred BaseSpirit advantage
→ semantic dominance
```

For `Negroni` and `Americano`:

```text
Core evidence
→ equal

preferred herbal evidence
→ equal

avoided creamy evidence
→ equal

preferred gin evidence
→ Negroni only
```

Expected:

```text
Negroni > Americano
```

The test must not assert:

```text
Americano ↔ Negroni
```

---

# 21. G-005 Integration — Uncertain Beginner

Canonical semantic assertion:

```text
Tom Collins = Mojito
```

Primary behavior:

```text
partial profile
+
identical applicable evidence
→ semantic tie
```

Only:

```text
sour
refreshing
```

are known Core Dimensions.

Unknown dimensions must not break the tie.

No absent Flavor or BaseSpirit preference may be fabricated to distinguish the candidates.

---

# 22. Cross-Golden Regression Matrix

Golden Tests collectively protect:

| Behavior                               | Canonical Golden |
| -------------------------------------- | ---------------- |
| Same-Core + Flavor dominance           | G-001            |
| Multi-signal / material Core dominance | G-002            |
| Close-Core incomparability             | G-003            |
| Same-Core + BaseSpirit dominance       | G-004            |
| Partial-profile semantic tie           | G-005            |

Important canonical relationships:

```text
G-001
Mojito > Tom Collins

G-003
Manhattan ↔ Dry Martini

G-004
Negroni > Americano

G-005
Tom Collins = Mojito
```

These four relationships must not be collapsed into one generic ordering behavior.

They represent four different evidence states.

---

# 23. Golden Reason Assertions

Golden integration tests should verify structured reason evidence where the canonical Golden Case defines it.

Examples:

```text
G-001 Mojito
→ supported Core reasons
→ citrus
→ herbal
```

```text
G-002 Piña Colada
→ supported Core reasons
→ tropical
→ creamy
→ rum
```

```text
G-003 Old Fashioned
→ supported Core reasons
→ spicy
→ whiskey
```

```text
G-004 Americano
→ supported Core reasons
→ herbal
→ no fabricated gin
→ no fabricated smoky
```

```text
G-005
→ sour
→ refreshing
→ no reasons from unknown Core dimensions
```

Golden reason assertions must follow Reason Builder v1 rather than inferring reasons from ranking expectations.

---

## 23.1 Exact Golden Reason Regression Assertions

Use the **emitted** structured reason arrays, not all qualifying underlying evidence. Assert group order and the order of values within each group:

| Golden / Cocktail | `core-match.dimensions` | `flavor-match.flavors` | `base-spirit-match.baseSpirits` |
| --- | --- | --- | --- |
| G-001 / Mojito | `bitter`, `refreshing` | `citrus`, `herbal` | absent |
| G-002 / Piña Colada | `sweet`, `bitter` | `tropical`, `creamy` | `rum` |
| G-003 / Old Fashioned | `sour`, `alcoholIntensity` | `spicy` | `whiskey` |
| G-004 / Americano | `sour`, `bitter` | `herbal` | absent |
| G-005 / Mojito | `refreshing`, `sour` | absent | absent |
| G-005 / Tom Collins | `refreshing`, `sour` | absent | absent |

Specifically reject these stale expectations:

- G-002 Piña Colada: `sweet`, `sour` as the final Core reason;
- G-003 Old Fashioned: four emitted Core dimensions rather than the selected two;
- G-005: `sour`, `refreshing` as the final ordered Core reason.

The fixed Golden ranking relationships remain unchanged. A change in emitted reasons must not silently change Ranking Policy or cocktail fixture values.

---

# 24. Golden Fixture Integrity Tests

Golden Cocktail Fixtures v1 should have dedicated integrity tests.

These tests protect the canonical fixture dataset itself.

Required checks include:

```text
exactly 12 canonical fixture IDs
unique fixture IDs
valid TasteScore values
canonical Flavor values only
canonical BaseSpirit values only
Flavor/BaseSpirit separation
Americano baseSpirits remains empty
```

Fixture integrity tests should fail if a fixture is silently recalibrated.

A fixture semantic change requires explicit domain review.

---

# 25. Regression Tests for 2026-10-05 Calibration

The following stale expectations must have explicit regression protection:

```text
OLD
Mojito ↔ Tom Collins

NEW
Mojito > Tom Collins
```

```text
OLD
Manhattan > Dry Martini

NEW
Manhattan ↔ Dry Martini
```

```text
OLD
Americano ↔ Negroni

NEW
Negroni > Americano
```

These regressions protect the independently authored Golden Cocktail Fixtures v1 from accidental restoration of pre-fixture assumptions.

Ranking Policy v1 did not change during this calibration.

---

# 26. Architecture Tests

Architecture tests protect domain boundaries.

They should verify that:

```text
domain
```

does not depend on:

```text
UI
framework-specific presentation
transport DTOs
production API response shapes
```

unless explicitly allowed by the architecture.

Recommendation domain models should remain usable independently from presentation concerns.

---

## 26.1 Public/Internal Boundary

Architecture or type-level tests should protect the boundary between:

```text
RecommendationMatch
→ internal evidence
```

and:

```text
RecommendationResult
→ public result
```

Internal calculation evidence must not leak accidentally through public result types.

---

# 27. Property and Invariant Tests

Where practical, property-based or table-driven tests should protect general invariants.

Useful properties include:

### Distance symmetry

```text
|a - b|
=
|b - a|
```

### Distance bounds

For `TasteScore = 1..5`:

```text
0 <= distance <= 4
```

### Unknown exclusion

Adding an unknown user dimension must not change the existing known-dimension comparison.

### Determinism

Repeated evaluation of the same versioned inputs produces the same semantic result.

### Dominance consistency

If `A > B`, then the same evidence must not simultaneously produce:

```text
B > A
```

### Tie symmetry

If:

```text
A = B
```

then:

```text
B = A
```

### Incomparability symmetry

If:

```text
A ↔ B
```

then:

```text
B ↔ A
```

---

# 28. Failure Interpretation

A failing test should first be classified by layer.

```text
Assessment failure
→ transformation issue

RecommendationMatch failure
→ evidence construction issue

Ranking Policy failure
→ semantic comparison issue

Reason Builder failure
→ explanation issue

Golden failure
→ integration / fixture / canonical expectation issue

Architecture failure
→ boundary violation
```

Do not immediately update a Golden expectation because an implementation test fails.

For Golden failures:

```text
inspect implementation
→ inspect fixture
→ inspect policy
→ inspect canonical expectation
```

before changing accepted domain behavior.

---

# 29. Test Data Policy

Use the smallest fixture set capable of proving the intended rule.

For synthetic Ranking Policy tests:

```text
minimal synthetic profiles
```

are preferred.

For Golden tests:

```text
Golden Cocktail Fixtures v1
```

are required.

For production-data tests:

```text
mutable production dataset
```

may be used only for separate dataset validation and must not define Golden semantics.

---

# 30. CI Expectations

Phase 1 CI should verify, at minimum:

```text
lint
typecheck
unit tests
Ranking Policy tests
Reason Builder tests
Golden tests
architecture checks
build
```

Where repository tooling separates packages or workspaces, the equivalent canonical commands should be used.

An environment-specific infrastructure failure must be distinguished from a semantic test failure.

For example:

```text
process spawn failure
```

must not be reported as:

```text
Ranking Policy regression
```

unless the relevant test actually executed and failed semantically.

---

# 31. Phase 1 Acceptance Criteria

Testing Strategy v1 is satisfied when automated tests protect:

- canonical `TasteScore`,
- five Core Dimensions,
- unknown-dimension absence semantics,
- canonical Flavor evidence,
- canonical BaseSpirit evidence,
- RecommendationMatch distance construction,
- preferred Flavor matching,
- avoided Flavor collisions,
- preferred BaseSpirit matching,
- material Core priority,
- close-Core Pareto comparison,
- semantic dominance,
- semantic tie,
- semantic incomparability,
- semantic layer construction,
- deterministic presentation ordering,
- public/internal recommendation boundaries,
- structured positive-only reasons,
- Golden Cocktail Fixtures v1,
- five canonical Golden personas,
- complete eight-question Assessment-to-profile Golden traces,
- exact ordered Reason Builder selection and Golden reason arrays,
- no-Golden-backsolving,
- fixed-fixture isolation.

The canonical Golden regression anchors are:

```text
G-001
Mojito > Tom Collins

G-002
Piña Colada > Tequila Sunrise
Piña Colada > Mojito
Piña Colada > Espresso Martini

G-003
Old Fashioned > Manhattan
Old Fashioned > Dry Martini
Manhattan ↔ Dry Martini

G-004
Negroni > Americano
Americano > Mezcal Margarita
Negroni > Mezcal Margarita

G-005
Tom Collins = Mojito
```

These relationships describe semantic recommendation behavior.

They do not require a complete total order across all candidates.
