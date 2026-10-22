Status: Accepted  
Version: v1  
Phase: 4  
Last Updated: 2026-10-20

# Frontend Architecture

## 1. Purpose

이 문서는 Cocktail Taste Test의 Phase 4 프론트엔드 아키텍처를 정의한다.

목표는 사용자가 회원가입 없이 8개의 취향 질문에 답하고, 자신의 Taste Profile과 칵테일 추천 결과를 확인하는 경험을 구현하는 것이다.

기존 Domain과 Backend API를 재사용하며, Frontend는 추천 알고리즘을 중복 구현하지 않는다.

## 2. Technology Stack

- Next.js 16 App Router
- React 19
- TypeScript
- TanStack Query
- Zustand
- Tailwind CSS
- shadcn/ui
- Vitest / React Testing Library

새로운 라이브러리는 실제 구현 단계에서 필요한 범위만 설치한다.

## 3. Architecture Principles

### FA-001 — Feature-oriented Architecture

다음 의존성 방향을 유지한다.

```text
app
 ↓
features
 ↓
entities
 ↓
shared
```

상위 레이어는 하위 레이어를 참조할 수 있다. 역방향 참조는 금지한다.

### FA-002 — Server Components by Default

Next.js 페이지는 기본적으로 Server Component를 사용한다.

사용자 입력, Zustand, React Query 등 클라이언트 기능이 필요한 영역만 Client Component로 분리한다.

### FA-003 — Backend as Source of Truth

Assessment 답변의 최종 검증, Taste Profile 생성, 추천 순위 계산, 추천 이유 생성은 NestJS API가 담당한다.

Frontend는 이 계산을 재구현하지 않는다.

### FA-004 — Recoverable User Experience

추천 요청이 실패해도 기존 답변을 유지하고 재시도할 수 있어야 한다.

### FA-005 — Anonymous Core Flow

핵심 테스트와 결과 확인에 로그인 또는 회원가입을 요구하지 않는다.

## 4. Page Structure

```text
/        Landing
/test    Assessment
/result  Recommendation Result
```

### Landing (`/`)

- 서비스 소개
- 테스트 시작 CTA
- 테스트의 목적과 예상 소요 시간 안내
- SEO를 고려한 Server Component 구성

### Assessment (`/test`)

- Assessment v1의 8개 질문
- 한 번에 하나의 질문 표시
- 진행률 표시
- 이전 질문 이동 및 답변 수정
- 질문별 선택 개수 제한
- 전체 답변 검증 후 제출

### Result (`/result`)

- 사용자의 Taste Profile 표시
- 추천 칵테일 최대 5개 표시
- 각 칵테일의 추천 이유 표시
- 추천 결과가 없는 경우의 안내
- 다시 테스트하기
- 새로고침 시 결과 복구

별도의 로딩 페이지는 만들지 않는다. 추천 요청 중에는 제출 화면에서 로딩 상태를 표시한다.

## 5. Assessment v1

질문은 다음 8개로 고정한다.

1. Sweet
2. Sour
3. Bitter
4. Alcohol Intensity
5. Refreshing
6. Preferred Flavors
7. Avoided Flavors
8. Preferred Base Spirits

질문의 ID, Answer ID 및 검증 규칙은 기존 `docs/domain/assessment.md`와 Domain 구현을 따른다.

### Core Questions

Q1~Q5는 `very-low`, `low`, `medium`, `high`, `very-high`, `unknown`을 사용한다.

`unknown`은 중립 점수가 아니라 취향 정보가 없음을 의미한다.

### Multi-select Questions

- Preferred Flavors: 최대 2개
- Avoided Flavors: 0개 이상, 중복 불가
- Preferred Base Spirits: 최대 2개
- Preferred Flavors와 Avoided Flavors는 겹칠 수 없음

Q6~Q8은 선택 개수가 0개여도 유효한 답변이 될 수 있다. 따라서 미응답과 빈 배열 응답을 구분한다.

## 6. Frontend Folder Structure

