---
description: Read-only consistency analysis across spec.md, plan.md and tasks.md — duplicates, ambiguity, coverage gaps, constitution violations, terminology drift — with a severity table and remediation offer.
argument-hint: "[feature]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit templates/commands/analyze.md) -->

# Analyze

1. **Resolve**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd/feature-paths.js" --json --require-spec --require-plan --require-tasks`. Load `.forge/constitution.md`.
2. **Build semantic models** (token-efficient: extract, do not quote whole files): requirements and stories with IDs; plan commitments (stack, structure, contracts); task list with story labels and file paths; constitution rules.
3. **Detection passes**:
   - Duplication: near-identical requirements or tasks.
   - Ambiguity: vague adjectives without measures, unresolved `[NEEDS CLARIFICATION]`, TODOs.
   - Underspecification: requirements with no acceptance scenario; stories with no tasks; tasks referencing entities absent from the data model.
   - Constitution alignment: any plan/task contradicting a MUST rule.
   - Coverage gaps: requirements with no task, tasks with no requirement, contracts with no implementing task.
   - Inconsistency: terminology drift (same concept, different names), conflicting file paths between plan and tasks, ordering violations (dependencies after dependants).
4. **Severity**: CRITICAL (violates constitution, blocks MVP) · HIGH (contradiction or missing coverage for P1) · MEDIUM (ambiguity, drift) · LOW (style).
5. **Report** as a compact table: `ID | Category | Severity | Location | Summary | Recommendation`, followed by a coverage summary (requirements with/without tasks) and metrics (counts by severity).
6. **Offer remediation**: list the concrete edits you would make, grouped by file. Apply them only after explicit approval; this command is read-only by default.
