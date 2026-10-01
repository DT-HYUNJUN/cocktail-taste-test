Status: Accepted
Version: v1
Phase: 1
Last Updated: 2026-10-01

# Assessment

`AssessmentDefinition v1` contains ten questions. It collects answer evidence and transforms `AssessmentAnswer[]` into a `UserTasteProfile`; it never recommends cocktails directly.

Each canonical question/answer definition must record the question ID, purpose, answer ID, generated evidence, core-dimension effects, Flavor preference/avoid effects, BaseSpirit preference effects, and signals it does not generate.

## Documentation Gap

No accepted complete Phase 1 definition of the ten questions, answer IDs, or evidence/aggregation rules exists in the repository. This consolidation does not fabricate them; a later accepted definition must become the canonical content here.

## Assessment Transformer invariants

- **AT-001 — Evidence only:** no preference without answer evidence.
- **AT-002 — Partial profile preservation:** a missing dimension is not filled with `3`.
- **AT-003 — Unknown != neutral:** missing evidence and score `3` differ.
- **AT-004 — Determinism:** the same answer set creates the same profile.

All required answers remain necessary to complete an assessment; partial profiles describe evidence meaning, not incomplete submission.
