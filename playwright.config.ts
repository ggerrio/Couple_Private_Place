/**
 * playwright.config.ts — Playwright configuration for realtime sync suite
 *
 * Strategy:
 *   - Two browser contexts per test (adminPage = user_a, userPage = user_b)
 *   - Real Firebase Emulators (Auth+Firestore+RTDB) running locally OR in CI
 *   - Vite dev:test server with VITE_USE_FIREBASE_EMULATOR=true flag
 *   - flakiness controls: 2x retries in CI, 30s default timeout, expect.poll
 *
 * Local-dev: `npm run emulator:start` in terminal 1, `npm run test:e2e:ui` in terminal 2.
 * CI: @see .github/workflows/realtime-sync.yml
 */
import { defineConfig, devices } from "@playwright/test";

const PORT = 5173;

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.spec\.ts$/,
  outputDir: "./playwright/test-results",
  fullyParallel: false, // tests share emulator state — keep serial
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // emulator can't handle parallel state cleanly
  reporter: process.env.CI
    ? [["github"], ["list"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],

  timeout: 30_000, // 30s per test
  expect: { timeout: 4_000 }, // generous polling window for sync assertions

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: !process.env.HEADED,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: "chromium-realtime-sync",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `npm run dev:test`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
