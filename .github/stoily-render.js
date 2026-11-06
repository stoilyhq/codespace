#!/usr/bin/env node
// Render an org's .devcontainer/devcontainer.json from the stoilyhq/codespace TEMPLATE and the org's
// own .devcontainer/stoily.json. Run by .github/workflows/stoily-update.yml (in an org's copy only):
//
//   node .github/stoily-render.js [--source <sha>] <template devcontainer.json> <stoily.json> <out devcontainer.json>
//   node .github/stoily-render.js --org <stoily.json>     prints its "org" ("" when unreadable), comments allowed
//
// --source <sha>: the stoilyhq/codespace commit the template came from, written into the GENERATED first
// line, so the next run can tell an older template from a newer one.
//
// The output is the template with its comments removed and exactly two things set from stoily.json:
//   - customizations.codespaces.repositories = { "<org>/*": { permissions: { contents: write } } }
//     (the ONE Codespaces grant: any other grant in the template is dropped);
//   - the options of the stoily Feature (ghcr.io/stoilyhq/codespace/stoily:<major>): org, owner,
//     maxHours, clientPrefix, galleryRepo (any other option of the template is kept as it is).
// Everything else comes from the template unchanged. A value that is not valid (the same rules as the
// Feature's install-kit.sh), the placeholder YOUR-ORG, an unknown key or a template without exactly one
// stoily Feature is refused: exit 1, nothing written. Same inputs → byte-identical output.
'use strict';
const fs = require('fs');
const path = require('path');

