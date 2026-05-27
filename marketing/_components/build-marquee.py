import json, html

data = json.load(open('/Users/Ollie/Documents/Code/scopecreep/src/data/lexicon.json'))
phrases = sorted(data['phrases'], key=lambda p: p['id'])

SEV_CLASS = {'high':'chip-high', 'medium':'chip-med', 'low':'chip-low'}
SEV_DOT   = {'high':'sc-dot--high', 'medium':'sc-dot--med', 'low':'sc-dot--low'}

sev_buckets = {'high':[], 'medium':[], 'low':[]}
for p in phrases:
    sev_buckets[p['severity']].append(p)

mixed = []
i = 0
order = ['high', 'medium', 'low', 'medium', 'high', 'low', 'medium']
idx = {'high':0,'medium':0,'low':0}
guard = 0
while sum(len(b) for b in sev_buckets.values()) - sum(idx.values()) > 0 and guard < 1000:
    s = order[i % len(order)]
    if idx[s] < len(sev_buckets[s]):
        mixed.append(sev_buckets[s][idx[s]])
        idx[s] += 1
        guard = 0
    else:
        guard += 1
    i += 1

for s, b in sev_buckets.items():
    for j in range(idx[s], len(b)):
        mixed.append(b[j])

assert len(mixed) == 274

rows = [[], [], []]
for i, p in enumerate(mixed):
    rows[i % 3].append(p)

def chip(p):
    sev = p['severity']
    cls = SEV_CLASS[sev]
    dot = SEV_DOT[sev]
    phrase = html.escape(p['phrase'])
    return (f'<span class="sc-marquee__chip {cls}">'
            f'<span class="sc-marquee__dot {dot}" aria-hidden="true"></span>'
            f'<span class="sc-marquee__text">&ldquo;{phrase}&rdquo;</span></span>')

def row_html(items, row_num, reverse=False, indent='      '):
    inner_indent = indent + '    '
    inner = ('\n' + inner_indent).join(chip(p) for p in items)
    dir_attr = ' data-dir="reverse"' if reverse else ''
    return (f'{indent}<div class="sc-marquee__row" data-row="{row_num}"{dir_attr}>\n'
            f'{indent}  <div class="sc-marquee__track" aria-hidden="false">\n'
            f'{inner_indent}{inner}\n'
            f'{indent}  </div>\n'
            f'{indent}  <div class="sc-marquee__track" aria-hidden="true">\n'
            f'{inner_indent}{inner}\n'
            f'{indent}  </div>\n'
            f'{indent}</div>')

rows_html = '\n'.join([
    row_html(rows[0], 1, reverse=False),
    row_html(rows[1], 2, reverse=True),
    row_html(rows[2], 3, reverse=False),
])

# ─── styles ────────────────────────────────────────────────────────────
STYLES = '''<style>
  /* ── sc-marquee ───────────────────────────────────────────────────
     Three horizontally-scrolling rows of lexicon phrase chips.
     Pattern: each row contains the same content twice; the track
     translates by -50% over --sc-marquee-duration → seamless loop.
     Pause on hover. Reduced-motion falls back to static 3-row grid.   */
  .sc-marquee {
    --sc-marquee-duration: 60s;
    --sc-marquee-gap: var(--sp-3);
    --sc-marquee-fade: var(--sp-9);
    position: relative;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    /* Faded gutters via CSS mask */
    -webkit-mask-image: linear-gradient(
      to right,
      transparent 0,
      #000 var(--sc-marquee-fade),
      #000 calc(100% - var(--sc-marquee-fade)),
      transparent 100%
    );
            mask-image: linear-gradient(
      to right,
      transparent 0,
      #000 var(--sc-marquee-fade),
      #000 calc(100% - var(--sc-marquee-fade)),
      transparent 100%
    );
  }

  .sc-marquee__row {
    display: flex;
    width: 100%;
    overflow: hidden;
    flex-wrap: nowrap;
  }

  .sc-marquee__track {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--sc-marquee-gap);
    padding-right: var(--sc-marquee-gap); /* keep gap consistent at loop seam */
    animation: sc-marquee-scroll var(--sc-marquee-duration) linear infinite;
    will-change: transform;
  }

  .sc-marquee__row[data-dir="reverse"] .sc-marquee__track {
    animation-direction: reverse;
  }

  .sc-marquee:hover .sc-marquee__track,
  .sc-marquee:focus-within .sc-marquee__track {
    animation-play-state: paused;
  }

  @keyframes sc-marquee-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  /* ── chip restyle (extends .chip-* from _base.css) ─────────────── */
  .sc-marquee__chip {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    flex-shrink: 0;
    height: 32px;
    padding: 0 var(--sp-4);
    border-radius: var(--r-pill);
    font-family: var(--sans);
    font-size: var(--text-body-sm);
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;
    white-space: nowrap;
    border: 1px solid var(--line-strong);
    background: var(--panel);
    color: var(--ink);
    transition: border-color var(--motion-fast) var(--ease-out),
                background var(--motion-fast) var(--ease-out);
  }
  .sc-marquee__chip.chip-high {
    background: var(--warn-soft);
    border-color: var(--warn-border);
    color: var(--ink);
  }
  .sc-marquee__chip.chip-med {
    background: var(--accent-soft);
    border-color: var(--accent-border);
    color: var(--ink);
  }
  .sc-marquee__chip.chip-low {
    background: var(--panel-2);
    border-color: var(--line-strong);
    color: var(--muted);
  }
  .sc-marquee__chip:hover {
    background: var(--panel-3);
  }
  .sc-marquee__chip.chip-high:hover { background: var(--warn-soft); border-color: var(--warn-text); }
  .sc-marquee__chip.chip-med:hover  { background: var(--accent-soft); border-color: var(--accent-text); }

  .sc-marquee__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .sc-marquee__dot.sc-dot--high { background: var(--warn); }
  .sc-marquee__dot.sc-dot--med  { background: var(--accent); }
  .sc-marquee__dot.sc-dot--low  { background: var(--dim); }

  .sc-marquee__text {
    font-family: var(--serif);
    font-style: italic;
    font-weight: 400;
  }

  /* ── Reduced-motion fallback: freeze animation, show static grid ── */
  @media (prefers-reduced-motion: reduce) {
    .sc-marquee {
      overflow: visible;
      -webkit-mask-image: none;
              mask-image: none;
    }
    .sc-marquee__row {
      overflow: visible;
      flex-wrap: wrap;
      gap: var(--sp-3);
    }
    .sc-marquee__track {
      animation: none !important;
      flex-wrap: wrap;
      gap: var(--sp-3);
      padding-right: 0;
    }
    /* Hide the duplicate (aria-hidden) track in the static fallback */
    .sc-marquee__track[aria-hidden="true"] { display: none; }
  }

  /* Mobile: tighter spacing, faster perceived motion */
  @media (max-width: 720px) {
    .sc-marquee {
      --sc-marquee-fade: var(--sp-7);
      --sc-marquee-duration: 45s;
      --sc-marquee-gap: var(--sp-2);
    }
    .sc-marquee__chip {
      height: 28px;
      font-size: var(--text-caption);
      padding: 0 var(--sp-3);
    }
  }
</style>'''

