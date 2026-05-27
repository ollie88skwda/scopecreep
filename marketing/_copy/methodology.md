# Methodology

**Eyebrow:** METHODOLOGY

**H1:** How the scoring works.

**Meta:** Last updated 2026-05-26 · Applies to lexicon v1, content script v0.4.0+

---

## Opening callout

No machine learning. No language model. A curated lexicon of scope-expansion phrases, case-insensitive substring matching, and a small severity-weighted score. You can read the entire algorithm on this page. The lexicon is open data.

---

## The 30-second version

1. The extension scans each incoming Slack message against **274 hand-curated phrases** grouped into 15 categories.
2. Every match contributes a small score: `severity × category_weight`.
3. If the message's total score reaches **2 or higher**, it gets a badge.
4. Badge color: amber for medium-severity matches, brick red if any high-severity phrase was hit.
5. Messages you sent yourself are skipped, matched against the display name you configure in Settings.

---

## Why deterministic (callout box)

Four reasons we chose a lexicon over an LLM. Pick any one of them; the answer is the same.

- **Speed.** Lexicon match runs in sub-millisecond time per message. An LLM round-trip is somewhere between 400ms and several seconds, depending on the model and the network.
- **Cost.** $0 marginal per check, forever. No quota, no rate limit, no surprise bill the month a client gets chatty.
- **Auditability.** When a message gets flagged, you can see exactly which phrase matched and exactly what it weighed. No "the model said so." You can argue with a regex; you cannot argue with a black box.
- **Determinism.** Same input, same output, every time. The flag you saw on Tuesday is the flag you'll see on Friday. That matters when the next step is emailing a client a bill.

---

## The lexicon

274 phrases across 15 psychological categories. Each phrase carries a severity (`low` / `medium` / `high`) and a category weight that nudges the final score up or down.

| Category | Phrases | Weight |
| --- | ---: | ---: |
| Additive (_"can you also...", "while you're at it..."_) | 25 | 1.0 |
| Trivialize (_"just a quick...", "small change..."_) | 19 | 0.9 |
| Vague future (_"I was thinking...", "would it be possible..."_) | 15 | 0.7 |
| Scope shift (_"let's pivot to...", "change of plans"_) | 11 | 1.2 |
| Urgency (_"by tomorrow", "ASAP"_) | 15 | 0.6 |
| Relationship leverage (_"since you're already there..."_) | 10 | 1.0 |
| Comparison shame (_"the old designer..."_) | 10 | 1.0 |
| Specification creep (_"make it more...", "the gradient..."_) | 35 | 0.8 |
| Revision cycle (_"just one more round..."_) | 13 | 1.0 |
| Deferred spec (_"we forgot to mention..."_) | 10 | 1.1 |
| Technical creep (_"also needs to work on..."_) | 17 | 1.0 |
| Assumption (_"I assume this includes..."_) | 11 | 0.9 |
| Emotional coercion (_"we really need this"_) | 10 | 0.7 |
| Fake question (_"if you have a sec..."_) | 11 | 0.6 |
| Favor framing (_"shouldn't take long..."_) | 13 | 0.9 |

---

## The scoring formula

For every message, the extension runs this loop:

```
score = 0
hits = []
for entry in lexicon.phrases:
    if entry.phrase in message.lower():
        s = severity_weight[entry.severity]   // low=1, medium=2, high=3
        w = category_weight[entry.category]   // 0.6 .. 1.2
        score += s * w
        hits.append(entry)

if score >= 2:
    flag(message, hits)
```

That is the whole algorithm.

### Worked example

Client message: _"Looks great! Can you also add a hover state? While you're at it, fix the spacing too. Shouldn't take long."_

| Phrase matched | Severity | Score |
| --- | --- | ---: |
| `can you also` (additive) | medium | 2 × 1.0 = 2.0 |
| `while you're at it` (additive) | high | 3 × 1.0 = 3.0 |
| `shouldn't take long` (favor framing) | high | 3 × 0.9 = 2.7 |

**Total: 7.7.** Well above the threshold of 2. Badge color: brick red, because high-severity phrases were hit.

---

## Why the threshold is 2

A single low-severity match (for example, `ASAP` alone at 1 × 0.6 = 0.6) does not trigger a badge. This stops alert fatigue on innocuous messages. With the threshold at 2:

- One medium-severity phrase = 2.0 → flags by a hair.
- One high-severity phrase = 3.0 → flags clearly.
- Two low-severity phrases together = 2.0 → flags.
- One low alone = under threshold, no badge.

---

## What it explicitly does not do

- **No machine learning.** The score is a sum of integers. No model. No training data. No GPUs.
- **No LLM call at runtime.** The extension does not talk to OpenAI, Anthropic, Google, or any AI provider when it scans a message.
- **No fuzzy matching.** The phrase `can you also` matches that exact three-word sequence (case-insensitive). It does not match `if you can also` via similarity scoring or anything tricky. The algorithm is fully predictable.
- **No telemetry.** We do not see what got flagged on your machine. We could not see it if we wanted to. See the [privacy policy](/privacy.html).
- **No "smart" context detection.** If a client quotes a previous message that happens to contain a phrase from the lexicon, the extension will flag it. False positive. Dismiss it. Dismiss-to-flag ratios are what we use to refine the lexicon over time.

---

## How the lexicon evolves

Maintained as `src/data/lexicon.json` in the open-source repo. Process:

1. Users flag false positives via the popup's Dismiss button.
2. Dismiss-to-flag ratio per phrase is tracked privately on each user's device. Aggregated reporting is opt-in only and only ships with the paid tier.
3. When a phrase exceeds a 30% dismiss rate across opted-in users, it gets reviewed and either rephrased, severity-lowered, or removed.
4. New phrases come from public freelance forums (r/freelance, freelance Twitter rants, indie hacker threads). Curated by hand. Never automated.
5. Lexicon version bumps are documented in [`CHANGELOG.md`](https://github.com/ollie88skwda/scopecreep/blob/main/CHANGELOG.md).

---

## Skipping your own messages

To avoid flagging your own outgoing messages, the extension compares each message's sender to a display name you set in Settings. Case-insensitive and trimmed. If your Slack display name is "Ollie Nguyen" and a message header reads "Ollie Nguyen", the message is skipped (and tagged in the DOM with `data-scopecreep-self="1"` so you can verify). If the display name is unset, all messages are processed. Legacy fallback for first-run users.

---

## Try it yourself

The popup's Settings view has a Test mode textarea. Paste any sample message. You'll see exactly which phrases matched, the computed score, and whether the message would be flagged. Runs locally. Nothing is sent anywhere.

---

## Open data

The complete lexicon lives in `src/data/lexicon.json` in the open-source repo. Read it, audit it, send pull requests for missing phrases or bad ones. The categorization, severity tags, and category weights are all visible in the same file.
