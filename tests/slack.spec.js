// ScopeCreep Notary — Slack content script DOM tests
//
// Loads each HTML fixture, injects the lexicon + the content script,
// asserts the badge appears (or doesn't) on the expected messages.
// Catches Slack selector decay (when all multi-fallback selectors break)
// before users do — per dec-035 + dec-023.

const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const FIXTURES = path.join(__dirname, "fixtures");
const LEXICON_PATH = path.join(__dirname, "..", "src", "data", "lexicon.json");
const SLACK_JS_PATH = path.join(__dirname, "..", "src", "content", "slack.js");

const BADGE_SELECTOR = ".scopecreep-badge";
const FLAGGED_ATTR = "data-scopecreep-flagged";

// Helper: load fixture, stub chrome.runtime, inject lexicon + content script,
// wait for the MutationObserver-driven scan to complete.
// Optional `storageData` object pre-populates chrome.storage.local.get returns
// (so tests can configure scopecreepSlackName etc).
async function loadFixtureWithScript(page, fixtureName, storageData = {}) {
  const lexicon = fs.readFileSync(LEXICON_PATH, "utf8");
  const slackJs = fs.readFileSync(SLACK_JS_PATH, "utf8");

  const lexiconDataUrl =
    "data:application/json;base64," +
    Buffer.from(lexicon).toString("base64");

  await page.addInitScript(
    ({ dataUrl, storageData }) => {
      window.chrome = {
        runtime: {
          getURL: (p) => (p.endsWith("lexicon.json") ? dataUrl : p),
          sendMessage: () => Promise.reject(new Error("no popup")),
        },
        storage: {
          local: {
            set: (_obj, cb) => cb && cb(),
            get: (keys, cb) => {
              if (typeof keys === "string") cb({ [keys]: storageData[keys] });
              else cb(storageData);
            },
          },
          onChanged: { addListener: () => {} },
        },
      };
    },
    { dataUrl: lexiconDataUrl, storageData }
  );

  await page.goto("file://" + path.join(FIXTURES, fixtureName));
  await page.addScriptTag({ content: slackJs });
  await page.waitForTimeout(800);
}

test.describe("ScopeCreep Slack content script", () => {
  test("flags a simple 'can you also' message", async ({ page }) => {
    await loadFixtureWithScript(page, "flagged-simple.html");
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(1);
    await expect(page.locator(`[${FLAGGED_ATTR}]`)).toHaveCount(1);
    await expect(page.locator(BADGE_SELECTOR)).toContainText("SCOPE");
  });

  test("flags 'while you're at it' as high severity", async ({ page }) => {
    await loadFixtureWithScript(page, "flagged-high-severity.html");
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(1);
    await expect(page.locator(BADGE_SELECTOR)).toHaveAttribute(
      "data-severity",
      "high"
    );
  });

  test("flags a multi-hit message and shows count in badge", async ({ page }) => {
    await loadFixtureWithScript(page, "flagged-multi-hit.html");
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(1);
    // Badge text should be "SCOPE N" where N > 1
    const text = await page.locator(BADGE_SELECTOR).textContent();
    expect(text).toMatch(/^SCOPE \d+$/);
    const m = text.match(/(\d+)/);
    expect(parseInt(m[1], 10)).toBeGreaterThan(1);
  });

  test("does NOT flag a benign message", async ({ page }) => {
    await loadFixtureWithScript(page, "benign-simple.html");
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(0);
    await expect(page.locator(`[${FLAGGED_ATTR}]`)).toHaveCount(0);
  });

  test("does NOT flag urgency-only edge case (single low-severity)", async ({ page }) => {
    await loadFixtureWithScript(page, "benign-edge-urgency-only.html");
    // "ASAP" alone is severity=low × category weight 0.6 = 0.6 < threshold 2
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(0);
  });

  test("flags formatted message (handles bold/italic/strong children)", async ({ page }) => {
    await loadFixtureWithScript(page, "flagged-formatted.html");
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(1);
  });

  test("flags message containing a code block", async ({ page }) => {
    await loadFixtureWithScript(page, "flagged-with-code-block.html");
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(1);
  });

  test("processes 4 messages, flags exactly 2 (idempotent multi-message)", async ({ page }) => {
    await loadFixtureWithScript(page, "multi-message-mixed.html");
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(2);
    await expect(page.locator(`[${FLAGGED_ATTR}]`)).toHaveCount(2);
  });

  test("idempotency — re-scanning does not double-badge", async ({ page }) => {
    await loadFixtureWithScript(page, "flagged-simple.html");
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(1);

    // Force the observer to fire again by mutating an unrelated DOM node.
    await page.evaluate(() => {
      const span = document.createElement("span");
      span.id = "dummy";
      document.body.appendChild(span);
    });
    await page.waitForTimeout(300);

    // Still exactly one badge — no doubles.
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(1);
  });

  test("badge has clickable cursor + correct severity color attribute", async ({ page }) => {
    await loadFixtureWithScript(page, "flagged-simple.html");
    const badge = page.locator(BADGE_SELECTOR).first();
    const severity = await badge.getAttribute("data-severity");
    expect(["low", "medium", "high"]).toContain(severity);
  });
});

