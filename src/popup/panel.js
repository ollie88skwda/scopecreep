// ScopeCreep Notary — popup panel logic
//
// Three views (only one visible at a time):
//   - #empty    — nothing flagged yet (CTA to open Slack)
//   - #content  — flagged message + draft
//   - #settings — onboarding / settings form (SOW, rate, names)
//
// First-run detection: if neither SOW nor rate is set in storage, the panel
// opens directly into the settings view (T-016 onboarding). After save, it
// returns to the empty/flagged view depending on whether a click context exists.

(function () {
  "use strict";

  const STORAGE_KEY = "scopecreepLastClick";
  const STORAGE_SOW = "scopecreepSOW";
  const STORAGE_RATE = "scopecreepHourlyRate";
  const STORAGE_SENDER = "scopecreepSender";
  const STORAGE_CLIENT = "scopecreepClient";
  const STORAGE_SLACK_NAME = "scopecreepSlackName";
  const STORAGE_TEMPLATE = "scopecreepTemplateId";
  const STORAGE_ONBOARDED = "scopecreepOnboarded";
  const STORAGE_STATS = "scopecreepStats";

  function initStats() {
    return {
      flagged: 0,
      dismissed: 0,
      copied: 0,
      since: new Date().toISOString(),
    };
  }

  function bumpStat(key) {
    chrome.storage.local.get(STORAGE_STATS, (data) => {
      const stats = data[STORAGE_STATS] || initStats();
      stats[key] = (stats[key] || 0) + 1;
      chrome.storage.local.set({ [STORAGE_STATS]: stats }, renderStats);
    });
  }

  const els = {
    empty: document.getElementById("empty"),
    content: document.getElementById("content"),
    settings: document.getElementById("settings"),
    settingsIntro: document.getElementById("settings-intro"),

    quote: document.getElementById("quote"),
    sowContext: document.getElementById("sow-context"),
    sowBody: document.getElementById("sow-body"),
    hits: document.getElementById("hits"),
    hitCount: document.getElementById("hit-count"),
    picker: document.getElementById("picker"),
    draft: document.getElementById("draft"),
    copyBtn: document.getElementById("copy-btn"),
    dismissBtn: document.getElementById("dismiss-btn"),
    settingsLink: document.getElementById("settings-link"),

    setSOW: document.getElementById("set-sow"),
    setRate: document.getElementById("set-rate"),
    setSender: document.getElementById("set-sender"),
    setClient: document.getElementById("set-client"),
    setSlackName: document.getElementById("set-slack-name"),
    settingsSave: document.getElementById("settings-save"),
    settingsCancel: document.getElementById("settings-cancel"),

    statsStrip: document.getElementById("stats-strip"),
    statFlagged: document.getElementById("stat-flagged"),
    statDismissed: document.getElementById("stat-dismissed"),
    statCopied: document.getElementById("stat-copied"),
    statsSince: document.getElementById("stats-since"),
    statsReset: document.getElementById("stats-reset"),
  };

  let templates = null;
  let currentTemplateId = null;
  let lastFlagged = null;
  let userPrefs = {}; // rate, sender, client, sow

  // ── View routing ───────────────────────────────────────────────────────────
  function showView(name) {
    els.empty.style.display = name === "empty" ? "block" : "none";
    els.content.style.display = name === "content" ? "block" : "none";
    els.settings.style.display = name === "settings" ? "block" : "none";
  }

  // ── Templates ──────────────────────────────────────────────────────────────
  async function loadTemplates() {
    try {
      const url = chrome.runtime.getURL("src/data/templates.json");
      const res = await fetch(url);
      templates = await res.json();
    } catch (err) {
      console.error("[ScopeCreep] failed to load templates:", err);
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

  // ── Picker ─────────────────────────────────────────────────────────────────
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

  // ── SOW excerpt under flagged trigger ─────────────────────────────────────
  function renderSOW() {
    const sow = userPrefs.sow;
    if (!sow || !sow.trim()) {
      els.sowContext.classList.add("unset");
      els.sowBody.textContent = "No SOW set. Click 'Settings' below to paste yours.";
      return;
    }
    els.sowContext.classList.remove("unset");
    const MAX = 300;
    els.sowBody.textContent =
      sow.length > MAX ? sow.slice(0, MAX) + " …" : sow;
  }

  // ── Draft ──────────────────────────────────────────────────────────────────
  function renderDraft() {
    if (!lastFlagged || !templates) return;
    const tmpl = getTemplate(currentTemplateId);
    if (!tmpl) return;

    const sortedHits = [...lastFlagged.hits].sort(
      (a, b) => sevRank(b.severity) - sevRank(a.severity)
    );
    const topHit = sortedHits[0];

    const vars = {
      phrase: topHit ? topHit.phrase : "[trigger phrase]",
      rate: userPrefs.rate || "[your hourly rate]",
      hours: "[X] hours",
      date: "[revised date]",
      client: userPrefs.client || "[client]",
      sender: userPrefs.sender || "[your name]",
    };

    const subject = interpolate(tmpl.subject, vars);
    const body = interpolate(tmpl.body, vars);
    els.draft.value = `Subject: ${subject}\n\n${body}`;
  }

  // ── Show flagged ───────────────────────────────────────────────────────────
  function showFlagged(flagged) {
    if (!flagged || !flagged.hits || flagged.hits.length === 0) {
      showView("empty");
      return;
    }
    lastFlagged = flagged;
    showView("content");

    const MAX = 600;
    els.quote.textContent =
      flagged.text.length > MAX
        ? flagged.text.slice(0, MAX) + " …"
        : flagged.text;

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

    renderSOW();
    renderPicker();
    renderDraft();
  }

  // ── Settings view ──────────────────────────────────────────────────────────
  function openSettings({ firstRun = false } = {}) {
    if (firstRun) {
      els.settingsIntro.classList.add("first-run");
      els.settingsIntro.textContent =
        "Welcome. Set your defaults below so change-order drafts come out ready to send. Everything stays on this device.";
    } else {
      els.settingsIntro.classList.remove("first-run");
      els.settingsIntro.textContent =
        "Set your defaults below. Everything is stored locally on this device — nothing is sent to any server.";
    }
    els.setSOW.value = userPrefs.sow || "";
    els.setRate.value = userPrefs.rate || "";
    els.setSender.value = userPrefs.sender || "";
    els.setClient.value = userPrefs.client || "";
    els.setSlackName.value = userPrefs.slackName || "";
    showView("settings");
    setTimeout(() => els.setSOW.focus(), 50);
  }

  function closeSettings() {
    if (lastFlagged) showFlagged(lastFlagged);
    else showView("empty");
  }

  function saveSettings() {
    const next = {
      [STORAGE_SOW]: els.setSOW.value.trim(),
      [STORAGE_RATE]: els.setRate.value.trim(),
      [STORAGE_SENDER]: els.setSender.value.trim(),
      [STORAGE_CLIENT]: els.setClient.value.trim(),
      [STORAGE_SLACK_NAME]: els.setSlackName.value.trim(),
      [STORAGE_ONBOARDED]: true,
    };
    chrome.storage.local.set(next, () => {
      userPrefs.sow = next[STORAGE_SOW];
      userPrefs.rate = next[STORAGE_RATE];
      userPrefs.sender = next[STORAGE_SENDER];
      userPrefs.client = next[STORAGE_CLIENT];
      userPrefs.slackName = next[STORAGE_SLACK_NAME];
      closeSettings();
    });
  }

  // ── Stats rendering ────────────────────────────────────────────────────────
  function renderStats() {
    chrome.storage.local.get(STORAGE_STATS, (data) => {
      const stats = data[STORAGE_STATS] || initStats();
      // Footer strip (visible in all views)
      els.statsStrip.innerHTML =
        `<span>${stats.flagged} flagged</span>` +
        `<span class="sep">·</span>` +
        `<span>${stats.dismissed} dismissed</span>` +
        `<span class="sep">·</span>` +
        `<span>${stats.copied} drafted</span>` +
        `<span class="sep">·</span>` +
        `<span>local-only</span>`;
      // Settings expanded
      if (els.statFlagged) els.statFlagged.textContent = stats.flagged;
      if (els.statDismissed) els.statDismissed.textContent = stats.dismissed;
      if (els.statCopied) els.statCopied.textContent = stats.copied;
      if (els.statsSince && stats.since) {
        const d = new Date(stats.since);
        els.statsSince.textContent =
          "Since " + d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      }
    });
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
      bumpStat("copied");
    } catch (err) {
      console.error("[ScopeCreep] clipboard write failed", err);
      els.draft.select();
      document.execCommand("copy");
      bumpStat("copied");
    }
  });

  // ── Dismiss ────────────────────────────────────────────────────────────────
  els.dismissBtn.addEventListener("click", () => {
    bumpStat("dismissed");
    chrome.storage.local.remove(STORAGE_KEY, () => {
      lastFlagged = null;
      showView("empty");
    });
  });

  // ── Stats reset ────────────────────────────────────────────────────────────
  els.statsReset.addEventListener("click", () => {
    if (window.confirm("Reset all stats? This can't be undone.")) {
      chrome.storage.local.set({ [STORAGE_STATS]: initStats() }, renderStats);
    }
  });

  // ── Settings actions ───────────────────────────────────────────────────────
  els.settingsLink.addEventListener("click", (ev) => {
    ev.preventDefault();
    openSettings({ firstRun: false });
  });
  els.settingsSave.addEventListener("click", saveSettings);
  els.settingsCancel.addEventListener("click", closeSettings);

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
      [
        STORAGE_KEY,
        STORAGE_SOW,
        STORAGE_RATE,
        STORAGE_SENDER,
        STORAGE_CLIENT,
        STORAGE_SLACK_NAME,
        STORAGE_TEMPLATE,
        STORAGE_ONBOARDED,
      ],
      (data) => {
        userPrefs = {
          sow: data[STORAGE_SOW] || "",
          rate: data[STORAGE_RATE] || "",
          sender: data[STORAGE_SENDER] || "",
          client: data[STORAGE_CLIENT] || "",
          slackName: data[STORAGE_SLACK_NAME] || "",
        };
        currentTemplateId =
          data[STORAGE_TEMPLATE] || templates.default_template_id;

        const onboarded =
          !!data[STORAGE_ONBOARDED] ||
          !!userPrefs.sow ||
          !!userPrefs.rate; // pre-T-016 installs grandfathered in if they set anything

        if (!onboarded) {
          openSettings({ firstRun: true });
        } else if (data[STORAGE_KEY] && data[STORAGE_KEY].hits) {
          showFlagged(data[STORAGE_KEY]);
        } else {
          showView("empty");
        }

        renderStats();
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
