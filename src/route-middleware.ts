// Each project's docs get a sidebar of their own, with the rest of Spectra linked below it, and
// previous/next links that stay inside the project.
import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';
import { projectOfDoc, projects, u } from './lib/site';

type Entry = StarlightRouteData['sidebar'][number];
type Link = Extract<Entry, { type: 'link' }>;

const link = (label: string, href: string, isCurrent = false): Link => ({
  type: 'link', label, href, isCurrent, badge: undefined, attrs: {},
});
const group = (label: string, entries: Entry[]): Entry => ({
  type: 'group', label, entries, collapsed: false, badge: undefined,
});
const flatten = (entries: Entry[]): Link[] =>
  entries.flatMap((e) => (e.type === 'group' ? flatten(e.entries) : [e]));

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const current = projectOfDoc(route.id);
  const groups = route.sidebar;

  let own: Entry[];
  let rest: Entry;
  if (current) {
    const g = groups.find((e) => e.type === 'group' && e.label === current.name);
    own = g && g.type === 'group' ? g.entries : [];
    rest = group('Spectra', [
      link('Putting the suite together', u('guide/')),
      ...projects.filter((p) => p !== current).map((p) => link(`${p.name} docs`, u(`${p.id}/docs/`))),
    ]);
  } else {
    const g = groups.find((e) => e.type === 'group' && e.label === 'Spectra');
    own = g && g.type === 'group' ? g.entries : [];
    rest = group('Projects', projects.map((p) => link(`${p.name} docs`, u(`${p.id}/docs/`))));
  }
  route.sidebar = [...own, rest];

  const pages = flatten(own);
  const i = pages.findIndex((l) => l.isCurrent);
  route.pagination = {
    prev: i > 0 ? pages[i - 1] : undefined,
    next: i >= 0 && i < pages.length - 1 ? pages[i + 1] : undefined,
  };
});
