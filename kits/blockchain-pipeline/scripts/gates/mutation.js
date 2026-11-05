#!/usr/bin/env node
// mutation.js — run mutation testing and write .pipeline/mutation.json, read by gate 3.
//   EVM     : Gambit generates mutants (gambit mutate --json gambit.json), each mutant replaces its source file and
//             the suite runs (forge test); a failing suite = mutant killed. The original file is always restored.
//   Soroban : cargo mutants; counts read from mutants.out/outcomes.json.
// The score is tied to the content hash of contracts/, src/, test/, script/: any later change invalidates it.
// Formats of gambit_results.json and outcomes.json are to be checked against the installed versions.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');
const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const cfg = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, '.pipeline/config.json'), 'utf8')); } catch (_) { return {}; } })();
const sh = (cmd) => spawnSync('bash', ['-c', cmd], { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const hash = () => execFileSync('node', [path.join(__dirname, 'gates.js'), 'hash'], { cwd: ROOT, encoding: 'utf8' }).trim();
const before = hash();
let killed = 0, survived = 0; const survivors = [];

if (cfg.chain === 'soroban') {
  const r = sh((cfg.commands && cfg.commands.mutation) || 'cargo mutants --workspace --no-shuffle');
  const f = path.join(ROOT, 'mutants.out', 'outcomes.json');
  if (!fs.existsSync(f)) { console.error(`cargo mutants n'a pas produit ${f}\n${(r.stdout || '') + (r.stderr || '')}`.slice(0, 2000)); process.exit(1); }
  const o = JSON.parse(fs.readFileSync(f, 'utf8'));
  killed = (o.caught || 0) + (o.timeout || 0); survived = o.missed || 0;
  for (const x of o.outcomes || []) if (/Missed/.test(String(x.summary))) survivors.push(JSON.stringify(x.scenario).slice(0, 160));
} else {
  const conf = cfg.gambit_config || 'gambit.json';
  if (!fs.existsSync(path.join(ROOT, conf))) { console.error(`${conf} absent : écrire la configuration Gambit (fichiers de contracts/ à muter, solc_remappings).`); process.exit(1); }
  const g = sh(`gambit mutate --json ${conf}`);
  if (g.status !== 0) { console.error(`gambit mutate a échoué :\n${(g.stdout || '') + (g.stderr || '')}`.slice(0, 2000)); process.exit(1); }
  const outDir = path.join(ROOT, cfg.gambit_outdir || 'gambit_out');
  const list = JSON.parse(fs.readFileSync(path.join(outDir, 'gambit_results.json'), 'utf8'));
  const test = (cfg.commands && cfg.commands.mutation_test) || 'forge test --no-match-path "test/{exploits,audit,fork,upgrade}/**"';
  for (const m of list) {
    const orig = path.join(ROOT, m.original);
    const saved = fs.readFileSync(orig);
    try {
      fs.writeFileSync(orig, fs.readFileSync(path.join(outDir, m.name)));
      const r = sh(test);
      if (r.status === 0) { survived++; survivors.push(`${m.id} ${m.original}: ${m.description || ''}`.trim()); } else killed++;
    } finally { fs.writeFileSync(orig, saved); }
    process.stdout.write(`\rmutants: ${killed + survived}/${list.length} (tués ${killed})`);
  }
  process.stdout.write('\n');
}
if (hash() !== before) { console.error('le code a changé pendant la mutation : résultat écarté'); process.exit(1); }
const out = { ts: new Date().toISOString(), tool: cfg.chain === 'soroban' ? 'cargo-mutants' : 'gambit', content_hash: before, killed, survived, score: killed + survived ? +(100 * killed / (killed + survived)).toFixed(1) : 0, survivors };
fs.mkdirSync(path.join(ROOT, '.pipeline'), { recursive: true });
fs.writeFileSync(path.join(ROOT, '.pipeline', 'mutation.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`mutation score ${out.score} % (${killed}/${killed + survived}) → .pipeline/mutation.json`);
