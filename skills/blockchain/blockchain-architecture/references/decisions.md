# Decision catalog

For each decision: the question, typical options, and the criteria that usually settle it. Product facts change: confirm maturity and support status before recommending.

## 1. Ledger type
- **Options**: public L1 (Ethereum), public L2 (rollups), public non-EVM (Stellar, Solana), permissioned EVM (Hyperledger Besu), other permissioned DLT (Hyperledger Fabric, Canton/Daml, Corda), a shared market infrastructure operated by a third party.
- **Criteria**: who must read and write; confidentiality needs; interoperability with assets and liquidity already on public chains; settlement asset available (stablecoin, deposit token, wholesale CBDC trials); regulator and DLT Pilot / MiCA constraints; operating cost and skills; exit strategy.

## 2. Consensus and finality (permissioned)
- **Besu**: QBFT is the recommended BFT protocol for new networks; IBFT 2.0 is kept for existing networks; Clique is deprecated. BFT tolerates f faulty validators out of 3f+1.
- **Criteria**: immediate finality, validator count and distribution across zones or sites (losing a zone must not lose quorum), block time, validator onboarding and removal by vote.

## 3. Confidentiality model
- **Options**: separate networks per perimeter; privacy layer on an EVM chain (Paladin with Pente privacy groups, Noto notarised tokens, Zeto zero-knowledge tokens; Besu's older Tessera-based privacy is deprecated); channels or private data (Fabric); sub-transaction privacy (Canton); hashes and commitments on a public chain with data off-chain.
- **Criteria**: who must not see what (amounts, counterparties, positions); whether a notary or operator may see amounts; recoverability of private state (often not rebuildable from the chain: backup becomes critical); maturity of the component.

## 4. Token standard and asset model
- **Options**: ERC-20 plus custom controls; ERC-3643 (T-REX, identity registry and compliance modules); CMTAT (capital-markets token framework); ERC-4626 / ERC-7540 for vaults and asynchronous subscriptions and redemptions; ERC-1400 family (older); ERC-7943 uRWA (minimal RWA interface, check status); Stellar classic asset with issuer flags or Soroban SEP-41 token; Solana Token-2022 with extensions.
- **Criteria**: required controls (allow-list, freeze, partial freeze, forced transfer, recovery, pause), ecosystem and custody support, audit history, cross-chain consistency of capabilities.

## 5. Upgradeability
- **Options**: immutable plus migration; Transparent proxy; UUPS; Beacon (many instances); Diamond (avoid unless justified).
- **Policy to record**: who proposes, timelock delay, storage-layout baseline kept per network (`forge inspect … storageLayout`), red team and audit on every upgrade diff, rehearsal on a fork before the proposal.
- **Criteria**: regulatory need to fix defects, holder trust, governance of upgrades (multisig plus timelock), storage-layout policy (ERC-7201), audit cost of each upgrade.

## 6. Access control and governance
- Role catalogue (issuer, minter, burner, compliance operator, pauser, upgrader, admin), separation of duties, no single key with mint and approve rights.
- Admin transfer two-step with delay; timelock on parameter changes; emergency pause scope; break-glass procedure.
- **End state of every admin role**: a Safe (threshold and signers named) or a timelock (delay named), never an EOA and never the deployer; the deployment batch renounces deployer roles and is verified after broadcast.
- Off-chain approval workflow when required: request → approvals (N of M per operation type and amount threshold, no self-approval) → execution; canonical payload (deterministic encoding, hash, nonce, network id, expiry); append-only audit log.

## 7. Custody, keys and signing
- **Options**: HSM (on-prem or cloud HSM), MPC custody platform (for example Taurus-PROTECT, Fireblocks, Ripple Custody), multisig smart accounts, combinations.
- **Criteria**: key ceremonies and backups, FIPS level required, curves supported per chain (secp256k1, ed25519, secp256r1), policy engine location (platform vs your own), signing latency, vendor SDK languages, segregation of client assets.
- Validator and node keys are a separate decision from asset keys (block sealing with HSM may depend on plugins: check support).

## 8. Off-chain data and oracles
- NAV, FX, reserve attestations, identity claims: who produces, who signs, update frequency, bounds per update, staleness handling, dispute and correction process.
- Options: push by an authorised updater, oracle network, signed data verified on-chain.

## 9. Integration with the IS
- Event indexing (own indexer, The Graph, vendor) and reconciliation with books of record (core banking, fund accounting, transfer agent).
- Backend adapters: one `ChainAdapter` interface per capability (issue, mint, burn, freeze, forceTransfer, setWhitelist, pause, readBalances, listEvents) with a capability table per chain (native / simulated / absent).
- Identity and KYC registry synchronisation to on-chain allow-lists; idempotency keys; retries; exactly-once semantics at the business level.

## 10. Interoperability
- Same asset on several chains: canonical chain and supply accounting, bridge or burn-and-mint with an issuer-controlled messaging layer (for example Chainlink CCIP, LayerZero, Wormhole: check each one's trust model), or separate issuances reconciled off-chain.
- Settlement interoperability: DvP with a cash leg on-chain (stablecoin, deposit token) or off-chain (payment versus delivery via conditional transfers).

## 11. Operations and resilience
- Availability target and topology (zones, sites, regions), RPO/RTO, backup and restore of node and private state (tested, not just written), monitoring and alerting (block production, peer count, validator participation, contract events), upgrade procedures, incident runbooks with unsigned pause transactions ready.
- Contract monitoring and relaying: OpenZeppelin Defender has been shut down since 1 July 2026; its successors OpenZeppelin Monitor and Relayer are self-hosted and AGPL v3 (legal review before IS use); KeeperHub is a hosted commercial alternative. Deployment tooling: Foundry scripts plus unsigned Safe batches (Defender Deploy has no open-source replacement).
- Agent and tooling hygiene in a bank: hosted MCP servers (OpenZeppelin, Tenderly, Blockscout) receive what is sent to them — local versions for confidential code; pinned versions; no key or write RPC in any tool config.
- Upgrade procedures for clients and contracts, incident response per compromised key.

## 12. Data protection and compliance
- No personal data on-chain; hashes of personal data are still personal data under GDPR when re-identifiable. Store references, keep data erasable off-chain.
- Regulatory reporting, audit trail, retention, travel rule data flows, DORA for ICT risk in EU financial entities.
