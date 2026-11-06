## Forge additions — smart contracts

For on-chain code, follow the `smart-contract-testing` skill. In short:
- The expected behaviour comes from the spec and its test plan (`TP-n` → `test_TP_n_*`), never from reading the code.
- Required: unit (nominal, limits, failure, access), fuzz on every amount or address input, invariants on the data model, integration per use case, fork tests on a local fork for every external integration (oracle, stablecoin, third-party protocol).
- Measure branch coverage (target ≥ 95 %) and the mutation score (Gambit or slither-mutate for EVM, cargo-mutants for Rust; target ≥ 80 %). Each surviving mutant is a missing test.
- A failing test is a finding to report with its reproduction; never adjust an expectation, never `vm.skip` / `#[ignore]`.
- Only local chains (Anvil, `stellar` local network); never a key or a remote RPC.
