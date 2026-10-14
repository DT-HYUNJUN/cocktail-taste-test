Status: Accepted  
Version: v1  
Phase: 1  
Last Updated: 2026-10-11

# Golden Cases

Golden Cases v1 defines the canonical representative semantic regression suite for Recommendation v1.

Golden Cases are not complete ranking snapshots.

They protect meaningful domain behavior across:

- canonical `UserTasteProfile` expectations,
- fixed versioned `CocktailProfile` fixtures,
- Ranking Policy v1,
- structured positive-only recommendation reasons.

Golden expectations describe semantic recommendation relationships rather than incidental implementation output or technical presentation order.

---

# 1. Golden Principles

## GOLDEN-001 — Semantic Behavior, Not Score Snapshots

Golden Cases protect semantic recommendation behavior.

They do not freeze internal calculation values such as:

```text
rankingScore
averageDistance
coreSimilarity
flavorAdjustment
baseAdjustment
secondaryAdjustment
```

Equivalent future internal implementation values are also excluded unless a later domain version explicitly promotes them into the canonical specification.

---

## GOLDEN-002 — Fixed Fixtures

Golden Tests use fixed versioned CocktailProfile fixtures.

They must not depend directly on a mutable production dataset.

This prevents unrelated production-data changes from silently changing canonical Golden behavior.

---

## GOLDEN-003 — No Golden Backsolving

Cocktail fixtures must not be authored or modified merely to make an existing Golden expectation pass.

Fixture values are authored independently from expected ranking outcomes.

When independently authored fixture evidence conflicts with an existing Golden expectation:

```text
Fixture Evidence
      ↓
Ranking Policy
      ↓
Observed Semantic Relationship
      ↓
Review Fixture
      ↓
Review Domain Policy
      ↓
Correct Canonical Expectation if required
```

The expected result must not be used to reverse-engineer fixture values.

---

## GOLDEN-004 — Partial Profiles Stay Partial

Unknown user Core Dimensions remain absent.

They must not be:

- replaced with neutral `3`,
- inferred from unrelated answers,
- interpreted as exact matches,
- used to manufacture ranking differences.

Golden expectations compare only applicable evidence.

---

## GOLDEN-005 — Reasons Are Evidence-Based

Golden reason expectations protect actual permitted recommendation evidence.

Reasons must not be fabricated from:

- presentation position,
- unavailable user preference,
- unknown user dimension,
- unsupported Flavor evidence,
- unsupported BaseSpirit evidence.

Reason Builder remains independently versioned from Ranking Policy.

---

# 2. Semantic Ranking Notation

Golden ranking expectations describe semantic recommendation relationships, not raw array positions.

## Dominance

```text
A > B
```

means:

> `A` semantically dominates `B` under Ranking Policy v1.

For close-Core candidates this requires applicable ranking evidence to be no worse for `A` and better in at least one applicable comparison.

A material Core advantage follows the Core-priority rule independently of secondary evidence.

---

## Semantic Tie

```text
A = B
```

means:

> all applicable Ranking Policy evidence is identical.

Neither candidate is semantically superior.

---

## Semantic Incomparability

```text
A ↔ B
```

means:

> different applicable evidence favors different candidates and neither candidate dominates the other.

Semantic incomparability is not semantic tie.

For example:

```text
A
→ better Core evidence

B
→ better preferred Flavor and/or BaseSpirit evidence

Core gap remains within close-Core boundary
```

may produce:

```text
A ↔ B
```

rather than forcing either candidate to win.

---

## Presentation Order

Candidates within the same semantic layer may still have deterministic technical presentation ordering.

That ordering is not a Golden semantic expectation unless explicitly stated otherwise.

Therefore:

```text
presentation(A) before presentation(B)
```

does not imply:

```text
A > B
```

---

# 3. Canonical Personas

Scores use the canonical Core Dimension order:

```text
sweet
sour
bitter
alcoholIntensity
refreshing
```

The Phase 1 Golden personas are:

