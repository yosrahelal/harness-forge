# Rules

Always-on standards. Rules are short and loaded into every session once installed; skills carry the long-form method and load on demand.

```
rules/
├── common/          # language-agnostic, install always
│   ├── coding-style.md  git-workflow.md  development-workflow.md  testing.md
│   ├── security.md  performance.md  patterns.md  code-review.md  hooks.md
│   ├── agents.md          # the Forge roster and when to delegate
│   └── prompt-defense.md  # untrusted-content baseline (replaces the per-agent boilerplate)
└── <language>/      # typescript, react, vue, nuxt, angular, web, react-native, python, golang, rust,
                     # java, kotlin, swift, dart, php, ruby, csharp, fsharp, cpp, perl, arkts
```

Each language directory has `coding-style.md`, `patterns.md`, `testing.md`, `security.md`, `hooks.md` (plus `fastapi.md` for Python, `design-quality.md` for web, a11y/perf/production files for React Native).

## Install

```bash
# detect the stack and install common + matching language rules (+ language reviewers) into ./.claude
node scripts/install.js --scope project --auto

# explicit
node scripts/install.js --scope user --rules common,typescript,python
```

Rules land in `<scope>/rules/<set>/`. Claude Code loads `.claude/rules/**/*.md` automatically for a project and `~/.claude/rules/` for the user. Keep the common set; add only the languages you use.

Origin: affaan-m/ECC `rules/`, with `agents.md` rewritten for the Forge roster and `prompt-defense.md` added.
