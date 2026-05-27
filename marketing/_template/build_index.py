#!/usr/bin/env python3
"""Assemble marketing/index.html from the template + component snippets.

Injects:
  <!--MARQUEE_BODY-->  → marquee.html <div class="sc-marquee">…</div>
  <!--TERMINAL_BODY-->  → terminal.html (full component module — markup + script)
  <!--SCRIPTS-->       → inlined number-ticker init + any other tail scripts

Re-run after editing the template or any component snippet.

  python3 marketing/_template/build_index.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "_template" / "index.template.html"
OUT = ROOT / "index.html"
COMPONENTS = ROOT / "_components"


def _read(path):
    return path.read_text(encoding="utf-8")


def extract_marquee_body(marquee_html: str) -> str:
    """Return only the rendered <div class="sc-marquee">…</div> markup AND
    the <style> block that precedes it. We keep style with the body so the
    page only includes marquee CSS when the component is mounted."""
    # The component file is: <!-- … --> <style>…</style> <div class="sc-marquee" …>…</div>
    # Strip the leading HTML comment and ship style + markup.
    cleaned = re.sub(r"^<!--.*?-->\s*", "", marquee_html, count=1, flags=re.DOTALL)
    return cleaned.strip()


def extract_terminal(terminal_html: str) -> str:
    """Return the terminal component minus its leading comment.
    The component is fully self-contained (markup + style + script)."""
    cleaned = re.sub(r"^<!--.*?-->\s*", "", terminal_html, count=1, flags=re.DOTALL)
    return cleaned.strip()


def extract_component_styles_and_scripts(html: str) -> str:
    """For components we want only the <style> and <script> blocks (no markup),
    e.g. for number-ticker we want the init script + min styles, but the
    markup instances live in the page already as <span class="sc-number-ticker">."""
    blocks = []
    for m in re.finditer(r"<style>.*?</style>|<script>.*?</script>", html, flags=re.DOTALL):
        blocks.append(m.group(0))
    return "\n".join(blocks)


def main():
    template = _read(TEMPLATE)

    marquee_body = extract_marquee_body(_read(COMPONENTS / "marquee.html"))

    # Compose tail scripts: number-ticker init + terminal init (their element
    # instances are already in the page). Marquee + bento + border-beam +
    # dot-pattern + shiny-* are pure CSS and were embedded inline.
    number_ticker = extract_component_styles_and_scripts(_read(COMPONENTS / "number-ticker.html"))
    terminal = extract_component_styles_and_scripts(_read(COMPONENTS / "terminal.html"))
    tail_scripts = "\n".join([number_ticker, terminal])

    # Inline the additional component styles (dot-pattern, shiny-*, border-beam, bento) once.
    inline_styles = []
    for name in ["dot-pattern", "shiny-button", "shiny-text", "border-beam", "bento-grid"]:
        snippet = _read(COMPONENTS / f"{name}.html")
        inline_styles.extend(re.findall(r"<style>.*?</style>", snippet, flags=re.DOTALL))
    inline_styles_block = "\n".join(inline_styles)

    # Prepend the component styles right after the page's main <style> block.
    template = template.replace(
        "</head>",
        inline_styles_block + "\n</head>",
        1,
    )

    out = (template
           .replace("<!--MARQUEE_BODY-->", marquee_body)
           .replace("<!--SCRIPTS-->", tail_scripts))

    OUT.write_text(out, encoding="utf-8")
    print(f"wrote {OUT} ({len(out):,} bytes)")


if __name__ == "__main__":
    main()
