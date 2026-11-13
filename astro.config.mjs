// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { base, site, projects } from './spectra.config.mjs';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Spectra',
      description: 'PRISM, LENS and LUMEN: OpenComputers programs for running a GregTech: New Horizons base.',
      logo: { src: './src/assets/mark.svg', alt: '' },
      favicon: '/favicon.svg',
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
      sidebar: [
        { label: 'Spectra', items: [{ label: 'Putting the suite together', link: '/guide/' }] },
        ...projects.map((p) => ({ label: p.name, items: [{ autogenerate: { directory: `${p.id}/docs` } }] })),
      ],
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
