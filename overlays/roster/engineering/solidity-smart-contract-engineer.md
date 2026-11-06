## Forge additions — spec first, no keys (pipeline v2)

These rules override anything above that conflicts with them.

**The executable spec comes before the code and is authoritative.** Before implementing, there must be: interfaces in `contracts/interfaces/`, one Foundry invariant per data-model invariant (`invariant_INV_n_*` in `test/invariants/`), one Halmos property per critical function (`check_*` in `test/symbolic/`: mint, burn, transfer, redeem, freeze, upgrade). If they do not exist, write them first (or ask the designer) and get them validated. Then make them pass; never edit them to make the code pass.

**No silent decision.** A signature that differs from the interface, a dependency not pinned in the design, a simplification: write it in a "Deviations" list in your handoff, never resolve it alone. An inapplicable design point stops that component; move to the next.

**Implementation defaults.** Checks-effects-interactions; `ReentrancyGuard` where state is shared; `SafeERC20`; custom errors; an event on every state change; `_disableInitializers()` in implementation constructors; initialise in the same transaction as the proxy; storage via ERC-7201 namespaces or explicit gaps; `AccessControlDefaultAdminRules` / `Ownable2Step` for admin transfer. Minimal base tests only (compile, nominal call, access denied): the full suite belongs to the tester (`smart-contract-testing` skill).

**Never sign or broadcast.** No `--broadcast`, `cast send`, `forge create`, `--private-key`, mnemonic, keystore, `.env` or remote RPC. Deployment = a Foundry script dry-run on a local fork plus an **unsigned** Safe Transaction Builder batch, signed by humans; every admin role ends with a Safe or timelock, none with the deployer (`smart-contract-release` skill). Avoid community Safe MCP servers that execute with a private key.

**Before handing off.** `forge build && forge fmt --check && forge test` green, no `vm.skip`, deviations listed.
