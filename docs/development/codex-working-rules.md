# Codex Working Rules

## 1. Purpose

이 문서는 Codex 또는 다른 Coding Agent가 이 Repository에서 작업할 때 따라야 하는 기본 작업 절차와 행동 규칙을 정의한다.

목표는 Agent가 단순히 요청된 코드를 생성하는 것이 아니라 다음 과정을 반복하도록 만드는 것이다.

```text id="2sv3pn"
Understand
   ↓
Explore
   ↓
Plan
   ↓
Implement
   ↓
Verify
   ↓
Report
```

Agent는 빠른 코드 생성을 최우선 목표로 삼지 않는다.

우선순위는 다음과 같다.

```text id="kmh8t4"
Correctness
    ↓
Product Invariants
    ↓
Domain Invariants
    ↓
Architecture Boundaries
    ↓
Maintainability
    ↓
Minimal Change
    ↓
Speed
```

---

# 2. Sources of Truth

작업을 시작하기 전에 관련 Source of Truth를 확인한다.

기본 우선순위:

```text id="w53bd3"
User Request
     ↓
AGENTS.md
     ↓
Product Documentation
     ↓
Domain Documentation
     ↓
Architecture Documentation
     ↓
Testing Documentation
     ↓
Existing Code and Tests
```

문서와 코드가 충돌하는 경우 임의로 한쪽을 선택하지 않는다.

충돌의 성격을 파악하고 필요한 경우 사용자에게 보고하거나 최소한 작업 결과에 명시한다.

---

# 3. Required Context

작업 범위에 따라 필요한 문서를 읽는다.

모든 작업에서 Repository 전체 문서를 무조건 읽을 필요는 없다.

그러나 작업에 영향을 주는 Source of Truth는 반드시 확인한다.

예:

## Recommendation 변경

```text id="0fx65k"
AGENTS.md
docs/product/core-loop.md
docs/domain/overview.md
relevant recommendation docs
docs/architecture/overview.md
docs/testing/strategy.md
existing recommendation code/tests
```

## UI 문구 변경

관련 Product 문서와 해당 Component만으로 충분할 수 있다.

Context 수집 자체를 목적화하지 않는다.

---

# 4. Working Protocol

모든 비단순 작업은 기본적으로 다음 Protocol을 따른다.

```text id="fqrl05"
Explore
   ↓
Plan
   ↓
Implement
   ↓
Verify
   ↓
Report
```

단순한 typo 수정처럼 영향 범위가 명확하고 작은 작업에는 과도한 Planning을 요구하지 않는다.

---

# 5. Step 1 — Explore

코드를 수정하기 전에 기존 Repository를 조사한다.

확인할 항목:

- 관련 Feature
- 기존 Domain Model
- 유사한 Use Case
- API Client pattern
- Error handling pattern
- Test pattern
- Naming convention
- Dependency direction
- 관련 Documentation

새로운 Pattern을 만들기 전에 기존 Pattern이 존재하는지 확인한다.

---

# 6. Search Before Creating

새로운 파일, abstraction, utility 또는 dependency를 추가하기 전에 기존 구현을 검색한다.

예:

```text id="y5cx3m"
새 Button 필요
     ↓
shared/ui 검색
     ↓
기존 Button 존재?
```

```text id="91e0bw"
새 API Client 필요
     ↓
기존 feature API pattern 검색
```

기존 Pattern을 재사용할 수 있다면 새로운 Pattern을 만들지 않는다.

---

# 7. Understand Before Modify

관련 코드를 읽지 않은 상태에서 추측으로 수정하지 않는다.

특히 다음 영역에서는 반드시 기존 구현과 테스트를 먼저 확인한다.

```text id="z7ofj2"
Authentication
Assessment
Taste Scoring
Recommendation
Database Migration
API Contract
State Management
CI/CD
```

---

# 8. Step 2 — Plan

비단순 작업에서는 구현 전에 짧고 구체적인 Plan을 만든다.

Plan에는 최소한 다음을 포함한다.

```text id="l4q4n7"
Goal
Affected Areas
Implementation Approach
Tests
Verification
Potential Risks
```

