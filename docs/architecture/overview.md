# Architecture Overview

## 1. Purpose

이 문서는 칵테일 취향 테스트 서비스의 전체 시스템 아키텍처와 기술적 경계를 정의한다.

Architecture의 목적은 특정 폴더 구조를 예쁘게 만드는 것이 아니다.

다음 조건을 지속적으로 만족시키는 것을 목표로 한다.

- Product Core Loop를 보호한다.
- Domain Boundary를 코드 구조에서도 유지한다.
- Frontend와 Backend의 책임을 명확하게 분리한다.
- 핵심 Domain Logic을 Framework와 Infrastructure에서 분리한다.
- 변경의 영향 범위를 제한한다.
- Codex가 일관된 위치와 패턴으로 코드를 작성할 수 있도록 한다.
- Architecture Rule 중 가능한 것은 자동으로 검증한다.

---

# 2. Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- TanStack Query (React Query)
- Zustand
- Tailwind CSS
- shadcn/ui

## Backend

- NestJS
- TypeScript
- TypeORM

## Database

- PostgreSQL

## Package Management

- pnpm
- pnpm workspace
- Turborepo

## Infrastructure

- GCP

구체적인 GCP 서비스 선택은 Deployment Architecture에서 결정한다.

---

# 3. System Context

전체 시스템의 기본 구조는 다음과 같다.

```text
Browser
   │
   ▼
Next.js Web
   │
   │ HTTPS
   ▼
NestJS API
   │
   ▼
Application / Domain
   │
   ▼
Repository
   │
   ▼
TypeORM
   │
   ▼
PostgreSQL
```

Frontend는 PostgreSQL에 직접 접근하지 않는다.

Frontend는 TypeORM을 사용하지 않는다.

데이터 변경과 핵심 비즈니스 규칙의 authoritative execution은 Backend에서 수행한다.

---

# 4. Monorepo

프로젝트는 pnpm workspace와 Turborepo 기반 Monorepo로 구성한다.

초기 구조:

```text
cocktail-taste-test/
│
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── contracts/
│   ├── eslint-config/
│   └── typescript-config/
│
├── docs/
├── scripts/
├── tests/
│
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── pnpm-lock.yaml
```

초기 단계에서 Package를 과도하게 생성하지 않는다.

새 Package는 명확한 공유 책임 또는 독립적인 검증 필요성이 있을 때만 추가한다.

현재 UI Consumer는 `apps/web` 하나이므로 `packages/ui`를 만들지 않는다.

Web Application의 UI Primitive는 다음 위치에서 관리한다.

```text
apps/web/src/shared/ui
```

향후 여러 Application이 실제로 동일한 Design System과 UI Primitive를 공유해야 할 경우 `packages/ui` 추출을 검토한다.

미래의 재사용 가능성만으로 Shared Package를 미리 생성하지 않는다.

---

# 5. Application Boundaries

두 개의 주요 Application Boundary를 가진다.

```text
apps/web
    │
    │ HTTP Contract
    ▼
apps/api
```

`apps/web`은 사용자 경험을 담당한다.

`apps/api`는 데이터와 비즈니스 규칙의 authoritative source 역할을 한다.

Web과 API 사이의 통신은 명시적인 API Contract를 통해 이루어진다.

---

# 6. Dependency Direction

전체 Dependency Direction은 다음을 따른다.

```text
Web UI
  ↓
Web Feature
  ↓
API Client
  ↓
HTTP Contract
  ↓
API Controller
  ↓
Application
  ↓
Domain
  ↓
Repository Port
  ↑
Infrastructure
```

외부 Framework나 Infrastructure가 핵심 Domain Rule을 결정하지 않도록 한다.

---

# 7. Frontend Responsibility

Frontend가 담당하는 것:

- 화면 렌더링
- 사용자 입력
- 테스트 진행 UX
- Client-side interaction
- Server State 표시 및 동기화
- Loading / Error / Empty state
- 결과 시각화
- 공유 UX
- 접근성
- SEO가 필요한 Web presentation
- 사용자에게 필요한 즉각적인 UI feedback

Frontend가 담당하지 않는 것:

- Recommendation의 authoritative 계산
- Taste Profile의 authoritative 계산
- DB validation
- DB persistence rule
- 데이터 무결성 보장
- 권한의 최종 판정

---

# 8. Backend Responsibility

