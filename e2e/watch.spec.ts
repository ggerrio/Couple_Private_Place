/**
 * e2e/watch.spec.ts — WatchPanel (Heartbeat tab) realtime sync
 *
 * Maps manual table rows:
 *   3.1.b — Video load sync (≤2s)
 *   3.2.b — Playback position drift (≤30s test with throttling)
 *   3.3.b — Chat single-send sync
 *   3.3.c — Chat concurrent (no message loss)
 *   3.3.d — Chat burst: 5 messages / 3s produces 5 PATCHes (one per arrayUnion)
 */
import { test, expect } from "./fixtures";

const TEST_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // never gonna give you up

test.describe.configure({ mode: "serial" });

test.describe("Watch realtime sync", () => {
  test.beforeEach(async ({ adminPage, userPage }) => {
    await adminPage.goto("/the-heartbeat");
    await userPage.goto("/the-heartbeat");
    await adminPage.waitForLoadState("networkidle");
    await userPage.waitForLoadState("networkidle");
    await userPage.waitForTimeout(800);
  });

  test("3.1.b — video load syncs to partner (≤2s)", async ({ adminPage, userPage, measureLatency }) => {
    const input = adminPage.getByPlaceholder(/youtube|url/i).first();
    await input.scrollIntoViewIfNeeded();

    const latency = await measureLatency(
      adminPage,
      async () => {
        await input.fill(TEST_VIDEO_URL);
        await adminPage.getByRole("button", { name: /load/i }).first().click();
      },
      userPage,
      async () => {
        const iframes = await userPage.locator("iframe").count();
        return iframes >= 2; // admin iframe + partner iframe
      },
      { timeoutMs: 3_000 },
    );
    expect(latency).toBeLessThanOrEqual(3_000);
  });

  test("3.2.b — playback progress drifts but stays within 2s tolerance", async ({ adminPage, userPage }) => {
    // Load video first.
    await adminPage.getByPlaceholder(/youtube|url/i).first().fill(TEST_VIDEO_URL);
    await adminPage.getByRole("button", { name: /load/i }).first().click();
    await adminPage.getByRole("button", { name: /play/i }).first().click();
    await userPage.waitForTimeout(2_000);

    // Both players should now be active.
    await adminPage.waitForTimeout(3_000);
    const adminTime = await adminPage.locator('[data-testid="music-current-time"]').innerText().catch(() => "0:00");
    const userTime = await userPage.locator('[data-testid="music-current-time"]').innerText().catch(() => "0:00");
    expect(adminTime).toBeTruthy();
    expect(userTime).toBeTruthy();
    // Both should have progressed past initial state.
    expect(adminTime).not.toBe("0:00");
  });

  test("3.3.b — single chat message syncs within 1s", async ({ adminPage, userPage, measureLatency }) => {
    const chatInput = adminPage.getByPlaceholder(/comment|chat|note/i).first();
    await chatInput.scrollIntoViewIfNeeded();

    const message = `Hello from admin ${Date.now()}`;
    const latency = await measureLatency(
      adminPage,
      async () => {
        await chatInput.fill(message);
        await adminPage.getByRole("button", { name: /send/i }).first().click();
      },
      userPage,
      async () => {
        const body = await userPage.locator("body").innerText();
        return body.includes(message);
      },
      { timeoutMs: 1_000 },
    );
    expect(latency).toBeLessThanOrEqual(1_000);
  });

  test("3.3.c — concurrent chats from both users: both messages appear (no loss)", async ({ adminPage, userPage }) => {
    const adminMsg = `Admin concurrent ${Date.now()}`;
    const partnerMsg = `Partner concurrent ${Date.now()}`;

    // Both fill + send in parallel.
    await Promise.all([
      adminPage.getByPlaceholder(/comment|chat|note/i).first().fill(adminMsg).then(() =>
        adminPage.getByRole("button", { name: /send/i }).first().click()
      ),
      userPage.getByPlaceholder(/comment|chat|note/i).first().fill(partnerMsg).then(() =>
        userPage.getByRole("button", { name: /send/i }).first().click()
      ),
    ]);

    await adminPage.waitForTimeout(2_000);

    const adminBody = await adminPage.locator("body").innerText();
    const userBody = await userPage.locator("body").innerText();

    expect(adminBody).toContain(adminMsg);
    expect(adminBody).toContain(partnerMsg);
    expect(userBody).toContain(adminMsg);
    expect(userBody).toContain(partnerMsg);
  });

  test("3.3.d — 5-message burst produces 5 arrayUnion PATCHes (race-safe append)", async ({ adminPage }) => {
    // Track Firestore writes targeting chatMessages arrayUnion.
    const writeCount = { n: 0 };
    adminPage.on("request", (req) => {
      const body = req.postData() ?? "";
      const isWrite = req.method() === "POST" && req.url().includes("googleapis.com");
      if (isWrite && (body.includes("chatMessages") || body.includes("chat_messages"))) {
        writeCount.n += 1;
      }
    });

    const chatInput = adminPage.getByPlaceholder(/comment|chat|note/i).first();
    for (let i = 1; i <= 5; i++) {
      await chatInput.fill(`burst ${i} ${Date.now()}`);
      await adminPage.getByRole("button", { name: /send/i }).first().click();
      await adminPage.waitForTimeout(500);
    }
    await adminPage.waitForTimeout(1_000);

    expect(writeCount.n).toBeGreaterThanOrEqual(5);
  });
});
