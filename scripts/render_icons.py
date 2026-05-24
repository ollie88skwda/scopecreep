#!/usr/bin/env python3
"""Render ScopeCreep Notary extension icons at Chrome-required sizes.

Outputs:
  icons/icon16.png
  icons/icon48.png
  icons/icon128.png

Design: rounded square, dark near-black background, amber notarial mark
(a "<" bracket — the trigger glyph for scope-expansion phrases) centered.
Matches the workspace dark-mono palette.

Run:
  python3 scripts/render_icons.py
"""
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)

# Brand palette — matches voice/ workspace + popup
BG = (10, 10, 10, 255)              # #0a0a0a near-black
PANEL = (17, 17, 17, 255)           # #111111 (subtle border)
ACCENT = (212, 166, 74, 255)        # #d4a64a amber
ACCENT_DIM = (212, 166, 74, 90)     # amber at low alpha (soft ring)
INK = (230, 230, 230, 255)          # #e6e6e6 off-white


def render(size: int) -> Image.Image:
    """Render a single icon at the given size (square)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded square — slight inset so the rounded corners don't
    # touch the bounding box.
    pad = max(1, size // 32)
    radius = max(2, size // 6)
    draw.rounded_rectangle(
        (pad, pad, size - pad - 1, size - pad - 1),
        radius=radius,
        fill=BG,
        outline=ACCENT_DIM,
        width=max(1, size // 64),
    )

    # The mark — a thick "<" bracket glyph centered.
    # We draw it geometrically (lines), not as text, so it's pixel-perfect
    # at small sizes where font hinting falls apart.
    cx, cy = size / 2, size / 2
    arm = size * 0.28
    stroke = max(2, int(size * 0.13))

    # Two line segments forming a < (left-pointing chevron)
    # tips at (cx + arm*0.6, cy - arm*0.85) and (cx + arm*0.6, cy + arm*0.85)
    # converging at (cx - arm*0.55, cy)
    apex_x = cx - arm * 0.55
    top_x, top_y = cx + arm * 0.55, cy - arm * 0.85
    bot_x, bot_y = cx + arm * 0.55, cy + arm * 0.85

    draw.line(
        [(top_x, top_y), (apex_x, cy)],
        fill=ACCENT,
        width=stroke,
        joint="curve",
    )
    draw.line(
        [(apex_x, cy), (bot_x, bot_y)],
        fill=ACCENT,
        width=stroke,
        joint="curve",
    )

    # Round the chevron tips by drawing filled circles at the endpoints
    r = stroke / 2
    for (x, y) in [(top_x, top_y), (apex_x, cy), (bot_x, bot_y)]:
        draw.ellipse((x - r, y - r, x + r, y + r), fill=ACCENT)

    return img


def main():
    for size in (16, 48, 128):
        img = render(size)
        path = OUT / f"icon{size}.png"
        img.save(path, "PNG", optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