const header = (sha) => `// GENERATED from stoilyhq/codespace${sha ? `@${sha}` : ''} — edit .devcontainer/stoily.json`;
// Any reference to the stoily Feature (a tag, a digest, none); exactly one is allowed, and it must be a TAG.
const FEATURE_ANY_RE = /^ghcr\.io\/stoilyhq\/codespace\/stoily([:@]|$)/;
const FEATURE_RE = /^ghcr\.io\/stoilyhq\/codespace\/stoily:[0-9A-Za-z.-]+$/;
const LOGIN_RE = /^[A-Za-z0-9]([A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const RULES = {
  org: [LOGIN_RE, 'a GitHub org name'],
  owner: [/^$|^[A-Za-z0-9]([A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/, 'empty or a GitHub login'],
  maxHours: [/^$|^[0-9]{1,2}$/, 'empty or whole hours (0-99)'],
  clientPrefix: [/^[a-z0-9][a-z0-9-]{0,30}$/, 'lowercase letters, digits and - (and not empty)'],
  galleryRepo: [/^$|^([A-Za-z0-9]([A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/)?[A-Za-z0-9._-]{1,100}$/, 'empty, a repo name or owner/name'],
};
const DEFAULTS = { owner: '', maxHours: '', clientPrefix: 'client-', galleryRepo: '' };

function die(msg) { process.stderr.write(`stoily-render: ${msg}\n`); process.exit(1); }

// JSON with comments (// and /* */, outside strings) and trailing commas → plain JSON text.
function stripJsonc(src) {
  let out = '', i = 0, inStr = false;
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (inStr) {
      out += c;
      if (c === '\\') { out += n === undefined ? '' : n; i += 2; continue; }
      if (c === '"') inStr = false;
      i++; continue;
    }
    if (c === '"') { inStr = true; out += c; i++; continue; }
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && n === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) throw new Error('an unterminated /* comment');
      i = end + 2; continue;
    }
    out += c; i++;
  }
  // trailing commas, outside strings: a second pass that again skips strings
  let res = ''; inStr = false;
  for (let j = 0; j < out.length; j++) {
    const c = out[j];
    if (inStr) { res += c; if (c === '\\') { res += out[++j] || ''; } else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; res += c; continue; }
    if (c === ',') { let k = j + 1; while (/\s/.test(out[k] || '')) k++; if (out[k] === '}' || out[k] === ']') continue; }
    res += c;
  }
  return res;
}

function readJsonc(file, what) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { die(`cannot read ${what} ${file}: ${e.code || e.message}`); }
  try { return JSON.parse(stripJsonc(text)); } catch (e) { die(`${what} ${file} is not valid JSON: ${e.message}`); }
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function main(argv) {
  if (argv[0] === '--org') { // the placeholder check: never fails, "" when it cannot read the file
    let org = '';
    try { const c = JSON.parse(stripJsonc(fs.readFileSync(argv[1], 'utf8'))); if (isObj(c) && typeof c.org === 'string') org = c.org; } catch (_) { /* "" */ }
    process.stdout.write(`${org}\n`);
    return;
  }
  let sha = '';
  if (argv[0] === '--source') {
    sha = argv[1] || '';
    if (!/^[0-9a-f]{40}$/.test(sha)) die(`--source ${JSON.stringify(sha)} is not a commit sha`);
    argv = argv.slice(2);
  }
  if (argv.length !== 3) die('usage: stoily-render.js [--source <sha>] <template devcontainer.json> <stoily.json> <out devcontainer.json>');
  const [tplFile, cfgFile, outFile] = argv;
  const tpl = readJsonc(tplFile, 'the template');
  const cfg = readJsonc(cfgFile, '.devcontainer/stoily.json');

  // ── stoily.json: exactly the known keys, each a valid string ──
  if (!isObj(cfg)) die('.devcontainer/stoily.json must be a JSON object');
  for (const k of Object.keys(cfg)) if (!Object.hasOwn(RULES, k)) die(`.devcontainer/stoily.json: unknown key "${k}" (allowed: ${Object.keys(RULES).join(', ')})`);
  const v = Object.assign({}, DEFAULTS, cfg);
  if (!('org' in cfg)) die('.devcontainer/stoily.json: "org" is missing — set it to your GitHub org');
  for (const [k, [re, want]] of Object.entries(RULES)) {
    if (typeof v[k] !== 'string') die(`.devcontainer/stoily.json: "${k}" must be a string (${want})`);
    if (!re.test(v[k]) || (k === 'galleryRepo' && v[k].includes('..'))) die(`.devcontainer/stoily.json: "${k}" = ${JSON.stringify(v[k])} is not ${want}`);
  }
  if (v.org.toUpperCase() === 'YOUR-ORG') die('.devcontainer/stoily.json: "org" is still the placeholder YOUR-ORG — set it to your GitHub org');

  // ── the template: exactly one stoily Feature ──
  if (!isObj(tpl) || !isObj(tpl.features)) die('the template has no "features" object');
  const keys = Object.keys(tpl.features).filter((k) => FEATURE_ANY_RE.test(k));
  if (keys.length !== 1) die(`the template must reference the stoily Feature exactly once (found ${keys.length})`);
  if (!FEATURE_RE.test(keys[0])) die(`the template's stoily Feature ${JSON.stringify(keys[0])} is not ghcr.io/stoilyhq/codespace/stoily:<tag>`);
  const fk = keys[0];
  const opts = isObj(tpl.features[fk]) ? Object.assign({}, tpl.features[fk]) : {};
  for (const k of Object.keys(RULES)) opts[k] = v[k];
  tpl.features[fk] = opts;

  // ── the ONE Codespaces grant: <org>/* (built fresh: no other grant survives) ──
  if (tpl.customizations !== undefined && !isObj(tpl.customizations)) die('the template\'s "customizations" is not an object');
  tpl.customizations = tpl.customizations || {};
  if (tpl.customizations.codespaces !== undefined && !isObj(tpl.customizations.codespaces)) die('the template\'s "customizations.codespaces" is not an object');
  tpl.customizations.codespaces = tpl.customizations.codespaces || {};
  tpl.customizations.codespaces.repositories = { [`${v.org}/*`]: { permissions: { contents: 'write' } } };

  const text = `${header(sha)}\n${JSON.stringify(tpl, null, 2)}\n`;
  const tmp = path.join(path.dirname(outFile), `.${path.basename(outFile)}.tmp-${process.pid}`);
  try {
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, outFile);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch (_) { /* never written */ }
    die(`cannot write ${outFile}: ${e.code || e.message}`);
  }
}

main(process.argv.slice(2));
