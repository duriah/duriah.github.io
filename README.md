# duriah.github.io

Personal site of Uriah Daugaard, built with [Quarto](https://quarto.org).

```bash
quarto preview          # live-reload server
quarto render           # one-shot build → docs/
```

GitHub Pages serves the site from `docs/` on the default branch, so the build
output is committed.

## How a page is put together

Every page is a `.qmd` whose YAML sets `theme: none` and `page-layout: custom`,
so Quarto skips its own article wrapper and the page is laid out entirely by the
project's own CSS.

The YAML header of each page carries two things and nothing else:

```yaml
include-in-header:
  - text: |
      <link rel="stylesheet" href="/site/pages/<page>.css">
      <script>document.documentElement.dataset.page='<key>';</script>
```

- the **page's own stylesheet**, one file per page under `site/pages/`;
- the **page key**, which is what the shared navigation uses to highlight the
  current entry (see below). It is set on `<html>` rather than `<body>` so it
  applies before first paint.

The body is Quarto markdown — headings, prose, links, fenced divs
(`::: {.rp-meta}` … `:::`) — with small ` ```{=html} ` blocks where markdown
cannot express the required DOM. Those exceptions are deliberate and each one is
commented in place. They fall into a few groups:

- **Anything that would gain a `<p>` wrapper.** `site/site.css` styles bare `<p>`
  (`margin:0 0 14px; font-size:19px; line-height:1.6`), so a paragraph that was
  not there before moves the layout. Markdown paragraphs are used only where the
  original markup already had a `<p>`.
- **Flex and grid rows whose children are inline elements** (`<a>`, `<span>`).
  Written as markdown they collapse into a single `<p>`, i.e. one flex item.
- **Images**, `<figure>` and `<figcaption>`, which markdown either wraps in a
  `<p>` or promotes to a captioned figure.
- `<main>`, which markdown cannot express, and which is worth keeping for
  assistive technology.

`section-divs: false` is set project-wide in `_quarto.yml`. Without it Quarto
wraps every heading in a `<section>` **and moves the heading's classes onto it**,
which reparents grid children and breaks these layouts.

Two smaller traps worth knowing before editing a page:

- **Apostrophes.** Quarto's smart punctuation turns a plain `'` in markdown into
  a typographic `’`. Where the original markup used a straight quote, the source
  escapes it — `What I\'m working on` — so the rendered character stays `'`.
- **`::: {}` is not a plain div.** Quarto discards an attribute-less fenced div
  entirely, so a classless layout wrapper (`<div>` used purely as a grid child)
  has to stay raw HTML or the grid gains its grandchildren as direct children.

## Navigation

The top bar and the footer are single files, `_partials/nav.html` and
`_partials/foot.html`, inlined into every page at build time via
`include-before-body` / `include-after-body` in `_quarto.yml`. They are therefore
present in the served HTML and work without JavaScript. They live under
`_partials/` rather than `site/` so Quarto does not also publish them as pages.

Their links are **root-relative** (`/projects.html`). Pages exist at two depths —
`/contact.html` and `/ResearchPages/SamplingFreq.html` — and document-relative
hrefs resolve wrongly from the second.

The active entry is chosen in CSS from the page key, not by script:

```css
:where(:root[data-page="lab"]) .site-bar a[data-nav="lab"] { color: var(--terracotta) }
```

The `:where()` wrapper keeps the specificity exactly where the old
`.site-bar a.on` rule sat, so `:hover` still resolves the same way.

Quarto's built-in `navbar:` is deliberately **not** used: it only renders when a
Bootstrap theme supplies its markup and JavaScript, and restyling it would not
reproduce this design.

`site/site.js` is left with only what genuinely needs a client: the dark-mode
preference (persisted in `localStorage`, applied to `:root[data-theme]`) and the
narrow-viewport drawer.

## Stylesheets

| File | Scope |
| --- | --- |
| `site/site.css` | design tokens, light/dark themes, nav, footer, shared type and components |
| `site/research-page.css` | shared layout for the `ResearchPages/` write-ups |
| `site/pages/<page>.css` | layout for one page only |

Page stylesheets are linked from the page's YAML header, which places them
*before* `styles.css` and `site/site.css` in `<head>`. That ordering is
intentional: the shared stylesheets win ties at equal specificity.

## Posters

The Posters block on `talks.qmd` shows a rendered thumbnail of page 1 of each
poster PDF. Regenerate them after adding or replacing a poster:

```bash
python tools/make_poster_thumbs.py     # needs pymupdf + pillow
```

The script maps `assets/docs/*.pdf` to `assets/img/poster-*.png`; add new posters
to the `POSTERS` dict at the top. It renders at 2× the display width and refuses
to upscale.

## Licensing and the drawings

`LICENSE` (MIT) covers the **code only** — stylesheets, build config, partials,
`tools/`. The drawings, diagrams, posters, CV and page text are © Uriah Daugaard,
all rights reserved. `NOTICE` spells out which files fall under which, including
the third-party material (`assets/figures/**` are figures from published papers,
where rights may rest with the journals).

The original drawings carry the notice in their own file metadata — a `tEXt`
`Copyright` chunk in the PNGs, a Dublin Core `<metadata>` block in the SVGs — so
the claim survives someone saving the file. `tools/make_poster_thumbs.py`
output is stamped the same way. Copyright is deliberately **not** in the `alt`
text: alt is the description a screen-reader user hears in place of the image,
not a place for legal metadata.

## Accent colours

Three accent tokens carry meaning: `--sage` is the general accent, `--gold`
marks distinctions (Elton Prize, joint first, first author), `--terracotta` marks
the current nav item. Dark mode rebinds `--sage` to gold, so a gold *outline* no
longer distinguishes a badge from ordinary accent text. Distinction badges
therefore also carry `--gold-fill`, which is `transparent` in light mode and a
faint gold wash in dark. Use `rgba(var(--gold-rgb), α)` rather than a literal
gold, or the colour will not follow the theme.

## Bootstrap

`_quarto.yml` still sets `theme: [flatly, _variables_flatly.scss]`, even though
every page also sets `theme: none`. The per-page setting does not stop Quarto
emitting the project's Bootstrap bundle, and the pages were built against the
base styling it provides — heading rules, list and figure margins, button
metrics. Removing it is not a no-op: it changes layout on every page (for
example each research-page `h2` loses the underline and ~9.5px of height that
Quarto's own stylesheet gives it).

Dropping Bootstrap is worth doing — it is ~500 KB — but it is a **redesign, not a
cleanup**, and needs the compensating base rules to be written explicitly and
checked page by page.

## Structure

```
_quarto.yml                       project config, partials, section-divs:false
_partials/
  nav.html                        top bar, inlined into every page
  foot.html                       footer, inlined into every page
index.qmd  projects.qmd  research.qmd  lab.qmd  talks.qmd  contact.qmd
ResearchPages/
  warmingFRpage.qmd  EcoComplexEcoForecast.qmd  SamplingFreq.qmd
site/
  site.css  research-page.css  site.js
  pages/*.css                     one stylesheet per page
assets/
  img/                            everything rendered on a page
  figures/                        figures for the ResearchPages write-ups
  docs/                           things a visitor downloads (CV, poster)
docs/                             build output, served by GitHub Pages
```

Assets are split by purpose, not by page: `img/` is site imagery, `figures/` is
paper figures, `docs/` is downloads. Pages in `ResearchPages/` therefore refer to
their figures as `../assets/figures/…`.

Filenames are matched **case-sensitively** by GitHub Pages even though macOS is
case-insensitive locally, so a reference that works in `quarto preview` can still
404 once deployed. Worth a look if an asset goes missing only in production.
