<!-- Thanks for the PR. A couple of things to confirm before merge: -->

## What this changes

<!-- 1-3 sentences. What does this PR do, and why? -->

## Type

<!-- Tick one or more: -->

- [ ] `lexicon:` phrase addition / removal / severity change
- [ ] `fixture:` Slack DOM update
- [ ] `bug:` extension misbehavior fix
- [ ] `template:` new email template tone
- [ ] `docs:` documentation fix
- [ ] `infra:` build, CI, or repo tooling
- [ ] `feature:` new user-facing behavior (please open an issue first)

## Checklist

- [ ] Tests pass locally (`npm test`)
- [ ] No new runtime dependencies added (Playwright is dev-only and fine)
- [ ] No telemetry / network calls / LLM-runtime calls added
- [ ] If lexicon changed: `updated_at` bumped + monotonic ID convention followed
- [ ] If selectors changed: new fixture added covering the new shape
- [ ] If templates changed: all interpolation tokens still resolved (`{phrase}`, `{rate}`, `{hours}`, `{date}`, `{client}`, `{sender}`)
- [ ] `CHANGELOG.md` updated (under the next planned version)
- [ ] Manifest version bumped if user-facing behavior changed (and all 4 places synced: `manifest.json`, `package.json`, `src/popup/panel.html`, `CHANGELOG.md`)

## Related issues

<!-- Closes #N -->

## Notes for the reviewer

<!-- Anything non-obvious about the approach, alternatives considered, follow-ups planned. -->