| ID    | Persona              | Core Profile                          |
| ----- | -------------------- | ------------------------------------- |
| G-001 | Bright & Refreshing  | `1, 5, 1, 1, 5`                       |
| G-002 | Sweet & Tropical     | `5, 1, 1, 1, 2`                       |
| G-003 | Dry & Spirit-forward | `1, 1, 3, 5, 1`                       |
| G-004 | Bitter & Smoky       | `1, 1, 5, 3, 3`                       |
| G-005 | Uncertain Beginner   | partial: `sour = 4`, `refreshing = 5` |

These profiles are semantic Golden expectations.

Assessment v1 now defines canonical Question IDs and Answer IDs. The five Golden personas can be represented as complete eight-question Assessment submissions; unknown Core answers remain absent in the transformed profile. See Section 15 for canonical input fixtures.

---

# 4. Canonical Golden Cocktail Fixtures v1

Golden Cocktail Fixtures v1 are independently authored fixed `CocktailProfile` fixtures.

Core values use:

```text
sweet, sour, bitter, alcoholIntensity, refreshing
```

| Fixture ID         | Cocktail         | Core            | Flavor           | BaseSpirit |
| ------------------ | ---------------- | --------------- | ---------------- | ---------- |
| `mojito`           | Mojito           | `3, 4, 1, 2, 5` | citrus, herbal   | rum        |
| `tom-collins`      | Tom Collins      | `3, 4, 1, 2, 5` | citrus           | gin        |
| `negroni`          | Negroni          | `2, 1, 5, 4, 2` | herbal           | gin        |
| `margarita`        | Margarita        | `2, 5, 1, 3, 4` | citrus           | tequila    |
| `mezcal-margarita` | Mezcal Margarita | `2, 5, 1, 3, 4` | citrus, smoky    | mezcal     |
| `pina-colada`      | Piña Colada      | `5, 2, 1, 2, 3` | tropical, creamy | rum        |
| `tequila-sunrise`  | Tequila Sunrise  | `4, 2, 1, 2, 3` | fruity           | tequila    |
| `espresso-martini` | Espresso Martini | `3, 1, 3, 4, 1` | coffee           | vodka      |
| `old-fashioned`    | Old Fashioned    | `2, 1, 3, 5, 1` | spicy            | whiskey    |
| `manhattan`        | Manhattan        | `3, 1, 2, 4, 1` | spicy            | whiskey    |
| `dry-martini`      | Dry Martini      | `1, 1, 1, 5, 2` | herbal           | gin        |
| `americano`        | Americano        | `2, 1, 5, 2, 4` | herbal           | none       |

`none` means that the fixture contains no canonical BaseSpirit presence signal.

It must not be replaced with a fabricated BaseSpirit merely to produce ranking or reason evidence.

These fixture values are canonical for Golden Cocktail Fixtures v1.

They must not be silently recalibrated to preserve an expected Golden ranking.

---

# 5. G-001 — Bright & Refreshing

## UserTasteProfile Expectation

Core:

```text
sweet             1
sour              5
bitter            1
alcoholIntensity  1
refreshing        5
```

Preferred Flavor:

```text
citrus
herbal
```

Avoided Flavor:

```text
smoky
```

No BaseSpirit preference is required by this Golden Case.

---

## Ranking Expectations

The following semantic relationships are required:

```text
Mojito > Tom Collins

Mojito > Negroni

Tom Collins > Negroni

Margarita > Mezcal Margarita
```

For `Mojito` and `Tom Collins`, canonical fixture Core evidence is identical.

```text
Mojito Core distance
=
Tom Collins Core distance
```

Both match preferred `citrus`.

`Mojito` additionally matches preferred `herbal`.

Neither candidate introduces an applicable avoided-Flavor disadvantage.

Therefore:

```text
Mojito > Tom Collins
```

This protects same-Core semantic dominance through preferred Flavor evidence.

`Margarita > Mezcal Margarita` additionally protects avoided Flavor evidence: the otherwise closely matched Mezcal Margarita contains canonical `smoky` presence.

---

## Reason Expectations

Golden assertions distinguish *qualifying positive evidence* from *emitted structured reasons*. Reason Builder v1 selects Core dimensions only when `dimensionDistance <= 1`, orders them by ascending distance, descending `|userScore - 3|`, then canonical dimension order (`sweet`, `sour`, `bitter`, `alcoholIntensity`, `refreshing`), and emits at most two. Flavor reasons use canonical Flavor vocabulary order (up to two); BaseSpirit reasons use canonical BaseSpirit vocabulary order (up to one). The order of multi-select answers does not determine reason selection. Groups appear in Core → Flavor → BaseSpirit order. Avoided Flavor evidence never becomes a positive reason.

