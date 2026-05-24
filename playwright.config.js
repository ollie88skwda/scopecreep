// Playwright config for ScopeCreep DOM tests (T-017).
// Tests load fixtures from tests/fixtures/*.html, inject the content script,
// and assert badge appears (or doesn't) on the expected messages.
//
// Local run:    npm install && npx playwright install chromium && npm test
// CI:           .github/workflows/test.yml

const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 10_000,
  expect: { timeout: 3_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:0", // unused; fixtures loaded via file://
    headless: true,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
