# Document outlines

Adapt depth to the reader; drop sections that do not apply and say so in one line rather than leaving them empty.

## DAT — Dossier d'Architecture Technique

```markdown
0. Fiche document (version, date, auteurs, relecteurs, classification, historique)
1. Synthèse (enjeu, solution retenue, points d'attention, décisions demandées)
2. Contexte et périmètre (besoin métier, acteurs, hors périmètre)
3. Exigences
   3.1 Fonctionnelles (FR-)
   3.2 Non fonctionnelles chiffrées (NFR-) : disponibilité, RPO/RTO, débit, latence, finalité, volumétrie
   3.3 Contraintes (réglementaires, sécurité, SI existant, fournisseurs imposés)
4. Architecture fonctionnelle (cas d'usage, flux métier)
5. Architecture applicative
   5.1 Vue de contexte
   5.2 Composants et responsabilités (on-chain / off-chain)
   5.3 Contrats intelligents (topologie, standards, évolutivité, rôles)
   5.4 Interfaces et intégration SI (API, événements, réconciliation)
6. Architecture technique
   6.1 Réseau blockchain (type, consensus, nœuds, permissionnement)
   6.2 Déploiement (zones/sites, environnements, réseau)
   6.3 Gestion des clés et custody (HSM/MPC, cérémonies, rotation)
7. Sécurité (modèle de menace, contrôles, séparation des rôles, journalisation)
8. Données (modèle, confidentialité, RGPD, conservation, registre de référence)
9. Exploitation (supervision, sauvegarde/restauration éprouvée, montées de version, gestion des incidents)
10. Continuité (PCA/PRA, scénarios de perte de zone, de site, de fournisseur)
11. Conformité (textes applicables, DORA, exigences du régulateur)
12. Décisions (index des ADR avec statut)
13. Risques (registre RISK-)
14. Questions ouvertes (O-, propriétaire, échéance)
Annexes : glossaire, versions des composants, références
```

## Note de cadrage

```markdown
1. Objet de la note et décision attendue
2. Contexte et enjeu (pourquoi maintenant)
3. Objectifs et indicateurs de réussite
4. Périmètre (inclus / exclu)
5. Approche proposée et jalons
6. Organisation (sponsor, MOA, MOE, parties prenantes)
7. Budget et ressources (ordre de grandeur, hypothèses)
8. Risques principaux et prérequis
9. Prochaines étapes
```

## Note de décision (comité)

```markdown
**Objet** : <décision demandée, en une phrase>
**Demandeur** : <…> | **Comité** : <…> | **Date** : <…>

1. Décision demandée (formulée pour être approuvée ou rejetée)
2. Contexte (5 lignes)
3. Options (tableau : option, coût, délai, risques, réversibilité)
4. Recommandation et justification
5. Conséquences si la décision est différée
6. Points de vigilance et conditions
```

## Synthèse exécutive (1 page)

```markdown
**En une phrase** : <conclusion>
**Situation** : <3 lignes>
**Constats clés** (3 à 5, chiffrés, avec impact)
**Recommandations** (actions, propriétaires, échéances)
**Décision ou soutien attendu**
```

## Spécification fonctionnelle

```markdown
1. Objet et périmètre
2. Acteurs et rôles (qui peut faire quoi ; conséquence d'une clé perdue ou compromise)
3. Parcours (user stories, critères d'acceptation Étant donné / Quand / Alors)
4. Règles métier et invariants (formulés pour être testés)
5. Flux de valeur (diagrammes de séquence)
6. Contraintes réglementaires (listes blanches, gel, transfert forcé, récupération, auditabilité)
7. Exigences non fonctionnelles
8. Hors périmètre
9. Questions ouvertes
```

## Livre blanc / litepaper

```markdown
1. Résumé
2. Problème et marché
3. Solution et proposition de valeur
4. Fonctionnement (actifs, acteurs, flux)
5. Architecture et sécurité (niveau lecteur non technique, détails en annexe)
6. Cadre réglementaire et gouvernance
7. Modèle économique
8. Feuille de route
9. Équipe et partenaires
10. Avertissements et facteurs de risque
```
