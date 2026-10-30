---
description: Create a feature specification from a natural-language description (WHAT and WHY, no HOW) under specs/NNN-short-name/spec.md, with a quality checklist and at most 3 clarification questions.
argument-hint: "<feature description>  [--branch]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit templates/commands/specify.md) -->

# Specify

Input: `$ARGUMENTS` — the feature description. If empty, stop and ask for one.

Invoke the `forge:spec-driven-development` skill. If the request is still fuzzy, run `forge:interview-me` first (one question at a time) until intent is clear.

## Steps

1. **Short name**: derive a 2–4 word kebab-case name (action-noun, keep acronyms): "add user authentication" → `user-auth`.
2. **Create the feature directory** by running from the repo root:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd/new-feature.js" --name "<short-name>" --json [--branch]
   ```
   Parse `FEATURE_DIR`, `SPEC_FILE`, `FEATURE_NUM`. The script writes the spec template, creates `checklists/`, records the active feature in `.forge/feature.json`, and (with `--branch`) creates the git branch `NNN-short-name`.
3. **Load context**: `.forge/constitution.md` (if present), `GLOSSARY.md`, existing specs in `specs/` for vocabulary and conventions.
4. **Write the spec** into `SPEC_FILE`, keeping the template's section order:
   - User stories prioritised P1, P2, P3, each independently testable, with Given/When/Then acceptance scenarios.
   - Functional requirements, each testable; edge cases; key entities when data is involved.
   - Success criteria: measurable, technology-agnostic, user-facing ("checkout in under 3 minutes", not "API under 200 ms").
   - Assumptions section for every reasonable default you took.
   - At most **3** `[NEEDS CLARIFICATION: question]` markers, prioritised scope > security/privacy > UX > technical. Make informed guesses for everything else.
   - No tech stack, APIs or code structure. Written for stakeholders, not developers.
5. **Quality checklist**: write `FEATURE_DIR/checklists/requirements.md` from `${CLAUDE_PLUGIN_ROOT}/templates/checklist-template.md` with the standard items (no implementation details, all mandatory sections done, requirements testable, success criteria measurable, scope bounded, assumptions listed, no clarification markers left). Validate the spec against it; fix failures (max 3 passes).
6. **Clarifications**: if markers remain, present them all at once as numbered questions with an options table (A/B/C/Custom + implications), wait for answers, update the spec, re-validate.
7. **Report**: feature number, directory, spec path, checklist status, open questions, and the next step (`/forge:clarify` for deeper coverage or `/forge:plan`).

Rules: one feature per invocation; never overwrite an existing spec without confirmation; never touch source code.
