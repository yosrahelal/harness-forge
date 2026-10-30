#!/usr/bin/env node
// PreCompact: snapshot the working state to .forge/sessions/<ts>-precompact.md so nothing is lost on compaction.
'use strict';
const { readStdin, disabled, projectDir, git, fs, path } = require('./lib');
if (disabled()) process.exit(0);
const input = readStdin();
const cwd = projectDir(input);
try {
  const dir = path.join(cwd, '.forge', 'sessions');
  fs.mkdirSync(dir, { recursive: true });
  const gi = path.join(cwd, '.forge', '.gitignore');
  if (!fs.existsSync(gi)) fs.writeFileSync(gi, 'sessions/\nstate/\n');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  let feature = '';
  try { feature = JSON.parse(fs.readFileSync(path.join(cwd, '.forge', 'feature.json'), 'utf8')).feature_directory || ''; } catch (_) { /* none */ }
  let tasks = '';
  if (feature && fs.existsSync(path.join(cwd, feature, 'tasks.md'))) {
    tasks = fs.readFileSync(path.join(cwd, feature, 'tasks.md'), 'utf8').split('\n').filter((l) => /^- \[ \] T\d{3}/.test(l)).slice(0, 10).join('\n');
  }
  const body = [
    `# Pre-compact snapshot ${ts}`, '',
    `- Branch: ${git('rev-parse --abbrev-ref HEAD', cwd) || 'n/a'}`,
    `- Active feature: ${feature || 'none'}`, '',
    '## git status', '```', git('status --short', cwd) || '(clean)', '```', '',
    '## last commits', '```', git('log -5 --oneline', cwd) || '(none)', '```', '',
    tasks ? '## next open tasks\n' + tasks + '\n' : '',
    '_Written automatically by the Forge PreCompact hook. After compaction, re-read this file or run /forge:resume-session._',
  ].join('\n');
  fs.writeFileSync(path.join(dir, `${ts}-precompact.md`), body);
} catch (_) { /* never block compaction */ }
process.exit(0);
