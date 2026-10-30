---
description: Web performance audit via the web-performance-auditor agent — Deep mode with Lighthouse/PSI/CrUX/trace data or the chrome-devtools MCP, Quick mode (static anti-pattern scan) otherwise. Web apps only.
argument-hint: "[url | report.json | files]"
disable-model-invocation: true
---
<!-- origin: forge (adapted from addyosmani/agent-skills /webperf) -->

# Webperf

Not for libraries, CLIs or server-only code.

1. **Mode**: Deep when any of these exists — a Lighthouse JSON (`npx lighthouse <url> --output json`), a PageSpeed Insights or CrUX response, a DevTools trace, or a live URL with the `chrome-devtools` MCP configured. Otherwise Quick: static scan of source for anti-patterns, every finding labelled *potential impact*.
2. **Spawn** `forge:web-performance-auditor` with: files/diff under review, artifact paths or pasted JSON, target URL/page, and the expected mode so it flags missing inputs.
3. **Return** its report unchanged: scorecard (only sourced values), ranked findings with file:line, positive observations, proactive recommendations. Pair with `forge:performance-optimization` for fixes.
