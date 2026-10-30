---
description: Find and remove dead code safely — knip/depcheck/ts-prune/vulture/deadcode/cargo-udeps or grep fallback — tiered by risk, with the full test suite run after every deletion and automatic revert on failure.
argument-hint: "[scope]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from affaan-m/ECC /refactor-clean) -->

# Refactor clean

Delegate to `forge:refactor-cleaner` or run inline.

1. **Detect** with the available tool (`npx knip`, `npx depcheck`, `npx ts-prune`, `vulture src/`, `deadcode ./...`, `cargo +nightly udeps`); fall back to grepping exports with zero importers.
2. **Tier** findings: SAFE (unused utilities, helpers, internal functions) · CAUTION (components, routes, middleware — check dynamic imports and external consumers) · DANGER (config, entry points, type definitions — investigate first).
3. **Loop** over SAFE items: full suite green → delete surgically → suite again → on failure `git checkout -- <file>` and skip.
4. CAUTION items only with explicit approval per item; DANGER items are reported, not touched.
5. One commit per logical group (`chore: remove unused …`). Report counts, files, lines removed, items skipped with reasons.
