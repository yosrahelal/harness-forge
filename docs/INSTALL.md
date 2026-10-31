# Install

## Prerequisites

- Node.js ≥ 18 (hooks and scripts). No npm dependencies.
- Python 3 only for `scripts/sync-upstream.py`.
- `gh` CLI for `/forge:pr`, `/forge:review <pr>`, `issue-review`, `to-tickets` (GitHub tracker).

## Claude Code

**Marketplace install** (persistent, from GitHub):

```
/plugin marketplace add yosrahelal/harness-forge
/plugin install forge@harness-forge
/plugin list
```

**Development mode** (recommended while you customise):

```bash
git clone https://github.com/yosrahelal/harness-forge.git
claude --plugin-dir ./harness-forge
```

A local clone also works as a marketplace: `/plugin marketplace add ./harness-forge`.

Verify: `/forge:guide` should answer; `/forge:verify quick` should run; a `git push --force origin main` must be blocked by the guard hook.

Hooks are declared in `hooks/hooks.json` and enabled by the plugin. Disable at runtime with `FORGE_HOOKS=off`, the guard only with `FORGE_GUARD=off`.

## Manual / per project (no plugin)

```bash
cd /path/to/your/project
node /path/to/harness-forge/scripts/install.js --scope project --auto --core --hooks
```

- `--auto` detects the stack (lockfiles, manifests, package.json deps) and installs `rules/common` + matching language rules + matching language reviewers.
- `--core` copies the 29 core agents; `--skills` copies all skills flat into `.claude/skills/`; `--division a,b` adds roster personas; `--hooks` merges the hooks into `.claude/settings.json` with absolute paths.
- Everything installed is listed in `.claude/.forge-install.json`; `--uninstall` removes exactly that.
- `--scope user` targets `~/.claude` (or `$CLAUDE_CONFIG_DIR`).

## claude.ai (web, desktop, mobile)

```bash
node scripts/export-claude-web.js [pack ...]   # default: every packs/*/pack.json
```

Writes `dist/claude-web/<pack>/`: one `skills/<name>.zip` per skill (upload in Settings → Capabilities → Skills, code execution enabled), `projects/<name>/instructions.md` and `knowledge/` for a claude.ai Project, `CONTENTS.md`. The exporter keeps only `name` and `description` in the frontmatter, enforces the pack's `maxDescription`, rewrites `forge:<skill>` and appends per-skill notes from `pack.json`. Subagents, commands and hooks do not exist on claude.ai.

## Other harnesses

```bash
npx skills add yosrahelal/harness-forge          # pick skills interactively, install into 70+ agents
npx skills add yosrahelal/harness-forge -a codex # or cursor, gemini, opencode, copilot…
```

Skills live under `skills/<category>/<name>/SKILL.md`; the `agents/openai.yaml` files inside Matt Pocock's skills give Codex display names. Roster personas are plain Markdown with frontmatter and can be copied into any harness that supports custom agents (see agency-agents' per-tool notes).

## Project bootstrap

Inside a project, run `/forge:init` once. It creates `.forge/` (constitution, gitignore), installs stack-matched rules and reviewers at project scope, adds a short Forge section to `CLAUDE.md`, runs the tracker/glossary setup (`forge-setup` skill) and offers `/forge:constraints`.
