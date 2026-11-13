# Spectra

The website for **Spectra**: [PRISM](https://github.com/aharabedian/prism) (item routing),
[LENS](https://github.com/aharabedian/lens) (base-wide monitoring) and
[LUMEN](https://github.com/aharabedian/lumen) (power), OpenComputers programs for running a
GregTech: New Horizons base.

This repo holds the home page, the three project landing pages, the suite guide and the styling. **Each
project's docs stay in its own repo** (`README.md` and `docs/*.md`) and are pulled in when the site builds,
so they're written once, read on GitHub or here, and never copied by hand.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build); published to GitHub
Pages.

## How the docs get here

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

### Writing docs in a project repo

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

## Working on the site

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
| `src/styles/` | `tokens.css` (palette, shared bits), `site.css` (landing pages), `starlight.css` (docs) |
| `scripts/` | `fetch-docs.mjs`, `check-facts.mjs`, `check-links.mjs` |
| `extras/project-repo/` | The workflow each project repo needs (below) |

The landing pages are hand-written, so they can fall behind a project. `check-facts` catches the worst
case: every program, metric, config key and inline-code name they (or the guide) quote must still appear
in some project's docs, or the build stops. Prose, numbers and screenshot captions aren't checked: when a
release changes what a landing page describes, update the page.

The landing pages' screenshots come from `/shots/<id>/`, the images fetched with the docs, so they update
when the projects re-render their screens. Version numbers come from the release tags.

## Setting up (once)

1. **This repo:** push it to `aharabedian/spectra`. In **Settings → Pages**, set **Source** to **GitHub
   Actions**. The first push deploys to `https://aharabedian.github.io/spectra/`.
2. **A token:** create a fine-grained personal access token with access to **only** `aharabedian/spectra`
   and the **Contents: Read and write** repository permission (what `repository_dispatch` needs).
3. **Each project repo** (prism, lens, lumen): add the token as an Actions secret named
   `SPECTRA_DISPATCH_TOKEN`, and copy
   [`extras/project-repo/.github/workflows/notify-spectra.yml`](extras/project-repo/.github/workflows/notify-spectra.yml)
   to `.github/workflows/`. Publishing a release now rebuilds the site; you can also run it by hand.

Skip steps 2 and 3 and the nightly build still picks up new releases within a day.

**A custom domain later** (say `spectra.aharabedian.com`): set `base = '/'` and `site` in
`spectra.config.mjs`, add `public/CNAME` containing the domain, and point a CNAME record at
`aharabedian.github.io`. Every link is built from `base`, so nothing else changes.

## License

[MIT](LICENSE)
