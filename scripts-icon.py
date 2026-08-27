# -*- coding: utf-8 -*-
"""
Generates build/icon.ico from 鏡 — the same glyph as the app's mark.

    python scripts-icon.py

Needs Pillow (`pip install pillow`) and runs once, whenever the artwork
changes. The .ico is committed; this script exists so it is not an unexplained
binary.

The relationship with the in-app mark is deliberate: in the navigation rail the
鏡 is light on graphite, here it is dark on wisteria. The app is named "mirror".

Every size is drawn on its own rather than scaled down from one master: a kanji
has far too many strokes to survive a single reduction. At small sizes the
glyph takes up more of the tile and the stroke is thickened, or it fades out
and disappears.
"""

import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow not found. Install it with: pip install pillow")

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "build", "icon.ico")

# Yu Gothic Bold is the same font Windows uses to draw 鏡 inside the app, since
# only Zen Kaku Gothic New's Latin subset is bundled.
FONT = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", "YuGothB.ttc")
GLYPH = "\u93e1"  # 鏡

INK = (25, 21, 39, 255)  # --color-accent-ink
LIGHT = (214, 200, 255)    # light wisteria, top-left corner
DARK = (160, 140, 232)     # deep wisteria, bottom-right corner

# size -> (fraction of the tile the glyph fills, corner radius, stroke boost)
PROFILES = {
    256: (0.62, 0.225, 0.000),
    128: (0.62, 0.225, 0.000),
    64: (0.66, 0.220, 0.004),
    48: (0.70, 0.210, 0.008),
    32: (0.72, 0.200, 0.014),
    24: (0.78, 0.180, 0.020),
    16: (0.80, 0.160, 0.028),
}

SUPER = 8  # drawing big and scaling down preserves the thin strokes


def gradient(side):
    """A soft diagonal: gives the tile depth without becoming a colour blob."""
    g = Image.new("RGB", (side, side))
    px = g.load()
    last = max(1, side - 1)
    for y in range(side):
        for x in range(side):
            t = (x + y) / (2 * last)
            px[x, y] = tuple(round(LIGHT[i] + (DARK[i] - LIGHT[i]) * t) for i in range(3))
    return g


def draw(size):
    frac, radius_frac, boost = PROFILES[size]
    side = size * SUPER
    stroke = round(side * boost)

    tile = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    mask = Image.new("L", (side, side), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, side - 1, side - 1], radius=int(side * radius_frac), fill=255
    )
    tile.paste(gradient(side), (0, 0), mask)

    d = ImageDraw.Draw(tile)

    def ink_box(font):
        return d.textbbox((0, 0), GLYPH, font=font, stroke_width=stroke)

    # Converge on the point size whose REAL INK measures the requested
    # fraction. The side bearings the font reserves do not count: using them
    # would leave the kanji off-centre and smaller than intended.
    target = side * frac
    point = int(target)
    for _ in range(24):
        x0, y0, x1, y1 = ink_box(ImageFont.truetype(FONT, point))
        largest = max(x1 - x0, y1 - y0)
        if largest == 0 or abs(largest - target) <= side * 0.004:
            break
        point = max(1, int(point * target / largest))

    font = ImageFont.truetype(FONT, point)
    x0, y0, x1, y1 = ink_box(font)
    d.text(
        ((side - (x1 - x0)) / 2 - x0, (side - (y1 - y0)) / 2 - y0),
        GLYPH,
        font=font,
        fill=INK,
        stroke_width=stroke,
        stroke_fill=INK,
    )

    return tile.resize((size, size), Image.LANCZOS)


def main():
    sizes = sorted(PROFILES, reverse=True)
    images = {t: draw(t) for t in sizes}

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    # `append_images` makes Pillow match each .ico entry with the image of the
    # same size, instead of scaling one piece of art down for all of them.
    images[256].save(
        OUT,
        format="ICO",
        sizes=[(t, t) for t in sizes],
        append_images=[images[t] for t in sizes if t != 256],
    )
    print("wrote", OUT, "with", ", ".join(str(s) for s in sorted(sizes)))


if __name__ == "__main__":
    main()
