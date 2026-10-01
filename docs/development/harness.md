# Machine-enforced Harness

## 1. Purpose

이 문서는 Repository의 Architecture, Type Safety, Tests, Build를 자동으로 검증하는 Machine-enforced Harness를 정의한다.

Documentation은 개발자와 Agent에게 규칙을 설명한다.

Harness는 가능한 규칙을 실제로 검증한다.

```text id="gjzmyc"
Documentation
      ↓
Architecture Rules
      ↓
Static Analysis
      ↓
Tests
      ↓
Build
      ↓
CI
```

목표:

> 중요한 규칙은 가능한 한 "기억해야 하는 규칙"이 아니라 "위반하면 실패하는 규칙"으로 만든다.

---

# 2. Harness Layers

초기 Harness는 다음 계층으로 구성한다.

```text id="yyc0vz"
AGENTS.md
      ↓
ESLint
      ↓
TypeScript
      ↓
Tests
      ↓
Architecture Checks
      ↓
Build
      ↓
CI
```

각 계층은 서로 다른 문제를 잡는다.

| Layer              | Responsibility         |
| ------------------ | ---------------------- |
| AGENTS.md          | Agent behavior         |
| ESLint             | code/static rules      |
| TypeScript         | type correctness       |
| Tests              | behavior/invariants    |
| Architecture Check | dependency boundaries  |
| Build              | production compilation |
| CI                 | merge gate             |

---

# 3. Monorepo Tooling

Repository는 다음을 사용한다.

```text id="t5aukv"
pnpm workspace
+
Turborepo
```

Workspace:

```text id="ezov92"
apps/*
packages/*
```

초기 Applications:

```text id="svflg4"
apps/web
apps/api
```

초기 Packages:

```text id="7j6zcu"
packages/contracts
packages/eslint-config
packages/typescript-config
```

현재 `packages/ui`는 생성하지 않는다.

---

# 4. pnpm Workspace

`pnpm-workspace.yaml`:

```yaml id="5a7e21"
packages:
  - "apps/*"
  - "packages/*"
```

Workspace에 실제 Package가 추가될 때만 Pattern을 확장한다.

---

# 5. Root package.json

Root Package는 Application dependency를 직접 소유하기보다 Workspace orchestration을 담당한다.

목표 구조:

```json id="zkpqpm"
{
  "name": "cocktail-taste-test",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "test:architecture": "tsx scripts/check-architecture.ts",
    "check": "pnpm lint && pnpm typecheck && pnpm test && pnpm test:architecture && pnpm build"
  },
  "devDependencies": {
    "tsx": "<compatible-version>",
    "turbo": "<compatible-version>"
  },
  "packageManager": "pnpm@<project-version>"
}
```

실제 버전은 Repository bootstrap 시점의 호환 가능한 안정 버전을 사용한다.

문서의 placeholder를 실제 `package.json`에 그대로 넣지 않는다.

---

# 6. One-command Verification

Local development와 Agent 작업의 기본 Quality Gate는:

```bash id="xnyvpy"
pnpm check
```

이다.

기본 순서:

```text id="m1fp71"
lint
  ↓
typecheck
  ↓
unit/domain tests
  ↓
architecture checks
  ↓
build
```

빠른 실패를 위해 상대적으로 저렴한 검사를 먼저 수행한다.

---

# 7. Why Build Is Part of Check

TypeScript와 Unit Test가 통과해도 Production Build가 실패할 수 있다.

특히 Next.js에서는 다음과 같은 문제가 Build 단계에서 발견될 수 있다.

- Server / Client Boundary
- Route configuration
- environment usage
- static generation
- bundling
- unsupported imports

따라서 Production Build를 기본 Quality Gate에 포함한다.

---

# 8. E2E Policy

초기 `pnpm check`에는 Core E2E를 포함하지 않는다.

이유:

