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
  <a href="https://aharabedian.github.io/spectra/"><b>Website and docs</b></a> ·
  <a href="https://aharabedian.github.io/spectra/guide/">Putting the suite together</a>
</p>

SPECTRA is three small projects for [OpenComputers](https://github.com/GTNewHorizons/OpenComputers) in
GregTech: New Horizons. Each runs on its own computer and is useful alone; turn on LENS reporting and
PRISM and LUMEN show up on one dashboard and in your AR glasses.

| | Project | What it does | |
|---|---|---|---|
| 🟧 | **[PRISM](https://github.com/aharabedian/prism)**<br><sub>Programmable Routing & Item Sorting for ME</sub> | Routes items from an AE2 subnet to your machines by pattern rules, shares the load when one falls behind, and alerts on stalls. Touchscreen control panel | [Overview](https://aharabedian.github.io/spectra/prism/) · [Docs](https://aharabedian.github.io/spectra/prism/docs/) |
| 🟦 | **[LENS](https://github.com/aharabedian/lens)**<br><sub>Live Engineering & Network Status</sub> | Gathers every system's health, metrics and alerts into one dashboard and an AR glasses HUD. Watches, never controls | [Overview](https://aharabedian.github.io/spectra/lens/) · [Docs](https://aharabedian.github.io/spectra/lens/docs/) |
| 🟩 | **[LUMEN](https://github.com/aharabedian/lumen)**<br><sub>Load, Usage & Management of Energy Networks</sub> | Every Lapotronic Supercapacitor on one screen, with history and alerts that don't cry wolf; switches generators with the fill | [Overview](https://aharabedian.github.io/spectra/lumen/) · [Docs](https://aharabedian.github.io/spectra/lumen/docs/) |

Each installs with two lines on an OpenComputers computer with an Internet Card:

```
wget -f https://raw.githubusercontent.com/aharabedian/prism/main/src/prism-update.lua /home/prism-update.lua
/home/prism-update
```

(`lens-update` and `lumen-update` the same way.) Lua 5.3 architecture, MIT licensed, and tested against a
mocked OpenComputers, AE2 and GregTech world, so every screen on the site is a real render.

## About this repo

This repo is the website: the home page, the three project landing pages, the suite guide and the styling.
**Each project's docs stay in its own repo** (`README.md` and `docs/*.md`) and are pulled in when the site
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
| `README.md` | `/<id>/docs/`, titled *Overview* |
| `docs/setup.md` and its `# Setup` heading | `/<id>/docs/setup/`, titled *Setup* |
| `[configuration.md](configuration.md#rules)` | a link to `/<id>/docs/configuration/#rules`; link text that's just a file name shows the page title |
| `../config/prism.example.cfg`, `CONTRIBUTING.md`, anything else outside `docs/` | a link to the file on GitHub, at the release tag |
| `https://github.com/aharabedian/lens/blob/main/docs/telemetry.md` | `/lens/docs/telemetry/` (links between the projects stay on the site) |
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
| `spectra.config.mjs` | The projects, their accent colors, sidebar order, and the site's base path |
| `src/pages/` | Home (`index.astro`) and the landing pages (`prism/`, `lens/`, `lumen/`) |
| `src/content/docs/guide/` | *Putting the suite together*, the one doc that lives here |
| `src/content/docs/<id>/` | **Generated** by `fetch-docs`; git-ignored. Edit the docs in their own repo |
| `src/components/` | `SiteNav` (top bar: the suite or a project, staying in Overview or Docs) and `SubNav` (that area's Overview, Docs, Changelog, Source), on every page |
| `src/components/starlight/` | Starlight overrides: the header (both bars), the page title's crumb, dark-only theme |
| `src/route-middleware.ts` | Gives each project's docs their own sidebar and previous/next links, and where the top bar's links go from a docs page (the same page in another project when it has one) |
| `src/assets/mark.svg`, `public/` icons, `public/social/` | From the logo kit ("Hub"): the small mark for the top bar (30 px), `favicon.svg`/`.ico` and `apple-touch-icon.png`, and the Open Graph image |
| `src/styles/` | `tokens.css` (palette, shared bits), `site.css` (landing pages), `starlight.css` (docs) |
| `scripts/` | `fetch-docs.mjs`, `check-facts.mjs`, `check-links.mjs` |
| `extras/project-repo/` | The workflow each project repo needs (below) |

The landing pages are hand-written, so they can fall behind a project. `check-facts` catches the worst
case: every program, metric, config key and inline-code name they (or the guide) quote must still appear
in some project's docs, or the build stops. Prose, numbers and screenshot captions aren't checked: when a
release changes what a landing page describes, update the page.

The landing pages' screenshots come from `/shots/<id>/`, the images fetched with the docs, so they update
when the projects re-render their screens. Version numbers come from the release tags.

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