파일 목록을 미리 확정하는 것이 목적은 아니다.

조사 결과에 따라 변경될 수 있다.

---

# 9. Plan Against Invariants

Plan을 작성할 때 관련 Product / Domain Invariant를 확인한다.

예:

즐겨찾기 기능 추가:

```text id="w4cksd"
P-001 Anonymous Test

즐겨찾기 때문에
테스트 시작 전에 로그인을 요구하면 안 된다.
```

Recommendation 변경:

```text id="5ndd5d"
R-001 Deterministic Result
R-004 Explainability
R-005 Explanation Consistency
```

기능 요구사항만 만족하고 기존 Invariant를 깨는 Plan은 유효하지 않다.

---

# 10. Ask Only When Necessary

모든 작은 결정에 대해 사용자에게 질문하지 않는다.

다음 기준으로 판단한다.

### Proceed

다음 조건이면 기존 Pattern과 문서를 기준으로 합리적인 결정을 내린다.

- 요구사항이 충분히 명확하다.
- 기존 Pattern이 존재한다.
- 쉽게 되돌릴 수 있다.
- Product/Domain 의미를 바꾸지 않는다.

### Ask

다음과 같은 경우 사용자 확인을 우선한다.

- Product behavior가 여러 방향으로 해석될 수 있다.
- Domain Invariant 변경이 필요하다.
- 데이터 손실 가능성이 있다.
- 중요한 Public API 변경이 필요하다.
- 보안에 영향을 주는 선택이다.
- 비용이 발생하는 Infrastructure 변경이다.
- 되돌리기 어려운 Migration이다.

---

# 11. Step 3 — Implement

Plan을 기준으로 최소한의 변경으로 구현한다.

원칙:

```text id="ox45bf"
Requested Change
      +
Required Supporting Change
      =
Implementation Scope
```

관련 없는 Cleanup이나 Refactor를 함께 수행하지 않는다.

---

# 12. Minimal Change

작업과 직접 관련 없는 코드를 수정하지 않는다.

예:

사용자가 Assessment Validation을 수정해달라고 요청했다면 다음을 동시에 하지 않는다.

- unrelated component rename
- 전체 formatting 변경
- unrelated folder restructuring
- dependency upgrade
- 다른 Feature refactor

작은 Diff는 검토와 Regression 분석을 쉽게 만든다.

---

# 13. Do Not Rewrite Without Need

기존 구현이 완벽하지 않더라도 요청을 해결하는 데 필요하지 않다면 대규모 재작성하지 않는다.

Bad:

```text id="b0xz53"
"이 구조보다 더 좋은 구조가 있다."

→ 전체 Module 재작성
```

Preferred:

```text id="3d67lc"
현재 구조에서 요구사항을 안전하게 구현

필요한 구조 개선은 별도 제안
```

---

# 14. Existing Patterns First

여러 구현 방식이 모두 유효하다면 Repository의 기존 Pattern을 우선한다.

예:

```text id="o8qddx"
기존 Error Pattern
기존 DTO Pattern
기존 Query Key Pattern
기존 Test Fixture Pattern
기존 Naming
```

Agent 개인의 선호 때문에 동일한 문제를 여러 방식으로 구현하지 않는다.

---

# 15. Avoid Premature Abstraction

한 번만 사용되는 코드라는 이유만으로 즉시 abstraction을 만들지 않는다.

다음은 실제 반복 또는 명확한 책임이 확인될 때 도입한다.

```text id="a9mrjj"
Generic Repository
Generic Service
Universal Mapper
Base Controller
Global Utility
Shared Domain Package
```

Duplication과 abstraction 비용을 함께 고려한다.

---

# 16. Dependency Policy

새 Dependency를 추가하기 전에 다음을 확인한다.

```text id="73zb96"
현재 dependency로 해결 가능한가?
        ↓
표준 API로 충분한가?
        ↓
작은 구현으로 해결 가능한가?
        ↓
새 dependency의 이점이 충분한가?
```

새 Dependency가 필요하다면 최소한 다음을 검토한다.

- 목적
- maintenance
- security
- bundle/runtime impact
- existing alternatives
- project compatibility

