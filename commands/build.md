---
description: Implement the next pending task from tasks.md (or a described change) in one careful slice — failing test, minimal code, full suite, build, commit. Add "auto" to run every remaining task after a single approval.
argument-hint: "[auto] [task id or description]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from addyosmani/agent-skills .claude/commands/build.md) -->

# Build

Invoke `forge:incremental-implementation` together with `forge:tdd`.

## Default: one slice

1. Find the next unchecked task: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd/feature-paths.js" --json --include-tasks` → `tasks.md`; fall back to `tasks/todo.md` or the task described in `$ARGUMENTS`.
2. Read its acceptance criteria and the relevant code, types, patterns and `GLOSSARY.md`.
3. RED: write a failing test at an agreed seam. GREEN: the minimum code to pass. Run the full suite and the build.
4. Commit only the files for this task with a descriptive conventional message. Mark the task `[X]`. Stop.

## `auto`: the whole plan

Same loop for every remaining task, with exactly one human gate:

1. Require a spec/plan (`specs/NNN-*/tasks.md`, `tasks/plan.md` or `SPEC.md`); otherwise stop and point to `/forge:specify`.
2. Clean baseline (`git status --porcelain`) or ask.
3. Present the task list and wait for an unambiguous "approve"/"go". Hedged answers are not approval.
4. Execute in dependency order, one commit per task, `[P]` tasks in parallel when files do not overlap.
5. Stop and ask on: failing test with no obvious fix (use `forge:debugging`), ambiguous spec, or anything irreversible (auth, migrations, payments, deletes, deploys, secrets). Re-running `/forge:build auto` resumes from the next pending task.
6. Finish with a summary: tasks done, tests added, commits, anything skipped or flagged.
