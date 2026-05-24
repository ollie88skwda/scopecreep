# marketing/

Static landing page for ScopeCreep Notary.

**One file:** `index.html` — pure HTML + inline CSS, no build step, no JS framework. Vercel deploys it directly.

## Deploy (Ollie's step — autonomous loop can't auth to Vercel)

```bash
cd ~/Documents/Code/scopecreep/marketing
npx vercel              # first run: link or create project, set Root Directory to marketing/
npx vercel --prod       # promote a build to production
```

On `vercel.com` project settings:
- **Root Directory:** `marketing`
- **Framework Preset:** Other (or leave blank — static HTML auto-detected)
- **Build Command:** _(empty)_
- **Output Directory:** _(empty — serves root)_

## What's in here

- **Hero:** ScopeCreep value prop + Chrome Web Store CTA (placeholder, listing pending)
- **Problem stats:** 3 cards — $7.8-15.6k lost/yr, 72% project scope-creep, 67% unpaid work
- **How it works:** 3 steps (paste SOW → browse Slack → click → copy → send)
- **Screenshot placeholder:** real popup capture goes in once Chrome Web Store listing exists
- **Privacy section:** 4 cards explaining what the extension does NOT do (no server, no LLM, no tracking, no subscription for v1)
- **Bottom CTA + footer**

## Style

Dark mono palette matching the extension popup + the operator dashboard in `voice/`. Single accent (`#d4a64a` amber). Inline CSS — no build, no deps.

## Why pure HTML, not Next.js

For a single landing page, Next.js is overkill (see `voice/decisions.html` dec-062). Plain HTML deploys instantly, no install step, no framework lock-in. When the marketing site grows (multiple pages, blog, dynamic content) we'll migrate.

## Local preview

```bash
python3 -m http.server 8000   # or any static server
# http://localhost:8000/
```

Or just double-click `index.html`.
