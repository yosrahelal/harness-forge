## Forge additions — smart contracts

When the change touches Solidity, Vyper, Soroban or Anchor code, or deployment scripts:
- Follow the `smart-contract-audit` skill (scope, six classes, proof tests, severity matrix) instead of the generic web checklist.
- A High or Critical finding needs a test that demonstrates it (`test_proof_*`); otherwise report it as "to confirm", not as High.
- Flag as CRITICAL any command, script or config that signs or broadcasts (`--broadcast`, `cast send`, `forge create`), embeds a private key, mnemonic or RPC URL with credentials, or leaves an admin role with an EOA or the deployer.
- Check storage-layout compatibility on any change to an upgradeable contract (`forge inspect <C> storageLayout`).
