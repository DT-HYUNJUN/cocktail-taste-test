# Testing Strategy

> Phase 1 consolidation note (2026-10-01): [Golden Cases](../domain/golden-cases.md) is the canonical Golden specification. Its five `TasteDimension` values, partial-profile semantics, structured reasons, fixed-fixture policy, and change policy supersede older illustrative Golden examples in this document. In particular, do not interpret an unknown dimension as neutral, use Flavor intensity scores, or use complete ranking-score snapshots as Golden expectations.

## 1. Purpose

이 문서는 칵테일 취향 테스트 서비스의 테스트 전략을 정의한다.

테스트의 목적은 단순히 높은 Coverage를 달성하는 것이 아니다.

테스트는 다음을 보호해야 한다.

- Product Core Loop
- Domain Invariants
- Recommendation 신뢰성
- Application Use Case
- API Contract
- Architecture Boundary
- 주요 사용자 Interaction
- Production Build 가능 여부

테스트는 Codex와 개발자가 코드를 변경했을 때 다음 질문에 답할 수 있어야 한다.

> **"이 변경으로 기존 제품의 중요한 동작이 깨졌는가?"**

---

# 2. Testing Principles

## 2.1 Test Behavior, Not Implementation

구현 방식보다 외부에서 관찰 가능한 행동을 테스트한다.

Bad:

```ts
expect(service.calculateTasteProfile).toHaveBeenCalledTimes(1);
```

가능하면 다음을 선호한다.

```ts
expect(result.tasteProfile).toEqual(expectedProfile);
```

리팩터링만으로 테스트가 불필요하게 깨지는 것을 줄인다.

---

## 2.2 Protect Invariants First

모든 코드를 동일한 수준으로 테스트하지 않는다.

우선순위:

```text
Domain Invariants
       ↓
Core Use Cases
       ↓
API Boundaries
       ↓
Critical UI
       ↓
Supporting Code
```

특히 다음 영역은 강하게 보호한다.

```text
Assessment Completion
Taste Profile Calculation
Recommendation
Recommendation Explanation
Core User Loop
```

---

## 2.3 Deterministic Tests

테스트는 동일한 코드에서 반복 실행했을 때 동일한 결과를 만들어야 한다.

테스트에서 가능한 한 다음 요소를 통제한다.

- current time
- random value
- external API
- network
- database state

Recommendation 테스트에서 임의 데이터나 비결정적 결과를 사용하지 않는다.

---

## 2.4 Fast Local Feedback

대부분의 오류는 빠른 테스트에서 발견할 수 있어야 한다.

개발 중 기본 Feedback Loop:

```text
Code Change
    ↓
Relevant Test
    ↓
lint / typecheck
    ↓
pnpm check
```

E2E 테스트만으로 모든 문제를 발견하려 하지 않는다.

---

# 3. Test Pyramid

프로젝트는 다음과 같은 테스트 구성을 지향한다.

```text
                ┌─────────┐
                │   E2E   │
                └────┬────┘
                     │
              ┌──────┴──────┐
              │ Integration │
              └──────┬──────┘
                     │
          ┌──────────┴──────────┐
          │ Domain / Unit Tests │
          └─────────────────────┘
```

아래로 갈수록:

- 테스트 수가 많다.
- 실행 속도가 빠르다.
- 문제 원인을 찾기 쉽다.

위로 갈수록:

- 테스트 수가 적다.
- 실제 사용자 환경과 가까워진다.
- 여러 Layer의 통합을 검증한다.

---

# 4. Test Categories

프로젝트에서는 다음 Test Category를 사용한다.

```text
Domain Test
Application Test
Frontend Test
Integration Test
Contract Test
Golden Test
Architecture Test
E2E Test
Build Verification
```

각 테스트는 서로 다른 실패를 잡는다.

---

# 5. Domain Tests

Domain Test는 가장 중요한 테스트 계층이다.

다음과 같은 핵심 함수와 규칙을 검증한다.

```text
Answers
   ↓
Taste Profile

Taste Profile
   +
Cocktail Profile
   ↓
Match

Matches
   ↓
Ranking

Match
   ↓
Recommendation Reasons
```

Domain Test는 가능한 한 다음에 의존하지 않는다.

```text
NestJS
TypeORM
PostgreSQL
HTTP
Next.js
React
```

순수 TypeScript 수준에서 실행 가능하도록 한다.

---

# 6. Assessment Domain Tests

다음 Invariant를 보호한다.

### A-001

