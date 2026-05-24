---
name: "lexicon: propose a phrase"
about: Suggest a scope-expansion phrase the extension should catch (or one it shouldn't).
title: 'lexicon: "<phrase>"'
labels: lexicon
---

## The phrase

<!-- The exact lowercased substring you want the matcher to detect. Keep it short and specific (2-5 words). -->

```
<phrase>
```

## Real example

<!-- An anonymized example sentence where a client used this phrase to expand scope. Strip any identifying info — replace company / project / personal names with "Jamie", "Acme", etc. -->

> ""

## Category

<!-- Pick one. See src/data/lexicon.json for all 15. -->

- [ ] `additive` — "can you also...", "and a...", "while you're at it"
- [ ] `trivialize` — "just a quick...", "small change..."
- [ ] `vague_future` — "I was thinking...", "would it be possible..."
- [ ] `scope_shift` — "let's pivot to...", "different angle"
- [ ] `urgency` — "by tomorrow", "ASAP"
- [ ] `relationship_leverage` — "since you're already there..."
- [ ] `comparison_shame` — "the old designer used to..."
- [ ] `specification_creep` — "make it more...", "the gradient..."
- [ ] `revision_cycle` — "just one more round..."
- [ ] `deferred_spec` — "we forgot to mention..."
- [ ] `technical_creep` — "also needs to work on..."
- [ ] `assumption` — "I assume this includes..."
- [ ] `emotional_coercion` — "we really need this"
- [ ] `fake_question` — "if you have a sec..."
- [ ] `favor_framing` — "shouldn't take long..."

## Severity

- [ ] `low` — borderline, could be benign in context
- [ ] `medium` — clear scope-expansion intent
- [ ] `high` — obvious unbilled-work request

## Anything else?

<!-- Maybe you want to REMOVE a phrase that's giving false positives. Or LOWER a phrase's severity. Or you have a vertical (game-dev, accounting, etc.) with its own jargon worth adding. Use this section. -->
