# Changelog

All notable changes to ScopeCreep Notary. Follows [Keep a Changelog](https://keepachangelog.com/) loosely; semver-ish.

Version-bump policy: bump on user-facing coherent release boundaries, not per task. See `voice/decisions.html` dec-043, dec-053.

---

## [0.4.0] — 2026-05-24

User-facing reliability + polish.

### Added
- **Skip own messages** — configurable Slack display name in settings. Extension no longer flags messages the user wrote. Case-insensitive match, live updates via `chrome.storage.onChanged`. (T-022, dec-073..075)
- **Extension icons** — 16/48/128 px PNG, amber chevron on dark rounded square. Generated deterministically via `scripts/render_icons.py`. (T-021, dec-069..071)
- **Lexicon expansion** — 190 → 225 phrases (+35) across design / code / copy verticals. Specification_creep now heaviest category at 35 phrases. No matcher changes. (T-028, dec-077)

### Internal
- Promoted maintenance work over premature features (per-project stats deferred). dec-076.
- 4 new Playwright tests covering skip-own-msg + fallback. Total: 13 functional tests + 1 canary.

### Known limitations
- Slack DOM selectors will drift; relying on `data-qa` attributes for longevity (canary test catches breakage early).
- Single global stats counter — per-project breakdown deferred to v0.5+.

---

## [0.3.0] — 2026-05-24

**First end-to-end usable release.** User can install → onboard → browse Slack → see flagged messages → open popup → see drafted change order with their real name / rate / client / SOW context → copy → send.

### Added
- **Cumulative scope-drift stats counter** — 3-event funnel: flagged → dismissed → drafted. Footer strip (compact) + settings view (3-cell grid + Since-date + reset button). Stored in `chrome.storage.local.scopecreepStats`. (T-018, dec-058..061)
- **Onboarding / SOW / settings view** — third in-popup view with SOW textarea, hourly rate, sender name, optional client name. First-run detection opens settings if neither SOW nor rate set. Replaces dec-042 `window.prompt` rate-setting bridge. (T-016, dec-049..053)
- **Change-order templates + picker** — 4 tone variants (neutral / friendly / concise / formal) in `src/data/templates.json`. Button-group picker above draft textarea. User choice persists. Literal `{var}` interpolation; unknown tokens pass through. Inline fallback template if templates.json fetch fails. (T-015, dec-044..048)
- **Popup-panel UI** — flagged message quote + hit list with severity chips + editable change-order draft + copy/dismiss buttons + footer settings link. Dual data path: chrome.storage.local on open + chrome.runtime.onMessage for live updates. (T-014, dec-040..043)

### Internal
- Manifest version policy formalized (dec-043).
- Multi-fallback DOM selector pattern (dec-035).
- Two-decision-log convention (operator-state for runtime, decisions.html for project-level).

---

## [0.2.0] — 2026-05-24

Content script ships. Extension now actively watches Slack.

### Added
- **Slack content script** — MutationObserver on body with 150ms debounced re-scan. Multi-fallback message-container + text-content selectors (4 + 5). Per-message scorer (sum of severity × category-weight). Badge injection on score ≥ 2 with amber/brick color per top-severity hit. Idempotent via `data-scopecreep-checked` attribute. Badge click → `chrome.runtime.sendMessage` + `chrome.storage.local` fallback. (T-013, dec-035..039)
- **manifest content_scripts entry** — `https://app.slack.com/*` only for v1
- **web_accessible_resources** — exposes `src/data/lexicon.json` to Slack pages so content script can `fetch()` it.
- **Seed scope-expansion lexicon** — 190 phrases across 15 psychological categories (additive, trivialize, vague_future, scope_shift, urgency, relationship_leverage, comparison_shame, specification_creep, revision_cycle, deferred_spec, technical_creep, assumption, emotional_coercion, fake_question, favor_framing). Each phrase: literal lowercased substring + severity (low/medium/high) + realistic example. Substring matching, no regex. (T-012, dec-031..034)

### Known issues at this release
- Flags user's own messages too (fixed in v0.4.0)
- No icons yet (added in v0.4.0)

---

## [0.1.0] — 2026-05-23

Scaffolding only. Extension installs but does nothing visible yet.

### Added
- **Manifest v3** — `activeTab`, `storage`, `scripting` perms. Slack host permissions. Background service worker stub. Popup action wired. No content_scripts entry yet (added in 0.2.0). (T-011, dec-027..029)
- **Background service worker stub** — `chrome.runtime.onInstalled` initializes storage with onboarded=false placeholders.
- **Popup placeholder** — dark workspace palette inline CSS; "No flagged messages yet" copy + "Real panel UI lands in T-014" hint.
- **Repo scaffold** — git init, README pointing back to voice/spec.html, .gitignore, src/ structure. (T-010)

---

## [0.0.0] — 2026-05-23

Empty scaffold.

### Added
- Initial repo structure created during voice/ operator-workspace bootstrap.

---

## Versioning policy

- Bumps happen at **user-facing coherent release boundaries**, not per task or commit.
- Per-task changes accumulate under "Unreleased" mentally until enough lands to justify a bump.
- Tracking dates instead of strict semver during pre-1.0 — pre-1.0 means breaking changes are expected and we move fast.
- Once we hit Chrome Web Store + first 100 users → switch to strict semver + dated `## Unreleased` section discipline.

## Where versions are stored

- `manifest.json` `"version"` — canonical, must match a release section here.
- `package.json` `"version"` — dev tooling, kept in sync for npm/Playwright workflows.
- `src/popup/panel.html` header `#ver` span — UI display, updated alongside manifest.
- This file — release notes.

When bumping: update all four in one commit.
