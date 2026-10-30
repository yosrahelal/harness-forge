#!/usr/bin/env node
/**
 * feature-paths.js — resolve the active Spec-Driven Development feature directory.
 *
 * Usage: node feature-paths.js [--json] [--feature <dir|NNN|name>] [--require-spec]
 *        [--require-plan] [--require-tasks] [--include-tasks]
 *
 * Resolution order: --feature → .forge/feature.json → git branch "NNN-name" → newest specs/NNN-*.
 * Prints JSON (with --json) or KEY=VALUE lines. Exits 1 with an error when a required artifact is missing.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };

function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(dir, '.git')) || fs.existsSync(path.join(dir, '.forge')) || fs.existsSync(path.join(dir, 'specs'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(start);
    dir = parent;
  }
}

const ROOT = findRepoRoot(process.cwd());
const SPECS = path.join(ROOT, 'specs');

function listFeatures() {
  if (!fs.existsSync(SPECS)) return [];
  return fs.readdirSync(SPECS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{3}-/.test(d.name))
    .map((d) => d.name)
    .sort();
}

function resolveFeatureDir() {
  const explicit = opt('--feature');
  const features = listFeatures();
  if (explicit) {
    if (fs.existsSync(path.resolve(ROOT, explicit))) return path.resolve(ROOT, explicit);
    const hit = features.find((f) => f === explicit || f.startsWith(explicit.padStart(3, '0') + '-') || f.endsWith('-' + explicit) || f.includes(explicit));
    if (hit) return path.join(SPECS, hit);
    fail(`Feature '${explicit}' not found under specs/`);
  }
  const fj = path.join(ROOT, '.forge', 'feature.json');
  if (fs.existsSync(fj)) {
    try {
      const { feature_directory } = JSON.parse(fs.readFileSync(fj, 'utf8'));
      if (feature_directory && fs.existsSync(path.resolve(ROOT, feature_directory))) return path.resolve(ROOT, feature_directory);
    } catch (_) { /* ignore */ }
  }
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (/^\d{3}-/.test(branch) && fs.existsSync(path.join(SPECS, branch))) return path.join(SPECS, branch);
  } catch (_) { /* not a git repo */ }
  if (features.length) return path.join(SPECS, features[features.length - 1]);
  return null;
}

function fail(msg) {
  if (flag('--json')) process.stdout.write(JSON.stringify({ error: msg }) + '\n');
  else process.stderr.write('ERROR: ' + msg + '\n');
  process.exit(1);
}

const FEATURE_DIR = resolveFeatureDir();
if (!FEATURE_DIR) fail('No feature found. Run /forge:specify first (creates specs/NNN-name/).');

const p = (f) => path.join(FEATURE_DIR, f);
const out = {
  REPO_ROOT: ROOT,
  FEATURE_DIR,
  FEATURE_NAME: path.basename(FEATURE_DIR),
  FEATURE_SPEC: p('spec.md'),
  IMPL_PLAN: p('plan.md'),
  TASKS: p('tasks.md'),
  RESEARCH: p('research.md'),
  DATA_MODEL: p('data-model.md'),
  QUICKSTART: p('quickstart.md'),
  CONTRACTS_DIR: p('contracts'),
  CHECKLISTS_DIR: p('checklists'),
  CONSTITUTION: path.join(ROOT, '.forge', 'constitution.md'),
  TEMPLATES_DIR: path.resolve(__dirname, '..', '..', 'templates'),
};
out.AVAILABLE_DOCS = ['spec.md', 'plan.md', 'tasks.md', 'research.md', 'data-model.md', 'quickstart.md']
  .filter((f) => fs.existsSync(p(f)))
  .concat(fs.existsSync(out.CONTRACTS_DIR) ? ['contracts/'] : [])
  .concat(fs.existsSync(out.CHECKLISTS_DIR) ? fs.readdirSync(out.CHECKLISTS_DIR).map((f) => 'checklists/' + f) : []);

if (flag('--require-spec') && !fs.existsSync(out.FEATURE_SPEC)) fail(`spec.md missing in ${FEATURE_DIR}. Run /forge:specify.`);
if (flag('--require-plan') && !fs.existsSync(out.IMPL_PLAN)) fail(`plan.md missing in ${FEATURE_DIR}. Run /forge:plan.`);
if (flag('--require-tasks') && !fs.existsSync(out.TASKS)) fail(`tasks.md missing in ${FEATURE_DIR}. Run /forge:tasks.`);

if (flag('--include-tasks') && fs.existsSync(out.TASKS)) {
  const lines = fs.readFileSync(out.TASKS, 'utf8').split('\n');
  const all = lines.filter((l) => /^- \[[ xX]\] T\d{3}/.test(l));
  const open = all.filter((l) => /^- \[ \]/.test(l));
  out.TASKS_TOTAL = all.length;
  out.TASKS_OPEN = open.length;
  out.NEXT_TASK = open[0] || null;
}

if (flag('--json')) process.stdout.write(JSON.stringify(out, null, 2) + '\n');
else for (const [k, v] of Object.entries(out)) process.stdout.write(`${k}=${Array.isArray(v) ? v.join(',') : v}\n`);