- Browser startup 비용
- Database/API setup
- local feedback 속도
- Agent iteration 속도

대신 E2E는 별도 명령으로 둔다.

예:

```json id="kofxwy"
{
  "scripts": {
    "test:e2e": "..."
  }
}
```

CI에서는 Core E2E를 별도 Job으로 실행할 수 있다.

향후 E2E가 충분히 빠르고 안정적이면 `check:ci`에 포함한다.

---

# 9. CI-level Verification

향후 다음 구조를 목표로 한다.

```text id="p9n7ar"
pnpm check
    +
integration tests
    +
migration verification
    +
golden tests
    +
core E2E
```

필요하면:

```bash id="r4bqq1"
pnpm check:ci
```

를 추가한다.

하지만 초기 Repository에서는 사용되지 않는 Script를 미리 많이 만들지 않는다.

---

# 10. Turborepo

초기 `turbo.json`의 목적은 Workspace Task orchestration과 cache다.

예시:

```json id="zq61df"
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

실제 bootstrap 시 생성된 Next.js/NestJS/Vitest 구성에 맞춰 output과 dependency를 검증한다.

Configuration을 문서 예시와 맞추기 위해 실제 Tool behavior를 왜곡하지 않는다.

---

# 11. Workspace Script Contract

`turbo`가 일관되게 실행할 수 있도록 각 Application/Package는 필요한 Script를 제공한다.

대표적인 Script:

```text id="rd4m68"
lint
typecheck
test
build
```

단, Package 성격상 의미가 없는 Script를 억지로 만들지는 않는다.

예를 들어 configuration-only Package는 Build가 필요하지 않을 수 있다.

---

# 12. ESLint Responsibility

ESLint는 다음을 담당한다.

```text id="mywd3a"
Code Quality
Import Rules
Architecture Boundaries
Framework-specific Rules
```

가능한 Architecture Rule은 일반적인 lint와 함께 빠르게 검증한다.

---

# 13. Shared ESLint Configuration

공통 ESLint 설정은 다음 Package에서 관리한다.

```text id="0p7pdp"
packages/eslint-config
```

필요에 따라 다음 설정을 분리할 수 있다.

```text id="y67v6e"
base
next
nest
```

하지만 실제 중복이 생기기 전에 과도한 config abstraction을 만들지 않는다.

---

# 14. Frontend Architecture Rules

다음 Dependency Direction을 자동으로 보호한다.

```text id="dboskp"
app
 ↓
features
 ↓
entities
 ↓
shared
```

최소한 다음 위반을 검출한다.

```text id="okfbx6"
shared → entities
shared → features

entities → features
```

또한:

```text id="zzlydt"
apps/web → apps/api
apps/web → typeorm
apps/web → pg
```

를 금지한다.

---

# 15. Backend Architecture Rules

최소한 다음을 검출한다.

```text id="eq8ar9"
apps/api → apps/web
```

Controller/Presentation Layer에서는 가능한 경우 다음 직접 dependency를 제한한다.

```text id="u4gkqa"
TypeORM Repository
TypeORM DataSource
Persistence implementation
```

Controller가 Application/Service Boundary를 우회하지 않도록 한다.

---

# 16. Contracts Rules

`packages/contracts`는 Transport-safe Boundary다.

금지:

```text id="43pc6i"
packages/contracts → typeorm
packages/contracts → nestjs
packages/contracts → next
packages/contracts → react
```

Contracts가 Framework Package로 변하지 않도록 한다.

---

# 17. UI Architecture Rules

UI Primitive는:

```text id="1thwvc"
apps/web/src/shared/ui
```

에 위치한다.

`shared/ui`는 다음을 import하지 않는다.

```text id="fsmpq3"
features
entities
app
```

Product-specific Component가 필요한 경우 상위 Layer에서 Primitive를 조합한다.

---

# 18. Restricted Import Strategy

가능한 규칙은 ESLint `no-restricted-imports` 또는 이에 적합한 Import Boundary Rule로 구현한다.

개념 예시:

```js id="tsb6yi"
{
  files: ["apps/web/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@project/api", "apps/api/**"],
            message: "Web must communicate with API through HTTP contracts."
          },
          {
            group: ["typeorm", "pg"],
            message: "Web must not access persistence infrastructure."
          }
        ]
      }
    ]
  }
}
```

실제 Alias와 ESLint config format은 bootstrap 결과에 맞춘다.

문서 예시를 그대로 복사하기보다 실제 import resolution과 일치시킨다.

---

# 19. Why ESLint Alone Is Not Enough

Import Alias, relative path, dynamic import 등으로 인해 ESLint rule만으로 모든 Boundary를 보호하기 어려울 수 있다.

따라서 중요한 Cross-application Boundary는 별도의 Architecture Check에서도 검증한다.

```text id="d29jdr"
ESLint
   +
