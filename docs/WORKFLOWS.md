# Workflows

The combinations below are the reason Forge exists: each one chains pieces from different upstreams so you do not have to.

## 1. New feature, properly (spec-kit × addyosmani × ECC)

| Step | Command | What happens | Who does it |
|---|---|---|---|
| 0 | `/forge:init` (once) | constitution, stack rules, reviewers, tracker, CONSTRAINTS.md | — |
| 1 | `/forge:specify "<idea>"` | numbered spec, quality checklist, ≤3 clarifications | interview-me if fuzzy |
| 2 | `/forge:clarify` | ≤5 high-impact questions, answers written into the spec | — |
| 3 | `/forge:plan "<tech direction>"` | research, data model, contracts, quickstart, constitution check | planner, architect in parallel |
| 4 | `/forge:tasks --tdd` | tasks by user story, strict format, MVP first | planning skill |
| 5 | `/forge:build auto` | one approval, then test-first task loop with one commit per task | tdd-guide subagents for [P] tasks |
| 6 | `/forge:verify` | build, types, lint, tests+coverage, security grep, diff review | — |
| 7 | `/forge:review` | five-axis review + standards/spec axes | code-reviewer, security-reviewer, silent-failure-hunter, pr-test-analyzer |
| 8 | `/forge:converge` | gaps vs spec appended as tasks; repeat 5–8 until Converged | — |
| 9 | `/forge:ship` → `/forge:pr` | GO/NO-GO with rollback plan, then the PR | code-reviewer, security-reviewer, test-engineer |
| 10 | retro skill, `/forge:learn` | process lessons, reusable patterns saved as skills/rules | — |

Skip steps 2–4 for small features: `/forge:specify` then `/forge:build auto` is enough when the spec is unambiguous.

## 2. Daily small change (mattpocock × addyosmani)

```
/forge:grill-me "<change>"      # only if the ask is fuzzy; relentless questions until the design is sharp
/forge:build "<task>"           # one slice: failing test → minimal code → suite → commit
/forge:review && /forge:simplify
```

Add `grill-with-docs` instead of `grill-me` when the conversation should leave an ADR or GLOSSARY entry behind.

## 3. Bug from report to verified fix (spec-kit bug extension × TDD)

```
/forge:bug-assess "<pasted report or URL>" slug=<name>   # read-only assessment, severity, remediation proposal
/forge:bug-fix slug=<name>                               # failing test first, minimal fix, fix.md
/forge:bug-test slug=<name>                              # reproduction + regression suite, verdict in test.md
```

For an unstructured "it's broken": `/forge:debug "<symptom>"` (debugging skill) or `/forge:build-fix` for compile/type errors.

## 4. Unfamiliar or legacy codebase (ECC × agency × mattpocock)

1. `codebase-onboarding` skill → architecture map, entry points, conventions (or roster `codebase-onboarding-engineer`).
2. `code-explorer` agent to trace one feature end to end.
3. `spec-miner` agent to extract behavioural specs before changing anything.
4. `domain-modeling` skill → `GLOSSARY.md`; `improve-codebase-architecture` → deepening report.
5. `/forge:constraints ratchet` to freeze today's quality numbers as the floor.

## 5. Work larger than one session (mattpocock × ECC × agency)

- `wayfinder` skill: decision tickets on the tracker, resolved one by one.
- `/forge:orchestrate "<goal>" --mode sprint`: NEXUS pipeline with phase gates, Dev↔QA loop (reality-checker / evidence-collector), state in `.forge/pipeline/`.
- `/forge:save-session` before stopping; `/forge:resume-session` to continue; the PreCompact hook snapshots automatically; `handoff` skill for agent-to-agent transfer.
- `strategic-compact` + `context-budget` skills to keep the window healthy.

## 6. Deciding under ambiguity

- `council` skill (Claude + Skeptic + Pragmatist + Critic) for go/no-go and trade-offs.
- `doubt-driven-development` for a fresh-context adversarial review of a plan.
- `idea-refine` to diverge/converge on a vague idea; `to-questionnaire` to hand a decision to someone else.
- `market-research`, `deep-research`, `research` (background agent on primary sources) when facts are missing.

## 7. Team mode (agency NEXUS)

`/forge:team startup-mvp` installs the roster for that runbook and prints activation prompts; `/forge:orchestrate` runs it. Rosters: startup-mvp, enterprise-feature, incident-response, marketing-campaign (`playbooks/nexus/runbooks.json`).

## 8. Quality bar and learning loop

- `/forge:constitution` (principles) + `/forge:constraints` (numbers, tooling, guard against weakening).
- `rules/` installed per stack keep style, testing, security and git conventions always on.
- `retro` → `/forge:learn` → `writing-for-agents` turns session lessons into skills; `skill-scout` checks for an existing skill first; `skill-stocktake` audits quality; `rules-distill` extracts cross-cutting rules.

## 9. Regulated blockchain project (pipeline v2)

`/forge:blockchain-pipeline <name> [--chain evm|soroban]` installs the kit in the project; the project `CLAUDE.md` becomes the orchestrator. Steps: analyste → architecte → concepteur (executable spec, gate 1) → developpeur (gate 2) → testeur (gate 3) → red-team rounds + six auditors in parallel + juge (gate 4) → relecteur → documentaliste → external audit → release (gate 5 before signing, gate 6 after a human broadcasts) → run-config / run-triage → upgrade loop. Gates are scripts (`make gate-N`) and fail closed; the user validates every step and the three key moments (architecture, before external audit, before mainnet). Details: `playbooks/blockchain-pipeline.md`.

## Picking the right depth

| Change size | Minimum ceremony |
|---|---|
| typo, config, docs | none; commit |
| < 1 h, clear ask | `/forge:build` + `/forge:review` |
| fuzzy ask | `/forge:grill-me` first |
| 1–5 days | specify → tasks → build auto → verify → review → ship |
| multi-week / multi-role | wayfinder or orchestrate, constitution first |
| smart contract going to production | `/forge:blockchain-pipeline`, every gate |
