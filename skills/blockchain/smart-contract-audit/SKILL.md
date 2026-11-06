---
name: smart-contract-audit
description: Audits smart contracts (Solidity/EVM, Soroban, Anchor) by manual review plus tools when available, and writes a severity-rated audit report. Use for security reviews, pre-audit prep or restitution.
metadata:
  origin: forge (method from agency-agents blockchain-security-auditor)
---

# Smart contract audit

Assume every contract is exploitable until shown otherwise. The output is a report whose findings each carry a concrete exploit scenario, evidence and a fix.

## Step 1 — Fix the scope

Write down before reading code:
- commit or archive hash, files in scope, files out of scope (libraries, mocks, scripts);
- the **trust model**: which roles are trusted, which are not, which off-chain components are assumed honest;
- the intended behaviour: spec, whitepaper or the user's description. With no spec, reconstruct it with the `blockchain-project-analysis` skill (steps 1–4) and get it confirmed.

## Step 2 — Automated pass (if the sandbox allows)

Run tools locally; never send confidential code to a hosted MCP or third-party API. Slither MCP: `--disable-metrics`. Complementary analysers: Aderyn, Trail of Bits `entry-point-analyzer`; Soroban: Trail of Bits has no Soroban scanner (only its generic skills, such as differential review, apply); use `cargo clippy -D warnings`, Scout (CoinFabrik, `cargo scout-audit`), Komet properties (fuzzing and `komet prove run`), Certora Sunbeam rules if the code may leave the bank (runs on the Certora cloud). Soroban audit classes: authorisations (`require_auth`), cross-contract calls, `i128` arithmetic and decimals, WASM upgrade, storage TTL and archival, compliance (clawback, authorisation flags, SAC).

```bash
pip install slither-analyzer solc-select && solc-select install <version> && solc-select use <version>
slither . --exclude-dependencies --filter-paths "lib|test|script" --json /tmp/slither.json
forge test -vv            # existing suite, if Foundry is present
```

If installation or compilation fails (no network, missing remappings), say so in the report and continue manually. Tool output is a lead, not a finding: triage every hit, keep only what you can justify.

## Step 3 — Manual review, one class at a time

Do six passes, one section each, so no class is skimmed: **access** (roles, initialisation, ownership, unprotected functions), **calls** (external calls, reentrancy, ERC-777/1155/3525 callbacks, delegatecall), **math** (rounding, decimals, share precision), **upgrade** (proxy, storage layout, initializers, gaps), **economics** (oracle, price, MEV, ordering, griefing), **compliance** (ERC-3643 freeze, allow-lists, forced transfer, MiCA traceability). For a large scope, run the six passes as parallel subagents, then judge (Step 5b).

Read every in-scope function, state-changing first, then views used in critical paths. Walk the checklist in [references/checklist.md](references/checklist.md) for the platform concerned. For each external or public function, answer: who can call it, what it changes, what it calls, what happens if called twice, out of order, with zero, with max, or by a contract.

## Step 4 — Business logic and economics

- Write the **invariants** (for example "sum of balances == totalSupply", "a frozen account cannot send or receive", "redemption never pays more than NAV × units") and look for paths that break them.
- Consider flash-loan capital, front-running and sandwiching, oracle manipulation, rounding direction, griefing.
- For regulated tokens, check that every compliance control holds on **every** transfer path (transfer, transferFrom, permit, mint, burn, forced transfer, batch, bridge).

## Step 5 — Proof of concept and red team

- **Proof or Info.** Every finding above Informational gets a test that demonstrates it: `test_proof_<ID>` in `test/audit/<class>/`, passing while the bug exists. No test possible (sandbox, missing deps) → give the exact call sequence and mark it *à confirmer*; never rate it above what you demonstrated.
- **Red team rounds** (pre-deployment audits): at least five attack hypotheses per round as `test_exploit_<id>_<name>` tests asserting the attacker's gain on a local Anvil fork. Passing = live exploit (quantify the impact); failing = a defence, keep it. Once fixed: rename `test_regression_<id>_<name>`, invert the assertion, keep it forever. Stop after three consecutive clean rounds.

## Step 5b — Judge

Run every proof. Merge duplicates across classes (most precise location wins). Set the final severity with the matrix below and a one-line reason. Route each finding: code → developer; interface, invariant or test plan → designer; structure (custody, privacy, network) → architect. Add live red-team exploits as confirmed findings.

## Step 6 — Report

Use [references/report-template.md](references/report-template.md). Produce Markdown in chat for a short audit; for a deliverable, build a Word file with the `blockchain-docs` skill, and a restitution deck with `blockchain-deck`.

## Severity

| | Likelihood high | Likelihood medium | Likelihood low |
|---|---|---|---|
| **Impact high** (loss or freeze of funds, broken compliance control, takeover) | Critical | High | Medium |
| **Impact medium** (temporary DoS, value leak bounded, wrong accounting recoverable) | High | Medium | Low |
| **Impact low** (best-practice deviation, no direct loss) | Medium | Low | Low |

*Informational*: gas, style, documentation, no security impact.

## Rules

- No finding without: location (file:line), scenario (preconditions → calls → result), impact, fix.
- An internal audit never replaces the external audit required before mainnet.
- Never write "the contract is secure". Write what was reviewed, how, and what was not covered.
- Privileged-role abuse is in scope as a **centralisation risk** even when the role is "trusted": state it, rate it separately.
- Prefer audited libraries (OpenZeppelin, the standard's reference implementation) in recommendations; give code for the fix when it is short.
- Write in the language of the request.

## Deeper references

- `smart-contract-testing` skill — executable spec, invariants, mutation score; `smart-contract-release` skill — deployment without keys, monitoring, upgrades.
- `playbooks/blockchain-pipeline.md` — the full multi-agent pipeline (audit swarm, judge, scripted gates).
- [references/checklist.md](references/checklist.md) — EVM, Soroban and Anchor checklists, regulated-token controls.
- [references/report-template.md](references/report-template.md) — audit report skeleton (French).