Session은 유효한 Assessment Version을 사용한다.

### A-002

Assessment에 존재하지 않는 Question에 Answer할 수 없다.

### A-003

Question에 존재하지 않는 Option을 선택할 수 없다.

### A-004

필수 Answer가 누락되면 Assessment를 완료할 수 없다.

### A-005

완료된 Assessment 결과의 입력을 임의로 변경할 수 없다.

대표 테스트:

```ts
describe("completeAssessment", () => {
  it("rejects an unknown question");

  it("rejects an option that does not belong to the question");

  it("rejects incomplete required answers");

  it("completes when every required answer is valid");
});
```

---

# 7. Taste Domain Tests

다음 Invariant를 보호한다.

### T-001

정의된 Taste Dimension만 사용한다.

### T-002

모든 Taste 값은 정의된 범위를 유지한다.

### T-003

동일한 입력은 동일한 Taste Profile을 생성한다.

### T-004

주요 Taste 결과를 Answer와 연결할 수 있다.

### T-005

Scoring Version을 추적할 수 있다.

대표 테스트:

```ts
describe("calculateTasteProfile", () => {
  it("produces the same profile for the same answers");

  it("keeps every dimension inside its valid range");

  it("rejects unknown taste dimensions");

  it("records the scoring version");
});
```

---

# 8. Recommendation Domain Tests

Recommendation은 프로젝트에서 가장 강하게 테스트해야 하는 영역 중 하나다.

다음 Invariant를 보호한다.

### R-001

동일한 Versioned Input은 동일한 결과를 생성한다.

### R-002

유효한 Cocktail만 Recommendation에 포함한다.

### R-003

Ranking은 항상 재현 가능하다.

### R-004

Recommendation Reason은 실제 positive matching evidence와 일치한다. Positive evidence가 없으면 빈 reason 목록을 허용한다.

### R-005

Recommendation Reason은 실제 Matching 결과와 일치한다.

### R-006

Recommendation Score는 정의된 범위를 유지한다.

대표 테스트:

```ts
describe("recommendCocktails", () => {
  it("returns deterministic results");

  it("returns only eligible cocktails");

  it("orders recommendations consistently");

  it("uses a deterministic tie breaker");

  it("returns reasons for recommended cocktails");

  it("keeps scores inside the valid range");
});
```

---

# 9. Boundary Cases

Domain Test에는 정상적인 입력뿐 아니라 경계값을 포함한다.

예:

```text
모든 Taste Dimension이 최소값
모든 Taste Dimension이 최대값
모든 Dimension 값이 동일
Cocktail이 하나뿐인 경우
여러 Cocktail의 Score가 동일한 경우
추천 가능한 Cocktail이 없는 경우
```

특히 동점 Ranking 규칙은 명시적으로 테스트한다.

---

# 10. Golden Recommendation Tests

추천 시스템에는 일반 Unit Test와 별도로 Golden Test를 사용한다.

목적은 다음 질문에 답하는 것이다.

> **"알고리즘은 정상적으로 실행되지만 추천 품질이 이상해지지는 않았는가?"**

대표적인 Taste Persona를 Fixture로 관리한다.

예:

```text
BRIGHT_REFRESHING

sour               5
refreshing         5
preferred flavors  citrus, herbal
avoided flavors    smoky
```

Dataset이 확정된 이후 예상되는 Recommendation 특성을 정의한다.

예:

```ts
it("preserves the Bright & Refreshing Golden ranking relations", () => {
  const result = recommendCocktails(BRIGHT_REFRESHING, fixedGoldenFixtures);

  expect(result[0].cocktail.id).toBe("mojito");
  expect(isRankedAbove(result, "mojito", "tom-collins")).toBe(true);
});
```

---

# 11. Avoid Overfitting Golden Tests

Golden Test에서 모든 Score와 Ranking을 지나치게 고정하지 않는다.

Bad:

```ts
expect(result).toEqual([
  { cocktail: "mojito", score: 94.2134 },
  { cocktail: "tom-collins", score: 91.4812 },
  { cocktail: "gin-fizz", score: 88.1931 },
]);
```

이 방식은 정상적인 알고리즘 개선도 어렵게 만든다.

가능하면 의미 있는 특성을 보호한다.

예:

```text
Expected top recommendation과 의미 있는 pairwise ranking relation을 보호한다.

Reason은 실제 positive evidence만 포함하고, internal ranking score는 검증하거나 노출하지 않는다.
```

Recommendation Algorithm 변경 시 Golden Test 변화가 의도된 것인지 검토한다.

