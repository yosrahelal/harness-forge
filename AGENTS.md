# AGENTS.md

Instructions for any coding agent (Codex, Cursor, Gemini CLI, OpenCode, Copilot…) working in this repository. Claude Code reads `CLAUDE.md`, which has the same content plus Claude-specific notes.

- This repo is a plugin of prompts: agents, skills, slash commands, rules, hooks, templates, playbooks. Keep files short, imperative and example-driven.
- Preserve `origin:` provenance markers. Hand-written files are marked `origin: forge`.
- Skill directory name must equal the frontmatter `name`; agent file name must equal its `name`.
- Validate with `node scripts/validate.js`; regenerate the catalog with `node scripts/catalog.js`.
- Hooks are dependency-free Node scripts under `hooks/scripts/`; test them by piping a JSON payload to stdin.
- To use the skills from a non-Claude harness: `npx skills add <path-or-repo>` (skills are discovered under `skills/**/SKILL.md`), or copy `skills/<cat>/<name>/` into the harness's skills directory. Commands are Claude Code specific; invoke the underlying skill by name elsewhere.
