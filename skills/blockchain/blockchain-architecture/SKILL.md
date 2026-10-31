---
name: blockchain-architecture
description: Designs or reviews blockchain system architecture (chain, consensus, contracts, upgrades, roles, custody, privacy, IS integration) and records each decision as an ADR. Use for design or review.
metadata:
  origin: forge (draws on agency-agents software-architect and solidity-smart-contract-engineer)
---

# Blockchain architecture

Decide the shape of the system and justify each decision with a trade-off. No implementation code; interface sketches are allowed.

## Principles

1. **Trade-offs over best practices**: name what each option gives up.
2. **Reversibility**: prefer decisions that are cheap to change; flag the ones that are not (privacy-group composition, chain choice, token standard once issued).
3. **No architecture astronautics**: every component and abstraction must earn its complexity.
4. **Audited bases first**: OpenZeppelin or the standard's reference implementation unless an ADR says why not.
5. **Quantify**: every non-functional requirement has a number (TPS, finality, RPO/RTO, availability, latency).
6. **Status is explicit**: *décidé*, *proposé*, *à confirmer*. Never present a proposal as a decision.
7. **Volatile facts are checked**: product maturity, versions, deprecations and regulation change; verify with web search, cite the source and its date.

## Process

### 1. Frame
- Business drivers and the decision this architecture supports.
- Constraints: regulation (see `tokenization-domain` skill), confidentiality, operating model (who runs nodes, who holds keys), existing IS, cloud or on-prem, vendors imposed.
- Non-functional requirements with figures. Missing figures become open questions (`O-n`).

### 2. Decide
Walk the decision catalog in [references/decisions.md](references/decisions.md). For each relevant decision: options, criteria, recommendation, what is given up, reversibility. Skip decisions that do not apply and say why in one line.

### 3. Draw the views (Mermaid)
- **Context**: actors, the system, external systems (custody, core banking, KYC, market data, regulator reporting).
- **Containers**: nodes, contracts, backend services, indexer, signer/HSM, databases, front-ends.
- **On-chain**: contracts and their calls, roles.
- **Critical flows**: one `sequenceDiagram` each (issuance, transfer with compliance check, redemption, key rotation, upgrade).
- **Deployment**: zones or sites, validators and their distribution, HSM, network boundaries.

### 4. Record decisions
One ADR per significant decision, using the template in [references/adr-and-views.md](references/adr-and-views.md). Number them `ADR-NNN-slug`. Link each to the requirement IDs it serves.

### 5. Risks
Register every pre-1.0 dependency, single point of failure, irreversible choice, vendor lock-in and regulatory uncertainty as `RISK-NNN` with severity, origin and treatment.

### 6. Hand-off
End with: list of ADRs, the two or three decisions that most need human validation, open questions, and next step (spec, POC, audit). Offer a DAT (Dossier d'Architecture Technique) via the `blockchain-docs` skill and an architecture review deck via `blockchain-deck`.

## Review mode

When asked to review an existing architecture:
1. Rebuild the views from the documents (or code, via `blockchain-project-analysis`).
2. Check each decision in the catalog: made? justified? consistent with the NFRs? still valid with today's product versions?
3. Report as: strengths · gaps (missing decision, unjustified choice, unquantified NFR) · risks · recommendations ranked by impact and effort.

## Deeper references

- [references/decisions.md](references/decisions.md) — decision catalog with options and criteria.
- [references/adr-and-views.md](references/adr-and-views.md) — ADR template (French), risk register format, view checklist.
