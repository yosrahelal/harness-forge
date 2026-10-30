---
name: forge-guide
description: Router over everything Forge ships. Use at the start of a session, when unsure which skill, command or agent fits the work at hand, or when the user asks "what should I use for X", "which skill", "how does Forge work". Covers the lifecycle (idea → spec → plan → build → test → review → ship), the daily commands, the agent roster and the always-on operating behaviors.
metadata:
  origin: forge (merges addyosmani/agent-skills using-agent-skills, mattpocock/skills ask-matt, affaan-m/ECC rules/common/agents.md)
---

# Forge guide

Forge is one harness assembled from five sources. The rule of thumb: **commands drive the lifecycle, skills carry the method, agents do delegated work, rules are always on, playbooks are read on demand.**

## 1. Pick the entry point

```
Task arrives
    │
    ├── Don't know what you want yet? ───────────────→ interview-me (auto) or /forge:grill-me (user)
    ├── Vague idea, need variants / go-no-go? ───────→ idea-refine, council
    ├── New feature or project, no spec? ────────────→ /forge:specify  (then /forge:clarify)
    ├── Need design artifacts (research, data model)?→ /forge:plan
    ├── Need a task list? ───────────────────────────→ /forge:tasks   (planning skill, checklist format)
    ├── Implementing? ───────────────────────────────→ /forge:build (one slice) | /forge:implement (whole plan)
    │     ├── UI work ──────────────────────────────→ frontend-ui-engineering, accessibility, design-system
    │     ├── API / module boundary ────────────────→ api-design, contract-first, hexagonal-architecture
    │     ├── Unfamiliar code / high stakes ─────────→ doubt-driven-development, codebase-onboarding
    │     └── Need current library facts ───────────→ documentation-lookup, source-driven-development, search-first
    ├── Writing tests? ──────────────────────────────→ tdd  (browser: browser-testing-with-devtools, e2e-testing)
    ├── Something broke? ───────────────────────────→ debugging  (/forge:build-fix for compile/type errors)
    ├── Bug report to triage end to end? ───────────→ /forge:bug-assess → /forge:bug-fix → /forge:bug-test
    ├── Reviewing? ─────────────────────────────────→ /forge:review (code-review skill)  → /forge:simplify
    │     ├── security ─────────────────────────────→ security skill + security-reviewer agent
    │     └── performance ──────────────────────────→ performance-optimization, /forge:webperf
    ├── Done with a feature? ────────────────────────→ /forge:verify → /forge:converge → /forge:ship → /forge:pr
    ├── Committing / branching? ────────────────────→ git-workflow, conventional-commit-review
    ├── Deploying / CI? ──────────────────────────────→ ci-cd-and-automation, deployment-patterns, docker/kubernetes-patterns
    ├── Docs or decisions? ────────────────────────→ documentation-and-adrs, domain-modeling (GLOSSARY.md)
    ├── Work is bigger than one session? ──────────→ wayfinder, /forge:orchestrate (orchestrator agent)
    ├── Context is getting heavy? ──────────────────→ strategic-compact, handoff, /forge:save-session
    └── End of session? ─────────────────────────────→ retro, /forge:learn
```

Skill names above are invoked with the Skill tool (plugin-scoped: `forge:<name>`). Commands are slash commands (`/forge:<name>`). Agents are spawned with the Agent tool (`subagent_type: "forge:<name>"`).

## 2. The lifecycle in one table

| Phase | Command | Skill behind it | Artifact |
|---|---|---|---|
| Principles (once per project) | `/forge:constitution` | constraint-driven-development | `.forge/constitution.md` |
| Define | `/forge:specify`, `/forge:clarify` | spec-driven-development, interview-me | `specs/NNN-name/spec.md` |
| Design | `/forge:plan` | planning, api-design, documentation-and-adrs | `plan.md`, `research.md`, `data-model.md`, `contracts/` |
| Break down | `/forge:tasks` | planning | `tasks.md` (T001 [P] [US1] format) |
| Build | `/forge:build`, `/forge:implement` | incremental-implementation, tdd | commits, tests |
| Verify | `/forge:test`, `/forge:verify` | tdd, verification-loop | test + build + lint + security report |
| Review | `/forge:review`, `/forge:simplify` | code-review, code-simplification | findings by severity |
| Converge | `/forge:converge`, `/forge:analyze` | — | remaining tasks appended, consistency report |
| Ship | `/forge:ship`, `/forge:pr` | shipping-and-launch, pr | GO/NO-GO, pull request |
| Learn | `/forge:learn`, retro | retro, writing-for-agents | new skill/rule drafts |

Independent entry points, not mandatory phases. A bug fix uses the bug trio; a one-line change needs none of this.

## 3. Core operating behaviors (always, in every skill)

1. **Surface assumptions** before non-trivial work: list them, invite correction, then proceed.
2. **Tests are proof.** "Seems right" is not done. Reproduce bugs with a failing test first.
3. **Smallest safe diff.** One slice at a time; refactoring is a separate, reviewed step.
4. **Read before you write.** `GLOSSARY.md`, `docs/adr/`, `.forge/constitution.md`, `CONSTRAINTS.md` when they exist.
5. **Never weaken the bar** to make a check pass (thresholds, skipped tests, suppressions). Flag it instead.
6. **Evidence in reports.** Commands run, exit codes, file:line references. No fabricated results.
7. **Stop and ask** for irreversible actions: migrations, deletes, deploys, secrets, payments, force pushes.

## 4. Agents: who to delegate to

Core agents are always loaded. Roster divisions are opt-in (`node scripts/install.js --division <name>`).

| Need | Agent |
|---|---|
| Implementation plan | `planner` |
| System design, trade-offs | `architect`, `code-architect` |
| Trace how a feature works | `code-explorer` |
| Test-first implementation | `tdd-guide` |
| Test strategy and coverage gaps | `test-engineer`, `pr-test-analyzer` |
| Review after writing code | `code-reviewer` (then `code-simplifier`, `silent-failure-hunter`, `type-design-analyzer`, `comment-analyzer`) |
| Security pass | `security-reviewer` |
| Performance | `performance-optimizer`, `web-performance-auditor` |
| Build/type errors | `build-error-resolver` |
| E2E tests | `e2e-runner` |
| Dead code, cleanup | `refactor-cleaner` |
| Docs and codemaps | `doc-updater`, `docs-lookup` |
| Commit message | `commit-reviewer` |
| Database/SQL | `database-reviewer` |
| Extract specs from legacy code | `spec-miner` |
| QA with evidence, go/no-go | `reality-checker`, `evidence-collector` |
| Grade agent output | `agent-evaluator` |
| Long autonomous loops | `loop-operator` |
| Multi-role pipeline | `orchestrator` |

Roster divisions: `languages` (per-language reviewers and build resolvers), `engineering`, `testing`, `product`, `design`, `project-management`, `security`, `specialized`, `growth`, `ml`. See `docs/CATALOG.md`.

## 5. Where things live

- `rules/` — always-on standards; install the common set plus your languages.
- `templates/` — constitution, spec, plan, tasks, checklist, ADR, glossary.
- `playbooks/` — NEXUS phase playbooks and runbooks, handoff templates, checklists (security, performance, accessibility, observability, testing, definition of done), orchestration patterns, the SDD essay.
- `contexts/` — dev / review / research behavior profiles.
- `hooks/` — guard, format, context snapshots.

When in doubt: `/forge:guide <what you are trying to do>`.
