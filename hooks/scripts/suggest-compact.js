#!/usr/bin/env node
// PostToolUse(*): count tool calls per session; suggest a strategic /compact at 50, then every 25.
'use strict';
const { readStdin, disabled, projectDir, context, stateDir, fs, path } = require('./lib');
if (disabled()) process.exit(0);
const input = readStdin();
const cwd = projectDir(input);
const sid = String(input.session_id || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
const threshold = parseInt(process.env.FORGE_COMPACT_THRESHOLD || '50', 10);
const interval = parseInt(process.env.FORGE_COMPACT_INTERVAL || '25', 10);
try {
  const f = path.join(stateDir(cwd), `toolcount-${sid}`);
  const n = (fs.existsSync(f) ? parseInt(fs.readFileSync(f, 'utf8'), 10) || 0 : 0) + 1;
  fs.writeFileSync(f, String(n));
  if (n === threshold || (n > threshold && (n - threshold) % interval === 0)) {
    context('PostToolUse', `[Forge] ${n} tool calls this session. If you just finished exploration or a milestone, this is a good moment for a strategic /compact (or /forge:save-session first). Avoid compacting mid-task.`);
  }
} catch (_) { /* ignore */ }
process.exit(0);
