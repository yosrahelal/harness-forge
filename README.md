# Forge — un seul harnais d'agents, cinq sources fusionnées

Forge réunit en **un plugin Claude Code** (utilisable aussi depuis Codex, Cursor, Gemini CLI, OpenCode via `npx skills`) le meilleur de cinq dépôts :

| Source | Ce que Forge en garde |
|---|---|
| [github/spec-kit](https://github.com/github/spec-kit) | Le cycle Spec-Driven Development : constitution → specify → clarify → plan → tasks → implement → converge, le workflow bug, les templates |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | 23 sous-agents opérationnels (planner, reviewers, resolvers…), ~75 skills (langages, backend/frontend, infra, agentique), les règles toujours actives, l'esprit des hooks |
| [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents) | 80 personas spécialistes (roster), les playbooks NEXUS, les runbooks d'équipe, les templates de handoff, l'orchestrateur |
| [mattpocock/skills](https://github.com/mattpocock/skills) | grilling, TDD aux seams, domain modeling/GLOSSARY, to-spec/to-tickets/triage/wayfinder, handoff, retro, research, prototype |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Le cycle quotidien spec → plan → build → test → review → ship, interview-me, idea-refine, constraint/doubt/source-driven development, checklists partagées |

Chiffres : **35 commandes**, **29 agents cœur** + **108 personas** opt-in, **137 skills**, **22 jeux de règles**, **5 hooks**, 9 templates, playbooks NEXUS + checklists. Tout est MIT (voir `NOTICE.md`), chaque fichier importé porte son `origin:`.

```text
idée ──▶ spec ──▶ plan ──▶ tasks ──▶ build (TDD) ──▶ verify ──▶ review ──▶ converge ──▶ ship ──▶ learn
 grill    specify   plan     tasks     build/implement   verify     review     converge     ship/pr   retro
```

## Installation

### Claude Code (plugin, recommandé)

```bash
# depuis GitHub (recommandé) :
/plugin marketplace add yosrahelal/harness-forge
/plugin install forge@harness-forge

# ou depuis un clone local, en mode développement (toujours à jour avec le dépôt) :
git clone https://github.com/yosrahelal/harness-forge.git
claude --plugin-dir ./harness-forge
```

Puis dans un projet : `/forge:init` (constitution, règles et reviewers adaptés à la stack, CLAUDE.md, tracker, CONSTRAINTS.md).

### Sans plugin (copie dans `.claude/` ou `~/.claude/`)

```bash
node scripts/install.js --list                                  # voir agents, divisions, règles
node scripts/install.js --scope project --auto                  # règles + reviewers selon la stack détectée
node scripts/install.js --scope project --core --skills --hooks # agents cœur, tous les skills, hooks
node scripts/install.js --scope project --division testing,design
node scripts/install.js --scope user --all                      # tout, pour l'utilisateur
node scripts/install.js --scope project --uninstall
```

### Claude web, desktop et mobile (claude.ai, sans Claude Code)

```bash
node scripts/export-claude-web.js blockchain-expert   # → dist/claude-web/blockchain-expert/
```

Produit un `.zip` par skill (à importer dans Paramètres → Capacités → Skills) et des Projets prêts à créer (instructions + fichiers de connaissance). Pas de sous-agents, commandes ni hooks sur claude.ai. Guide : [packs/blockchain-expert/README.md](packs/blockchain-expert/README.md).

### Autres harnais

`npx skills add yosrahelal/harness-forge` (ou le chemin d'un clone local) installe les skills dans Codex, Cursor, Gemini, OpenCode, Copilot… Les commandes `/forge:*` sont propres à Claude Code ; ailleurs, invoquez le skill correspondant par son nom. Les personas du `roster/` se copient tels quels dans le dossier agents du harnais.

## Les workflows qui font gagner du temps

Détails et variantes dans [docs/WORKFLOWS.md](docs/WORKFLOWS.md).

**Nouvelle fonctionnalité (1 à 5 jours de travail)**

```text
/forge:specify Build a photo organizer with albums grouped by date
/forge:clarify            # ≤5 questions à fort impact, réponses écrites dans le spec
/forge:plan Use Vite + SQLite, keep images local
/forge:tasks --tdd
/forge:build auto         # une approbation, puis chaque tâche : test rouge → vert → commit
/forge:verify && /forge:converge
/forge:ship && /forge:pr
```

**Petit changement (une heure)** : `/forge:grill-me` si le besoin est flou, puis `/forge:build <description>`, `/forge:review`, `/forge:simplify`.

**Bug** : `/forge:bug-assess "<rapport ou URL>" slug=login-crash` → `/forge:bug-fix slug=login-crash` → `/forge:bug-test slug=login-crash`. Rapports dans `.forge/bugs/login-crash/`.

**Travail plus grand qu'une session** : skill `wayfinder` (carte de décisions sur le tracker), `/forge:orchestrate` (pipeline multi-agents NEXUS avec gates et boucle Dev↔QA), `/forge:save-session` / `/forge:resume-session`.

**Projet blockchain réglementé (EVM ou Soroban)** : `/forge:blockchain-pipeline EURxt --chain soroban` installe dans le projet le pipeline v2 : 19 agents monotâches (analyste → architecte → concepteur → développeur → testeur → red team → six auditeurs + juge → relecteur → documentaliste → release → run → upgrade), un `CLAUDE.md` orchestrateur, des hooks qui bloquent les écritures hors périmètre, toute signature, tout secret et tout RPC distant, et six gates scriptées (`make gate-N`) qui décident du passage d'étape. Méthode : [playbooks/blockchain-pipeline.md](playbooks/blockchain-pipeline.md).

**Cadrage d'idée** : `/forge:grill-me`, skill `idea-refine`, skill `council` (quatre voix pour trancher), `/forge:constraints` pour écrire la barre de qualité une fois pour toutes.

Pour savoir quoi utiliser : `/forge:guide <ce que vous essayez de faire>`.

## Comment c'est organisé

```text
agents/        28 sous-agents cœur, chargés par le plugin (planner, architect, code-reviewer, security-reviewer,
               tdd-guide, test-engineer, build-error-resolver, e2e-runner, reality-checker, orchestrator…)
roster/        108 personas opt-in par division : languages, engineering, testing, product, design,
               project-management, security, specialized, growth, ml
skills/        137 skills : workflow (cycle de vie), engineering, languages, agentic, product, ml, blockchain
commands/      35 commandes /forge:*
rules/         règles toujours actives : common + 21 langages/frameworks
hooks/         SessionStart (contexte), guard Bash (bloque force-push, reset --hard, rm -rf /…),
               post-edit (format + alertes console.log), suggest-compact, pre-compact (snapshot)
templates/     constitution, spec, plan, tasks, checklist, ADR, glossaire, session, handoff
playbooks/     NEXUS (phases 0-6, runbooks, coordination), checklists (sécurité, perf, a11y,
               observabilité, tests, definition of done), patterns d'orchestration, essai SDD
contexts/      profils dev / review / research
packs/         packs pour claude.ai (skills zippés + Projets), ex. blockchain-expert
overlays/      sections Forge ajoutées aux fichiers importés, réappliquées après chaque synchro
kits/          kits installés dans un projet, ex. blockchain-pipeline (19 agents, hooks, gates 1-6, templates 00-10)
scripts/       install.js, validate.js, catalog.js, export-claude-web.js, blockchain-pipeline.js, kit-selftest.js, sync-upstream.py, sdd/new-feature.js, sdd/feature-paths.js
docs/          ARCHITECTURE, WORKFLOWS, SOURCES (décisions de fusion), INSTALL, CATALOG (généré)
```

Artefacts produits dans vos projets : `specs/NNN-nom/{spec,plan,tasks,research,data-model,quickstart}.md`, `.forge/constitution.md`, `.forge/bugs/<slug>/`, `.forge/sessions/`, `.forge/pipeline/`, `CONSTRAINTS.md`, `GLOSSARY.md`, `docs/adr/`.

## Principes de la fusion

1. **Une seule entrée par concept.** Quand plusieurs sources couvraient la même chose (TDD, revue, debugging, git, API, sécurité, ADR, a11y), un skill primaire a été retenu et les autres sont conservés en `references/` lisibles à la demande. Pas de doublons de déclenchement, aucune connaissance perdue.
2. **Les commandes pilotent, les skills portent la méthode, les agents délèguent, les règles sont toujours actives.** Spec-kit a été réécrit sans sa CLI Python : deux petits scripts Node suffisent.
3. **Contexte léger par défaut.** 29 agents chargés, le reste à la demande (`--division`, `--auto`). Boilerplate « prompt defense » de ECC retiré des 50 agents et remplacé par une règle commune.
4. **Hooks sans dépendances** (Node ≥ 18, pas de `jq`), désactivables avec `FORGE_HOOKS=off`.
5. **Traçabilité** : `origin:` partout, `upstream/manifest.json`, `scripts/sync-upstream.py` pour resynchroniser.

Voir [docs/SOURCES.md](docs/SOURCES.md) pour le détail des choix et [docs/CATALOG.md](docs/CATALOG.md) pour la liste complète.

## Maintenance

```bash
node scripts/validate.js      # unicité des noms, frontmatter, chemins du manifest, résidus upstream
node scripts/catalog.js       # régénère docs/CATALOG.md
node scripts/apply-overlays.js  # réapplique overlays/ aux fichiers importés (fait aussi par sync-upstream.py)
node scripts/kit-selftest.js  # hooks et gates du kit blockchain-pipeline dans un dépôt jetable
python3 -I scripts/sync-upstream.py --sources <clones> --target .   # resynchroniser depuis les 5 dépôts
```

Licence MIT. Attributions complètes dans `NOTICE.md`.
