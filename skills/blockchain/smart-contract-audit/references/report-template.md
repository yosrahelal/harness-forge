# Modèle de rapport d'audit

```markdown
# Rapport d'audit de sécurité — <projet>

| | |
|---|---|
| Version auditée | <commit / hash de l'archive> |
| Date | <AAAA-MM-JJ> |
| Auditeur | <nom> |
| Statut | Brouillon / Final / Revu après corrections (<commit>) |

## 1. Synthèse

<3 à 5 phrases : ce qui a été audité, niveau de risque global, constats majeurs, recommandation (mise en production possible / sous conditions / non).>

| Sévérité | Nombre | Corrigés | Acceptés | Ouverts |
|---|---|---|---|---|
| Critique | | | | |
| Élevée | | | | |
| Moyenne | | | | |
| Faible | | | | |
| Information | | | | |

## 2. Périmètre

- Fichiers audités (avec nombre de lignes)
- Hors périmètre
- Hypothèses de confiance (rôles de confiance, composants hors chaîne supposés honnêtes)
- Documentation de référence (spec, ADR, livre blanc)

## 3. Méthode

- Revue manuelle ligne à ligne, checklist <EVM / Soroban / Anchor / jeton réglementé>
- Outils exécutés (versions) et résultats triés — ou : outils non exécutés, raison
- Tests de preuve (PoC) écrits
- Limites : ce qui n'a pas été couvert (économie du protocole, infrastructure, composants hors chaîne…)

## 4. Vue d'ensemble du système

Schéma des contrats, rôles et privilèges, flux de valeur. Risques de centralisation.

## 5. Constats

### [C-01] <Titre court et factuel>

| Sévérité | Impact | Probabilité | Statut |
|---|---|---|---|
| Critique | Élevé | Élevée | Ouvert |

**Localisation** : `src/Token.sol:L120-L135`

**Description** : <ce qui ne va pas>

**Scénario d'exploitation** :
1. Préconditions
2. Appels
3. Résultat

**Impact** : <fonds, conformité, disponibilité>

**Preuve** : <test Foundry ou séquence d'appels>

**Recommandation** : <correctif, code si court>

**Réponse de l'équipe** : <à compléter>

<Numérotation : C- critique, H- élevée, M- moyenne, L- faible, I- information.>

## 6. Risques de centralisation et d'exploitation

Rôles privilégiés, détenteurs, conséquences d'une compromission, mesures (multisig, timelock, HSM, procédures).

## 7. Annexes

A. Sorties des outils (triées)  
B. Invariants identifiés et leur statut (testé / non testé)  
C. Glossaire
```