```text
apps/web/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── test/page.tsx
│   └── result/page.tsx
├── features/
│   ├── assessment/
│   │   ├── components/
│   │   ├── model/
│   │   └── lib/
│   └── recommendation/
│       ├── api/
│       └── components/
├── entities/
│   ├── cocktail/
│   └── taste-profile/
└── shared/
    ├── api/
    ├── ui/
    ├── lib/
    └── config/
```

폴더는 실제 파일이 필요할 때 생성한다.

`shared`에는 Domain에 종속되지 않는 코드만 배치한다.

## 7. State Management

### Assessment State — Zustand

다음 정보를 관리한다.

- 현재 질문 index
- 질문별 답변
- 답변 수정
- 이전/다음 질문 이동
- 테스트 초기화

질문 ID를 기준으로 답변을 저장하여 화면 순서와 Domain identity를 분리한다.

### Assessment Persistence — sessionStorage

Zustand의 persist 기능을 활용하여 테스트 진행 상태를 `sessionStorage`에 저장한다.

정책:

- 새로고침 시 답변 복구
- 동일 탭에서 이동 후 돌아왔을 때 답변 복구
- 브라우저 세션이 종료되면 영구 보존을 보장하지 않음
- 저장 데이터에 버전 정보를 포함
- 유효하지 않거나 호환되지 않는 저장 데이터는 복구하지 않음
- 저장소 접근 실패 시에도 메모리 기반 테스트 진행 가능

복구 완료 전에는 저장된 답변을 초기 상태로 덮어쓰지 않도록 hydration 처리를 고려한다.

### Recommendation Request — TanStack Query

`useMutation`으로 `POST /recommendations` 요청을 관리한다.

관리 대상:

- Pending
- Success
- Error
- Retry

중복 제출을 방지한다.

자동 재시도는 무조건 적용하지 않고, 사용자에게 명시적인 재시도 수단을 제공한다.

### Recommendation Result Persistence

추천 결과는 React Query mutation의 성공 데이터로 받아 화면에 표시한다.

새로고침 복구를 위해 결과의 직렬화 가능한 스냅샷을 별도의 `sessionStorage` 항목인 `cocktail-taste-test:recommendation-result`에 저장한다. 현재 스키마 버전은 `1`이다.

결과 복구 정책:

- 저장된 결과를 런타임 검증한 후 사용
- 결과 스키마 버전 확인
- 손상된 데이터는 폐기
- 유효한 결과가 없으면 `/test`로 이동할 수 있도록 안내
- 새 테스트를 시작하면 이전 결과를 초기화
- 새 제출을 시작할 때는 이전 결과와 새 답변이 혼합되지 않도록 처리
- `sessionStorage` 접근 실패 시 현재 클라이언트 이동에 한해 메모리 스냅샷 사용
- 저장 및 복구 양쪽에서 `parseRecommendationResponse()`로 HTTP Contract 검증

Zustand를 추천 결과의 별도 영구 상태 저장소로 사용하지 않는다.

## 8. API Integration

기존 API를 사용한다.

```http
POST /recommendations
Content-Type: application/json
```

요청:

```json
{
  "answers": [
    {
      "questionId": "sweet",
      "answerId": "medium"
    },
    {
      "questionId": "sour",
      "answerId": "high"
    },
    {
      "questionId": "bitter",
      "answerId": "low"
    },
    {
      "questionId": "alcohol-intensity",
      "answerId": "medium"
    },
    {
      "questionId": "refreshing",
      "answerId": "very-high"
    },
    {
      "questionId": "preferred-flavors",
      "answerIds": ["citrus"]
    },
    {
      "questionId": "avoided-flavors",
      "answerIds": []
    },
    {
      "questionId": "preferred-base-spirits",
      "answerIds": ["gin"]
    }
  ]
}
```

응답의 기본 구조:

```text
RecommendationResult
├── profile
│   ├── dimensions
│   ├── preferredFlavors
│   ├── avoidedFlavors
│   └── preferredBaseSpirits
└── recommendations[]
    ├── rank
    ├── cocktail
    └── reasons[]
```

실제 필드 타입은 기존 Domain의 `RecommendationResult`를 기준으로 API 계약을 정의한다.

### HTTP Contract Boundary

