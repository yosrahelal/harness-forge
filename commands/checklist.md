---
description: Generate a requirements-quality checklist ("unit tests for English") for a domain — UX, security, API, performance, accessibility — under specs/NNN-name/checklists/<domain>.md. Checks the spec's wording, not the implementation.
argument-hint: "<domain> [focus areas]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit templates/commands/checklist.md) -->

# Checklist

A checklist here validates the **requirements**, not the code. Each item asks whether the spec is complete, clear, consistent, measurable and covers the scenario: "Are error states defined for every network call?" not "Does the error handler work?".

1. **Resolve**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd/feature-paths.js" --json --require-spec`. Read `spec.md`, `plan.md` if present, and `${CLAUDE_PLUGIN_ROOT}/templates/checklist-template.md`.
2. **Clarify the domain** from `$ARGUMENTS` (ux, security, api, performance, a11y, data, ops…). Ask at most 3 short questions (depth, audience, must-have areas) only if the request is ambiguous.
3. **Generate 15–40 items**, grouped by category, each formatted `- [ ] CHK001 <question about the requirements> [Spec §X / Gap]`, covering: completeness (every scenario has requirements), clarity (no vague terms), consistency (no contradictions), measurability (numbers where needed), coverage (edge cases, failure modes, roles), assumptions and dependencies made explicit.
4. **Anti-patterns to avoid**: implementation checks ("button is blue"), test steps, generic items not tied to this spec, duplicates of `checklists/requirements.md`.
5. **Write** `FEATURE_DIR/checklists/<domain>.md` (ask before overwriting). Report the path, item count, and the spec sections most in need of attention.
