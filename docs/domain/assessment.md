Status: Accepted
Version: v1
Phase: 1
Last Updated: 2026-10-01

# Assessment

## 1. Purpose

Assessment는 사용자가 표현한 칵테일 취향을 `UserTasteProfile`로 변환하기 위한 입력 모델이다.

Assessment v1의 목적은 사용자의 숨겨진 취향을 추측하는 것이 아니다. 사용자가 명시적으로 표현한 취향 evidence만 수집하고 이를 Recommendation Domain에서 사용할 수 있는 일관된 `UserTasteProfile`로 변환한다.

```text
AssessmentAnswer[]
        ↓
Assessment Transformer
        ↓
UserTasteProfile
        ↓
Recommendation
```

Assessment v1은 scenario 기반 추론이나 weighted scoring을 사용하지 않는다.

## 2. Design Principles

### AD-001 — Eight Questions
Assessment v1은 총 8개의 질문으로 구성한다.

```text
Q1  Sweet
Q2  Sour
Q3  Bitter
Q4  Alcohol Intensity
Q5  Refreshing
Q6  Preferred Flavors
Q7  Avoided Flavors
Q8  Preferred Base Spirits
```

### AD-002 — Direct Core Measurement
Q1~Q5는 각각 하나의 Core Taste Dimension을 직접 측정한다. 하나의 Core 질문이 다른 Core Dimension을 암묵적으로 생성하지 않는다.

### AD-003 — Taste Score
알려진 Core preference는 `TasteScore = 1 | 2 | 3 | 4 | 5`를 사용한다.

### AD-004 — Unknown Is Not Neutral
Core 질문에는 `unknown` 응답을 허용한다. `unknown`은 `TasteScore = 3`을 의미하지 않는다.

```text
medium  → known preference → score 3
unknown → no evidence       → dimension absent
```

### AD-005 — Preferred Flavor
Q6은 사용자가 특히 선호하는 Flavor를 수집한다. `preferredFlavors`는 `0..2`개의 unique canonical Flavor를 허용한다.

### AD-006 — Avoided Flavor
Q7은 사용자가 피하고 싶은 Flavor를 수집한다. 고정된 선택 개수 제한을 두지 않으며 canonical Flavor Vocabulary 안에서 zero or more unique Flavor values를 허용한다.

### AD-007 — Preferred Base Spirit
Q8은 사용자가 특히 선호하거나 끌리는 BaseSpirit을 수집한다. `preferredBaseSpirits`는 `0..2`개의 unique canonical BaseSpirit을 허용한다.

### AD-008 — Secondary Signals Do Not Create Core Scores
Flavor 및 BaseSpirit 선택은 Core `TasteScore`를 생성하지 않는다.

```text
citrus preference ≠ sour preference
smoky preference ≠ bitter preference
mezcal preference ≠ smoky preference
```

### AD-009 — No Inference
Assessment Transformer는 사용자가 명시하지 않은 TasteScore, Flavor 또는 BaseSpirit preference를 추론하지 않는다.

### AD-010 — Flavor Preference Conflict
동일한 Flavor가 `preferredFlavors`와 `avoidedFlavors`에 동시에 존재할 수 없다.

```text
preferredFlavors ∩ avoidedFlavors = ∅
```

### AD-011 — Determinism
동일한 semantic Assessment input은 항상 동일한 `UserTasteProfile`을 생성해야 한다. Question 또는 multi-select value의 입력 순서는 preference strength를 의미하지 않는다.

## 3. Question IDs

```ts
type AssessmentQuestionId =
  | "sweet"
  | "sour"
  | "bitter"
  | "alcohol-intensity"
  | "refreshing"
  | "preferred-flavors"
  | "avoided-flavors"
  | "preferred-base-spirits";
```

화면의 `Q1`~`Q8`은 presentation order이며 Domain identity가 아니다.

## 4. Core Answer IDs

Q1~Q5는 동일한 semantic scale Answer ID를 사용한다.

| Answer ID | TasteScore |
|---|---:|
| `very-low` | 1 |
| `low` | 2 |
| `medium` | 3 |
| `high` | 4 |
| `very-high` | 5 |
| `unknown` | absent |

