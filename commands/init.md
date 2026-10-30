---
description: Bootstrap Forge in the current project — .forge/ layout, constitution, CLAUDE.md section, stack-matched rules and language reviewers, tracker/glossary setup, CONSTRAINTS.md — asking only what cannot be detected.
argument-hint: "[--minimal]"
disable-model-invocation: true
---
<!-- origin: forge (merges spec-kit init, ECC project-init, addyosmani constraints, mattpocock setup) -->

# Init

1. **Detect** the stack from lockfiles and manifests (package.json/pnpm/yarn/bun, pyproject, go.mod, Cargo.toml, pom/gradle, Gemfile, composer, pubspec, Package.swift), the test runner, lint/format configs, CI, git remote, existing `CLAUDE.md`/`AGENTS.md`/`GLOSSARY.md`/`docs/adr`.
2. **Create** `.forge/` with `constitution.md` (run `/forge:constitution` logic with detected defaults), `.gitignore` (`sessions/`, `state/`, `bugs/*/tmp`), and `specs/` if absent.
3. **Install stack-matched assets** at project scope: `node "${CLAUDE_PLUGIN_ROOT}/scripts/install.js" --scope project --auto` (common rules + language rules + language reviewers).
4. **CLAUDE.md**: add a `## Forge` section (short): read `.forge/constitution.md` and `CONSTRAINTS.md`; lifecycle commands; where specs live; "never weaken the quality bar". Keep existing content intact.
5. **Tracker and domain docs**: run the `forge:forge-setup` skill (issue tracker choice, triage labels, GLOSSARY/ADR layout). Skip with `--minimal`.
6. **Quality bar**: offer `/forge:constraints` (skip with `--minimal`).
7. Report what was created and the suggested first command (`/forge:specify` for a new feature, `/forge:bug-assess` for a bug, `/forge:codebase-onboarding` skill for an unfamiliar repo).