---

# 12. Golden Test Change Policy

Golden Test 실패를 단순히 "테스트가 오래됐다"는 이유로 수정하지 않는다.

Recommendation 변경 시 다음 순서를 따른다.

```text
Algorithm Change
       ↓
Golden Test Failure
       ↓
Result Inspection
       ↓
Expected Improvement?
    ↙          ↘
  NO            YES
  ↓              ↓
Fix Algorithm   Update Fixture/Expectation
                     ↓
                 Record Decision
```

추천 품질을 의미 있게 변경하는 경우 ADR 또는 관련 Domain 문서를 업데이트한다.

---

# 13. Application Tests

Application Test는 Use Case orchestration을 검증한다.

예:

```text
CompleteAssessment
GetCurrentAssessment
GetCocktail
GetRecommendationResult
```

Application Test에서는 Repository Port 등을 Fake 또는 Mock으로 대체할 수 있다.

대표적으로 `CompleteAssessment`는 다음 흐름을 검증한다.

```text
Load Assessment
      ↓
Validate Answers
      ↓
Calculate Taste Profile
      ↓
Load Cocktail Candidates
      ↓
Generate Recommendation
      ↓
Persist Result
      ↓
Return Result
```

---

# 14. Application Test Scope

Application Test는 다음을 검증한다.

- 올바른 Domain Logic을 호출하는가?
- 실패가 올바르게 전파되는가?
- 필요한 데이터가 저장되는가?
- Transaction이 필요한 Use Case가 일관성을 유지하는가?
- 반환 결과가 Use Case 요구사항을 만족하는가?

Framework 내부 구현 자체를 테스트하지 않는다.

---

# 15. Repository Integration Tests

TypeORM Repository는 실제 PostgreSQL과의 Integration Test를 가질 수 있다.

다음을 검증한다.

- Entity mapping
- Relation
- Query
- Constraint
- Migration compatibility

Repository Test에서는 가능하면 Production과 동일한 DB engine을 사용한다.

SQLite 등 다른 DB로 PostgreSQL 동작을 대신 검증하지 않는다.

---

# 16. Migration Tests

Database Migration은 다음을 검증할 수 있어야 한다.

```text
Empty Database
     ↓
Run Migrations
     ↓
Current Schema
```

CI에서는 최소한 migration이 빈 테스트 DB에 정상 적용되는지 확인하는 전략을 고려한다.

Production에서는 `synchronize: true`를 schema 관리 수단으로 사용하지 않는다.

---

# 17. API Integration Tests

NestJS HTTP Boundary에서는 실제 Request/Response 수준의 테스트를 작성한다.

예:

```text
POST /assessment-sessions/:id/complete
```

검증 대상:

- valid request
- invalid question
- invalid option
- incomplete answers
- successful recommendation
- response shape
- HTTP status
- error mapping

---

# 18. Contract Tests

Web과 API가 서로 다른 Contract를 기대하는 문제를 방지한다.

예:

```text
Web expectation
      ↓
packages/contracts
      ↑
API response
```

Contract validation 전략이 결정되면 Request/Response schema가 양쪽에서 동일하게 해석되는지 검증한다.

TypeScript compile success만으로 runtime contract compatibility를 보장한다고 가정하지 않는다.

---

# 19. Frontend Component Tests

Frontend Test는 사용자가 관찰하는 동작을 중심으로 작성한다.

대표 대상:

- Question
- Option selection
- Progress
- Result visualization
- Retry
- Error state
- Share interaction

DOM 내부 구조나 component implementation을 과도하게 테스트하지 않는다.

Bad:

```ts
expect(component.state.selectedIndex).toBe(2);
```

Preferred:

```ts
expect(screen.getByRole("radio", { name: "레몬 에이드" })).toBeChecked();
```

---

# 20. Accessibility-aware Queries

Frontend Test에서는 가능한 한 사용자가 인식하는 요소를 기준으로 조회한다.

우선:

```text
role
label
accessible name
text
```

가능하면 `data-testid`를 기본 선택자로 사용하지 않는다.

이를 통해 테스트 자체가 기본적인 접근성 문제를 발견하는 데 도움을 주도록 한다.

---

# 21. Zustand Tests

Zustand Store 자체를 무조건 독립적으로 테스트하지 않는다.

복잡한 Client State Transition이 존재할 때만 Store 테스트를 추가한다.

예:

```text
Question 1 Answer
      ↓
Next
      ↓
Question 2
      ↓
Back
      ↓
Question 1 Answer preserved
```

