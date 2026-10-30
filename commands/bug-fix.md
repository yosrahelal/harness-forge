---
description: Apply the remediation from .forge/bugs/<slug>/assessment.md with a regression test first, keep the diff minimal, and record what changed in fix.md.
argument-hint: "slug=<kebab-slug>"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit extensions/bug speckit.bug.fix) -->

# Bug fix

1. **Resolve** `BUG_DIR = .forge/bugs/<slug>/`; `assessment.md` must exist (else run `/forge:bug-assess`). If verdict is `invalid`, stop. If `likely valid` with open `[NEEDS CLARIFICATION]`, list them and ask whether to proceed.
2. **Confirm the plan** in 3–6 bullets: what changes, where, which test pins it.
3. **Prove it first** (`forge:tdd`, Prove-It pattern): write a test that reproduces the bug and fails. Then apply the preferred remediation, staying within the assessed files unless new evidence forces a wider scope (record it under Deviations). No unrelated refactors, no new dependencies the assessment did not call for.
4. **If the assessment was wrong** (fix does not work, root cause elsewhere): stop editing, document the finding under Deviations, and recommend re-assessment.
5. **Run local checks**: the new test, the suites covering changed paths, lint/typecheck. Capture commands and results. Do not run destructive or network-dependent suites without consent.
6. **Write** `BUG_DIR/fix.md`: header (slug, fixed date, status `applied|partial|not-applied`) · Summary · Changes table (File | Change | Notes) · Diff highlights · Tests added/updated · Local verification · Deviations from assessment · Follow-ups.
7. **Commit** with a conventional message (`fix(<scope>): …`) referencing the slug, then report and suggest `/forge:bug-test slug=<slug>`.

Guardrails: never edit `assessment.md`; never delete files unless the assessment required it.
