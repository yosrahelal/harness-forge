---
description: Turn the active spec into a technical plan with research, data model, contracts and quickstart under specs/NNN-name/, checked against the constitution. Design only, no implementation.
argument-hint: "[tech choices, constraints — e.g. 'Next.js + Postgres, keep it serverless']"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit templates/commands/plan.md + addyosmani planning command) -->

# Plan

Input: `$ARGUMENTS` — technical direction and constraints (may be empty).

1. **Resolve paths**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd/feature-paths.js" --json --require-spec [--feature …]` → `FEATURE_DIR`, `FEATURE_SPEC`, `IMPL_PLAN`. If `IMPL_PLAN` does not exist, copy `${CLAUDE_PLUGIN_ROOT}/templates/plan-template.md` to it.
2. **Load context**: spec, `.forge/constitution.md`, `CONSTRAINTS.md`, `GLOSSARY.md`, `docs/adr/`, and the relevant parts of the codebase (read-only). Use `forge:search-first` and `forge:documentation-lookup` before choosing libraries.
3. **Fill the plan template**:
   - Technical Context: language, framework, storage, testing, target platform, performance goals, constraints. Mark unknowns `NEEDS CLARIFICATION`.
   - Constitution Check: list each principle and whether the design complies; unjustified violations are errors, justified ones go in a Complexity Tracking table.
   - Project structure: real paths for this repo.
4. **Phase 0 — Research** → `FEATURE_DIR/research.md`: one entry per unknown, dependency or integration: *Decision / Rationale / Alternatives considered*. Spawn `forge:planner` or `forge:architect` subagents in parallel for independent unknowns when it saves time. Resolve every `NEEDS CLARIFICATION`.
5. **Phase 1 — Design**:
   - `data-model.md`: entities, fields, relationships, validation rules, state transitions.
   - `contracts/`: the interfaces the feature exposes (OpenAPI/JSON schema for services, CLI schemas, public API signatures for libraries, UI contracts). Skip if purely internal. Prefer `forge:contract-first`.
   - `quickstart.md`: runnable validation scenarios proving the feature end to end (prerequisites, commands, expected outcomes). No implementation code.
   - Record significant decisions as ADRs via `forge:documentation-and-adrs`.
6. **Re-run the Constitution Check** after design; update the plan.
7. **Report**: plan path, artifacts generated, open risks, and the next step (`/forge:tasks`).

Rules: no source-code changes; absolute paths for file operations, repo-relative in docs; stop on gate failures.
