#!/usr/bin/env node
// validate.js — structural checks: frontmatter present, unique names, descriptions within limits, commands have descriptions,
// plugin.json paths exist, hooks.json parses, no leftover upstream prefixes.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
let errors = 0, warnings = 0;
const err = (m) => { errors++; console.error('ERROR  ' + m); };
const warn = (m) => { warnings++; console.warn('WARN   ' + m); };

function frontmatter(file) {
  const s = fs.readFileSync(file, 'utf8');
  if (!s.startsWith('---')) return null;
  const end = s.indexOf('\n---', 3);
  if (end === -1) return null;
  const fm = {};
  for (const line of s.slice(4, end).split('\n')) {
    const m = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return fm;
}
function walk(dir, pred, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, pred, out); else if (pred(p)) out.push(p);
  }
  return out;
}

// agents + roster
const agentNames = new Map();
for (const f of [...walk(path.join(ROOT, 'agents'), (p) => p.endsWith('.md')), ...walk(path.join(ROOT, 'roster'), (p) => p.endsWith('.md'))]) {
  const fm = frontmatter(f);
  if (!fm) { err(`no frontmatter: ${f}`); continue; }
  if (!fm.name) err(`agent without name: ${f}`);
  if (!fm.description) err(`agent without description: ${f}`);
  if (fm.name !== path.basename(f, '.md')) warn(`agent name '${fm.name}' differs from file ${path.relative(ROOT, f)}`);
  if (agentNames.has(fm.name)) err(`duplicate agent name '${fm.name}': ${agentNames.get(fm.name)} and ${f}`);
  agentNames.set(fm.name, f);
  if (fm.description && fm.description.length > 1024) warn(`description > 1024 chars: ${path.relative(ROOT, f)}`);
}
// skills
const skillNames = new Map();
for (const f of walk(path.join(ROOT, 'skills'), (p) => p.endsWith('SKILL.md'))) {
  const fm = frontmatter(f);
  if (!fm) { err(`no frontmatter: ${f}`); continue; }
  if (!fm.name) err(`skill without name: ${f}`);
  if (!fm.description) err(`skill without description: ${f}`);
  if (fm.name !== path.basename(path.dirname(f))) err(`skill name '${fm.name}' != dir ${path.relative(ROOT, f)}`);
  if (skillNames.has(fm.name)) err(`duplicate skill name '${fm.name}'`);
  skillNames.set(fm.name, f);
  if (agentNames.has(fm.name)) warn(`skill and agent share the name '${fm.name}' (allowed, but check intent)`);
}
// commands
for (const f of walk(path.join(ROOT, 'commands'), (p) => p.endsWith('.md'))) {
  const fm = frontmatter(f);
  if (!fm || !fm.description) err(`command without description: ${f}`);
}
// leftovers
for (const f of walk(ROOT, (p) => p.endsWith('.md') && !p.includes('/upstream/') && !p.includes('/docs/SOURCES'))) {
  const s = fs.readFileSync(f, 'utf8');
  if (/agent-skills:[a-z]/.test(s)) err(`leftover 'agent-skills:' prefix in ${path.relative(ROOT, f)}`);
  if (/(?<![\w/])ecc:[a-z]/.test(s)) err(`leftover 'ecc:' prefix in ${path.relative(ROOT, f)}`);
  if (/setup-matt-pocock-skills/.test(s)) err(`leftover setup-matt-pocock-skills in ${path.relative(ROOT, f)}`);
}
// plugin manifest
const plugin = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
for (const p of [...plugin.agents, ...plugin.skills, ...plugin.commands, plugin.hooks]) {
  if (!fs.existsSync(path.join(ROOT, p))) err(`plugin.json path missing: ${p}`);
}
JSON.parse(fs.readFileSync(path.join(ROOT, 'hooks', 'hooks.json'), 'utf8'));

console.log(`agents: ${agentNames.size}  skills: ${skillNames.size}  commands: ${walk(path.join(ROOT, 'commands'), (p) => p.endsWith('.md')).length}  errors: ${errors}  warnings: ${warnings}`);
process.exit(errors ? 1 : 0);
