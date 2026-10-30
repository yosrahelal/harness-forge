---
description: Systematic root-cause debugging for a failing test, broken build, regression or unexpected behaviour — reproduce, hypothesise, bisect, fix with a pinning test. Use the bug trio for full tracked bug reports.
argument-hint: "<symptom or error>"
disable-model-invocation: true
---
<!-- origin: forge (addyosmani debugging-and-error-recovery + mattpocock diagnosing-bugs) -->

Invoke `forge:debugging`. Reproduce first (command + exact output), form at most three ranked hypotheses, test the cheapest discriminating experiment first, bisect (git bisect, feature flags, config halving) when the cause is non-local, read the real error not the summary, and fix the root cause with a test that would have caught it. For compile/type errors use `/forge:build-fix`; for perf regressions read `skills/workflow/debugging/references/diagnosis-loop.md`. Report: symptom, root cause, evidence, fix, test added, prevention.
