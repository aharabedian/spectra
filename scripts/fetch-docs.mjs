#!/usr/bin/env node
// fetch-docs.mjs: bring each project's README.md and docs/ into the site.
//
// For every project in spectra.config.mjs it:
//   1. picks the ref to build from: the newest vX.Y.Z tag, or main (see `ref` in the config);
//   2. shallow-clones that ref into .cache/<id>/ (or uses a local checkout, see SPECTRA_LOCAL);
//   3. writes src/content/docs/<id>/docs/*.md with frontmatter (title from the # heading, sidebar order,
//      edit link) and links rewritten for the site; README.md becomes the docs' index page ("Overview");
//   4. copies docs/images/ next to them, and into public/shots/<id>/ for the landing pages;
//   5. records the version and commit in src/data/projects.json.
//
// The markdown stays GitHub-first: write relative links (configuration.md#rules, ../config/x.cfg) and
// GitHub alerts (> [!NOTE]); this script turns them into site links and Starlight asides.
//
// Environment:
//   SPECTRA_LOCAL=..       read projects from ../prism, ../lens, ../lumen instead of cloning (preview your
//                          working copy's docs with `SPECTRA_LOCAL=.. npm run fetch-docs && npm run dev`)
//   SPECTRA_REF=main       build every project from main, whatever the config says
//   PRISM_REF=v1.1.0       build one project from a given tag or branch (LENS_REF, LUMEN_REF likewise)

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';
import { visit } from 'unist-util-visit';
import { base, projects } from '../spectra.config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.cache');
const CONTENT = path.join(ROOT, 'src/content/docs');
const PUBLIC_SHOTS = path.join(ROOT, 'public/shots');
const DATA = path.join(ROOT, 'src/data/projects.json');

const git = (args, opts = {}) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();

