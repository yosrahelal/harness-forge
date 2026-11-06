---
name: smart-contract-testing
description: Writes and runs a smart-contract test suite from the spec, not from the code — executable spec (interfaces, Foundry invariants, Halmos properties), unit, fuzz, integration, fork tests, coverage and mutation score — for Solidity/Foundry or Soroban/Rust. Use when specifying or testing contracts before audit or deployment.
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
| Invariants | `test/invariants/`, `invariant_INV_n_<name>` with a handler | `test/src/invariants/`, proptest call sequences `invariant_inv_n_<name>` |
| Critical-function properties | Halmos `check_<name>` in `test/symbolic/` | proptest `check_<name>` in `test/src/symbolic/` |

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
cargo llvm-cov --workspace --branch --lcov --output-path lcov.info
cargo mutants --workspace
```

A surviving mutant is a missing test: write it. Report the score with its tool and commit.

## Rules

- A failing test is a finding (plan line, expected, observed, reproduction, proposed severity). Never adjust an expectation, never `vm.skip`, never `#[ignore]`.
- An expectation of the plan that looks wrong goes back to the designer; it is not "fixed" in the test.
- Behaviour present in the code and absent from the plan is reported as a gap.
- Local chains only; no private key, mnemonic or remote RPC in tests, scripts or config.

## Output

Report: tests written/passed/failed; results per `TP-n`; findings; fork tests (network, block); coverage (lines, branches); mutation score and survivors; gas; gaps; commands to reproduce. Template: `kits/blockchain-pipeline/docs/templates/05-tests.md` in the Forge repository.
