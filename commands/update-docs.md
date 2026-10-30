---
description: Sync documentation from sources of truth — package scripts, .env.example, OpenAPI/routes, public exports, Dockerfiles — regenerating reference sections and flagging stale prose. Delegates to doc-updater.
argument-hint: "[docs scope]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from affaan-m/ECC /update-docs) -->

# Update docs

Delegate to `forge:doc-updater` with the scope, or run inline:

1. Sources of truth → outputs: `package.json`/`Makefile`/`pyproject` scripts → command reference; `.env.example` → environment table (required/optional, format, example); `openapi.yaml` or route files → API reference; exported symbols → public API docs; `Dockerfile`/`compose` → setup docs.
2. Regenerate only the generated sections (mark them with `<!-- generated:start/end -->` comments); never rewrite hand-written prose silently.
3. Check README quickstart commands actually run; flag ADRs contradicted by code; update `GLOSSARY.md` for new terms.
4. Report files updated and stale statements found but not changed.