## 5. Q1 — Sweet

**Question ID:** `sweet`

> 칵테일의 단맛은 어느 정도가 좋아요?

| Answer ID | User-facing label | Evidence |
|---|---|---|
| `very-low` | 거의 달지 않은 게 좋아요 | `sweet: 1` |
| `low` | 단맛은 살짝만 있으면 좋아요 | `sweet: 2` |
| `medium` | 적당히 달콤한 게 좋아요 | `sweet: 3` |
| `high` | 꽤 달콤한 게 좋아요 | `sweet: 4` |
| `very-high` | 확실하게 달콤한 게 좋아요 | `sweet: 5` |
| `unknown` | 잘 모르겠어요 | no evidence |

## 6. Q2 — Sour

**Question ID:** `sour`

> 새콤한 맛은 어느 정도가 좋아요?

| Answer ID | User-facing label | Evidence |
|---|---|---|
| `very-low` | 신맛은 거의 없는 게 좋아요 | `sour: 1` |
| `low` | 은은한 산미 정도가 좋아요 | `sour: 2` |
| `medium` | 적당히 새콤한 게 좋아요 | `sour: 3` |
| `high` | 꽤 새콤한 게 좋아요 | `sour: 4` |
| `very-high` | 입맛이 확 살아날 만큼 새콤한 게 좋아요 | `sour: 5` |
| `unknown` | 잘 모르겠어요 | no evidence |

## 7. Q3 — Bitter

**Question ID:** `bitter`

> 쌉싸름한 맛은 어느 정도가 좋아요?

| Answer ID | User-facing label | Evidence |
|---|---|---|
| `very-low` | 쓴맛은 없는 게 좋아요 | `bitter: 1` |
| `low` | 아주 약하면 괜찮아요 | `bitter: 2` |
| `medium` | 적당한 쌉싸름함은 좋아요 | `bitter: 3` |
| `high` | 쌉싸름한 맛을 꽤 좋아해요 | `bitter: 4` |
| `very-high` | 강한 쓴맛도 즐기는 편이에요 | `bitter: 5` |
| `unknown` | 잘 모르겠어요 | no evidence |

## 8. Q4 — Alcohol Intensity

**Question ID:** `alcohol-intensity`

> 술의 맛과 향은 얼마나 느껴지는 게 좋아요?

| Answer ID | User-facing label | Evidence |
|---|---|---|
| `very-low` | 술맛이 거의 느껴지지 않는 게 좋아요 | `alcoholIntensity: 1` |
| `low` | 술맛은 은은한 정도가 좋아요 | `alcoholIntensity: 2` |
| `medium` | 적당히 느껴지는 게 좋아요 | `alcoholIntensity: 3` |
| `high` | 술의 존재감이 뚜렷한 게 좋아요 | `alcoholIntensity: 4` |
| `very-high` | 강하고 진한 술맛을 좋아해요 | `alcoholIntensity: 5` |
| `unknown` | 잘 모르겠어요 | no evidence |

`alcoholIntensity`는 실제 ABV가 아니라 완성된 칵테일에서 사용자가 인지하는 술의 맛과 향의 존재감에 대한 선호다.

## 9. Q5 — Refreshing

**Question ID:** `refreshing`

> 가볍고 청량한 느낌은 얼마나 좋아하나요?

| Answer ID | User-facing label | Evidence |
|---|---|---|
| `very-low` | 묵직하고 진한 쪽이 더 좋아요 | `refreshing: 1` |
| `low` | 청량감은 적은 편이 좋아요 | `refreshing: 2` |
| `medium` | 어느 쪽이든 적당한 게 좋아요 | `refreshing: 3` |
| `high` | 가볍고 산뜻한 칵테일이 좋아요 | `refreshing: 4` |
| `very-high` | 아주 시원하고 청량한 느낌이 좋아요 | `refreshing: 5` |
| `unknown` | 잘 모르겠어요 | no evidence |

## 10. Q6 — Preferred Flavors

**Question ID:** `preferred-flavors`

> 어떤 풍미에 가장 끌리나요?

최대 2개까지 선택한다.