`packages/contracts`에 Web/API 공통 요청·응답 타입을 정의하는 방안을 우선 검토한다.

단, Backend Domain 구현을 Frontend에 직접 의존시키지 않는다.

현재 `packages/contracts`의 export 구성이 비어 있으므로 실제 계약 추가 및 패키지 설정은 구현 작업에서 수행한다.

HTTP 응답은 외부 데이터로 취급하며 런타임 검증을 고려한다.

### API Connection

Web과 API의 주소는 환경별 설정으로 분리한다.

Browser에서 API를 직접 호출할지, Next.js Route Handler를 경유할지는 P4 구현 초기에 결정한다.

선택한 방식에 맞춰 CORS, 환경 변수 및 오류 처리를 구성한다.

## 9. Error and Empty States

### Invalid Answers

- 필수 질문의 미응답 여부 확인
- 선택 개수 및 중복 확인
- Preferred/Avoided Flavor 충돌 방지
- 최종 검증은 Backend에서 재수행

### API Failure

- 답변 유지
- 오류 메시지 표시
- 다시 시도 가능
- 불필요한 중복 요청 방지

### Empty Recommendations

추천 배열이 비어 있어도 정상 응답일 수 있다.

결과 화면은 빈 배열을 오류로 간주하지 않고 안내와 재시작 동작을 제공한다.

### Missing Result

`/result` 직접 접근 또는 복구 데이터 부재 시 빈 화면이나 런타임 오류 대신 테스트로 돌아가는 경로를 제공한다.

## 10. Accessibility

- 질문과 선택지에 접근 가능한 이름 제공
- 키보드로 모든 질문에 답변 가능
- 진행률에 의미 있는 텍스트 제공
- 오류 메시지와 해당 입력 연결
- 로딩 상태를 접근성 있게 안내
- 이전/다음 이동 시 포커스 관리
- shadcn/ui의 기본 접근성 동작 유지

## 11. Testing Strategy

### Unit Tests

- 질문 이동
- 답변 저장 및 수정
- 선택 개수 제한
- 답변 직렬화
- 제출 가능 여부
- 저장 데이터 복구 및 검증

### Component Tests

- 질문 렌더링
- 선택지 상호작용
- 이전/다음 버튼
- 진행률
- 로딩/오류/빈 결과 화면

### Integration Tests

- Zustand와 sessionStorage 연동
- 추천 mutation의 성공 및 실패 처리
- API 요청·응답 계약
- 결과 복구 및 초기화

### E2E Acceptance Scenarios

- 익명 사용자가 8개 질문을 완료하고 결과 확인
- 이전 질문으로 이동하여 답변 수정
- 테스트 중 새로고침 후 답변 복구
- 추천 요청 실패 후 답변 유지 및 재시도
- 결과 페이지 새로고침 후 결과 복구
- 결과 없이 직접 접근했을 때 복구 안내

기존 `pnpm check`와 CI Quality Gate를 유지한다.

## 12. Phase 4 Implementation Plan

| Step  | Scope                               |
| ----- | ----------------------------------- |
| P4-02 | UI 구조, 질문 정의, 디자인 시스템   |
| P4-03 | Assessment 질문 화면                |
| P4-04 | Zustand 상태 및 sessionStorage 복구 |
| P4-05 | API Contract 및 React Query 연동    |
| P4-06 | 추천 결과 화면 및 결과 복구         |
| P4-07 | 통합 검증, E2E 및 CI                |

## 13. Acceptance Criteria

P4-01은 다음 조건을 만족할 때 완료된 것으로 판단한다.

- 기존 Product Invariants와 충돌하지 않는다.
- Assessment v1의 8개 질문 및 검증 규칙을 따른다.
- 프론트엔드에서 추천 알고리즘을 중복 구현하지 않는다.
- 질문 이전 이동과 답변 수정이 가능하도록 설계되어 있다.
- `sessionStorage`를 통한 답변 및 결과 복구 정책이 정의되어 있다.
- React Query와 Zustand의 책임이 분리되어 있다.
- 실패 및 빈 결과에 대한 사용자 경험이 정의되어 있다.
- 구현 단계별 테스트 기준이 존재한다.

