# AGENTS.md

## 1. Purpose

This repository contains the **Cocktail Taste Test** service.

The product helps users discover their taste preferences and receive explainable cocktail recommendations without requiring cocktail knowledge or account registration.

This file defines the default working rules for coding agents operating in this repository.

Detailed product, domain, architecture, and testing rules live under `docs/`.

---

## 2. Read Before Changing Code

Before making non-trivial changes:

1. Understand the user's request.
2. Read the relevant documentation.
3. Inspect the existing implementation and tests.
4. Identify affected product/domain invariants.
5. Plan the smallest safe change.
6. Implement.
7. Test.
8. Run repository verification.
9. Report what changed and what was verified.

Do not modify code based only on assumptions about the repository.

---

## 3. Sources of Truth

Use the following order when gathering project context:

```text
User Request
    ↓
AGENTS.md
    ↓
Relevant Product Documentation
    ↓
Relevant Domain Documentation
    ↓
Relevant Architecture Documentation
    ↓
Testing Documentation
    ↓
Existing Code and Tests
```

Important documents:

```text
docs/product/vision.md
docs/product/core-loop.md

docs/domain/overview.md

docs/architecture/overview.md

docs/testing/strategy.md

docs/development/codex-working-rules.md
```

Do not read every document mechanically for every trivial change.

Read the documents relevant to the requested work.

If documentation and implementation materially conflict, do not silently choose one. Determine the cause and report the inconsistency when necessary.

---

## 4. Product Promise

The primary user must be able to:

```text
Visit
  ↓
Start the taste test
  ↓
Answer questions
  ↓
Receive a Taste Profile
  ↓
Receive explainable cocktail recommendations
  ↓
Explore or share the result
```

without creating an account.

Do not introduce changes that unnecessarily block this flow.

---

## 5. Protected Product Invariants

Always preserve the Product Invariants defined in:

```text
docs/product/core-loop.md
```

Especially:

### P-001 — Anonymous Test

A user can complete the core test without an account.

### P-002 — No Expert Knowledge

The test must not require cocktail expertise.

### P-003 — Complete Answers

Recommendations require valid answers to all required questions.

### P-004 — Explainable Recommendation

Recommendations must provide reasons connected to the user's taste.

### P-005 — Deterministic Core

The same versioned inputs must produce the same core recommendation result.

### P-006 — Recoverable Failure

Temporary submission failure must not unnecessarily destroy the user's completed answers.

### P-007 — Result Independence

Share failure must not make the recommendation result unavailable.

### P-008 — Primary CTA

The primary first-visit action is starting the taste test, not signing up.

If a requested change conflicts with these rules, treat it as a Product decision rather than silently overriding the invariant.

---

## 6. Core Domain Flow

The primary Domain flow is:

```text
Assessment
    ↓
Answers
    ↓
Taste Profile
    ↓
Cocktail Profile
    ↓
Recommendation
    ↓
Recommendation Reasons
```

Do not bypass this model without an explicit Domain decision.

In particular:

```text
Option
  X
Direct Cocktail Recommendation
```

Do not directly map a question option to a recommended cocktail.

Preferred:

```text
Option
   ↓
Taste Effects
   ↓
Taste Profile
   ↓
Recommendation Engine
   ↓
Cocktail
```

---

## 7. Domain Boundaries

Keep these responsibilities separate.

### Assessment

What was asked and what did the user answer?

### Taste

What do those answers mean about the user's preferences?

### Cocktail

What characteristics does the cocktail have?

### Recommendation

How well does the user's Taste Profile match Cocktail Profiles?

Do not mix these responsibilities for implementation convenience.

---

## 8. Recommendation Rules

Recommendation is a high-impact Domain area.

Changes to any of the following require additional care:

```text
Taste Dimensions
Question Effects
Scoring
Cocktail Profiles
Candidate Filtering
Matching Algorithm
Ranking
Recommendation Reasons
```

Recommendation logic must remain:

- deterministic
- testable
- explainable
- reproducible
- consistent with Recommendation Reasons

When changing Recommendation behavior:

1. Read the relevant Domain rules.
2. Inspect existing Domain tests.
3. Inspect Golden Recommendation tests.
4. Consider version impact.
5. Update tests intentionally.
6. Run repository verification.

