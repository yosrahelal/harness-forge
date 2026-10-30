# Notice — upstream attributions

Forge is an assembly. Every imported file carries an `origin:` marker (frontmatter `metadata.origin` for skills, an HTML comment for agents and references). The complete file-level provenance is in `upstream/manifest.json`; the merge decisions are explained in `docs/SOURCES.md`.

| Upstream | License | Copyright | What Forge takes |
|---|---|---|---|
| [github/spec-kit](https://github.com/github/spec-kit) | MIT | GitHub, Inc. | Spec-Driven Development lifecycle (constitution → specify → clarify → plan → tasks → implement → converge → analyze → checklist), bug workflow, document templates, the SDD essay. Commands were rewritten for Forge without the Specify CLI. |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | MIT | Affaan Mustafa | Core subagents (planner, reviewers, resolvers…), ~75 skills (languages, engineering, agentic), rules (common + per language), contexts, hook ideas. ECC's Node hook runtime, GateGuard, continuous learning and other ECC-only scripts are not shipped. |
| [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | MIT | AgentLand Contributors | ~80 specialist personas (roster), NEXUS playbooks, runbooks, coordination templates, the orchestrator concept. |
| [mattpocock/skills](https://github.com/mattpocock/skills) | MIT | Matt Pocock | Grilling, TDD seams, code review axes, diagnosing bugs, domain modeling, codebase design, to-spec/to-tickets/triage/wayfinder, handoff, retro, research, prototype, wizard, teach, writing-for-agents, setup (renamed forge-setup). |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | MIT | Addy Osmani | Lifecycle skills (interview-me, idea-refine, spec/plan/build/test/review/ship, constraint-driven, doubt-driven, source-driven, context engineering…), agents test-engineer and web-performance-auditor, shared checklists and orchestration patterns. |

All five licenses are MIT; the full text is in `LICENSE`.
