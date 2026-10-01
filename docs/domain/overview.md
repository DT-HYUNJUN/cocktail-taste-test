Status: Accepted
Version: v1
Phase: 1
Last Updated: 2026-10-01

# Domain Overview

This is the Phase 1 entry point and index for the Cocktail Taste Test domain. It defines the canonical documentation set; implementation, persistence, and API details remain outside this document.

## Canonical pipeline

[AssessmentDefinition v1](assessment.md)
→ AssessmentAnswer[]
→ Assessment Transformer
→ [UserTasteProfile v1](taste-profile.md)
→ [CocktailProfile v1](cocktail-profile.md)[]
→ [RecommendationMatch v1](recommendation.md)
→ Ranking Policy v1
→ Ranked Candidates
→ [Reason Builder v1](reason-builder.md)
→ [RecommendationResult v1](recommendation-result.md)

## Canonical documents

- [Assessment](assessment.md): v1 assessment boundary, answers, evidence, and transformation invariants.
- [Taste Profile](taste-profile.md): five core dimensions and partial user profiles.
- [Cocktail Profile](cocktail-profile.md): recommendation-facing cocktail characteristics.
- [Flavor Vocabulary](flavor-vocabulary.md): v1 Flavor and BaseSpirit semantics and vocabulary status.
- [Recommendation](recommendation.md): internal matching evidence and ranking policy constraints.
- [Recommendation Result](recommendation-result.md): public, transport-safe result and invariants.
- [Reason Builder](reason-builder.md): structured, positive recommendation reasons.
- [Golden Cases](golden-cases.md): executable semantic recommendation specifications and change policy.

## Domain responsibilities

| Area | Responsibility |
| --- | --- |
| Assessment | What was asked and answered; collecting evidence. |
| Taste | What answer evidence means about the user's preferences. |
| Cocktail | What characteristics a cocktail has. |
| Recommendation | How a user profile matches cocktail profiles and is ranked. |

An assessment option must never map directly to a cocktail recommendation. The required path is option → evidence → user taste profile → recommendation engine → cocktail.

## Phase 1 decisions

- Core dimensions are `sweet`, `sour`, `bitter`, `alcoholIntensity`, and `refreshing`.
- `TasteScore` is `1 | 2 | 3 | 4 | 5`; `3` is a score, not a default for missing evidence.
- User profiles preserve partial evidence. Unknown differs from neutral.
- Cocktail profiles contain all five core dimensions. Flavor and BaseSpirit are secondary presence/preference signals.
- Core taste matching has higher priority than Flavor or BaseSpirit signals.
- Matching/ranking internals are not public API contracts. Public results contain structured reasons, not internal scores.
- Transformation, ranking, and reason selection are deterministic for the same versioned inputs.

## Deferred Decisions

- Production cocktail dataset source and persistence; database schema; anonymous assessment/session persistence
- Runtime validation library; final recommendation count; Browser E2E implementation
- Analytics, authentication, result sharing, production UI copy, and recommendation confidence model
- Exact assessment questions, answer IDs, transformation aggregation rules, ranking formula/constants, and Golden fixtures where no accepted Phase 1 definition exists

## Superseded Phase 0 candidates

Earlier candidate dimensions (including `citrus`, `rich`, `dry`, `strength`, and scored Flavor values), `0~100`-style score examples, and an unspecified score range are superseded for Phase 1. Flavor is now presence-only; `alcoholIntensity` is a core dimension.