Do not update Golden expectations merely to make a failing test pass.

---

## 9. Version-sensitive Domain Changes

The following changes may alter the meaning of existing results:

```text
Assessment Questions
Option Effects
Taste Scoring
Cocktail Dataset
Cocktail Profiles
Recommendation Algorithm
```

When changing these areas, determine whether the corresponding version must change.

Recommendation reproducibility may depend on:

```text
Assessment Version
+
Answers
+
Scoring Version
+
Cocktail Dataset Version
+
Recommendation Algorithm Version
```

Do not silently change the meaning of existing versioned data.

---

## 10. System Architecture

The primary architecture is:

```text
Browser
   ↓
Next.js Web
   ↓
NestJS API
   ↓
Application / Domain
   ↓
Repository / Infrastructure
   ↓
TypeORM
   ↓
PostgreSQL
```

Primary stack:

### Web

- Next.js
- React
- TypeScript
- TanStack Query
- Zustand
- Tailwind CSS
- shadcn/ui

### API

- NestJS
- TypeScript
- TypeORM

### Database

- PostgreSQL

### Repository

- pnpm workspace
- Turborepo

### Infrastructure

- GCP

---

## 11. Application Boundaries

`apps/web` and `apps/api` are separate Application Boundaries.

Never introduce dependencies such as:

```text
apps/web → apps/api internal implementation

apps/api → apps/web

apps/web → TypeORM

apps/web → PostgreSQL
```

Web communicates with API through explicit HTTP Contracts.

---

## 12. Shared Code Policy

Do not share code merely because this is a Monorepo.

Shared Packages must have a clear cross-application responsibility.

Expected initial Shared Packages include:

```text
packages/contracts
packages/eslint-config
packages/typescript-config
```

Do not share the following through `packages/contracts`:

```text
TypeORM Entities
NestJS Services
Repositories
React Components
React Query Hooks
Zustand Stores
Backend Domain implementation
```

Database Model, Domain Model, API DTO, and Frontend View Model are not automatically the same thing.

Do not create `packages/ui` at the current stage.

The Web Application is currently the only UI consumer.

---

## 13. Frontend Architecture

Use a feature-oriented structure.

Initial direction:

```text
apps/web/src/

app/
features/
entities/
shared/
```

Dependency direction:

```text
app
 ↓
features
 ↓
entities
 ↓
shared
```

Allowed examples:

```text
features → entities
features → shared

entities → shared

app → features
app → entities
app → shared
```

Forbidden:

```text
shared → entities
shared → features

entities → features
```

Do not introduce extra architectural layers unless there is a concrete need.

---

## 14. Next.js Rules

Server Components are the default.

Use Client Components when required for:

- user interaction
- Browser APIs
- React Query
- Zustand
- client-only state

Keep `"use client"` boundaries as low as reasonably possible.

Do not convert large page trees to Client Components merely for convenience.

---

## 15. Frontend State Rules

Classify state before choosing a state management tool.

### Server State

Examples:

```text
Assessment
Cocktail
Recommendation Result
Favorites
User Profile
```

Use Next.js server data fetching or React Query depending on interaction requirements.

### Shared Client State

Use Zustand when client-only state genuinely needs to be shared.

### Local State

Prefer React local state when the state is local to a Component or small subtree.

Do not duplicate React Query/Server State in Zustand.

---

## 16. React Query Rules

Use React Query for interactive Server State where capabilities such as these are useful:

- caching
- mutation
- invalidation
- retry
- optimistic updates
- background refetching

Do not wrap every server read in React Query automatically.

For SEO-critical or server-renderable initial content, consider Next.js server fetching first.

---

## 17. UI System

