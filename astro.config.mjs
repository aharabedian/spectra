// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import fs from 'node:fs';
import { base, site, projects, suite } from './spectra.config.mjs';

// The version each project's docs were built from (written by scripts/fetch-docs.mjs), for the sidebar.
const built = fs.existsSync('./src/data/projects.json')
  ? JSON.parse(fs.readFileSync('./src/data/projects.json', 'utf8'))
  : {};

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  // The suite guide's content moved into each project's docs; old links land on the home page's summary.
  redirects: { '/guide/': `${base}#how-they-fit` },
  integrations: [
    starlight({
      title: suite.name,
      description: 'PRISM, LENS and LUMEN: OpenComputers programs for running a GregTech: New Horizons base.',
      logo: { src: './src/assets/mark.svg', alt: '' },
      favicon: '/favicon.svg',
      // The rest of the logo kit's head tags (src/layouts/Site.astro has the same for the landing pages).
      head: [
        { tag: 'link', attrs: { rel: 'icon', href: `${base}favicon.ico`, sizes: '48x48' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` } },
        { tag: 'meta', attrs: { property: 'og:image', content: new URL(`${base}social/spectra-og-1200x630.png`, site).href } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
      ],
      customCss: [
        '@fontsource/ibm-plex-sans/400.css',
        '@fontsource/ibm-plex-sans/500.css',
        '@fontsource/ibm-plex-sans/600.css',
        '@fontsource/ibm-plex-sans/700.css',
        '@fontsource/ibm-plex-mono/400.css',
        '@fontsource/ibm-plex-mono/600.css',
        './src/styles/tokens.css',
        './src/styles/starlight.css',
      ],
      components: {
        Header: './src/components/starlight/Header.astro',
        ThemeProvider: './src/components/starlight/ThemeProvider.astro',
        ThemeSelect: './src/components/starlight/Empty.astro',
        Footer: './src/components/starlight/Footer.astro',
        PageTitle: './src/components/starlight/PageTitle.astro',
      },
      routeMiddleware: './src/route-middleware.ts',
      // One sidebar for all the docs: a group per project, with the version its docs describe and its
      // changelog on GitHub. Page order comes from spectra.config.mjs (fetch-docs writes it as frontmatter).
      sidebar: projects.map((p) => ({
        label: p.name,
        badge: built[p.id] ? { text: `v${built[p.id].version}`, class: `sb-version sb-${p.id}` } : undefined,
        items: [
          { autogenerate: { directory: `${p.id}/docs` } },
          {
            label: 'Changelog',
            link: `https://github.com/${p.repo}/blob/main/CHANGELOG.md`,
            attrs: { class: 'sb-external', 'aria-label': `${p.name} changelog (GitHub)` },
          },
        ],
      })),
      expressiveCode: {
        themes: ['github-dark-default'],
        styleOverrides: {
          borderRadius: '10px',
          borderColor: '#232A32',
          codeFontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          codeFontSize: '13.5px',
          codeBackground: '#0F1317',
          frames: { editorBackground: '#0F1317', terminalBackground: '#0F1317', frameBoxShadowCssValue: 'none' },
        },
      },
    }),
  ],
});