| Answer ID | User-facing label |
|---|---|
| `citrus` | 레몬·라임처럼 상큼한 시트러스 |
| `fruity` | 복숭아·베리처럼 풍부한 과일향 |
| `tropical` | 파인애플·코코넛 같은 열대 풍미 |
| `herbal` | 민트·허브처럼 싱그러운 향 |
| `floral` | 꽃처럼 향긋하고 은은한 향 |
| `creamy` | 부드럽고 크리미한 느낌 |
| `coffee` | 커피처럼 진하고 로스티한 풍미 |
| `spicy` | 생강·향신료처럼 알싸한 풍미 |
| `smoky` | 훈연향이 느껴지는 스모키한 풍미 |

선택은 `preferredFlavors`로 직접 mapping한다. Empty selection은 valid하며 별도의 Domain-level `none` Flavor를 정의하지 않는다.

## 11. Q7 — Avoided Flavors

**Question ID:** `avoided-flavors`

> 반대로, 가능하면 피하고 싶은 풍미가 있나요?

해당하는 풍미를 모두 선택할 수 있으며 없다면 선택하지 않아도 된다. Q6과 동일한 canonical Flavor Vocabulary를 사용한다.

선택은 `avoidedFlavors`로 직접 mapping한다. Assessment Domain은 arbitrary maximum avoidance count를 강제하지 않으며 모든 값은 unique canonical Flavor여야 한다.

## 12. Q8 — Preferred Base Spirits

**Question ID:** `preferred-base-spirits`

> 좋아하거나 평소 끌리는 베이스 술이 있나요?

최대 2개까지 선택한다. 잘 모르겠다면 선택하지 않아도 된다.

현재 확인된 BaseSpirit Vocabulary v1 values:

```text
gin
vodka
rum
tequila
whiskey
mezcal
```

일곱 번째 BaseSpirit value는 별도의 Documentation Gap으로 유지한다. 선택은 `preferredBaseSpirits`로 직접 mapping하며 empty selection은 valid하다.

## 13. Assessment Answer Model

```ts
type ScaleAssessmentAnswer = {
  questionId:
    | "sweet"
    | "sour"
    | "bitter"
    | "alcohol-intensity"
    | "refreshing";
  answerId:
    | "very-low"
    | "low"
    | "medium"
    | "high"
    | "very-high"
    | "unknown";
};

type MultiSelectAssessmentAnswer = {
  questionId:
    | "preferred-flavors"
    | "avoided-flavors"
    | "preferred-base-spirits";
  answerIds: string[];
};

type AssessmentAnswer =
  | ScaleAssessmentAnswer
  | MultiSelectAssessmentAnswer;
```

이 타입은 Domain contract를 설명하기 위한 conceptual representation이다. 실제 TypeScript 구현 형태 및 runtime validation library는 implementation phase에서 결정할 수 있다.

## 14. Submission Invariants

- **AT-001 — Complete Response Set:** 8개의 Question response가 모두 존재해야 한다. Partial `UserTasteProfile`은 허용하지만 incomplete Assessment payload는 허용하지 않는다.
- **AT-002 — Exactly Once:** 각 Question ID는 submission 안에서 정확히 한 번 존재해야 한다.
- **AT-003 — Unknown Preservation:** Core `unknown`은 해당 Dimension을 생성하지 않는다.
- **AT-004 — Empty Secondary Selection:** Secondary question의 empty selection은 valid하다.
- **AT-005 — Preferred Flavor Cardinality:** `preferred-flavors`는 최대 2개의 unique Flavor를 허용한다.
- **AT-006 — Avoided Flavor Cardinality:** `avoided-flavors`는 canonical Flavor Vocabulary 범위 안에서 zero or more unique values를 허용한다.
- **AT-007 — Preferred BaseSpirit Cardinality:** `preferred-base-spirits`는 최대 2개의 unique BaseSpirit을 허용한다.
- **AT-008 — Duplicate Selection:** 동일 multi-select answer 안의 duplicate value는 invalid다. Transformer가 조용히 deduplicate하지 않는다.
- **AT-009 — Canonical Vocabulary Only:** 등록되지 않은 Flavor 또는 BaseSpirit value는 invalid다.
- **AT-010 — Question / Answer Type Match:** Scale Question과 Multi-select Question은 각각 올바른 answer shape을 사용해야 한다.
- **AT-011 — Preferred / Avoided Conflict:** 동일 Flavor가 preferred와 avoided에 동시에 존재하면 invalid다.
- **AT-012 — Ordering Independence:** Question 배열과 multi-select value 순서는 Domain semantics나 preference strength를 가지지 않는다.
- **AT-013 — Deterministic Transformation:** 동일한 semantic Assessment input은 항상 동일한 `UserTasteProfile`을 생성한다.
- **AT-014 — No Implicit Preference:** Transformer는 Assessment input에 없는 preference를 생성하지 않는다.

