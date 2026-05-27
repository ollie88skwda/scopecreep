# ScopeCreep Notary, landing page copy

Paste-ready body copy, section by section. Headlines marked locked are not to be edited. Italic spans noted as `_italic_`.

---

## Section: Hero

**Eyebrow (locked):** FOR FREELANCERS WHOSE CLIENTS LIVE IN SLACK

**H1 (locked):** Catch the words clients use to _quietly_ add work.

**Sub:** A Chrome extension that reads your client Slack threads in your own browser. It flags the phrases that quietly redraw your contract, then drafts the change-order email so you bill what you signed up for.

**Primary CTA (locked):** Add to Chrome

**Secondary CTA (locked):** Source on GitHub

**Trust microcopy (locked):** v0.4.0 · open source · runs locally · 274 lexicon phrases

---

## Section: Phrase wall

**Eyebrow:** THE LEXICON

**H2:** 274 phrases. Every one a small bill.

**Lede:** Hand-curated from public freelance forums, indie hacker threads, and the quiet panic of every contractor who's read "while you're at it" at 9pm on a Thursday. Fifteen categories. Three severity levels. The whole list is open data.

_(Marquee follows, three rows, phrases pulled from `src/data/lexicon.json`.)_

---

## Section: How it works

**Eyebrow:** HOW IT WORKS

**H2:** Three moves. The rest is the extension's job.

### Step 01

**H3:** Paste your SOW once.

**Body:** The contract, the proposal, the email where you agreed on the price. Whatever you've got. The extension reads it for context so the drafted email sounds like the deal you signed.

### Step 02

**H3:** Open Slack.

**Body:** The extension watches incoming client messages against the 274-phrase lexicon. Matches get a small badge in the corner. Your own messages are skipped. Nothing else changes.

### Step 03

**H3:** Send the change order.

**Body:** Click the badge. A panel opens with the trigger quoted, your SOW for context, and a drafted email in one of four tones. Copy, paste back into Slack, get paid.

---

## Section: Trust spine

**Eyebrow:** WHAT IT DOES NOT DO

**H2 (locked):** What stays on your machine.

**Lede:** The extension runs in your browser. There is no backend service. There is no API call when it scans a message. You can open the Network panel and watch it stay empty during a full Slack session.

### Claim 1

**H3:** 0 network requests during a session.

**Body:** No telemetry, no analytics, no third-party scripts. The extension has zero outbound connections while it's running. Open DevTools and confirm.

### Claim 2

**H3:** No LLM in the request path.

**Body:** Detection is a deterministic lexicon scan against a JSON file shipped with the extension. No model is called. No prompt is sent. Cost per message: $0.

### Claim 3

**H3:** Local storage only.

**Body:** Your SOW, your rate, your stats, the last flagged message. All written to `chrome.storage.local` on your device. Uninstall and it's gone.

### Claim 4

**H3:** Open source on GitHub.

**Body:** Read the code. There is no API key field anywhere in the codebase because there is no server to call. The whole detection algorithm is on the methodology page.

---

## Section: The math

**Eyebrow:** THE MATH

**H2:** $7,800 to $15,600 a year. Per freelancer.

**Lede:** That's the average revenue lost to unbilled scope per freelancer per year, per the Freelancers Union 2026 report. The number isn't a hook. It's the reason this exists. Three out of every four freelance projects run into scope creep without a formal change-order process. Two out of three freelancers do unpaid work because they didn't push back on a small ask.

**Stat 1** · `$7.8-15.6k` · Average revenue lost to scope creep per freelancer per year. (Freelancers Union 2026)

**Stat 2** · `72%` · Of freelance projects affected by scope creep without formal change controls. (Wellingtone)

**Stat 3** · `67%` · Of freelancers regularly do unpaid work because they didn't push back on small asks. (Freelancers Union 2026)

---

## Section: FAQ

**Eyebrow:** QUESTIONS

**H2:** Five questions you're probably about to ask.

### Q1

**Question (italic):** _Does this read all my Slack messages?_

**Answer:** The content script reads the message DOM in your open Slack tab. That's it. Nothing leaves the tab. All matching happens locally against a JSON lexicon shipped with the extension. You can verify this yourself: open Chrome DevTools, switch to the Network panel, use Slack for an hour. The panel stays empty. The extension has no server to call.

### Q2

**Question (italic):** _Why not just use an LLM to detect scope creep?_

**Answer:** Four reasons. Speed: a lexicon scan runs in sub-millisecond time per message. Cost: $0 marginal per check, forever. Auditability: when something gets flagged, you can see exactly which phrase matched and why. Determinism: the same input produces the same output every single time, which matters when you're about to email a client a bill. An LLM gives you none of the four.

### Q3

**Question (italic):** _What about Microsoft Teams or Discord?_

**Answer:** Not yet. Slack web is v1 because that's where the audience lives. Email and Teams are on the roadmap. If you need them, open an issue on GitHub and we'll know to move them up.

### Q4

**Question (italic):** _Will it work in my client's workspace?_

**Answer:** Yes. The extension runs in your browser, not theirs. They never know you're running it. The badge is rendered into your own tab's DOM. The drafted change-order email gets pasted by you, in your tone, in your voice. From the client's side, you sent a clear professional email about scope.

### Q5

**Question (italic):** _What changes at v1.0?_

**Answer:** The beta tag comes off. The lexicon keeps growing through community pull requests on GitHub. Pricing gets announced at the same time: solo freelancers stay free, forever. The paid tier is an agency multi-seat option for studios with several freelancers under one roof.

---

## Section: Footer

**Brand line:** ScopeCreep / Notary

**Signature:** Built solo in public by Oliver Nguyen.

**Nav:** Methodology · Privacy · GitHub · Issues

**Build metadata (mono):** v0.4.0 · commit `${COMMIT_HASH}` · updated `${LAST_UPDATED}` · `${GH_STARS}` stars on GitHub
