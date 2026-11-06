---
name: smart-contract-testing
description: Writes and runs a smart-contract test suite from the spec, not from the code — executable spec (interfaces, Foundry invariants, Halmos or Komet properties), unit, fuzz, integration, fork tests, coverage and mutation score — for Solidity/Foundry or Soroban/Rust. Use when specifying or testing contracts before audit or deployment.
metadata:
  origin: forge (pipeline multi-agents blockchain v2, Y. Helal 2026-11-05)
---

# Smart contract testing

The suite proves what the spec promised. Read the code to test it, never to decide what it should do.

## Step 1 — Executable spec (before the implementation)

Write, compile, and freeze; only the designer changes these files afterwards.

| Artifact | EVM (Foundry) | Soroban (Rust) |
|---|---|---|
| Interfaces | `contracts/interfaces/I<C>.sol` | `#[contractclient]` traits in `contracts/interfaces/` |
| Invariants | `test/invariants/`, `invariant_INV_n_<name>` with a handler | `test/src/invariants/`, soroban-sdk tests over generated call sequences — proptest call sequences `invariant_inv_n_<name>` |
| Critical-function properties | Halmos `check_<name>` in `test/symbolic/` | Komet (Runtime Verification) `test_<name>` in a Komet test crate `test/symbolic/`: fuzzing (`komet test`) and symbolic proof (`komet prove run`), local |
| Formal rules (optional) | Certora | Certora Sunbeam rules (Rust specs, proof on the WASM) in `test/symbolic/sunbeam/`; runs on the Certora cloud: security review before use on confidential code |

Critical functions: mint, burn, transfer/transferFrom, forced transfer, redeem/withdraw, freeze, pause, clawback, role grants, upgrade. Each has a property. Each `INV-n` of the design has a test.

## Step 2 — Test plan

One line per case, `TP-n | target | case | type | expected`; cases = nominal, limits (0, 1, max, decimals), failure, access (each role, a stranger, a contract caller). Name every test after its line: `test_TP_n_<case>` (Soroban: `test_tp_n_<case>`), so coverage of the plan is greppable.

## Step 3 — Suite

- **Unit** per function and per error.
- **Fuzz** every function taking amounts or addresses (`forge test --fuzz-runs 10000`; proptest with `i128` negatives, zero, max).
- **Invariants**: totals (`sum(balances) == totalSupply`), conservation across transfers, reachable states only, a frozen account neither sends nor receives, compliance checks on **every** transfer path.
- **Integration** per use-case sequence, with several actors.
- **Fork tests** on a local fork (`anvil --fork-url …` started by a human; tests use `--fork-url http://127.0.0.1:8545`) for every external integration: oracle, stablecoin, third-party protocol.
- **Gas** (EVM) or resource cost (`env.cost_estimate()`) of critical functions.

## Step 4 — Measure

```bash
forge coverage --report lcov                 # branch coverage on contracts/, target ≥ 95 %
halmos --function check_                     # 0 counterexample
gambit mutate --json gambit.json             # then run the suite per mutant; target ≥ 80 % killed
# Soroban
cd test/symbolic && komet test && komet prove run
cargo llvm-cov --workspace --branch --lcov --output-path lcov.info
cargo mutants --workspace
```

A surviving mutant is a missing test: write it. Report the score with its tool and commit.

## Soroban specifics

- Base the contracts on OpenZeppelin Stellar Contracts (audited, MIT) and its test helpers where they exist; Stellar's official `stellar-dev-skill` and OpenZeppelin's `setup-stellar-contracts` skill set up the environment.
- Pin a soroban-sdk version fixed for CVE-2026-32322 (double-withdrawal risk; check the advisory for the fixed version).
- Test authorisation explicitly with `env.auths()`; use `mock_all_auths` only when authorisation is not the subject of the test.
- Cover `i128` negatives, zero and max; TTL expiry and archival (advance the ledger); SAC clawback and authorisation flags when a classic asset is involved; resource cost with `env.cost_estimate()`.
- Local network only (`stellar` with `--network local`); testnet only by explicit decision, never mainnet; never a secret key (`S…`) in tests or config. Community Stellar MCP servers are testnet-only and some expect a secret key: do not use them.

## Rules

- A failing test is a finding (plan line, expected, observed, reproduction, proposed severity). Never adjust an expectation, never `vm.skip`, never `#[ignore]`.
- An expectation of the plan that looks wrong goes back to the designer; it is not "fixed" in the test.
- Behaviour present in the code and absent from the plan is reported as a gap.
- Local chains only; no private key, mnemonic or remote RPC in tests, scripts or config.

## Output

Report: tests written/passed/failed; results per `TP-n`; findings; fork tests (network, block); coverage (lines, branches); mutation score and survivors; gas; gaps; commands to reproduce. Template: `kits/blockchain-pipeline/docs/templates/05-tests.md` in the Forge repository.
