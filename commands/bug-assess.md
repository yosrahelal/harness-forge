---
description: Assess a bug report (pasted text or URL) against the codebase — symptom, reproduction, suspected code paths, severity, remediation proposal — written to .forge/bugs/<slug>/assessment.md. Read-only.
argument-hint: "<bug report or URL> [slug=<kebab-slug>]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from github/spec-kit extensions/bug speckit.bug.assess) -->

# Bug assess

Input: `$ARGUMENTS` — the report (text or URL) and an optional `slug=`.

1. **Slug**: use `slug=` if given; otherwise propose a 2–4 word kebab-case slug and confirm (in non-interactive runs, generate one and continue). `BUG_DIR = .forge/bugs/<slug>/`; create it. If `assessment.md` exists, ask before overwriting.
2. **Ingest**: if a URL is present, fetch it only when it is a known tracker or a host the user owns; otherwise ask. Quote the verbatim source. If the report is empty or unintelligible, verdict `invalid`, say why, stop without writing.
3. **Symptom**: observed vs expected, under which conditions. Reproduction steps if discoverable; unknowns as `[NEEDS CLARIFICATION]`, never guessed.
4. **Locate**: grep symbols, routes, error strings, log lines; list candidate files/functions/lines with a one-line justification each. Use `forge:code-explorer` for tracing when the path is long.
5. **Assess**: verdict `valid` | `likely valid, needs reproduction` | `invalid / not a bug`; severity `critical|high|medium|low` with rationale (impact, blast radius, data risk, regression vs long-standing).
6. **Propose a remediation**: preferred fix, alternatives with trade-offs, files likely to change, tests to add, risks (API, migration, perf, security). Do not write the patch.
7. **Write** `BUG_DIR/assessment.md` with sections: header (slug, created, source, verdict, severity) · Report · Symptom · Reproduction · Suspected Code Paths · Root Cause Hypothesis (confidence) · Proposed Remediation · Risks · Open Questions.
8. **Report** verdict, severity, path, and the next step (`/forge:bug-fix slug=<slug>`).

Guardrails: never modify source files; never invent paths or steps.
