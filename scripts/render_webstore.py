#!/usr/bin/env python3
"""Render Chrome Web Store promo / marquee tiles.

Outputs:
  marketing/webstore/promo-small.png    — 440 × 280  (required)
  marketing/webstore/promo-large.png    — 920 × 680  (optional carousel)
  marketing/webstore/promo-marquee.png  — 1400 × 560 (featured slot)

All dark-themed to match the rest of the brand surfaces. Deterministic — no
external assets, no API, no LLM — same pattern as render_og.py.

Run:
  python3 scripts/render_webstore.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "marketing" / "webstore"
OUT.mkdir(parents=True, exist_ok=True)

BG = (10, 10, 10, 255)
PANEL = (17, 17, 17, 255)
LINE = (31, 31, 31, 255)
ACCENT = (212, 166, 74, 255)
ACCENT_SOFT = (212, 166, 74, 60)
INK = (230, 230, 230, 255)
MUTED = (156, 163, 175, 255)
DIM = (107, 114, 128, 255)
WARN = (201, 90, 74, 255)


def font(size, bold=False):
    bold_paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]
    reg_paths = [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for p in (bold_paths if bold else reg_paths):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def text_w(draw, txt, fnt):
    return draw.textbbox((0, 0), txt, font=fnt)[2]


def draw_severity_chip(draw, x, y, label, color):
    pad_x, pad_y = 8, 4
    fnt = font(12, bold=True)
    tw = text_w(draw, label, fnt)
    w, h = tw + pad_x * 2, 22
    draw.rounded_rectangle((x, y, x + w, y + h), 4, fill=(*color[:3], 40), outline=(*color[:3], 180), width=1)
    draw.text((x + pad_x, y + 3), label, fill=color, font=fnt)
    return w


# ─── 440 × 280 ────────────────────────────────────────────────────────────────
def render_small():
    W, H = 440, 280
    img = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Header strip
    d.rectangle((0, 0, W, 32), fill=PANEL)
    d.line((0, 32, W, 32), fill=LINE)
    d.text((16, 9), "SCOPECREEP / NOTARY", fill=INK, font=font(11, bold=True))
    d.text((W - 40, 10), "v0.4", fill=DIM, font=font(10))

    # Headline
    d.text((20, 56), "CAUGHT", fill=ACCENT, font=font(11, bold=True))
    d.text((20, 80), "Scope creep", fill=INK, font=font(28, bold=True))
    d.text((20, 116), "in Slack.", fill=INK, font=font(28, bold=True))

    # Hits row
    x = 20
    y = 178
    chip_w = draw_severity_chip(d, x, y, "HIGH", WARN); x += chip_w + 8
    d.text((x, y + 3), '"while you\'re at it"', fill=INK, font=font(12)); x += 130
    # second row
    y2 = y + 30
    x = 20
    chip_w = draw_severity_chip(d, x, y2, "MED", ACCENT); x += chip_w + 8
    d.text((x, y2 + 3), '"can you also"', fill=INK, font=font(12))

    # Footer label
    d.text((20, H - 28), "ZERO LLM · ZERO SERVERS · FREE", fill=DIM, font=font(10, bold=True))

    img.save(OUT / "promo-small.png")
    print(f"  promo-small.png  ({W}×{H})")


# ─── 920 × 680 ────────────────────────────────────────────────────────────────
def render_large():
    W, H = 920, 680
    img = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Top header
    d.rectangle((0, 0, W, 56), fill=PANEL)
    d.line((0, 56, W, 56), fill=LINE)
    d.text((40, 19), "SCOPECREEP  /  NOTARY", fill=INK, font=font(15, bold=True))
    d.text((W - 70, 22), "v0.4.0", fill=DIM, font=font(13))

    # Hero copy
    d.text((48, 100), "STOP LOSING MONEY", fill=ACCENT, font=font(15, bold=True))
    d.text((48, 132), "to client", fill=INK, font=font(46, bold=True))
    d.text((48, 188), "scope creep.", fill=INK, font=font(46, bold=True))
    d.text((48, 254), "274 phrases. Zero LLM. Zero servers.", fill=MUTED, font=font(19))

    # Stat row
    yS = 312
    d.text((48, yS), "$8–15K", fill=ACCENT, font=font(28, bold=True))
    d.text((48, yS + 38), "Avg unbilled scope-creep loss per year",
           fill=DIM, font=font(13))
    d.text((230, yS), "72%", fill=ACCENT, font=font(28, bold=True))
    d.text((230, yS + 38), "of projects suffer from scope creep",
           fill=DIM, font=font(13))
    d.text((460, yS), "274", fill=ACCENT, font=font(28, bold=True))
    d.text((460, yS + 38), "hand-curated trigger phrases",
           fill=DIM, font=font(13))

    # Flagged-message card
    cx, cy = 48, 420
    cw, ch = W - 96, 210
    d.rounded_rectangle((cx, cy, cx + cw, cy + ch), 10, fill=PANEL, outline=LINE, width=1)

    d.text((cx + 20, cy + 18), "FLAGGED MESSAGE", fill=DIM, font=font(11, bold=True))

    msg = '"Hey can you also add a quick animated intro and'
    msg2 = "update the homepage copy while you're at it?"
    d.text((cx + 20, cy + 44), msg, fill=INK, font=font(16))
    d.text((cx + 20, cy + 68), msg2, fill=INK, font=font(16))

    # Bar
    d.line((cx + 20, cy + 100, cx + cw - 20, cy + 100), fill=LINE)

    d.text((cx + 20, cy + 112), "DETECTED  (3)", fill=DIM, font=font(11, bold=True))
    chip_y = cy + 140
    x = cx + 20
    w = draw_severity_chip(d, x, chip_y, "HIGH", WARN); x += w + 10
    d.text((x, chip_y + 4), '"while you\'re at it"', fill=INK, font=font(14)); x += 175
    d.text((x, chip_y + 4), "ADDITIVE", fill=DIM, font=font(11, bold=True))

    chip_y2 = chip_y + 32
    x = cx + 20
    w = draw_severity_chip(d, x, chip_y2, "MED", ACCENT); x += w + 10
    d.text((x, chip_y2 + 4), '"can you also"', fill=INK, font=font(14))

    img.save(OUT / "promo-large.png")
    print(f"  promo-large.png  ({W}×{H})")


# ─── 1400 × 560 ───────────────────────────────────────────────────────────────
def render_marquee():
    W, H = 1400, 560
    img = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(img)

    # Left half: copy
    d.text((72, 92), "FOR  FREELANCERS", fill=ACCENT, font=font(17, bold=True))
    d.text((72, 130), "Catch scope creep.", fill=INK, font=font(64, bold=True))
    d.text((72, 210), "Draft the change order.", fill=INK, font=font(64, bold=True))

    d.text((72, 320), "ScopeCreep Notary watches your Slack for client",
           fill=MUTED, font=font(20))
    d.text((72, 350), "messages that quietly expand your project — one",
           fill=MUTED, font=font(20))
    d.text((72, 380), "click drafts a professional change-order email.",
           fill=MUTED, font=font(20))

    # Tags row
    yT = 440
    d.text((72, yT), "274 PHRASES   ·   15 CATEGORIES   ·   ZERO LLM   ·   ZERO SERVERS",
           fill=DIM, font=font(13, bold=True))

    # Right half: mock popup
    px = 920
    py = 70
    pw = 400
    ph = 420
    d.rounded_rectangle((px, py, px + pw, py + ph), 12, fill=PANEL, outline=LINE, width=1)

    # popup header
    d.text((px + 24, py + 22), "SCOPECREEP / NOTARY", fill=INK, font=font(11, bold=True))
    d.text((px + pw - 56, py + 22), "v0.4.0", fill=DIM, font=font(10))
    d.line((px + 1, py + 50, px + pw - 1, py + 50), fill=LINE)

    # flagged message block
    d.text((px + 24, py + 70), "FLAGGED MESSAGE", fill=DIM, font=font(10, bold=True))
    d.rounded_rectangle((px + 24, py + 92, px + pw - 24, py + 162), 6,
                        outline=LINE, width=1)
    # accent vertical bar
    d.rectangle((px + 24, py + 92, px + 27, py + 162), fill=ACCENT)
    d.text((px + 38, py + 102), "Can you also add an", fill=INK, font=font(12))
    d.text((px + 38, py + 120), "animated intro while", fill=INK, font=font(12))
    d.text((px + 38, py + 138), "you're at it?", fill=INK, font=font(12))

    # hits
    d.text((px + 24, py + 182), "DETECTED  (3)", fill=DIM, font=font(10, bold=True))
    h_y = py + 204
    w = draw_severity_chip(d, px + 24, h_y, "HIGH", WARN)
    d.text((px + 24 + w + 8, h_y + 3), '"while you\'re at it"', fill=INK, font=font(12))

    h_y2 = h_y + 28
    w = draw_severity_chip(d, px + 24, h_y2, "HIGH", WARN)
    d.text((px + 24 + w + 8, h_y2 + 3), '"shouldn\'t take long"', fill=INK, font=font(12))

    h_y3 = h_y2 + 28
    w = draw_severity_chip(d, px + 24, h_y3, "MED", ACCENT)
    d.text((px + 24 + w + 8, h_y3 + 3), '"can you also"', fill=INK, font=font(12))

    # template picker
    pick_y = py + 312
    for i, name in enumerate(["Neutral", "Friendly", "Concise"]):
        bw = 80
        bx = px + 24 + i * (bw + 8)
        active = i == 0
        if active:
            d.rounded_rectangle((bx, pick_y, bx + bw, pick_y + 26), 4,
                                fill=ACCENT_SOFT, outline=ACCENT, width=1)
            col = ACCENT
        else:
            d.rounded_rectangle((bx, pick_y, bx + bw, pick_y + 26), 4,
                                outline=LINE, width=1)
            col = MUTED
        # center text
        fnt = font(11, bold=active)
        tw = text_w(d, name, fnt)
        d.text((bx + (bw - tw) // 2, pick_y + 6), name, fill=col, font=fnt)

    # copy button (amber)
    cb_y = py + 354
    d.rounded_rectangle((px + 24, cb_y, px + 160, cb_y + 36), 6, fill=ACCENT)
    d.text((px + 50, cb_y + 11), "Copy to clipboard", fill=BG, font=font(12, bold=True))

    img.save(OUT / "promo-marquee.png")
    print(f"  promo-marquee.png ({W}×{H})")


if __name__ == "__main__":
    print("Rendering Web Store promos…")
    render_small()
    render_large()
    render_marquee()
    print("Done.")
