---
description: Run the TDD loop for a feature (failing tests first) or the Prove-It pattern for a bug (reproduce with a failing test, fix, confirm, regression suite). Browser issues add Chrome DevTools verification.
argument-hint: "[what to test or bug description]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from addyosmani/agent-skills .claude/commands/test.md) -->

# Test

Invoke `forge:tdd`. Discover the repo's own test commands first (lockfile, scripts, Makefile, CI); never assume `npm test`.

**New behaviour**: agree the seams to test → write tests that describe the behaviour and FAIL → implement → GREEN → refactor with tests green.

**Bug (Prove-It)**: write a test reproducing the bug → confirm it fails → fix → confirm it passes → run the full suite for regressions.

**Browser-facing changes**: also invoke `forge:browser-testing-with-devtools` (console errors, network, DOM) or delegate to `forge:e2e-runner`.

**Coverage questions**: delegate to `forge:test-engineer` for a gap analysis (happy path, edge cases, error paths, concurrency) and `forge:pr-test-analyzer` for behavioural coverage of a diff.

Finish with: commands run, results, tests added (file paths), and any untested area stated explicitly.