The Web Application uses:

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
```

Tailwind CSS is the default Styling System.

shadcn/ui is the default General-purpose UI Component System.

Do not introduce another General-purpose UI Component Library or CSS-in-JS framework without a concrete technical reason.

---

## 18. UI Rules

Reusable UI Primitives live in:

```text
apps/web/src/shared/ui
```

Examples:

```text
Button
Card
Dialog
Progress
RadioGroup
Checkbox
Select
Sheet
Accordion
```

Before creating a new reusable UI Primitive:

1. Search `shared/ui` for an existing Component.
2. Reuse or compose it when appropriate.
3. If none exists, check whether shadcn/ui provides an appropriate Primitive.
4. Add only the shadcn/ui Component required by the current Feature.
5. Create a custom Primitive when shadcn/ui does not appropriately solve the requirement.
6. Add another dependency only when the previous options are insufficient.

Do not install shadcn/ui Components speculatively.

---

## 19. shadcn/ui Ownership

shadcn/ui Components added to this Repository are project-owned Source Code.

They may be customized to match the Product Design System.

Allowed examples:

- Styling changes
- Design Token integration
- reusable Variants
- Accessibility improvements
- Generic Behavior improvements

Do not add Feature or Domain-specific behavior to generic `shared/ui` Primitives.

Bad:

```text
shared/ui/cocktail-card
shared/ui/recommendation-result
```

when those Components understand Cocktail or Recommendation Domain concepts.

Prefer:

```text
shared/ui/card
        ↓
entities/cocktail
```

or:

```text
shared/ui/card
        ↓
features/recommendation
```

---

## 20. Styling Rules

Use Tailwind CSS and the project's Design Tokens for normal Styling.

Prefer:

```text
Design Tokens
      ↓
CSS Variables / Tailwind
      ↓
shared/ui
      ↓
Product Components
```

Do not introduce styled-components, Emotion, or another General-purpose Styling System merely for local convenience.

Avoid arbitrary one-off visual values when an appropriate Design Token already exists.

Do not create speculative Taste-specific Tokens before the corresponding Taste Dimensions are part of the current Domain Model.

---

## 21. UI Accessibility

Preserve Accessibility behavior when customizing shadcn/ui Primitives.

Pay particular attention to:

```text
Dialog
RadioGroup
Checkbox
Select
Sheet
Tooltip
```

Do not remove Keyboard Interaction or Semantic Accessibility behavior for visual convenience.

Frontend tests should prefer user-observable selectors such as:

```text
role
label
accessible name
visible text
```

over implementation-specific selectors when practical.

---

## 22. UI Dependency Policy

Do not casually combine multiple General-purpose UI Component Systems.

Avoid architectures such as:

```text
shadcn/ui
+
MUI
+
Ant Design
```

If a specialized capability is outside shadcn/ui's responsibility, such as advanced visualization, evaluate a focused Library separately.

A specialized Library is not automatically considered a competing General-purpose UI System.

---

## 23. UI Package Policy

Do not create:

```text
packages/ui
```

at the current stage.

Keep UI Primitives in:

```text
apps/web/src/shared/ui
```

If multiple Applications later require the same Design System and UI Primitives, evaluate extracting them into `packages/ui`.

Do not create Shared Packages based only on hypothetical future reuse.

---

## 24. Backend Architecture

Keep Backend responsibilities separated.

Conceptually:

```text
Presentation
    ↓
Application
    ↓
Domain
    ↓
Repository Boundary
    ↑
Infrastructure
```

### Presentation

HTTP concerns:

- Controllers
- Request DTOs
- Response DTOs
- HTTP error mapping

Do not place Business Logic in Controllers.

### Application

Coordinates Use Cases.

### Domain

Contains Business Rules and calculations.

### Infrastructure

Contains technical integrations such as:

- TypeORM
- PostgreSQL
- external APIs

---

## 25. Domain Purity

Keep core Taste and Recommendation calculations as framework-independent as reasonably possible.

Prefer logic shaped like:

```ts
calculateTasteProfile(...)
calculateMatch(...)
rankRecommendations(...)
generateRecommendationReasons(...)
```

Avoid unnecessary dependencies on:

```text
NestJS
TypeORM
HTTP
Next.js
React
PostgreSQL
```

This logic should be easy to test deterministically.

---

## 26. Backend Authority

The authoritative calculation of the following belongs to the Backend:

```text
Answers
   ↓
Taste Profile
   ↓
Recommendation
   ↓
Recommendation Reasons
```

Do not make client-calculated Recommendation Scores authoritative.

The Backend must validate Browser input independently.

---

## 27. API Contracts

Web/API communication uses explicit Contracts.

Do not expose TypeORM Entities directly as API Responses.

Conceptually:

```text
Persistence Entity
      ↓
