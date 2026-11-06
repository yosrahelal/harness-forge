---
description: Install the blockchain multi-agent pipeline v2 in the current project — 19 single-task agents (analyste → upgrade), orchestrator CLAUDE.md, path/broadcast/secret guard hooks, deterministic gates 1–6, artifact templates 00–10 — for EVM or Soroban/Stellar.
argument-hint: "<project name> [--chain evm|soroban] [--network <name>] [--force]"
disable-model-invocation: true
---
<!-- origin: forge (pipeline multi-agents blockchain v2, Y. Helal 2026-11-05) -->

# Blockchain pipeline

Method and rationale: `${CLAUDE_PLUGIN_ROOT}/playbooks/blockchain-pipeline.md`. Kit sources: `${CLAUDE_PLUGIN_ROOT}/kits/blockchain-pipeline/`.

1. **Check the target.** Must be a git repository (gates read `git status`). If not, ask before `git init`. Note an existing `CLAUDE.md`, `.claude/settings.json`, `Makefile`: they are kept and merged, never replaced.
2. **Dry run, then install.** Parse `$ARGUMENTS` (first word = project name, default the directory name; `--chain` default `evm`):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/blockchain-pipeline.js" --project <name> --chain <chain> [--network <n>] --dry-run
   node "${CLAUDE_PLUGIN_ROOT}/scripts/blockchain-pipeline.js" --project <name> --chain <chain> [--network <n>]
   ```
   Show the dry-run list first if anything would be overwritten (`--force`) and wait for a yes.
3. **Smoke-test the guards** in the project (each must exit 2):
   ```bash
   echo '{"tool_input":{"command":"forge script script/Deploy.s.sol --broadcast"}}' | node .claude/hooks/guard-chain.js
   echo '{"tool_input":{"file_path":"contracts/X.sol"},"agent_type":"testeur"}' | node .claude/hooks/guard-paths.js
   ```
   If a hook does not block, stop and report: the pipeline must not run unguarded.
4. **Toolchain.** Report which of `forge`, `anvil`, `halmos`, `slither`, `gambit` (EVM) or `stellar`, `komet`, `cargo scout-audit`, `cargo llvm-cov`, `cargo mutants` (Soroban; also suggest the official `stellar-dev-skill` and OpenZeppelin `setup-stellar-contracts` skills) are missing. Gates fail closed on a missing tool; do not install anything without asking.
5. **Hand over.** Tell the user: fill in `docs/00-projet.md` (brief, scope, constraints), restart Claude Code so the new agents and hooks load, then ask the orchestrator to start step 1 (`analyste`). Gates 5–6 that need a remote RPC are run by the user in their own terminal (`make gate-6`).

Never put a private key, mnemonic or RPC URL in any file or command. Never change thresholds, perimeters or waivers without a written decision in `docs/00-projet.md`.
