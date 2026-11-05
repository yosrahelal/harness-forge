# Conception — <projet>

## Stack et versions
| Outil / bibliothèque | Version | Rôle | Source |
| --- | --- | --- | --- |
## Contrats on-chain
### <NomContrat>
Responsabilité. Interface : `contracts/interfaces/I<NomContrat>.sol` (recopiée ici). Rôles et accès.
## Modèle de données
Storage layout, structures.
## Invariants
| Id | Invariant | Test (spec exécutable) |
| --- | --- | --- |
| INV-1 | sum(balances) == totalSupply | `test/invariants/…::invariant_INV_1_supply` |
## Fonctions critiques et propriétés symboliques
| Contrat | Fonction | Propriété Halmos | Fichier |
| --- | --- | --- | --- |
## Séquences par cas d'usage (Mermaid)
## Machine à états (Mermaid, si applicable)
## Upgrade et gouvernance
Proxy (UUPS / transparent / immuable), rôles, timelock (délai), Safe (seuil).
## Événements à surveiller en production
| Rôle / contrat | Événement | Seuil | Sévérité | Destinataire |
| --- | --- | --- | --- | --- |
## Composants off-chain
## Plan de tests
Chaque Id `TP-n` est repris dans le nom du test (`test_TP_n_…`) : la gate 3 le vérifie.
| Id | Cible | Cas | Type (unitaire / fuzz / invariant / intégration / fork) | Attendu |
| --- | --- | --- | --- | --- |
| TP-1 | | | | |
## Écarts et questions