Architecture Script
```

두 검사는 목적이 일부 겹쳐도 된다.

중요한 Boundary에는 Defense in Depth를 허용한다.

---

# 20. Architecture Check

초기 Architecture Script:

```text id="r9tqwd"
scripts/check-architecture.ts
```

목적:

- Web → API implementation 차단
- API → Web 차단
- Web → persistence 차단
- Contracts → infrastructure/framework 차단
- Frontend Layer inversion 검출

---

# 21. Architecture Check Strategy

초기에는 작은 Static Check로 시작한다.

Repository가 성장하면 필요에 따라 AST 기반 분석 도구 도입을 검토한다.

초기부터 복잡한 Architecture Framework를 추가하지 않는다.

```text id="0ovkcd"
Simple Rules
     ↓
Actual Pain
     ↓
Stronger Tooling
```

---

# 22. Initial Architecture Script

초기 구현은 Node/TypeScript 기반으로 작성한다.

개념:

```ts id="u4oujx"
type ArchitectureCheck = {
  name: string;
  paths: string[];
  forbiddenPatterns: string[];
};
```

각 Rule은:

```text id="qfkn63"
Scan
 ↓
Violation?
 ↓
Print File + Rule
 ↓
Exit 1
```

형태로 동작한다.

---

# 23. Do Not Depend on rg by Default

Architecture Script가 반드시 `rg` 같은 OS-level executable에 의존할 필요는 없다.

CI, Windows, macOS 환경에서 동일하게 실행되는 것이 중요하다.

가능하면 Node 기반 file traversal/import analysis로 구현한다.

외부 executable을 사용한다면 개발/CI 환경에서 해당 dependency가 보장되어야 한다.

---

# 24. Architecture Check Output

실패 메시지는 Agent가 스스로 수정할 수 있을 정도로 구체적이어야 한다.

Bad:

```text id="dshwe9"
Architecture check failed.
```

Preferred:

```text id="7fdu2n"
Architecture violation:

Rule:
WEB_MUST_NOT_IMPORT_API

File:
apps/web/src/features/assessment/api.ts

Import:
@project/api/assessment

Expected:
Use the HTTP contract/API client boundary instead.
```

Harness는 단순히 실패시키는 것뿐 아니라 수정 방향을 제공해야 한다.

---

# 25. Architecture Rule IDs

Machine-enforced Rule에는 안정적인 ID를 부여한다.

초기 예:

```text id="9l1tzc"
ARCH-WEB-001
Web must not import API implementation.

ARCH-WEB-002
Web must not import TypeORM/PostgreSQL drivers.

ARCH-API-001
API must not import Web implementation.

ARCH-CONTRACT-001
Contracts must not depend on TypeORM.

ARCH-CONTRACT-002
Contracts must not depend on React/Next/Nest.

ARCH-FE-001
shared must not import entities.

ARCH-FE-002
shared must not import features.

