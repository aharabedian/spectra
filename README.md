<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/spectra-lockup-horizontal-color.svg">
    <img alt="SPECTRA" src=".github/assets/spectra-lockup-horizontal-color-on-light.svg" width="360">
  </picture>
</p>

<p align="center">
  <b>Route the items. Watch the power. See the whole base.</b><br>
  OpenComputers programs for running a GregTech: New Horizons base.
</p>

<p align="center">
  <a href="https://aharabedian.github.io/spectra/"><b>Website</b></a> ·
  <a href="https://aharabedian.github.io/spectra/docs/"><b>Docs</b></a>
</p>

**SPECTRA** (*Suite of Programs for Engineering, Control, Telemetry, Routing & Automation*; also what a
prism produces) is three programs for [OpenComputers](https://github.com/GTNewHorizons/OpenComputers) in
GregTech: New Horizons. Each runs on its own computer and works alone. Turn on LENS reporting in PRISM and
LUMEN, and both show up on one LENS dashboard and in AR glasses.

| | Project | What it does | |
|---|---|---|---|
| 🟧 | **[PRISM](https://github.com/aharabedian/prism)**<br><sub>Programmable Routing & Item Sorting for ME</sub> | Routes items from an AE2 subnet to your machines by pattern rules, shares the load when one falls behind, and alerts on stalls. Touchscreen control panel | [Overview](https://aharabedian.github.io/spectra/prism/) · [Docs](https://aharabedian.github.io/spectra/prism/docs/) |
| 🟦 | **[LENS](https://github.com/aharabedian/lens)**<br><sub>Live Engineering & Network Status</sub> | Gathers every system's health, metrics and alerts into one dashboard and an AR glasses HUD. Watches, never controls | [Overview](https://aharabedian.github.io/spectra/lens/) · [Docs](https://aharabedian.github.io/spectra/lens/docs/) |
| 🟩 | **[LUMEN](https://github.com/aharabedian/lumen)**<br><sub>Load, Usage & Management of Energy Networks</sub> | Every Lapotronic Supercapacitor on one screen, with history and alerts for low power and fast drain; switches generators on and off by the fill | [Overview](https://aharabedian.github.io/spectra/lumen/) · [Docs](https://aharabedian.github.io/spectra/lumen/docs/) |

Each installs with two lines on an OpenComputers computer with an Internet Card:

```
wget -f https://raw.githubusercontent.com/aharabedian/prism/main/src/prism-update.lua /home/prism-update.lua
/home/prism-update
```

(`lens-update` and `lumen-update` the same way.) Lua 5.3 architecture, MIT licensed, and tested against a
simulated OpenComputers, AE2 and GregTech, so every screen on the site is drawn by the tests.

## About this repo

This repo is the website: the home page, the three project landing pages, the docs index and the styling.
**Each project's docs stay in its own repo**, including how it works with the other two, (`README.md` and `docs/*.md`) and are pulled in when the site
builds, so they're written once, read on GitHub or on the site, and never copied by hand. Built with
[Astro](https://astro.build) and [Starlight](https://starlight.astro.build); published to GitHub Pages.

### How the docs get here

```
prism / lens / lumen                         spectra
────────────────────                         ───────
publish a release ──► notify-spectra.yml ──► repository_dispatch ──► deploy.yml
                                                                      1. fetch-docs: each repo at its
                                                                         newest vX.Y.Z tag
                                                                      2. check-facts
                                                                      3. astro build
                                                                      4. check-links
                                                                      5. deploy to Pages
```

The site builds from each project's **latest release**, the same thing `<name>-update` installs by default,
so it never documents something players can't install yet. A repo with no releases is built from `main`.
The nightly run and pushes to this repo rebuild too.

`scripts/fetch-docs.mjs` does the translating:

| In the project repo | On the site |
|---|---|
| `README.md` | `/<id>/docs/`, titled *Introduction*, without its row of links to the site (Website · Docs · ...) |
| `docs/setup.md` and its `# Setup` heading | `/<id>/docs/setup/`, titled *Setup* |
| `[configuration.md](configuration.md#rules)` | a link to `/<id>/docs/configuration/#rules`; link text that's just a file name shows the page title |
| `../config/prism.example.cfg`, `CONTRIBUTING.md`, anything else outside `docs/` | a link to the file on GitHub, at the release tag |
| `https://github.com/aharabedian/lens/blob/main/docs/telemetry.md` | `/lens/docs/telemetry/` (links between the projects stay on the site) |
| `https://github.com/aharabedian/spectra`, `https://aharabedian.github.io/spectra/...` | the site's own pages, checked by `check-links` |
| `![...](images/x.png)` | an optimized image; also copied to `/shots/<id>/` for the landing pages |
| `> [!NOTE]`, `> [!WARNING]`... (GitHub alerts) | a Starlight aside in the site's colors |

#### Writing docs in a project repo

Write for GitHub and the site follows:

- Start each file with one `# Title`. It becomes the page title and the sidebar label.
- Link between docs with relative paths (`setup.md#updating`). Anything else in the repo can be linked
  relatively too; it goes to GitHub.
- Use GitHub alerts for callouts: `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!CAUTION]`.
- Put images in `docs/images/` (where `make screens` already writes them).
- A new `docs/*.md` shows up on the next build, at the end of its sidebar. To place it, add its name to
  `order` in [`spectra.config.mjs`](spectra.config.mjs).

Docs changes reach the site with the next release. To show a fix sooner, run **Deploy** by hand from the
Actions tab with `ref` set to `main`, or set that project's `ref: 'main'` in `spectra.config.mjs`.

### Working on the site

Needs Node 22.23.4 or newer (Astro's minimum).

```sh
npm ci
npm run fetch-docs      # clone each project at its latest release into .cache/, write src/content/docs/<id>/
npm run dev             # http://localhost:4321/spectra/
npm run site            # fetch-docs + check-facts + build + check-links, as CI does
```

Preview a project's **unreleased** docs from your own checkouts, next to this repo:

```sh
SPECTRA_LOCAL=.. npm run fetch-docs && npm run dev       # reads ../prism, ../lens, ../lumen as they are
SPECTRA_REF=main npm run fetch-docs                      # every project from GitHub's main
PRISM_REF=v1.1.0 npm run fetch-docs                      # one project from a given tag (LENS_REF, LUMEN_REF)
```

| Path | What |
|---|---|
| `spectra.config.mjs` | The suite's name and acronym, the projects (accent colors, one-line summaries, sidebar order), and the site's base path |
| `src/pages/` | Home (`index.astro`), the landing pages (`prism/`, `lens/`, `lumen/`) and the docs index (`docs/`, generated from the docs) |
| `src/content/docs/<id>/` | **Generated** by `fetch-docs`; git-ignored. Edit the docs in their own repo |
| `src/content/i18n/en.json` | Starlight UI labels we change ("On this page" starts at *Top*, not *Overview*) |
| `src/components/SiteNav.astro` | The top bar, identical on every page: logo (home) on the left; PRISM, LENS, LUMEN (landing pages) and Docs centered; search and GitHub on the right |
| `src/components/Shot.astro` | A project's screenshot on a landing page, whole or cropped to a region in screen cells (8 × 16 px), so its text stays readable. Crops follow the project's layout: check them after a release that changes a screen |
| `src/components/starlight/` | Starlight overrides: the header (the top bar), the line above each page title (project and version), dark-only theme |
| `src/route-middleware.ts` | Keeps previous/next inside a project and names the project in the tab title. The sidebar (all three projects) is in `astro.config.mjs` |
| `src/assets/mark.svg`, `public/` icons, `public/social/` | From the logo kit ("Hub"): the small mark for the top bar (30 px), `favicon.svg`/`.ico` and `apple-touch-icon.png`, and the Open Graph image |
| `src/styles/` | `tokens.css` (palette, shared bits), `site.css` (landing pages), `starlight.css` (docs) |
| `scripts/` | `fetch-docs.mjs`, `check-facts.mjs`, `check-links.mjs` |
| `extras/project-repo/` | The workflow each project repo needs (below) |

The landing pages are hand-written, so they can fall behind a project. `check-facts` catches the worst
case: every program, metric, config key and inline-code name they quote must still appear
in some project's docs, or the build stops. Prose, numbers and screenshot captions aren't checked: when a
release changes what a landing page describes, update the page.

The landing pages' screenshots come from `/shots/<id>/`, the images fetched with the docs, so they update
when the projects re-render their screens. Each project draws its README images from a busy scene in its tests
(`test_showcase.lua`, `make docs-images`), so they show a full base rather than a test's few items. Version numbers come from the release tags.

How PRISM, LENS and LUMEN work together is documented in the projects' own docs (PRISM's and LUMEN's
*Reporting to LENS*, LENS's *Connecting agents*), so it's released with the code it describes. The home
page's *How they fit* section only summarizes and links there; `/guide/`, where a suite guide used to be,
redirects to it.

### Publishing

Pushes to `main` deploy to GitHub Pages (**Settings → Pages → Source: GitHub Actions**), and a nightly run
picks up new project releases within a day. To rebuild the moment a project publishes a release instead:

1. Create a fine-grained personal access token with access to **only** `aharabedian/spectra` and the
   **Contents: Read and write** repository permission (what `repository_dispatch` needs).
2. In each project repo, add it as an Actions secret named `SPECTRA_DISPATCH_TOKEN` and copy
   [`extras/project-repo/.github/workflows/notify-spectra.yml`](extras/project-repo/.github/workflows/notify-spectra.yml)
   to `.github/workflows/`.

**On a custom domain:** set `base = '/'` and `site` in `spectra.config.mjs`, add `public/CNAME` containing
the domain, and point a CNAME record at `aharabedian.github.io`. Every link is built from `base`, so
nothing else changes.

## License

[MIT](LICENSE). A fan project, not affiliated with GregTech: New Horizons, OpenComputers or Applied Energistics 2.
