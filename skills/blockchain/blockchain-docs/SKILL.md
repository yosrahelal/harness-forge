---
name: blockchain-docs
description: Writes blockchain deliverables (DAT, ADR, risk register, spec, committee note, executive summary, white paper) in a banking-grade style, as Markdown or Word via the docx skill. Use for such documents.
metadata:
  origin: forge (draws on agency-agents technical-writer, document-generator, executive-summary-generator)
---

# Blockchain documents

Produce documents a bank's architecture committee, risk function or client can read, challenge and sign.

## Step 1 — Type, reader, format

| Document | Reader | Usual format |
|---|---|---|
| DAT (Dossier d'Architecture Technique) | Architecture committee, security, operations | Word |
| Note de cadrage | Sponsor, steering committee | Word, 3–6 pages |
| Note de décision (comité) | Decision-makers | Word or one page in chat, 1–2 pages |
| Synthèse exécutive | Executives | 1 page |
| ADR | Architects, auditors | Markdown (template in `blockchain-architecture`) |
| Registre des risques | Risk, project management | Markdown table or xlsx |
| Spécification fonctionnelle | Product, developers, testers | Markdown or Word |
| Rapport d'audit | Client, developers | Word (template in `smart-contract-audit`) |
| Livre blanc / litepaper | Clients, market | Word or PDF |

Pick the outline in [references/templates.md](references/templates.md). If the reader or the purpose is unclear, ask one question; otherwise state the assumption.

## Step 2 — Gather facts

Use what the user supplied (project files, specs, ADRs, meeting notes) first. Missing facts become explicit placeholders `[À COMPLÉTER : …]` or open questions `O-n`, never invented content. Verify volatile facts (product versions, regulation) with web search and cite them.

## Step 3 — Write

- **Bottom line first**: the first paragraph states the conclusion, the recommendation or the decision requested.
- Informative headings ("Le consensus QBFT garantit une finalité immédiate"), not labels ("Consensus"), in notes and syntheses.
- Traceable IDs: `FR-` functional requirement, `NFR-` non-functional, `RISK-`, `ADR-`, `O-` open question, `D-` decision. Reuse the project's IDs when they exist.
- Status on every decision: *décidé*, *proposé*, *à confirmer*.
- Normative words in requirements: DOIT / NE DOIT PAS / DEVRAIT / PEUT (or MUST / SHOULD / MAY in English).
- Tables for comparisons and options; prose for reasoning. One idea per paragraph.
- Diagrams: Mermaid in Markdown; for Word, render to PNG if the sandbox can (Graphviz or matplotlib), otherwise draw a clean table or keep the Mermaid source in an appendix and say so.
- Language: the language of the request; French documents use French typography (espace avant `: ; ? !`, guillemets « »).

## Step 4 — Produce the file

- Short or iterative work: Markdown in chat.
- To send or archive: build a `.docx` with the **docx** skill (title page, table of contents for documents over 5 pages, numbered headings, header with document name and version, footer with page numbers and classification, for example "Interne" or "Confidentiel").
- Registers and matrices: an `.xlsx` with the **xlsx** skill (one row per item, filters, frozen header).
- If the user supplies a corporate template (`.dotx` or `.docx`), use it.

## Step 5 — Review before delivering

- [ ] The first paragraph answers "so what?".
- [ ] Every number, date and regulatory statement has a source or is marked as an assumption.
- [ ] No placeholder left unmarked; open questions listed with an owner.
- [ ] Decisions and proposals are distinguishable.
- [ ] No secret, private key, personal data or client name that the user did not ask to include.
- [ ] Version, date, author, classification filled in.

## Deeper references

- [references/templates.md](references/templates.md) — outlines: DAT, note de cadrage, note de décision, synthèse exécutive, spec fonctionnelle, livre blanc.
