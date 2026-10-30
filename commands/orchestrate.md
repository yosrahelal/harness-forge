---
description: Run a multi-agent delivery pipeline (NEXUS Full / Sprint / Micro) through the orchestrator agent — spec, plan, tasks, Dev↔QA loop with evidence, hardening, ship — with written state in .forge/pipeline/.
argument-hint: "<feature or goal> [--mode full|sprint|micro]"
disable-model-invocation: true
---
<!-- origin: forge (agency-agents NEXUS orchestration mapped onto spec-kit artifacts and Forge agents) -->

# Orchestrate

1. Read `playbooks/nexus/QUICKSTART.md` and the relevant phase playbook(s) under `playbooks/nexus/playbooks/`; pick the runbook roster from `playbooks/nexus/runbooks.json` that matches (startup-mvp, enterprise-feature, incident-response, marketing-campaign) or compose one.
2. Spawn `forge:orchestrator` with: the goal (`$ARGUMENTS`), the mode (default: Sprint if a spec exists, Full otherwise, Micro for a single task), existing artifacts (`specs/`, `.forge/constitution.md`), the chosen roster, and the instruction to keep `.forge/pipeline/<feature>.md` updated and to stop at every gate failure after 3 retries.
3. Relay each phase status report to the user. Gates needing human approval (plan approval, ship decision, irreversible steps) are surfaced, never auto-approved.
4. On completion, run `forge:retro` and offer `/forge:learn`.
