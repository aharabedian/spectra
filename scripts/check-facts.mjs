#!/usr/bin/env node
// check-facts.mjs: the landing pages and the suite guide are written by hand, so they can drift from the
// projects they describe. After fetch-docs, check that every name they quote still appears somewhere in the
// projects' docs: programs (prism-setup), metrics (lumen_stored_eu), config keys in code samples
// (lensPort = ...) and anything in inline code. Exits 1 on a missing name, so a rename in a project
// release stops the deploy instead of leaving the site describing something that no longer exists.
//
// A name that is fine to be missing from the docs (an example value, a CSS class) goes in IGNORE.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../spectra.config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'src/content/docs');

/** Names quoted on the site that the projects' docs don't need to contain. */
const IGNORE = new Set([
  'lib/<name>/', // the guide's placeholder for lib/prism/, lib/lens/, lib/lumen/
]);

const read = (f) => fs.readFileSync(f, 'utf8');
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

// What the projects say: every fetched doc of every project.
const corpus = projects
  .map((p) => path.join(CONTENT, p.id))
  .filter((d) => fs.existsSync(d) || (console.error(`no docs for ${d}: run fetch-docs first`), process.exit(1)))
  .flatMap(walk)
  .filter((f) => f.endsWith('.md'))
  .map(read)
  .join('\n');

// What the site says: the hand-written pages.
const sources = [
  ...walk(path.join(ROOT, 'src/pages')).filter((f) => f.endsWith('.astro')),
  ...walk(path.join(CONTENT, 'guide')).filter((f) => f.endsWith('.md')),
];

const decode = (s) => s.replace(/<[^>]+>/g, '').replace(/&#123;/g, '{').replace(/&#125;/g, '}')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function namesIn(text) {
  const names = new Set();
  const ids = projects.map((p) => p.id).join('|');
  // Programs, metrics and config files: prism-setup, lumen_stored_eu, lens-hub.cfg.
  for (const m of text.matchAll(new RegExp(`\\b(?:${ids})[-_][a-z0-9_]+(?:\\.cfg)?\\b`, 'g'))) names.add(m[0]);
  // Inline code: <code class="i">x</code> on the pages, `x` in the guide.
  for (const m of text.matchAll(/<code class="i">([\s\S]*?)<\/code>|`([^`\n]+)`/g)) names.add((m[1] !== undefined ? decode(m[1]) : m[2]).trim());
  // Config keys in code samples: <pre class="code"> on the pages, ```lua in the guide.
  for (const m of text.matchAll(/<pre class="code">([\s\S]*?)<\/pre>|```lua[^\n]*\n([\s\S]*?)```/g)) {
    for (const k of (m[1] !== undefined ? decode(m[1]) : m[2]).matchAll(/\b([A-Za-z_]\w*)\s*=(?!=)/g)) names.add(k[1]);
  }
  return names;
}

const missing = [];
let checked = 0;
for (const file of sources) {
  const text = read(file).replace(/https?:\/\/\S+?(?=["'\s)<])/g, ''); // URLs aren't claims
  for (const name of namesIn(text)) {
    if (!name || IGNORE.has(name)) continue;
    checked++;
    if (!corpus.includes(name)) missing.push([path.relative(ROOT, file), name]);
  }
}

for (const [file, name] of missing) console.log(`✗ ${file}: "${name}" isn't in any project's docs`);
console.log(`${checked} names quoted by the site, ${missing.length} not found in the projects' docs`);
process.exit(missing.length ? 1 : 0);
