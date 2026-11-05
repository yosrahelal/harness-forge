#!/usr/bin/env bash
# Start a local fork for the agents. Run by a HUMAN, outside Claude Code: the agents only ever see http://127.0.0.1:8545.
#   UPSTREAM_RPC_URL=<read-only RPC with its key> scripts/gates/fork.sh [block]
set -euo pipefail
: "${UPSTREAM_RPC_URL:?UPSTREAM_RPC_URL (RPC en lecture) requis ; ne jamais le mettre dans un fichier du dépôt}"
args=(--fork-url "$UPSTREAM_RPC_URL" --host 127.0.0.1 --port "${FORK_PORT:-8545}")
[ -n "${1:-}" ] && args+=(--fork-block-number "$1")
exec anvil "${args[@]}"
