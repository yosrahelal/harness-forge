---
name: tokenization-domain
description: Domain reference for tokenization in regulated finance: stablecoins and deposit tokens, tokenized funds and NAV, RWA standards, chains, custody, EU rules. Use to analyse, design or explain them.
metadata:
  origin: forge
---

# Tokenization domain

Background knowledge for analysis, architecture, documents and decks about tokenized assets in a banking or asset-management context.

## How to use

1. Identify the asset model first: payment token (stablecoin / EMT, deposit token), fund units (MMF, UCITS, AIF), securities (bonds, equity), or other RWA. Read the matching section of [references/use-cases.md](references/use-cases.md).
2. Pick standards and chains with [references/standards-and-chains.md](references/standards-and-chains.md).
3. Check the regulatory frame with [references/regulation-eu.md](references/regulation-eu.md).

## Rules

- **Regulation and product status change.** The references give the frame and the questions to ask; before stating a date, threshold, deprecation or legal requirement in a deliverable, verify it with web search on primary sources (EUR-Lex, ESMA, EBA, ECB, AMF, ACPR, BIS, vendor documentation) and cite source and date.
- Mark legal points as analysis, not legal advice; name the questions for compliance or legal teams.
- Distinguish the **register of record** (the chain, or the transfer agent's books with the chain as a mirror) in every design: it decides reconciliation, recovery and legal finality.
- Use the vocabulary of the audience: *VL* (valeur liquidative) for NAV in French, *émetteur*, *dépositaire*, *agent de transfert*, *teneur de registre*, *DvP*.

## Deeper references

- [references/use-cases.md](references/use-cases.md) — stablecoins, deposit tokens, tokenized funds and NAV lifecycle, bonds, settlement.
- [references/standards-and-chains.md](references/standards-and-chains.md) — token standards, chain-specific features, permissioned platforms, custody.
- [references/regulation-eu.md](references/regulation-eu.md) — MiCA, DLT Pilot, TFR, DORA, MMF Regulation, GDPR, prudential treatment; what to verify.