Expected final structured reasons for `Mojito` under Reason Builder v1 (in group and item order):

```text
Core:
- bitter
- refreshing

Flavor:
- citrus
- herbal
```

Reasons must derive from actual fixture evidence.

No unsupported BaseSpirit reason is required.

Avoided Flavor evidence may affect ranking where applicable but must not be transformed into a fabricated positive reason.

---

# 6. G-002 — Sweet & Tropical

## UserTasteProfile Expectation

Core:

```text
sweet             5
sour              1
bitter            1
alcoholIntensity  1
refreshing        2
```

Preferred Flavor:

```text
tropical
creamy
```

Avoided Flavor:

```text
coffee
```

Preferred BaseSpirit:

```text
rum
```

---

## Ranking Expectations

The canonical semantic relationships are:

```text
Piña Colada > Tequila Sunrise

Piña Colada > Mojito

Piña Colada > Espresso Martini
```

These relationships protect clear multi-signal positive recommendation behavior without requiring a complete ranking snapshot of every fixture.

`Piña Colada` receives applicable evidence from:

```text
Core match
+
preferred tropical
+
preferred creamy
+
preferred rum
```

where supported by the canonical fixture.

---

## Reason Expectations

Expected final structured reasons for `Piña Colada` under Reason Builder v1 (in group and item order):

```text
Core:
- sweet
- bitter

Flavor:
- tropical
- creamy

BaseSpirit:
- rum
```

The avoided `coffee` preference may participate in ranking evidence where applicable, but negative evidence must not be fabricated as a positive recommendation reason.

---

# 7. G-003 — Dry & Spirit-forward

## UserTasteProfile Expectation

Core:

```text
sweet             1
sour              1
bitter            3
alcoholIntensity  5
refreshing        1
```

Preferred Flavor:

```text
spicy
```

Preferred BaseSpirit:

```text
whiskey
```

---

## Ranking Expectations

The canonical semantic relationships are:

```text
Old Fashioned > Manhattan

Old Fashioned > Dry Martini

Manhattan ↔ Dry Martini
```

### Old Fashioned vs Manhattan

Canonical total Core distances are:

```text
Old Fashioned  1
Manhattan      4
```

The Core-distance gap is greater than the close-Core boundary.

Therefore material Core priority requires:

```text
Old Fashioned > Manhattan
```

Secondary evidence cannot overturn or block this relationship.

---

### Old Fashioned vs Dry Martini

Canonical total Core distances are:

```text
Old Fashioned  1
Dry Martini    3
```

The Core-distance gap is greater than the close-Core boundary.

Therefore:

```text
Old Fashioned > Dry Martini
```

---

### Manhattan vs Dry Martini

Canonical total Core distances are:

```text
Manhattan    4
Dry Martini  3
```

The Core-distance gap is:

```text
1
```

and therefore remains inside the close-Core boundary.

Applicable evidence conflicts:

```text
Dry Martini
→ better Core evidence

Manhattan
→ preferred spicy match
→ preferred whiskey match
```

Neither candidate dominates the other under Ranking Policy v1.

Therefore:

```text
Manhattan ↔ Dry Martini
```

They are semantically incomparable, not semantically tied.

This is the canonical realistic close-Core secondary-trade-off Golden case.

---

## Reason Expectations

Expected final structured reasons for `Old Fashioned` under Reason Builder v1 (in group and item order):

```text
Core:
- sour
- alcoholIntensity

Flavor:
- spicy

BaseSpirit:
- whiskey
```

The other qualifying Core dimensions remain valid underlying evidence but are not emitted once the two-item Core reason limit is reached. Reason Builder selection is independent of ranking.

Golden ranking superiority alone must not create a reason.

For `Manhattan`, `spicy` and `whiskey` are valid positive evidence where the Reason Builder contract permits them.

For `Dry Martini`, no `spicy` or `whiskey` reason may be fabricated.

---

# 8. G-004 — Bitter & Smoky

## UserTasteProfile Expectation

Core:

