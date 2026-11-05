'use strict';
// Shared helpers for the pipeline hooks and gates. Node >= 18, no dependencies (no jq).
const fs = require('fs');
const path = require('path');

function readStdin() {
  try { const raw = fs.readFileSync(0, 'utf8'); return raw.trim() ? JSON.parse(raw) : {}; } catch (_) { return {}; }
}
function projectDir(input) {
  return process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || process.cwd();
}
function loadPerimeters(root) {
  return JSON.parse(fs.readFileSync(path.join(root, '.claude', 'hooks', 'perimeters.json'), 'utf8'));
}
// Agent identity: the subagent type given by Claude Code in the hook input when the call comes from a subagent,
// otherwise the name the orchestrator wrote in .pipeline/current-agent, otherwise the orchestrator itself.
function currentAgent(root, input) {
  const fromInput = input && (input.agent_type || input.subagent_type);
  if (fromInput) return String(fromInput).trim();
  try { const s = fs.readFileSync(path.join(root, '.pipeline', 'current-agent'), 'utf8').trim(); if (s) return s; } catch (_) {}
  return 'orchestrateur';
}
function ruleFor(perims, agent) {
  if (perims.agents[agent]) return { rule: perims.agents[agent], cls: '' };
  const m = agent.match(/^auditeur-(.+)$/);
  if (m && perims.agents['auditeur-*']) return { rule: perims.agents['auditeur-*'], cls: m[1] };
  return null;
}
function relPath(root, file) {
  if (!file) return '';
  const abs = path.resolve(root, file);
  return path.relative(root, abs).split(path.sep).join('/');
}
// true | string (reason)
function allowed(perims, agent, rel) {
  if (rel.startsWith('..') || path.isAbsolute(rel)) return `hors du projet (${rel})`;
  if (new RegExp(perims.always).test(rel)) return true;
  const r = ruleFor(perims, agent);
  if (!r) return `agent inconnu du pipeline : ${agent}`;
  const esc = r.cls.replace(/[^a-z0-9-]/gi, '');
  const allow = new RegExp(r.rule.allow.replace(/\{class\}/g, esc));
  const deny = r.rule.deny ? new RegExp(r.rule.deny.replace(/\{class\}/g, esc)) : null;
  if (!allow.test(rel)) return `hors périmètre (${r.rule.allow.replace(/\{class\}/g, esc)})`;
  if (deny && deny.test(rel)) return `zone réservée à un autre agent (${r.rule.deny})`;
  return true;
}
module.exports = { readStdin, projectDir, loadPerimeters, currentAgent, ruleFor, relPath, allowed };
