# Core User Loop

## 1. Purpose

이 문서는 칵테일 취향 테스트 서비스에서 가장 중요한 사용자 흐름을 정의한다.

기능 추가, UI 변경, 아키텍처 변경 또는 리팩터링 시 이 흐름이 깨지지 않아야 한다.

핵심 흐름은 다음과 같다.

```text
Enter
  ↓
Start Test
  ↓
Answer Questions
  ↓
Generate Taste Profile
  ↓
Recommend Cocktails
  ↓
Understand Result
  ↓
Share / Explore
```

---

# 2. Primary User

Primary User는 서비스에 처음 방문한 익명 사용자다.

사용자는 다음을 모를 수 있다.

- 칵테일 종류
- Base Spirit
- 칵테일 재료
- 전문적인 Flavor 용어
- 자신의 정확한 술 취향

따라서 서비스는 이러한 지식을 테스트 참여의 전제 조건으로 삼지 않는다.

---

# 3. Entry

사용자는 다음 경로를 통해 서비스에 들어올 수 있다.

### Search

예:

- 칵테일 취향 테스트
- 나에게 맞는 칵테일
- 칵테일 추천
- 달달한 칵테일 추천
- 상큼한 칵테일 추천

### Shared Result

다른 사용자가 공유한 결과 링크 또는 결과 콘텐츠.

### Direct Visit

서비스 URL 직접 방문.

Entry source와 관계없이 핵심 테스트로 이동하기 쉬워야 한다.

---

# 4. Landing

Landing의 가장 중요한 목적은 사용자가 테스트를 시작하도록 돕는 것이다.

사용자는 Landing에서 다음을 빠르게 이해할 수 있어야 한다.

1. 무엇을 하는 서비스인가?
2. 무엇을 얻을 수 있는가?
3. 얼마나 걸리는가?
4. 칵테일을 잘 몰라도 가능한가?
5. 어디를 누르면 시작하는가?

Primary CTA는 Taste Test 시작이다.

초기 핵심 경험보다 회원가입이나 다른 기능을 더 강하게 노출하지 않는다.

---

# 5. Start Test

사용자는 회원가입 없이 테스트를 시작할 수 있어야 한다.

테스트 시작을 위해 다음을 요구하지 않는다.

- 회원가입
- 로그인
- 이메일
- 전화번호
- 소셜 계정 연결

테스트에 꼭 필요하지 않은 개인정보를 요구하지 않는다.

---

# 6. Answer Questions

사용자는 일상적인 취향에 관한 질문에 답한다.

질문은 가능한 한 한 번에 하나의 판단을 요구한다.

예:

> 카페에서 가장 끌리는 음료는?

사용자는 선택지를 통해 답한다.

각 답변은 Taste Profile 생성에 사용되는 하나 이상의 취향 특성에 영향을 줄 수 있다.

---

# 7. Question Design Principles

## Understandable

칵테일 전문 지식이 없어도 이해할 수 있어야 한다.

## Quick

오랜 고민 없이 답할 수 있어야 한다.

## Taste-oriented

성격보다는 실제 맛과 감각 선호를 파악하는 데 도움을 주어야 한다.

## Neutral

특정 답변이 더 좋아 보이도록 표현하지 않는다.

## Distinguishable

선택지 간 의미가 지나치게 겹치지 않아야 한다.

---

# 8. Progress

사용자는 테스트가 얼마나 진행되었는지 알 수 있어야 한다.

예:

```text
4 / 10
████████░░░░░░░░
```

사용자가 테스트의 남은 길이를 예측할 수 있어야 한다.

테스트는 약 1~2분 내 완료를 목표로 한다.

---

# 9. Test State

테스트 진행 중 사용자가 선택한 답변은 테스트 완료 전까지 유지되어야 한다.

사용자가 이전 질문으로 이동할 수 있도록 할지 여부는 실제 UX 설계 단계에서 결정한다.

새로고침, 브라우저 종료 등에서 테스트 상태를 복구할지는 MVP 구현 전에 별도로 결정한다.