Backend가 담당하는 것:

- Assessment validation
- Session lifecycle
- Answer validation
- Taste Profile 계산
- Recommendation 계산
- Recommendation Reason 생성
- Cocktail Dataset 제공
- Persistence
- Domain Invariant 보호
- Version 관리
- 인증/인가가 추가될 경우 최종 권한 판정

Backend는 Frontend가 이미 검증했다는 사실을 신뢰하지 않는다.

---

# 9. Backend as Authoritative Domain

다음 계산의 authoritative implementation은 Backend에 존재한다.

```text
Answers
   ↓
Taste Profile
   ↓
Recommendation
   ↓
Recommendation Reasons
```

Frontend에서 UX 목적으로 일부 값을 임시 계산하거나 미리 표시할 수 있더라도 최종 결과는 Backend 결과를 기준으로 한다.

동일한 Domain Algorithm을 Web과 API에 각각 복제하지 않는다.

---

# 10. Shared Packages Policy

Monorepo라는 이유만으로 모든 코드를 공유하지 않는다.

공유 가능한 대표적인 항목:

```text
packages/contracts
├── API request schemas
├── API response schemas
├── shared contract types
└── contract version information
```

공유하지 않는 대표적인 항목:

```text
TypeORM Entity
NestJS Service
Repository implementation
React Component
React Query Hook
Zustand Store
Backend Domain Service implementation
```

공유 Package는 Web과 API의 내부 구현을 서로 노출하는 통로가 되어서는 안 된다.

UI 역시 현재는 Cross-application 공유 대상이 아니므로 `packages/ui`에 두지 않는다.

---

# 11. Contracts

Web과 API 사이에는 명시적인 Contract가 존재해야 한다.

예:

```ts
type CompleteAssessmentRequest = {
  assessmentId: string;
  assessmentVersion: number;
  answers: Array<{
    questionId: string;
    optionId: string;
  }>;
};

type CompleteAssessmentResponse = {
  sessionId: string;
  tasteProfile: TasteProfileDto;
  recommendations: RecommendationDto[];
};
```

이는 예시이며 실제 Contract는 구현 단계에서 결정한다.

Contract는 API 내부 Entity를 그대로 노출하지 않는다.

---

# 12. Contract Validation

TypeScript type만으로 runtime validation을 대체하지 않는다.

외부 경계를 통과하는 데이터는 runtime validation이 가능해야 한다.

```text
Browser
   ↓
HTTP Request
   ↓
Runtime Validation
   ↓
Application
```

구체적인 validation library는 프로젝트 초기 설정 시 결정한다.

동일한 schema를 Web과 API에서 공유할 수 있는지는 library 선택과 coupling을 검토한 후 결정한다.

---

# 13. Next.js Rendering Principle

Next.js에서는 Server Component를 기본값으로 사용한다.

Client Component는 다음과 같은 경우 사용한다.

- 사용자 interaction이 필요하다.
- Browser API가 필요하다.
- React Query hook이 필요하다.
- Zustand store를 사용한다.
- Client-side state가 필요하다.

`"use client"`를 편의를 위해 page 상단에 광범위하게 추가하지 않는다.

Client Boundary는 가능한 한 필요한 영역까지 아래로 내린다.

---

# 14. Server State vs Client State

상태는 다음 기준으로 구분한다.

## Server State

서버가 source of truth인 데이터.

예:

- Assessment
- Questions
- Cocktail
- Recommendation Result
- Favorites
- User Profile

Server State는 기본적으로 React Query 또는 Next.js server data fetching의 책임이다.

## Client State

현재 Browser interaction에만 필요한 상태.

예:

- 현재 질문 index
- 현재 선택 상태
- modal open state
- animation state
- UI filter state

Client State는 React local state 또는 Zustand를 사용한다.

---

# 15. Zustand Policy

Zustand를 Server State cache로 사용하지 않는다.

Bad:

```text
API
 ↓
fetch cocktails
 ↓
Zustand
 ↓
UI
```

Preferred:

```text
API
 ↓
React Query
 ↓
UI
```

Zustand는 여러 Client Component 사이에서 공유할 필요가 있는 Client State가 있을 때 사용한다.

Component 내부에서 충분한 상태는 `useState` 등 React local state를 우선한다.

---

# 16. React Query Policy

React Query는 Client Component에서 Server State의 다음 문제를 해결할 때 사용한다.

