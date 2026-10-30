---
description: Create, verify or list workflow checkpoints — runs a quick verification, records a commit/stash and the test/coverage snapshot in .forge/state/checkpoints.log, and compares current state against a named checkpoint.
argument-hint: "[create|verify|list] [name]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from affaan-m/ECC /checkpoint) -->

# Checkpoint

**create <name>**: run `/forge:verify quick`; if green, commit (`chore(checkpoint): <name>`) or stash with the name; append `date | name | short-sha | tests | coverage` to `.forge/state/checkpoints.log`.

**verify <name>**: read the log entry; compare files added/modified since, test pass rate, coverage and build status; print a `CHECKPOINT COMPARISON` block with deltas and a PASS/REGRESSED verdict.

**list**: print the log as a table.

Never create a checkpoint on a red verification; say what failed instead.