```text
sweet             1
sour              1
bitter            5
alcoholIntensity  3
refreshing        3
```

Preferred Flavor:

```text
herbal
smoky
```

Avoided Flavor:

```text
creamy
```

Preferred BaseSpirit:

```text
gin
mezcal
```

---

## Ranking Expectations

The canonical semantic relationships are:

```text
Negroni > Americano

Americano > Mezcal Margarita

Negroni > Mezcal Margarita
```

For `Negroni` and `Americano`, canonical Core distance is identical.

Both provide preferred `herbal` Flavor evidence.

Neither provides an applicable `creamy` collision.

`Negroni` additionally provides preferred `gin` BaseSpirit evidence.

Therefore:

```text
Negroni > Americano
```

This protects same-Core semantic dominance through preferred BaseSpirit evidence.

The user's `smoky` and `mezcal` preferences do not automatically make Mezcal Margarita superior when material Core evidence favors the bitter-profile candidates.

Core priority remains authoritative.

---

## Reason Expectations

Expected final structured reasons for `Americano` under Reason Builder v1 (in group and item order):

```text
Core:
- sour
- bitter

Flavor:
- herbal
```

Do not fabricate:

```text
smoky
gin
mezcal
```

reasons for `Americano`.

Canonical positive evidence for `Negroni` may additionally include:

```text
BaseSpirit:
- gin
```

where permitted by the Reason Builder contract.

A user preference alone is never sufficient reason evidence.

---

# 9. G-005 — Uncertain Beginner

G-005 is the canonical partial-profile Golden Case.

## UserTasteProfile Expectation

Known Core Dimensions:

```text
sour        4
refreshing  5
```

All other Core Dimensions remain absent.

Specifically, do not create:

```text
sweet             3
bitter            3
alcoholIntensity  3
```

or any other default values.

No Flavor or BaseSpirit preference is required unless canonical Assessment evidence explicitly provides it.

---

## Ranking Expectations

For the known partial profile, `Tom Collins` and `Mojito` have identical applicable Ranking Policy evidence under the canonical fixture scenario.

Known Core:

```text
              sour   refreshing

Tom Collins     4         5
Mojito          4         5
```

Unknown Core Dimensions must not be used to distinguish them.

No applicable user Flavor or BaseSpirit preference distinguishes the two.

Therefore:

```text
Tom Collins = Mojito
```

They are semantically tied.

A deterministic presentation order may place either candidate first according to the accepted technical ordering policy.

That position does not imply semantic superiority.

This differs intentionally from G-001.

```text
G-001
Mojito > Tom Collins
→ identical Core evidence plus preferred Flavor advantage

G-005
Tom Collins = Mojito
→ identical applicable evidence
```

The difference originates from the user evidence available in each Golden Case.

---

## Reason Expectations

Expected final Core reason for both `Mojito` and `Tom Collins` (ordered according to Reason Builder v1):

```text
Core:
- refreshing
- sour
```

Do not generate reasons from unknown dimensions.

Do not create Flavor or BaseSpirit reasons without corresponding user and cocktail evidence.

---

# 10. Cross-Golden Ranking Expectations

The five Golden Cases collectively protect different recommendation behaviors.

| Golden | Primary behavior protected                                |
| ------ | --------------------------------------------------------- |
| G-001  | same-Core dominance through preferred Flavor              |
| G-002  | clear multi-signal positive recommendation                |
| G-003  | material Core priority and close-Core secondary trade-off |
| G-004  | same-Core dominance through preferred BaseSpirit          |
| G-005  | partial profile and true semantic tie                     |

Together they provide realistic Golden coverage for:

```text
semantic dominance
semantic incomparability
semantic tie
material Core dominance
preferred Flavor evidence
avoided Flavor evidence
preferred BaseSpirit evidence
partial-profile absence semantics
```

In particular:

```text
G-001
Mojito > Tom Collins
→ same-Core + Flavor dominance

G-003
Manhattan ↔ Dry Martini
→ close-Core Core-vs-secondary incomparability

G-004
Negroni > Americano
→ same-Core + BaseSpirit dominance

G-005
Tom Collins = Mojito
→ identical applicable evidence
```

These relationships must remain distinct in tests.

---

# 11. Golden vs Ranking Policy Tests

