# CLAUDE.md — working in the harness-forge repository

This repository **is** the Forge plugin: agents, skills, commands, rules, hooks, templates and playbooks for Claude Code (and other harnesses via `npx skills`). It contains no application code.

## Layout

- `agents/` core subagents (always loaded) · `roster/<division>/` opt-in personas
- `skills/<category>/<name>/SKILL.md` (+ `references/`, `scripts/`) · `commands/*.md` slash commands (`/forge:<name>`)
- `rules/` always-on standards · `hooks/` lifecycle hooks (Node, no deps) · `templates/` · `playbooks/` · `contexts/`
- `overlays/<path>` Forge sections appended to the imported file at `<path>` by `scripts/apply-overlays.js` (re-run automatically by `sync-upstream.py`)
- `kits/<name>/` files copied into a project by a script (e.g. `kits/blockchain-pipeline/`, installed by `scripts/blockchain-pipeline.js`); `claude/` in a kit becomes `.claude/` in the project
- `scripts/` `install.js`, `validate.js`, `catalog.js`, `sync-upstream.py`, `sdd/*.js`
- `docs/` ARCHITECTURE, WORKFLOWS, SOURCES, INSTALL, CATALOG (generated)

## Conventions

- Agent files: YAML frontmatter `name` (kebab-case, equals file name), `description` (trigger-rich, says when to use), optional `tools`, `model`, `color`. Body = role, process, output format.
- Skills: directory name == `name` in frontmatter; `description` starts with what it does then "Use when…". User-only skills set `disable-model-invocation: true`. Long material goes in `references/` and is linked from a "Deeper references" section.
- Commands: frontmatter `description`, `argument-hint`, `disable-model-invocation: true`; body under ~60 lines; reference skills as `forge:<skill>` and agents as `forge:<agent>`; use `${CLAUDE_PLUGIN_ROOT}` for paths into the plugin.
- Every imported file keeps its `origin:` marker. Hand-written files use `origin: forge`.
- Names must be unique across agents+roster and across skills. Run `node scripts/validate.js` before committing; run `node scripts/catalog.js` after adding or renaming anything.
- Write for agents (see skill `writing-for-agents`): short, imperative, no fluff, examples over adjectives.

## Testing

```bash
node scripts/validate.js                 # structure, uniqueness, leftovers, manifest paths
node hooks/scripts/guard-bash.js <<< '{"tool_input":{"command":"git push --force origin main"}}'   # expect exit 2
node scripts/install.js --dry-run --auto # stack detection
node scripts/kit-selftest.js             # blockchain-pipeline kit: install, hooks, gates (fake forge)
```

## Do not

- Edit imported files in place (agents, roster, imported skills): put Forge additions in `overlays/<same path>` and run `node scripts/apply-overlays.js`, or add a `references/` note, so `scripts/sync-upstream.py` can be re-run. `validate.js` fails if an overlay is not applied.
- Add hooks that depend on `jq` or on npm packages.
- Weaken the guard list in `hooks/scripts/guard-bash.js` without discussing it.
