#!/usr/bin/env node
// gates.js — deterministic stage gates for the blockchain pipeline. A gate passes only if every check passes.
//
//   node scripts/gates/gates.js <1-6>            run a gate (exit 0 = pass, 1 = fail)
//   node scripts/gates/gates.js snapshot-storage  write deployments/<network>.storage/<C>.json (after a deployment)
//   node scripts/gates/gates.js hash              print the content hash of contracts/, src/, test/, script/
//
// Config: .pipeline/config.json (chain, network, thresholds, commands, waivers). Agent JSON: .pipeline/*.json.
// Results: printed, appended to .pipeline/gates.jsonl, written to .pipeline/gate-N.last.md for docs/00-projet.md.
// Rules: a missing tool or file fails the check (fail closed). A waiver needs a reason in config.waivers and a line in
// the decision log of docs/00-projet.md. No Node dependency, no jq.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const P = (...a) => path.join(ROOT, ...a);
const exists = (rel) => fs.existsSync(P(rel));
const readJson = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const tryJson = (rel) => { try { return readJson(rel); } catch (_) { return null; } };

// ---------------------------------------------------------------- config
const DEFAULT_THRESHOLDS = { branch_coverage: 95, mutation_score: 80, redteam_clean_rounds: 3 };
const EXCL = 'test/{exploits,audit,fork,upgrade}/**';
const COMMANDS = {
  evm: {
    build: 'forge build',
    fmt: 'forge fmt --check',
    tests: `forge test --json --no-match-path "${EXCL}"`,
    coverage: `forge coverage --report lcov --no-match-path "${EXCL}"`,
    symbolic: 'halmos --function check_',
    fork: 'forge test --json --match-path "test/fork/**" --fork-url "$FORK_RPC_URL"',
    static: 'slither . --fail-high --filter-paths "lib|test|script"',
    exploits: 'forge test --json --match-path "test/exploits/**"',
    proofs: 'forge test --json --match-path "test/audit/**"',
    dry_run: 'forge script script/Deploy.s.sol --fork-url "$FORK_RPC_URL"',
    storage_layout: 'forge inspect {contract} storageLayout --json',
    oz_validate: null, // e.g. "npx --yes @openzeppelin/upgrades-core@<pinned> validate out/build-info"
    code: 'cast code {address} --rpc-url "$VERIFY_RPC_URL"',
    keccak: 'cast keccak {data}',
    has_role: 'cast call {contract} "hasRole(bytes32,address)(bool)" {role} {holder} --rpc-url "$VERIFY_RPC_URL"',
    storage_check: null,
  },
  soroban: {
    build: 'stellar contract build',
    fmt: 'cargo fmt --all -- --check',
    tests: 'cargo test --workspace -- --skip exploits:: --skip audit:: --skip fork:: --skip upgrade::',
    coverage: 'cargo llvm-cov --workspace --branch --lcov --output-path lcov.info -- --skip exploits:: --skip audit:: --skip fork:: --skip upgrade::',
    symbolic: 'cd test/symbolic && komet test && komet prove run', // Komet (Runtime Verification): fuzzing then symbolic proof
    fork: null,
    static: 'cargo clippy --workspace --all-targets -- -D warnings && cargo scout-audit', // Scout (CoinFabrik): exit code to check on the installed version
    formal: null, // Certora Sunbeam: runs on the Certora cloud (code leaves the bank) — set the command once the legal/security review allows it, or waive gate-4.formal
    exploits: 'cargo test --workspace exploits::',
    proofs: 'cargo test --workspace audit::',
    dry_run: null, // e.g. "stellar contract deploy --network local --source alice --wasm target/wasm32v1-none/release/eurxt.wasm"
    storage_layout: null,
    oz_validate: null,
    code: null,
    keccak: null,
    has_role: null,
    storage_check: null, // command that exits 0 when the new DataKey/storage schema is compatible with the deployed one
    fetch_wasm: 'stellar contract fetch --id {address} --rpc-url "$VERIFY_RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE" --out-file {out}', // flags to check on the installed stellar-cli
    wasm_build: 'stellar contract build',
  },
};
const CRITICAL = 'mint|burn|transfer|transferFrom|transfer_from|forcedTransfer|forced_transfer|redeem|withdraw|upgradeTo|upgradeToAndCall|upgrade|setAdmin|set_admin|grantRole|grant_role|freeze|pause|clawback|set_authorized';

