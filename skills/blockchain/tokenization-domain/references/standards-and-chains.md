# Standards, chains and platforms

Check the status of drafts (EIPs, SEPs) and of products before recommending them.

## EVM token standards

| Standard | Use | Notes |
|---|---|---|
| ERC-20 | Fungible token | Add controls yourself or via a framework; `permit` (ERC-2612) uses EIP-712 signatures |
| ERC-3643 (T-REX) | Permissioned securities | Identity registry (ONCHAINID claims), compliance modules, freeze, forced transfer, recovery |
| CMTAT | Capital-markets token framework (Swiss CMTA) | Modular: pause, freeze, enforcement, snapshots, debt modules; Solidity reference implementation |
| ERC-1400 family | Security tokens with partitions | Older, less used in new designs |
| ERC-4626 | Tokenized vault (shares over an underlying) | Watch rounding and first-depositor inflation |
| ERC-7540 | Asynchronous ERC-4626 (request → claim) | Fits forward-priced fund subscriptions and redemptions |
| ERC-7943 (uRWA) | Minimal interface for RWA controls | Draft: check status |
| ERC-1155 / ERC-721 | Multi-token / NFTs | Rare for fungible financial assets |
| ERC-1967 / ERC-7201 | Proxy storage slots / namespaced storage | Upgrade safety |
| EIP-712 / EIP-1271 | Typed structured signatures / contract signatures | Approval workflows, permits |

## Chain-specific features

- **Stellar**: classic assets with issuer flags (`AUTH_REQUIRED`, `AUTH_REVOCABLE`, `AUTH_CLAWBACK_ENABLED`), trustlines, Stellar Asset Contract (SAC) to use classic assets from Soroban, SEP-41 token interface for Soroban tokens, SEP-8 regulated assets (approval server), anchors (SEP-6, SEP-24, SEP-31). Ed25519 keys.
- **Solana**: SPL Token and Token-2022 extensions (transfer hook, permanent delegate, default account state, transfer fees, confidential transfers, metadata); Anchor framework; Ed25519 keys.
- **Public EVM L2s**: different finality and sequencer trust; check bridge model and forced-inclusion guarantees.

## Permissioned platforms

- **Hyperledger Besu** (EVM, LF Decentralized Trust): QBFT consensus for new networks, node and account permissioning, enterprise plugins. Privacy: Paladin (Pente privacy groups, Noto, Zeto) is the current route; Tessera-based private transactions are deprecated.
- **Hyperledger Fabric**: channels, private data collections, chaincode in Go/Java/Node, endorsement policies.
- **Canton / Daml**: sub-transaction privacy, Daml smart contracts, synchronisation domains; used by several market infrastructures.
- **Corda**: point-to-point states, notaries; check the vendor's current product line.
- **GoQuorum**: check support status before any new design; vendors have steered users towards Besu.

## Custody and signing

- HSM (on-prem, cloud HSM): FIPS 140-2/140-3 level, curve support (secp256k1, ed25519, secp256r1), key ceremony, backup.
- MPC and custody platforms (for example Taurus-PROTECT, Fireblocks, Ripple Custody): policy engine, approval quorums, supported chains and token standards, API and SDK languages, simulator or sandbox availability.
- Smart-contract accounts and multisigs (Safe) for treasury and admin roles; timelocks for governance.

## Tooling

- EVM: Foundry (tests, fuzz, invariants), Hardhat, OpenZeppelin Contracts and Upgrades, Slither, Aderyn, Echidna / Medusa, Halmos, Certora.
- Stellar: Stellar CLI, `soroban-sdk`, Stellar Lab. Solana: Anchor, `solana-test-validator`.
