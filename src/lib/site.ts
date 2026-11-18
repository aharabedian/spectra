// Helpers shared by the pages and the Starlight overrides.
import { base, projects, suite } from '../../spectra.config.mjs';

type Built = { version: string; ref: string; sha: string; docs: number };
// Written by scripts/fetch-docs.mjs. Optional here so a fresh checkout still type-checks.
const generated = import.meta.glob<{ default: Record<string, Built> }>('../data/projects.json', { eager: true });
const built: Record<string, Built> = Object.values(generated)[0]?.default ?? {};

/** A URL inside the site, with the base path: u('prism/') → '/spectra/prism/'. */
export const u = (path = '') => base + path.replace(/^\//, '');

export type ProjectId = 'prism' | 'lens' | 'lumen';
/** Which top-bar item a page belongs to: the home page, a project's landing page, or the docs. */
export type Place = 'home' | ProjectId | 'docs';
export const project = (id: string) => projects.find((p) => p.id === id);

/** The version the docs were built from: "1.2.0", or "1.2.0+abc1234" when following main. */
export const version = (id: ProjectId) => built[id]?.version ?? '';

/** A project's changelog on GitHub. */
export const changelog = (p: { repo: string }) => `https://github.com/${p.repo}/blob/main/CHANGELOG.md`;

/** Which project a Starlight page belongs to, from its id ("prism/docs/setup"); undefined for other pages. */
export const projectOfDoc = (id: string) => projects.find((p) => id === `${p.id}/docs` || id.startsWith(`${p.id}/docs/`));

export { projects, base, suite };
