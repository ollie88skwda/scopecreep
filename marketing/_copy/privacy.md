# Privacy policy

**Eyebrow:** PRIVACY POLICY

**H1:** What we collect: nothing.

**Meta:** Last updated 2026-05-26 · Applies to ScopeCreep Notary Chrome extension v0.4.0+

---

## Summary

ScopeCreep Notary runs entirely in your browser. It does not send your messages, your SOW, your hourly rate, your name, your settings, or your stats to any server. There is no analytics, no telemetry, no third-party scripts. Everything sits in your browser's local storage and stays there until you uninstall the extension or clear it yourself.

---

## What it collects

**None.** No backend service. No analytics provider. No third-party scripts. No business model that depends on collecting your data.

---

## What it stores on your device

The extension uses the `chrome.storage.local` API to persist a small set of values on your device. None of this leaves the browser.

- **Your SOW or project scope text.** The contract or scope summary you paste into Settings for reference context.
- **Your hourly rate.** Used to fill in the drafted change-order email.
- **Your name and an optional default client name.** Used in the draft greeting and signature.
- **Your Slack display name.** Used to skip your own messages so the extension only flags incoming client asks.
- **Your selected email template.** Which of the four tone variants you last picked.
- **Your stats counters.** How many messages flagged, dismissed, and drafts copied since you installed.
- **The most recent flagged message context.** Quoted text plus matched phrases, so the popup can restore the panel state when you reopen it.
- **Recent errors.** A ring buffer of up to 20 internal errors with timestamp and brief context, so you can see if the extension breaks. Cleared via the Settings panel's Clear errors button.

If you uninstall the extension, Chrome deletes all of the above.

---

## What it does NOT collect

The content script runs only on `app.slack.com` pages. It reads the visible text of Slack messages in your open tab to check them against the scope-expansion lexicon. **That message text is never transmitted.** Not to us (we have no servers). Not to any third party. Not to Slack beyond what your browser was already doing on its own.

When the extension detects a scope-expansion phrase, it adds a small badge to the message in the page DOM. The matched phrase ID and message text are passed only to the extension's own popup for the change-order draft. They stay on your device.

---

## Permissions and why

- **`activeTab`** · So the extension can read the currently focused Slack tab when you click the toolbar icon. Required to surface flagged messages in the popup.
- **`storage`** · So the extension can persist your settings, stats, and recent-flag context via `chrome.storage.local`. Data never leaves your device.
- **`scripting`** · So the content script can inject the badge styles and click handlers into Slack pages.
- **`host_permissions: https://app.slack.com/*`** · So the content script runs only on Slack, never on any other site you visit.

---

## Third-party services

None. The extension makes zero network connections to any external service. It does not:

- Send data to any analytics provider. No Google Analytics, no Mixpanel, no Segment.
- Load any third-party scripts.
- Use any AI or LLM API at runtime. Detection is a deterministic local lexicon match.
- Phone home for updates, telemetry, or "anonymous usage data."

---

## What we cannot see

We have no servers. We have no database. We cannot read your messages, your settings, or your stats even if we wanted to. There is no code path in the extension that transmits your data anywhere. This is enforced by the architecture itself, not by a policy promise.

---

## Children's privacy

The extension is intended for professionals managing client work. It is not directed at children under 13 and does not knowingly collect personal information from children.

---

## Changes to this policy

If the privacy posture ever changes (for example, if we add optional cloud sync as a paid-tier feature), this page will be updated with a new "Last updated" date and a clear changelog entry. Material changes will be flagged inside the extension popup before they take effect.

---

## Open source

The full source code is on GitHub. You can verify every statement above by reading the code yourself.

---

## Contact

Privacy or security disclosures: open a private [Security Advisory](https://github.com/ollie88skwda/scopecreep/security/advisories/new). General questions: [public issues](https://github.com/ollie88skwda/scopecreep/issues).
