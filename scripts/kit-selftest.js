#!/usr/bin/env node
// kit-selftest.js — install kits/blockchain-pipeline into a throwaway git repo and exercise hooks and gates
// with a fake `forge` on PATH. Tests the logic, not the real toolchain. Exit 1 on the first unexpected result.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'forge-kit-'));
const proj = path.join(tmp, 'proj'), bin = path.join(tmp, 'bin');
fs.mkdirSync(proj); fs.mkdirSync(bin);
let failures = 0, n = 0;
const env = Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: proj, PATH: `${bin}:${process.env.PATH}` });
const run = (cmd, argv, input, extra = {}) => spawnSync(cmd, argv, { cwd: proj, env: Object.assign({}, env, extra), input, encoding: 'utf8' });
const expect = (label, got, want, out = '') => {
  n++;
  if (got === want) console.log(`ok   ${label}`);
  else { failures++; console.log(`FAIL ${label}: got ${got}, want ${want}\n${String(out).trim().split('\n').slice(-8).join('\n')}`); }
};
const put = (rel, s) => { fs.mkdirSync(path.dirname(path.join(proj, rel)), { recursive: true }); fs.writeFileSync(path.join(proj, rel), s); };

// install
run('git', ['init', '-q']); run('git', ['config', 'user.email', 't@t']); run('git', ['config', 'user.name', 't']);
let r = run(process.execPath, [path.join(ROOT, 'scripts', 'blockchain-pipeline.js'), '--project', 'Demo', '--target', proj]);
expect('install', r.status, 0, r.stdout + r.stderr);
expect('19 agents installed', fs.readdirSync(path.join(proj, '.claude', 'agents')).length, 19);
r = run(process.execPath, [path.join(ROOT, 'scripts', 'blockchain-pipeline.js'), '--target', proj]);
expect('re-install keeps files', /conservés/.test(r.stdout), true, r.stdout);

// guard-chain
const chain = (cmd) => run(process.execPath, ['.claude/hooks/guard-chain.js'], JSON.stringify({ tool_input: { command: cmd } })).status;
for (const c of ['forge script script/Deploy.s.sol --broadcast', 'cast send 0xabc "f()"', 'forge create src/T.sol:T', 'forge test --fork-url https://eth.llamarpc.com',
  'export PRIVATE_KEY=1', 'cat .env', 'forge script S --private-key 0x01', 'stellar contract deploy --network testnet --wasm a.wasm', 'stellar keys show alice'])
  expect(`guard-chain blocks: ${c}`, chain(c), 2);
for (const c of ['forge test --fork-url http://127.0.0.1:8545', 'forge build', 'stellar contract deploy --network local --wasm a.wasm', 'bash scripts/gates/gate-2.sh', 'git status'])
  expect(`guard-chain allows: ${c}`, chain(c), 0);

// guard-paths
const paths = (file, agent, viaFile) => {
  if (viaFile !== undefined) fs.writeFileSync(path.join(proj, '.pipeline', 'current-agent'), viaFile);
  const input = { tool_input: { file_path: path.join(proj, file) } };
  if (agent) input.agent_type = agent;
  return run(process.execPath, ['.claude/hooks/guard-paths.js'], JSON.stringify(input)).status;
};
const cases = [
  ['contracts/Token.sol', 'developpeur', 0], ['contracts/interfaces/IToken.sol', 'developpeur', 2], ['test/invariants/Inv.t.sol', 'developpeur', 2],
  ['test/base/Token.t.sol', 'developpeur', 0], ['contracts/interfaces/IToken.sol', 'concepteur', 0], ['contracts/Token.sol', 'concepteur', 2],
  ['test/unit/Token.t.sol', 'testeur', 0], ['test/exploits/Drain.t.sol', 'testeur', 2], ['contracts/Token.sol', 'testeur', 2],
  ['test/exploits/Drain.t.sol', 'red-team', 0], ['docs/audit/acces.md', 'auditeur-acces', 0], ['docs/audit/calcul.md', 'auditeur-acces', 2],
  ['test/audit/acces/P.t.sol', 'auditeur-acces', 0], ['.pipeline/audit.json', 'juge', 0], ['docs/06-revue.md', 'relecteur', 0],
  ['contracts/Token.sol', 'relecteur', 2], ['script/Deploy.s.sol', 'release', 0], ['docs/00-projet.md', 'analyste', 2], ['../outside.txt', 'developpeur', 2],
  ['contracts/Token.sol', 'inconnu', 2],
  ['.pipeline/journal.jsonl', 'developpeur', 2], ['.pipeline/redteam.json', 'developpeur', 2],
];
for (const [f, a, want] of cases) expect(`guard-paths ${a} → ${f}`, paths(f, a), want);
expect('guard-paths via current-agent file (testeur → contracts/)', paths('contracts/Token.sol', null, 'testeur\n'), 2);
expect('guard-paths default orchestrateur → docs/00-projet.md', paths('docs/00-projet.md', null, ''), 0);
expect('guard-paths default orchestrateur → contracts/', paths('contracts/Token.sol', null, ''), 2);
fs.writeFileSync(path.join(proj, '.pipeline', 'current-agent'), 'orchestrateur\n');