Application Result
      ↓
Response DTO
      ↓
HTTP
```

External input requires runtime validation at the appropriate boundary.

---

## 28. Database Rules

PostgreSQL is accessed through the Backend Infrastructure Boundary.

Database schema changes must use Migrations.

Do not rely on:

```text
synchronize: true
```

as the Production schema migration strategy.

For schema changes, consider:

```text
Persistence Model
Migration
Existing Data
Constraints
Tests
Compatibility
```

Do not perform destructive data operations without explicit justification and appropriate approval.

---

## 29. External Data

External Cocktail APIs or Datasets must not become the application's internal Domain Model.

Use an Adapter/Mapping Boundary:

```text
External Data
     ↓
Adapter / Mapper
     ↓
Internal Cocktail Model
```

Keep external schema changes isolated from the rest of the Application where possible.

---

## 30. Architecture Enforcement

Architecture Rules that can be checked mechanically should not exist only in documentation.

Use ESLint and/or Architecture Validation Scripts for rules such as:

```text
apps/web must not import apps/api

apps/api must not import apps/web

apps/web must not import typeorm

packages/contracts must not import typeorm

shared must not import entities

shared must not import features

entities must not import features
```

Do not disable Architecture Rules merely to make an implementation easier.

---

## 31. Implementation Rules

Prefer the smallest safe change.

Before creating new code:

1. Search for an existing implementation.
2. Search for an existing Pattern.
3. Reuse it when appropriate.

Do not perform unrelated Refactors.

Do not rewrite existing Modules merely because another design is preferable.

Do not create abstractions before there is a concrete need.

Avoid premature additions such as:

```text
BaseRepository
BaseService
Generic CRUD framework
Event Bus
CQRS
Microservices
Redis
Message Queue
packages/ui
```

Introduce them only when requirements justify them.

---

## 32. Dependency Rules

Before adding a Dependency, check whether:

1. existing Dependencies can solve the problem;
2. platform/framework APIs are sufficient;
3. a small local implementation is appropriate.

If a new Dependency is justified, consider:

- maintenance
- security
- runtime/bundle impact
- compatibility
- complexity

Do not add Dependencies casually.

Do not enforce an absolute "never add Dependencies" rule either.

---

## 33. Type Safety

Avoid unnecessary:

```ts
any;
```

and unsafe casts such as:

```ts
value as unknown as SomeType;
```

Do not use Type Assertions to hide an unresolved data-contract problem.

Validate external data at runtime where required.

---

## 34. Error Handling

Do not hide Errors merely to keep the happy path working.

Avoid patterns such as:

```ts
try {
  await operation();
} catch {
  return null;
}
```

unless ignoring that specific Error is intentional and documented by behavior.

Separate user-facing Error Messages from diagnostic information.

---

## 35. Do Not Fake Success

Never make verification pass by hiding the problem.

Do not:

- delete failing tests without justification;
- replace valid types with `any`;
- disable lint rules to bypass Architecture;
- swallow Errors;
- remove Validation;
- exclude failing code from checks;
- change Golden expectations solely because they failed.

Fix the underlying issue or report the unresolved failure.

---

## 36. Testing Rules

Testing strategy is defined in:

```text
docs/testing/strategy.md
```

Prioritize:

```text
Domain Invariants
       ↓
Core Use Cases
       ↓
API Boundaries
       ↓
Critical UI
       ↓
Core E2E
```

Test behavior rather than implementation details.

---

## 37. Bug Fix Rule

When practical:

```text
Reproduce Bug
    ↓
Regression Test Fails
    ↓
Implement Minimal Fix
    ↓
Regression Test Passes
    ↓
Repository Verification
```

Bug fixes should leave Regression protection when meaningful.

---

## 38. Golden Recommendation Tests

Recommendation behavior is protected by Golden Cases.

When a Golden Test fails:

1. inspect the Recommendation change;
2. determine whether the behavior change is intended;
3. fix the Algorithm if it is a Regression;
4. update the Golden expectation only if the behavior change is intentional;
5. consider Domain Documentation/Version changes.

Golden Tests are not Snapshots to update blindly.

---

## 39. Core E2E

Maintain at least one E2E scenario protecting the primary anonymous flow:

```text
Landing
   ↓