- fetching
- caching
- invalidation
- mutation
- retry
- optimistic update
- refetch

모든 GET 요청을 무조건 React Query로 감싸지 않는다.

Server Component에서 한 번 읽고 렌더링하면 충분한 데이터는 Next.js server data fetching을 우선 검토한다.

---

# 17. Server Component and React Query

다음 기준으로 선택한다.

## Server Component 우선

- SEO가 중요하다.
- 초기 페이지 콘텐츠다.
- 사용자 interaction 없이 서버에서 읽을 수 있다.
- Browser cache synchronization이 필요하지 않다.

예:

```text
Cocktail Detail
Static Cocktail Information
SEO Content
```

## React Query 우선

- Client interaction 후 데이터가 변한다.
- mutation 이후 invalidation이 필요하다.
- background refetch가 유용하다.
- Client session 동안 Server State를 지속적으로 동기화해야 한다.

예:

```text
Favorites
User History
Interactive Recommendation actions
```

둘을 결합해야 하는 경우 hydration 전략을 명시적으로 설계한다.

---

# 18. Assessment State

테스트 진행 상태는 다음처럼 구분한다.

```text
Assessment Definition
        ↓
   Server State

Current Question
Selected Answers
UI Progress
        ↓
   Client State
```

MVP에서 답변을 매 Question마다 서버에 저장할지, 완료 시 한 번에 제출할지는 별도 결정으로 남긴다.

단, Core Product Invariant P-006에 따라 일시적인 제출 실패가 모든 답변 손실로 이어지지 않도록 설계해야 한다.

---

# 19. Frontend Structure

초기 Frontend는 feature 중심 구조를 사용한다.

```text
apps/web/src/
│
├── app/
│
├── features/
│   ├── assessment/
│   ├── recommendation/
│   └── share-result/
│
├── entities/
│   ├── cocktail/
│   └── taste-profile/
│
└── shared/
    ├── api/
    ├── ui/
    ├── lib/
    └── config/
```

`shared/ui`는 shadcn/ui를 기반으로 한 Web Application의 재사용 가능한 UI Primitive를 관리한다.

예:

```text
shared/ui/
├── button.tsx
├── card.tsx
├── dialog.tsx
├── progress.tsx
└── radio-group.tsx
```

모든 shadcn/ui Component를 미리 추가하지 않는다.

현재 Feature에서 필요한 Primitive만 추가한다.

이 구조는 출발점이며 폴더 자체가 목적은 아니다.

---

# 20. Frontend Layer Rules

기본 Dependency Direction:

```text
app
 ↓
features
 ↓
entities
 ↓
shared
```

허용:

```text
features → entities
features → shared

entities → shared

app → features
app → entities
app → shared
```

금지:

```text
shared → entities
shared → features

entities → features
```

`shared/ui`는 Product Domain을 알지 못해야 한다.

Bad:

```text
shared/ui/recommendation-result-card.tsx
```

해당 Component가 Recommendation Domain을 이해한다면 `shared/ui`에 두지 않는다.

Preferred:

```text
shared/ui/card.tsx
        ↓
features/recommendation/components/recommendation-card.tsx
```

가능한 규칙은 ESLint로 강제한다.

---

# 21. Feature Responsibility

Feature는 사용자 행동 또는 Use Case를 표현한다.

예:

```text
assessment
recommendation
share-result
favorite-cocktail
```

Feature가 단순히 UI Component 이름을 기준으로 만들어지지 않도록 한다.

Bad:

```text
button-feature
modal-feature
card-feature
```

---

# 22. Entity Responsibility

Frontend Entity는 화면에서 사용되는 핵심 Domain 개념의 presentation representation을 가진다.

예:

```text
cocktail
taste-profile
```

Backend Domain Entity나 TypeORM Entity를 그대로 공유하지 않는다.

---

# 23. Shared Responsibility

`shared`에는 특정 Domain을 알 필요가 없는 코드만 둔다.

예:

```text
shared/ui
shared/api
shared/lib
shared/config
```

Bad:

```text
shared/recommendCocktail
shared/calculateTasteProfile
```

이러한 로직은 특정 Domain에 속한다.

---

# 24. UI System

Frontend의 기본 UI System은 다음과 같다.

