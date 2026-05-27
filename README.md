# ScopeCreep Notary

Chrome extension that watches client messages in Slack for scope-expanding language, flags them with a discrete badge, and drafts a one-click change-order email so freelancers stop losing $8–15k/yr to unbilled scope creep.

**Status:** v0.4.0 beta — install-tested, awaiting Chrome Web Store listing. Marketing site at [scopecreep-notary.vercel.app](https://scopecreep-notary.vercel.app) (pending DNS).

**Privacy:** zero data collection. No server. No analytics. No LLM at runtime. Everything stays in your browser. See [privacy policy](https://scopecreep-notary.vercel.app/privacy.html).

---

## Install

### From source (load unpacked)

1. Clone this repo: `git clone https://github.com/ollie88skwda/scopecreep && cd scopecreep`
2. Open `chrome://extensions` in Chrome (or Edge, Brave, Arc — any Chromium browser)
3. Toggle **Developer mode** on (top right)
4. Click **Load unpacked**, select the cloned `scopecreep/` directory
5. The toolbar gets an amber `<` icon. Click it.

### From Chrome Web Store

[Listing pending submission — see `WEBSTORE-LISTING.md` for the planned listing copy.]

---

## Quickstart

1. Click the toolbar icon → Settings opens automatically on first run.
2. Paste your SOW or project scope into the **Your SOW / project scope** field. Stored locally, never sent anywhere.
3. Set your **Hourly rate** (e.g. `$150/hr`), **Your name**, and **Your Slack display name** (so the extension skips messages you wrote).
4. Optional: set a **Default client name** for the draft greeting.
5. Click **Save**.
6. Open Slack in another tab and browse normally.
7. When a client message contains scope-expansion language, a small `SCOPE` badge appears in the corner of the message.
8. Click the badge. The popup shows:
   - The flagged message quoted
   - Which phrases matched (with severity)
   - Your SOW for context
   - A drafted change-order email in your tone of choice (4 templates)
9. Click **Copy to clipboard**, paste into Slack as your reply.

That's the whole loop.

---

## How it works

Deterministic lexicon match — no machine learning, no LLM call at runtime. See [methodology page](https://scopecreep-notary.vercel.app/methodology.html) for the full algorithm. Short version:

```
score = 0
for entry in lexicon.phrases:
    if entry.phrase in message.lower():
        score += severity_weight[entry.severity] * category_weight[entry.category]
if score >= 2:
    flag(message)
```

274 hand-curated phrases across 15 categories (additive, trivializing, vague-future, scope-shift, urgency, relationship-leverage, comparison-shame, spec-creep, revision-cycle, deferred-spec, technical-creep, assumption, emotional-coercion, fake-question, favor-framing). Each phrase tagged with severity (low/medium/high). Each category has a weight multiplier.

---

## Architecture

Pure Chrome MV3, no build step, no framework.

```
scopecreep/
├── manifest.json               # MV3 manifest (v0.4.0)
├── CHANGELOG.md                # release notes per version
├── WEBSTORE-LISTING.md         # Chrome Web Store submission copy
├── package.json                # dev tooling only (Playwright)
├── playwright.config.js
├── icons/
│   ├── icon16.png              # toolbar icon (16/48/128 PNG)
│   ├── icon48.png
│   └── icon128.png
├── scripts/
│   └── render_icons.py         # regenerate icons (requires Pillow)
├── src/
│   ├── background.js           # MV3 service worker
│   ├── content/
│   │   └── slack.js            # MutationObserver + badge injection
│   ├── data/
│   │   ├── lexicon.json        # 225 scope-expansion phrases
│   │   └── templates.json      # 4 change-order email templates
│   └── popup/
│       ├── panel.html          # popup UI (dark mono palette)
│       └── panel.js            # 3 views: empty / content / settings
├── tests/
│   ├── slack.spec.js           # Playwright DOM tests (13 functional + 1 canary)
│   └── fixtures/               # 10 hand-written Slack DOM fixtures
├── marketing/
│   ├── index.html              # landing page
│   ├── privacy.html            # privacy policy
│   └── methodology.html        # public algorithm explainer
└── .github/workflows/
    └── test.yml                # CI: install chromium + run Playwright on PR
```

### Data flow

1. User opens Slack (`https://app.slack.com/*`).
2. `manifest.json` `content_scripts` matches → Chrome injects `src/content/slack.js`.
3. Content script fetches `src/data/lexicon.json` via `chrome.runtime.getURL()` (declared in `web_accessible_resources`).
4. MutationObserver on `document.body`, 150ms debounced → finds new messages via multi-fallback selectors (`[data-qa="message_container"]`, `.c-message_kit__message`, ...).
5. For each new message, `extractSender()` + `extractText()` → if not authored by the user (display-name match) and score ≥ 2, inject badge.
6. Badge click → `chrome.runtime.sendMessage()` to popup (if open) + write to `chrome.storage.local.scopecreepLastClick` (always).
7. Popup opens → reads `chrome.storage.local.scopecreepLastClick` → renders quoted message + hit list + drafted email from selected template.
8. Copy button → `navigator.clipboard.writeText()` → user pastes into Slack.

No network calls. No server. No third-party scripts.

### Storage keys

All under `chrome.storage.local`:

- `scopecreepSOW` — string, user's SOW/scope text
- `scopecreepHourlyRate` — string, e.g. "$150/hr"
- `scopecreepSender` — string, user's name for draft signature
- `scopecreepClient` — string, optional default client name
- `scopecreepSlackName` — string, user's Slack display name (for skip-own-msg)
- `scopecreepTemplateId` — string, last-selected template id
- `scopecreepOnboarded` — bool, false on install, true after settings save
- `scopecreepLastClick` — `{hits, text, ts}`, most recent badge click context
- `scopecreepStats` — `{flagged, dismissed, copied, since}`, lifetime counters
- `scopecreepErrors` — array of `{ts, ctx, msg}`, ring buffer cap 20

---

## Development

### Local install + iteration

```bash
git clone https://github.com/ollie88skwda/scopecreep
cd scopecreep
# Load unpacked in chrome://extensions (see Install section)
# Edit files. After saves, click the "reload" icon on the extension card.
```

No build step. Changes to `src/**` take effect on extension reload.

### Adding a lexicon phrase

Edit `src/data/lexicon.json`. New entry shape:

```json
{
  "id": "ADD-026",
  "phrase": "lowercase substring to match",
  "category": "additive",
  "severity": "medium",
  "example": "Realistic example sentence."
}
```

ID format: `<3-letter-category>-NNN`, monotonic per category. Bump `updated_at` at the top of the file.

### Adding a Slack DOM selector

If Slack ships a UI change that breaks the badges, the content script's multi-fallback selectors should still find messages — but if all 4 break, edit `MESSAGE_SELECTORS` or `TEXT_SELECTORS` in `src/content/slack.js` and add a new one. Then add a fixture in `tests/fixtures/` with the new shape and re-run tests.

### Adding a change-order template

Edit `src/data/templates.json`. New template shape:

```json
{
  "id": "stern_formal",
  "label": "Stern",
  "description": "...",
  "subject": "...",
  "body": "Hi {client},\n\n... {phrase} ... {rate} ... {hours} ... {date}\n\n{sender}\n"
}
```

Interpolation tokens: `{phrase}`, `{rate}`, `{hours}`, `{date}`, `{client}`, `{sender}`. Unknown tokens pass through unchanged so the user sees what's missing.

### Regenerating icons

```bash
pip install --user Pillow   # one-time
python3 scripts/render_icons.py
```

Deterministic — same input always produces byte-identical PNGs.

---

## Testing

Playwright DOM tests assert badge behavior across 10 hand-written Slack fixtures + 1 selector-decay canary.

```bash
npm install
npx playwright install chromium    # one-time, ~200MB
npm test
```

Tests run automatically on every PR via `.github/workflows/test.yml`.

### What's tested

- Simple "can you also" message → flagged
- "While you're at it" → flagged + `data-severity="high"`
- Multi-hit message → flagged + badge text shows count
- Benign message → not flagged
- Single low-severity hit alone → not flagged (threshold = 2)
- Formatted message (strong/em children) → flagged
- Message with code block → flagged
- 4 messages, 2 flagged → exactly 2 badges
- Idempotency: re-scan doesn't double-badge
- Self-message (sender matches configured Slack name) → not flagged
- Same body authored by someone else → flagged (sender filter is scoped, not global)
- Case-insensitive sender match
- Empty `scopecreepSlackName` → flag everything (legacy fallback)
- Canary: at least one `MESSAGE_SELECTOR` matches in every flagged fixture

### Test-mode (interactive)

Open the extension popup → Settings → "Test mode" textarea. Paste any sample message. Click "Test scoring" (or Cmd/Ctrl+Enter). Shows scored hits + verdict + chip list. Runs the same lexicon locally.

---

## Privacy

The extension does not transmit your data anywhere. Full policy: [scopecreep-notary.vercel.app/privacy.html](https://scopecreep-notary.vercel.app/privacy.html).

Quick facts:
- No server (we operate none).
- No analytics. No tracking. No third-party scripts.
- No AI / LLM API calls at runtime.
- All storage via `chrome.storage.local` — stays on your device.
- Slack message text is read in your browser to match against the lexicon. Never sent anywhere.
- Open source. Verify the code yourself.

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full guide. Quick version:

**Welcome**: lexicon additions, DOM fixture updates, translations, bug fixes, template additions.

**Not welcome**: new runtime deps, telemetry, LLM calls in the request path, CSS frameworks, build steps for the extension.

PRs need passing tests (`npm test`) + a `CHANGELOG.md` entry.

---

## Operating workspace

Active development happens in a sibling `voice/` workspace where Claude Code runs autonomously, ships features, and logs every decision. That workspace is private; this `scopecreep/` repo holds only the shipping product code.

---

## License

[MIT](./LICENSE) — Copyright © 2026 Oliver Nguyen.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