ARCH-FE-003
entities must not import features.
```

Rule ID는 CI failure와 Documentation을 연결하는 데 사용한다.

---

# 26. TypeScript Verification

모든 TypeScript Workspace는 typecheck Script를 제공한다.

예:

```json id="n2e6kn"
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

Next.js/NestJS의 실제 tsconfig 구조에 맞춰 명령을 조정할 수 있다.

목표는:

> Production Build를 실행하지 않고도 빠르게 Type Error를 발견할 수 있는 명령이 존재해야 한다.

---

# 27. Shared TypeScript Configuration

공통 TypeScript 설정은:

```text id="brusjk"
packages/typescript-config
```

에서 관리할 수 있다.

예:

```text id="73v0p1"
base
next
nest
```

단, Framework별 설정 차이를 억지로 하나로 통합하지 않는다.

---

# 28. Test Runner

초기 Unit/Domain/Frontend Test Runner로 Vitest를 우선 검토한다.

Frontend DOM Test에는 Testing Library를 사용한다.

E2E에는 Playwright를 사용한다.

Backend Integration Test는 NestJS Test Utility와 실제 PostgreSQL 환경을 사용한다.

구체적인 설정은 각 Application bootstrap 시 확정한다.

---

# 29. Test Script

각 Workspace는 의미 있는 Test Script를 제공한다.

예:

```json id="ot0mqm"
{
  "scripts": {
    "test": "vitest run"
  }
}
```

Watch mode는 별도:

```json id="snmm7x"
{
  "scripts": {
    "test:watch": "vitest"
  }
}
```

CI용 Script가 interactive watch mode에 들어가지 않도록 한다.

---

# 30. Domain Test Speed

핵심 Domain Test는 가능한 한 DB/HTTP/Framework 없이 실행한다.

목표:

```text id="54abf4"
pnpm test
       ↓
Fast deterministic feedback
```

Recommendation 변경 시 Agent가 수초 단위로 반복 검증할 수 있어야 한다.

---

# 31. Golden Tests

Golden Recommendation Test가 충분히 빠르면 기본 Test Suite에 포함한다.

Dataset 크기 때문에 느려지면:

```text id="1y9jyk"
test:golden
```

으로 분리한다.

분리한 경우 CI에서는 필수 검증 대상으로 유지한다.

---

# 32. Database Integration Tests

Database Integration Test는 실제 PostgreSQL behavior를 기준으로 한다.

SQLite로 PostgreSQL integration을 대체하지 않는다.

CI에서는 Service Container 또는 이에 준하는 isolated PostgreSQL 환경을 사용한다.

검증 대상:

- migration
- constraints
- relations
- repository queries
- persistence mapping

---

# 33. Migration Verification

Database schema 변경이 존재하면 최소한 다음 흐름을 검증할 수 있어야 한다.

```text id="ldvv8s"
Empty PostgreSQL
       ↓
Run migrations
       ↓
Current Schema
       ↓
Integration Tests
```

Migration을 생성했지만 실제로 적용 가능한지 확인하지 않는 상태를 피한다.

---

# 34. Build Verification

각 Application은 Production Build Script를 가진다.

개념:

```text id="gk6umr"
apps/web
→ next build

apps/api
→ nest build
```

Root:

```bash id="1trcru"
pnpm build
```

은 Turborepo를 통해 전체 Build를 수행한다.

---

# 35. Environment Variables

필요한 환경 변수는 `.env.example`에서 이름과 목적을 확인할 수 있어야 한다.

Secret을 실제 값으로 Commit하지 않는다.

예:

```text id="z14i1f"
DATABASE_URL=
NEXT_PUBLIC_API_BASE_URL=
```

실제 변수는 Architecture/Deployment 구현에 맞춰 결정한다.

Harness는 가능하면 필수 환경 변수 누락을 빠르게 발견해야 한다.

---

# 36. Environment Validation

Runtime에서 중요한 환경 변수는 명시적으로 검증한다.

