---
description: Scan the active feature spec for ambiguity across 10 categories, ask up to 5 high-impact questions one at a time, and record answers directly in spec.md. Run before /forge:plan.
argument-hint: "[feature dir or number]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit templates/commands/clarify.md) -->

# Clarify

1. **Resolve paths**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd/feature-paths.js" --json --require-spec [--feature $ARGUMENTS]` → `FEATURE_DIR`, `FEATURE_SPEC`. Load `.forge/constitution.md` if present.
2. **Coverage scan** of `FEATURE_SPEC`. Mark each category Clear / Partial / Missing:
   functional scope & out-of-scope · domain & data model (entities, identity, lifecycle, volume) · interaction & UX flows (error/empty/loading states, a11y, i18n) · non-functional (performance, scalability, reliability, observability, security/privacy, compliance) · integrations & external dependencies · edge cases & failure handling (negative paths, rate limits, conflicts) · constraints & trade-offs · terminology consistency · completion signals (testable acceptance, definition of done) · placeholders and vague adjectives ("robust", "fast").
3. **Build a question queue** (max 5, ranked by impact × uncertainty). Only questions whose answer changes architecture, data model, tasks, tests, UX behaviour or compliance. Each must be answerable by a 2–5 option choice or a ≤5-word answer. Skip stylistic preferences and plan-level details.
4. **Ask one question at a time**. Format: short context quote from the spec, the question, an options table (Option | Answer | Implications) or the short-answer constraint. Wait for the answer. Accept "skip" / "default" and record the default you chose.
5. **Integrate immediately after each answer**: add a `## Clarifications` section with a `### Session YYYY-MM-DD` subsection and a `- Q: … → A: …` line, then edit the affected section (requirements, stories, entities, NFRs) so the spec itself carries the decision. Remove any now-resolved `[NEEDS CLARIFICATION]` marker. Save after each edit.
6. **Stop** after 5 questions, when all categories are Clear, or when the user says stop.
7. **Report**: questions asked/answered, sections touched, categories still Partial/Missing (with a one-line reason each), and the next step (`/forge:plan`).

Never ask what the spec already answers. Never rewrite sections unrelated to an answer.
