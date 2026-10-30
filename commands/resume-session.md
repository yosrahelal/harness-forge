---
description: Load the latest (or a given) .forge/sessions file, verify the repo state still matches it, and orient fully before doing any work.
argument-hint: "[date | path]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from affaan-m/ECC /resume-session) -->

# Resume session

1. **Find** the file: `$ARGUMENTS` path → that file; a date → newest match for that date; nothing → `.forge/sessions/latest.md`. If none exists, say so and stop.
2. **Read it fully**, then **verify** against reality: current branch, `git status`, `git log` since the saved commit, that listed files exist, that `tasks.md` state matches. Note every discrepancy.
3. **Orient**: restate the goal, what is done, what is next, open questions, and the commands that work. Load `.forge/constitution.md`, `CONSTRAINTS.md`, `GLOSSARY.md` when present.
4. **Ask** before acting if the saved next step is ambiguous or the repo diverged; otherwise propose the first concrete action and wait for a go.
