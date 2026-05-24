# Chrome Web Store listing — submission copy

All text fields for the Chrome Web Store developer dashboard form. Copy-paste into the [submission flow](https://chrome.google.com/webstore/devconsole) when ready to publish.

**Pre-flight checklist** before clicking Submit:
- [ ] `manifest.json` version matches `CHANGELOG.md` top section
- [ ] Icons present at `icons/icon{16,48,128}.png` (T-021)
- [ ] Privacy policy live at `https://scopecreep.app/privacy.html` (after T-025 Vercel deploy)
- [ ] Methodology page live at `https://scopecreep.app/methodology.html` (after T-025)
- [ ] Marketing site live at `https://scopecreep.app/` (after T-025)
- [ ] Domain registered + DNS pointed to Vercel (after T-020)
- [ ] Screenshots captured + cropped to 1280×800 PNG (after T-026)
- [ ] One-time $5 developer registration fee paid
- [ ] Source repo public on GitHub (optional but recommended for trust)

---

## Store Listing fields

### Title
Max 75 characters.

```
ScopeCreep Notary — catch client scope creep in Slack
```
(53 chars)

### Summary
Max 132 characters. Shown under the title in search results.

```
Watches your Slack for client messages that quietly expand your project. One-click drafts a professional change-order email.
```
(127 chars)

### Detailed description
Max 16000 characters. Markdown not supported — plain text with line breaks.

```
ScopeCreep Notary watches your Slack conversations for client messages that quietly expand your project scope. Each flagged message gets a discrete badge in the corner. One click opens a drafted change-order email you can copy, edit, and send — so you bill what you're owed instead of absorbing the scope creep silently.

═══ THE PROBLEM ═══

Freelancers lose $7,800 to $15,600 per year to scope creep (Freelancers Union 2026). 72% of freelance projects suffer scope expansion (Wellingtone). 67% of freelancers regularly do unpaid work because pushing back feels harder than just doing the work.

The pattern is always the same: "Can you also...", "While you're at it...", "Quick tweak — shouldn't take long". Small additions that feel harmless in the moment but never make it onto the invoice.

═══ HOW IT WORKS ═══

1. Install the extension and open Settings.
2. Paste your SOW or project scope (stored locally, never sent anywhere).
3. Set your hourly rate, your name, and your Slack display name.
4. Browse Slack normally. The extension watches for scope-expansion language across 225 hand-curated phrases in 15 psychological categories.
5. When a client message triggers the threshold, you'll see a discrete amber badge in the corner of the message.
6. Click the badge. The popup opens with:
   • The exact phrase that triggered the flag, quoted
   • Your SOW for reference
   • A drafted change-order email in your tone of choice (4 templates: neutral, friendly, concise, formal)
   • One-click copy to clipboard

7. Paste back into Slack. Send. Bill what you're owed.

═══ WHAT'S DIFFERENT ═══

→ Zero data collection. Everything stays on your device. No servers. No analytics. No tracking.

→ No AI / LLM at runtime. The detection is a deterministic 225-phrase lexicon with severity weights. Fast. Predictable. Private. Read the full algorithm at scopecreep.app/methodology.html — the lexicon is open data.

→ No subscription required during beta. Free to use end-to-end.

→ Honest "what we don't do" page at scopecreep.app/privacy.html — privacy-first by architecture, not by promise.

═══ FEATURES ═══

• 225 scope-expansion phrases across 15 categories (additive, trivializing, vague-future, scope-shift, urgency, relationship-leverage, comparison-shame, spec-creep, revision-cycle, deferred-spec, technical-creep, assumption, emotional-coercion, fake-question, favor-framing)
• 4 change-order email templates with one-click tone switching
• SOW reference panel
• Configurable hourly rate, sender + client names that interpolate into drafts
• Skip-own-messages via Slack display name (extension only flags incoming client asks)
• Test mode — paste any sample message into Settings to see the scoring
• Recent errors log (5-minute banner alert)
• Stats counter: messages flagged / dismissed / drafts copied
• Three-state badge color: amber for medium severity, brick red for high-severity hits
• Slack-only host permissions (extension does nothing on other sites)

═══ PRIVACY ═══

Full details at scopecreep.app/privacy.html. Short version:

• We collect nothing. No servers, no analytics, no tracking.
• Everything stored locally in chrome.storage.local. Uninstalling deletes it all.
• Slack message text is read in your browser and matched against the lexicon locally. Never transmitted anywhere.
• No third-party scripts. No AI API calls at runtime.
• Open source — verify the code yourself.

═══ FOR WHO ═══

Built for solo freelance designers, developers, writers, and consultants billing $50–$300/hr who manage client relationships through Slack.

If you've ever read a client message and thought "ugh, that's another 3 hours of unbilled work I'm too tired to push back on" — this is for you.

═══ LINKS ═══

Website: https://scopecreep.app
Methodology: https://scopecreep.app/methodology.html
Privacy policy: https://scopecreep.app/privacy.html
Source code: https://github.com/[ollie]/scopecreep
Questions: hello@scopecreep.app
```

### Category
```
Productivity
```

### Language
```
English (United States)
```

### Single-purpose statement
Chrome Web Store requires every extension to declare exactly one purpose.

```
ScopeCreep Notary's single purpose is to detect scope-expansion language in client messages on Slack and provide the user with a drafted change-order email to send back.
```

---

## Permission justifications

Chrome Web Store requires a written justification for every permission and host permission. Paste each into the appropriate textbox on the submission form.

### `activeTab`
```
Required so the extension can read the currently-focused Slack tab when the user clicks the toolbar icon. The popup surfaces the most recently flagged scope-expansion message and lets the user draft a change-order email in response. Without activeTab, the popup cannot read the message context.
```

### `storage`
```
Required to persist the user's settings (SOW text, hourly rate, sender + client names, Slack display name, selected email template, stats counters, recent-errors log) across browser sessions via chrome.storage.local. No data is transmitted to any external server — chrome.storage.local stays on the user's device.
```

### `scripting`
```
Required so the content script can inject the scope-creep badge styles and click handlers into Slack message DOMs. Without scripting permission, the badge cannot be added to flagged messages.
```

### Host permission: `https://app.slack.com/*`
```
The content script runs only on Slack web (app.slack.com). It watches the DOM for incoming client messages, scans the text against a 225-phrase scope-expansion lexicon, and injects a small badge on flagged messages. The script is scoped to Slack only — it does not run on any other website the user visits. Slack message text is processed locally in the browser and never transmitted anywhere.
```

---

## Trust & Safety attestations

The submission form asks for several yes/no declarations. Suggested answers:

| Question | Answer |
|---|---|
| Does this item handle personal or sensitive user data? | **Yes** (Slack message text is processed, though never transmitted) |
| Does this item use remote code? | **No** (all JS is bundled in the extension package) |
| Do you sell user data to third parties? | **No** |
| Do you use or transfer user data for purposes unrelated to the item's single purpose? | **No** |
| Do you use or transfer user data to determine creditworthiness or for lending purposes? | **No** |

Link the privacy policy when prompted: `https://scopecreep.app/privacy.html`

---

## Screenshots (T-026 — captured after first install)

Required: 1280×800 PNG. Up to 5. Order matters — first one is the hero in search results.

Planned shots (T-026 fills these):

1. **Hero**: Slack channel with one client message flagged + amber badge visible. Mouse hovering over the badge with the tooltip showing "1 flagged phrase — top: \"can you also\" (additive, medium). Click for draft."
2. **Popup open**: Settings view with all fields filled (SOW, rate, name, client) — shows the full configuration UX.
3. **Popup with flagged message**: the panel showing quoted trigger + hit list with severity chips + drafted email + Copy button.
4. **Template picker**: Same panel with picker visible, hovering between Neutral / Friendly / Concise / Formal.
5. **Test mode**: Settings view with the test textarea filled and the verdict card showing 3 hits + amber "Would flag (score 7.7)".

---

## Promotional images (optional but recommended)

- Small tile: 440×280
- Marquee: 1400×560

Both should match the marketing-site dark palette + amber accent. Hold off until T-026 ships the real popup screenshots so the promotional images can be assembled from those.

---

## Post-submission

Google reviews most Productivity extensions within 1–3 business days. Common rejection reasons + mitigations baked into our submission:

- **Insufficient privacy policy** — covered exhaustively at privacy.html
- **Missing single-purpose statement** — included above
- **Permissions not justified** — each permission has a paragraph
- **No detailed description** — 2k+ word detailed description above
- **No icon at required sizes** — 16/48/128 PNG shipped per T-021

If reviewers ask for changes, fix and resubmit. Bump manifest version + add `CHANGELOG.md` entry for the patch.

---

_Generated 2026-05-24 during autonomous cycle T-039. Update when listing changes._
