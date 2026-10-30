# Forge hooks

Plain Node scripts (no dependencies, no `jq`). Disable all with `FORGE_HOOKS=off`.

| Event | Script | What it does |
|---|---|---|
| SessionStart | `session-start.js` | Injects package manager, branch, files to read first (constitution, CONSTRAINTS, GLOSSARY, ADRs), active feature and task progress, last saved session, entry points. |
| PreToolUse `Bash` | `guard-bash.js` | **Blocks** (exit 2) force pushes, `reset --hard`, `clean -f`, `branch -D`, `--no-verify`, hooksPath overrides, `rm -rf` of roots/home/cwd/wildcards, destructive SQL, discard-all checkouts. **Warns** on push, amend, dev servers, `curl | sh`, `chmod 777`. `FORGE_GUARD=off` disables; `FORGE_GUARD_ALLOW='<regex>'` allowlists. |
| PostToolUse `Edit\|Write\|MultiEdit` | `post-edit.js` | Formats with the project's Biome/Prettier/ruff/black when configured and installed; warns about `console.log`/`debugger`/`print`/`breakpoint`; `FORGE_TYPECHECK=1` adds `tsc --noEmit`. |
| PostToolUse `.*` | `suggest-compact.js` | Suggests a strategic `/compact` after 50 tool calls, then every 25 (`FORGE_COMPACT_THRESHOLD`, `FORGE_COMPACT_INTERVAL`). |
| PreCompact | `pre-compact.js` | Writes `.forge/sessions/<ts>-precompact.md` with branch, status, last commits, open tasks. |

State lives in `.forge/state/` and `.forge/sessions/` (both git-ignored via `.forge/.gitignore`).

Plugin installs use `hooks.json` as is (`${CLAUDE_PLUGIN_ROOT}` is expanded by Claude Code). Manual installs: `node scripts/install.js --hooks` rewrites the paths and merges the entries into `~/.claude/settings.json` or `.claude/settings.json`.

Sources: ideas from affaan-m/ECC hooks (guards, format, compact, pre-compact), mattpocock git-guardrails and addyosmani session-start, rewritten without their runtime dependencies.