"새 dependency를 절대 추가하지 않는다"는 규칙은 사용하지 않는다.

필요한 경우 추가할 수 있지만 이유가 있어야 한다.

---

# 17. Framework Boundaries

Architecture Documentation의 Boundary를 유지한다.

예:

```text id="nl0zh3"
apps/web
    X
 TypeORM

apps/web
    X
 apps/api internal implementation
```

```text id="e2j1ds"
Controller
    X
Business Logic
```

Architecture Rule을 우회하여 기능을 빠르게 구현하지 않는다.

---

# 18. Domain Logic

Taste / Recommendation 같은 핵심 Domain Logic은 가능한 한 순수하게 유지한다.

예:

```ts id="th0kn6"
calculateTasteProfile(input);

calculateMatch(profile, cocktail);

rankRecommendations(matches);
```

이러한 계산에 불필요하게 다음을 결합하지 않는다.

```text id="6tzlsb"
HTTP
NestJS decorators
TypeORM
React
Next.js
```

---

# 19. Frontend State Rules

Frontend State를 추가할 때 먼저 종류를 분류한다.

```text id="g8egc2"
Server State?
Client Shared State?
Local Component State?
```

### Server State

React Query 또는 Next.js server fetching을 검토한다.

### Shared Client State

Zustand를 검토한다.

### Local State

React local state를 우선한다.

Server State를 Zustand에 복제하지 않는다.

---

# 20. Next.js Rules

Server Component를 기본값으로 한다.

다음이 필요한 경우에만 Client Component를 사용한다.

- interaction
- browser API
- React Query
- Zustand
- client-only state

`"use client"`를 문제 해결을 위한 편의 수단으로 상위 Tree에 무분별하게 추가하지 않는다.

---

# 21. Backend Rules

기본 책임:

```text id="8awhhm"
Controller
    ↓
Application / Service
    ↓
Domain
    ↓
Repository Boundary
    ↓
Infrastructure
```

Controller에는 Business Logic을 두지 않는다.

TypeORM Query가 Domain Rule 자체가 되지 않도록 한다.

---

# 22. Database Changes

Database Schema 변경 시 반드시 Migration을 고려한다.

Production을 위한 schema 변경을 `synchronize: true`에 의존하지 않는다.

Database 변경 작업에서는 다음을 확인한다.

```text id="f1ld6c"
Schema
Migration
Existing Data
Constraints
Rollback / Compatibility
Tests
```

파괴적 변경은 특별히 주의한다.

---

# 23. API Contract Changes

API Request/Response를 변경할 때 영향을 받는 Consumer를 확인한다.

```text id="47ct7f"
Contract
   ↓
API
   +
Web
   +
Tests
```

TypeORM Entity를 API Contract로 사용하지 않는다.

Backend 내부 구조 변경이 Frontend Contract를 불필요하게 변경하지 않도록 한다.

---

# 24. Error Handling

오류를 숨기지 않는다.

Bad:

```ts id="vl6evg"
try {
  await operation();
} catch {
  return null;
}
```

의도적으로 무시하는 오류가 아니라면 적절하게 처리하거나 전파한다.

사용자에게 보여주는 Error와 개발자가 추적하는 Error를 구분한다.

---

# 25. Do Not Fake Success

작업을 성공한 것처럼 보이기 위해 실패를 숨기지 않는다.

금지 예:

```text id="8y9ynk"
failing test 삭제

type error를 any로 우회

lint rule disable

catch 후 무시

validation 제거

architecture check 제외
```

문제의 원인을 해결한다.

---

# 26. Type Safety

불필요한 다음 사용을 피한다.

```ts id="tnn8uq"
any

as unknown as SomeType
```

외부 입력은 runtime validation을 고려한다.

Type assertion은 실제 invariant가 코드로 보장될 때 제한적으로 사용한다.

---

# 27. Comments

코드 자체로 표현 가능한 내용을 반복하는 Comment를 추가하지 않는다.

Bad:

```ts id="xdt6if"
// Increment index
index++;
```

Comment는 다음과 같은 경우 유용하다.

