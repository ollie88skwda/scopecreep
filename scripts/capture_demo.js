// Record a demo flow of the popup as a GIF.
// Flow: content view appears → user cycles template variants → drafts update →
//       hover/focus copy button. ffmpeg converts the recorded webm to gif.

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const REPO = path.resolve(__dirname, "..");
const PANEL = "file://" + path.join(REPO, "src", "popup", "panel.html");
const TEMPLATES_PATH = path.join(REPO, "src", "data", "templates.json");
const LEXICON_PATH = path.join(REPO, "src", "data", "lexicon.json");
const VIDEO_DIR = path.join(REPO, "marketing", "_demo-tmp");
const GIF_OUT = path.join(REPO, "marketing", "demo.gif");

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
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const templatesJson = fs.readFileSync(TEMPLATES_PATH, "utf8");
  const lexiconJson = fs.readFileSync(LEXICON_PATH, "utf8");
  const tmpl =
    "data:application/json;base64," +
    Buffer.from(templatesJson).toString("base64");
  const lex =
    "data:application/json;base64," +
    Buffer.from(lexiconJson).toString("base64");

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: VIDEO_DIR, size: { width: 420, height: 900 } },
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
              const s = window.chrome.storage.local._store;
              if (typeof keys === "string") return cb({ [keys]: s[keys] });
              if (Array.isArray(keys)) {
                const out = {};
                for (const k of keys) out[k] = s[k];
                return cb(out);
              }
              if (keys && typeof keys === "object") {
                const out = {};
                for (const k of Object.keys(keys))
                  out[k] = s[k] !== undefined ? s[k] : keys[k];
                return cb(out);
              }
              cb({ ...s });
            },
            set(obj, cb) {
              const s = window.chrome.storage.local._store;
              for (const k of Object.keys(obj)) s[k] = obj[k];
              if (cb) cb();
            },
            remove(keys, cb) {
              const s = window.chrome.storage.local._store;
              const arr = Array.isArray(keys) ? keys : [keys];
              for (const k of arr) delete s[k];
              if (cb) cb();
            },
          },
          onChanged: { addListener: () => {} },
        },
      };
    },
    { tmpl, lex, store: storageData }
  );

  await page.goto(PANEL);
  await page.waitForSelector("#content", { state: "visible", timeout: 5000 });

  // Hold on the flagged view so viewers can read it
  await page.waitForTimeout(1800);

  // Cycle through templates: neutral (current) → friendly → concise → formal → neutral
  const variants = ["friendly", "concise", "formal", "neutral"];
  for (const v of variants) {
    const btn = await page.$(`#picker button[data-template-id="${v}"]`);
    if (btn) {
      await btn.hover();
      await page.waitForTimeout(220);
      await btn.click();
      await page.waitForTimeout(1100);
    }
  }

  // Hover copy button as a final beat
  const copy = await page.$("#copy-btn");
  if (copy) {
    await copy.hover();
    await page.waitForTimeout(600);
    await copy.click();
    await page.waitForTimeout(900);
  }

  await page.close();
  const video = page.video();
  const videoPath = await (video ? video.path() : Promise.resolve(null));
  await ctx.close();
  await browser.close();

  if (!videoPath) {
    console.error("no video recorded");
    process.exit(1);
  }

  console.log("Recorded:", videoPath);

  // Convert webm to gif via ffmpeg
  // - 15 fps strikes a balance between size and motion smoothness
  // - palette pass keeps colours clean against the dark UI
  const palette = path.join(VIDEO_DIR, "palette.png");
  execSync(
    `ffmpeg -y -i "${videoPath}" -vf "fps=15,scale=420:-1:flags=lanczos,palettegen=stats_mode=full" "${palette}"`,
    { stdio: "inherit" }
  );
  execSync(
    `ffmpeg -y -i "${videoPath}" -i "${palette}" -lavfi "fps=15,scale=420:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5" "${GIF_OUT}"`,
    { stdio: "inherit" }
  );

  // Clean up working dir
  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });

  const bytes = fs.statSync(GIF_OUT).size;
  console.log(`Saved ${GIF_OUT} (${(bytes / 1024).toFixed(0)} KB)`);
})();
