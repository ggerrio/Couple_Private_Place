/**
 * fixtures.ts — Custom Playwright fixtures for the realtime sync suite.
 *
 * Each test gets two pre-signed-in browser contexts:
 *   - adminPage  → logged in as test Admin (admin@test.local → user_a slot)
 *   - userPage   → logged in as test Partner (partner@test.local → user_b slot)
 *
 * Helpers:
 *   - signInBoth(page)        — pre-test sign-in helper
 *   - waitForSync(page, fn)   — poll until fn() returns truthy, abort after timeout
 *   - assertLatency(page, fn) — measure end-to-end Firestore write → display latency
 *   - clickAndAwait(...)      — trigger an action and wait for partner sync
 */
import { test as base, expect, type Page, type BrowserContext, chromium } from "@playwright/test";
import { signPageInAs } from "./auth-helpers";
import { cleanupVolatileState, seedAll } from "./setup-firestore-data";

type E2EFixtures = {
  adminPage: Page;
  adminContext: BrowserContext;
  userPage: Page;
  userContext: BrowserContext;
  waitForSync: (page: Page, predicate: () => Promise<boolean> | boolean, options?: { timeoutMs?: number }) => Promise<number>;
  measureLatency: (
    actor: Page,
    actorAction: () => Promise<void>,
    partner: Page,
    partnerAssertion: () => Promise<boolean> | boolean,
    options?: { timeoutMs?: number },
  ) => Promise<number>;
};

export const test = base.extend<E2EFixtures>({
  // Each test gets a fresh pair of contexts (parallel-safe: separate auth state).
  adminContext: async ({}, use) => {
    const ctx = await chromium.launch().then((b) => b.newContext());
    await use(ctx);
    await ctx.close();
  },
  userContext: async ({}, use) => {
    const ctx = await chromium.launch().then((b) => b.newContext());
    await use(ctx);
    await ctx.close();
  },

  adminPage: async ({ adminContext }, use) => {
    await signPageInAs(await adminContext.newPage(), "admin");
    const page = adminContext.pages()[0];
    await use(page);
  },
  userPage: async ({ userContext }, use) => {
    await signPageInAs(await userContext.newPage(), "partner");
    const page = userContext.pages()[0];
    await use(page);
  },

  waitForSync: async ({}, use) => {
    const helper = async (page: Page, predicate: () => Promise<boolean> | boolean, options?: { timeoutMs?: number }) => {
      const timeoutMs = options?.timeoutMs ?? 3_000;
      const start = Date.now();
      await expect.poll(predicate, {
        timeout: timeoutMs,
        intervals: [50, 100, 200, 500],
      }).toBe(true);
      return Date.now() - start;
    };
    await use(helper);
  },

  measureLatency: async ({}, use) => {
    const helper = async (
      actor: Page,
      actorAction: () => Promise<void>,
      partner: Page,
      partnerAssertion: () => Promise<boolean> | boolean,
      options?: { timeoutMs?: number },
    ) => {
      const timeoutMs = options?.timeoutMs ?? 3_000;
      const t0 = Date.now();
      await actorAction();
      await expect.poll(partnerAssertion, {
        timeout: timeoutMs,
        intervals: [50, 100, 200, 500],
      }).toBe(true);
      return Date.now() - t0;
    };
    await use(helper);
  },
});

export { expect };

// Global per-suite hooks — keep stable spec ordering.
test.beforeAll(async () => {
  await seedAll();
});

test.afterEach(async () => {
  await cleanupVolatileState();
});

test.afterAll(async () => {
  await cleanupVolatileState();
});
