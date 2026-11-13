// Each project's docs get a sidebar of their own and previous/next links that stay inside the project.
// The switcher above the sidebar (Sidebar.astro) moves between the suite guide and the projects' docs,
// keeping your place: from PRISM's Setup, LENS goes to LENS's Setup, or its Overview when it has none.
import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';
import { projectOfDoc, projects, u } from './lib/site';

type Entry = StarlightRouteData['sidebar'][number];
type Link = Extract<Entry, { type: 'link' }>;

/** One tab of the docs switcher. */
export type DocsTab = { id: string; label: string; href: string; isCurrent: boolean };

const flatten = (entries: Entry[]): Link[] =>
  entries.flatMap((e) => (e.type === 'group' ? flatten(e.entries) : [e]));

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const current = projectOfDoc(route.id);
  const groupOf = (label: string) => {
    const g = route.sidebar.find((e) => e.type === 'group' && e.label === label);
    return g && g.type === 'group' ? g.entries : [];
  };

  // The page's name within its project ("setup" for prism/docs/setup), to find the same page elsewhere.
  const page = current ? route.id.slice(`${current.id}/docs`.length).replace(/^\//, '') : '';
  context.locals.spectraDocsTabs = [
    { id: 'suite', label: 'Suite', href: u('guide/'), isCurrent: !current },
    ...projects.map((p) => {
      const same = u(`${p.id}/docs/${page ? `${page}/` : ''}`);
      const has = flatten(groupOf(p.name)).some((l) => l.href === same);
      return { id: p.id, label: p.name, href: has ? same : u(`${p.id}/docs/`), isCurrent: p === current };
    }),
  ];

  const own = groupOf(current ? current.name : 'Spectra');
  route.sidebar = own;

  const pages = flatten(own);
  const i = pages.findIndex((l) => l.isCurrent);
  route.pagination = {
    prev: i > 0 ? pages[i - 1] : undefined,
    next: i >= 0 && i < pages.length - 1 ? pages[i + 1] : undefined,
  };
});
