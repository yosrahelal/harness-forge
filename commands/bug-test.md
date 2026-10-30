---
description: Verify a fixed bug — re-run the reproduction, the new tests, regression suites and lint — and record a verdict (verified | partial | failed) in .forge/bugs/<slug>/test.md. Never modifies code.
argument-hint: "slug=<kebab-slug>"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit extensions/bug speckit.bug.test) -->

# Bug test

1. **Resolve** `BUG_DIR`; `assessment.md` and `fix.md` must exist.
2. **Plan the checks**: reproduction steps (post-fix), tests added in the fix, regression suites touching changed files, lint/typecheck.
3. **Run each check**, capturing command, exit status and a short excerpt. Skip destructive/expensive checks and record `skipped` with a reason; record `not-run` when tooling is missing. Never fabricate output. Delegate a browser reproduction to `forge:evidence-collector` when the bug is visual.
4. **Judge**: `verified` (all critical checks pass, symptom gone) · `partial` (symptom gone but regressions or inconclusive checks, or reproduction not actually exercised) · `failed` (symptom persists or suite broken).
5. **Write** `BUG_DIR/test.md`: header (slug, tested date, result) · Summary · Checks table (Check | Command/Action | Result | Notes) · Output excerpts · Residual risks · Recommendation (close / hold / reopen).
6. **Report** the verdict with evidence paths.

Guardrail: tests alone do not justify `verified` when a listed reproduction was not exercised; downgrade to `partial` and say so.
