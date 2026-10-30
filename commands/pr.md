---
description: Create a pull request from the current branch — validates preconditions, discovers the PR template, analyses all commits since base, writes the body with the pr skill, pushes with -u, opens via gh.
argument-hint: "[base-branch] [--draft]"
disable-model-invocation: true
---
<!-- origin: forge (merges affaan-m/ECC /pr with mattpocock pr skill) -->

# PR

1. **Validate**: on a feature branch (not base, default `main`); working tree clean (else warn); commits ahead of `origin/<base>` exist; no open PR for this branch (`gh pr list --head <branch>`).
2. **Discover**: `.github/PULL_REQUEST_TEMPLATE*`, `CONTRIBUTING.md` PR rules, linked issue from branch name or commits (`#123`, `NNN-feature` → `specs/NNN-*`).
3. **Analyse the full range** `git log origin/<base>..HEAD` and `git diff origin/<base>...HEAD`: what changed and why, tests added, migrations, breaking changes, docs.
4. **Run** `/forge:verify quick` if nothing has been verified on this branch yet.
5. **Write the body** with `forge:pr` (template-aware; summary, why, how to test, risks, screenshots placeholder, checklist). Follow repo PR conventions; no marketing language.
6. **Push** `git push -u origin <branch>`, then `gh pr create --base <base> --title "<conventional title>" --body-file <tmp> [--draft]`. Show the URL and suggest reviewers if `CODEOWNERS` exists.

Never force-push. Ask before pushing if the branch has never been pushed and the user did not request a PR explicitly.