Golden Cases do not replace synthetic Ranking Policy tests.

Synthetic tests must separately protect boundaries such as:

```text
Core gap = 0
Core gap = 1
Core gap = 2

secondary advantage
secondary trade-off

tie
incomparability
dominance

non-dominated layer construction
deterministic presentation ordering
```

Golden Cases instead verify that those rules produce sensible canonical behavior for representative users and independently authored cocktail fixtures.

A behavior disappearing from one Golden Case is not a reason to remove its synthetic Ranking Policy test.

---

# 12. Golden vs Reason Builder Tests

Golden Cases may specify expected positive reason evidence.

However, detailed Reason Builder behavior remains covered by the canonical Reason Builder specification and its dedicated tests.

Golden Cases must not infer recommendation reasons from:

```text
ranking position
semantic layer
technical tie-break
candidate popularity
production dataset order
```

Reason evidence must originate from the accepted recommendation evidence model.

---

# 13. Fixed Fixture Policy

Golden Tests must use Golden Cocktail Fixtures v1 or an explicitly accepted later fixture version.

They must not depend directly on a mutable production dataset.

Conceptually:

```text
Golden Persona
      +
Versioned Cocktail Fixtures
      +
Ranking Policy v1
      ↓
Stable Semantic Expectations
```

Production dataset validation is a separate concern.

Fixture changes are domain changes when they alter canonical recommendation evidence.

Such changes require explicit review.

---

# 14. Executable Fixture Requirements

A Golden Case becomes fully executable when the repository contains enough canonical information to construct its complete inputs.

Required information includes:

```text
Assessment version

AssessmentAnswer IDs
        ↓
Expected UserTasteProfile

Golden Cocktail Fixture IDs
        ↓
CocktailProfile fixtures

Ranking Policy version

Expected semantic relations

Expected reason evidence
```

Tests should reference stable fixture IDs rather than display names.

Golden Cocktail Fixtures v1 now defines stable cocktail fixture IDs and complete canonical CocktailProfile fixture values for the twelve Phase 1 Golden cocktails.

---

# 15. Assessment Trace and Remaining Documentation Gaps

Assessment v1 defines all eight canonical Question IDs and their valid Answer IDs. Golden Cocktail Fixtures v1 defines the twelve fixed cocktail profiles. The previously recorded gap for exact Assessment Answer IDs is therefore resolved at the **documentation-contract level**; it is not evidence that automated tests have run.

## 15.1 Canonical Assessment Answers for Golden Personas

The following table defines complete, valid Assessment v1 submissions. Core Answer IDs use `very-low=1`, `low=2`, `medium=3`, `high=4`, `very-high=5`, and `unknown=absent`.

| Question ID | G-001 | G-002 | G-003 | G-004 | G-005 |
| --- | --- | --- | --- | --- | --- |
| `sweet` | `very-low` | `very-high` | `very-low` | `very-low` | `unknown` |
| `sour` | `very-high` | `very-low` | `very-low` | `very-low` | `high` |
| `bitter` | `very-low` | `very-low` | `medium` | `very-high` | `unknown` |
| `alcohol-intensity` | `very-low` | `very-low` | `very-high` | `medium` | `unknown` |
| `refreshing` | `very-high` | `low` | `very-low` | `medium` | `very-high` |
| `preferred-flavors` | `citrus, herbal` | `tropical, creamy` | `spicy` | `herbal, smoky` | `[]` |
| `avoided-flavors` | `smoky` | `coffee` | `[]` | `creamy` | `[]` |
| `preferred-base-spirits` | `[]` | `rum` | `whiskey` | `gin, mezcal` | `[]` |

Each column denotes exactly one response for each of the eight Question IDs. Scale questions use `answerId`; multi-select questions use `answerIds`, including empty arrays. The displayed comma-separated values represent ordered arrays, not scalar strings.

For G-005, `unknown` answers are explicitly present in the submitted Assessment payload, but the corresponding three Core dimensions are **absent** from the resulting `UserTasteProfile`. A complete eight-question submission is compatible with a partial taste profile.

## 15.2 Assessment-to-Profile Assertions

For each G-001 through G-005, the Assessment Transformer must produce the exact `UserTasteProfile` specified in Sections 5–9. The tests must verify:

