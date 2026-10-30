---
description: Six-phase verification of the current work — build, typecheck, lint, tests with coverage, security grep, diff review — producing a PASS/FAIL report. Use before a PR, after a feature, or as a checkpoint ("quick" skips coverage and diff review).
argument-hint: "[quick|full]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from affaan-m/ECC verification-loop + addyosmani definition-of-done) -->

# Verify

Invoke `forge:verification-loop`. Detect the stack's real commands (lockfile, scripts, Makefile, CI workflow) and run each phase with `set -o pipefail`, capturing exit codes:

1. **Build** — the project's build command.
2. **Types** — `tsc --noEmit`, `mypy`, `cargo check`, … as applicable.
3. **Lint/format** — eslint/biome/ruff/golangci-lint/clippy, plus formatter check.
4. **Tests + coverage** — full suite; coverage against `CONSTRAINTS.md` or the 80% default. (`quick`: focused tests only.)
5. **Security grep** — hardcoded secrets, `console.log`/debug statements, TODO/FIXME in changed files, `--no-verify`, risky patterns (eval, innerHTML, raw SQL). Delegate deeper checks to `forge:security-reviewer` when auth/payments/data are touched.
6. **Diff review** — `git diff` against the base; check scope creep, missing tests, docs, migrations. (`quick`: skip.)

Then check the standing bar in `playbooks/checklists/definition-of-done.md`.

Report:

```
VERIFICATION — <branch> — <date>
Build: PASS|FAIL  Types: PASS|FAIL  Lint: PASS|FAIL  Tests: N passed / M failed (cov X%)  Security: n findings  Diff: n notes
Overall: PASS | FAIL
Blocking: …   Warnings: …   Next: …
```

Never mark PASS when a phase was not run; say `NOT RUN (reason)`.