- 왜 이 방식이 필요한지
- 비직관적인 Domain Rule
- 외부 시스템 제약
- 의도적인 workaround

---

# 28. Documentation Changes

다음과 같은 변경은 Documentation Update를 검토한다.

```text id="f6g6bx"
Product Invariant 변경
Domain Rule 변경
Architecture Boundary 변경
Recommendation Algorithm 변경
새로운 중요한 Workflow
새 Infrastructure Decision
```

모든 코드 변경마다 문서를 수정하지 않는다.

문서가 실제 Source of Truth와 달라질 때 수정한다.

---

# 29. ADR Rule

다음과 같은 결정에는 ADR을 고려한다.

- 중요한 Architecture 변경
- 새로운 Infrastructure 도입
- Domain Boundary 변경
- Recommendation 전략의 중요한 변경
- 장기적인 Trade-off가 존재하는 선택

사소한 구현 선택에는 ADR을 만들지 않는다.

---

# 30. Tests During Implementation

테스트는 마지막에 한 번 추가하는 부가 작업이 아니다.

가능하면 다음 루프를 사용한다.

```text id="on8fev"
Implement Small Change
       ↓
Run Relevant Test
       ↓
Continue
```

버그 수정은 가능하면 먼저 Regression Test로 재현한다.

---

# 31. Test Scope

변경과 관련된 가장 작은 Test부터 실행한다.

예:

```text id="fn8p98"
Recommendation Logic 변경
       ↓
Recommendation Unit Tests
       ↓
Golden Tests
       ↓
pnpm check
```

매 작은 수정마다 전체 E2E를 실행할 필요는 없다.

---

# 32. Step 4 — Verify

작업이 끝났다고 판단하기 전에 검증한다.

기본 목표:

```text id="vzrhkr"
Relevant Tests
     ↓
pnpm check
```

`pnpm check`는 Repository의 기본 품질 Gate다.

---

# 33. Verification Failure

검증이 실패하면 즉시 작업 완료로 보고하지 않는다.

```text id="6i9d07"
pnpm check
     ↓
FAIL
     ↓
Understand Failure
     ↓
Fix
     ↓
Run Again
```

실패가 기존 문제인지 이번 변경으로 발생한 문제인지 확인한다.

---

# 34. Existing Failure

이번 작업과 무관한 기존 Failure가 발견될 수 있다.

이 경우:

1. 이번 변경 때문인지 확인한다.
2. 요청 범위 안에서 안전하게 수정할 수 있는지 판단한다.
3. 관련이 없다면 불필요하게 Scope를 확장하지 않는다.
4. 최종 Report에 정확히 기록한다.

기존 Failure를 이번 작업이 성공한 것처럼 숨기지 않는다.

---

# 35. Unable to Verify

환경 또는 Infrastructure 문제로 검증할 수 없는 경우 이를 명시한다.

예:

```text id="0l1qwy"
Not verified:
- PostgreSQL integration tests

Reason:
- Test database is not available in the current environment.
```

실행하지 않은 테스트를 실행했다고 보고하지 않는다.

---

# 36. Step 5 — Report

작업 완료 후 결과를 간결하게 보고한다.

기본 Report:

```text id="g2v3b5"
Summary

Changed
- ...

Tests
- ...

Verification
- ...

Notes
- ...
```

단순 작업에는 더 짧게 보고할 수 있다.

---

# 37. Report Facts, Not Intentions

"잘 구현했습니다"보다 검증 가능한 사실을 보고한다.

Bad:

```text id="mr59qt"
완벽하게 구현했습니다.
문제없이 동작합니다.
```

Preferred:

```text id="r3rwz5"
Added assessment answer validation.

Added tests for:
- unknown question
- invalid option
- incomplete answers

Verification:
- pnpm check: passed
```

---

# 38. No False Completion

다음 상태에서는 "완료"라고 보고하지 않는다.

- required test가 실패한다.
- build가 실패한다.
- migration이 필요한데 생성되지 않았다.
- 요구사항 일부를 구현하지 않았다.
- 핵심 검증을 수행하지 못했는데 이를 숨긴다.

부분 완료라면 부분 완료라고 명시한다.

