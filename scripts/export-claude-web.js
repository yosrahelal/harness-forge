#!/usr/bin/env node
/**
 * export-claude-web.js — build a claude.ai (web/desktop/mobile) package from a pack definition.
 *
 * node scripts/export-claude-web.js [pack ...] [--out dist/claude-web]
 *
 * Reads packs/<pack>/pack.json and writes dist/claude-web/<pack>/:
 *   skills/<name>.zip         one upload per skill (folder <name>/ at the zip root)
 *   skills/<name>/            unpacked copy, for inspection
 *   projects/<name>/          instructions.md (paste into the Project) + knowledge/ (upload)
 *   README.md, CONTENTS.md
 *
 * Per skill: frontmatter reduced to name + description (optional override from pack.json),
 * origin kept as an HTML comment, `forge:<skill>` rewritten to `<skill>`, optional claude.ai note appended.
 * Fails on names or descriptions claude.ai would reject. No dependencies (Node >= 18).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = path.resolve(outIdx >= 0 ? args[outIdx + 1] : path.join(ROOT, 'dist', 'claude-web'));
const packNames = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
let errors = 0;
const err = (m) => { errors++; console.error('ERROR  ' + m); };
const warn = (m) => console.warn('WARN   ' + m);

// ---------- skills on disk ----------
const skillDirs = new Map();
for (const cat of fs.readdirSync(path.join(ROOT, 'skills'))) {
  const c = path.join(ROOT, 'skills', cat);
  if (!fs.statSync(c).isDirectory()) continue;
  for (const sk of fs.readdirSync(c)) if (fs.existsSync(path.join(c, sk, 'SKILL.md'))) skillDirs.set(sk, path.join(c, sk));
}

function parseSkill(file) {
  const s = fs.readFileSync(file, 'utf8');
  const end = s.indexOf('\n---', 3);
  if (!s.startsWith('---') || end === -1) return null;
  const lines = s.slice(4, end).split('\n');
  const fm = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (m) {
      let v = m[2];
      if (/^[>|]-?$/.test(v)) { // folded or literal block scalar
        const block = [];
        while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) block.push(lines[++i].trim());
        v = block.join(m[2].startsWith('|') ? '\n' : ' ');
      }
      fm[m[1]] = v.replace(/^["']|["']$/g, '');
    }
    const o = lines[i].match(/^\s+origin:\s*(.*)$/);
    if (o) fm.origin = o[1].replace(/^["']|["']$/g, '');
  }
  const body = s.slice(end + 4).replace(/^\r?\n/, '');
  if (!fm.origin) { const c = body.match(/<!--\s*origin:\s*([^>]+?)\s*-->/); if (c) fm.origin = c[1]; }
  return { fm, body };
}

// ---------- minimal zip writer (deflate) ----------
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function dosTime(d) {
  return { time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate() };
}
function writeZip(target, entries) { // entries: [{ name, data }]
  const locals = [], centrals = [];
  let offset = 0;
  const { time, date } = dosTime(new Date());
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8');
    const deflated = zlib.deflateRawSync(e.data);
    const useDeflate = deflated.length < e.data.length;
    const payload = useDeflate ? deflated : e.data;
    const crc = crc32(e.data);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(useDeflate ? 8 : 0, 8);
    h.writeUInt16LE(time, 10); h.writeUInt16LE(date, 12); h.writeUInt32LE(crc, 14); h.writeUInt32LE(payload.length, 18);
    h.writeUInt32LE(e.data.length, 22); h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(useDeflate ? 8 : 0, 10);
    c.writeUInt16LE(time, 12); c.writeUInt16LE(date, 14); c.writeUInt32LE(crc, 16); c.writeUInt32LE(payload.length, 20);
    c.writeUInt32LE(e.data.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(offset, 42);
    locals.push(h, name, payload);
    centrals.push(c, name);
    offset += h.length + name.length + payload.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16);
  fs.writeFileSync(target, Buffer.concat([...locals, cd, eocd]));
}

function listFiles(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(p, base, out);
    else if (e.name !== 'openai.yaml' && e.name !== '.DS_Store') out.push(path.relative(base, p));
  }
  return out.sort();
}

// ---------- export one pack ----------
function exportPack(packName) {
  const packFile = path.join(ROOT, 'packs', packName, 'pack.json');
  if (!fs.existsSync(packFile)) { err(`unknown pack: ${packName}`); return; }
  const pack = JSON.parse(fs.readFileSync(packFile, 'utf8'));
  const maxDesc = pack.maxDescription || 1024;
  const dest = path.join(OUT, pack.name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.join(dest, 'skills'), { recursive: true });

  const entries = pack.skills.map((s) => (typeof s === 'string' ? { name: s } : s));
  const inPack = new Set(entries.map((e) => e.name));
  const rows = [];
  for (const entry of entries) {
    const dir = skillDirs.get(entry.name);
    if (!dir) { err(`${pack.name}: skill not found: ${entry.name}`); continue; }
    const parsed = parseSkill(path.join(dir, 'SKILL.md'));
    if (!parsed) { err(`${entry.name}: no frontmatter`); continue; }
    const description = (entry.description || parsed.fm.description || '').trim();
    if (!/^[a-z0-9-]{1,64}$/.test(entry.name) || /anthropic|claude/.test(entry.name)) err(`${entry.name}: invalid skill name for claude.ai`);
    if (!description) err(`${entry.name}: empty description`);
    if (description.length > maxDesc) err(`${entry.name}: description ${description.length} chars > ${maxDesc} (add a "description" override in pack.json)`);
    if (/[<>]/.test(description)) err(`${entry.name}: description must not contain < or >`);

    let body = parsed.body.replace(/forge:([a-z0-9-]+)/g, (m, ref) => {
      if (!inPack.has(ref)) warn(`${entry.name}: references '${ref}', which is not in the pack`);
      return ref;
    });
    for (const pat of ['${CLAUDE_PLUGIN_ROOT}', '/forge:', '.forge/']) if (body.includes(pat)) warn(`${entry.name}: contains '${pat}' (Claude Code only)`);
    if (entry.note) body = body.trimEnd() + '\n\n## On claude.ai\n\n' + entry.note + '\n';
    const header = `---\nname: ${entry.name}\ndescription: ${JSON.stringify(description)}\n---\n` +
      (parsed.fm.origin && !/<!--\s*origin:/.test(body) ? `<!-- origin: ${parsed.fm.origin} -->\n` : '');

    const skillOut = path.join(dest, 'skills', entry.name);
    const zipEntries = [];
    for (const rel of listFiles(dir)) {
      const data = rel === 'SKILL.md' ? Buffer.from(header + body, 'utf8') : fs.readFileSync(path.join(dir, rel));
      fs.mkdirSync(path.dirname(path.join(skillOut, rel)), { recursive: true });
      fs.writeFileSync(path.join(skillOut, rel), data);
      zipEntries.push({ name: `${entry.name}/${rel.split(path.sep).join('/')}`, data });
    }
    writeZip(path.join(dest, 'skills', `${entry.name}.zip`), zipEntries);
    rows.push(`| \`${entry.name}\` | ${description.length} | ${description.replace(/\|/g, '\\|')} |`);
  }

  const projectRows = [];
  for (const p of pack.projects || []) {
    const pdir = path.join(dest, 'projects', p.name);
    fs.mkdirSync(path.join(pdir, 'knowledge'), { recursive: true });
    const instr = path.join(ROOT, p.instructions);
    if (!fs.existsSync(instr)) { err(`${p.name}: instructions not found: ${p.instructions}`); continue; }
    fs.writeFileSync(path.join(pdir, 'instructions.md'), `<!-- Projet claude.ai : « ${p.title} » — coller ce qui suit dans les instructions du projet -->\n\n` + fs.readFileSync(instr, 'utf8'));
    for (const k of p.knowledge || []) {
      const src = path.join(ROOT, k);
      if (!fs.existsSync(src)) { err(`${p.name}: knowledge file not found: ${k}`); continue; }
      fs.copyFileSync(src, path.join(pdir, 'knowledge', path.basename(k)));
    }
    projectRows.push(`| **${p.title}** | \`projects/${p.name}/\` | ${(p.knowledge || []).map((k) => '`' + path.basename(k) + '`').join(', ') || '—'} |`);
  }

  const readme = path.join(ROOT, 'packs', packName, 'README.md');
  if (fs.existsSync(readme)) fs.copyFileSync(readme, path.join(dest, 'README.md'));
  fs.writeFileSync(path.join(dest, 'CONTENTS.md'), `# ${pack.title}\n\n_Généré par \`node scripts/export-claude-web.js ${pack.name}\`._\n\n` +
    `## Skills (importer chaque \`skills/<nom>.zip\`)\n\n| Skill | Car. | Description |\n|---|---|---|\n${rows.join('\n')}\n\n` +
    `## Projets\n\n| Projet | Dossier | Connaissances fournies |\n|---|---|---|\n${projectRows.join('\n')}\n`);
  console.log(`${pack.name}: ${rows.length} skills, ${projectRows.length} projects → ${path.relative(process.cwd(), dest) || dest}`);
}

const packs = packNames.length ? packNames : fs.readdirSync(path.join(ROOT, 'packs')).filter((d) => fs.existsSync(path.join(ROOT, 'packs', d, 'pack.json')));
for (const p of packs) exportPack(p);
process.exit(errors ? 1 : 0);
