#!/usr/bin/env node
// PreToolUse(Bash): block destructive commands (exit 2), warn on risky ones (additionalContext).
// Disable with FORGE_HOOKS=off or FORGE_GUARD=off. Allowlist a regex with FORGE_GUARD_ALLOW.
'use strict';
const { readStdin, disabled, context } = require('./lib');
if (disabled() || /^(off|0|false)$/i.test(process.env.FORGE_GUARD || '')) process.exit(0);
const input = readStdin();
const cmd = String((input.tool_input && input.tool_input.command) || '');
if (!cmd) process.exit(0);
if (process.env.FORGE_GUARD_ALLOW && new RegExp(process.env.FORGE_GUARD_ALLOW).test(cmd)) process.exit(0);

const BLOCK = [
  [/\bgit\s+push\b[^|;&]*\s(--force|-f)\b(?![-\w])/, 'git push --force. Use --force-with-lease on a branch you own, and never on main/master.'],
  [/\bgit\s+push\b[^|;&]*--force-with-lease[^|;&]*\b(main|master)\b/, 'force push to main/master.'],
  [/\bgit\s+reset\s+--hard\b/, 'git reset --hard discards uncommitted work. Stash or commit first, then ask the user.'],
  [/\bgit\s+clean\s+-[a-zA-Z]*f/, 'git clean -f deletes untracked files.'],
  [/\bgit\s+branch\s+(-D|--delete\s+--force)\b/, 'force-deleting a branch.'],
  [/\bgit\s+(commit|push|merge|rebase)\b[^|;&]*--no-verify\b/, '--no-verify bypasses git hooks. Fix the failing hook instead.'],
  [/\bgit\s+-c\s+core\.hooksPath=/i, 'overriding core.hooksPath bypasses git hooks.'],
  [/\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)[a-zA-Z]*\s+(\/|~|\$HOME|\.\.?|\*|\/\*)(\s|$)/, 'recursive delete of a root, home, current directory or wildcard.'],
  [/\b(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE)\b/i, 'destructive SQL statement in a shell command.'],
  [/\bgit\s+checkout\s+--\s+\.(\s|$)|\bgit\s+restore\s+(\.|--staged\s+\.)(\s|$)/, 'discarding all local changes in the working tree.'],
];
for (const [re, why] of BLOCK) {
  if (re.test(cmd)) {
    process.stderr.write(`[Forge guard] Blocked: ${why}\nCommand: ${cmd.slice(0, 200)}\nIf this is intentional, ask the user to run it, or set FORGE_GUARD_ALLOW='<regex>' for this session.\n`);
    process.exit(2);
  }
}
const WARN = [
  [/\bgit\s+push\b/, 'Review the diff and run /forge:verify quick before pushing.'],
  [/\bgit\s+commit\b[^|;&]*--amend\b/, 'Amending: make sure the commit was not pushed yet.'],
  [/\b(npm|pnpm|yarn|bun)\s+(run\s+)?dev\b|\bnext\s+dev\b|\bvite\b(?!\s+build)/, 'Long-running dev server: run it in the background (run_in_background) or tmux so logs stay readable.'],
  [/\bcurl\b[^|;&]*\|\s*(ba)?sh\b/, 'Piping a remote script into a shell. Download and read it first.'],
  [/\bchmod\s+(-R\s+)?777\b/, 'chmod 777 is almost never needed.'],
];
const warnings = WARN.filter(([re]) => re.test(cmd)).map(([, w]) => w);
if (warnings.length) context('PreToolUse', '[Forge guard] ' + warnings.join(' '));
process.exit(0);
