#!/usr/bin/env node
/**
 * blockchain-pipeline.js — install the blockchain multi-agent pipeline (v2) kit into a project.
 *
 * node scripts/blockchain-pipeline.js [--target DIR] [--project NAME] [--chain evm|soroban] [--network NAME] [--force] [--dry-run]
 *
 * Copies kits/blockchain-pipeline/ into the project: CLAUDE.md (orchestrator), .claude/{agents,hooks,settings.json},
 * docs/templates/, docs/pipeline.md, docs/00-projet.md, scripts/gates/, Makefile.pipeline, .pipeline/config.json,
 * and the working directories. Existing files are kept unless --force; .claude/settings.json is merged, never replaced;
 * an existing CLAUDE.md gets one import line (@CLAUDE.pipeline.md) instead of being overwritten.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const KIT = path.join(ROOT, 'kits', 'blockchain-pipeline');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f, d) => { const i = args.indexOf(f); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
if (flag('--help') || flag('-h')) { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }

const TARGET = path.resolve(opt('--target', process.cwd()));
const CHAIN = opt('--chain', 'evm');
const NETWORK = opt('--network', CHAIN === 'soroban' ? 'testnet' : 'sepolia');
const PROJECT = opt('--project', path.basename(TARGET));
const FORCE = flag('--force');
const DRY = flag('--dry-run');
if (!['evm', 'soroban'].includes(CHAIN)) { console.error(`--chain doit valoir evm ou soroban (reçu : ${CHAIN})`); process.exit(2); }
if (!fs.existsSync(KIT)) { console.error(`kit introuvable : ${KIT}`); process.exit(1); }

const report = { created: [], kept: [], merged: [], overwritten: [] };
const rel = (p) => path.relative(TARGET, p) || '.';
function write(dest, content, { mode } = {}) {
  const exists = fs.existsSync(dest);
  if (exists && !FORCE) { report.kept.push(rel(dest)); return; }
  (exists ? report.overwritten : report.created).push(rel(dest));
  if (DRY) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
  if (mode) fs.chmodSync(dest, mode);
}
function copyTree(src, dest) {
  if (!fs.existsSync(src)) return;
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) copyTree(s, d);
    else write(d, fs.readFileSync(s), { mode: /\.(sh|js)$/.test(e.name) && /scripts|hooks/.test(s) ? 0o755 : undefined });
  }
}
function mergeSettings(src, dest) {
  const kit = JSON.parse(fs.readFileSync(src, 'utf8'));
  if (!fs.existsSync(dest)) { write(dest, JSON.stringify(kit, null, 2) + '\n'); return; }
  const cur = JSON.parse(fs.readFileSync(dest, 'utf8'));
  cur.permissions = cur.permissions || {};
  cur.permissions.deny = [...new Set([...(cur.permissions.deny || []), ...kit.permissions.deny])];
  cur.hooks = cur.hooks || {};
  for (const [event, groups] of Object.entries(kit.hooks)) {
    cur.hooks[event] = cur.hooks[event] || [];
    for (const g of groups) {
      const cmd = g.hooks[0].command;
      if (!cur.hooks[event].some((x) => (x.hooks || []).some((h) => h.command === cmd))) cur.hooks[event].push(g);
    }
  }
  report.merged.push(rel(dest));
  if (!DRY) fs.writeFileSync(dest, JSON.stringify(cur, null, 2) + '\n');
}
function appendLines(dest, lines, marker) {
  const cur = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : '';
  const missing = lines.filter((l) => !cur.split('\n').includes(l));
  if (!missing.length) return;
  report.merged.push(rel(dest));
  if (!DRY) fs.writeFileSync(dest, cur + (cur && !cur.endsWith('\n') ? '\n' : '') + (marker ? `${marker}\n` : '') + missing.join('\n') + '\n');
}

// 1. agents, hooks, settings
copyTree(path.join(KIT, 'claude', 'agents'), path.join(TARGET, '.claude', 'agents'));
copyTree(path.join(KIT, 'claude', 'hooks'), path.join(TARGET, '.claude', 'hooks'));
if (CHAIN !== 'evm') {
  const variant = path.join(KIT, 'variants', CHAIN, 'claude', 'agents');
  for (const f of fs.readdirSync(variant)) {
    const d = path.join(TARGET, '.claude', 'agents', f);
    const was = fs.existsSync(d) && !report.created.includes(rel(d));
    if (was && !FORCE) { report.kept.push(rel(d) + ` (variante ${CHAIN} non appliquée)`); continue; }
    report.overwritten.push(rel(d) + ` (variante ${CHAIN})`);
    if (!DRY) fs.writeFileSync(d, fs.readFileSync(path.join(variant, f)));
  }
}
mergeSettings(path.join(KIT, 'claude', 'settings.json'), path.join(TARGET, '.claude', 'settings.json'));

// 2. orchestrator
const claudeMd = path.join(TARGET, 'CLAUDE.md');
const orchestrator = fs.readFileSync(path.join(KIT, 'CLAUDE.md'), 'utf8');
if (!fs.existsSync(claudeMd)) write(claudeMd, orchestrator);
else if (!/pipeline multi-agents blockchain/i.test(fs.readFileSync(claudeMd, 'utf8'))) {
  write(path.join(TARGET, 'CLAUDE.pipeline.md'), orchestrator);
  appendLines(claudeMd, ['@CLAUDE.pipeline.md'], '\n<!-- Pipeline multi-agents blockchain (Forge) -->');
} else report.kept.push('CLAUDE.md (pipeline déjà présent)');

// 3. docs, gates, make
copyTree(path.join(KIT, 'docs', 'templates'), path.join(TARGET, 'docs', 'templates'));
write(path.join(TARGET, 'docs', 'pipeline.md'), fs.readFileSync(path.join(ROOT, 'playbooks', 'blockchain-pipeline.md')));
const projet = fs.readFileSync(path.join(KIT, 'docs', 'templates', '00-projet.md'), 'utf8').replace('<Nom du projet>', PROJECT)
  .replace('Réglementaires (MiCA', `Chaîne cible : ${CHAIN === 'soroban' ? 'Stellar / Soroban' : 'EVM'} (réseau de déploiement : ${NETWORK}).\nRéglementaires (MiCA`);
write(path.join(TARGET, 'docs', '00-projet.md'), projet);
copyTree(path.join(KIT, 'scripts', 'gates'), path.join(TARGET, 'scripts', 'gates'));
write(path.join(TARGET, 'Makefile.pipeline'), fs.readFileSync(path.join(KIT, 'Makefile.pipeline')));
const mk = path.join(TARGET, 'Makefile');
if (!fs.existsSync(mk)) write(mk, 'include Makefile.pipeline\n');
else appendLines(mk, ['include Makefile.pipeline']);

// 4. pipeline state
const config = JSON.parse(fs.readFileSync(path.join(KIT, 'docs', 'templates', 'json', 'config.json'), 'utf8'));
Object.assign(config, { chain: CHAIN, network: NETWORK });
if (CHAIN === 'soroban') {
  delete config.explorer_api;
  Object.assign(config, { stellar_testnet: false, horizon_url: 'https://horizon-testnet.stellar.org', waivers: {} });
}
write(path.join(TARGET, '.pipeline', 'config.json'), JSON.stringify(config, null, 2) + '\n');
write(path.join(TARGET, '.pipeline', 'current-agent'), 'orchestrateur\n');

// 5. working directories
const t = CHAIN === 'soroban' ? 'test/src' : 'test';
for (const d of ['contracts/interfaces', `${t}/base`, `${t}/invariants`, 'test/symbolic', ...(CHAIN === 'soroban' ? ['test/src/suite'] : []), `${t}/fork`, `${t}/exploits`, `${t}/audit`, `${t}/upgrade`,
  'script', 'deployments/proposals', 'monitor/incidents', 'docs/audit', 'docs/audit-externe', 'docs/07-livrable']) {
  const keep = path.join(TARGET, d, '.gitkeep');
  if (!fs.existsSync(path.join(TARGET, d))) { report.created.push(d + '/'); if (!DRY) { fs.mkdirSync(path.dirname(keep), { recursive: true }); fs.writeFileSync(keep, ''); } }
}
appendLines(path.join(TARGET, '.gitignore'), ['.env', '.env.*', 'lcov.info', 'gambit_out/', 'mutants.out/', 'out/', 'cache/', 'broadcast/', 'target/'], '# blockchain pipeline');

// report
const show = (k, label) => report[k].length && console.log(`${label} (${report[k].length})\n  ` + report[k].join('\n  '));
console.log(`${DRY ? '[dry-run] ' : ''}Kit pipeline blockchain v2 → ${TARGET} (chaîne ${CHAIN}, réseau ${NETWORK})`);
show('created', 'créés'); show('overwritten', 'remplacés'); show('merged', 'fusionnés'); show('kept', 'conservés (existants, --force pour remplacer)');
console.log(`
Suite :
  1. Compléter docs/00-projet.md (brief, périmètre, contraintes) et le valider.
  2. Vérifier la version de Claude Code : les hooks lisent tool_input.file_path, tool_input.command et agent_type.
  3. ${CHAIN === 'soroban' ? 'Installer stellar-cli, komet, cargo-scout-audit, cargo-llvm-cov, cargo-mutants ; renseigner dans .pipeline/config.json dry_run, storage_check et formal (Sunbeam) ou une dérogation motivée ; stellar_testnet reste à false sauf décision écrite.' : 'Installer forge, halmos, slither, gambit ; écrire gambit.json avant la gate 3.'}
  4. Lancer l'orchestrateur : « Démarre l'étape 1 (analyste) ».`);
