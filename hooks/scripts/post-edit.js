#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit): format JS/TS/Python with the project's formatter when present,
// warn about debug statements, optional typecheck (FORGE_TYPECHECK=1). Fails silently.
'use strict';
const { readStdin, disabled, projectDir, context, stateDir, fs, path } = require('./lib');
const { spawnSync } = require('child_process');
if (disabled()) process.exit(0);
const input = readStdin();
const file = input.tool_input && (input.tool_input.file_path || input.tool_input.path);
if (!file || !fs.existsSync(file)) process.exit(0);
const cwd = projectDir(input);
const notes = [];

function findUp(start, names) {
  let dir = path.dirname(path.resolve(start));
  for (;;) {
    for (const n of names) if (fs.existsSync(path.join(dir, n))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
function run(bin, args, dir) {
  const r = spawnSync(bin, args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 });
  return r.status === 0;
}

const ext = path.extname(file).toLowerCase();
if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.css', '.md', '.vue'].includes(ext)) {
  const biomeRoot = findUp(file, ['biome.json', 'biome.jsonc']);
  const prettierRoot = findUp(file, ['.prettierrc', '.prettierrc.json', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.yaml', '.prettierrc.yml', 'prettier.config.js', 'prettier.config.mjs', 'prettier.config.cjs']);
  const root = biomeRoot || prettierRoot;
  if (root) {
    const bin = path.join(root, 'node_modules', '.bin', biomeRoot ? 'biome' : 'prettier');
    if (fs.existsSync(bin)) {
      const ok = biomeRoot ? run(bin, ['format', '--write', file], root) : run(bin, ['--write', '--log-level', 'silent', file], root);
      if (ok) notes.push(`formatted with ${biomeRoot ? 'biome' : 'prettier'}`);
    }
  }
  if (process.env.FORGE_TYPECHECK === '1' && ['.ts', '.tsx'].includes(ext)) {
    const tsRoot = findUp(file, ['tsconfig.json']);
    const tsc = tsRoot && path.join(tsRoot, 'node_modules', '.bin', 'tsc');
    if (tsc && fs.existsSync(tsc)) {
      const r = spawnSync(tsc, ['--noEmit', '-p', tsRoot], { cwd: tsRoot, stdio: ['ignore', 'pipe', 'pipe'], timeout: 50000 });
      if (r.status !== 0) notes.push('tsc --noEmit reports errors:\n' + String(r.stdout || r.stderr).split('\n').slice(0, 15).join('\n'));
    }
  }
}
if (ext === '.py') {
  const pyRoot = findUp(file, ['pyproject.toml', 'ruff.toml', 'setup.cfg']);
  if (pyRoot) {
    const cfg = fs.existsSync(path.join(pyRoot, 'pyproject.toml')) ? fs.readFileSync(path.join(pyRoot, 'pyproject.toml'), 'utf8') : '';
    if (/\[tool\.ruff/.test(cfg) || fs.existsSync(path.join(pyRoot, 'ruff.toml'))) { if (run('ruff', ['format', file], pyRoot)) notes.push('formatted with ruff'); }
    else if (/\[tool\.black/.test(cfg)) { if (run('black', ['-q', file], pyRoot)) notes.push('formatted with black'); }
  }
}
if (['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'].includes(ext) && !/\.(test|spec)\./.test(file) && !/\/(scripts|hooks|bin)\//.test(file)) {
  const src = fs.readFileSync(file, 'utf8');
  const n = (src.match(/^\s*console\.(log|debug)\(/gm) || []).length;
  const dbg = (src.match(/^\s*debugger;?/gm) || []).length;
  if (n || dbg) notes.push(`${path.basename(file)} contains ${n} console.log/debug and ${dbg} debugger statement(s); remove before committing.`);
}
if (ext === '.py') {
  const src = fs.readFileSync(file, 'utf8');
  const n = (src.match(/^\s*(print\(|breakpoint\(\)|import pdb)/gm) || []).length;
  if (n && !/test/.test(file)) notes.push(`${path.basename(file)} contains ${n} print/breakpoint/pdb statement(s).`);
}
try { fs.writeFileSync(path.join(stateDir(cwd), 'last-edit'), new Date().toISOString()); } catch (_) { /* ignore */ }
if (notes.length) context('PostToolUse', '[Forge] ' + notes.join(' | '));
process.exit(0);
