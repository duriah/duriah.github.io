#!/usr/bin/env python3
"""Rebuild assets/img/og-card.png from the home page's own hero block.

The card is cut from the page rather than drawn separately, so it cannot drift
from the site: change the hero and re-run this. That was the problem with the
hand-made card it replaces, which carried an affiliation nobody could edit
because there was no source file for it.

Two decisions are worth knowing:

*It stops at the script line.* The card carries the drawings, the name and
"bioinformatics · ecology · pipelines" — not the degrees line or the tagline
underneath. Feeds render a 1200x630 card at roughly 360-550px wide, and at that
size those two are an unreadable smudge; the crop is chosen to exclude them.

*It renders zoomed, then crops without resampling.* The hero's type is set in
fixed px, so at a 1200px viewport it occupies too little of a 1200px-wide card.
Rendering at ZOOM and cutting a 1200x630 window out of that draws the same
content larger *and* at native resolution — no upscaling anywhere in the path.

Firefox is used headless because it is the browser that is installed. The copy it
renders has `loading="lazy"` stripped, because the screenshot does not wait for
the two lazily-loaded drawings in the hero, and the site bar removed. Neither
touches docs/ itself.

Run after `quarto render`, then render again so docs/ picks the new card up:

    python3 tools/make_og_card.py
"""
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
FIREFOX = Path("/Applications/Firefox.app/Contents/MacOS/firefox")
SOURCE_PAGE = REPO / "docs" / "index.html"
OUT_PATH = REPO / "assets" / "img" / "og-card.png"

CARD_WIDTH = 1200
CARD_HEIGHT = 630
# Chosen so the hero is wide enough to carry the card without overflowing it;
# the assertions below fail loudly if a design change breaks that.
ZOOM = 1.5
CAPTURE_WIDTH = 2100
CAPTURE_HEIGHT = 1400
# The drawings, the name, the script line, and the degrees line.
HERO_BAND_COUNT = 4
# Keeps the degrees line from creeping into the bottom edge of the crop.
CLEARANCE = 5


def buildCaptureCopy(workDir):
    """Write an eager-loading, bar-less, zoomed copy of the home page into workDir.

    Assets are symlinked rather than copied so the page's relative hrefs resolve
    and nothing is duplicated.
    """
    for name in ("assets", "site", "site_libs"):
        (workDir / name).symlink_to(REPO / "docs" / name)

    html = SOURCE_PAGE.read_text()
    html = html.replace(' loading="lazy"', "").replace(' decoding="async"', "")
    html, barCount = re.subn(
        r'<a class="skip".*?</a>\s*<header class="site-bar">.*?</header>',
        "",
        html,
        flags=re.S,
    )
    if barCount != 1:
        raise ValueError(f"expected exactly one site bar to strip, found {barCount}")
    html, headCount = re.subn(
        r"</head>", f"<style>html{{zoom:{ZOOM}}}</style></head>", html, count=1
    )
    if headCount != 1:
        raise ValueError("no </head> to inject the zoom rule into")

    page = workDir / "index.html"
    page.write_text(html)
    return page


def capturePage(page, shotPath, profileDir):
    """Screenshot page with a throwaway profile.

    The separate profile is required: Firefox refuses a second instance against
    the one the user already has open.
    """
    profileDir.mkdir()
    subprocess.run(
        [
            str(FIREFOX), "--headless", "--no-remote",
            "--profile", str(profileDir),
            "--screenshot", str(shotPath),
            "--window-size", f"{CAPTURE_WIDTH},{CAPTURE_HEIGHT}",
            page.as_uri(),
        ],
        check=True,
        env={"MOZ_NO_REMOTE": "1", "HOME": str(profileDir.parent), "PATH": "/usr/bin:/bin"},
    )
    if not shotPath.exists():
        raise RuntimeError(f"firefox exited cleanly but wrote no screenshot to {shotPath}")


def findInkedBands(im):
    """Return [(top, bottom), ...] for each run of rows carrying non-background pixels.

    Measured rather than hard-coded so the crop survives a change of type size.
    """
    px = im.load()
    width, height = im.size
    background = px[3, 3]
    bands, start = [], None
    for y in range(height):
        hasInk = any(px[x, y] != background for x in range(width))
        if hasInk and start is None:
            start = y
        elif not hasInk and start is not None:
            bands.append((start, y - 1))
            start = None
    if start is not None:
        bands.append((start, height - 1))
    return bands


def heroWindow(im, bands):
    """Return the (left, top) of the 1200x630 window to cut around the hero.

    Vertically the window is centred on the hero and then pushed up if that would
    let the degrees line below it into frame. Horizontally it is centred on the
    hero's own inked extent, which is not the centre of the viewport once the
    page is zoomed.
    """
    if len(bands) <= HERO_BAND_COUNT:
        raise ValueError(
            f"found {len(bands)} inked bands, need more than {HERO_BAND_COUNT}; "
            "the home page layout has changed"
        )
    hero, nextBand = bands[:HERO_BAND_COUNT], bands[HERO_BAND_COUNT]
    top, bottom = hero[0][0], hero[-1][1]
    if bottom - top + 1 > CARD_HEIGHT:
        raise ValueError(f"hero is {bottom - top + 1}px tall at zoom {ZOOM}, taller than the card")

    centredBottom = bottom + (CARD_HEIGHT - (bottom - top + 1)) // 2
    windowBottom = min(centredBottom, nextBand[0] - CLEARANCE)
    windowTop = windowBottom - CARD_HEIGHT
    if windowTop > top:
        raise ValueError("cannot fit the hero above the degrees line; adjust ZOOM")

    px = im.load()
    background = px[3, 3]
    inkedX = [
        x for x in range(im.size[0])
        for bandTop, bandBottom in hero
        if any(px[x, y] != background for y in range(bandTop, bandBottom + 1))
    ]
    windowLeft = (min(inkedX) + max(inkedX)) // 2 - CARD_WIDTH // 2
    if max(inkedX) - min(inkedX) + 1 > CARD_WIDTH:
        raise ValueError(f"hero is {max(inkedX) - min(inkedX) + 1}px wide, wider than the card")
    if windowLeft < 0 or windowLeft + CARD_WIDTH > im.size[0] or windowTop < 0:
        raise ValueError("the card window falls outside the capture; widen CAPTURE_WIDTH/HEIGHT")
    return windowLeft, windowTop


def main():
    if not FIREFOX.exists():
        raise SystemExit(f"{FIREFOX} not found; this script needs Firefox to render the page")
    if not SOURCE_PAGE.exists():
        raise SystemExit(f"{SOURCE_PAGE} not found; run `quarto render` first")

    tempRoot = Path(tempfile.mkdtemp(prefix="og-card-"))
    try:
        workDir = tempRoot / "site"
        workDir.mkdir()
        page = buildCaptureCopy(workDir)
        shotPath = tempRoot / "hero.png"
        capturePage(page, shotPath, tempRoot / "profile")

        with Image.open(shotPath) as shot:
            shot = shot.convert("RGB")
            left, top = heroWindow(shot, findInkedBands(shot))
            shot.crop((left, top, left + CARD_WIDTH, top + CARD_HEIGHT)).save(OUT_PATH)
        print(f"{OUT_PATH.relative_to(REPO)}: cut at ({left}, {top}) -> {CARD_WIDTH}x{CARD_HEIGHT}")
    finally:
        shutil.rmtree(tempRoot)


if __name__ == "__main__":
    sys.exit(main())
