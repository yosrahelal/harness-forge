#!/usr/bin/env node
/**
 * new-feature.js — create specs/NNN-short-name/ from the spec template and record it as the active feature.
 *
 * Usage: node new-feature.js --name <kebab-short-name> [--json] [--branch] [--template <path>]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };

function fail(msg) {
  if (flag('--json')) process.stdout.write(JSON.stringify({ error: msg }) + '\n');
  else process.stderr.write('ERROR: ' + msg + '\n');
  process.exit(1);
}

const rawName = opt('--name');
if (!rawName) fail('--name <short-name> is required');
const name = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 5).join('-');
if (!name) fail('Could not derive a kebab-case name');

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
fs.mkdirSync(SPECS, { recursive: true });

const existing = fs.readdirSync(SPECS).filter((d) => /^\d{3}-/.test(d));
const next = existing.reduce((m, d) => Math.max(m, parseInt(d.slice(0, 3), 10)), 0) + 1;
const num = String(next).padStart(3, '0');
const dirName = `${num}-${name}`;
const FEATURE_DIR = path.join(SPECS, dirName);
if (fs.existsSync(FEATURE_DIR)) fail(`${FEATURE_DIR} already exists`);
fs.mkdirSync(path.join(FEATURE_DIR, 'checklists'), { recursive: true });

const template = opt('--template') || path.resolve(__dirname, '..', '..', 'templates', 'spec-template.md');
const projectOverride = path.join(ROOT, '.forge', 'templates', 'spec-template.md');
const tpl = fs.existsSync(projectOverride) ? projectOverride : template;
let content = fs.existsSync(tpl) ? fs.readFileSync(tpl, 'utf8') : '# Feature Specification: [FEATURE NAME]\n';
content = content.replace('[###-feature-name]', dirName).replace('[DATE]', new Date().toISOString().slice(0, 10));
const SPEC_FILE = path.join(FEATURE_DIR, 'spec.md');
fs.writeFileSync(SPEC_FILE, content);

fs.mkdirSync(path.join(ROOT, '.forge'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.forge', 'feature.json'), JSON.stringify({ feature_directory: path.relative(ROOT, FEATURE_DIR), updated: new Date().toISOString() }, null, 2) + '\n');

let BRANCH_NAME = null;
if (flag('--branch')) {
  try {
    execSync(`git checkout -b ${dirName}`, { cwd: ROOT, stdio: 'ignore' });
    BRANCH_NAME = dirName;
  } catch (e) {
    process.stderr.write(`warning: could not create branch ${dirName}: ${e.message}\n`);
  }
}

const out = { FEATURE_NUM: num, FEATURE_DIR, SPEC_FILE, BRANCH_NAME, TEMPLATE: tpl, CHECKLISTS_DIR: path.join(FEATURE_DIR, 'checklists') };
if (flag('--json')) process.stdout.write(JSON.stringify(out, null, 2) + '\n');
else for (const [k, v] of Object.entries(out)) process.stdout.write(`${k}=${v}\n`);