const cfg = Object.assign({ chain: 'evm', network: 'local', thresholds: {}, commands: {}, waivers: {} }, tryJson('.pipeline/config.json') || {});
const CHAIN = cfg.chain === 'soroban' ? 'soroban' : 'evm';
const TH = Object.assign({}, DEFAULT_THRESHOLDS, cfg.thresholds);
const CMD = Object.assign({}, COMMANDS[CHAIN], cfg.commands);
const ENV = Object.assign({}, process.env, { FORK_RPC_URL: process.env.FORK_RPC_URL || cfg.fork_rpc_url || 'http://127.0.0.1:8545' });
const SRC_EXT = CHAIN === 'evm' ? /\.sol$/ : /\.rs$/;

// ---------------------------------------------------------------- helpers
function sh(cmd) {
  const r = spawnSync('bash', ['-c', cmd], { cwd: ROOT, env: ENV, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (r.error) return { code: 127, out: String(r.error.message) };
  return { code: r.status === null ? 1 : r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? `{${k}}` : String(vars[k])));
const tail = (s, n = 6) => s.trim().split('\n').slice(-n).join(' ⏎ ').slice(0, 600);
function files(dir, re = /./) {
  const out = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === 'target' || e.name === 'out' || e.name === 'cache' || e.name === 'lib') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else if (re.test(e.name)) out.push(p);
    }
  };
  walk(P(dir));
  return out.sort();
}
const grepFiles = (dir, re) => files(dir, SRC_EXT).some((f) => re.test(fs.readFileSync(f, 'utf8')));
function contentHash(dirs = ['contracts', 'src', 'test', 'script']) {
  const h = crypto.createHash('sha256');
  for (const d of dirs) for (const f of files(d)) { h.update(path.relative(ROOT, f)); h.update('\0'); h.update(fs.readFileSync(f)); h.update('\0'); }
  return h.digest('hex');
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fnDecl = (name) => (CHAIN === 'evm' ? new RegExp(`function\\s+${esc(name)}\\s*\\(`) : new RegExp(`fn\\s+${esc(name)}\\s*[<(]`));

// test results: [{name, status: pass|fail|skip}]
function parseTests(out) {
  const res = [];
  if (CHAIN === 'evm') {
    const a = out.indexOf('{'), b = out.lastIndexOf('}');
    if (a === -1 || b <= a) return res;
    let j; try { j = JSON.parse(out.slice(a, b + 1)); } catch (_) { return res; }
    for (const [suite, v] of Object.entries(j)) for (const [t, r] of Object.entries((v && v.test_results) || {})) {
      const st = String(r.status || '').toLowerCase();
      res.push({ name: t.replace(/\(.*$/, ''), suite, status: st === 'success' ? 'pass' : st === 'skipped' ? 'skip' : 'fail' });
    }
  } else {
    const re = /^test (\S+) \.\.\. (ok|FAILED|ignored)/gm; let m;
    while ((m = re.exec(out))) res.push({ name: m[1].split('::').pop(), suite: m[1], status: m[2] === 'ok' ? 'pass' : m[2] === 'ignored' ? 'skip' : 'fail' });
  }
  return res;
}
function lcov(file) {
  if (!exists(file)) return null;
  let brf = 0, brh = 0, lf = 0, lh = 0, keep = false;
  for (const line of fs.readFileSync(P(file), 'utf8').split('\n')) {
    if (line.startsWith('SF:')) { const f = line.slice(3).replace(ROOT + '/', ''); keep = /^(contracts|src)\//.test(f) && !/(^|\/)(interfaces|test|mocks?)\//.test(f); }
    if (!keep) continue;
    const m = line.match(/^(BRF|BRH|LF|LH):(\d+)/);
    if (m) { const n = +m[2]; if (m[1] === 'BRF') brf += n; if (m[1] === 'BRH') brh += n; if (m[1] === 'LF') lf += n; if (m[1] === 'LH') lh += n; }
  }
  return { brf, brh, lf, lh };
}
// Uncommitted changes (tracked + untracked) must belong to the agents of the stage. Validated stages are committed.
function perimeterCheck(gate) {
  let perims;
  try { perims = readJson('.claude/hooks/perimeters.json'); } catch (e) { return fail(`perimeters.json illisible : ${e.message}`); }
  const r = sh('git status --porcelain=v1 --untracked-files=all');
  if (r.code !== 0) return fail('git status a échoué (le projet doit être un dépôt git)');
  const changed = r.out.split('\n').filter(Boolean).map((l) => l.slice(3).replace(/^.* -> /, '').replace(/^"|"$/g, ''));
  const agents = ['orchestrateur', ...(perims.gates[String(gate)] || [])];
  const always = new RegExp(perims.always);
  const gateOut = /^\.pipeline\/(journal\.jsonl|gates\.jsonl|gate-\d\.last\.md|mutation\.json)$/;
  const ok = (f, a) => {
    const rule = perims.agents[a]; if (!rule) return false;
    const cls = a === 'auditeur-*' ? '[a-z0-9-]+' : '';
    const allow = new RegExp(rule.allow.replace(/\{class\}/g, cls));
    const deny = rule.deny ? new RegExp(rule.deny.replace(/\{class\}/g, cls)) : null;
    return allow.test(f) && !(deny && deny.test(f));
  };
  const bad = changed.filter((f) => !always.test(f) && !gateOut.test(f) && !agents.some((a) => ok(f, a)));
  return bad.length ? fail(`hors périmètre de ${agents.join(', ')} : ${bad.slice(0, 8).join(', ')}${bad.length > 8 ? '…' : ''}`) : pass(`${changed.length} fichier(s) modifié(s), tous dans le périmètre`);
}
function hasSection(rel, title = 'Écarts et questions') {
  if (!exists(rel)) return fail(`${rel} absent`);
  return new RegExp(`^#+\\s*${title}`, 'mi').test(fs.readFileSync(P(rel), 'utf8')) ? pass(`${rel} présent, section « ${title} »`) : fail(`${rel} sans section « ${title} »`);
}
function runCmd(key, okMsg) {
  if (!CMD[key]) return fail(`commande « ${key} » non définie pour ${CHAIN} : la renseigner dans .pipeline/config.json → commands.${key}`);
  const r = sh(CMD[key]);
  return r.code === 0 ? pass(okMsg || CMD[key]) : fail(`${CMD[key]} → code ${r.code} : ${tail(r.out)}`);
}
function suite(key, { allowFailures = false } = {}) {
  if (!CMD[key]) return { error: `commande « ${key} » non définie` };
  const r = sh(CMD[key]);
  const tests = parseTests(r.out);
  if (!tests.length && r.code !== 0) return { error: `${CMD[key]} → code ${r.code} sans résultat de test : ${tail(r.out)}` };
  if (!allowFailures && r.code !== 0 && !tests.some((t) => t.status === 'fail')) return { error: `${CMD[key]} → code ${r.code} : ${tail(r.out)}` };
  return { tests };
}
const pass = (detail) => ({ status: 'PASS', detail });
const fail = (detail) => ({ status: 'FAIL', detail });
const na = (detail) => ({ status: 'N/A', detail });

// ---------------------------------------------------------------- checks per gate
const spec = () => tryJson('.pipeline/spec.json');
const GATES = {
  1: { title: 'Spec exécutable (avant développement)', checks: {
    artefact: () => hasSection('docs/03-conception.md'),
    interfaces: () => (files('contracts/interfaces', SRC_EXT).length ? pass(`${files('contracts/interfaces', SRC_EXT).length} interface(s)`) : fail('aucune interface dans contracts/interfaces/')),
    build: () => runCmd('build', 'interfaces, invariants et propriétés compilent'),
    'spec-json': () => { const s = spec(); return s && Array.isArray(s.critical_functions) && Array.isArray(s.invariants) ? pass('.pipeline/spec.json valide') : fail('.pipeline/spec.json absent ou sans critical_functions / invariants'); },
    'invariants-ids': () => {
      const s = spec(); if (!s) return fail('spec.json absent');
      const doc = exists('docs/03-conception.md') ? fs.readFileSync(P('docs/03-conception.md'), 'utf8') : '';
      const ids = [...new Set(doc.match(/\bINV-\d+\b/g) || [])];
      const listed = new Set(s.invariants.map((i) => i.id));
      const missing = ids.filter((i) => !listed.has(i));
      const noTest = s.invariants.filter((i) => !i.test || !grepFiles(CHAIN === 'evm' ? 'test/invariants' : 'test', fnDecl(i.test)));
      if (!ids.length) return fail('aucun invariant INV-n dans docs/03-conception.md');
      if (missing.length) return fail(`invariants de 03 absents de spec.json : ${missing.join(', ')}`);
      if (noTest.length) return fail(`invariants sans test : ${noTest.map((i) => `${i.id}→${i.test}`).join(', ')}`);
      return pass(`${ids.length}/${ids.length} invariants ont leur test`);
    },
    'critical-properties': () => {
      const s = spec(); if (!s) return fail('spec.json absent');
      const re = new RegExp(CHAIN === 'evm' ? `function\\s+(${cfg.critical_pattern || CRITICAL})\\s*\\(` : `fn\\s+(${cfg.critical_pattern || CRITICAL})\\s*[<(]`, 'g');
      const found = new Set();
      for (const f of files('contracts/interfaces', SRC_EXT)) { let m; const t = fs.readFileSync(f, 'utf8'); while ((m = re.exec(t))) found.add(m[1]); }
      const listed = new Set(s.critical_functions.map((c) => c.function));
      const unlisted = [...found].filter((f) => !listed.has(f));
      const noProp = s.critical_functions.filter((c) => !c.property || !files('test', SRC_EXT).some((f) => /\/symbolic\//.test(f) && fnDecl(c.property).test(fs.readFileSync(f, 'utf8'))));
      if (unlisted.length) return fail(`fonctions critiques sans entrée dans spec.json : ${unlisted.join(', ')}`);
      if (noProp.length) return fail(`fonctions critiques sans propriété dans test/symbolic : ${noProp.map((c) => c.function).join(', ')}`);
      if (!s.critical_functions.length) return fail('aucune fonction critique déclarée');
      return pass(`${s.critical_functions.length}/${s.critical_functions.length} fonctions critiques ont leur propriété (100 %)`);
    },
  } },
  2: { title: 'Développement (avant tests)', checks: {
    artefact: () => hasSection('docs/04-implementation.md', 'Écarts avec la conception'),
    build: () => runCmd('build'),
    fmt: () => runCmd('fmt'),
    'base-and-invariants': () => {
      const r = suite('tests'); if (r.error) return fail(r.error);
      const f = r.tests.filter((t) => t.status === 'fail'), s = r.tests.filter((t) => t.status === 'skip');
      if (!r.tests.length) return fail('aucun test exécuté');
      if (f.length || s.length) return fail(`${f.length} échec(s), ${s.length} skip : ${[...f, ...s].slice(0, 6).map((t) => t.name).join(', ')}`);
      return pass(`${r.tests.length} tests verts, 0 skip`);
    },
  } },
  3: { title: 'Tests (avant sécurité)', checks: {
    artefact: () => hasSection('docs/05-tests.md', 'Constats'),
    suite: () => {
      const r = suite('tests'); if (r.error) return fail(r.error);
      const f = r.tests.filter((t) => t.status !== 'pass');
      return f.length ? fail(`${f.length} test(s) non verts : ${f.slice(0, 6).map((t) => t.name).join(', ')}`) : pass(`${r.tests.length} tests verts`);
    },
    'plan-ids': () => {
      if (!exists('docs/03-conception.md')) return fail('docs/03-conception.md absent');
      const ids = [...new Set(fs.readFileSync(P('docs/03-conception.md'), 'utf8').match(/\bTP-\d+\b/g) || [])];
      if (!ids.length) return fail('aucun identifiant TP-n dans le plan de tests');
      const corpus = files('test', SRC_EXT).filter((f) => !/\/(exploits|audit)\//.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
      const missing = ids.filter((id) => !new RegExp(`\\b\\w*${id.replace('-', '_')}(?!\\d)`, 'i').test(corpus));
      return missing.length ? fail(`lignes du plan sans test nommé (TP_n) : ${missing.join(', ')}`) : pass(`${ids.length}/${ids.length} lignes du plan couvertes`);
    },
    coverage: () => {
      if (!CMD.coverage) return fail('commande coverage non définie');
      const r = sh(CMD.coverage); if (r.code !== 0) return fail(`${CMD.coverage} → code ${r.code} : ${tail(r.out)}`);
      const c = lcov('lcov.info'); if (!c) return fail('lcov.info absent après la mesure');
      if (!c.brf) return fail('aucune branche mesurée dans contracts/ ou src/ (couverture des branches indisponible)');
      const pct = (100 * c.brh) / c.brf;
      return pct >= TH.branch_coverage ? pass(`branches ${pct.toFixed(1)} % ≥ ${TH.branch_coverage} %`) : fail(`branches ${pct.toFixed(1)} % < ${TH.branch_coverage} %`);
    },
    mutation: () => {
      const m = tryJson('.pipeline/mutation.json');
      if (!m) return fail('.pipeline/mutation.json absent : lancer scripts/gates/mutation.js');
      if (m.content_hash !== contentHash()) return fail('mutation.json ne correspond pas au code actuel : relancer scripts/gates/mutation.js');
      const denom = m.killed + m.survived;
      if (!denom) return fail('aucun mutant évalué');
      const score = (100 * m.killed) / denom;
      return score >= TH.mutation_score ? pass(`mutation ${score.toFixed(1)} % ≥ ${TH.mutation_score} % (${m.killed}/${denom})`) : fail(`mutation ${score.toFixed(1)} % < ${TH.mutation_score} % ; survivants : ${(m.survivors || []).slice(0, 5).join(', ')}`);
    },
    symbolic: () => runCmd('symbolic', 'propriétés symboliques vertes'),
    fork: () => {
      const s = spec() || {}; const ext = s.external_integrations || [];
      const forkFiles = files('test/fork', SRC_EXT).length + files('test/src/fork', SRC_EXT).length;
      if (!ext.length && !forkFiles) return na('aucune intégration externe déclarée dans spec.json');
      if (ext.length && !forkFiles) return fail(`intégrations externes sans fork test : ${ext.join(', ')}`);
      const r = suite('fork'); if (r.error) return fail(r.error);
      const f = r.tests.filter((t) => t.status !== 'pass');
      return f.length ? fail(`${f.length} fork test(s) en échec : ${f.slice(0, 5).map((t) => t.name).join(', ')}`) : pass(`${r.tests.length} fork tests verts`);
    },
  } },
  4: { title: 'Sécurité (avant revue)', checks: {
    artefacts: () => { const a = hasSection('docs/06a-redteam.md', 'Manches consécutives sans exploit'); return a.status !== 'PASS' ? a : exists('docs/06b-audit.md') ? pass('06a et 06b présents') : fail('docs/06b-audit.md absent'); },
    static: () => runCmd('static', `${CMD.static || 'analyse statique'} : aucun constat High/critique`),
    formal: () => (CHAIN !== 'soroban' ? na('EVM : propriétés Halmos contrôlées en gate 3') : CMD.formal ? runCmd('formal', 'règles Sunbeam critiques vertes') : fail('commands.formal (Certora Sunbeam) non défini : le renseigner ou déroger (gate-4.formal) avec motif')),
    exploits: () => {
      const r = suite('exploits', { allowFailures: true }); if (r.error) return fail(r.error);
      const open = r.tests.filter((t) => /^test_?exploit/i.test(t.name) && t.status === 'pass');
      const broken = r.tests.filter((t) => /^test_?regression/i.test(t.name) && t.status !== 'pass');
      if (open.length || broken.length) return fail(`exploits ouverts : ${open.map((t) => t.name).join(', ') || '0'} ; régressions rouges : ${broken.map((t) => t.name).join(', ') || '0'}`);
      return pass(`${r.tests.length} tentatives, 0 exploit ouvert, régressions vertes`);
    },
    'redteam-rounds': () => {
      const j = tryJson('.pipeline/redteam.json'); if (!j || !Array.isArray(j.rounds)) return fail('.pipeline/redteam.json absent ou sans rounds[]');
      let clean = 0; for (let i = j.rounds.length - 1; i >= 0 && !(j.rounds[i].exploits_succeeded > 0); i--) clean++;
      const last = j.rounds[j.rounds.length - 1];
      if (last && last.content_hash && last.content_hash !== contentHash(['contracts', 'src'])) return fail('dernière manche jouée sur un autre code que l\'actuel : rejouer une manche');
      return clean >= TH.redteam_clean_rounds ? pass(`${clean} manches consécutives sans exploit ≥ ${TH.redteam_clean_rounds}`) : fail(`${clean} manche(s) consécutive(s) sans exploit < ${TH.redteam_clean_rounds}`);
    },
    'audit-open': () => {
      const j = tryJson('.pipeline/audit.json'); if (!j || !Array.isArray(j.findings)) return fail('.pipeline/audit.json absent ou sans findings[]');
      const open = j.findings.filter((f) => f.status === 'open' && /^(critical|high)$/i.test(f.severity));
      return open.length ? fail(`constats Critique/Haute ouverts : ${open.map((f) => f.id).join(', ')}`) : pass(`${j.findings.length} constats, 0 Critique/Haute ouvert`);
    },
    proofs: () => {
      const j = tryJson('.pipeline/audit.json') || { findings: [] };
      if (!files('test/audit', SRC_EXT).length && !files('test/src/audit', SRC_EXT).length) return na('aucun test de preuve');
      const r = suite('proofs', { allowFailures: true }); if (r.error) return fail(r.error);
      const byTest = new Map(j.findings.filter((f) => f.proof_test).map((f) => [f.proof_test, f]));
      const bad = r.tests.filter((t) => /^test_?proof/i.test(t.name) && t.status === 'pass').filter((t) => { const f = byTest.get(t.name); return !f || /^(critical|high)$/i.test(f.severity); });
      return bad.length ? fail(`preuves encore démontrées (Critique/Haute ou non déclarées dans audit.json) : ${bad.map((t) => t.name).join(', ')}`) : pass(`${r.tests.length} preuves exécutées, aucune Critique/Haute encore démontrée`);
    },
  } },
  5: { title: 'Release (avant signature)', checks: {
    artefact: () => hasSection('docs/08-deploiement.md', 'Batch à signer'),
    'external-audit': () => {
      const j = tryJson('.pipeline/release.json'); const a = j && j.external_audit;
      if (!a) return fail('.pipeline/release.json sans external_audit');
      if (!a.report_path || !exists(a.report_path)) return fail(`rapport d'audit externe introuvable : ${a.report_path || '(non renseigné)'}`);
      return (a.open_critical || 0) + (a.open_high || 0) === 0 ? pass(`audit externe ${a.reference || ''} : 0 Critique/Haute ouvert`) : fail(`audit externe : ${a.open_critical || 0} Critique, ${a.open_high || 0} Haute ouverts`);
    },
    'storage-layout': () => {
      if (CHAIN !== 'evm') return CMD.storage_check ? runCmd('storage_check', 'schéma de stockage compatible') : fail('commands.storage_check non défini : compatibilité du stockage non vérifiable');
      const s = spec() || {}; const list = s.upgradeable_contracts || [];
      if (!list.length) return na('aucun contrat upgradeable déclaré dans spec.json');
      const problems = []; let compared = 0;
      for (const c of list) {
        const base = `deployments/${cfg.network}.storage/${c}.json`;
        if (!exists(base)) continue;
        const r = sh(fill(CMD.storage_layout, { contract: c })); if (r.code !== 0) { problems.push(`${c}: forge inspect a échoué`); continue; }
        let now; try { now = JSON.parse(r.out.slice(r.out.indexOf('{'), r.out.lastIndexOf('}') + 1)); } catch (_) { problems.push(`${c}: layout illisible`); continue; }
        problems.push(...compareLayouts(c, readJson(base), now)); compared++;
      }
      if (problems.length) return fail(problems.slice(0, 6).join(' ; '));
      return compared ? pass(`${compared} layout(s) compatibles avec le déployé`) : na('premier déploiement : aucun layout de référence');
    },
    'oz-validate': () => (CMD.oz_validate ? runCmd('oz_validate', 'OZ upgrades-core validate OK') : na('commands.oz_validate non défini (contrôle complémentaire)')),
    'dry-run': () => runCmd('dry_run', 'dry-run sur fork vert'),
    simulation: () => {
      const j = tryJson('.pipeline/release.json'); const sim = j && j.simulation;
      if (!sim) return fail('release.json sans simulation');
      if (sim.status !== 'passed') return fail(`simulation : ${sim.status}`);
      return sim.content_hash === contentHash(['contracts', 'src', 'script']) ? pass(`simulation ${sim.tool || ''} ${sim.id || ''} verte sur le code actuel`) : fail('simulation faite sur un autre code : la rejouer');
    },
  } },
  6: { title: 'Exploitation (après diffusion)', checks: {
    manifest: () => { const m = tryJson(`deployments/${cfg.network}.json`); return m && Array.isArray(m.contracts) && m.contracts.length ? pass(`${m.contracts.length} contrat(s) dans deployments/${cfg.network}.json`) : fail(`deployments/${cfg.network}.json absent ou sans contracts[]`); },
    bytecode: () => {
      const m = tryJson(`deployments/${cfg.network}.json`); if (!m) return fail('manifeste absent');
      if (CHAIN === 'soroban') return wasmHashes(m);
      if (!CMD.code || !CMD.keccak) return fail('commands.code / commands.keccak non définis');
      if (!process.env.VERIFY_RPC_URL && /VERIFY_RPC_URL/.test(CMD.code)) return fail('VERIFY_RPC_URL non défini (RPC en lecture, fourni par un humain)');
      const bad = [];
      for (const c of m.contracts) {
        const code = sh(fill(CMD.code, { address: c.address })); if (code.code !== 0) { bad.push(`${c.name}: lecture impossible`); continue; }
        const hex = code.out.trim().split('\n').pop();
        const h = sh(fill(CMD.keccak, { data: hex })).out.trim().split('\n').pop();
        if (!c.runtime_code_hash || h.toLowerCase() !== c.runtime_code_hash.toLowerCase()) bad.push(`${c.name}: ${h.slice(0, 12)}… ≠ manifeste`);
      }
      return bad.length ? fail(bad.join(' ; ')) : pass(`${m.contracts.length} bytecode(s) = manifeste`);
    },
    'admin-not-eoa': async () => {
      const m = tryJson(`deployments/${cfg.network}.json`); if (!m || !Array.isArray(m.roles)) return fail('manifeste sans roles[]');
      if (CHAIN === 'soroban') return stellarMultisig(m);
      if (!CMD.code || !CMD.has_role) return fail('commands.code / commands.has_role non définis');
      const bad = [];
      for (const r of m.roles) {
        const code = sh(fill(CMD.code, { address: r.holder })).out.trim().split('\n').pop();
        if (!code || /^0x$/i.test(code)) bad.push(`${r.contract}.${r.role_name || r.role} détenu par un EOA ${r.holder}`);
        const held = sh(fill(CMD.has_role, { contract: r.contract_address || r.contract, role: r.role, holder: r.holder })).out.trim();
        if (!/true/.test(held)) bad.push(`${r.role_name || r.role} non attribué à ${r.holder}`);
        if (m.deployer && /true/.test(sh(fill(CMD.has_role, { contract: r.contract_address || r.contract, role: r.role, holder: m.deployer })).out)) bad.push(`le déployeur détient encore ${r.role_name || r.role}`);
      }
      return bad.length ? fail(bad.slice(0, 6).join(' ; ')) : pass(`${m.roles.length} rôle(s) admin détenus par des contrats (Safe / timelock)`);
    },
    'sources-verified': async () => {
      const m = tryJson(`deployments/${cfg.network}.json`); if (!m) return fail('manifeste absent');
      if (CHAIN === 'soroban') return reproducibleBuild(m);
      if (!cfg.explorer_api) return fail('config.explorer_api non défini (API Blockscout/Etherscan)');
      const bad = [];
      for (const c of m.contracts) {
        try {
          const res = await fetch(`${cfg.explorer_api.replace(/\/$/, '')}?module=contract&action=getsourcecode&address=${c.address}`);
          const j = await res.json(); const src = j && j.result && j.result[0] && j.result[0].SourceCode;
          if (!src) bad.push(c.name);
        } catch (e) { bad.push(`${c.name} (${e.message})`); }
      }
      return bad.length ? fail(`sources non vérifiées : ${bad.join(', ')}`) : pass('sources vérifiées sur l\'explorer');
    },
    monitor: async () => {
      const url = process.env.MONITOR_HEALTH_URL || cfg.monitor_health_url; if (!url) return fail('MONITOR_HEALTH_URL non défini');
      try { const r = await fetch(url); return r.ok ? pass(`monitor actif (${r.status})`) : fail(`monitor : HTTP ${r.status}`); } catch (e) { return fail(`monitor injoignable : ${e.message}`); }
    },
  } },
};

// ---------------------------------------------------------------- Soroban gate 6
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function wasmHashes(m) {
  if (!CMD.fetch_wasm) return fail('commands.fetch_wasm non défini');
  if (/VERIFY_RPC_URL/.test(CMD.fetch_wasm) && !process.env.VERIFY_RPC_URL) return fail('VERIFY_RPC_URL et NETWORK_PASSPHRASE non définis (RPC en lecture, fournis par un humain)');
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'wasm-'));
  const bad = [];
  for (const c of m.contracts) {
    const out = path.join(dir, `${c.name}.wasm`);
    const r = sh(fill(CMD.fetch_wasm, { address: c.address, out }));
    if (r.code !== 0 || !fs.existsSync(out)) { bad.push(`${c.name}: WASM non récupéré (${tail(r.out, 2)})`); continue; }
    if (!c.wasm_hash || sha256(out) !== c.wasm_hash.toLowerCase()) bad.push(`${c.name}: hash du WASM déployé ${sha256(out).slice(0, 12)}… ≠ manifeste`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return bad.length ? fail(bad.join(' ; ')) : pass(`${m.contracts.length} WASM déployé(s) = manifeste`);
}
function reproducibleBuild(m) {
  const r = runCmd('wasm_build'); if (r.status !== 'PASS') return r;
  const bad = m.contracts.filter((c) => !c.wasm_path || !exists(c.wasm_path) || sha256(P(c.wasm_path)) !== String(c.wasm_hash || '').toLowerCase()).map((c) => c.name);
  return bad.length ? fail(`build local ≠ WASM du manifeste (build non reproductible ou code différent) : ${bad.join(', ')}`) : pass('WASM reconstruit depuis les sources = manifeste');
}
async function stellarMultisig(m) {
  const horizon = process.env.HORIZON_URL || cfg.horizon_url; if (!horizon) return fail('HORIZON_URL non défini (Horizon en lecture)');
  const bad = [];
  for (const r of m.roles) {
    if (/^C/.test(r.holder)) { bad.push(`${r.role_name || r.role} détenu par un contrat ${r.holder} : multisig à vérifier hors gate ou dérogation`); continue; }
    if (m.deployer && r.holder === m.deployer) { bad.push(`${r.role_name || r.role} encore détenu par le déployeur`); continue; }
    try {
      const a = await (await fetch(`${horizon.replace(/\/$/, '')}/accounts/${r.holder}`)).json();
      const signers = (a.signers || []).filter((s) => s.weight > 0);
      const maxW = Math.max(0, ...signers.map((s) => s.weight));
      const t = a.thresholds || {};
      if (signers.length < 2) bad.push(`${r.holder}: ${signers.length} signataire(s)`);
      else if (!(t.med_threshold > maxW && t.high_threshold > maxW)) bad.push(`${r.holder}: un signataire seul atteint le seuil (poids max ${maxW}, med ${t.med_threshold}, high ${t.high_threshold})`);
    } catch (e) { bad.push(`${r.holder}: ${e.message}`); }
  }
  return bad.length ? fail(bad.slice(0, 6).join(' ; ')) : pass(`${m.roles.length} rôle(s) admin sur des comptes multisig à seuils`);
}

function compareLayouts(c, base, now) {
  const out = [];
  const label = (lay, t) => (lay.types && lay.types[t] && lay.types[t].label) || t;
  const idx = new Map((now.storage || []).map((s) => [`${s.slot}:${s.offset}`, s]));
  for (const b of base.storage || []) {
    if (/^__gap/.test(b.label)) continue;
    const n = idx.get(`${b.slot}:${b.offset}`);
    if (!n) out.push(`${c}.${b.label} (slot ${b.slot}) supprimée ou déplacée`);
    else if (n.label !== b.label) out.push(`${c} slot ${b.slot} : ${b.label} → ${n.label}`);
    else if (label(base, b.type) !== label(now, n.type)) out.push(`${c}.${b.label} retypée : ${label(base, b.type)} → ${label(now, n.type)}`);
  }
  return out;
}

// ---------------------------------------------------------------- main
async function runGate(n) {
  const g = GATES[n];
  const checks = Object.assign({ perimetre: () => perimeterCheck(n) }, g.checks);
  const results = [];
  for (const [id, fn] of Object.entries(checks)) {
    const key = `gate-${n}.${id}`;
    let r;
    try { r = await fn(); } catch (e) { r = fail(`erreur : ${e.message}`); }
    if (r.status === 'FAIL' && cfg.waivers[key]) r = { status: 'WAIVED', detail: `${r.detail} — dérogation : ${cfg.waivers[key]}` };
    results.push(Object.assign({ id: key }, r));
    console.log(`${r.status.padEnd(6)} ${key.padEnd(28)} ${r.detail}`);
  }
  const ok = results.every((r) => r.status !== 'FAIL');
  const commit = sh('git rev-parse --short HEAD').out.trim() || null;
  const ts = new Date().toISOString();
  fs.mkdirSync(P('.pipeline'), { recursive: true });
  fs.appendFileSync(P('.pipeline', 'gates.jsonl'), JSON.stringify({ ts, gate: n, chain: CHAIN, commit, ok, results }) + '\n');
  const md = [`### Gate ${n} — ${g.title} — ${ok ? 'VERTE' : 'ROUGE'}`, '', `${ts} · commit ${commit} · chaîne ${CHAIN}`, '', '| Contrôle | Statut | Détail |', '| --- | --- | --- |',
    ...results.map((r) => `| ${r.id} | ${r.status} | ${String(r.detail).replace(/\|/g, '\\|')} |`), ''].join('\n');
  fs.writeFileSync(P('.pipeline', `gate-${n}.last.md`), md);
  console.log(`\ngate ${n} ${ok ? 'OK' : 'KO'} — résumé dans .pipeline/gate-${n}.last.md`);
  process.exit(ok ? 0 : 1);
}

const arg = process.argv[2];
if (arg === 'hash') { console.log(contentHash(process.argv.slice(3).length ? process.argv.slice(3) : undefined)); process.exit(0); }
if (arg === 'snapshot-storage') {
  const list = (spec() || {}).upgradeable_contracts || [];
  if (CHAIN !== 'evm' || !CMD.storage_layout) { console.error('snapshot-storage : EVM uniquement'); process.exit(1); }
  fs.mkdirSync(P('deployments', `${cfg.network}.storage`), { recursive: true });
  for (const c of list) {
    const r = sh(fill(CMD.storage_layout, { contract: c })); if (r.code !== 0) { console.error(`${c}: ${tail(r.out)}`); process.exit(1); }
    fs.writeFileSync(P('deployments', `${cfg.network}.storage`, `${c}.json`), r.out.slice(r.out.indexOf('{'), r.out.lastIndexOf('}') + 1) + '\n');
    console.log(`deployments/${cfg.network}.storage/${c}.json`);
  }
  process.exit(0);
}
if (!GATES[arg]) { console.error('usage: gates.js <1-6> | snapshot-storage | hash [dirs…]'); process.exit(2); }
runGate(Number(arg));
