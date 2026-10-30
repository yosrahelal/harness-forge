#!/usr/bin/env node
// SessionStart: inject project context (package manager, constitution, constraints, glossary, active feature, last session).
'use strict';
const { readStdin, disabled, projectDir, git, context, detectPackageManager, fs, path } = require('./lib');
if (disabled()) process.exit(0);
const input = readStdin();
const cwd = projectDir(input);
const lines = ['[Forge] Session context'];
const pm = detectPackageManager(cwd);
if (pm) lines.push(`- Package manager / toolchain: ${pm}`);
const branch = git('rev-parse --abbrev-ref HEAD', cwd);
if (branch) lines.push(`- Branch: ${branch}`);
const has = (f) => fs.existsSync(path.join(cwd, f));
const present = ['.forge/constitution.md', 'CONSTRAINTS.md', 'GLOSSARY.md', 'docs/adr', 'CLAUDE.md', 'AGENTS.md'].filter(has);
if (present.length) lines.push(`- Read before working: ${present.join(', ')}`);
try {
  const fj = JSON.parse(fs.readFileSync(path.join(cwd, '.forge', 'feature.json'), 'utf8'));
  if (fj.feature_directory) {
    lines.push(`- Active feature: ${fj.feature_directory}`);
    const tasks = path.join(cwd, fj.feature_directory, 'tasks.md');
    if (fs.existsSync(tasks)) {
      const t = fs.readFileSync(tasks, 'utf8').split('\n');
      const open = t.filter((l) => /^- \[ \] T\d{3}/.test(l));
      const all = t.filter((l) => /^- \[[ xX]\] T\d{3}/.test(l));
      lines.push(`- Tasks: ${all.length - open.length}/${all.length} done` + (open[0] ? `; next: ${open[0].slice(6, 120)}` : ''));
    }
  }
} catch (_) { /* no active feature */ }
const latest = path.join(cwd, '.forge', 'sessions', 'latest.md');
if (fs.existsSync(latest)) {
  const head = fs.readFileSync(latest, 'utf8').split('\n').slice(0, 30).join('\n');
  lines.push(`- Last saved session (.forge/sessions/latest.md), first lines:\n${head}`);
}
lines.push('- Entry points: /forge:guide, /forge:specify, /forge:build, /forge:review, /forge:verify, /forge:ship. Skills auto-activate; run /forge:init once per project.');
context('SessionStart', lines.join('\n'));
