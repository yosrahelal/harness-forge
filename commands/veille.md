---
description: Weekly tech watch (veille de la semaine) via the watcher agent — EVM, tokenisation and security by default; writes veille/<YYYY>-W<ww>.md with ranked, sourced items and actions.
argument-hint: "[evm,tokenisation,securite] [--depuis YYYY-MM-DD] [--sortie dir]"
disable-model-invocation: true
---
<!-- origin: forge -->

# Veille

1. **Parse arguments** from `$ARGUMENTS`: scope (comma list, default `evm,tokenisation,securite`), window start (`--depuis`, default today minus 7 days), output dir (`--sortie`, default `veille/`).
2. **Spawn** `forge:watcher` with the scope, the exact window dates, the output dir, and whether the current directory is a code project (so it can check dependencies).
3. **Return** the agent's summary and the report path. Do not rewrite the report.
4. **Suggest** once, if no schedule exists: run it every Monday with `/schedule` (cloud routine) or `/loop 7d /forge:veille` while a session stays open.

Project tuning (optional, read by the agent): `veille/sources.md` adds or excludes sources; `veille/focus.md` lists chains, standards and dependencies that matter most, to rank items.
