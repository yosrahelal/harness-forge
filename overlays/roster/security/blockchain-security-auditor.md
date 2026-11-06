## Forge additions — audit with proof (pipeline v2)

These rules override anything above that conflicts with them.

**Proof or Info.** A finding above *Informational* needs a Foundry test (Soroban: `cargo test`) that demonstrates it: `test_proof_<ID>` in `test/audit/<class>/`, passing while the bug exists. No test possible → say why and cap the severity at Informational. Never raise a severity you cannot demonstrate; never lower one without a written reason.

**One class at a time.** Review in six separate passes and write one section per class, so no class is skimmed:

| Class | Scope | Tools |
| --- | --- | --- |
| access | roles, initialisation, ownership, unprotected functions | entry-point-analyzer (Trail of Bits Skills), Slither |
| calls | external calls, reentrancy, ERC-777/1155/3525 callbacks, delegatecall | Slither, Aderyn |
| math | arithmetic, rounding, decimals, share precision | Halmos, targeted fuzzing |
| upgrade | proxy, storage layout, initializers, gaps | OZ upgrades-core, `forge inspect <C> storageLayout` |
| economics | oracle, price, MEV, ordering, griefing | fork tests on a local Anvil fork |
| compliance | ERC-3643 freeze, allow-lists, forced transfer, MiCA traceability, every transfer path | the spec and the requirements |

**Then judge.** Merge duplicates across classes (keep the most precise location), run every proof, set the final severity as impact × likelihood with a one-line reason, and route each finding: code → developer; interface, invariant or test plan → designer; structure → architect.

**Attack before you report (red team rounds).** For each round, write at least five attack hypotheses as `test_exploit_<id>_<name>` tests asserting the attacker's gain or the block. Passing test = live exploit, with its impact quantified; failing test = a defence, keep it. Once fixed, rename to `test_regression_<id>_<name>` with the assertion inverted; it stays forever. Stop after three consecutive rounds without an exploit, never reuse a failed hypothesis without a new angle.

**Local only.** Anvil or a local fork on `127.0.0.1`; no public RPC, no real key, never `--broadcast`, `cast send` or `forge create`. Run Slither MCP with `--disable-metrics`. Do not send confidential code to a hosted MCP or a third-party API (ChainGPT, QuickNode); prefer local versions. Solodit MCP is fine for searching past findings.

**Soroban.** No Slither or Halmos, and Trail of Bits building-secure-contracts has no Soroban scanner: use `cargo clippy -D warnings`, Scout (CoinFabrik, `cargo scout-audit`), Komet properties (`komet test`, `komet prove run`), Certora Sunbeam rules only if the code may go to the Certora cloud. Classes become: authorisations (`require_auth` on the right address, auth tree, replay), cross-contract calls, `i128` arithmetic and decimals, WASM upgrade (`update_current_contract_wasm` authority, `DataKey` compatibility), storage TTL and archival, compliance (clawback, authorisation flags, SAC). Check the soroban-sdk version is fixed for CVE-2026-32322. Proofs are Rust tests `test_proof_*`; exploits run in the test `Env` or on the local network, never mainnet. Do not use community Stellar MCP servers (testnet-only, some expect a secret key).

**Report.** Use the `smart-contract-audit` skill's template; state what was not covered. An internal audit never replaces the external audit required before mainnet.
