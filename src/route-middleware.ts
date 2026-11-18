// Every docs page shows one sidebar with all three projects (astro.config.mjs). This keeps previous/next
// inside the page's own project, so "Next" from PRISM's last page doesn't jump into LENS, and names the
// project in the browser tab: "Setup · PRISM | SPECTRA" rather than three tabs all called "Setup".
import { defineRouteMiddleware, type StarlightRouteData } from '@astrojs/starlight/route-data';
import { projectOfDoc } from './lib/site';

type Entry = StarlightRouteData['sidebar'][number];
type Link = Extract<Entry, { type: 'link' }>;

const flatten = (entries: Entry[]): Link[] =>
  entries.flatMap((e) => (e.type === 'group' ? flatten(e.entries) : [e]));

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const p = projectOfDoc(route.id);
  if (!p) return;

  const group = route.sidebar.find((e) => e.type === 'group' && e.label === p.name);
  const pages = group && group.type === 'group'
    ? flatten(group.entries).filter((l) => l.href.startsWith('/')) // not the Changelog on GitHub
    : [];
  const i = pages.findIndex((l) => l.isCurrent);
  route.pagination = {
    prev: i > 0 ? pages[i - 1] : undefined,
    next: i >= 0 && i < pages.length - 1 ? pages[i + 1] : undefined,
  };

  const title = route.head.find((h) => h.tag === 'title');
  if (title) title.content = `${route.entry.data.title} · ${p.name} | ${route.siteTitle}`;
});