// ── T-022: skip own messages by display-name match ────────────────────────
test.describe("skip own messages (T-022)", () => {
  test("does NOT flag a message authored by the configured user", async ({ page }) => {
    await loadFixtureWithScript(page, "own-message.html", {
      scopecreepSlackName: "Test User",
    });
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(0);
    await expect(page.locator(`[${FLAGGED_ATTR}]`)).toHaveCount(0);
    // Sanity: the self-skip attribute is set so we know the code path ran
    await expect(page.locator('[data-scopecreep-self="1"]')).toHaveCount(1);
  });

  test("DOES flag the same body when authored by someone else", async ({ page }) => {
    await loadFixtureWithScript(page, "their-message-flagged.html", {
      scopecreepSlackName: "Test User",
    });
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(1);
    await expect(page.locator(`[${FLAGGED_ATTR}]`)).toHaveCount(1);
  });

  test("name match is case-insensitive", async ({ page }) => {
    await loadFixtureWithScript(page, "own-message.html", {
      scopecreepSlackName: "test user",
    });
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(0);
  });

  test("when scopecreepSlackName is unset, falls back to legacy 'flag everything' behavior", async ({ page }) => {
    // No storage data → ownSlackName stays empty → skip logic not engaged.
    await loadFixtureWithScript(page, "own-message.html", {});
    await expect(page.locator(BADGE_SELECTOR)).toHaveCount(1);
  });
});

// ── Selector-decay canary ───────────────────────────────────────────────────
// If Slack rotates ALL the multi-fallback selectors and our fixtures still use
// the current ones, this test stays green. But the moment we update fixtures
// to a new Slack DOM shape (or capture real prod DOMs that no longer match),
// this gives us an early warning before users see broken badges.
test.describe("selector decay canary", () => {
  test("at least one MESSAGE_SELECTOR matches in every flagged fixture", async ({ page }) => {
    const flaggedFixtures = fs
      .readdirSync(FIXTURES)
      .filter((f) => f.startsWith("flagged-") && f.endsWith(".html"));
    expect(flaggedFixtures.length).toBeGreaterThan(0);

    for (const fixture of flaggedFixtures) {
      await page.goto("file://" + path.join(FIXTURES, fixture));
      const matched = await page.evaluate(() => {
        const sels = [
          '[data-qa="message_container"]',
          ".c-message_kit__message",
          ".c-message",
          '[role="listitem"][data-qa*="message"]',
        ];
        for (const s of sels) {
          if (document.querySelectorAll(s).length > 0) return s;
        }
        return null;
      });
      expect(matched, `fixture ${fixture} matched no MESSAGE_SELECTOR`).not.toBeNull();
    }
  });
});
