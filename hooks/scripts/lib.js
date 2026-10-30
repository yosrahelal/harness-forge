'use strict';
// Shared helpers for Forge hooks. No dependencies, Node >= 18.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function readStdin() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
}
function disabled() {
  const v = (process.env.FORGE_HOOKS || '').toLowerCase();
  return v === 'off' || v === '0' || v === 'false';
}
function projectDir(input) {
  return input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
}
function git(cmd, cwd) {
  try { return execSync(`git ${cmd}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'], timeout: 4000 }).toString().trim(); }
  catch (_) { return ''; }
}
function stateDir(cwd) {
  const d = path.join(cwd, '.forge', 'state');
  fs.mkdirSync(d, { recursive: true });
  ensureForgeGitignore(cwd);
  return d;
}
function ensureForgeGitignore(cwd) {
  const f = path.join(cwd, '.forge', '.gitignore');
  if (!fs.existsSync(path.join(cwd, '.forge'))) return;
  if (!fs.existsSync(f)) fs.writeFileSync(f, 'sessions/\nstate/\n');
}
function context(eventName, text) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: eventName, additionalContext: text } }) + '\n');
}
function detectPackageManager(cwd) {
  const has = (f) => fs.existsSync(path.join(cwd, f));
  if (has('bun.lockb') || has('bun.lock')) return 'bun';
  if (has('pnpm-lock.yaml')) return 'pnpm';
  if (has('yarn.lock')) return 'yarn';
  if (has('package-lock.json') || has('package.json')) return 'npm';
  if (has('uv.lock')) return 'uv';
  if (has('poetry.lock')) return 'poetry';
  if (has('pyproject.toml') || has('requirements.txt')) return 'pip';
  if (has('Cargo.toml')) return 'cargo';
  if (has('go.mod')) return 'go';
  if (has('pom.xml')) return 'maven';
  if (has('build.gradle') || has('build.gradle.kts')) return 'gradle';
  if (has('Gemfile')) return 'bundler';
  if (has('composer.json')) return 'composer';
  if (has('pubspec.yaml')) return 'flutter';
  if (has('Package.swift')) return 'swiftpm';
  return null;
}
module.exports = { readStdin, disabled, projectDir, git, stateDir, context, detectPackageManager, fs, path };