단순 modal open/close 수준의 상태에는 별도 Store Test가 필요하지 않을 수 있다.

---

# 22. React Query Tests

React Query 자체를 테스트하지 않는다.

우리 코드의 동작을 테스트한다.

예:

```text
Mutation Success
      ↓
Result displayed
```

또는:

```text
Mutation Failure
      ↓
Answers preserved
      ↓
Retry available
```

TanStack Query 내부 caching algorithm을 테스트하지 않는다.

---

# 23. Server Component Tests

SEO 또는 Server Rendering이 중요한 페이지에서는 핵심 콘텐츠가 Client-side fetch 이후에만 나타나는 구조가 아닌지 검증한다.

대표 대상:

```text
Landing
Cocktail Detail
```

Metadata는 필요한 수준에서 별도로 검증한다.

---

# 24. Architecture Tests

Architecture Rule은 가능한 한 정적 검증한다.

대표 규칙:

```text
apps/web must not import apps/api

apps/api must not import apps/web

apps/web must not import typeorm

packages/contracts must not import typeorm

shared must not import entities

shared must not import features

entities must not import features
```

검증 도구:

```text
ESLint
+
Architecture Validation Script
```

단순 import restriction은 ESLint를 우선한다.

여러 파일이나 구조를 분석해야 하는 규칙은 별도 script를 사용할 수 있다.

---

# 25. Product Invariant Mapping

Product Invariant와 Test를 연결한다.

| Invariant                        | Primary Protection                  |
| -------------------------------- | ----------------------------------- |
| P-001 Anonymous Test             | E2E                                 |
| P-002 No Expert Knowledge        | Product review + E2E/content review |
| P-003 Complete Answers           | Domain + API Integration            |
| P-004 Explainable Recommendation | Domain + E2E                        |
| P-005 Deterministic Core         | Domain + Golden                     |
| P-006 Recoverable Failure        | Frontend + E2E                      |
| P-007 Result Independence        | Frontend + E2E                      |
| P-008 Primary CTA                | E2E                                 |

모든 Product Principle을 자동 테스트할 수 있다고 가정하지 않는다.

예를 들어 "질문이 일반 사용자에게 이해하기 쉬운가?"는 자동 테스트보다 Product Review가 적합하다.

---

# 26. Domain Invariant Mapping

| Invariant | Primary Test         |
| --------- | -------------------- |
| A-001     | Domain / Application |
| A-002     | Domain               |
| A-003     | Domain               |
| A-004     | Domain + API         |
| A-005     | Domain / Application |
| T-001     | Domain               |
| T-002     | Domain               |
| T-003     | Domain               |
| T-004     | Domain               |
| T-005     | Domain               |
| C-001     | Domain + Integration |
| C-002     | Domain               |
| C-003     | Domain               |
| C-004     | Dataset Validation   |
| C-005     | Dataset Validation   |
| R-001     | Domain + Golden      |
| R-002     | Domain               |
| R-003     | Domain               |
| R-004     | Domain + E2E         |
| R-005     | Domain               |
| R-006     | Domain               |

이 Mapping은 새로운 Invariant가 추가될 때 함께 업데이트한다.

---

# 27. Core E2E Test

E2E는 모든 세부 기능을 테스트하는 용도로 사용하지 않는다.

가장 중요한 E2E는 Core Product Loop다.

```text
Landing
   ↓
Start Assessment
   ↓
Answer Questions
   ↓
Complete Assessment
   ↓
Taste Profile
   ↓
Recommendations
   ↓
Recommendation Reason
   ↓
Explore Cocktail
   ↓
Share Result
```

이 흐름을 최소 하나의 Critical E2E Scenario로 보호한다.

---

# 28. Core E2E Scenario

개념적인 테스트:

```ts
test("anonymous visitor can complete the core cocktail taste flow", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("button", {
      name: "테스트 시작하기",
    }),
  ).toBeVisible();

  await page
    .getByRole("button", {
      name: "테스트 시작하기",
    })
    .click();

  // Answer every required question.

  await expect(page.getByText("나의 칵테일 취향")).toBeVisible();

  await expect(page.getByText("추천 칵테일")).toBeVisible();

  // Verify recommendation explanation.

  // Open a cocktail.

  // Verify share action.
});
```

실제 selector와 route는 구현 이후 결정한다.

---

# 29. Failure Recovery E2E

Core Loop에는 최소 하나의 실패 복구 시나리오를 고려한다.

예:

```text
Answer Questions
       ↓
Submit
       ↓
Temporary API Failure
       ↓
Error UI
       ↓
Answers Still Present
       ↓
Retry
       ↓
Success
```

P-006을 보호하는 중요한 테스트다.

---

# 30. E2E Scope

E2E에 모든 edge case를 넣지 않는다.

E2E는 다음에 집중한다.

- 핵심 사용자 흐름
- Layer 간 연결
- Routing
- 중요한 Client/Server integration
- 실패 복구
- 사용자 관점의 결과

세부 알고리즘 edge case는 Domain Test에서 처리한다.

---

# 31. External Dependencies

외부 Cocktail API가 존재하더라도 Unit/E2E Test가 항상 실제 외부 서비스에 의존하지 않도록 한다.

```text
External API
     ↓
Adapter
     ↓
Controlled Test Boundary
```

외부 API 장애가 우리 CI를 임의로 실패시키지 않도록 한다.

외부 integration 자체를 확인해야 한다면 별도 smoke/integration test로 분리한다.

---

# 32. Fixtures

공통 Test Fixture를 명시적으로 관리한다.

예:

```text
tests/
├── fixtures/
│   ├── assessments/
│   ├── cocktails/
│   └── taste-profiles/
│
└── golden/
```

Fixture는 실제 Domain을 이해하기 쉬운 이름을 사용한다.

예:

```text
CITRUS_REFRESHING_PROFILE
RICH_BITTER_PROFILE

MOJITO_PROFILE
OLD_FASHIONED_PROFILE
```

`testData1`, `mock2` 같은 이름은 피한다.

---

# 33. Test Data Size

Unit/Domain Test에서는 가능한 한 작은 Dataset을 사용한다.

예:

```text
3 Cocktails
5 Taste Dimensions
```

전체 Production Dataset이 필요하지 않은 테스트에서 모든 Cocktail을 로드하지 않는다.

Golden/Dataset Validation Test에서는 실제 Dataset 또는 대표 Snapshot을 사용할 수 있다.

---

# 34. Test Location

테스트는 가능한 한 테스트 대상과 가까운 위치에 둔다.

예:

```text
recommendation/
├── calculate-match.ts
├── calculate-match.test.ts
├── rank-recommendations.ts
└── rank-recommendations.test.ts
```

Cross-domain Golden/E2E 테스트는 root `tests/`에서 관리할 수 있다.

---

# 35. Naming

테스트 이름은 구현 방법보다 기대 행동을 설명한다.

Bad:

```text
calls repository
test recommendation
works correctly
```

Preferred:

```text
rejects an option that does not belong to the question

returns the same ranking for the same versioned input

preserves answers when assessment submission fails
```

---

# 36. Coverage Policy

초기에는 arbitrary coverage percentage를 성공 기준으로 설정하지 않는다.

예:

```text
Coverage 90% = Quality
```

라고 가정하지 않는다.

대신 다음을 우선한다.

```text
Critical Invariant Coverage
Core Use Case Coverage
Failure Path Coverage
```

Coverage report는 테스트가 부족한 영역을 발견하는 보조 지표로 사용한다.

실제 baseline이 확보되면 threshold 도입을 검토한다.

---

# 37. Flaky Test Policy

Flaky Test를 정상 상태로 받아들이지 않는다.

테스트가 반복적으로 비결정적으로 실패하면 다음 중 하나를 수행한다.

- 원인을 수정한다.
- 테스트 설계를 수정한다.
- 외부 dependency를 격리한다.

단순히 retry 횟수를 늘려 문제를 숨기지 않는다.

---

# 38. Local Verification

개발자는 변경 범위에 맞는 테스트를 먼저 실행한다.

예:

```text
Recommendation 변경

→ recommendation domain tests
→ golden tests
→ pnpm check
```

전체 작업 완료 전에는 root verification을 실행한다.

```text
pnpm check
```

---

# 39. pnpm check

목표 구조:

```text
pnpm check
│
├── lint
├── typecheck
├── test:unit
├── test:architecture
└── build
```

Golden Test가 충분히 빠르면 `test:unit` 또는 기본 `check`에 포함한다.

실행 시간이 증가하면 별도 command로 분리하되 CI에서는 반드시 실행한다.

---

# 40. CI Verification

CI에서는 최소 다음을 검증한다.

```text
pnpm install --frozen-lockfile

pnpm lint
pnpm typecheck
pnpm test
pnpm test:architecture
pnpm build
```

