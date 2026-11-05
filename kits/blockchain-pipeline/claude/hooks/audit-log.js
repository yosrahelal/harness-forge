#!/usr/bin/env node
// PostToolUse(*): one JSON line per tool call in .pipeline/journal.jsonl (traceability, DORA). Never blocks.
'use strict';
const fs = require('fs');
const path = require('path');
const { readStdin, projectDir, currentAgent } = require('./lib');
try {
  const input = readStdin();
  const root = projectDir(input);
  const redact = (s) => s
    .replace(/\b0x[0-9a-fA-F]{64}\b/g, '0x<redacted-32B>')
    .replace(/\bS[A-Z2-7]{55}\b/g, 'S<redacted>')
    .replace(/((?:api[_-]?key|token|secret|password)["'\s:=]+)[^\s"',}]+/gi, '$1<redacted>');
  const line = {
    ts: new Date().toISOString(),
    session: input.session_id || null,
    agent: currentAgent(root, input),
    tool: input.tool_name || null,
    input: redact(JSON.stringify(input.tool_input || {})).slice(0, 2000),
  };
  fs.mkdirSync(path.join(root, '.pipeline'), { recursive: true });
  fs.appendFileSync(path.join(root, '.pipeline', 'journal.jsonl'), JSON.stringify(line) + '\n');
} catch (_) { /* logging must never break the session */ }
process.exit(0);
