# Agent Orchestration

Forge agents come from the `forge` plugin (plugin-scoped names, `forge:<name>`) or from a manual install into `~/.claude/agents/` or `.claude/agents/` (bare names). Invoke them with the Agent tool:

```text
Agent(subagent_type: "forge:planner", prompt: "...")
```

## Core agents (always available with the plugin)

| Agent | Purpose | When to use |
|-------|---------|-------------|
| forge:planner | Implementation planning | Complex features, refactoring |
| forge:architect / forge:code-architect | System and feature design | Architectural decisions, blueprints from existing patterns |
| forge:code-explorer | Trace execution paths | Understanding an unfamiliar feature |
| forge:tdd-guide | Test-driven implementation | New features, bug fixes |
| forge:test-engineer / forge:pr-test-analyzer | Test strategy, coverage of a diff | Before merge |
| forge:code-reviewer | Code review | After writing code |
| forge:code-simplifier, forge:silent-failure-hunter, forge:type-design-analyzer, forge:comment-analyzer | Focused review passes | After the main review |
| forge:security-reviewer | Security analysis | Auth, input handling, secrets, payments |
| forge:performance-optimizer / forge:web-performance-auditor | Performance | Slow paths, Core Web Vitals |
| forge:build-error-resolver | Fix build and type errors | When the build fails |
| forge:e2e-runner | E2E tests | Critical user flows |
| forge:refactor-cleaner | Dead code cleanup | Maintenance |
| forge:doc-updater / forge:docs-lookup | Docs and codemaps / current library docs | Documentation, API questions |
| forge:commit-reviewer | Conventional commit message from a staged diff | Before committing |
| forge:database-reviewer | SQL, schema, migrations | Database work |
| forge:spec-miner | Extract specs from legacy code | Brownfield projects |
| forge:reality-checker / forge:evidence-collector | Evidence-based QA, go/no-go | Before claiming done |
| forge:agent-evaluator | Grade agent output | Reviewing delegated work |
| forge:loop-operator | Run and watch autonomous loops | Long unattended work |
| forge:orchestrator | Multi-agent pipeline | Work spanning several roles |

Roster divisions (languages, engineering, testing, product, design, project-management, security, specialized, growth, ml) are installed on demand: `node scripts/install.js --division <name>` or `--auto`. See `docs/CATALOG.md`.

## Immediate agent usage

No user prompt needed:
1. Complex feature request → **forge:planner**
2. Code just written or modified → **forge:code-reviewer**
3. Bug fix or new feature → **forge:tdd-guide**
4. Architectural decision → **forge:architect**
5. Build broken → **forge:build-error-resolver**
6. Before shipping → **forge:security-reviewer** then **forge:reality-checker**

## Parallel work

- Fan out independent reviews or research in one assistant turn (several Agent calls).
- Subagents never spawn subagents; merge their reports in the main context.
- Pass the relevant skill conventions in the prompt; subagents do not inherit the conversation.
- Use `forge:orchestrator` only when the work spans several phases; direct invocation is cheaper.
