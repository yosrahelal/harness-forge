---
description: Define and enforce the project's quality bar as a written contract (CONSTRAINTS.md) — interview ≤4 questions, sane defaults, tooling per dimension. Sub-commands check | guard | ratchet.
argument-hint: "[check|guard|ratchet]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from addyosmani/agent-skills /constraints) -->

# Constraints

Invoke `forge:constraint-driven-development`. `$ARGUMENTS` selects the mode.

**Setup (no argument)**
1. Detect: package/pyproject/go.mod, test runner, lint configs, current coverage, CI workflows, harness config.
2. Interview at most four questions, one at a time, each with a usable default: dimensions beyond the floor (coverage, security, performance, accessibility, architecture); block or warn on failure; target numbers or hold today's values; slowest tolerated check.
3. Write `CONSTRAINTS.md`: Floor section, enforced numbers, measured-only metrics with today's values, exceptions table with owners and expiry.
4. Install what each dimension needs using the de facto tool already in the repo. Place checks by cost: types/lint/secrets in the edit loop, related tests and changed-line coverage at task end (<90 s), everything else at review.
5. Add one line to `CLAUDE.md`: read `CONSTRAINTS.md`, never weaken it to make a change pass. Verify by running the constraints on the current branch.

**`check`** — run the constraints against this branch and report pass/fail per dimension.
**`guard`** — inspect the diff for a weakened bar: lowered thresholds, skipped/deleted tests, new suppressions, stubs, new exceptions. Report as findings.
**`ratchet`** — record today's measured values as the new floor.
