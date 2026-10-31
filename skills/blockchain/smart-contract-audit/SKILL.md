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

```bash
pip install slither-analyzer solc-select && solc-select install <version> && solc-select use <version>
slither . --exclude-dependencies --filter-paths "lib|test|script" --json /tmp/slither.json
forge test -vv            # existing suite, if Foundry is present
```

If installation or compilation fails (no network, missing remappings), say so in the report and continue manually. Tool output is a lead, not a finding: triage every hit, keep only what you can justify.

## Step 3 — Manual review

Read every in-scope function, state-changing first, then views used in critical paths. Walk the checklist in [references/checklist.md](references/checklist.md) for the platform concerned. For each external or public function, answer: who can call it, what it changes, what it calls, what happens if called twice, out of order, with zero, with max, or by a contract.

## Step 4 — Business logic and economics

- Write the **invariants** (for example "sum of balances == totalSupply", "a frozen account cannot send or receive", "redemption never pays more than NAV × units") and look for paths that break them.
- Consider flash-loan capital, front-running and sandwiching, oracle manipulation, rounding direction, griefing.
- For regulated tokens, check that every compliance control holds on **every** transfer path (transfer, transferFrom, permit, mint, burn, forced transfer, batch, bridge).

## Step 5 — Proof of concept

For High and Critical findings, write a Foundry test that demonstrates the exploit when the sandbox can compile it; otherwise give the exact call sequence. Do not inflate severity of what you cannot demonstrate: mark it *à confirmer*.

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
- Never write "the contract is secure". Write what was reviewed, how, and what was not covered.
- Privileged-role abuse is in scope as a **centralisation risk** even when the role is "trusted": state it, rate it separately.
- Prefer audited libraries (OpenZeppelin, the standard's reference implementation) in recommendations; give code for the fix when it is short.
- Write in the language of the request.

## Deeper references

- [references/checklist.md](references/checklist.md) — EVM, Soroban and Anchor checklists, regulated-token controls.
- [references/report-template.md](references/report-template.md) — audit report skeleton (French).
