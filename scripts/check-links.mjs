#!/usr/bin/env node
// check-links.mjs: after `astro build`, check every link and image inside the site resolves to a page or
// file in dist/, and that #anchors exist on the page they point to. Exits 1 on any broken link, so CI
// stops before deploying. External links (GitHub and the rest) aren't fetched.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { base } from '../spectra.config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) pages.push(p);
  }
})(DIST);

const idsCache = new Map();
function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}

/** The file in dist/ that a site URL path serves, or null. */
function resolve(urlPath) {
  if (!urlPath.startsWith(base)) return null;
  const rel = decodeURIComponent(urlPath.slice(base.length));
  const candidates = [path.join(DIST, rel), path.join(DIST, rel, 'index.html')];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null;
}

const broken = [];
let checked = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  const pageUrl = '/' + path.relative(DIST, page).replace(/index\.html$/, '').split(path.sep).join('/');
  const here = base + pageUrl.slice(1);
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = m[1].replace(/&amp;/g, '&');
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue; // external, mailto:, data:
    const url = new URL(raw, `http://site${here}`);
    if (!url.pathname.startsWith(base)) { broken.push([pageUrl, raw, 'outside the site base']); continue; }
    checked++;
    const file = resolve(url.pathname);
    if (!file) { broken.push([pageUrl, raw, 'no such page or file']); continue; }
    const hash = decodeURIComponent(url.hash.slice(1));
    if (hash && hash !== '_top' && file.endsWith('.html') && !idsOf(file).has(hash)) {
      broken.push([pageUrl, raw, `no #${hash} on that page`]);
    }
  }
}

for (const [page, link, why] of broken) console.log(`✗ ${page}  →  ${link}  (${why})`);
console.log(`${checked} internal links in ${pages.length} pages, ${broken.length} broken`);
process.exit(broken.length ? 1 : 0);
