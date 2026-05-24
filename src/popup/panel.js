// ScopeCreep Notary — popup panel logic (T-014)
//
// Renders the most recently flagged Slack message + change-order draft.
// Data source: chrome.storage.local.scopecreepLastClick (written by content
// script in T-013). Also listens for live "scopecreep:flagged-clicked" runtime
// messages so the panel updates immediately if open when the user clicks a
// badge in Slack.
//
// Real template variants (4-5 tones) land in T-015. v0.2 ships ONE
// neutral-professional template, inlined.

(function () {
  "use strict";

  const STORAGE_KEY = "scopecreepLastClick";
  const STORAGE_SOW = "scopecreepSOW";
  const STORAGE_RATE = "scopecreepHourlyRate";

  const els = {
    empty: document.getElementById("empty"),
    content: document.getElementById("content"),
    quote: document.getElementById("quote"),
    hits: document.getElementById("hits"),
    hitCount: document.getElementById("hit-count"),
    draft: document.getElementById("draft"),
    copyBtn: document.getElementById("copy-btn"),
    dismissBtn: document.getElementById("dismiss-btn"),
    settingsLink: document.getElementById("settings-link"),
  };

  // ── Template (T-015 will add 4 more variants + a picker) ────────────────────
  const TEMPLATE_NEUTRAL_PROFESSIONAL = ({ phrase, rate, hours, date }) => `Subject: Quick note on scope — change order

Hi [client],

Thanks for flagging this — happy to include it. To keep the project on track and the original timeline intact, I'll send over a quick change order:

> "${phrase}"

Estimate: ${hours} at ${rate}, with a revised delivery date of ${date}. Once you confirm, I'll get started on it.

Best,
[your name]
`;

  // ── Rendering ──────────────────────────────────────────────────────────────
  function showEmpty() {
    els.empty.style.display = "block";
    els.content.style.display = "none";
  }

  function showFlagged({ hits, text, ts }) {
    if (!hits || hits.length === 0) return showEmpty();

    els.empty.style.display = "none";
    els.content.style.display = "block";

    // Quote (truncated for readability)
    const MAX = 600;
    els.quote.textContent = text.length > MAX ? text.slice(0, MAX) + " …" : text;

    // Hits
    els.hitCount.textContent = `(${hits.length})`;
    els.hits.innerHTML = "";
    const sorted = [...hits].sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
    for (const h of sorted) {
      const row = document.createElement("div");
      row.className = "hit";
      row.innerHTML = `
        <span class="sev ${esc(h.severity)}">${esc(h.severity)}</span>
        <span class="phrase">"${esc(h.phrase)}"</span>
        <span class="meta">${esc(h.category.replace(/_/g, " "))}</span>
      `;
      els.hits.appendChild(row);
    }

    // Draft (uses top-severity phrase as the quoted trigger)
    chrome.storage.local.get([STORAGE_RATE, STORAGE_SOW], (cfg) => {
      const rate = cfg[STORAGE_RATE] || "[your hourly rate]";
      const draft = TEMPLATE_NEUTRAL_PROFESSIONAL({
        phrase: sorted[0].phrase,
        rate: rate,
        hours: "[X] hours",
        date: "[revised date]",
      });
      els.draft.value = draft;
    });
  }

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  els.copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(els.draft.value);
      els.copyBtn.textContent = "Copied";
      els.copyBtn.classList.add("copied");
      setTimeout(() => {
        els.copyBtn.textContent = "Copy to clipboard";
        els.copyBtn.classList.remove("copied");
      }, 1600);
    } catch (err) {
      console.error("[ScopeCreep] clipboard write failed", err);
      // Fallback: select + execCommand
      els.draft.select();
      document.execCommand("copy");
    }
  });

  // ── Dismiss ────────────────────────────────────────────────────────────────
  els.dismissBtn.addEventListener("click", () => {
    chrome.storage.local.remove(STORAGE_KEY, showEmpty);
  });

  // ── Settings link (placeholder — T-016 wires the SOW/rate onboarding) ──────
  els.settingsLink.addEventListener("click", (ev) => {
    ev.preventDefault();
    // T-016: open onboarding view. For now, prompt.
    const cur = els.settingsLink.dataset.rate || "";
    const rate = window.prompt(
      "Your hourly rate (e.g. $150/hr). Stored locally only.",
      cur
    );
    if (rate !== null && rate.trim()) {
      chrome.storage.local.set({ [STORAGE_RATE]: rate.trim() }, () => {
        els.settingsLink.dataset.rate = rate.trim();
        // Re-render the draft to pick up the new rate
        chrome.storage.local.get(STORAGE_KEY, (data) => {
          if (data[STORAGE_KEY]) showFlagged(data[STORAGE_KEY]);
        });
      });
    }
  });

  // ── Live updates while panel is open ───────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "scopecreep:flagged-clicked") {
      showFlagged({ hits: msg.hits, text: msg.text, ts: Date.now() });
    }
  });

  // ── Initial load ───────────────────────────────────────────────────────────
  chrome.storage.local.get([STORAGE_KEY, STORAGE_RATE], (data) => {
    if (data[STORAGE_RATE]) els.settingsLink.dataset.rate = data[STORAGE_RATE];
    if (data[STORAGE_KEY] && data[STORAGE_KEY].hits) {
      showFlagged(data[STORAGE_KEY]);
    } else {
      showEmpty();
    }
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function sevRank(s) {
    return { low: 1, medium: 2, high: 3 }[s] || 0;
  }
})();