이 문서는 특정 상태 관리 기술을 강제하지 않는다.

---

# 10. Submit

모든 필수 질문에 답하면 테스트를 제출할 수 있다.

불완전하거나 유효하지 않은 답변으로 Recommendation을 생성하지 않는다.

제출 과정에서 중복 요청이나 중복 결과 생성이 발생하지 않도록 한다.

---

# 11. Taste Profile

답변은 Taste Profile로 변환된다.

Taste Profile은 사용자의 맛 선호를 구조화한 표현이다.

개념적으로 다음과 같은 특성을 포함할 수 있다.

```text
Sweet
Sour
Bitter
Citrus
Fruity
Herbal
Spicy
Creamy
Smoky
Refreshing
Rich
Dry
Strength
```

정확한 축과 계산 방식은 Domain Specification에서 정의한다.

Product Layer에서 특정 점수 계산 알고리즘을 고정하지 않는다.

---

# 12. Recommendation

Taste Profile을 Cocktail Profile과 비교하여 추천 결과를 생성한다.

Recommendation은 최소한 다음 정보를 제공할 수 있어야 한다.

- 추천 칵테일
- 추천 순위
- 취향과의 적합 정도
- 추천 근거

핵심 추천은 재현 가능해야 한다.

동일한 입력과 동일한 Cocktail Dataset을 사용했을 때 임의로 다른 핵심 결과가 생성되어서는 안 된다.

---

# 13. Result

Result Page는 서비스에서 가장 중요한 화면 중 하나다.

사용자는 결과 화면에서 최소한 다음 질문에 대한 답을 얻을 수 있어야 한다.

### 나는 어떤 맛을 좋아하는가?

Taste Profile을 이해할 수 있어야 한다.

### 어떤 칵테일이 나와 잘 맞는가?

추천 칵테일을 확인할 수 있어야 한다.

### 왜 이 칵테일인가?

추천 이유를 이해할 수 있어야 한다.

### 다음에는 무엇을 할 수 있는가?

추천 칵테일을 탐색하거나 결과를 공유할 수 있어야 한다.

---

# 14. Recommendation Explanation

추천 결과는 점수만 제공하지 않는다.

Bad:

```text
Mojito
94%
```

Better:

```text
Mojito
94%

상큼하고 청량한 맛과 허브 향을 선호하는
당신의 취향과 잘 맞는 칵테일입니다.

Strong Match
- Citrus
- Herbal
- Refreshing
```

추천 결과의 설명은 실제 추천 계산과 모순되어서는 안 된다.

---

# 15. Explore

추천 결과에서 사용자는 칵테일에 대해 더 알아볼 수 있다.

예:

```text
Recommendation
      ↓
Cocktail Detail
      ↓
Ingredients
Taste Characteristics
Base Spirit
Strength
Similar Cocktails
```

Cocktail Detail은 향후 검색 유입을 위한 독립적인 콘텐츠 페이지 역할도 할 수 있다.

---

# 16. Share

사용자는 결과를 다른 사람과 공유할 수 있어야 한다.

공유 가능한 정보의 예:

- Taste Type
- 주요 Taste Characteristics
- 대표 추천 칵테일
- 테스트 링크

공유된 콘텐츠만으로도 서비스가 무엇인지 어느 정도 이해할 수 있어야 한다.

공유된 결과에서 새로운 사용자가 테스트를 시작하기 쉬워야 한다.

---

# 17. Viral Loop

공유는 단순한 부가 기능이 아니라 신규 유입 경로 중 하나다.

```text
User A
  ↓
Taste Test
  ↓
Result
  ↓
Share
  ↓
User B
  ↓
Taste Test
  ↓
Result
  ↓
Share
```

따라서 공유 경험을 변경할 때는 신규 사용자가 테스트로 자연스럽게 연결되는지 확인해야 한다.

---

# 18. Failure States

핵심 사용자 흐름은 실패 상황도 고려해야 한다.

### Questions Cannot Load

