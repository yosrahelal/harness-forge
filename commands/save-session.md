---
description: Save the session state (goal, what was done, decisions, failures, open items, next steps, modified files) to .forge/sessions/<date>-<slug>.md so a fresh session can resume with full context.
argument-hint: "[slug]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from affaan-m/ECC /save-session + mattpocock handoff) -->

# Save session

1. **Gather**: `git branch --show-current`, `git status --short`, `git log -5 --oneline`, files changed this session, active feature (`.forge/feature.json`), unchecked tasks in `tasks.md`, test/build status if known.
2. **Write** `.forge/sessions/YYYY-MM-DD-<slug>.md` (slug from `$ARGUMENTS` or the feature name) using `${CLAUDE_PLUGIN_ROOT}/templates/session-summary-template.md`: Goal · Done (with evidence) · Decisions and why · Tried and failed · Open questions · Next steps (ordered, first one precise enough to start immediately) · Files touched · Commands that work (test, build, run).
3. Also update `.forge/sessions/latest.md` (copy). Ensure `.forge/.gitignore` lists `sessions/` and `state/` unless the team wants sessions versioned.
4. Report the path and a 3-line summary. For handing over mid-task to another agent, use `forge:handoff` instead (compact, agent-to-agent).
