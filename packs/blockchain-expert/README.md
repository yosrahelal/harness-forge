# Pack « Expert blockchain » pour claude.ai

Ce pack sert sur Claude web, desktop et mobile, sans Claude Code. Il couvre l'analyse de projets, l'audit de smart contracts, l'architecture (ADR, DAT), les documents Word et Excel et les présentations PowerPoint, dans un contexte bancaire et réglementé.

## Contenu

| Élément | Où | Rôle |
|---|---|---|
| 9 skills `.zip` | `skills/*.zip` | À ajouter une fois, ils servent dans toutes les conversations |
| 3 Projets | `projects/<nom>/` | Instructions à coller et fichiers de connaissance à ajouter |

Skills : `blockchain-project-analysis`, `smart-contract-audit`, `blockchain-architecture`, `tokenization-domain`, `blockchain-docs`, `blockchain-deck`, `council`, `grilling`, `market-research`. Le détail de chaque skill est dans `CONTENTS.md`.

Les fichiers Word, PowerPoint, Excel et PDF sont produits par les skills intégrés de Claude (docx, pptx, xlsx, pdf). Les skills du pack apportent la méthode, la structure et le style.

## Installation

1. **Activer** l'option *Exécution de code et création de fichiers* dans **Paramètres → Capacités** (*Settings → Capabilities*). Elle est requise pour les skills et pour produire des fichiers. Il faut un forfait Pro, Max, Team ou Enterprise ; sur Team et Enterprise, un administrateur doit autoriser les skills.
2. **Ajouter les skills** : **Paramètres → Capacités → Skills → Importer** (*Upload skill*), puis choisir chaque fichier de `skills/*.zip`, un par un. Vérifier qu'ils sont activés.
3. **Créer les Projets** : **Projets → Nouveau projet**, un par dossier de `projects/` :
   - nom : celui indiqué dans `projects/<nom>/instructions.md` ;
   - **Instructions** : coller le contenu de `instructions.md` ;
   - **Connaissances** : ajouter les fichiers de `knowledge/`, puis vos propres documents (ADR, registre des risques, specs, modèles `.pptx` et `.docx` de l'entreprise). Pour un dépôt de code, utiliser l'intégration GitHub ou ajouter un zip dans la conversation.

## Exemples de demandes

- « Analyse ce dépôt (zip joint) : contrats, rôles, flux de valeur et risques principaux. »
- « Audite `src/EURXT.sol` avec la checklist jeton réglementé, rapport en Word. »
- « Propose l'architecture d'un fonds monétaire tokenisé sur Besu + Paladin, avec les ADR. »
- « Fais un DAT à partir de la spec et des ADR du projet. »
- « Prépare 8 slides pour le comité d'architecture : décision sur le consensus et le modèle de confidentialité. »
- « Challenge-moi sur ce plan de migration de GoQuorum vers Besu » (le skill `grilling` prend le relais).

## Mise à jour

Après une modification des skills dans harness-forge :

```bash
node scripts/export-claude-web.js blockchain-expert
```

Supprimer ensuite l'ancienne version du skill dans claude.ai et importer le nouveau zip. Pour les Projets, recoller les instructions.

## Limites sur claude.ai

- Il n'y a ni sous-agents, ni commandes `/forge:*`, ni hooks. Les skills fonctionnent sans eux.
- Le bac à sable n'a pas toujours accès au réseau : Slither, `solc` ou `forge` peuvent ne pas s'installer. Dans ce cas, le skill d'audit le signale et passe en revue manuelle.
- Les diagrammes Mermaid s'affichent dans la conversation. Dans un fichier Word ou PowerPoint, ils sont redessinés (formes natives ou image) quand le bac à sable le permet.
