// spectra.config.mjs: the one place that says which projects make up SPECTRA, where the site is served,
// and how each project's docs are ordered. Read by astro.config.mjs, scripts/fetch-docs.mjs and the pages.

/** Where the site is served. GitHub Pages project site: "/spectra/". On a custom domain: "/". */
export const base = '/spectra/';

/** The site's own URL, for canonical links and the sitemap. */
export const site = 'https://aharabedian.github.io';

/** The suite: the site's name (always in capitals), its acronym and its repo. */
export const suite = {
  name: 'SPECTRA',
  expansion: 'Suite of Programs for Engineering, Control, Telemetry, Routing & Automation',
  repo: 'aharabedian/spectra',
};

/**
 * The projects. Docs come from each repo's README.md and docs/*.md.
 * - ref: "release" builds from the newest vX.Y.Z tag (what `<name>-update` installs by default);
 *   "main" follows the branch. A repo with no releases falls back to main, like `<name>-update` does.
 * - summary: one sentence, shown in the footer and on the docs index.
 * - order: sidebar order by file name without .md ("README" is the Introduction). Files not listed go
 *   last, alphabetically, so a new doc shows up without touching this file.
 */
export const projects = [
  {
    id: 'prism',
    name: 'PRISM',
    repo: 'aharabedian/prism',
    ref: 'release',
    accent: '#FF9F43',
    expansion: 'Programmable Routing & Item Sorting for ME',
    summary: 'Routes items from an AE2 subnet to your machines by rules on item names.',
    order: ['README', 'setup', 'configuration', 'architecture', 'protocol', 'troubleshooting'],
  },
  {
    id: 'lens',
    name: 'LENS',
    repo: 'aharabedian/lens',
    ref: 'release',
    accent: '#5EB4FF',
    expansion: 'Live Engineering & Network Status',
    summary: 'Shows what PRISM, LUMEN and your own programs report, on one screen and in AR glasses.',
    order: ['README', 'setup', 'hub', 'views', 'hud', 'examples', 'queries', 'troubleshooting', 'telemetry', 'architecture'],
  },
  {
    id: 'lumen',
    name: 'LUMEN',
    repo: 'aharabedian/lumen',
    ref: 'release',
    accent: '#4FD17A',
    expansion: 'Load, Usage & Management of Energy Networks',
    summary: 'Monitors your Lapotronic Supercapacitors and switches generators on and off by their fill.',
    order: ['README', 'setup', 'configuration', 'architecture'],
  },
];
