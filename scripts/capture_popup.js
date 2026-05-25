// Headless popup screenshot for marketing/screenshot.png.
// Loads src/popup/panel.html with chrome.storage stubbed to a realistic
// flagged-message state, then screenshots the rendered popup.

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const REPO = path.resolve(__dirname, "..");
const PANEL = "file://" + path.join(REPO, "src", "popup", "panel.html");
const TEMPLATES_PATH = path.join(REPO, "src", "data", "templates.json");
const LEXICON_PATH = path.join(REPO, "src", "data", "lexicon.json");
const OUT = path.join(REPO, "marketing", "screenshot.png");

const sampleText =
  "Hey can you also add a quick animated intro and update the homepage copy while you're at it? Shouldn't take long.";

const sampleHits = [
  { severity: "high",   phrase: "while you're at it", category: "additive" },
  { severity: "high",   phrase: "shouldn't take long", category: "trivialize" },
  { severity: "medium", phrase: "can you also",       category: "additive" },
];

const storageData = {
  scopecreepOnboarded: true,
  scopecreepSOW:
    "Logo design + 3 revisions. Standard brand colors. No animation, no video, no copywriting.",
  scopecreepHourlyRate: "150",
  scopecreepSender: "Oliver",
  scopecreepClient: "Acme Co.",
  scopecreepSlackName: "Oliver",
  scopecreepTemplateId: "neutral",
  scopecreepStats: {
    flagged: 12,
    dismissed: 3,
    copied: 7,
    since: "2026-05-15T10:00:00.000Z",
  },
  scopecreepLastClick: {
    text: sampleText,
    hits: sampleHits,
    ts: Date.now(),
  },
};

(async () => {
  const templatesJson = fs.readFileSync(TEMPLATES_PATH, "utf8");
  const lexiconJson = fs.readFileSync(LEXICON_PATH, "utf8");
  const templatesDataUrl =
    "data:application/json;base64," +
    Buffer.from(templatesJson).toString("base64");
  const lexiconDataUrl =
    "data:application/json;base64," +
    Buffer.from(lexiconJson).toString("base64");

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 420, height: 1400 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  await page.addInitScript(
    ({ tmpl, lex, store }) => {
      window.chrome = {
        runtime: {
          getURL: (p) => {
            if (p.endsWith("templates.json")) return tmpl;
            if (p.endsWith("lexicon.json")) return lex;
            return p;
          },
          sendMessage: () => Promise.resolve(),
          onMessage: { addListener: () => {} },
        },
        storage: {
          local: {
            _store: { ...store },
            get(keys, cb) {
              const self = window.chrome.storage.local._store;
              if (typeof keys === "string") return cb({ [keys]: self[keys] });
              if (Array.isArray(keys)) {
                const out = {};
                for (const k of keys) out[k] = self[k];
                return cb(out);
              }
              if (keys && typeof keys === "object") {
                const out = {};
                for (const k of Object.keys(keys))
                  out[k] = self[k] !== undefined ? self[k] : keys[k];
                return cb(out);
              }
              cb({ ...self });
            },
            set(obj, cb) {
              const self = window.chrome.storage.local._store;
              for (const k of Object.keys(obj)) self[k] = obj[k];
              if (cb) cb();
            },
            remove(keys, cb) {
              const self = window.chrome.storage.local._store;
              const arr = Array.isArray(keys) ? keys : [keys];
              for (const k of arr) delete self[k];
              if (cb) cb();
            },
          },
          onChanged: { addListener: () => {} },
        },
      };
    },
    { tmpl: templatesDataUrl, lex: lexiconDataUrl, store: storageData }
  );

  await page.goto(PANEL);
  await page.waitForSelector("#content", { state: "visible", timeout: 5000 });
  await page.waitForTimeout(500);

  // Screenshot full popup body height
  const bodyHandle = await page.$("body");
  await bodyHandle.screenshot({ path: OUT });

  await browser.close();
  console.log("Saved", OUT);
})();
