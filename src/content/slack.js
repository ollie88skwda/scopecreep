// ScopeCreep Notary — Slack content script
//
// Watches the Slack message list for incoming client messages, matches against
// the scope-expansion lexicon, injects a discrete badge on flagged messages.
// Click the badge → forwards to popup for change-order draft (panel UI in T-014).
//
// Idempotent: each message is checked once (data-scopecreep-checked attr).

(async function () {
  "use strict";

  const PROCESSED_ATTR = "data-scopecreep-checked";
  const FLAGGED_ATTR = "data-scopecreep-flagged";
  const BADGE_CLASS = "scopecreep-badge";
  const STYLE_ID = "scopecreep-styles";
  const FLAG_THRESHOLD = 2;
  const DEBOUNCE_MS = 150;
  const SEVERITY_WEIGHT = { low: 1, medium: 2, high: 3 };

  // Error-logging helper — writes to chrome.storage.local.scopecreepErrors
  // (ring buffer cap 20). Panel reads + displays in settings. Same shape as
  // panel.js logError (duplicated because content scripts can't import shared
  // modules in MV3 without bundling).
  function logError(ctx, msg) {
    try {
      chrome.storage.local.get("scopecreepErrors", (data) => {
        const errs = (data && data.scopecreepErrors) || [];
        errs.unshift({
          ts: new Date().toISOString(),
          ctx: String(ctx).slice(0, 60),
          msg: String(msg).slice(0, 200),
        });
        chrome.storage.local.set({ scopecreepErrors: errs.slice(0, 20) });
      });
    } catch (_) {
      console.error("[ScopeCreep slack]", ctx, msg);
    }
  }

  // ── 1. Load lexicon + user prefs ───────────────────────────────────────────
  let lexicon;
  try {
    const url = chrome.runtime.getURL("src/data/lexicon.json");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    lexicon = await res.json();
  } catch (err) {
    console.error("[ScopeCreep] failed to load lexicon:", err);
    logError("lexicon-fetch", err && err.message ? err.message : String(err));
    return;
  }
  const categoryWeight = new Map(
    (lexicon.categories || []).map((c) => [c.id, c.weight ?? 1.0])
  );

  // Load user's Slack display name so we can skip their own messages.
  // Re-fetched on each chrome.storage change so panel updates take effect live.
  let ownSlackName = "";
  function loadSlackName() {
    try {
      chrome.storage.local.get("scopecreepSlackName", (data) => {
        ownSlackName = ((data && data.scopecreepSlackName) || "").trim();
      });
    } catch (_) {
      /* extension context invalidated */
    }
  }
  loadSlackName();
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.scopecreepSlackName) {
        ownSlackName = ((changes.scopecreepSlackName.newValue) || "").trim();
      }
    });
  } catch (_) {
    /* no chrome.storage.onChanged in tests; loadSlackName is enough */
  }

  console.log(
    `[ScopeCreep] loaded ${lexicon.phrases.length} phrases across ${lexicon.categories.length} categories`
  );

  // ── 2. Scorer ──────────────────────────────────────────────────────────────
  function scoreMessage(text) {
    const lower = text.toLowerCase();
    const hits = [];
    let score = 0;
    for (const entry of lexicon.phrases) {
      if (lower.includes(entry.phrase)) {
        const w = categoryWeight.get(entry.category) ?? 1.0;
        score += (SEVERITY_WEIGHT[entry.severity] ?? 1) * w;
        hits.push({
          id: entry.id,
          phrase: entry.phrase,
          category: entry.category,
          severity: entry.severity,
          example: entry.example,
        });
      }
    }
    return { score, hits };
  }

  // ── 3. Style injection ─────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      [${FLAGGED_ATTR}] { position: relative; }
      .${BADGE_CLASS} {
        position: absolute;
        top: 4px;
        right: 8px;
        font-size: 10px;
        font-weight: 600;
        font-family: ui-monospace, "SF Mono", Menlo, monospace;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 2px 6px;
        border-radius: 3px;
        cursor: pointer;
        z-index: 50;
        background: rgba(212, 166, 74, 0.18);
        color: #d4a64a;
        border: 1px solid rgba(212, 166, 74, 0.4);
        opacity: 0.82;
        transition: opacity 0.15s, transform 0.15s;
        user-select: none;
      }
      .${BADGE_CLASS}:hover { opacity: 1; transform: translateY(-1px); }
      .${BADGE_CLASS}[data-severity="high"] {
        background: rgba(201, 90, 74, 0.18);
        color: #c95a4a;
        border-color: rgba(201, 90, 74, 0.4);
      }
    `;
    document.head.appendChild(style);
  }

  // ── 4. DOM selectors (multi-fallback — Slack changes these monthly) ─────────
  // Listed most-specific → least-specific. First non-empty wins.
  const MESSAGE_SELECTORS = [
    '[data-qa="message_container"]',
    ".c-message_kit__message",
    ".c-message",
    '[role="listitem"][data-qa*="message"]',
  ];
  const TEXT_SELECTORS = [
    '[data-qa="message-text"]',
    ".p-rich_text_section",
    ".c-message__body",
    ".c-message_kit__text",
    ".c-message_kit__blocks",
  ];
  // Sender / author selectors — used to skip messages the user wrote
  // themselves (T-022). Compared against the user-configured display name
  // from chrome.storage.local.scopecreepSlackName.
  const SENDER_SELECTORS = [
    '[data-qa="message_sender_name"]',
    ".c-message__sender",
    ".c-message_kit__sender",
    ".c-message_kit__sender_link",
    "[data-message-sender]",
    ".sender",
  ];

  function extractSender(messageEl) {
    for (const sel of SENDER_SELECTORS) {
      const el = messageEl.querySelector(sel);
      if (el) {
        const t = el.textContent.trim();
        if (t) return t;
      }
    }
    return "";
  }

  function findMessages(root) {
    for (const sel of MESSAGE_SELECTORS) {
      const found = root.querySelectorAll(sel);
      if (found.length > 0) return Array.from(found);
    }
    return [];
  }

  function extractText(messageEl) {
    for (const sel of TEXT_SELECTORS) {
      const el = messageEl.querySelector(sel);
      if (el) {
        const t = el.textContent.trim();
        if (t) return t;
      }
    }
    // Last-resort fallback
    return messageEl.textContent.trim();
  }

  // ── 5. Badge injection ─────────────────────────────────────────────────────
  function injectBadge(messageEl, result) {
    if (messageEl.querySelector(`.${BADGE_CLASS}`)) return;

    const sortedHits = [...result.hits].sort(
      (a, b) =>
        (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0)
    );
    const topHit = sortedHits[0];

    const badge = document.createElement("span");
    badge.className = BADGE_CLASS;
    badge.dataset.severity = topHit.severity;
    badge.textContent =
      result.hits.length === 1 ? "SCOPE" : `SCOPE ${result.hits.length}`;
    badge.title = `${result.hits.length} flagged phrase${
      result.hits.length === 1 ? "" : "s"
    } — top: "${topHit.phrase}" (${topHit.category}, ${topHit.severity}). Click for draft.`;

    badge.addEventListener("click", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      const text = messageEl.dataset.scopecreepText || extractText(messageEl);
      chrome.runtime
        .sendMessage({
          type: "scopecreep:flagged-clicked",
          hits: result.hits,
          score: result.score,
          text,
        })
        .catch(() => {
          // Popup not open — store in local for popup pickup on next open
          chrome.storage.local.set({
            scopecreepLastClick: {
              ts: Date.now(),
              hits: result.hits,
              text,
            },
          });
        });
      // T-014 will open the panel inline. For now, log + storage hand-off.
      console.log("[ScopeCreep] badge clicked", { hits: result.hits, text });
    });

    messageEl.appendChild(badge);
  }

  // ── 6. Per-message processing (idempotent) ─────────────────────────────────
  function processMessage(messageEl) {
    if (messageEl.getAttribute(PROCESSED_ATTR)) return;
    messageEl.setAttribute(PROCESSED_ATTR, "1");

    // Skip messages the user wrote themselves (T-022).
    // Compares against scopecreepSlackName in chrome.storage. If unset
    // (first-run before settings) → flag everything (legacy behavior).
    if (ownSlackName) {
      const sender = extractSender(messageEl);
      if (sender && sender.toLowerCase() === ownSlackName.toLowerCase()) {
        messageEl.setAttribute("data-scopecreep-self", "1");
        return;
      }
    }

    const text = extractText(messageEl);
    if (!text || text.length < 5) return;

    const result = scoreMessage(text);
    if (result.score < FLAG_THRESHOLD) return;

    messageEl.setAttribute(
      FLAGGED_ATTR,
      JSON.stringify(result.hits.map((h) => h.id))
    );
    messageEl.dataset.scopecreepText = text;
    injectBadge(messageEl, result);
    bumpStat("flagged");
  }

  function bumpStat(key) {
    try {
      chrome.storage.local.get("scopecreepStats", (data) => {
        const stats = data.scopecreepStats || {
          flagged: 0,
          dismissed: 0,
          copied: 0,
          since: new Date().toISOString(),
        };
        stats[key] = (stats[key] || 0) + 1;
        chrome.storage.local.set({ scopecreepStats: stats });
      });
    } catch (_) {
      /* Extension context invalidated (rare); silently ignore. */
    }
  }

  function scanAll() {
    const messages = findMessages(document.body);
    if (messages.length === 0) return;
    messages.forEach(processMessage);
  }

  // ── 7. MutationObserver (debounced) ────────────────────────────────────────
  let scanTimer = null;
  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      let dirty = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            dirty = true;
            break;
          }
        }
        if (dirty) break;
      }
      if (dirty) {
        clearTimeout(scanTimer);
        scanTimer = setTimeout(scanAll, DEBOUNCE_MS);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    console.debug("[ScopeCreep] MutationObserver armed");
  }

  // ── 8. Bootstrap ───────────────────────────────────────────────────────────
  injectStyles();
  // Slack mounts asynchronously; do an immediate scan + delayed retry.
  scanAll();
  setTimeout(scanAll, 1500);
  setTimeout(scanAll, 4000);
  startObserver();
})();