## 15. Transformation

Assessment Transformer는 weighted scoring이나 aggregation을 수행하지 않는다.

```text
very-low   → 1
low        → 2
medium     → 3
high       → 4
very-high  → 5
unknown    → absent
```

Secondary answer도 직접 mapping한다.

```text
preferred-flavors     → preferredFlavors
avoided-flavors       → avoidedFlavors
preferred-base-spirits → preferredBaseSpirits
```

```text
AssessmentAnswer[]
        ↓
validate
        ↓
direct mapping
        ↓
UserTasteProfile
```

다음 단계는 존재하지 않는다: evidence weighting, score aggregation, normalization, rounding, clamping, scenario inference.

## 16. Example

```ts
[
  { questionId: "sweet", answerId: "very-low" },
  { questionId: "sour", answerId: "very-high" },
  { questionId: "bitter", answerId: "very-low" },
  { questionId: "alcohol-intensity", answerId: "very-low" },
  { questionId: "refreshing", answerId: "very-high" },
  { questionId: "preferred-flavors", answerIds: ["citrus", "herbal"] },
  { questionId: "avoided-flavors", answerIds: ["smoky"] },
  { questionId: "preferred-base-spirits", answerIds: [] },
]
```

Output:

```ts
{
  dimensions: {
    sweet: 1,
    sour: 5,
    bitter: 1,
    alcoholIntensity: 1,
    refreshing: 5,
  },
  preferredFlavors: ["citrus", "herbal"],
  avoidedFlavors: ["smoky"],
  preferredBaseSpirits: [],
}
```

## 17. Golden Validation

Assessment Definition v1은 기존 다섯 Golden Persona에 대해 검증되었다.

| Golden Case | Core Dimensions | Preferred Flavor | Avoided Flavor | BaseSpirit | Result |
|---|---|---|---|---|---|
| G-001 Bright & Refreshing | Match | Match | Match | Match | PASS |
| G-002 Sweet & Tropical | Match | Match | Match | Match | PASS |
| G-003 Dry & Spirit-forward | Match | Match | Match | Match | PASS |
| G-004 Bitter & Smoky | Match | Match | Match | Match | PASS |
| G-005 Uncertain Beginner | Partial profile preserved | Match | Match | Match | PASS |

G-005는 `unknown ≠ neutral` 원칙을 검증한다. Unknown Dimension을 `3`으로 채우지 않는다.

## 18. Deferred Decisions

Assessment v1에서는 다음을 결정하지 않는다.

- Scenario-based assessment
- Indirect preference inference
- Evidence weighting
- Question weighting
- Adaptive questions
- Dynamic question count
- Personalized question ordering
- User behavior based inference
- Production analytics model
- Runtime validation library
- Persistence representation
- Missing seventh BaseSpirit value

Scenario-based Assessment는 향후 실제 사용자 데이터가 충분할 경우 Assessment v2 experiment candidate로 검토할 수 있다.

## 19. Canonical Decision

Assessment Definition v1은 8개의 direct-preference question을 사용한다.

```text
5 Core Dimension Questions
+
Preferred Flavor
+
Avoided Flavor
+
Preferred BaseSpirit
=
8 Questions
```

Assessment v1의 책임은 사용자의 숨겨진 취향을 추측하는 것이 아니다. 사용자가 명시적으로 표현한 preference를 손실 없이 deterministic하게 `UserTasteProfile`로 변환하는 것이다.
