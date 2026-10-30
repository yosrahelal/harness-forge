---
description: Execute the whole tasks.md phase by phase (test-first, dependency order, [P] in parallel), marking tasks [X] and halting on failure. Gated by the feature checklists. For one slice at a time use /forge:build.
argument-hint: "[feature] [--phase N] [--from T0NN]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit templates/commands/implement.md) -->

# Implement

1. **Resolve**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd/feature-paths.js" --json --require-tasks --include-tasks` → `FEATURE_DIR`, `TASKS`, `AVAILABLE_DOCS`.
2. **Checklist gate** (read-only): for each file in `FEATURE_DIR/checklists/`, count `- [ ]` vs `- [x]`. Show a table (Checklist | Total | Checked | Unchecked | Status). If any item is unchecked, stop and ask "proceed anyway? (yes/no)". Never edit checklist files here.
3. **Load context**: `tasks.md`, `plan.md`, and when present `data-model.md`, `contracts/`, `research.md`, `quickstart.md`, `.forge/constitution.md`, `CONSTRAINTS.md`.
4. **Baseline**: `git status --porcelain` must be clean apart from spec artifacts; otherwise ask. Verify ignore files match the stack (`.gitignore`, `.dockerignore`, …) and add only missing critical patterns.
5. **Execute** following the task plan, phase by phase:
   - Dependency order; `[P]` tasks may run together (same-file tasks never in parallel).
   - Per task, follow `forge:tdd`: failing test → minimal code → green → full suite → build → commit (one task per commit, descriptive message) → mark `- [X]` in `tasks.md`.
   - Delegate implementation of independent `[P]` tasks to `forge:tdd-guide` subagents when it is faster; pass the skill conventions in the prompt.
   - Validation checkpoint at the end of each phase: run the story's independent test from `tasks.md`/`quickstart.md`.
6. **Halt and ask** when: a test cannot be made to pass or the build breaks without an obvious fix (use `forge:debugging` first, `/forge:build-fix` for compile/type errors); the spec is ambiguous for the task; the task is high-risk or irreversible (auth, migrations, payments, deletes, deploys, secrets). On resume, continue from the next unchecked task.
7. **Completion**: all required tasks `[X]`, implementation matches the spec, tests pass, coverage meets the bar. Suggest `/forge:verify` then `/forge:converge`.
8. **Summary**: tasks completed, tests added, commits made, anything skipped or flagged.
