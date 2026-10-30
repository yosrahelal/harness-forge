---
description: Compare the codebase against the feature's spec, plan and tasks; classify gaps by severity; append remaining work as new tasks to tasks.md or report "Converged". Repeat implement → converge until converged.
argument-hint: "[feature]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit templates/commands/converge.md) -->

# Converge

1. **Resolve**: `node "${CLAUDE_PLUGIN_ROOT}/scripts/sdd/feature-paths.js" --json --require-spec --require-tasks --include-tasks`.
2. **Intent inventory** (progressive disclosure, do not dump whole files into context): from `spec.md` list every functional requirement, user story and success criterion; from `plan.md` the structural and contract commitments; from `tasks.md` the completed/unchecked tasks; from `.forge/constitution.md` the gates.
3. **Assess the codebase** against each inventory item with targeted reads, greps and test runs. Classify each finding:
   - `MISSING` — required behaviour not implemented
   - `PARTIAL` — implemented but incomplete or untested
   - `DRIFT` — implemented differently from spec/plan without a recorded decision
   - `UNTRACKED` — work done that no task covers
   - `OK`
4. **Severity**: CRITICAL (P1 story broken, security, data loss) · HIGH (requirement missing) · MEDIUM (partial/untested) · LOW (docs, polish).
5. **Present** the in-session summary as a table (Item | Source | Status | Severity | Evidence).
6. **Append tasks**: for every MISSING/PARTIAL/DRIFT item add new tasks at the end of `tasks.md` under a `## Phase N: Convergence <date>` heading using the strict format and continuing the ID sequence. For DRIFT, add either a fix task or an ADR task to record the accepted deviation. If nothing remains, write `Converged` with the date at the end of `tasks.md`.
7. **Report**: counts by status and severity, tasks appended, and the next step (`/forge:implement` or `/forge:ship`).

Never modify source code or the spec here.