# ─── _components/marquee.html ────────────────────────────────────────
COMPONENT = f'''<!--
  sc-marquee — phrase wall for ScopeCreep Notary marketing site.

  Usage:
    1. Paste this entire file inside <section class="section"> on index.html.
    2. Requires _tokens.css + _base.css already loaded in <head>.
    3. Content is pre-rendered static HTML — all 274 phrases from lexicon.json
       v1 (2026-05-24). Update by re-running marketing/_components/build-marquee.py
       (or copy this file from a fresh build) when lexicon changes.

  Behavior:
    - 3 rows. Rows 1 + 3 scroll left, row 2 scrolls right.
    - 60s/row at desktop, 45s/row on mobile.
    - Pause on hover/focus.
    - prefers-reduced-motion: reduce → freezes animation, becomes a static
      wrapped 3-row grid (overflow visible, gradient mask removed).
-->
{STYLES}

<div class="sc-marquee" role="region" aria-label="Lexicon of scope-creep phrases" aria-roledescription="marquee">
{rows_html}
</div>
'''

with open('/Users/Ollie/Documents/Code/scopecreep/marketing/_components/marquee.html', 'w') as f:
    f.write(COMPONENT)

# ─── _lab/marquee.html (standalone showcase) ─────────────────────────
LAB = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>sc-marquee — lab</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../_tokens.css">
<link rel="stylesheet" href="../_base.css">
{STYLES}
<style>
  body {{ padding: var(--sp-7) 0 var(--sp-9); }}
  .lab-header {{ margin-bottom: var(--sp-7); }}
  .lab-meta {{
    display: flex; gap: var(--sp-5); flex-wrap: wrap;
    margin-top: var(--sp-4);
  }}
  .lab-meta span {{ color: var(--dim); font-family: var(--mono); font-size: var(--text-caption); }}
  .lab-meta strong {{ color: var(--ink); font-weight: 500; }}
  .lab-section {{ margin-top: var(--sp-7); }}
  .lab-note {{
    margin-top: var(--sp-5);
    padding: var(--sp-4);
    border: 1px dashed var(--line-strong);
    border-radius: var(--r);
    color: var(--muted);
    font-size: var(--text-body-sm);
  }}
  .lab-divider {{ border: 0; border-top: 1px solid var(--line); margin: var(--sp-8) 0; }}
</style>
</head>
<body>
<div class="container">
  <div class="lab-header">
    <p class="eyebrow">COMPONENT · SC-MARQUEE</p>
    <h1 style="margin-top: var(--sp-3);">Catch the words clients use to <span class="em-italic">quietly</span> add work.</h1>
    <p style="max-width: 640px; margin-top: var(--sp-4);">Three rows. Two-seventy-four phrases. Each one a moment where a freelancer ate the cost. Hover to pause.</p>
    <div class="lab-meta">
      <span><strong>Phrases:</strong> 274</span>
      <span><strong>Rows:</strong> 3 · alternating direction</span>
      <span><strong>Duration:</strong> 60s/row</span>
      <span><strong>Source:</strong> lexicon.json v1</span>
    </div>
  </div>
</div>

<!-- Full-bleed marquee (escapes container) -->
<div class="lab-section">
  <div class="sc-marquee" role="region" aria-label="Lexicon of scope-creep phrases" aria-roledescription="marquee">
{rows_html}
  </div>
</div>

<div class="container">
  <hr class="lab-divider">
  <div class="lab-note">
    <strong style="color: var(--ink);">Reduced-motion check:</strong>
    open this page with system &ldquo;Reduce Motion&rdquo; on (or via DevTools &gt; Rendering &gt; Emulate CSS media feature
    <code>prefers-reduced-motion: reduce</code>). The animation freezes and the marquee becomes a static wrapped grid
    showing all phrases at once — gutters and duplicated tracks suppressed.
  </div>
</div>
</body>
</html>
'''

with open('/Users/Ollie/Documents/Code/scopecreep/marketing/_lab/marquee.html', 'w') as f:
    f.write(LAB)

print("wrote _components/marquee.html  size:", len(COMPONENT))
print("wrote _lab/marquee.html         size:", len(LAB))
