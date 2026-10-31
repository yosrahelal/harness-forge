---
name: blockchain-project-analysis
description: Analyses a blockchain project (repo, zip, specs) into an evidence-based report on contracts, roles, trust model, value flows, off-chain parts and risks. Use to assess or onboard onto one.
metadata:
  origin: forge
---

# Blockchain project analysis

Turn a repository, an archive or a set of specs into a report a decision-maker can act on. This is a first-pass assessment, not an audit: for a security audit, hand over to the `smart-contract-audit` skill.

## Inputs

- Uploaded `.zip` / `.tar.gz` → extract into a scratch directory (`/tmp/work/<name>`) and work there.
- Files synced from GitHub or attached to the project → read them where they are.
- Specs or documents only → skip steps 1–2 and 6, analyse the design as written, and say so in the report.

## Step 0 — Frame the question

Find out what the analysis is for: due diligence, takeover of a project, pre-audit, go/no-go, architecture review, onboarding. The purpose decides depth and tone. If it is unclear, ask **one** question; otherwise state the assumption at the top of the report.

## Step 1 — Inventory

```bash
cd /tmp/work/<name>
find . -maxdepth 3 -not -path '*/node_modules*' -not -path '*/lib/*' -not -path '*/.git/*' \
  -not -path '*/out/*' -not -path '*/cache/*' -not -path '*/artifacts/*' -not -path '*/target/*' | sort
ls foundry.toml hardhat.config.* Anchor.toml Cargo.toml Move.toml daml.yaml package.json pom.xml 2>/dev/null
grep -rh "pragma solidity" --include=*.sol src contracts 2>/dev/null | sort | uniq -c
```

Record:
- **Toolchain**: Foundry / Hardhat (EVM), Anchor (Solana), `soroban-sdk` in `Cargo.toml` (Stellar), Move, Fabric chaincode, Daml; node config (Besu `genesis.json`, `config.toml`), Helm/Terraform.
- **Dependencies with exact versions**: OpenZeppelin (`lib/openzeppelin-contracts/package.json`, `remappings.txt`, `package.json`), solc pragma and compiler settings (`optimizer`, `via_ir`, `evm_version`), SDK versions. Flag every pre-1.0 or unpinned dependency.
- **Size**: lines per contract (`wc -l`, or `cloc` if installed), test files count.

## Step 2 — Contract map

For each deployable contract, one row:

| Contract | Purpose | Standard / base | Upgradeable (pattern) | Privileged functions (role) | External calls | Key events |
|---|---|---|---|---|---|---|

Then a Mermaid diagram (inheritance or calls). Check upgrade details: proxy type (Transparent, UUPS, Beacon, Diamond), `initializer` and `_disableInitializers()` in the implementation constructor, storage layout policy (gaps or ERC-7201 namespaces), who can upgrade.

## Step 3 — Actors and privileges

| Role | Functions it can call | Intended holder (EOA, multisig, timelock, custody, backend) | If compromised or lost |
|---|---|---|---|

Include deployer and bootstrap roles: are they renounced or transferred after deployment? Is admin transfer two-step? Is there a pause / freeze / forced-transfer power and who holds it?

## Step 4 — Value and data flows

- Issuance, transfer, redemption, fees, distribution: which balances move, under which checks.
- One `sequenceDiagram` per critical flow (for example subscription → NAV → mint, or fiat in → mint → redemption → burn).
- On-chain vs off-chain split: oracle or NAV feed, indexer, backend signer, custody (HSM/MPC), identity registry. For each off-chain component, state the trust it adds.

## Step 5 — Off-chain, infrastructure, delivery

Backend and signing path, key management, node topology and consensus, permissioning, CI, deployment scripts (read them, never run them), environment files. If you find private keys or secrets, report the file path only and never reproduce the value.

## Step 6 — Quality signals

Unit, fuzz and invariant tests present; scripts run in CI; static analysis config (Slither, Aderyn); NatSpec; `TODO`/`FIXME`; specs, ADRs, risk register present and consistent with the code. If the sandbox allows it, run the test suite (`forge test`, `cargo test`) and report the actual result; otherwise say it was not run.

## Step 7 — Findings and risks (first pass)

| ID | Finding | Severity | Evidence (file:line) | Recommendation |
|---|---|---|---|---|

Severity: Critical / High / Medium / Low / Info (definitions in `smart-contract-audit`). Cover design and operating risks too: key concentration, upgrade without timelock, single-vendor dependency, pre-1.0 components, missing recovery procedure, personal data on-chain.

## Step 8 — Report

```markdown
# Analyse — <projet> (<commit ou date>)
## Synthèse (5 lignes max : ce que c'est, état, 3 risques majeurs, recommandation)
## Périmètre et méthode (sources lues, ce qui n'a pas été couvert)
## Architecture (composants, schéma)
## Contrats
## Rôles et privilèges
## Flux de valeur
## Hors chaîne et infrastructure
## Qualité et maturité
## Constats et risques
## Questions ouvertes
## Annexes (inventaire, versions)
```

Deliver a short summary in chat, then offer the full report as a Word document (`blockchain-docs` skill), a deck (`blockchain-deck` skill), or a findings spreadsheet (xlsx skill).

## Rules

- **Evidence or label.** Every claim cites a file path (and line when it matters) or is marked *inféré* or *non vérifié*.
- Separate **fact**, **inference** and **recommendation**.
- Never run deployment scripts, never connect to a network with a key, never ask for private keys.
- Domain context (stablecoins, tokenized funds, RWA standards, permissioned chains, EU regulation): load the `tokenization-domain` skill.
- Write in the language of the request.