Start Test
   ↓
Answer Required Questions
   ↓
Complete Test
   ↓
Taste Profile
   ↓
Recommendations
   ↓
Recommendation Explanation
   ↓
Explore / Share
```

Do not move every Edge Case into E2E.

Test detailed Domain Edge Cases at lower levels.

---

## 40. Documentation Rules

Update Documentation when a change alters a Source of Truth.

Examples:

- Product Invariant
- Domain Rule
- Architecture Boundary
- Recommendation Behavior
- important Workflow
- major Infrastructure Decision

Do not update Documentation unnecessarily for implementation-only changes.

Clearly distinguish:

```text
Current
Planned
Candidate
Deferred
```

Do not document unimplemented future behavior as current behavior.

---

## 41. ADR Rules

Use an Architecture Decision Record for important long-lived decisions with meaningful trade-offs.

Examples:

- major Architecture changes
- new Infrastructure
- Domain Boundary changes
- major Recommendation Strategy changes

Do not create ADRs for trivial implementation choices.

---

## 42. Verification

Run the smallest relevant tests while implementing.

Before considering a non-trivial task complete, the target Repository-level verification is:

```bash
pnpm check
```

The intended gate includes:

```text
lint
typecheck
unit/domain tests
architecture checks
build
```

Additional CI verification may include:

```text
integration tests
migration verification
golden tests
core E2E
```

Use the actual Scripts available in the Repository.

Do not claim a command passed unless it was actually executed successfully.

---

## 43. Verification Failures

If verification fails:

```text
Failure
   ↓
Understand Cause
   ↓
Fix
   ↓
Run Again
```

Determine whether the failure was introduced by the current change.

Do not silently expand the task to repair unrelated existing failures.

If an unrelated pre-existing failure remains, report it clearly.

---

## 44. Unable to Verify

If required verification cannot be executed because of the environment, state:

- what was not verified;
- why it could not be verified;
- what was verified successfully.

Never report unexecuted verification as successful.

---

## 45. Protect Existing User Changes

Do not revert or overwrite unrelated user changes.

Do not perform destructive Git operations unless explicitly required and safe.

Avoid:

```text
force push
unrelated history rewrite
mass deletion
discarding unrelated working tree changes
```

---

## 46. Configuration Changes

Treat broad configuration files as high-impact.

Examples:

```text
package.json
pnpm-lock.yaml
tsconfig
ESLint configuration
Next.js configuration
NestJS configuration
CI
Docker
Terraform
```

Modify them only when required by the task.

Do not cause unrelated lockfile churn.

---

## 47. Temporary Code

Do not leave accidental temporary code in completed work.

Examples:

```text
debug console.log
temporary endpoints
hard-coded debug values
debug UI
unused experimental files
```

Intentional Production Logging is not temporary debug code.

---

## 48. Definition of Done

A non-trivial task is complete when:

- the requested behavior is implemented;
- relevant Product Invariants remain valid;
- relevant Domain Invariants remain valid;
- Architecture Boundaries are preserved;
- appropriate Tests exist;
- important Failure Paths are considered;
- required Documentation is updated;
- relevant Verification passes;
- Repository-level Verification passes when executable;
- unresolved Verification limitations are reported accurately.

Do not call partially implemented or failing work complete.

---

## 49. Final Report

For non-trivial work, report concisely:

```text
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

Report facts rather than confidence statements.

Prefer:

```text
pnpm check: passed
```

over:

```text
Everything should work perfectly.
```

---

## 50. Default Working Principle

When uncertain, prefer:

```text
Understand first
       ↓
Follow existing patterns
       ↓
Make the smallest safe change
       ↓
Protect invariants
       ↓
Test behavior
       ↓
Verify
       ↓
Report accurately
```

For UI work specifically:

```text
Understand UI Requirement
        ↓
Search shared/ui
        ↓
Reuse / Compose
        ↓
Check shadcn/ui
        ↓
Add only required Primitive
        ↓
Customize with Design Tokens
        ↓
Build Product UI
        ↓
Test User Behavior
```

The goal is not to produce the most code or to make the product look like default shadcn/ui.

The goal is to make **safe, understandable, verifiable progress while preserving the product's own visual identity and core promise**.
