---
description: Generate specs/NNN-name/tasks.md from plan + spec — phases by user story, strict checklist format (T001 [P] [US1] description with file path), dependency graph and MVP-first strategy.
argument-hint: "[--tdd to add test tasks] [feature]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit templates/commands/tasks.md + addyosmani planning-and-task-breakdown) -->

# Tasks

1. **Resolve paths**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd/feature-paths.js" --json --require-spec --require-plan` → `FEATURE_DIR`, `AVAILABLE_DOCS`. Copy `${CLAUDE_PLUGIN_ROOT}/templates/tasks-template.md` to `FEATURE_DIR/tasks.md` if missing. If `tasks.md` exists with unchecked tasks for different work, stop and ask before overwriting.
2. **Load**: `plan.md` (stack, structure), `spec.md` (stories with priorities), and when present `data-model.md`, `contracts/`, `research.md`, `quickstart.md`, `.forge/constitution.md`. Invoke `forge:planning` for slicing rules (vertical slices, one complete path per task).
3. **Generate tasks** organised by user story:
   - Phase 1 Setup · Phase 2 Foundational (blocking prerequisites) · Phase 3+ one phase per user story in priority order (each independently testable, with its goal and independent test criterion) · Final phase Polish & cross-cutting.
   - Within a story: tests (when `--tdd` or the spec asks for it) → models → services → endpoints/UI → integration.
   - Map entities, contracts and research decisions to the stories they serve. Quote field constraints verbatim in task text.
4. **Format every task exactly as**: `- [ ] T001 [P] [US1] Description with exact file path`. `[P]` only when parallelisable (different files, no pending dependency). Story label only in story phases. Sequential IDs in execution order.
5. **Add**: a Dependencies section (story completion order), parallel execution examples per story, and an Implementation Strategy (MVP = Phase 1 + 2 + P1 story, then increments).
6. **Validate**: each story has every task it needs, every task has a path, IDs are unique and ordered.
7. **Report**: task count, per-story breakdown, MVP scope, and the next step (`/forge:implement` for the full plan or `/forge:build` for one slice at a time).
