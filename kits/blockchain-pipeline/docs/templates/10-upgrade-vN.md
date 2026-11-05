# Upgrade vN — <projet> — <réseau>

## Demande et périmètre
Contrats, fonctions, storage touchés.
## Storage layout
| Contrat | Variable | Slot déployé | Slot nouveau | Type | Compatible |
| --- | --- | --- | --- | --- | --- |
Commandes : `forge inspect <C> storageLayout --json`, `make gate-5`.
## À rejouer par l'orchestrateur
| Étape | Agent | Périmètre |
| --- | --- | --- |
## Proposition timelock (non signée)
Fichier, cible, `upgradeToAndCall` (données), délai.
## Scénario sur fork
État avant, upgrade, état après, invariants.
## Écarts et questions