- all eight Question IDs occur exactly once;
- valid Answer IDs map directly to the canonical `TasteScore` or secondary preference arrays;
- `unknown` does not produce score `3` or any other score;
- Flavor and BaseSpirit preferences are not inferred from Core answers;
- preferred and avoided Flavor sets are disjoint;
- all secondary values use the canonical vocabulary;
- the output is deterministic for semantically identical valid submissions.

## 15.3 Executability Status

The **documentation inputs** are now complete for the five canonical Assessment traces and the twelve fixed CocktailProfile fixtures. Full automated Golden execution still requires corresponding repository fixtures and implemented tests. Do not claim an executable PASS until those tests have run successfully.

The separate missing seventh BaseSpirit vocabulary value remains an acknowledged domain documentation gap and is not invented by this Golden specification.

---

# 16. Golden Change Policy

Never update a Golden expectation merely to match implementation output.

When a Golden Test fails:

```text
Golden Test Failure
        ↓
Inspect Implementation
        ↓
Inspect Ranking / Domain Policy
        ↓
Is Existing Behavior Wrong?
       ↙             ↘
     YES              NO
      ↓                ↓
Fix Implementation   Is Domain Behavior
                     Intentionally Changing?
                            ↓
                          YES
                            ↓
                  Update Canonical Domain Decision
                            ↓
                     Record the Reason
                            ↓
                  Update Golden Expectation
```

Implementation output is not the source of truth for Golden behavior.

Fixture values must also not be backsolved from expected output.

---

## 2026-10-05 Golden Fixture Calibration

Golden Cocktail Fixtures v1 were independently authored and evaluated against Ranking Policy v1.

That review identified three stale semantic assumptions in the previous Golden expectations.

Canonical corrections:

```text
G-001

OLD
Mojito ↔ Tom Collins

NEW
Mojito > Tom Collins
```

```text
G-003

OLD
Manhattan > Dry Martini

NEW
Manhattan ↔ Dry Martini
```

```text
G-004

OLD
Americano ↔ Negroni

NEW
Negroni > Americano
```

These changes were not made to match implementation output.

They resulted from:

```text
independent fixture authoring
        ↓
Ranking Policy v1 evaluation
        ↓
semantic conflict detection
        ↓
fixture review
        ↓
Ranking Policy review
        ↓
canonical expectation correction
```

Ranking Policy v1 remained unchanged.

---

# 17. Versioning Policy

A Golden Case must be reviewed when any canonical dependency changes materially.

Examples:

```text
Assessment definition
Assessment transformation rules
UserTasteProfile semantics
CocktailProfile semantics
Flavor vocabulary
BaseSpirit vocabulary
Ranking Policy
Reason Builder policy
Golden fixture profiles
```

A meaningful semantic change may require:

- Golden expectation update,
- fixture version update,
- Ranking Policy version update,
- Assessment version update,
- Reason Builder version update,
- ADR or equivalent decision record.

Version changes must reflect domain semantics rather than implementation refactors.

The 2026-10-05 expectation corrections remain within Golden Cases v1 because they complete and calibrate the accepted Phase 1 specification against the first canonical independently authored fixture set; they do not introduce Ranking Policy v2 or a new recommendation model.

---

# 18. Phase 1 Acceptance

Golden Cases v1 are accepted when they protect:

- five canonical personas,
- five Core Taste Dimensions,
- partial-profile absence semantics,
- preferred Flavor evidence,
- avoided Flavor evidence,
- preferred BaseSpirit evidence,
- Core priority,
- close-Core semantic incomparability,
- semantic ties,
- semantic dominance,
- material Core dominance,
- structured positive-only reasons,
- deterministic but non-semantic presentation ordering,
- fixed-fixture isolation,
- no-Golden-backsolving,
- intentional Golden change policy.

The canonical Phase 1 cases are:

```text
G-001 Bright & Refreshing
G-002 Sweet & Tropical
G-003 Dry & Spirit-forward
G-004 Bitter & Smoky
G-005 Uncertain Beginner
```

Together with Golden Cocktail Fixtures v1 and the Assessment v1 answer traces in Section 15, they define the representative semantic regression suite for Recommendation v1. These are specification-level acceptance conditions, not a claim that tests have already passed.
