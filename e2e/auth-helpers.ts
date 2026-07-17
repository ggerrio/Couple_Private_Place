/**
 * auth-helpers.ts — Sign in tab-by-tab into the Firebase Auth Emulator.
 *
 * Flow:
 *   1. Ensure test users exist in Auth Emulator (signUp if missing).
 *   2. Mint a custom token via Admin SDK with the user's uid + email claims.
 *   3. The Playwright page calls signInWithCustomToken via window.__fcb.auth.
 *
 * Firestore rules see request.auth.token.email and route admin → user_a,
 * partner → user_b (the existing getAdminEmail() check inside the rules).
 */
import {
  adminAuth,
  TEST_USERS,
  ADMIN_EMAIL,
  type TestUser,
} from "./firebase-admin-client";

type Identity = "admin" | "partner";

async function ensureUserExists(role: Identity) {
  const u = TEST_USERS[role];
  try {
    await adminAuth.getUser(u.uid);
  } catch {
    await adminAuth.createUser({
      uid: u.uid,
      email: u.email,
      password: u.password,
      emailVerified: true,
    });
  }
}

/**
 * Mint a Firebase custom token (server-side) for the named test user.
 * Returned token is consumable by client SDK's signInWithCustomToken().
 */
export async function mintCustomToken(role: Identity): Promise<string> {
  await ensureUserExists(role);
  const u = TEST_USERS[role];
  return adminAuth.createCustomToken(u.uid, {
    email: u.email,
    // Mimic Google account fields so the rule profile claim works.
    // The Firestore rules allow any profile slot to update as long as
    // request.auth.token.email matches admin_email OR is not admin.
    provider_id: "google.com",
    firebase: { sign_in_provider: "google.com" },
  });
}

/**
 * Inject a signed-in Firebase auth state into a Playwright Page.
 *
 * @param page  Playwright page
 * @param role  "admin" (=user_a slot) or "partner" (=user_b slot)
 */
export async function signPageInAs(page: import("@playwright/test").Page, role: Identity) {
  const token = await mintCustomToken(role);
  await page.addInitScript((t) => {
    // The app exposes window.__fcb.auth in DEV (gatsby) — sign in once app loads.
    // We sign in BEFORE any route by polling for __fcb availability.
    const trySignIn = async () => {
      const w = window as any;
      if (!w.__fcb?.auth) {
        setTimeout(trySignIn, 50);
        return;
      }
      try {
        const cred = await w.__fcb.auth.signInWithCustomToken(t);
        // Persist auth so it survives page reloads in the same BrowserContext.
        await w.__fcb.auth.setPersistence(w.__fcb.auth.Persistence?.LOCAL ?? "local");
        (window as any).__currentTestRole__ = cred.user?.uid;
      } catch (err: any) {
        console.error("[test signIn]", err);
        setTimeout(trySignIn, 200);
      }
    };
    trySignIn();
  }, token);

  // Make sure the Admin SDK also knows who's the admin so we can seed auth_id.
  return { uid: TEST_USERS[role].uid, email: TEST_USERS[role].email };
}

export { ADMIN_EMAIL };
