---
description: Pre-launch gate — parallel fan-out to code-reviewer, security-reviewer and test-engineer, merged with infra/docs/a11y checks into one GO/NO-GO decision with a mandatory rollback plan.
argument-hint: "[scope or PR]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from addyosmani/agent-skills /ship; personas mapped to Forge agents) -->

# Ship

Invoke `forge:shipping-and-launch`.

**Skip the fan-out only if all are true**: ≤2 files, <50 diff lines, no auth/payments/data/infra/deploy code. Otherwise:

## Phase A — parallel fan-out (one assistant turn, three Agent calls)

1. `forge:code-reviewer` — five-axis review of the change; standard findings report.
2. `forge:security-reviewer` — OWASP Top 10, secrets, authn/authz, dependency CVEs, input validation.
3. `forge:test-engineer` — coverage gaps: happy path, edge cases, error paths, concurrency; which tests must exist before launch.

Subagents report back only; they never call each other. Optional extra lanes when relevant: `forge:web-performance-auditor` (web UI), `forge:reality-checker` (evidence-based QA), roster `accessibility-auditor`.

## Phase B — merge in the main context

Code quality · Security (Critical/High → blockers) · Performance · Accessibility (keyboard, screen reader, contrast) · Infrastructure (env vars, migrations, feature flags, monitoring, alerts) · Documentation (README, ADRs, changelog). Run `/forge:verify` if not already green.

## Phase C — decision

```markdown
## Ship Decision: GO | NO-GO
### Blockers (must fix)        – source agent, finding, file:line
### Recommended fixes
### Acknowledged risks (shipping anyway) – risk + mitigation
### Rollback plan – trigger conditions, exact procedure, recovery time objective
### Specialist reports (full)
```

Any Critical finding → default NO-GO unless the user explicitly accepts the risk. A rollback plan is mandatory before GO.
