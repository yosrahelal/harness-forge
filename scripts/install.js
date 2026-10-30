#!/usr/bin/env node
/**
 * install.js — install Forge assets outside the plugin system (manual / per-project install).
 *
 * node scripts/install.js --list
 * node scripts/install.js --scope user|project [--auto] [--division a,b] [--agent slug,slug]
 *                         [--rules common,typescript,...] [--skills] [--hooks] [--core] [--all] [--dry-run] [--uninstall]
 *
 * --scope user    → ~/.claude   (or $CLAUDE_CONFIG_DIR)
 * --scope project → ./.claude   (default)
 * --auto          → detect the stack and pick rules + roster/languages reviewers accordingly
 * --core          → copy agents/ (core) ; --skills → copy all skills ; --hooks → merge hooks into settings.json
 * --all           → core + skills + hooks + common rules + every roster division
 *
 * Copies are tracked in <scope>/.forge-install.json so --uninstall removes exactly what was installed.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const DRY = flag('--dry-run');

const STACK_RULES = [
  [['package.json'], 'typescript'], [['tsconfig.json'], 'typescript'], [['next.config.js', 'next.config.mjs', 'next.config.ts'], 'react'],
  [['pyproject.toml', 'requirements.txt', 'setup.py'], 'python'], [['go.mod'], 'golang'], [['Cargo.toml'], 'rust'],
  [['pom.xml', 'build.gradle', 'build.gradle.kts'], 'java'], [['Gemfile'], 'ruby'], [['composer.json'], 'php'],
  [['pubspec.yaml'], 'dart'], [['Package.swift'], 'swift'], [['*.csproj', '*.sln'], 'csharp'], [['CMakeLists.txt'], 'cpp'],
  [['nuxt.config.ts', 'nuxt.config.js'], 'nuxt'], [['angular.json'], 'angular'], [['app.json', 'expo'], 'react-native'],
];
const STACK_AGENTS = {
  typescript: ['typescript-reviewer'], react: ['react-reviewer', 'react-build-resolver'], python: ['python-reviewer'],
  golang: ['go-reviewer', 'go-build-resolver'], rust: ['rust-reviewer', 'rust-build-resolver'], java: ['java-reviewer', 'java-build-resolver'],
  ruby: ['ruby-reviewer'], php: ['php-reviewer'], dart: ['flutter-reviewer', 'dart-build-resolver'], swift: ['swift-reviewer', 'swift-build-resolver'],
  csharp: ['csharp-reviewer'], cpp: ['cpp-reviewer', 'cpp-build-resolver'], nuxt: ['vue-reviewer'], angular: [], 'react-native': ['react-reviewer'],
};

function listDivisions() {
  const r = path.join(ROOT, 'roster');
  return fs.readdirSync(r).filter((d) => fs.statSync(path.join(r, d)).isDirectory());
}
function listAgents(division) {
  return fs.readdirSync(path.join(ROOT, 'roster', division)).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
}
function detectStack(cwd) {
  const found = new Set();
  const pkg = fs.existsSync(path.join(cwd, 'package.json')) ? JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8')) : null;
  for (const [files, rule] of STACK_RULES) {
    for (const f of files) {
      if (f.includes('*')) { const re = new RegExp(f.replace('.', '\\.').replace('*', '.*') + '$'); if (fs.readdirSync(cwd).some((x) => re.test(x))) found.add(rule); }
      else if (fs.existsSync(path.join(cwd, f))) found.add(rule);
    }
  }
  if (pkg) {
    const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies);
    if (deps.react || deps.next) found.add('react');
    if (deps.vue || deps.nuxt) found.add('vue');
    if (deps['react-native'] || deps.expo) found.add('react-native');
    if (deps['@angular/core']) found.add('angular');
    if (!deps.typescript && !fs.existsSync(path.join(cwd, 'tsconfig.json'))) { found.delete('typescript'); found.add('web'); }
  }
  return [...found];
}

if (flag('--list')) {
  console.log('Core agents (always loaded by the plugin):');
  console.log('  ' + fs.readdirSync(path.join(ROOT, 'agents')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).join(', '));
  console.log('\nRoster divisions (opt-in):');
  for (const d of listDivisions()) console.log(`  ${d.padEnd(20)} ${listAgents(d).join(', ')}`);
  console.log('\nRules: ' + fs.readdirSync(path.join(ROOT, 'rules')).filter((d) => fs.statSync(path.join(ROOT, 'rules', d)).isDirectory()).join(', '));
  console.log('\nSkill categories: ' + fs.readdirSync(path.join(ROOT, 'skills')).join(', '));
  process.exit(0);
}

const scope = opt('--scope') || 'project';
const cwd = process.cwd();
const dest = scope === 'user' ? (process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude')) : path.join(cwd, '.claude');
const manifestPath = path.join(dest, '.forge-install.json');
let manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { files: [], hooks: false };

function copyFile(src, rel) {
  const target = path.join(dest, rel);
  if (DRY) { console.log('would copy', rel); return; }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(src, target);
  if (!manifest.files.includes(rel)) manifest.files.push(rel);
}
function copyDir(src, relBase) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const r = path.join(relBase, entry.name);
    if (entry.isDirectory()) copyDir(s, r); else copyFile(s, r);
  }
}

if (flag('--uninstall')) {
  for (const rel of manifest.files) { const f = path.join(dest, rel); if (fs.existsSync(f) && !DRY) fs.unlinkSync(f); }
  if (manifest.hooks && !DRY) removeHooks();
  if (!DRY) { try { fs.unlinkSync(manifestPath); } catch (_) { /* */ } }
  console.log(`Removed ${manifest.files.length} files from ${dest}`);
  process.exit(0);
}