```text
Design Tokens
      ↓
CSS Variables
      ↓
Tailwind CSS
      ↓
shadcn/ui
      ↓
shared/ui
      ↓
Entity / Feature UI
      ↓
Pages
```

Tailwind CSS를 기본 Styling System으로 사용한다.

동일한 역할을 위해 styled-components, Emotion 등 별도의 CSS-in-JS framework를 기본적으로 추가하지 않는다.

새로운 Styling System 도입에는 명확한 기술적 이유가 필요하다.

---

# 25. shadcn/ui Policy

shadcn/ui를 기본 General-purpose UI Component System으로 사용한다.

대표적인 Primitive:

```text
Button
Card
Dialog
RadioGroup
Checkbox
Select
Progress
Sheet
Accordion
Tooltip
```

새로운 UI가 필요할 때 다음 순서로 판단한다.

```text
UI Requirement
      ↓
Existing shared/ui?
      ↓
YES → Reuse / Compose
      ↓
NO
      ↓
Appropriate shadcn/ui primitive?
      ↓
YES → Add and customize
      ↓
NO
      ↓
Create project-specific component
```

다른 UI dependency 추가는 이후에 검토한다.

---

# 26. UI Ownership

shadcn/ui를 통해 추가된 Component는 Repository가 소유하는 Source Code로 취급한다.

따라서 다음은 허용한다.

- Product Design System에 맞는 Styling
- Design Token 적용
- 재사용 가능한 Variant 추가
- Accessibility 개선
- Generic Behavior 개선

하지만 Feature-specific 또는 Domain-specific Behavior를 범용 Primitive에 추가하지 않는다.

Bad:

```tsx
<Button cocktailId={cocktail.id}>즐겨찾기</Button>
```

Preferred:

```tsx
<FavoriteCocktailButton cocktailId={cocktail.id}>
  <Button>즐겨찾기</Button>
</FavoriteCocktailButton>
```

`Button`은 Cocktail Domain을 알 필요가 없다.

---

# 27. Design Tokens

서비스의 Visual Identity를 shadcn/ui 기본 스타일에만 의존하지 않는다.

Design Token을 CSS Variable 기반으로 관리한다.

초기 예:

```css
:root {
  --background: ...;
  --foreground: ...;

  --primary: ...;
  --secondary: ...;

  --muted: ...;
  --border: ...;
  --radius: ...;
}
```

Taste Visualization용 Semantic Token이 필요하면 Domain Model이 확정된 이후 추가한다.

예:

```css
--taste-sweet: ...;
--taste-sour: ...;
```

아직 확정되지 않은 Taste Dimension을 기준으로 Token을 미리 만들지 않는다.

---

# 28. UI Accessibility

shadcn/ui Primitive를 수정할 때 기존 접근성 동작을 유지한다.

특히 다음 Component는 Keyboard Interaction과 Accessible Semantics를 주의한다.

```text
Dialog
RadioGroup
Checkbox
Select
Sheet
Tooltip
```

시각적 Customization을 위해 Semantic Element나 Accessibility Behavior를 제거하지 않는다.

Frontend Test에서는 가능한 경우 다음을 기준으로 Interaction을 검증한다.

```text
role
label
accessible name
visible text
```

---

# 29. UI Dependency Policy

여러 General-purpose UI Component System을 병렬로 운영하지 않는다.

기본적으로 다음 구조는 피한다.

```text
shadcn/ui
+
MUI
+
Ant Design
```

추가 UI Library가 필요하다면 먼저 다음을 확인한다.

```text
Existing shared/ui?
        ↓
shadcn/ui?
        ↓
Small custom component?
        ↓
Specialized dependency required?
```

Chart나 Visualization처럼 shadcn/ui의 책임 밖에 있는 전문 Library는 필요에 따라 별도로 검토할 수 있다.

---

# 30. UI Package Extraction

현재 UI Primitive는 다음에 위치한다.

```text
apps/web/src/shared/ui
```

현재 UI Consumer가 하나이므로:

```text
packages/ui
```

를 생성하지 않는다.

향후 예를 들어:

```text
apps/web
apps/admin
```

두 Application이 실제로 같은 Design System과 UI Primitive를 공유하게 된다면 `packages/ui` 추출을 검토한다.

미래의 가능성만으로 미리 추출하지 않는다.

---

# 31. Backend Structure

NestJS는 Domain/Feature 단위 Module을 사용한다.

