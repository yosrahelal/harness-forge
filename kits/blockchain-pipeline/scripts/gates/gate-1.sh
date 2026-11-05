#!/usr/bin/env bash
# Gate 1 — see scripts/gates/gates.js. Exit code non nul = étape bloquée, quel que soit l'avis des agents.
set -euo pipefail
exec node "$(dirname "$0")/gates.js" 1
