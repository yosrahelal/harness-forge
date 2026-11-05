# Kit — pipeline multi-agents blockchain (v2)

Fichiers copiés dans un projet par `/forge:blockchain-pipeline` (`node scripts/blockchain-pipeline.js`). Méthode : [`playbooks/blockchain-pipeline.md`](../../playbooks/blockchain-pipeline.md).

| Source (kit) | Destination (projet) |
| --- | --- |
| `CLAUDE.md` | `CLAUDE.md` (ou `CLAUDE.pipeline.md` importé si un CLAUDE.md existe) |
| `claude/agents/*.md` (19) | `.claude/agents/` |
| `variants/soroban/claude/agents/*.md` | `.claude/agents/` avec `--chain soroban` (concepteur, developpeur, testeur) |
| `claude/hooks/` | `.claude/hooks/` (guard-paths, guard-chain, audit-log, perimeters.json) |
| `claude/settings.json` | `.claude/settings.json` (fusionné) |
| `docs/templates/` | `docs/templates/` (00 à 10, audit-classe, `json/` schémas) |
| `scripts/gates/` | `scripts/gates/` (gates.js, gate-1..6.sh, mutation.js, fork.sh) |
| `Makefile.pipeline` | `Makefile.pipeline` (+ `include` dans `Makefile`) |

Le dossier `claude/` du kit devient `.claude/` dans le projet (`.pipeline/` est créé à l'installation) : le kit ne contient pas de dossier caché, pour que Claude Code ne charge pas ces agents quand on travaille sur le dépôt Forge lui-même.

Maintenance : un nom d'agent du kit est unique dans le kit et ne reprend pas un nom de `agents/` ou `roster/` (vérifié par `scripts/validate.js`). Tester les hooks et les gates avec `node scripts/kit-selftest.js`.
