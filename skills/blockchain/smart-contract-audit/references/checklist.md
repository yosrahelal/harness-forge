# Audit checklist

Tick what applies; every "no" or "unclear" becomes a finding or an open question.

## EVM / Solidity

### Access control and initialisation
- Every state-changing function has the intended guard; no missing modifier on a sibling function (`mint` guarded, `mintBatch` not).
- Role admin hierarchy explicit (`DEFAULT_ADMIN_ROLE` not left with the deployer); admin transfer is two-step, ideally with delay (`AccessControlDefaultAdminRules`, `Ownable2Step`).
- Initializer callable once; implementation constructor calls `_disableInitializers()`; no front-runnable `initialize` between deploy and init.
- No `tx.origin` for authorisation.

### Upgradeability
- Pattern identified (Transparent, UUPS, Beacon, Diamond); `_authorizeUpgrade` guarded (UUPS).
- Storage layout stable across versions: no reordering, gaps or ERC-7201 namespaced storage; compare layouts (`forge inspect <C> storage-layout`).
- Upgrade path behind timelock or multisig; emergency upgrade procedure documented.
- No `selfdestruct` or `delegatecall` to user-controlled addresses.

### Reentrancy and external calls
- Checks-effects-interactions; `nonReentrant` where state is shared across functions.
- Read-only reentrancy (view functions read mid-update by other protocols).
- Callback hooks: ERC-777, ERC-721/1155 `onReceived`, ERC-4626 or custom hooks.
- Return values: `SafeERC20` for tokens that do not return bool; fee-on-transfer and rebasing tokens; tokens with blocklists (USDC, USDT) that can freeze a protocol address.
- Low-level `call` return value checked; gas forwarded considered.

### Arithmetic and accounting
- Rounding direction favours the protocol (deposit rounds down shares, withdraw rounds up shares).
- ERC-4626 first-depositor / inflation attack (virtual shares or seeded deposit).
- Precision and decimals across tokens with 6, 8, 18 decimals; NAV and price scaling.
- `unchecked` blocks justified; casts (`uint256` → `uint128`) bounded (`SafeCast`).

### Oracles and external data
- Staleness (`updatedAt`), round completeness, decimals, min/max bounds, L2 sequencer uptime feed.
- Spot price from an AMM used as oracle (manipulable within one transaction).
- Off-chain pushed values (NAV, FX rate, reserve attestation): who signs, replay protection, bounds per update, fallback when missing.

### Signatures
- EIP-712 domain includes `chainId` and `verifyingContract`; nonce per signer; deadline.
- No cross-chain or cross-contract replay; OpenZeppelin `ECDSA` (malleability, zero address); EIP-1271 for contract signers.
- `permit` paths respect the same compliance checks as `transferFrom`.

### Ordering, MEV and DoS
- Front-running of approvals, initialisation, price updates; slippage and deadline parameters.
- Unbounded loops over user-growable arrays; push payments to many recipients.
- Griefing by dust deposits, by blocking a recipient, by filling a queue.

### Governance and operations
- Timelock on parameter changes; bounds on parameters (fees, caps).
- Pause covers all value-moving paths and does not lock users out of exit forever without a decision.
- Events emitted for every privileged action, with enough fields to audit off-chain.

### Cross-chain and bridges
- Message authentication, replay across chains, finality assumptions, rate limits, supply consistency between chains.

## Regulated tokens (stablecoins, security tokens, tokenized funds)

- Allow-list / identity check enforced on **all** paths: transfer, transferFrom, permit, mint, burn, forced transfer, batch, bridge, wrapper.
- Freeze (full and partial amount) enforced on send **and** receive when required.
- Forced transfer and recovery restricted to a dedicated role, emit specific events, cannot target system addresses (treasury, escrow) unless intended.
- Role separation: issuer, compliance operator, pauser, upgrader, admin are distinct; no single key can mint and approve.
- Supply controls: mint caps, reserve or NAV consistency checks, burn on redemption only from the right account.
- Standard conformance claimed vs implemented (ERC-20, ERC-3643, CMTAT, ERC-4626, ERC-7540): interface IDs, events, revert behaviour.
- No personal data on-chain (identity is a reference to an off-chain registry or a claim, not a name).

## Stellar / Soroban

- `require_auth()` on the address whose assets or rights are used, not on a caller-supplied address that is never authorised; check `require_auth_for_args` scope.
- Authorisation of nested contract calls understood (the auth tree matches what the user signed).
- Storage type chosen per data (instance, persistent, temporary); TTL extension for persistent and instance data so nothing critical gets archived unexpectedly.
- `overflow-checks = true` in the release profile; checked arithmetic on `i128` amounts.
- Errors returned with `contracterror` rather than bare panics where callers must handle them.
- Upgrade via `update_current_contract_wasm` guarded by admin; admin rotation two-step.
- Stellar Asset Contract (SAC) use: issuer flags (`AUTH_REQUIRED`, `AUTH_REVOCABLE`, `AUTH_CLAWBACK_ENABLED`) consistent with the compliance design; SEP-41 interface conformance for custom tokens.

## Solana / Anchor

- Signer checks on every authority account; owner checks on every account read (`Account<'info, T>` or explicit `owner ==`).
- Account relationships validated (`has_one`, `constraint`), PDAs derived with canonical bump stored and re-checked; no seed collisions between account types.
- CPI targets verified (program id), no arbitrary program invocation.
- Checked arithmetic; no `unwrap` on user-controlled values.
- Closing accounts: lamports drained and data zeroed, no revival in the same transaction; reinitialisation prevented.
- `remaining_accounts` validated like named accounts.
- Token-2022 extensions handled: transfer hook, permanent delegate, default account state (frozen), transfer fee, confidential transfer; mint and token program IDs checked (Token vs Token-2022).

## Sources to cross-check

OWASP Smart Contract Top 10, Solodit (public audit findings), the OpenZeppelin and standard specifications, platform security docs (Stellar, Solana). The SWC registry is no longer maintained: use it for vocabulary only.
