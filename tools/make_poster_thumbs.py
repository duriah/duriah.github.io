#!/usr/bin/env python3
"""Rasterise page 1 of each poster PDF into a web thumbnail in assets/img/.

Display size is ~200 CSS px wide; we render at 2x for retina and never upscale
beyond the PDF's own resolution (A0 pages are ~2384pt wide, so 2x of 200px is a
large downscale in every case).
"""
import sys
from pathlib import Path

import fitz
from PIL import Image

REPO = Path(__file__).resolve().parent.parent
TARGET_CSS_WIDTH = 200
DEVICE_SCALE = 2
POSTERS = {
    "assets/docs/COUSIN_Poster_Cybiome_LLD_Italy_2026.pdf": "assets/img/poster-cousin-2026.png",
    "assets/docs/PosterEcoForecast.pdf": "assets/img/poster-intecol-2022.png",
}


def renderThumb(pdfPath, outPath, pxWidth):
    """Render page 1 of pdfPath to a PNG exactly pxWidth wide, palette-quantised."""
    doc = fitz.open(pdfPath)
    page = doc[0]
    if pxWidth > page.rect.width:
        raise ValueError(f"{pdfPath}: refusing to upscale {page.rect.width}pt to {pxWidth}px")
    scale = pxWidth / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    img.quantize(colors=192, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(
        outPath, optimize=True
    )
    return img.size


pxWidth = TARGET_CSS_WIDTH * DEVICE_SCALE
for src, dst in POSTERS.items():
    srcPath = REPO / src
    dstPath = REPO / dst
    dstPath.parent.mkdir(parents=True, exist_ok=True)
    size = renderThumb(srcPath, dstPath, pxWidth)
    sys.stdout.write(f"{dst}  {size[0]}x{size[1]}  {dstPath.stat().st_size / 1024:.0f}KB\n")
