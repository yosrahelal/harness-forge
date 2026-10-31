---
name: blockchain-deck
description: Builds blockchain presentations (committee, architecture review, audit restitution, training, pre-sales) as message-first storylines, then the .pptx via the pptx skill. Use for slides or decks.
metadata:
  origin: forge
---

# Blockchain deck

Build the story first, then the slides, then the file.

## Step 1 — Brief

Find out, or assume and state: **audience** (committee, technical team, client, executives), **goal** (decision, information, training, sale), **duration** (about one slide per two minutes), **language**, corporate template (`.pptx` / `.potx`) if any, sources to use (project files, specs, ADRs, audit report).

## Step 2 — Storyline

Choose an outline in [references/outlines.md](references/outlines.md). Write the slide titles as **full-sentence messages**: reading only the titles must tell the whole story.

```text
1. La tokenisation du fonds réduit le délai de règlement de J+2 à J+0
2. Trois options d'architecture ont été étudiées
3. Besu privé avec Paladin couvre le besoin de confidentialité
4. Deux risques restent à arbitrer avant la mise en production
5. Nous demandons la validation du lancement du pilote au T1
```

For decks over eight slides, show the storyline to the user and wait for validation before building.

## Step 3 — Slides

- One message per slide; the title states it, the body proves it.
- At most five or six bullets of one line; prefer a diagram, a table or a figure.
- Architecture slides: one diagram drawn with native shapes and connectors (editable), a legend if colours carry meaning.
- Figures: real data only, source in a footnote. No invented metrics, logos or client names.
- Comparisons: a table with the criteria in rows and the options in columns, recommendation highlighted.
- Speaker notes: what to say, the figures to remember, likely questions.
- Last slides: decision or next steps, then annexes (details, glossary, sources).

## Step 4 — Build the file

Use the **pptx** skill to generate the `.pptx` (with the user's template when provided). Render the slides to images and check: no text overflow, consistent fonts and colours, readable diagrams, titles on one or two lines. Fix and re-render before delivering.

## Rules

- Content comes from the user's material and verified sources; mark assumptions on the slide ("Hypothèse").
- Regulatory or product statements: verify them (see the `tokenization-domain` skill) and cite them.
- Never put secrets, keys, personal data or confidential client names on slides unless the user asked for it.

## Deeper references

- [references/outlines.md](references/outlines.md) — outlines for committee decision, architecture review, audit restitution, training, pre-sales, technology watch.