/** The newest stable vX.Y.Z tag of a repo, or null when it has none. */
function latestTag(url) {
  const tags = git(['ls-remote', '--tags', '--refs', url])
    .split('\n')
    .map((line) => line.split('refs/tags/')[1])
    .filter((t) => t && /^v?\d+\.\d+\.\d+$/.test(t));
  const num = (t) => t.replace(/^v/, '').split('.').map(Number);
  tags.sort((a, b) => {
    const [x, y] = [num(a), num(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  });
  return tags.at(-1) ?? null;
}

/** Check out a project; returns { dir, ref, sha, version }. */
function checkout(p) {
  const url = `https://github.com/${p.repo}`;
  const local = process.env.SPECTRA_LOCAL;
  if (local) {
    const dir = path.resolve(ROOT, local, p.id);
    if (!fs.existsSync(path.join(dir, 'README.md'))) throw new Error(`SPECTRA_LOCAL: no ${p.id} checkout at ${dir}`);
    let sha = 'local';
    try { sha = git(['-C', dir, 'rev-parse', '--short', 'HEAD']); } catch {}
    return { dir, ref: 'main', sha, version: `${readVersion(dir) ?? '?'} (local)` };
  }
  const wanted = process.env[`${p.id.toUpperCase()}_REF`] || process.env.SPECTRA_REF || p.ref;
  const ref = wanted === 'release' ? latestTag(url) ?? 'main' : wanted;
  const dir = path.join(CACHE, p.id);
  fs.rmSync(dir, { recursive: true, force: true });
  git(['clone', '--quiet', '--depth', '1', '--branch', ref, url, dir], { env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '1' } });
  const sha = git(['-C', dir, 'rev-parse', '--short', 'HEAD']);
  const version = /^v?\d+\.\d+\.\d+$/.test(ref) ? ref.replace(/^v/, '') : `${readVersion(dir) ?? ref}+${sha}`;
  return { dir, ref, sha, version };
}

/** The version string from lib/<id>/version.lua, if there is one. */
function readVersion(dir) {
  const lib = path.join(dir, 'lib');
  if (!fs.existsSync(lib)) return null;
  for (const name of fs.readdirSync(lib)) {
    const f = path.join(lib, name, 'version.lua');
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').match(/["'](\d+\.\d+\.\d+[^"']*)["']/)?.[1] ?? null;
  }
  return null;
}

const slugOf = (file) => file.replace(/\.md$/i, '').toLowerCase();
const byId = Object.fromEntries(projects.map((p) => [p.id, p]));
const siteUrl = (p) => `${base}${p}`;

/**
 * Rewrite one URL found in a project's markdown file.
 * kind: "link" or "image"; src: the file's path in its repo (README.md, docs/setup.md).
 */
function rewriteUrl(url, kind, p, src, ref) {
  // Links to the sibling repos on GitHub become links into the site.
  const gh = url.match(/^https:\/\/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?(?:\/(?:blob|tree)\/[^/]+\/([^#?]*))?\/?(#.*)?$/i);
  if (gh) {
    const target = projects.find((q) => q.repo.toLowerCase() === gh[1].toLowerCase());
    if (!target) return url;
    const file = gh[2] ?? '';
    const hash = gh[3] ?? '';
    if (file === '') return siteUrl(`${target.id}/`) + hash;
    const mapped = mapRepoPath(file, hash, kind, target.id, target.repo, 'main');
    return mapped ?? url;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') || url.startsWith('#') || url === '') return url;
  const [pathPart, ...rest] = url.split('#');
  const hash = rest.length ? `#${rest.join('#')}` : '';
  const repoPath = path.posix.normalize(path.posix.join(path.posix.dirname(src), decodeURI(pathPart)));
  if (repoPath.startsWith('..')) return url;
  return mapRepoPath(repoPath, hash, kind, p.id, p.repo, ref) ?? url;
}

/** Map a path inside a repo to where it lives on the site; anything not on the site goes to GitHub. */
function mapRepoPath(repoPath, hash, kind, id, repo, ref) {
  const clean = repoPath.replace(/\/$/, '');
  if (/^readme\.md$/i.test(clean)) return siteUrl(`${id}/docs/`) + hash;
  const doc = clean.match(/^docs\/([^/]+\.md)$/i);
  if (doc) return siteUrl(`${id}/docs/${slugOf(doc[1])}/`) + hash;
  const img = clean.match(/^docs\/images\/(.+)$/);
  if (img) return kind === 'image' ? `./images/${img[1]}` : siteUrl(`shots/${id}/${img[1]}`);
  return `https://github.com/${repo}/blob/${ref}/${clean}${hash}`;
}

const ALERTS = { NOTE: 'note', TIP: 'tip', IMPORTANT: 'note', WARNING: 'caution', CAUTION: 'danger' };

const parse = (md) => fromMarkdown(md, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });

/** Apply [start, end, text] edits, last first, so earlier offsets stay valid. */
function applyEdits(md, edits) {
  edits.sort((a, b) => b[0] - a[0]);
  let out = md;
  for (const [s, e, text] of edits) out = out.slice(0, s) + text + out.slice(e);
  return out;
}

/** Page titles by "<id>:<path in repo>", filled before any page is written (for link text, below). */
const titles = new Map();

/** "prism:docs/setup.md" for a site URL that is a docs page, else null. */
function docKeyOf(siteHref) {
  const m = siteHref.startsWith(base) && siteHref.slice(base.length).match(/^([a-z]+)\/docs\/(?:([^/#]+)\/)?(?:#.*)?$/);
  if (!m) return null;
  return m[2] ? `${m[1]}:docs/${m[2]}.md` : `${m[1]}:README.md`;
}

/** Rewrite link and image destinations for the site. Edits by source offsets, so nothing else changes.
 *  A link whose text is just the file name ([setup.md](setup.md)) shows the page's title instead. */
function rewriteLinks(md, p, src, ref) {
  const edits = [];
  visit(parse(md), (node) => {
    if (!['link', 'image', 'definition'].includes(node.type) || !node.position) return;
    const start = node.position.start.offset;
    const raw = md.slice(start, node.position.end.offset);
    if (node.type === 'link' && !raw.startsWith('[')) return; // autolinks show their URL: leave them
    const next = rewriteUrl(node.url, node.type === 'image' ? 'image' : 'link', p, src, ref);
    if (next === node.url) return;
    // The destination comes after the text: take the last occurrence of the URL in the node.
    const at = raw.lastIndexOf(node.url);
    if (at < 0) return;
    edits.push([start + at, start + at + node.url.length, next]);
    const only = node.type === 'link' && node.children?.length === 1 ? node.children[0] : null;
    const title = titles.get(docKeyOf(next) ?? '');
    if (only && ['text', 'inlineCode'].includes(only.type) && title && /^[\w./-]+\.md$/i.test(only.value)
        && node.url.split('#')[0].endsWith(only.value)) {
      edits.push([only.position.start.offset, only.position.end.offset, title]);
    }
  });
  return applyEdits(md, edits);
}

/** Turn GitHub alerts (> [!NOTE] ...) into Starlight asides (:::note ... :::). */
function convertAlerts(md) {
  const edits = [];
  visit(parse(md), 'blockquote', (node) => {
    const first = node.children[0];
    const text = first?.type === 'paragraph' && first.children[0]?.type === 'text' ? first.children[0].value : '';
    const m = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
    if (!m) return;
    const { start, end } = node.position;
    const body = md
      .slice(start.offset, end.offset)
      .split('\n')
      .map((line) => line.replace(/^\s*>\s?/, ''))
      .join('\n')
      .replace(/^\[!\w+\][ \t]*\n?/, '');
    edits.push([start.offset, end.offset, `:::${ALERTS[m[1]]}\n${body}\n:::`]);
    return 'skip';
  });
  return applyEdits(md, edits);
}

const transform = (md, p, src, ref) => convertAlerts(rewriteLinks(md, p, src, ref));

/** Take the first "# Heading" as the title and drop it from the body. */
function splitTitle(md) {
  const m = md.match(/^\s*#\s+(.+?)\s*#*\s*$/m);
  if (!m) return { title: null, body: md };
  return { title: m[1].trim(), body: md.replace(m[0], '').replace(/^\s*\n/, '') };
}

const yaml = (s) => JSON.stringify(s);

function writeDoc(p, co, srcRel, outName, orderIndex) {
  const raw = fs.readFileSync(path.join(co.dir, srcRel), 'utf8');
  const isReadme = /^readme\.md$/i.test(srcRel);
  const { title, body } = splitTitle(raw);
  const pageTitle = isReadme ? 'Overview' : title ?? outName.replace(/\.md$/, '');
  const fm = [
    '---',
    `title: ${yaml(pageTitle)}`,
    isReadme ? `description: ${yaml(`${p.name}: ${p.expansion}`)}` : null,
    'sidebar:',
    `  order: ${orderIndex}`,
    `editUrl: ${yaml(`https://github.com/${p.repo}/edit/main/${srcRel}`)}`,
    '---',
    '',
  ].filter((l) => l !== null).join('\n');
  const notice = `<!-- Generated from ${p.repo}/${srcRel} at ${co.ref} (${co.sha}) by scripts/fetch-docs.mjs. Edit it there. -->\n\n`;
  const out = path.join(CONTENT, p.id, 'docs', outName);
  fs.writeFileSync(out, fm + notice + transform(body, p, srcRel, co.ref));
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return 0;
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (e.isDirectory()) n += copyDir(path.join(from, e.name), path.join(to, e.name));
    else { fs.copyFileSync(path.join(from, e.name), path.join(to, e.name)); n++; }
  }
  return n;
}

const checkouts = new Map();
for (const p of projects) {
  const co = checkout(p);
  checkouts.set(p.id, co);
  const docsDir = path.join(co.dir, 'docs');
  titles.set(`${p.id}:README.md`, 'Overview');
  for (const f of fs.existsSync(docsDir) ? fs.readdirSync(docsDir) : []) {
    if (!/\.md$/i.test(f)) continue;
    const t = splitTitle(fs.readFileSync(path.join(docsDir, f), 'utf8')).title;
    if (t) titles.set(`${p.id}:docs/${slugOf(f)}.md`, t);
  }
}

const data = {};
for (const p of projects) {
  const co = checkouts.get(p.id);
  const outDir = path.join(CONTENT, p.id, 'docs');
  fs.rmSync(path.join(CONTENT, p.id), { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const docsDir = path.join(co.dir, 'docs');
  const files = fs.existsSync(docsDir) ? fs.readdirSync(docsDir).filter((f) => /\.md$/i.test(f)) : [];
  const orderOf = (name) => {
    const i = p.order.indexOf(name);
    return i >= 0 ? i : p.order.length + files.indexOf(`${name}.md`);
  };
  writeDoc(p, co, 'README.md', 'index.md', 0);
  for (const f of files.sort()) {
    if (/^index\.md$/i.test(f)) continue; // would collide with the README's page
    writeDoc(p, co, `docs/${f}`, `${slugOf(f)}.md`, orderOf(f.replace(/\.md$/i, '')));
  }
  const images = copyDir(path.join(docsDir, 'images'), path.join(outDir, 'images'));
  fs.rmSync(path.join(PUBLIC_SHOTS, p.id), { recursive: true, force: true });
  copyDir(path.join(docsDir, 'images'), path.join(PUBLIC_SHOTS, p.id));

  data[p.id] = { version: co.version, ref: co.ref, sha: co.sha, docs: files.length + 1 };
  console.log(`${p.name.padEnd(6)} ${co.ref.padEnd(8)} ${co.sha}  ${files.length + 1} pages, ${images} images`);
}

fs.mkdirSync(path.dirname(DATA), { recursive: true });
fs.writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');
