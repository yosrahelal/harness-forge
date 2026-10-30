---
description: Assemble a team of Forge agents for a scenario — list divisions and runbook rosters, install the matching roster personas into .claude/agents, and print activation prompts for each role.
argument-hint: "[runbook slug | division names | 'for <goal>']"
disable-model-invocation: true
---
<!-- origin: forge (agency-agents runbooks + ECC team-builder) -->

# Team

1. List available rosters: `node "${CLAUDE_PLUGIN_ROOT}/scripts/install.js" --list`. Read `playbooks/nexus/runbooks.json` for scenario rosters.
2. Match `$ARGUMENTS` to a runbook or divisions; for a free-form goal, pick the smallest roster that covers discovery, build, QA and ship, and explain the choice.
3. Install the chosen personas at project scope: `node "${CLAUDE_PLUGIN_ROOT}/scripts/install.js" --scope project --division <names> [--agent <slug,...>]`.
4. Print, for each role, an activation prompt built from `playbooks/nexus/coordination/agent-activation-prompts.md` with placeholders filled from this repo (project name, spec path, phase).
5. Suggest `/forge:orchestrate` to run the pipeline with this team.
