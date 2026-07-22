/**
 * e2e/a11y.spec.ts — accessibility smoke + prefers-reduced-motion verify
 *
 * Decoupled from e2e/fixtures.ts so this spec runs WITHOUT the
 * Firebase emulator: we navigate to `/?sandbox=Nicola` (a URL bypass
 * built into the dev entry) which signs a synthetic user in without
 * touching the emulator or seeded Firestore. The realtime-sync
 * precedent path (adminPage / userPage) stays reserved for the
 * brain / music / watch specs where two-actor sync is the actual
 * assertion target.
 *
 * For each scene visited:
 *   • Run @axe-core/playwright on the rendered overlay
 *   • Assert zero violations at the `critical` + `serious` level
 *
 * Reduced-motion variant:
 *   • Browser context with `reducedMotion: "reduce"`
 *   • Verify gift-open mounts + no focusable button-without-name
 *     (decorative elements like VinylDisc are aria-hidden via the
 *     Decorations.tsx POINTER_NONE_CLASS wrapper pattern)
 */

import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

const SANDBOX_URL = "/?sandbox=Nicola";
const BIRTHDAY_GIFT_BUTTON = "Open Birthday Gift";

async function openBirthdayViaSandbox(page) {
  await page.goto(SANDBOX_URL);
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("button", { name: BIRTHDAY_GIFT_BUTTON })
    .first()
    .click();
  await page.waitForSelector('[aria-label^="Birthday scene"]', {
    timeout: 8000,
  });
}

test.describe.configure({ mode: "serial" });

test.describe("Birthday experience a11y", () => {
  test("0 critical/serious violations on gift-open (cake scene)", async ({
    page,
  }) => {
    await openBirthdayViaSandbox(page);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(
      blocking,
      `gift-open: ${JSON.stringify(blocking, null, 2)}`,
    ).toEqual([]);
  });

  test("0 critical/serious across hero, scrapbook, photo-1 (manual nav)", async ({
    page,
  }) => {
    await openBirthdayViaSandbox(page);
    for (const targetId of ["hero", "scrapbook", "photo-1"]) {
      // Step forward via ArrowRight until we land on the target.
      for (let i = 0; i < 6; i++) {
        const currentId = await page
          .locator("[data-scene]")
          .first()
          .getAttribute("data-scene");
        if (currentId === targetId) break;
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(700);
      }
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      expect(
        blocking,
        `${targetId}: ${JSON.stringify(blocking, null, 2)}`,
      ).toEqual([]);
    }
  });
});

test.describe("prefers-reduced-motion: reduce fallback", () => {
  test("gift-open renders + no focusable button-without-name", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    try {
      await openBirthdayViaSandbox(page);
      await expect(
        page.locator('[data-scene="gift-open"]').first(),
      ).toBeVisible({ timeout: 6000 });

      // The VinylDisc is `aria-hidden` via the Decorations.tsx
      // POINTER_NONE_CLASS wrapper, so any decorative button in the
      // tree will not be focusable. Audit the buttons Are focusable
      // AND have NO name (which would be a real WCAG fail).
      const buttonsWithoutName = await page.evaluate(() =>
        Array.from(document.querySelectorAll("button"))
          .filter(
            (b) =>
              !b.textContent?.trim() &&
              !b.getAttribute("aria-label") &&
              b.tabIndex >= 0,
          )
          .map((b) => b.outerHTML.slice(0, 120)),
      );
      expect(buttonsWithoutName).toEqual([]);
    } finally {
      await ctx.close();
    }
  });
});
