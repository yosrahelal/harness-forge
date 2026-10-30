# Sources and merge decisions

What came from where, what was changed, and what was deliberately left out. File-level provenance: `upstream/manifest.json`; every imported file also carries an `origin:` marker.

## What each upstream is best at

| Upstream | Strength kept | Weakness avoided |
|---|---|---|
| **spec-kit** | The most rigorous artifact chain (constitution, spec with prioritised stories, plan with research/data-model/contracts, tasks in a strict checkable format, converge/analyze/checklist gates, bug trio). | Depends on the `specify` Python CLI, 900-line bash helpers and an extension/hook YAML layer. Rewritten as 12 compact commands + two Node scripts. |
| **ECC** | Operational subagents with restricted tools and models; deep per-language skills; always-on rules; hook ideas (guards, format, compact, pre-compact). | 314 skills and 98 commands bloat the context; hooks are coupled to a large Node runtime (`plugin-hook-bootstrap`, GateGuard, instincts). Kept 75 skills, 23 core + 29 roster agents, rewrote hooks from scratch, dropped ECC-only tooling. |
| **agency-agents** | Rich, opinionated personas; NEXUS phase playbooks; runbook rosters; handoff templates; orchestrator concept. | 384 personas with no tools/model metadata and division-prefixed names. Kept 80 as an opt-in roster with kebab-case names; orchestrator rewritten to work on spec-kit artifacts and Forge agents. |
| **mattpocock/skills** | Small composable skills with strong opinions: grilling, seams in TDD, review along Standards/Spec axes, GLOSSARY/ADR discipline, ticket flows, handoff, retro. | Designed as a closed curated set with its own setup skill name. Renamed `setup-matt-pocock-skills` → `forge-setup`; everything else verbatim. |
| **addyosmani/agent-skills** | Clean lifecycle (spec → plan → build → test → review → ship), the most complete stack-agnostic TDD and review write-ups, constraint/doubt/source-driven development, shared checklists, orchestration patterns. | Lifecycle commands overlap spec-kit; `references/` paths break on per-skill installs. Commands merged into the spec-kit chain; references moved to `playbooks/checklists/` with rewritten links. |

## One canonical skill per concept

| Concept | Canonical (primary) | Kept as `references/` | Dropped |
|---|---|---|---|
| TDD | addyosmani `test-driven-development` → `tdd` | mattpocock tdd (seams, anti-patterns, tests.md, mocking.md), ECC tdd-workflow | — |
| Code review | addyosmani `code-review-and-quality` → `code-review` | mattpocock code-review (Standards/Spec axes) | addyosmani `code-reviewer` agent (ECC's kept) |
| Debugging | addyosmani `debugging-and-error-recovery` → `debugging` | mattpocock diagnosing-bugs (+ hitl script) | — |
| Git | addyosmani `git-workflow-and-versioning` → `git-workflow` | ECC git-workflow | — |
| API design | addyosmani `api-and-interface-design` → `api-design` | ECC api-design (REST specifics) | — |
| Security | addyosmani `security-and-hardening` → `security` | ECC security-review | ECC security-scan (AgentShield), addyosmani `security-auditor` agent |
| ADRs | addyosmani `documentation-and-adrs` | ECC architecture-decision-records, mattpocock ADR-FORMAT | — |
| Accessibility | ECC `accessibility` (WCAG 2.2, web+native) | ECC frontend-a11y (React) | — |
| Planning | addyosmani `planning-and-task-breakdown` → `planning` + spec-kit task format in `/forge:tasks` | — | ECC plan-orchestrate (ECC command router) |
| Router | new `forge-guide` | — | addyosmani using-agent-skills, mattpocock ask-matt (both folded in) |
| Interview | both kept: addyosmani `interview-me` (auto), mattpocock `grilling`/`grill-me`/`grill-with-docs` (user) | — | — |

## Commands: how the two lifecycles were reconciled

| Forge command | Origin | Note |
|---|---|---|
| constitution, specify, clarify, plan, tasks, implement, converge, analyze, checklist | spec-kit | extension-hook boilerplate removed; `{SCRIPT}` replaced by `scripts/sdd/*.js`; `/memory/constitution.md` → `.forge/constitution.md` |
| bug-assess, bug-fix, bug-test | spec-kit bug extension | `.specify/bugs` → `.forge/bugs`; TDD Prove-It added to bug-fix |
| build, test, review, ship, simplify, constraints, webperf | addyosmani | `/spec` and `/plan` dropped in favour of specify/plan/tasks; `/build` kept for the one-slice loop; ship personas mapped to Forge agents |
| verify | ECC verification-loop + addyosmani definition-of-done | new |
| pr | ECC /pr + mattpocock pr skill | merged |
| build-fix, refactor-clean, learn, save-session, resume-session, checkpoint, update-docs | ECC | paths moved under `.forge/` |
| orchestrate, team | agency NEXUS + ECC team-builder | new |
| init, guide, debug | new | — |

## Agents

- **Core (28)**: ECC operational agents minus niche ones; addyosmani `test-engineer`, `web-performance-auditor`; agency `reality-checker`, `evidence-collector`; new `orchestrator`.
- **Roster (108)**: ECC language reviewers/build resolvers and ML reviewers; agency engineering, testing, product, design, project-management, security, specialized, growth personas. Names normalised to kebab-case slugs (`engineering-frontend-developer` → `frontend-developer`); `product-manager`, `security-architect` kept whole to avoid clashes.
- **Dropped**: ECC bengali-reviewer, chief-of-staff, conversation-analyzer (hookify), gan-* (GAN harness), harmonyos-app-resolver, harness-optimizer, healthcare-reviewer, homelab-architect, network-*, opensource-*; agency divisions academic, finance, game-development, gis, healthcare, paid-media, sales, spatial-computing, most marketing and support, and region-specific personas. They remain one `sync-upstream.py` manifest edit away.
- ECC's 7-line "Prompt Defense Baseline" was stripped from every agent and replaced by `rules/common/prompt-defense.md`.

## Skills dropped on purpose

ECC: everything tied to ECC runtime or services (continuous-learning v1/v2, delivery-gate, hookify-rules, gateguard, unified-memory, cost-tracking, ecc-guide/recipes/configure, nasiko, ito-*, claude-devfleet, orch-* commands), domain packs outside software delivery (healthcare, logistics, legal, finance ops, homelab, network, Bengali NLP, prediction markets, DeFi), and framework packs with low general value (tinystruct, mybatis, perl, quarkus trio, laravel trio except patterns, harmonyos). mattpocock: `misc/`, `in-progress/`, `deprecated/`. addyosmani: none (all 25 kept, 8 renamed).

## Hooks

Rewritten from scratch in dependency-free Node: ideas from ECC (dev-server/tmux reminder, push reminder, no-verify block, format, console.log warning, suggest-compact, pre-compact), mattpocock `git-guardrails-claude-code`, addyosmani `session-start.sh`. Not ported: ECC quality-gate/typecheck pipeline (opt-in `FORGE_TYPECHECK=1` instead), SDD web cache, hookify runtime, governance capture.
