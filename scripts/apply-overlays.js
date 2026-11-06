#!/usr/bin/env node
// apply-overlays.js — append Forge sections to imported files without editing them in place.
//
//   node scripts/apply-overlays.js           apply every overlays/<path> to <path> (idempotent)
//   node scripts/apply-overlays.js --root <repo>  apply in another checkout (used by sync-upstream.py)
//   node scripts/apply-overlays.js --check   exit 1 if a target is missing its overlay or carries a stale one
//
// overlays/<rel path> mirrors the file it extends (e.g. overlays/roster/security/blockchain-security-auditor.md).
// The overlay is written at the end of the target between the markers below; any previous block is replaced.
// scripts/sync-upstream.py runs this after regenerating imported files, so Forge additions survive a re-sync.
'use strict';
const fs = require('fs');
const path = require('path');
const ri = process.argv.indexOf('--root');
const ROOT = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'overlays');
const START = '<!-- forge-overlay:start (source: overlays/{rel}; edit there, then run node scripts/apply-overlays.js) -->';
const END = '<!-- forge-overlay:end -->';
const CHECK = process.argv.includes('--check');
const walk = (d, out = []) => { if (!fs.existsSync(d)) return out; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : p.endsWith('.md') && out.push(p); } return out; };
let bad = 0, done = 0;
for (const f of walk(DIR)) {
  const rel = path.relative(DIR, f).split(path.sep).join('/');
  const target = path.join(ROOT, rel);
  if (!fs.existsSync(target)) { console.error(`ERROR  overlay without target: overlays/${rel}`); bad++; continue; }
  const cur = fs.readFileSync(target, 'utf8');
  const i = cur.indexOf('<!-- forge-overlay:start');
  const base = (i >= 0 ? cur.slice(0, i) : cur).replace(/\s+$/, '');
  const next = `${base}\n\n${START.replace('{rel}', rel)}\n\n${fs.readFileSync(f, 'utf8').trim()}\n\n${END}\n`;
  if (next === cur) continue;
  if (CHECK) { console.error(`ERROR  overlay not applied or stale: ${rel} (run node scripts/apply-overlays.js)`); bad++; continue; }
  fs.writeFileSync(target, next); done++; console.log(`applied overlays/${rel}`);
}
if (!CHECK) console.log(`${done} overlay(s) applied`);
process.exit(bad ? 1 : 0);