사용자가 다시 시도할 수 있어야 한다.

### Submission Fails

이미 입력한 답변을 가능한 한 잃지 않아야 한다.

사용자가 다시 제출할 수 있어야 한다.

### Recommendation Fails

사용자에게 이해 가능한 오류 상태와 재시도 방법을 제공해야 한다.

### Share Fails

결과 자체는 계속 확인할 수 있어야 한다.

공유 기능 실패가 테스트 결과를 잃게 만들어서는 안 된다.

---

# 19. Core Product Invariants

다음 조건은 핵심 제품 불변조건으로 취급한다.

### P-001 — Anonymous Test

사용자는 계정 없이 테스트를 완료할 수 있다.

### P-002 — No Expert Knowledge

테스트 완료를 위해 칵테일 전문 지식이 필요하지 않다.

### P-003 — Complete Answers

유효한 필수 답변이 모두 존재해야 추천을 생성한다.

### P-004 — Explainable Recommendation

추천에는 사용자 취향과 연결된 설명이 존재한다.

### P-005 — Deterministic Core

동일한 Taste Profile과 동일한 Cocktail Dataset은 동일한 핵심 추천 결과를 생성한다.

### P-006 — Recoverable Failure

일시적인 제출 실패 때문에 사용자가 이미 입력한 답변 전체를 다시 입력하도록 만들지 않는다.

### P-007 — Result Independence

공유 기능이 실패하더라도 결과를 계속 확인할 수 있다.

### P-008 — Primary CTA

첫 방문자의 주요 행동은 회원가입이 아니라 Taste Test 시작이다.

---

# 20. Core Funnel

제품 분석에서는 최소한 다음 단계를 구분할 수 있어야 한다.

```text
Visit
  ↓
Test Started
  ↓
Question Progress
  ↓
Test Completed
  ↓
Result Viewed
  ↓
Cocktail Explored
  ↓
Result Shared
```

구체적인 이벤트 이름과 Analytics 구현은 별도 문서에서 정의한다.

---

# 21. Core Loop Acceptance Scenario

가장 중요한 acceptance scenario는 다음과 같다.

```text
Given
칵테일에 대한 전문 지식이 없는 신규 사용자가
서비스에 처음 방문했다.

When
사용자가 Taste Test를 시작하고
모든 질문에 유효하게 답한다.

Then
회원가입 없이 테스트를 완료할 수 있다.

And
자신의 Taste Profile을 확인할 수 있다.

And
자신에게 맞는 칵테일 추천을 받을 수 있다.

And
왜 해당 칵테일이 추천되었는지 이해할 수 있다.

And
추천 칵테일을 더 알아볼 수 있다.

And
자신의 결과를 다른 사람에게 공유할 수 있다.
```

이 시나리오는 향후 Core E2E Test의 기준이 된다.

---

# 22. Protected Core Loop

향후 어떤 기능이 추가되더라도 다음 경로를 불필요하게 방해해서는 안 된다.

```text
Landing
   ↓
Taste Test
   ↓
Taste Profile
   ↓
Recommendation
   ↓
Result
```

다음과 같은 기능은 이 경로보다 우선하지 않는다.

- Authentication
- Favorites
- History
- Profile
- Social features
- Analytics
- Personalization

이 기능들은 Core Loop를 강화하거나 확장하는 역할을 해야 한다.

---

# 23. Definition of Healthy Core Loop

Core Loop가 건강하다고 판단하려면 최소한 다음 조건을 만족해야 한다.

- 신규 사용자가 로그인 없이 시작할 수 있다.
- 테스트 진행 상태를 이해할 수 있다.
- 모든 질문을 정상적으로 완료할 수 있다.
- 추천 결과가 생성된다.
- 추천 이유가 제공된다.
- 결과에서 칵테일을 탐색할 수 있다.
- 결과를 공유할 수 있다.
- 주요 실패 상황에서 복구할 수 있다.

이 조건들은 향후 테스트 및 모니터링 전략의 기반으로 사용한다.
