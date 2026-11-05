# Pipeline multi-agents pour projets blockchain (v2)

<!-- origin: forge (d'après « Pipeline multi-agents projet blockchain — prompts et templates », Y. Helal, 2026-11-05) -->

Ce pipeline couvre tout le cycle de vie d'un smart contract, de la spec à l'exploitation : spec exécutable, red team, essaim d'auditeurs filtré par un juge, gates scriptées, puis release, run et upgrade. Il est installé dans un projet par `/forge:blockchain-pipeline` (kit `kits/blockchain-pipeline/`) et décrit ici.

Aucun passage d'étape ne repose sur l'avis d'un LLM : un script décide (`scripts/gates/gate-N.sh`), puis l'humain aux trois moments clés (architecture, avant audit externe, avant mainnet). Le code est attaqué avant d'être déployé.

## Principes

Des agents monotâches enchaînés par leurs artefacts, pilotés par un orchestrateur (le `CLAUDE.md` du projet) qui ne produit rien lui-même. Chaque agent a un rôle, des entrées limitées, une sortie unique et des critères de refus.

1. **Une entrée, une sortie.** L'agent lit l'artefact de l'étape précédente et `docs/00-projet.md`, pas l'historique des autres.
2. **Pas de décision silencieuse.** Tout écart va dans « Écarts et questions ».
3. **Sources exigées.** Sinon « à vérifier ».
4. **Un schéma par artefact** (analyse, architecture, conception).
5. **Validation humaine entre chaque étape.**
6. **Langue.** Documents en français ; code, commentaires et commits en anglais.

Dans Claude Code, un sous-agent ne peut pas en lancer un autre : l'orchestrateur appelle lui-même chaque sous-agent, en parallèle quand c'est possible (essaim d'auditeurs).

## Ce qui change par rapport à la v1

| Dimension | v1 | v2 |
| --- | --- | --- |
| Spec | Interfaces et plan de tests rédigés | Interfaces, invariants Foundry et propriétés Halmos écrits avant le code ; ils font foi |
| Tests | Unitaires, fuzz, invariants, intégration | + fork tests et mutation testing (score ≥ 80 %) |
| Sécurité | Un relecteur fait tout | Red team qui écrit des exploits, six auditeurs spécialisés, un juge qui exige une preuve par test |
| Passage d'étape | Validation humaine sur artefact | `gate-N.sh` doit sortir à 0, puis validation humaine |
| Garde-fous | Écrits dans `CLAUDE.md` | Appliqués par hooks : chemins d'écriture, broadcast, clés privées, RPC distants |
| Audit externe | Non prévu | Obligatoire avant mainnet |
| Après la revue | Documentaliste, fin | Release, run, upgrade |
| Traçabilité | Journal des décisions | + journal JSONL de chaque appel d'outil (DORA) et des gates |

## Arborescence installée

```text
<projet>/
  CLAUDE.md                  # orchestrateur + règles communes
  .claude/settings.json      # hooks + permissions deny (.env, cast send, forge create…)
  .claude/hooks/             # guard-paths.js, guard-chain.js, audit-log.js, perimeters.json
  .claude/agents/            # 19 agents (variante Soroban : concepteur, developpeur, testeur)
  docs/00-projet.md          # dossier projet, tenu par l'orchestrateur
  docs/templates/            # templates 00 à 10, audit-classe, schémas JSON
  docs/pipeline.md           # ce document
  contracts/interfaces/  test/{base,invariants,symbolic,fork,exploits,audit,upgrade}/
  script/  deployments/  monitor/
  scripts/gates/             # gates.js, gate-1.sh … gate-6.sh, mutation.js, fork.sh
  .pipeline/                 # config.json, current-agent, journal.jsonl, gates.jsonl, *.json des agents
  Makefile.pipeline
```

## Agents

| Étape | Agent | Sortie | Outils | Modèle |
| --- | --- | --- | --- | --- |
| 1 | `analyste` | `01-analyse.md` | Read, Write, WebSearch, WebFetch | opus |
| 2 | `architecte` | `02-architecture.md` | Read, Write, WebSearch, WebFetch | opus |
| 3 | `concepteur` | `03-conception.md` + spec exécutable + `spec.json` | Read, Grep, Glob, Write, Bash | opus |
| 4 | `developpeur` | code + `04-implementation.md` | Read, Edit, Write, Bash | opus |
| 5 | `testeur` | `test/` + `05-tests.md` | Read, Write, Bash | sonnet |
| 6a | `red-team` | `test/exploits/` + `06a-redteam.md` + `redteam.json` | Read, Grep, Glob, Bash, Write | opus |
| 6b | `auditeur-acces`, `-appels`, `-calcul`, `-upgrade`, `-economie`, `-conformite` | `docs/audit/<classe>.md` + `test/audit/<classe>/` | Read, Grep, Glob, Bash, Write | opus |
| 6b | `juge` | `06b-audit.md` + `audit.json` | idem | opus |
| 6c | `relecteur` | `06-revue.md` | Read, Grep, Glob, Bash, Write | opus |
| 7 | `documentaliste` | `07-livrable/` | Read, Write | sonnet |
| 8 | `release` | `script/`, `deployments/`, batch Safe non signé, `08-deploiement.md` | Read, Bash, Write | sonnet |
| 9 | `run-config` / `run-triage` | `monitor/`, `09-exploitation.md` | Read, Bash, Write | sonnet / opus |
| 10 | `upgrade` | `10-upgrade-vN.md`, proposition timelock non signée | Read, Grep, Glob, Bash, Write | opus |

Le champ `tools` limite les outils, pas les dossiers : ce sont les hooks qui bloquent les écritures hors périmètre (`.claude/hooks/perimeters.json`). Les agents qui produisent un artefact ont `Write`/`Edit` sur leur seul périmètre.

## Gates déterministes

`scripts/gates/gates.js` exécute les contrôles ; un outil ou un fichier manquant fait échouer le contrôle (fail closed). Chaque gate vérifie aussi que les fichiers non commités appartiennent à l'agent de l'étape (`git status` contre le périmètre) : c'est ce qui rattrape une écriture faite par Bash. Les étapes validées sont donc commitées par l'orchestrateur.

| Gate | Avant | Contrôles | Seuil | Puis |
| --- | --- | --- | --- | --- |
| 1 | Développement | Interfaces, invariants et propriétés compilent ; chaque fonction critique d'une interface a sa propriété `check_*` dans `test/symbolic/` ; chaque `INV-n` de 03 a son test | 100 % | Toi |
| 2 | Tests | `forge build`, `forge fmt --check`, tests de base et invariants verts, aucun skip | 0 échec | Orchestrateur |
| 3 | Sécurité | Suite verte ; chaque `TP-n` a un test `test_TP_n_*` ; couverture des branches ; score de mutation (lié à l'empreinte du code) ; Halmos ; fork tests si intégrations externes | ≥ 95 %, ≥ 80 %, 0 échec | Orchestrateur |
| 4 | Revue | `slither --fail-high` ; `test/exploits/` rejoué (aucun `test_exploit_*` vert, tous les `test_regression_*` verts) ; manches propres recalculées ; 0 Critique/Haute ouvert ; preuves `test_proof_*` Critique/Haute qui ne passent plus | 0, ≥ 3, 0 | Toi, puis audit externe |
| 5 | Release | Rapport d'audit externe présent, 0 Critique/Haute ; storage layout comparé au déployé (`deployments/<réseau>.storage/`) ; dry-run sur fork ; simulation verte sur le code actuel | 0 écart | Toi, avant signature |
| 6 | Exploitation | Bytecode on-chain = manifeste ; sources vérifiées (API Blockscout/Etherscan) ; aucun rôle admin détenu par un EOA ni par le déployeur ; monitor actif | 0 écart | Run |

Réglages dans `.pipeline/config.json` : `chain` (`evm` | `soroban`), `network`, `thresholds`, `commands` (surcharge de chaque commande), `waivers` (dérogation motivée par contrôle, ex. `"gate-3.fork": "aucun fork Stellar disponible, décision du 2026-11-12"`). Les seuils sont un point de départ : à ajuster après le premier projet, et chaque changement va au journal des décisions.

Gates 5 et 6 avec RPC distant (`VERIFY_RPC_URL`, `UPSTREAM_RPC_URL`) : lancées par un humain dans son terminal, jamais par un agent.

## Boucles de retour

Le flux nominal descend ; les retours remontent vers l'étape qui possède la décision en cause, jamais vers une étape intermédiaire. Table complète dans le `CLAUDE.md` du projet. Un retour au-dessus de l'étape 3 est coûteux : volontaire, rare, tracé.

| Étape franchie | Critère de passage | Qui valide |
| --- | --- | --- |
| 1 → 2 | Cas d'usage avec critères d'acceptation ; contraintes réglementaires sourcées ; questions ouvertes répondues ou assumées | Toi |
| 2 → 3 | Tableau de décision complet (alternatives + motif + source) ; C4 ; risques avec mitigation | Toi |
| 3 → 4 | Gate 1 ; séquence par CU ; plan couvrant chaque fonction et invariant ; versions figées | Toi |
| 4 → 5 | Gate 2 ; écarts consignés dans 04 | Orchestrateur, puis toi sur les écarts |
| 5 → 6 | Gate 3 ; constats documentés | Orchestrateur |
| 6 → 7 | Gate 4 ; verdict « Prêt à documenter » | Toi |
| 7 → 8 | Gate 5 ; audit externe sans Critique/Haute ouvert | Toi |
| 8 → 9 | Batch signé et diffusé par un humain ; gate 6 | Toi, puis Run |

## Garde-fous par hooks

| Hook | Événement | Effet |
| --- | --- | --- |
| `guard-paths.js` | PreToolUse Edit/Write/MultiEdit/NotebookEdit | refuse (exit 2) toute écriture hors du périmètre de l'agent courant |
| `guard-chain.js` | PreToolUse Bash | refuse `--broadcast`, `cast send/publish/mktx`, `forge create`, `--private-key`/`--mnemonic`/`--keystore`/`--account`/wallets matériels, variables de secret, clés Stellar, transactions Stellar hors `--network local`, lecture de `.env`, méthodes RPC d'écriture, toute URL non locale |
| `audit-log.js` | PostToolUse * | une ligne JSON par appel dans `.pipeline/journal.jsonl` (agent, outil, entrée tronquée et expurgée) |

Identité de l'agent : le champ `agent_type` de l'entrée du hook quand l'appel vient d'un sous-agent, sinon `.pipeline/current-agent` écrit par l'orchestrateur, sinon `orchestrateur`.

Limites connues :
- Les forks sont lancés hors agents (`scripts/gates/fork.sh`, par un humain) ; les agents ne voient que `localhost` et jamais la clé du RPC.
- Un agent peut écrire par Bash et contourner `guard-paths.js` : la gate suivante le détecte par `git status`.
- Les noms de champs de l'entrée des hooks (`tool_input.file_path`, `tool_input.command`, `agent_type`) et les formats `gambit_results.json` / `mutants.out/outcomes.json` sont à vérifier sur les versions installées avant le premier projet (`node scripts/kit-selftest.js` dans le dépôt Forge couvre la logique, pas les versions).
- Le hook Bash filtre des motifs : il réduit le risque, il ne remplace ni l'absence de clé dans l'environnement ni le Safe.

## Skills et MCP du marché

Socle conseillé : Trail of Bits Skills et Slither MCP pour l'audit, OpenZeppelin MCP et Skills pour la génération, Foundry en local, Tenderly pour la simulation. État au 5 novembre 2026.

| Agent | Outil | Type | Éditeur | Apport |
| --- | --- | --- | --- | --- |
| Concepteur, Développeur | OpenZeppelin Contracts MCP | MCP | OpenZeppelin, officiel | Contrats depuis les modèles OZ ; Solidity, Confidential Contracts, Stellar ; local ou hébergé |
| Concepteur, Développeur, Upgrade | OpenZeppelin Skills | Skills | OpenZeppelin, officiel | Mise en place et upgrade avec la librairie OZ |
| Développeur, Testeur | Cyfrin solskill | Skill | Cyfrin, officiel | Standards Solidity de production |
| Développeur, Testeur, Red team | Foundry MCP | MCP | Communautaire | forge, cast, anvil ; en local, sans clé |
| Concepteur, Testeur | Certora AI Composer | Plateforme open source | Certora (alpha) | Vérification formelle intégrée à la génération |
| Auditeurs, Juge | Trail of Bits Skills | Skills | Trail of Bits, officiel | building-secure-contracts, entry-point-analyzer, revue différentielle |
| Auditeurs | Slither MCP | MCP | Trail of Bits, officiel | Requêtes sur contrats, héritage, détecteurs |
| Auditeurs | Aderyn | Analyseur, mode MCP | Cyfrin, officiel | Analyse statique Rust, complémentaire de Slither |
| Auditeurs, Red team | Pashov solidity-auditor | Skill | Pashov Audit Group | Retour sécurité rapide |
| Auditeurs | QuillShield Security Skills | Skills | QuillAudits | Réentrance, oracle et flash loan, proxy, invariants |
| Red team, Juge | Solodit MCP | MCP | Communautaire (API Cyfrin Solodit) | Base de constats d'audit ; clé API requise |
| Release, Run, Upgrade | Tenderly MCP | MCP | Tenderly, officiel | Simulation, Virtual Environments, traces |
| Release, Run | Blockscout MCP | MCP | Blockscout, officiel | Données on-chain multi-chaînes |
| Run | OpenZeppelin Monitor et Relayer | Auto-hébergés | OpenZeppelin, officiel | Successeurs de Defender, AGPL v3 ; pas de MCP |

Dans Forge : skills `smart-contract-audit` (méthode d'audit), `blockchain-architecture` (ADR), `tokenization-domain` (MiCA, ERC-3643, conservation), `blockchain-docs` et `blockchain-deck` (livrables) ; persona `roster/security/blockchain-security-auditor`.

À écarter ou manier avec précaution :
- Safe MCP communautaire : il peut exécuter des transactions avec une clé privée. L'agent `release` produit un batch Safe Transaction Builder non signé.
- Etherscan MCP : versions communautaires seulement. Préférer Blockscout, officiel.
- ChainGPT Web3 Dev Kit, QuickNode Blockchain Skills : les requêtes partent chez un tiers ; réserver aux POC sur code public.
- KeeperHub : alternative commerciale et hébergée à OZ Monitor et Relayer, avec MCP.

Règles d'installation en contexte bancaire :
- Un MCP hébergé (OpenZeppelin, Blockscout, Tenderly) reçoit ce que l'agent lui envoie : version locale pour tout code confidentiel.
- Slither MCP envoie des métriques d'usage par défaut : le lancer avec `--disable-metrics`.
- Versions épinglées, code relu avant installation pour tout MCP communautaire, jamais de clé ni de RPC en écriture dans sa configuration.
- Tester chaque outil dans le POC isolé hors SI avant toute intégration.
- Defender n'existe plus depuis le 1er juillet 2026 et son module Deploy n'a pas de remplaçant open source : l'agent `release` et le script Foundry en tiennent lieu. OpenZeppelin Monitor (AGPL v3) : à valider avec le juridique avant usage dans le SI.

## Premier projet : EURxt sur Stellar

Seule sur le projet, périmètre borné (un contrat à développer et tester), toute la chaîne exercée y compris les boucles de retour.

```text
/forge:blockchain-pipeline EURxt --chain soroban
```

- [ ] Kit installé (19 agents, variante Soroban pour concepteur, developpeur, testeur ; templates 00 à 10 ; gates)
- [ ] `docs/00-projet.md` rédigé pour EURxt
- [ ] `.pipeline/config.json` : commandes Soroban sans défaut (`dry_run`, `storage_check`, gate 6) renseignées ou dérogées avec motif
- [ ] Analyste lancé, `01-analyse.md` validé
- [ ] Prompts ajustés après la première boucle complète ; seuils revus et consignés

En Soroban, il n'y a ni Slither ni Halmos : la gate 4 utilise `cargo clippy -D warnings` (ajouter Scout de CoinFabrik via `commands.static` si installé) et les propriétés `check_*` sont des tests proptest.

## Sources

- OpenZeppelin — Defender sunset FAQ : fin du service hébergé le 1er juillet 2026, Relayer et Monitor open source sous AGPL v3.
- Forum OpenZeppelin — pas de remplaçant pour Deploy.
- Trail of Bits Skills : building-secure-contracts, entry-point-analyzer.
- OpenZeppelin Contracts MCP. Tenderly MCP Server.
- Anthropic — SCONE-bench : capacité des modèles à exploiter des smart contracts, base de l'agent red team.
- Claude Code — documentation des hooks (codes de sortie, entrée JSON) et des sous-agents.