const all = flag('--all');
let divisions = (opt('--division') || '').split(',').filter(Boolean);
let agents = (opt('--agent') || '').split(',').filter(Boolean);
let rules = (opt('--rules') || '').split(',').filter(Boolean);
if (all) { divisions = listDivisions(); rules = ['common']; }
if (flag('--auto')) {
  const stack = detectStack(cwd);
  console.log('Detected stack:', stack.join(', ') || '(unknown)');
  rules.push('common', ...stack.filter((s) => fs.existsSync(path.join(ROOT, 'rules', s))));
  for (const s of stack) agents.push(...(STACK_AGENTS[s] || []));
}

// core agents
if (flag('--core') || all) copyDir(path.join(ROOT, 'agents'), 'agents');
// roster divisions / agents
for (const d of divisions) {
  if (!fs.existsSync(path.join(ROOT, 'roster', d))) { console.error(`unknown division: ${d}`); continue; }
  copyDir(path.join(ROOT, 'roster', d), 'agents');
}
for (const a of [...new Set(agents)]) {
  const hit = listDivisions().map((d) => path.join(ROOT, 'roster', d, a + '.md')).find((p) => fs.existsSync(p))
    || (fs.existsSync(path.join(ROOT, 'agents', a + '.md')) ? path.join(ROOT, 'agents', a + '.md') : null);
  if (!hit) { console.error(`unknown agent: ${a}`); continue; }
  copyFile(hit, path.join('agents', a + '.md'));
}
// rules
for (const r of [...new Set(rules)]) {
  const src = path.join(ROOT, 'rules', r);
  if (!fs.existsSync(src)) { console.error(`unknown rules set: ${r}`); continue; }
  copyDir(src, path.join('rules', r));
}
// skills
if (flag('--skills') || all) {
  for (const cat of fs.readdirSync(path.join(ROOT, 'skills'))) {
    for (const sk of fs.readdirSync(path.join(ROOT, 'skills', cat))) copyDir(path.join(ROOT, 'skills', cat, sk), path.join('skills', sk));
  }
}
// hooks
function settingsPath() { return path.join(dest, 'settings.json'); }
function loadSettings() { try { return JSON.parse(fs.readFileSync(settingsPath(), 'utf8')); } catch (_) { return {}; } }
function installHooks() {
  const hooks = JSON.parse(fs.readFileSync(path.join(ROOT, 'hooks', 'hooks.json'), 'utf8')).hooks;
  const settings = loadSettings();
  settings.hooks = settings.hooks || {};
  for (const [event, entries] of Object.entries(hooks)) {
    settings.hooks[event] = (settings.hooks[event] || []).filter((e) => !JSON.stringify(e).includes('forge-hook'));
    for (const e of entries) {
      const clone = JSON.parse(JSON.stringify(e));
      for (const h of clone.hooks) { h.command = h.command.replace('${CLAUDE_PLUGIN_ROOT}', ROOT); h.forgeId = 'forge-hook'; }
      settings.hooks[event].push(clone);
    }
  }
  if (!DRY) fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2) + '\n');
  manifest.hooks = true;
  console.log('Hooks merged into', settingsPath());
}
function removeHooks() {
  const settings = loadSettings();
  if (!settings.hooks) return;
  for (const event of Object.keys(settings.hooks)) settings.hooks[event] = settings.hooks[event].filter((e) => !JSON.stringify(e).includes('forge-hook'));
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2) + '\n');
}
if (flag('--hooks') || all) installHooks();

if (!DRY) { fs.mkdirSync(dest, { recursive: true }); fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n'); }
console.log(`${DRY ? '[dry-run] ' : ''}Installed ${manifest.files.length} files into ${dest}` + (manifest.hooks ? ' (+hooks)' : ''));
if (!flag('--core') && !all && !divisions.length && !agents.length && !rules.length && !flag('--skills') && !flag('--hooks')) {
  console.log('Nothing selected. Try: --auto, --core, --division engineering,testing, --rules common,typescript, --skills, --hooks, --all, or --list');
}
