# Contributing to ScopeCreep Notary

Thanks for thinking about contributing. ScopeCreep Notary is a deliberately small, no-build, no-framework Chrome extension with a clear scope. PRs are most useful in a few specific areas. Others are out of scope.

---

## Quick orientation

- **Architecture:** see [README.md](./README.md) Architecture section.
- **Algorithm:** see [methodology page](https://scopecreep-notary.vercel.app/methodology.html).
- **Privacy stance:** see [privacy policy](https://scopecreep-notary.vercel.app/privacy.html) — non-negotiable.
- **Workspace:** active development happens in a separate operator workspace ([`voice/`](https://github.com/[ollie]/voice)) where Claude Code logs every decision. Major changes are decided there first.

---

## Where contributions are welcome

### 1. Lexicon additions

**Most-wanted contribution type.** If you've personally hit a scope-expansion phrase that the extension doesn't catch:

1. Open an issue with the title `lexicon: "<phrase>"` and include:
   - The phrase exactly as you saw it
   - A real (anonymized) example sentence
   - The category you think it belongs to (see `src/data/lexicon.json` for the 15 categories)
   - Suggested severity: `low` / `medium` / `high`
2. Either send a PR adding the entry to `src/data/lexicon.json`, or wait for a maintainer to triage.

Entry shape:

```json
{
  "id": "<3-letter-cat>-NNN",
  "phrase": "lowercase substring to match",
  "category": "additive",
  "severity": "medium",
  "example": "Realistic example sentence from a real client message."
}
```

ID format: `<3-letter-category-prefix>-NNN`, monotonic per category. Bump `updated_at` at the top of the file.

### 2. DOM fixture updates

Slack ships UI changes monthly. If your badges break:

1. Capture the new message DOM (Inspect → Copy outerHTML of the message container)
2. Sanitize: remove any private workspace info (real user names, channel names, message bodies). Replace with `Jamie`, `#general`, etc.
3. Add a fixture in `tests/fixtures/<descriptive-name>.html` mirroring the structure of existing fixtures
4. If the existing `MESSAGE_SELECTORS` / `TEXT_SELECTORS` / `SENDER_SELECTORS` arrays in `src/content/slack.js` don't match, add the new selector to the appropriate array (most-specific first)
5. Run `npm test` and confirm both the canary test + your new fixture pass
6. PR with title `fixture: <slack-ui-feature>` (e.g. `fixture: edited message`, `fixture: thread reply`)

### 3. Translations

If you want a non-English lexicon (e.g. for German freelancers, Spanish, Japanese):

1. Open an issue describing the language + your locale's typical scope-creep phrases
2. We'll discuss structure: separate `lexicon-<locale>.json` file, language-detection logic, settings field for locale preference
3. Implementation is a real chunk of work — coordinate before sending the PR

### 4. Bug fixes

Bug reports + fixes welcome. Issue first if it's non-obvious.

### 5. Template additions

If the 4 existing tone variants (neutral / friendly / concise / formal) miss a tone you'd actually use:

1. Open an issue with the proposed tone label + 3-sentence rationale
2. Draft the subject + body using `{phrase}`, `{rate}`, `{hours}`, `{date}`, `{client}`, `{sender}` interpolation tokens
3. PR to `src/data/templates.json`

---

## Where contributions are NOT welcome

These are deliberate design constraints. PRs against them will be closed:

- **New runtime dependencies.** No npm-installed runtime libs (Playwright is dev-only, fine). The no-build, no-framework architecture is load-bearing for privacy + audit.
- **Telemetry of any kind.** No analytics. No "anonymous usage data". No phone-home. The privacy stance is non-negotiable.
- **LLM calls in the request path.** The methodology page promises deterministic local scoring. Adding any AI API at runtime breaks that promise.
- **Tracking pixels / external scripts in marketing pages.** Same reason as telemetry.
- **CSS frameworks (Tailwind, Bootstrap, etc).** Inline CSS matches the dark-mono palette discipline. Frameworks bloat + drift the look.
- **Build steps.** No webpack, esbuild, vite, etc. for the extension itself. (Marketing site is also build-step-free.)
- **PRs that rename or restructure files without discussion.** File layout is intentional. Open an issue first.

---

## Development workflow

### Setup

```bash
git clone https://github.com/[ollie]/scopecreep
cd scopecreep
npm install                 # Playwright dev dep
npx playwright install chromium  # one-time, ~200MB
```

### Local extension testing

1. Open `chrome://extensions`
2. Toggle Developer mode on
3. Click "Load unpacked", select this directory
4. Edit files. Click the "reload" icon on the extension card after changes.

### Running tests

```bash
npm test               # Playwright DOM tests
npm run test:headed    # Watch tests in a visible Chromium window
npm run test:debug     # Step through with Playwright Inspector
```

Tests must pass before PR is reviewed. CI runs them on every PR via `.github/workflows/test.yml`.

### Regenerating icons

```bash
pip install --user Pillow   # one-time
python3 scripts/render_icons.py
```

Don't hand-edit the PNGs — re-render from the script for byte-identical output.

---

## PR checklist

Before opening a PR, please:

- [ ] Tests pass locally (`npm test`)
- [ ] No new runtime dependencies added
- [ ] No telemetry / network calls added
- [ ] If lexicon changed: `updated_at` bumped + ID convention followed
- [ ] If selectors changed: new fixture added covering the new shape
- [ ] If templates changed: all interpolation tokens still resolved
- [ ] `CHANGELOG.md` entry added under the next planned version (or "Unreleased" if uncertain)
- [ ] Manifest version bumped if user-facing behavior changed (see CHANGELOG bump policy)

---

## Code style

- 2-space indent, JS double-quoted strings (matching existing files)
- No top-level `import` / `export` in extension source (MV3 content scripts can't use them without a bundler)
- Inline comments only when behavior is non-obvious (no docstring noise)
- Name handlers clearly (`onClickBadge`, not `handler1`)
- Prefer `const` + arrow functions
- HTML: lowercase attributes, double-quoted values, inline `<style>` blocks in popup pages (matching `panel.html` convention)

---

## Issue templates

When you click "New issue" on GitHub you'll get a chooser with six templates. Pick the one that fits:

- **lexicon: propose a phrase** — add / remove / re-severity a scope-expansion phrase
- **fixture: Slack DOM changed** — capture the new DOM shape so badges work again
- **bug: something is broken** — anything misbehaving that isn't a Slack DOM change
- **template: propose a new email tone** — draft a 5th tone variant or replace one
- **docs: fix or improve documentation** — README / CHANGELOG / marketing / etc.
- **question: ask anything** — open-ended

Blank issues are disabled — please pick a template. Privacy / security disclosures should be filed as private Security Advisories at https://github.com/ollie88skwda/scopecreep/security/advisories/new instead of public issues.

---

## License

By contributing, you agree your contributions will be licensed under the [MIT License](./LICENSE).

---

## Code of conduct

Be respectful. Don't be a jerk. That's it. Maintainers reserve the right to lock or close issues that go sideways.
