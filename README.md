# ScopeCreep Notary

Chrome extension that watches client messages in Slack/Gmail/Notion/Linear for scope-expanding language, flags them in real time, and drafts one-click change-order emails.

**Status:** scaffolded 2026-05-23. v1 build in progress per `~/Documents/Code/voice/TASKS.md`.

**Spec:** see `~/Documents/Code/voice/spec.html` ("The product" section).

**Why this exists:** see `~/Documents/Code/voice/HANDOFF.html` Section 3.

**Operating workspace:** all decisions, dashboard, work queue, and self-management protocol live in `~/Documents/Code/voice/`. This repo holds only the product code.

## Stack
- Chrome extension manifest v3
- Vanilla JS content scripts (no framework for v1)
- Local storage for SOW + lexicon + history (privacy-first; no server log of message content)
- Optional Supabase free-tier sync as Pro-tier feature (later)
- Marketing site: Next.js + Vercel free tier (later)

## Layout (in-progress)
```
scopecreep/
├── manifest.json         # MV3 manifest (T-011)
├── src/
│   ├── data/
│   │   ├── lexicon.json  # ~200 scope-expansion phrases (T-012)
│   │   └── templates.json # change-order email templates (T-015)
│   ├── content/
│   │   └── slack.js      # Slack DOM hook + badge injection (T-013)
│   ├── popup/
│   │   ├── panel.html
│   │   └── panel.js      # badge-click side panel (T-014)
│   └── background.js     # MV3 service worker
└── README.md
```

## License
TBD. Open question for week 1.
