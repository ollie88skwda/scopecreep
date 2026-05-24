// ScopeCreep Notary — popup panel logic
//
// Renders the most recently flagged Slack message + a change-order draft
// generated from one of N templates (src/data/templates.json). User picks the
// template via the button-group above the textarea; choice persists across
// panel opens.
//
// Data sources:
//   - chrome.storage.local.scopecreepLastClick — written by content script
//   - chrome.runtime.onMessage "scopecreep:flagged-clicked" — live updates
//   - chrome.storage.local.scopecreepHourlyRate — user-entered hourly rate
//   - chrome.storage.local.scopecreepTemplateId — last-used template id
//   - src/data/templates.json — fetched at startup

(function () {
  "use strict";

  const STORAGE_KEY = "scopecreepLastClick";
  const STORAGE_SOW = "scopecreepSOW";
  const STORAGE_RATE = "scopecreepHourlyRate";
  const STORAGE_TEMPLATE = "scopecreepTemplateId";

  const els = {
    empty: document.getElementById("empty"),
    content: document.getElementById("content"),
    quote: document.getElementById("quote"),
    hits: document.getElementById("hits"),
    hitCount: document.getElementById("hit-count"),
    picker: document.getElementById("picker"),
    draft: document.getElementById("draft"),
    copyBtn: document.getElementById("copy-btn"),
    dismissBtn: document.getElementById("dismiss-btn"),
    settingsLink: document.getElementById("settings-link"),
  };

  // State the panel needs to render
  let templates = null;          // loaded from templates.json
  let currentTemplateId = null;  // active template id
  let lastFlagged = null;        // {hits, text, ts}

  // ── Template loading ───────────────────────────────────────────────────────
  async function loadTemplates() {
    try {
      const url = chrome.runtime.getURL("src/data/templates.json");
      const res = await fetch(url);
      templates = await res.json();
    } catch (err) {
      console.error("[ScopeCreep] failed to load templates:", err);
      // Fallback: one minimal template inline so the UI doesn't break
      templates = {
        default_template_id: "fallback",
        templates: [
          {
            id: "fallback",
            label: "Default",
            description: "Fallback template (templates.json failed to load)",
            subject: "Change order",
            body: 'Hi {client},\n\nQuick change order for:\n> "{phrase}"\n\n{hours} at {rate}, revised delivery {date}.\n\n{sender}',
          },
        ],
      };
    }
  }

  // ── Template interpolation ─────────────────────────────────────────────────
  function interpolate(template, vars) {
    return template.replace(/\{(\w+)\}/g, (m, key) =>
      vars[key] !== undefined && vars[key] !== "" ? vars[key] : m
    );
  }

  function getTemplate(id) {
    if (!templates) return null;
    return (
      templates.templates.find((t) => t.id === id) ||
      templates.templates.find((t) => t.id === templates.default_template_id) ||
      templates.templates[0]
    );
  }

  // ── Picker UI ──────────────────────────────────────────────────────────────
  function renderPicker() {
    if (!templates) return;
    els.picker.innerHTML = "";
    for (const t of templates.templates) {
      const btn = document.createElement("button");
      btn.textContent = t.label;
      btn.title = t.description || t.label;
      btn.dataset.templateId = t.id;
      if (t.id === currentTemplateId) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentTemplateId = t.id;
        chrome.storage.local.set({ [STORAGE_TEMPLATE]: t.id });
        renderPicker();
        renderDraft();
      });
      els.picker.appendChild(btn);
    }
  }

  // ── Draft rendering ────────────────────────────────────────────────────────
  function renderDraft() {
    if (!lastFlagged || !templates) return;
    const tmpl = getTemplate(currentTemplateId);
    if (!tmpl) return;

    chrome.storage.local.get([STORAGE_RATE], (cfg) => {
      const sortedHits = [...lastFlagged.hits].sort(
        (a, b) => sevRank(b.severity) - sevRank(a.severity)
      );
      const topHit = sortedHits[0];

      const vars = {
        phrase: topHit ? topHit.phrase : "[trigger phrase]",
        rate: cfg[STORAGE_RATE] || "[your hourly rate]",
        hours: "[X] hours",
        date: "[revised date]",
        client: "[client]",
        sender: "[your name]",
      };

      const subject = interpolate(tmpl.subject, vars);
      const body = interpolate(tmpl.body, vars);
      els.draft.value = `Subject: ${subject}\n\n${body}`;
    });
  }

  // ── Rendering: hits + quote ────────────────────────────────────────────────
  function showEmpty() {
    els.empty.style.display = "block";
    els.content.style.display = "none";
  }

  function showFlagged(flagged) {
    if (!flagged || !flagged.hits || flagged.hits.length === 0)
      return showEmpty();

    lastFlagged = flagged;
    els.empty.style.display = "none";
    els.content.style.display = "block";

    // Quote (truncated)
    const MAX = 600;
    els.quote.textContent =
      flagged.text.length > MAX
        ? flagged.text.slice(0, MAX) + " …"
        : flagged.text;

    // Hits
    els.hitCount.textContent = `(${flagged.hits.length})`;
    els.hits.innerHTML = "";
    const sorted = [...flagged.hits].sort(
      (a, b) => sevRank(b.severity) - sevRank(a.severity)
    );
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

    renderPicker();
    renderDraft();
  }

  // ── Copy ───────────────────────────────────────────────────────────────────
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
      els.draft.select();
      document.execCommand("copy");
    }
  });

  // ── Dismiss ────────────────────────────────────────────────────────────────
  els.dismissBtn.addEventListener("click", () => {
    chrome.storage.local.remove(STORAGE_KEY, showEmpty);
  });

  // ── Settings link (T-016 will replace this with a real onboarding view) ────
  els.settingsLink.addEventListener("click", (ev) => {
    ev.preventDefault();
    const cur = els.settingsLink.dataset.rate || "";
    const rate = window.prompt(
      "Your hourly rate (e.g. $150/hr). Stored locally only.",
      cur
    );
    if (rate !== null && rate.trim()) {
      chrome.storage.local.set({ [STORAGE_RATE]: rate.trim() }, () => {
        els.settingsLink.dataset.rate = rate.trim();
        renderDraft();
      });
    }
  });

  // ── Live updates while panel is open ───────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === "scopecreep:flagged-clicked") {
      showFlagged({ hits: msg.hits, text: msg.text, ts: Date.now() });
    }
  });

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  (async function init() {
    await loadTemplates();

    chrome.storage.local.get(
      [STORAGE_KEY, STORAGE_RATE, STORAGE_TEMPLATE],
      (data) => {
        if (data[STORAGE_RATE]) els.settingsLink.dataset.rate = data[STORAGE_RATE];
        currentTemplateId =
          data[STORAGE_TEMPLATE] || templates.default_template_id;

        if (data[STORAGE_KEY] && data[STORAGE_KEY].hits) {
          showFlagged(data[STORAGE_KEY]);
        } else {
          showEmpty();
        }
      }
    );
  })();

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
