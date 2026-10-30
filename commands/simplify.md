---
description: Simplify recently changed code (or a given scope) for clarity without changing behaviour — guard clauses, smaller functions, better names, dead code removal — verifying tests after each step.
argument-hint: "[path or scope]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from addyosmani/agent-skills /code-simplify) -->

# Simplify

Invoke `forge:code-simplification`; delegate to `forge:code-simplifier` for large scopes and to `forge:refactor-cleaner` for dead-code sweeps.

1. Read `CLAUDE.md` and project conventions. Target = recent changes unless `$ARGUMENTS` gives a scope.
2. Understand purpose, callers, edge cases and current test coverage before touching anything. Add characterisation tests where coverage is missing.
3. Opportunities: deep nesting → guard clauses; long functions → split by responsibility; nested ternaries → if/switch; vague names → intent-revealing; duplication → shared helper; dead code → remove after confirming no dynamic use.
4. Apply one change at a time; run tests after each. Revert any step that breaks a test and reconsider.
5. Finish: tests green, build green, diff reviewed with `forge:code-review`. Summarise what changed and what was deliberately left alone.
