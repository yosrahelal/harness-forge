---
description: Create or update the project constitution (non-negotiable principles, quality gates, governance) in .forge/constitution.md. Run once per project, amend when principles change.
argument-hint: "[principles to emphasise, e.g. 'code quality, testing, simplicity']"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit templates/commands/constitution.md) -->

# Constitution

Input: `$ARGUMENTS` (may be empty).

Invoke the `forge:constraint-driven-development` skill for the quality-bar vocabulary, then:

1. **Load** `.forge/constitution.md` if it exists; otherwise start from `${CLAUDE_PLUGIN_ROOT}/templates/constitution-template.md`. Read `CLAUDE.md`, `AGENTS.md`, `CONSTRAINTS.md`, `README.md` and `GLOSSARY.md` when present so the constitution reflects what the project already enforces.
2. **Collect placeholders** (`[PROJECT_NAME]`, `[PRINCIPLE_N_NAME]`, `[GOVERNANCE_RULES]`, dates, version). Fill each from the user's input, existing docs, or a stated reasonable default. Never leave bracketed tokens behind.
3. **Write principles as rules, not slogans.** Each principle: name, one paragraph of MUST/SHOULD wording, one line of rationale. Typical set: simplicity (YAGNI/KISS), test-first, contracts and observability, versioning and breaking changes, security baseline, review gates.
4. **Version it** (semantic): MAJOR for removed or redefined principles, MINOR for added principles or sections, PATCH for wording. Set `Ratified` (keep the original date on amendments) and `Last Amended` (today, ISO format).
5. **Propagate**: check `templates/plan-template.md` "Constitution Check" wording, `CLAUDE.md`/`AGENTS.md` references, and any `CONSTRAINTS.md` thresholds for contradictions. List files that need a follow-up edit instead of silently editing them.
6. **Validate**: no placeholders remain, version line present, principles are testable, dates ISO.
7. **Write** `.forge/constitution.md` (create `.forge/` if needed) and report: new version, bump rationale, files flagged for follow-up, and a suggested commit message (`docs: amend constitution to vX.Y.Z (...)`).

Scope guard: this command only edits the constitution. If the user asks for code changes, stop and point them to `/forge:specify` or `/forge:build`.
