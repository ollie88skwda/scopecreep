#!/usr/bin/env python3
"""Render OG (Open Graph) preview images for the marketing pages.

Outputs:
  marketing/og/og-index.png        — landing page
  marketing/og/og-privacy.png      — /privacy.html
  marketing/og/og-methodology.png  — /methodology.html

Each: 1200×630 PNG (Twitter / Slack / iMessage / Linear standard preview).
Brand mark (amber chevron, scaled up) on dark background + page-specific
headline + brand wordmark.

Run:
  python3 scripts/render_og.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "marketing" / "og"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630
BG = (10, 10, 10, 255)
PANEL = (17, 17, 17, 255)
ACCENT = (212, 166, 74, 255)
ACCENT_DIM = (212, 166, 74, 120)
INK = (230, 230, 230, 255)
MUTED = (156, 163, 175, 255)
DIM = (107, 114, 128, 255)


# Try the macOS system fonts. Fall back to PIL default if missing.
def font(size, bold=False):
    candidates_bold = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/HelveticaNeueDeskInterface.ttc",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    candidates_reg = [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    paths = candidates_bold if bold else candidates_reg
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_chevron(draw, cx, cy, size, color=ACCENT):
    """Draw the < chevron mark at (cx,cy) sized roughly `size` px tall."""
    arm = size * 0.5
    stroke = max(4, int(size * 0.12))
    apex_x = cx - arm * 0.55
    top_x, top_y = cx + arm * 0.55, cy - arm * 0.85
    bot_x, bot_y = cx + arm * 0.55, cy + arm * 0.85
    draw.line([(top_x, top_y), (apex_x, cy)], fill=color, width=stroke, joint="curve")
    draw.line([(apex_x, cy), (bot_x, bot_y)], fill=color, width=stroke, joint="curve")
    r = stroke / 2
    for (x, y) in [(top_x, top_y), (apex_x, cy), (bot_x, bot_y)]:
        draw.ellipse((x - r, y - r, x + r, y + r), fill=color)


def render(eyebrow: str, headline: str, sub: str, out_path: Path):
    img = Image.new("RGBA", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Subtle hairline border 1px inset
    draw.rectangle((0, 0, W - 1, H - 1), outline=(31, 31, 31, 255), width=1)

    # Brand mark — chevron in top-left
    draw_chevron(draw, 92, 92, 70)

    # Brand wordmark next to chevron
    f_brand = font(18, bold=True)
    draw.text((146, 78), "SCOPECREEP", fill=INK, font=f_brand)
    f_brand_sm = font(14)
    draw.text((146, 102), "Notary", fill=MUTED, font=f_brand_sm)

    # Eyebrow (top-right amber)
    f_eye = font(18, bold=True)
    bbox = draw.textbbox((0, 0), eyebrow.upper(), font=f_eye)
    eye_w = bbox[2] - bbox[0]
    draw.text((W - eye_w - 64, 88), eyebrow.upper(), fill=ACCENT, font=f_eye)

    # Headline (center-left, large)
    f_head = font(64, bold=True)
    # Word-wrap manually to fit width ~ W-128
    max_w = W - 128
    words = headline.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textbbox((0, 0), trial, font=f_head)[2] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)

    # Vertically center the headline block
    line_h = 78
    block_h = len(lines) * line_h
    y0 = (H - block_h) // 2 - 20
    for i, line in enumerate(lines):
        draw.text((64, y0 + i * line_h), line, fill=INK, font=f_head)

    # Subhead under headline
    if sub:
        f_sub = font(24)
        # Wrap sub to ~ W-128 too
        max_w_sub = W - 128
        wsub = sub.split()
        slines, scur = [], ""
        for w in wsub:
            trial = (scur + " " + w).strip()
            if draw.textbbox((0, 0), trial, font=f_sub)[2] <= max_w_sub:
                scur = trial
            else:
                if scur:
                    slines.append(scur)
                scur = w
        if scur:
            slines.append(scur)
        sy = y0 + len(lines) * line_h + 24
        for i, line in enumerate(slines):
            draw.text((64, sy + i * 32), line, fill=MUTED, font=f_sub)

    # Footer URL right-aligned
    f_url = font(20)
    url = "scopecreep-notary.vercel.app"
    bbox = draw.textbbox((0, 0), url, font=f_url)
    draw.text((W - (bbox[2] - bbox[0]) - 64, H - 64), url, fill=ACCENT, font=f_url)

    # Footer hairline
    draw.line([(64, H - 88), (W - 64, H - 88)], fill=(31, 31, 31, 255), width=1)

    img.save(out_path, "PNG", optimize=True)
    print(f"wrote {out_path.relative_to(ROOT)} ({out_path.stat().st_size} bytes)")


def main():
    render(
        eyebrow="Chrome extension",
        headline="Stop losing $8-15k/yr to scope creep.",
        sub="Watches Slack for client asks that quietly expand your project. One-click drafts a change-order email.",
        out_path=OUT / "og-index.png",
    )
    render(
        eyebrow="Privacy policy",
        headline="What we collect: nothing.",
        sub="No servers, no analytics, no LLM at runtime. Everything stays in your browser. Open source.",
        out_path=OUT / "og-privacy.png",
    )
    render(
        eyebrow="Methodology",
        headline="How the scoring works.",
        sub="225 hand-curated phrases. 15 categories. Severity × weight × threshold. No machine learning.",
        out_path=OUT / "og-methodology.png",
    )


if __name__ == "__main__":
    main()