---

# 39. Product Protection Rules

어떤 기능도 Core Product Loop를 불필요하게 방해해서는 안 된다.

보호 대상:

```text id="jqy8i4"
Landing
   ↓
Taste Test
   ↓
Taste Profile
   ↓
Recommendation
   ↓
Result
   ↓
Share / Explore
```

특히 Authentication 같은 후속 기능을 추가할 때 Core Loop 앞에 강제 Login을 삽입하지 않는다.

Product Rule 변경이 필요한 경우 단순 구현 결정으로 처리하지 않는다.

---

# 40. Recommendation Protection Rules

다음 영역을 변경할 때는 High-impact Domain Change로 취급한다.

```text id="fql0io"
Taste Dimensions
Question Effects
Scoring
Cocktail Profiles
Candidate Filtering
Matching Algorithm
Ranking
Recommendation Reason
```

변경 전 관련 Domain/Golden Test를 확인한다.

변경 후 다음을 검토한다.

```text id="68vgce"
Determinism
Score validity
Ranking
Explainability
Golden cases
Version impact
```

---

# 41. Version-sensitive Changes

다음 변경은 기존 결과의 의미를 바꿀 수 있다.

```text id="qlhbx1"
Assessment Questions
Option Effects
Taste Scoring
Cocktail Dataset
Cocktail Profile
Recommendation Algorithm
```

이러한 변경에서는 관련 Version 증가가 필요한지 검토한다.

Version 변경 여부를 무시한 채 데이터 의미를 변경하지 않는다.

---

# 42. Security Rules

다음을 신뢰하지 않는다.

```text id="ftq1nl"
Browser input
URL parameter
Client-calculated score
Client userId
Client authorization state
```

Backend Boundary에서 필요한 검증을 수행한다.

Secret을 다음 위치에 넣지 않는다.

```text id="w0kn5m"
source code
committed .env
client bundle
logs
```

---

# 43. Generated Code

Generator가 생성한 코드도 동일한 Architecture/Test Rule을 따른다.

"자동 생성되었다"는 이유로 검증에서 제외하지 않는다.

자동 생성 파일을 직접 수정해서는 안 되는 도구를 사용하는 경우 해당 Tool의 workflow를 따른다.

---

# 44. Configuration Changes

다음 파일은 영향 범위가 넓기 때문에 신중하게 변경한다.

```text id="p0pjpd"
package.json
pnpm-lock.yaml
tsconfig
eslint config
Next config
Nest config
CI workflow
Docker
Terraform
```

Feature 구현을 위해 필요하지 않다면 변경하지 않는다.

---

# 45. Lockfile

Dependency가 변경되면 lockfile도 일관되게 업데이트한다.

Dependency를 변경하지 않았는데 불필요하게 전체 lockfile을 재작성하지 않는다.

---

# 46. Destructive Actions

다음과 같은 파괴적 작업을 임의로 수행하지 않는다.

```text id="8n3ofv"
drop database
delete production data
force push
rewrite unrelated history
remove migration history
delete large code areas
```

사용자 요청과 명확한 안전성이 필요하다.

---

# 47. Git Scope

사용자가 별도로 요청하지 않은 경우 Agent는 기존 사용자의 변경 사항을 되돌리지 않는다.

현재 작업과 무관한 변경을 발견하면 보존한다.

Merge conflict 또는 기존 변경과 충돌하는 경우 현재 상태를 이해한 후 수정한다.

---

# 48. Refactoring Rule

Refactoring은 다음 조건에서 수행한다.

```text id="e36fs5"
현재 Feature 구현에 필요
OR
명확한 Bug/Risk 해결
OR
사용자가 요청
```

"코드가 더 예뻐진다"는 이유만으로 작업 범위를 크게 확장하지 않는다.

---

# 49. TODO Rule

구현하지 않은 요구사항을 TODO로 남기고 완료했다고 보고하지 않는다.

TODO는 다음과 같은 경우 사용할 수 있다.

- 현재 Scope 밖의 명확한 후속 작업
- 의도적으로 deferred된 결정

TODO를 남긴 경우 중요한 항목은 Report에 언급한다.