잘못된 환경 변수 때문에 Application 내부 깊은 위치에서 모호한 오류가 발생하지 않도록 한다.

필요해지면:

```text id="p7imvf"
scripts/check-env.ts
```

또는 Application startup validation을 사용한다.

사용되지 않는 validation infrastructure를 미리 만들지는 않는다.

---

# 37. Formatting

Formatter를 사용할 경우 Formatting과 semantic lint를 구분한다.

Formatting failure 때문에 Domain Test의 의미가 가려지지 않도록 Script 책임을 명확히 한다.

Prettier 또는 Tailwind class formatting 도구 도입 여부는 bootstrap 시 현재 Toolchain과 필요성을 검토해 결정한다.

---

# 38. CI

초기 CI는 GitHub Actions를 기준으로 한다.

목표:

```text id="jks54q"
Pull Request / Push
        ↓
Install
        ↓
pnpm check
```

기본 Workflow:

```yaml id="zybkm3"
name: CI

on:
  pull_request:
  push:
    branches:
      - main
      - develop

jobs:
  check:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@<current-major>

      - uses: pnpm/action-setup@<current-major>

      - uses: actions/setup-node@<current-major>
        with:
          node-version: "<project-node-version>"
          cache: "pnpm"

      - run: pnpm install --frozen-lockfile

      - run: pnpm check
```

Action major version과 Node version은 bootstrap 시점의 지원되는 안정 버전을 사용한다.

---

# 39. CI and Local Parity

가능한 한:

```text id="r2xejg"
Local
pnpm check

CI
pnpm check
```

를 유지한다.

CI에서만 존재하는 hidden validation을 최소화한다.

CI 전용 Infrastructure가 필요한 Integration/E2E는 별도 Job으로 분리할 수 있다.

---

# 40. CI Expansion

필요해지면 다음 Job을 추가한다.

```text id="tw3wkn"
check
integration
migration
e2e
```

예:

```text id="zw1yy5"
check
   ↓
integration
   ↓
e2e
```

또는 독립적으로 병렬화할 수 있다.

초기부터 복잡한 Pipeline을 만들지 않는다.

---

# 41. Core E2E Gate

Core Product Loop E2E가 구현되면 CI에서 보호한다.

최소 Scenario:

```text id="utrc9k"
Landing
   ↓
Start Test
   ↓
Answer Required Questions
   ↓
Complete
   ↓
Taste Profile
   ↓
Recommendation
   ↓
Recommendation Reason
   ↓
Explore / Share
```

P-001에 따라 Account 없이 통과해야 한다.

---

# 42. Failure Recovery Gate

P-006을 보호하는 대표 Scenario:

```text id="s2trtc"
Answer Questions
      ↓
Submit
      ↓
Temporary API Failure
      ↓
Error UI
      ↓
Answers Preserved
      ↓
Retry
      ↓
Success
```

이 Scenario는 Frontend Test 또는 E2E 중 가장 안정적이고 적절한 Layer에서 보호한다.

---

# 43. Harness Must Not Be Bypassed

다음을 금지한다.

```text id="1ay2oc"
Failing test 삭제

Test skip으로 변경

Architecture Rule disable

Type Error → any

Lint Error → broad eslint-disable

Build failure 무시

CI Job 삭제
```

단순히 Green 상태를 만들기 위해 Harness를 약화하지 않는다.

Rule 자체가 잘못된 경우에는 Rule 변경 이유를 검토하고 필요한 Documentation/ADR을 업데이트한다.

---

# 44. Harness Evolution

Harness도 Product와 함께 진화한다.

새로운 반복 문제를 발견하면:

```text id="4q9icf"
Repeated Failure
      ↓
Can it be automated?
      ↓
YES
      ↓
Add Harness Rule
```

예:

Codex가 반복해서 Feature에서 직접 `fetch()`를 호출한다면:

