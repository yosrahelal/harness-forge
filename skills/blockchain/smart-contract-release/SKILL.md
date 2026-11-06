---
name: smart-contract-release
description: Prepares smart-contract deployment, monitoring and upgrades without ever holding a key — Foundry deploy script dry-run on a local fork, manifest, unsigned Safe batch, role handover to Safe/timelock, post-deploy verification, OpenZeppelin Monitor rules and runbooks, incident triage, storage-layout-checked timelock upgrades. Use when deploying, operating or upgrading contracts.
metadata:
  origin: forge (pipeline multi-agents blockchain v2, Y. Helal 2026-11-05)
---

# Smart contract release, run and upgrade

Nothing in this skill signs or broadcasts. Agents produce unsigned transactions; humans sign through Safe, HSM or a relayer. Forbidden: `forge script --broadcast`, `cast send`, `forge create`, `--private-key`, mnemonics, keystores, `.env`, remote RPCs.

Defender has been shut down since 1 July 2026 and its Deploy module has no open-source replacement: this procedure and a Foundry script replace it.

## Preconditions

Review verdict ready, **external audit** with no open Critical/High, storage layout compatible (upgrades), dry-run and simulation green on the current code. Missing one → stop and say which.

## 1. Deploy (prepare)

- `script/Deploy.s.sol`: contract order, constructor args, CREATE2 salt if deterministic, proxy deployed and initialised in the **same** transaction.
- Dry-run: `forge script script/Deploy.s.sol --fork-url http://127.0.0.1:8545` (fork started by a human). Simulation in Tenderly (Virtual Environment) when available: record its id.
- Manifest `deployments/<network>.json`: addresses, args, salt, runtime bytecode hash, solc version and optimizer runs, commit, deployer, expected roles (contract, role, holder).
- Unsigned **Safe Transaction Builder** batch: deployment, role grants to Safe and timelock, renounce of every deployer role. Note signers and threshold. Do not use a community Safe MCP that executes with a private key.

## 2. Verify (after a human broadcasts)

- Sources verified on the explorer (Blockscout official MCP or API; Etherscan only through its API).
- On-chain runtime bytecode hash = manifest.
- Every admin role held by a contract (Safe, timelock), none by an EOA, none by the deployer (`hasRole(role, deployer) == false`).
- Snapshot the storage layout of each upgradeable contract (`forge inspect <C> storageLayout --json > deployments/<network>.storage/<C>.json`): it is the baseline for upgrades.

## 3. Monitor (OpenZeppelin Monitor, self-hosted, AGPL v3 — legal review before use)

Rules derived from the design's events, each with severity, recipient and runbook (who is alerted, what to check, which unsigned action is ready):
- `RoleGranted`, `RoleRevoked`, `OwnershipTransferred`: Critical.
- `Upgraded`, `AdminChanged`, `BeaconUpgraded`: Critical unless sent by the expected timelock.
- `Paused`, `Unpaused`, ERC-3643 freeze/unfreeze, allow-list changes: High.
- Mint, burn or transfer above the design threshold: High.
- Successful call of a protected function by an unexpected address: Critical.
No key or RPC URL in monitor files: environment variables set by a human.

## 4. Triage an alert

Fetch the transaction and traces, **replay** it on a local fork or in Tenderly, classify (legitimate / suspicious / attack in progress), estimate funds at risk. Suspicious or attack: prepare the unsigned pause transaction and the runbook, alert on-call. Never conclude "legitimate" without a replay; never contact third parties.

## 5. Upgrade

- Scope: contracts, functions, storage touched; re-run design → implementation → tests → red team and audit on the diff.
- Compare deployed and new storage layouts (same slot and offset ⇒ same label and type; `__gap` may shrink); `npx @openzeppelin/upgrades-core validate` with a pinned version. Moved, retyped or removed variable = block.
- Unsigned timelock proposal (`upgradeToAndCall`, encoded data, delay), rehearsed on a fork: state before, upgrade through the timelock, state after, invariants green.
- Never upgrade outside the timelock or modify a deployed design without a new version.

Soroban: `update_current_contract_wasm` behind the governance account; `DataKey` schema compatible across versions; deploy with `stellar contract deploy --network local` for rehearsal only; production transactions signed by humans.
