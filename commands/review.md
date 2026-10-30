---
description: Five-axis code review (correctness, readability, architecture, security, performance) of local changes, a commit range, or a GitHub PR (pass a number/URL). Findings as Critical / Required / Optional / Nit with file:line.
argument-hint: "[pr-number | pr-url | base-ref | blank for local changes] [--fix]"
disable-model-invocation: true
---
<!-- origin: forge (merges addyosmani /review, affaan-m/ECC /code-review PR mode and mattpocock code-review axes) -->

# Review

Invoke `forge:code-review`.

## Scope

- No argument → `git diff` (staged + unstaged) plus untracked files; if clean, the last commit.
- A ref → `git diff <ref>...HEAD`.
- A PR number/URL → `gh pr view` + `gh pr diff`; read the PR description and linked issue as the spec.

## Process

1. Load the project's standards (`CLAUDE.md`, `CONSTRAINTS.md`, `rules/`, `GLOSSARY.md`, `.forge/constitution.md`) and the spec/task the change claims to implement.
2. For large diffs, fan out in one turn: `forge:code-reviewer` (five axes), `forge:security-reviewer` (OWASP, secrets, authz), `forge:silent-failure-hunter` (swallowed errors), `forge:pr-test-analyzer` (behavioural coverage). Merge in the main context; de-duplicate.
3. Review on two extra axes from the standards reference: **Standards** (does it follow documented conventions?) and **Spec** (does it do what was asked, nothing more?).
4. Classify each finding: **Critical** (bug, security, data loss) · **Required** (must fix before merge) · **Optional** (improvement) · **Nit**. Every finding has `file:line`, the failure scenario, and a concrete fix.
5. Verdict: APPROVE · APPROVE WITH REQUIRED CHANGES · REQUEST CHANGES.

`--fix`: after the report, apply Critical and Required fixes one at a time with tests, then re-run the review on the delta.

For a PR, offer to post the review with `gh pr review` only after the user confirms.