```text id="6olkb6"
Documentation Rule
      ↓
Repeated violation
      ↓
ESLint / Architecture Rule
```

로 승격할 수 있다.

---

# 45. Avoid Over-enforcement

모든 설계 선호를 자동 Rule로 만들지 않는다.

Machine Rule은 다음 조건에 적합하다.

- 명확하다.
- 예외가 드물다.
- 자동 판정이 안정적이다.
- 위반 비용이 크다.

예:

```text id="0en9qo"
Web must not import TypeORM
```

은 좋은 Machine Rule이다.

반면:

```text id="u4i05l"
Every function should be small
```

같은 규칙은 기계적으로 강제하지 않는다.

---

# 46. Codex Verification Protocol

Codex는 구현 중:

```text id="q7f2xv"
Focused Test
    ↓
Focused Test
    ↓
pnpm check
```

순서로 검증한다.

예:

```text id="oayhvn"
Recommendation 변경

→ Recommendation tests
→ Golden tests
→ pnpm check
```

Database 변경:

```text id="oix94i"
Migration
→ Migration verification
→ Repository integration test
→ pnpm check
```

UI 변경:

```text id="avoy48"
Relevant frontend test
→ lint
→ typecheck
→ pnpm check
```

---

# 47. Initial Harness Definition of Done

Phase 0 Repository bootstrap이 완료되려면 최소한 다음이 실제로 동작해야 한다.

```text id="bf7elc"
[ ] pnpm workspace configured

[ ] Turborepo configured

[ ] apps/web exists

[ ] apps/api exists

[ ] packages/contracts exists

[ ] shared TypeScript configuration exists

[ ] shared ESLint configuration exists

[ ] Tailwind CSS configured

[ ] shadcn/ui configured in apps/web

[ ] shared/ui location established

[ ] lint command works

[ ] typecheck command works

[ ] unit test command works

[ ] architecture check works

[ ] production build works

[ ] pnpm check works

[ ] CI executes pnpm check
```

---

# 48. Harness Smoke Test

Architecture Rule이 실제로 동작하는지 초기 bootstrap 단계에서 의도적인 위반을 만들어 확인한다.

예:

```ts id="p8f2gw"
// temporary verification only

import { DataSource } from "typeorm";
```

를 Web에 넣었을 때:

```text id="p2zqj5"
pnpm lint
or
pnpm test:architecture
```

가 실패해야 한다.

검증 후 의도적인 위반 코드는 반드시 제거한다.

같은 방식으로 대표 Architecture Rule 몇 개를 Smoke Test한다.

Harness가 존재한다는 사실보다 **실제로 위반을 잡는지**가 중요하다.

---

# 49. Bootstrap Principle

Phase 0 implementation에서 Codex는 한 번에 Product Feature까지 구현하지 않는다.

순서:

```text id="c8h1ug"
Repository
    ↓
Toolchain
    ↓
Web/API Skeleton
    ↓
Shared Config
    ↓
Harness
    ↓
Harness Verification
    ↓
Phase 1
```

Taste Profile, Recommendation Algorithm, Cocktail Dataset 같은 Deferred Domain Decision을 bootstrap 과정에서 임의로 결정하지 않는다.

---

# 50. Final Principle

Machine-enforced Harness의 목적은 많은 Tool을 설치하는 것이 아니다.

목표는:

```text id="r0sw5d"
Agent Change
     ↓
Fast Feedback
     ↓
Violation Detected
     ↓
Agent Fixes
     ↓
pnpm check
     ↓
Safe Change
```

를 만드는 것이다.

좋은 Harness는 Agent에게 단순히 실패를 알리지 않는다.

가능하면:

```text id="v0kzxg"
What failed?
Why is it forbidden?
Where did it happen?
What boundary should be used instead?
```

를 알려준다.

이를 통해 Repository 자체가 Codex에게 올바른 구현 방향을 가르치는 환경이 되도록 한다.
