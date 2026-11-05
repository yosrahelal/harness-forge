# <Nom du projet>

## Brief
Objectif en une phrase. Contexte métier. Commanditaire. Échéance.

## Périmètre
Dans le périmètre / hors périmètre.

## Contraintes
Réglementaires (MiCA, KYC/AML, conservation), techniques (chaîne imposée, stack), organisationnelles (équipe, délai).

## Étape courante
| Étape | Agent | Artefact | Gate | Statut | Validé le |
| --- | --- | --- | --- | --- | --- |
| 1 | analyste | 01-analyse.md | — | à faire | |
| 2 | architecte | 02-architecture.md | — | à faire | |
| 3 | concepteur | 03-conception.md + spec exécutable | gate-1 | à faire | |
| 4 | developpeur | 04-implementation.md + code | gate-2 | à faire | |
| 5 | testeur | 05-tests.md | gate-3 | à faire | |
| 6a | red-team | 06a-redteam.md | — | à faire | |
| 6b | auditeur-* ×6 puis juge | 06b-audit.md | gate-4 | à faire | |
| 6c | relecteur | 06-revue.md | — | à faire | |
| 7 | documentaliste | 07-livrable/ | — | à faire | |
| — | audit externe | rapport | — | à faire | |
| 8 | release | 08-deploiement.md | gate-5 puis gate-6 | à faire | |
| 9 | run-config | 09-exploitation.md | — | à faire | |

## Résultats des gates
Coller ici `.pipeline/gate-N.last.md` après chaque exécution.

## Journal des décisions
| Date | Décision | Motif | Impact |
| --- | --- | --- | --- |

## Retours en cours
| Date | Étape source → étape cible | Motif | Rejoué ensuite | Statut |
| --- | --- | --- | --- | --- |