초기 예:

```text
apps/api/src/
│
├── modules/
│   ├── assessment/
│   ├── cocktail/
│   └── recommendation/
│
├── common/
│
└── infrastructure/
```

각 Module 내부에서는 필요에 따라:

```text
assessment/
├── domain/
├── application/
├── infrastructure/
└── presentation/
```

구조를 사용할 수 있다.

단순한 Module에 처음부터 모든 디렉터리를 강제하지 않는다.

복잡도가 생길 때 책임을 분리한다.

---

# 32. Backend Layer Responsibilities

## Presentation

HTTP를 담당한다.

예:

```text
Controller
Request DTO
Response DTO
HTTP error mapping
```

Domain Logic을 작성하지 않는다.

## Application

Use Case orchestration을 담당한다.

예:

```text
CompleteAssessment
GetAssessment
GetRecommendationResult
```

여러 Domain Object와 Repository를 조합할 수 있다.

## Domain

Business Rule을 담당한다.

예:

```text
calculateTasteProfile
calculateMatch
rankRecommendations
generateRecommendationReasons
```

Framework에 가능한 한 의존하지 않는다.

## Infrastructure

외부 기술과의 연결을 담당한다.

예:

```text
TypeORM
PostgreSQL
External API
Storage
```

---

# 33. Repository Boundary

Domain/Application은 TypeORM Repository를 직접 중심 개념으로 사용하지 않는다.

개념적으로:

```text
Application
    ↓
Repository Port
    ↑
TypeORM Adapter
```

예:

```ts
interface AssessmentRepository {
  findByIdAndVersion(id: string, version: number): Promise<Assessment | null>;
}
```

구체적인 interface 위치와 abstraction 수준은 실제 구현 복잡도를 보고 결정한다.

단순 CRUD까지 불필요하게 Repository abstraction으로 감싸지 않는다.

---

# 34. TypeORM Policy

TypeORM은 Infrastructure concern으로 취급한다.

TypeORM Entity가 다음 역할을 동시에 담당하지 않도록 한다.

```text
Database Model
+
API Response
+
Domain Model
```

Persistence Model과 Domain Model을 분리할 필요가 있는 영역은 분리한다.

특히 Recommendation처럼 핵심 Business Logic이 많은 영역에서는 TypeORM decorator가 Domain Logic을 지배하지 않도록 한다.

---

# 35. Database Boundary

PostgreSQL 접근은 API를 통해서만 이루어진다.

금지:

```text
apps/web → PostgreSQL
apps/web → TypeORM
packages/contracts → TypeORM
```

허용:

```text
apps/api/infrastructure → TypeORM → PostgreSQL
```

---

# 36. Database Change Policy

Database schema 변경은 Migration으로 관리한다.

Production schema 변경을 `synchronize: true`에 의존하지 않는다.

Schema 변경이 필요한 Feature는 다음을 포함해야 한다.

```text
Entity / Persistence Model
Migration
Relevant Tests
```

---

# 37. External Cocktail Data

외부 Cocktail API 또는 Dataset을 사용할 경우 외부 모델이 내부 Domain Model을 지배하지 않도록 한다.

```text
External API
     ↓
Adapter / Mapper
     ↓
Internal Cocktail Model
```

Bad:

```text
TheCocktailDB response
       ↓
Entire Application
```

외부 API 변경의 영향 범위를 Adapter에 제한한다.

---

# 38. Error Handling

Error는 Boundary에 맞게 처리한다.

```text
Domain Error
     ↓
Application
     ↓
Presentation
     ↓
HTTP Error
```

Frontend에서는 HTTP implementation detail보다 사용자 행동 관점으로 표현한다.

Bad:

```text
500 Internal Server Error
```

Preferred:

```text
추천 결과를 불러오지 못했어요.
잠시 후 다시 시도해주세요.
```

개발/관찰 환경에서는 원인 추적이 가능해야 한다.

---

# 39. Logging

Backend에서는 최소한 다음 종류의 중요한 실패를 추적할 수 있어야 한다.

- Assessment completion failure
- invalid Answer
- Taste calculation failure
- Recommendation failure
- Database failure

로그에 불필요한 사용자 입력이나 민감 정보를 저장하지 않는다.

구체적인 Logging/Observability Stack은 Production Architecture에서 결정한다.

---

# 40. API Design