## 14. P4-05 API 연결 결정

브라우저는 동일 출처의 Next.js `POST /api/recommendations`를 호출하고, Route Handler가 NestJS `POST /recommendations`로 요청을 전달한다. 이 방식은 브라우저에 백엔드 주소를 노출하지 않으며 현재 NestJS에 별도 CORS 설정을 추가하지 않아도 된다.

Route Handler는 서버 전용 `API_BASE_URL` 환경 변수를 사용한다. 로컬 개발에서는 NestJS를 `3001` 포트로 실행하고 Web을 기본 `3000` 포트로 실행한다.

```powershell
$env:PORT = "3001"
corepack pnpm --filter api dev

# 별도 터미널: apps/web/.env.local에 API_BASE_URL=http://localhost:3001 설정
corepack pnpm --filter web dev
```

React Query는 요청의 pending/success/error 상태만 관리한다. 성공 응답은 P4-06 결과 화면이 직접 소비할 수 있는 `RecommendationResponse`로 전달하며 Zustand 또는 sessionStorage에 중복 저장하지 않는다.

## 15. Deferred Decisions

다음 항목은 별도 구현 단계에서 결정한다.

- 공유 가능한 영구 결과 URL 및 서버 저장 방식
- 칵테일 상세 페이지
- 결과 공유 기능의 구체적인 구현
- Analytics
- 사용자 인증 및 즐겨찾기

이 항목들은 P4-01의 확정된 핵심 정책을 변경하지 않는 범위에서 후속 단계에 다룬다.

## 16. Phase 4 Implemented Scope

Phase 4의 현재 구현 범위는 다음과 같다.

- `/`, `/test`, `/result`의 익명 핵심 흐름
- Assessment v1의 8개 질문, 답변 수정, 선택 제한 및 접근성 있는 포커스 이동
- Zustand와 versioned `sessionStorage`를 사용한 진행 상태 복구
- Next.js Route Handler와 TanStack Query를 사용한 NestJS 추천 API 연동
- 런타임 HTTP Contract 검증, 오류 후 명시적 재시도 및 중복 제출 방지
- Taste Profile, 최대 5개 추천 카드, 구조화된 추천 이유 및 빈 추천 결과 표시
- versioned 결과 snapshot 복구와 다시 테스트하기
- Vitest/RTL, Playwright, PostgreSQL 통합 및 NestJS HTTP E2E 품질 게이트

추천 계산과 추천 이유 생성은 계속 Backend Domain의 책임이다. Web은 API의 rank를 그대로 표시하고 임의의 점수나 근거를 만들지 않는다.

## 17. Deployment Boundary and Readiness

현재 저장소에는 특정 배포 플랫폼을 확정한 실행 설정이 없다. Architecture의 목표 환경은 GCP이지만 Next.js, NestJS, PostgreSQL에 사용할 구체적인 GCP 서비스와 네트워크 토폴로지는 아직 결정되지 않았다.

현재 확인된 배포 전 필수 작업은 다음과 같다.

- Next.js와 NestJS의 런타임 서비스 및 리전 선택
- 운영 PostgreSQL 인스턴스, private connectivity, backup 및 복구 정책 선택
- `API_BASE_URL`과 `DATABASE_*`를 플랫폼의 Secret/환경 변수로 주입하고 저장소에 비밀값을 커밋하지 않는 절차
- 배포 전에 `db:migrate`를 한 번만 실행하는 release job과 실패 시 중단/복구 절차
- 승인된 catalog만 별도 절차로 seed/활성화하는 정책; 기본 `is_active=false`는 유지
- API health/readiness endpoint, 구조화 로그, 오류 추적 및 알림 추가
- 외부 HTTPS 종단과 Web→API 내부 통신 보안 결정

브라우저는 Web의 동일 출처 Route Handler만 호출하므로 현재 구조에서는 브라우저→NestJS CORS가 필요하지 않다. 향후 브라우저가 API를 직접 호출하도록 바꾸는 경우에만 허용 origin을 명시적으로 제한한다.

상세한 로컬/CI 검증과 단계별 배포 제안은 `docs/testing/frontend-e2e.md`를 따른다.