// audit-log
run(process.execPath, ['.claude/hooks/audit-log.js'], JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'echo api_key=abc123 0x' + 'a'.repeat(64) } }));
const journal = fs.readFileSync(path.join(proj, '.pipeline', 'journal.jsonl'), 'utf8');
expect('audit-log writes a JSON line', JSON.parse(journal.trim().split('\n').pop()).tool, 'Bash');
expect('audit-log redacts secrets', /abc123|a{64}/.test(journal), false, journal);
run('git', ['add', '-A']); run('git', ['commit', '-qm', 'kit']);

// fake forge: build/fmt succeed; `test --json` prints results from $FAKE_TESTS
fs.writeFileSync(path.join(bin, 'forge'), '#!/usr/bin/env bash\ncase "$1" in test) echo "${FAKE_TESTS:-{\\}}"; exit ${FAKE_CODE:-0};; *) exit 0;; esac\n', { mode: 0o755 });

// gate 1
put('docs/03-conception.md', '# Conception\n## Invariants\nINV-1 supply\n## Plan de tests\nTP-1 mint\n## Écarts et questions\n');
put('contracts/interfaces/IToken.sol', 'interface IToken { function mint(address to, uint256 a) external; function balanceOf(address) external view returns (uint256); }\n');
put('test/invariants/Supply.t.sol', 'contract Inv { function invariant_INV_1_supply() public {} }\n');
put('.pipeline/spec.json', JSON.stringify({ critical_functions: [{ contract: 'Token', function: 'mint', property: 'check_mint_cap' }], invariants: [{ id: 'INV-1', test: 'invariant_INV_1_supply' }], external_integrations: [], upgradeable_contracts: [] }));
fs.writeFileSync(path.join(proj, '.pipeline', 'current-agent'), 'concepteur\n');
r = run('bash', ['scripts/gates/gate-1.sh']);
expect('gate 1 red without symbolic property', r.status, 1, r.stdout);
put('test/symbolic/Mint.t.sol', 'contract S { function check_mint_cap(uint256 a) public {} }\n');
r = run('bash', ['scripts/gates/gate-1.sh']);
expect('gate 1 green with property', r.status, 0, r.stdout);
put('contracts/Token.sol', 'contract Token {}\n');
r = run('bash', ['scripts/gates/gate-1.sh']);
expect('gate 1 red on out-of-perimeter file (contracts/Token.sol by concepteur stage)', r.status, 1, r.stdout);
fs.unlinkSync(path.join(proj, 'contracts/Token.sol'));
expect('gate summary written', fs.existsSync(path.join(proj, '.pipeline', 'gate-1.last.md')), true);
run('git', ['add', '-A']); run('git', ['commit', '-qm', 'step 3']);

// gate 4 (exploits / regressions / rounds / audit) — slither faked too
fs.writeFileSync(path.join(bin, 'slither'), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 });
put('docs/06a-redteam.md', '# Red team\n## Manches consécutives sans exploit\n3\n');
put('docs/06b-audit.md', '# Audit\n');
put('test/exploits/Drain.t.sol', 'contract D { function test_exploit_1_drain() public {} }\n');
const hash = run(process.execPath, ['scripts/gates/gates.js', 'hash', 'contracts', 'src']).stdout.trim();
put('.pipeline/redteam.json', JSON.stringify({ rounds: [1, 2, 3].map((i) => ({ n: i, content_hash: hash, attempts: 5, exploits_succeeded: 0 })) }));
put('.pipeline/audit.json', JSON.stringify({ findings: [{ id: 'ACC-1', severity: 'high', status: 'fixed', proof_test: 'test_proof_ACC_1' }] }));
const results = (o) => JSON.stringify({ 'test/exploits/Drain.t.sol:D': { test_results: o } });
r = run('bash', ['scripts/gates/gate-4.sh'], '', { FAKE_TESTS: results({ 'test_exploit_1_drain()': { status: 'Success' } }) });
expect('gate 4 red on open exploit', r.status, 1, r.stdout);
r = run('bash', ['scripts/gates/gate-4.sh'], '', { FAKE_TESTS: results({ 'test_exploit_1_drain()': { status: 'Failure' } }), FAKE_CODE: '1' });
expect('gate 4 green when every attempt fails', r.status, 0, r.stdout);
r = run('bash', ['scripts/gates/gate-4.sh'], '', { FAKE_TESTS: results({ 'test_regression_1_drain()': { status: 'Failure' } }), FAKE_CODE: '1' });
expect('gate 4 red on broken regression', r.status, 1, r.stdout);
put('.pipeline/audit.json', JSON.stringify({ findings: [{ id: 'ACC-1', severity: 'high', status: 'open' }] }));
r = run('bash', ['scripts/gates/gate-4.sh'], '', { FAKE_TESTS: results({ 'test_exploit_1_drain()': { status: 'Failure' } }), FAKE_CODE: '1' });
expect('gate 4 red on open High finding', r.status, 1, r.stdout);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${n - failures}/${n} passed`);
process.exit(failures ? 1 : 0);