DB Integration/E2E 환경이 구축되면 다음을 추가한다.

```text
migration verification
integration tests
core E2E
```

최종 command 구성은 실제 실행 시간을 측정한 후 결정한다.

---

# 41. Fast Check vs Full Check

프로젝트가 커지면 두 단계로 분리할 수 있다.

```text
pnpm check
```

빠른 local feedback:

```text
lint
typecheck
unit
architecture
build
```

그리고:

```text
pnpm check:ci
```

전체 검증:

```text
pnpm check
integration
migration
golden
E2E
```

초기에는 복잡성을 줄이기 위해 하나의 `pnpm check`로 시작해도 된다.

---

# 42. Codex Verification Rule

Codex가 기능을 구현하거나 수정한 경우 변경 범위에 해당하는 테스트를 추가하거나 수정해야 한다.

작업 완료 전 가능한 검증을 실행한다.

최소 목표:

```text
Relevant Tests
      ↓
pnpm check
```

테스트가 실패한 상태에서 작업을 완료했다고 보고하지 않는다.

환경 문제 등으로 검증할 수 없는 항목이 있다면 명시적으로 보고한다.

---

# 43. Bug Fix Rule

버그를 수정할 때 가능하면 다음 순서를 따른다.

```text
Bug
 ↓
Reproduce with Test
 ↓
Test Fails
 ↓
Fix
 ↓
Test Passes
 ↓
pnpm check
```

즉 버그 수정은 가능한 경우 Regression Test를 남긴다.

---

# 44. Feature Rule

새로운 Feature에는 다음을 고려한다.

```text
Feature Requirement
       ↓
Which invariant/use case changes?
       ↓
Test Plan
       ↓
Implementation
       ↓
Relevant Tests
       ↓
pnpm check
```

테스트를 구현이 끝난 뒤 생각하는 부가 작업으로 취급하지 않는다.

---

# 45. Domain Change Rule

다음 영역을 변경할 때는 특별히 주의한다.

```text
Taste Dimensions
Question Effects
Scoring
Cocktail Profiles
Recommendation Algorithm
Ranking
```

변경 시 검토:

```text
Domain Tests
Golden Tests
Version Change
Existing Result Compatibility
Documentation
ADR 필요 여부
```

---

# 46. Test Review Questions

PR 또는 Codex 작업 결과를 검토할 때 다음을 확인한다.

### Product

Core Loop가 유지되는가?

### Domain

새로운 Domain Rule에 테스트가 있는가?

### Failure

실패 경로를 고려했는가?

### Boundary

잘못된 입력을 신뢰하고 있지 않은가?

### Recommendation

결과가 재현 가능한가?

### Architecture

금지된 dependency가 생기지 않았는가?

### Regression

수정한 버그가 다시 발생하지 않도록 보호되는가?

---

# 47. Initial Tool Direction

구체적인 도구 버전은 Repository 초기화 시 결정한다.

현재 방향은 다음과 같다.

### Unit / Domain / Frontend

Vitest 기반 구성을 우선 검토한다.

Frontend DOM 테스트가 필요한 경우 Testing Library 계열을 사용할 수 있다.

### E2E

Playwright를 우선 검토한다.

### Backend Integration

NestJS testing utilities와 실제 PostgreSQL test environment를 조합하는 방식을 검토한다.

도구 선택보다 테스트 Boundary와 목적을 우선한다.

---

# 48. Definition of Test-complete Change

변경 사항이 테스트 관점에서 완료되었다고 판단하려면 다음을 만족해야 한다.

- 변경된 행동을 검증하는 적절한 테스트가 존재한다.
- 관련 Domain Invariant가 유지된다.
- 실패 경로가 필요한 경우 검증되어 있다.
- Architecture Rule 위반이 없다.
- 기존 Regression Test가 통과한다.
- Recommendation 변경이면 Golden Test 영향을 검토했다.
- `pnpm check`가 통과한다.

검증하지 못한 항목이 있다면 그 이유를 명시한다.

---

# 49. Testing Goal

이 프로젝트의 테스트 전략은 다음 상황을 만드는 것이 목표다.

```text
Developer / Codex
       ↓
Change Code
       ↓
Automated Feedback
       ↓
"무엇이 깨졌는지" 확인
       ↓
Fix
       ↓
pnpm check
       ↓
Confidence to Merge
```

테스트의 최종 목적은 코드의 존재를 확인하는 것이 아니라,

> **제품의 중요한 약속과 Domain Rule을 변경으로부터 보호하는 것이다.**
