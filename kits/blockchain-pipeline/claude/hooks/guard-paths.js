#!/usr/bin/env node
// PreToolUse(Edit|Write|MultiEdit|NotebookEdit): each pipeline agent writes only inside its perimeter (exit 2 = blocked).
// Perimeters: .claude/hooks/perimeters.json. Bash writes are not seen here: every gate re-checks `git status` against the perimeter.
'use strict';
const { readStdin, projectDir, loadPerimeters, currentAgent, relPath, allowed } = require('./lib');
const input = readStdin();
const ti = input.tool_input || {};
const file = ti.file_path || ti.notebook_path || ti.path || '';
if (!file) process.exit(0);
const root = projectDir(input);
let perims;
try { perims = loadPerimeters(root); } catch (e) { process.stderr.write(`[pipeline] perimeters.json illisible : ${e.message}. Écriture refusée.\n`); process.exit(2); }
const agent = currentAgent(root, input);
const rel = relPath(root, file);
const verdict = allowed(perims, agent, rel);
if (verdict !== true) {
  process.stderr.write(`[pipeline] Écriture refusée pour ${agent} : ${rel} — ${verdict}.\nSi ce fichier relève d'un autre agent, consigne le besoin dans la section « Écarts et questions » de ton artefact.\n`);
  process.exit(2);
}
process.exit(0);
