## Forge additions — Soroban contracts

When the crate depends on `soroban-sdk`, also check (details: `smart-contract-audit` skill, Stellar / Soroban checklist):
- `require_auth` on the address whose assets or rights are used; `env.auths()` asserted in tests; `mock_all_auths` only where auth is not under test.
- `i128` amounts: `checked_*`, negatives refused, `overflow-checks = true` in the release profile; `#[contracterror]` instead of `unwrap`/`expect` on external input.
- Storage type per datum and TTL extension on write paths; no unbounded storage growth.
- `update_current_contract_wasm` behind the admin; `DataKey` changes flagged as upgrade-breaking.
- soroban-sdk pinned to a version fixed for CVE-2026-32322; OpenZeppelin Stellar Contracts preferred to hand-written standard parts.
- No secret key (`S…`, `STELLAR_SECRET_KEY`) or mainnet network in code, tests, scripts or config.
