---
name: "fixture: Slack DOM changed"
about: Slack shipped a UI change and the badges stopped appearing for a specific message shape.
title: 'fixture: <slack ui feature>'
labels: fixture, slack-decay
---

## What broke

<!-- What kind of Slack message no longer gets a badge it should? Examples: thread replies, edited messages, code blocks, file attachments, reactions, mentions, channel DMs, group DMs. -->

## Captured DOM

<!-- Inspect the broken Slack message → right-click → Copy outerHTML. Paste here. -->

<!-- IMPORTANT: SANITIZE FIRST. Strip any private workspace info: -->
<!-- - Replace real user names with "Jamie", "Sam", etc. -->
<!-- - Replace channel names with "general", "design", etc. -->
<!-- - Replace message body with generic placeholder text -->
<!-- - Remove workspace IDs from any URLs or data attributes -->

```html
<paste sanitized DOM here>
```

## Slack version (if known)

<!-- Sometimes visible at https://app.slack.com/client/T___/__ inspect → window.SLACK_VERSION_ID or similar. Omit if unknown. -->

## Browser

- [ ] Chrome
- [ ] Edge
- [ ] Brave
- [ ] Arc
- [ ] Other: <browser + version>

## What the new selector should match

<!-- Looking at the DOM above, what's the data-qa or class that uniquely identifies the message container in this shape? -->

```
new MESSAGE_SELECTORS entry: '...'
new TEXT_SELECTORS entry: '...'
new SENDER_SELECTORS entry: '...'
```

## Confirmed?

- [ ] I reloaded the extension after a fresh git pull and the badge still didn't appear
- [ ] I disabled and re-enabled the extension to rule out a context-invalidation glitch
- [ ] I checked the popup's "Recent errors" section in Settings — no related errors there

## PR?

- [ ] I'll send a PR adding the fixture + selector myself
- [ ] I can capture/sanitize the DOM but want a maintainer to wire the selector
- [ ] I'm reporting so others can find it