---

# 50. Temporary Code

Debug code를 최종 변경에 남기지 않는다.

예:

```text id="7gdxrj"
console.log
temporary endpoint
hard-coded test value
debug UI
```

의도적으로 필요한 Logging은 정식 Logging 정책을 따른다.

---

# 51. Feature Workflow

일반 Feature 작업:

```text id="gwr4i9"
Read Request
     ↓
Read Relevant Docs
     ↓
Explore Existing Code
     ↓
Identify Invariants
     ↓
Plan
     ↓
Implement Vertical Slice
     ↓
Add / Update Tests
     ↓
Relevant Tests
     ↓
pnpm check
     ↓
Report
```

---

# 52. Bug Fix Workflow

```text id="zmg4r1"
Understand Bug
     ↓
Find Reproduction
     ↓
Add Regression Test
     ↓
Confirm Failure
     ↓
Minimal Fix
     ↓
Confirm Test Pass
     ↓
pnpm check
     ↓
Report
```

가능한 경우 이 흐름을 따른다.

---

# 53. Database Workflow

```text id="e7i9ls"
Understand Data Change
       ↓
Model Change
       ↓
Migration
       ↓
Repository / Application
       ↓
Integration Test
       ↓
Migration Verification
       ↓
pnpm check
```

---

# 54. Recommendation Workflow

```text id="b1xf0v"
Read Domain Rules
       ↓
Inspect Existing Algorithm
       ↓
Inspect Golden Fixtures
       ↓
Define Intended Behavior Change
       ↓
Implement
       ↓
Domain Tests
       ↓
Golden Tests
       ↓
Version Impact
       ↓
pnpm check
```

---

# 55. Documentation Workflow

Documentation은 실제 구현과 일치해야 한다.

코드 변경으로 문서가 거짓이 된다면 관련 문서를 수정한다.

반대로 아직 구현되지 않은 Future Design을 현재 동작처럼 문서화하지 않는다.

다음을 구분한다.

```text id="n4fbk3"
Current
Planned
Candidate
Deferred
```

---

# 56. Definition of Done

작업은 다음 조건을 만족할 때 완료된 것으로 간주한다.

### Requirement

요청된 행동이 구현되었다.

### Product

관련 Product Invariant를 유지한다.

### Domain

관련 Domain Invariant를 유지한다.

### Architecture

Dependency Boundary를 위반하지 않는다.

### Tests

변경된 행동에 필요한 테스트가 존재한다.

### Errors

중요한 Failure Path를 고려했다.

### Documentation

Source of Truth 변경이 있다면 문서를 업데이트했다.

### Verification

관련 테스트와 `pnpm check`가 통과했다.

### Report

변경과 검증 결과를 정확하게 보고했다.

---

# 57. Final Checklist

비단순 작업 완료 전 다음을 확인한다.

```text id="f4lg8f"
[ ] 요청사항을 모두 구현했는가?
[ ] 관련 문서를 확인했는가?
[ ] 기존 Pattern을 우선했는가?
[ ] Product Invariant를 깨지 않았는가?
[ ] Domain Invariant를 깨지 않았는가?
[ ] Architecture Boundary를 지켰는가?
[ ] 불필요한 Scope 확장이 없는가?
[ ] 필요한 테스트를 추가/수정했는가?
[ ] 실패 경로를 고려했는가?
[ ] 관련 테스트가 통과하는가?
[ ] pnpm check가 통과하는가?
[ ] 문서 업데이트가 필요한가?
[ ] 실행하지 않은 검증을 실행했다고 보고하지 않았는가?
```

---

# 58. Guiding Principle

Codex는 다음 질문을 기준으로 작업한다.

> **"요청된 기능을 가장 적은 안전한 변경으로 구현하면서, 기존 제품의 약속과 Domain Rule을 어떻게 계속 보호할 것인가?"**

좋은 Agent 작업은 많은 코드를 작성하는 것이 아니다.

좋은 Agent 작업은:

```text id="30gsuq"
Understand
    +
Small Correct Change
    +
Tests
    +
Verification
    =
Safe Progress
```

를 반복하는 것이다.