API는 Resource와 Use Case를 명확하게 표현한다.

초기 후보:

```text
GET  /assessments/current

POST /assessment-sessions

POST /assessment-sessions/:id/complete

GET  /recommendations/:resultId

GET  /cocktails/:slug
```

실제 Endpoint는 Use Case 설계 시 결정한다.

CRUD Endpoint를 먼저 만든 뒤 Product Flow를 억지로 맞추지 않는다.

---

# 41. API Response Policy

API Response는 필요한 데이터만 제공한다.

TypeORM Entity를 그대로 반환하지 않는다.

```text
Persistence Entity
      ↓
Application Result
      ↓
Response DTO
      ↓
HTTP
```

이를 통해 DB schema와 Public Contract를 분리한다.

---

# 42. SEO Architecture

검색 유입은 Product Growth Loop의 일부이므로 SEO는 Architecture concern으로 취급한다.

SEO가 중요한 대표 페이지:

```text
/
cocktail detail
future flavor/category pages
```

가능한 경우 서버에서 indexable content를 제공한다.

Cocktail Detail에서 Client-side fetch 완료 후에만 핵심 콘텐츠가 나타나는 구조는 피한다.

---

# 43. Result Page Architecture

Result Page에는 개인화된 결과가 포함된다.

공유 전략을 설계할 때 다음을 분리한다.

```text
Private/Internal Result Data
        ↓
Share-safe Result Representation
        ↓
Shared URL / Metadata
```

공유 URL에 모든 Answer나 내부 Scoring 정보를 직접 포함하지 않는다.

---

# 44. Security Boundary

Browser에서 전달되는 값은 신뢰하지 않는다.

특히 다음은 Backend에서 다시 검증한다.

```text
assessmentId
assessmentVersion
questionId
optionId
sessionId
future userId
```

Recommendation Score를 Browser가 계산하여 authoritative result로 서버에 제출하는 구조를 사용하지 않는다.

---

# 45. Test Boundaries

테스트는 Architecture Boundary에 맞춰 작성한다.

## Domain Test

Framework 없이 핵심 규칙 검증.

## Application Test

Use Case orchestration 검증.

## Integration Test

Database / Repository / HTTP Boundary 검증.

## Frontend Component Test

사용자 interaction과 presentation 검증.

## E2E

Core Product Loop 검증.

---

# 46. Architecture Enforcement

가능한 Architecture Rule은 자동화한다.

Frontend:

```text
shared cannot import entities
shared cannot import features
entities cannot import features
```

Cross Application:

```text
apps/web cannot import apps/api
apps/api cannot import apps/web
```

Infrastructure:

```text
apps/web cannot import typeorm
packages/contracts cannot import typeorm
```

ESLint 또는 Architecture Validation Script를 사용하여 검증한다.

---

# 47. Root Verification

Repository root에서 하나의 명령으로 기본 품질 검증을 실행할 수 있어야 한다.

목표:

```text
pnpm check
```

개념적으로 다음을 포함한다.

```text
lint
typecheck
unit tests
architecture checks
build
```

구체적인 Script는 Harness 구현 단계에서 정의한다.

---

# 48. CI Principle

Local Verification과 CI Verification이 가능한 한 같은 명령을 사용한다.

```text
Developer / Codex
       ↓
pnpm check
       ↓
       PASS
       ↓
      PR
       ↓
      CI
       ↓
pnpm check
```

CI에서만 존재하는 숨겨진 품질 규칙을 최소화한다.

---

# 49. Codex Compatibility

Architecture는 AI Agent가 탐색하기 쉬워야 한다.

다음을 지향한다.

- 일관된 naming
- predictable directory structure
- 명확한 dependency direction
- 가까운 위치의 tests
- 작은 module
- explicit contracts
- automated architecture checks

Codex가 새로운 Feature를 추가할 때 기존 코드를 읽으면 자연스럽게 올바른 Pattern을 발견할 수 있어야 한다.

UI 작업에서도 다음 흐름이 쉽게 발견되어야 한다.

```text
Existing shared/ui
       ↓
shadcn/ui primitive
       ↓
Feature composition
```

---

# 50. Avoid Premature Abstraction

다음은 실제 필요가 생기기 전에 만들지 않는다.

