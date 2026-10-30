---
description: Detect the build system and fix build/type errors one at a time with minimal safe changes, re-running the build after each fix. Stops when a fix adds errors, an error persists after 3 tries, or architecture changes are needed.
argument-hint: "[build command override]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from affaan-m/ECC /build-fix) -->

# Build fix

Delegate to `forge:build-error-resolver` for long error lists; otherwise run inline.

1. **Detect** the build: `package.json` build script / `tsc --noEmit` / `cargo build` / `mvn compile` / `./gradlew compileJava` / `go build ./...` / `mypy .` / `dart analyze` / `swift build`, or `$ARGUMENTS`.
2. **Parse and group** errors by file; sort imports/types before logic; count for progress.
3. **Fix loop**: read 10 lines around the error → diagnose root cause → smallest edit → re-run → next. Never silence an error with `any`, `@ts-ignore`, `# type: ignore`, `unsafe`, or deleted tests.
4. **Guardrails**: stop and ask if a fix introduces more errors than it resolves, the same error survives 3 attempts, or the fix needs an architectural change.
5. Report: errors before/after, files touched, anything left.