- 범용 BaseRepository
- 범용 BaseService
- 모든 Entity를 위한 Generic CRUD
- 불필요한 Event Bus
- Microservices
- CQRS
- 별도 Recommendation Service
- Redis
- Message Queue
- `packages/ui`

필요성이 실제 요구사항이나 측정 결과로 확인되면 ADR을 통해 도입한다.

---

# 51. Architecture Decision Records

중요한 Architecture 변경은 ADR로 기록한다.

예:

```text
docs/decisions/

0001-use-monorepo.md
0002-backend-authoritative-recommendation.md
0003-server-component-by-default.md
```

ADR에는 최소한 다음을 포함한다.

```text
Context
Decision
Consequences
Alternatives
```

---

# 52. Initial Architecture Decisions

## ARCH-001 — Monorepo

Web과 API는 pnpm workspace와 Turborepo 기반 Monorepo에서 관리한다.

## ARCH-002 — Separate Applications

Next.js와 NestJS는 독립적인 Application Boundary를 유지한다.

## ARCH-003 — API Boundary

Web은 NestJS API를 통해 Backend capability를 사용한다.

## ARCH-004 — Backend Authority

Taste Profile과 Recommendation의 authoritative calculation은 Backend에서 수행한다.

## ARCH-005 — Server Component Default

Next.js Component는 Server Component를 기본값으로 한다.

## ARCH-006 — Explicit Client Boundary

Client interaction이 필요한 영역에만 Client Component를 사용한다.

## ARCH-007 — Server State

Client-side Server State 관리가 필요한 경우 React Query를 사용한다.

## ARCH-008 — Client State

공유가 필요한 순수 Client State에는 Zustand를 사용할 수 있다.

Local state로 충분하면 Zustand를 사용하지 않는다.

## ARCH-009 — Persistence Isolation

TypeORM과 PostgreSQL은 Backend Infrastructure Boundary 안에 둔다.

## ARCH-010 — Explicit Contracts

Web/API Boundary에는 명시적인 API Contract를 사용한다.

## ARCH-011 — Migration First

Database schema 변경은 Migration으로 관리한다.

## ARCH-012 — Architecture Enforcement

기계적으로 검증 가능한 Architecture Rule은 문서에만 두지 않고 ESLint 또는 Script로 검증한다.

## ARCH-013 — Framework-independent Domain

핵심 Recommendation 및 Taste 계산은 가능한 한 Framework-independent하게 작성한다.

## ARCH-014 — Tailwind CSS

Frontend의 기본 Styling System으로 Tailwind CSS를 사용한다.

## ARCH-015 — shadcn/ui

Web Application의 기본 General-purpose UI Component System으로 shadcn/ui를 사용한다.

## ARCH-016 — Application-owned UI

shadcn/ui Component는 `apps/web/src/shared/ui`에서 Repository-owned UI Primitive로 관리한다.

## ARCH-017 — No Premature UI Package

현재 UI Consumer가 하나이므로 `packages/ui`를 만들지 않는다.

실제 Cross-application UI sharing 요구가 생길 때 추출을 검토한다.

## ARCH-018 — Single General-purpose UI System

동일한 역할의 General-purpose UI Component Library를 병렬 운영하지 않는다.

추가 도입에는 명확한 기술적 근거가 필요하다.

---

# 53. Intentionally Deferred Decisions

현재 다음은 결정하지 않는다.

- 구체적인 GCP 서비스
- Docker deployment 구조
- API Gateway 사용 여부
- CDN 전략
- Redis
- Queue
- Authentication provider
- Analytics provider
- Monitoring provider
- Runtime validation library
- API contract generation 방식
- API versioning 방식
- Assessment answer persistence 방식
- Result URL persistence 방식
- Cocktail Dataset source
- Recommendation package 분리 여부
- `packages/ui` 추출 시점

---

# 54. Architecture Goal

Architecture의 목표는 다음 흐름을 보호하는 것이다.

```text
User
 ↓
Next.js
 ↓
Assessment UX
 ↓
NestJS API
 ↓
Domain
 ↓
Taste Profile
 ↓
Recommendation
 ↓
PostgreSQL
 ↓
Result
 ↓
Next.js
 ↓
User
```

기능이 증가하더라도 각 Layer의 책임과 Dependency Direction이 유지되어야 한다.

Architecture는 기능 개발을 방해하기 위한 규칙이 아니라 **변경을 안전하게 만들기 위한 제약조건**이다.
