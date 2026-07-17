/**
 * setup-firestore-data.ts — Seed predictable state for tests + clean up.
 *
 * Why this exists:
 *   The Firestore rules use getAdminEmail() which reads settings/admin_config.
 *   The rules check `auth.uid == resource.data.auth_id` for profile updates.
 *   So we MUST seed both with deterministic test identities before each test.
 *
 *   Without this, every fresh emulator run would have an empty DB and the
 *   rule `getAdminEmail()` would fall through to the hardcoded fallback —
 *   which is fine for read paths but not for rule evaluation in some tests.
 */
import { adminAuth, adminDb, adminRtdb, TEST_USERS, ADMIN_EMAIL } from "./firebase-admin-client";

const DEFAULT_PROFILE_FIELDS = {
  name: "Test User",
  avatar_url: "https://placehold.co/64x64/png",
  status: "Test status",
  mood: "happy",
  emoji: "🌟",
  timezone_offset: 0,
  timezone_name: "UTC",
};

/**
 * Runs once before all tests in a worker — global seed.
 * Idempotent: safe to call multiple times.
 */
export async function seedAll() {
  // 1) Settings — admin_config must point at our test admin email.
  await adminDb.collection("settings").doc("admin_config").set({
    admin_email: ADMIN_EMAIL,
    updated_at: new Date().toISOString(),
  }, { merge: true });

  // 2) Settings — couple_settings w/ sensible defaults.
  await adminDb.collection("settings").doc("couple_settings").set({
    anniversary_date: "2024-10-15",
    birthday_a: "11-18",
    birthday_b: "04-05",
    cloudinary_cloud_name: "",
    cloudinary_upload_preset: "",
    custom_greetings: {
      morning: "Good morning, my love ☀️",
      afternoon: "Hi, thinking of you 💕",
      evening: "Sweet dreams tonight 🌙",
      night: "Burrowed in your heart 🦦",
    },
  }, { merge: true });

  // 3) Profiles — seed both slots with deterministic auth_id mapping.
  await adminDb.collection("profiles").doc("user_a").set({
    ...DEFAULT_PROFILE_FIELDS,
    name: "Test Admin (Gerrio)",
    auth_id: TEST_USERS.admin.uid,
    weather_city: "Seoul",
    last_active: Date.now(),
  }, { merge: true });

  await adminDb.collection("profiles").doc("user_b").set({
    ...DEFAULT_PROFILE_FIELDS,
    name: "Test Partner (Nicole)",
    auth_id: TEST_USERS.partner.uid,
    weather_city: "Tokyo",
    last_active: Date.now(),
  }, { merge: true });

  // 4) Seed missions with at least one task so the Home/Home tab has content.
  await adminDb.collection("missions").doc("mis-test-seed").set({
    text: "Verification mission (test-managed)",
    completed: false,
    type: "daily",
    created_at: new Date().toISOString(),
  }, { merge: true });

  // 5) Realtime DB: Piano session just needs the path writable (rules already wide-open).
  await adminRtdb.ref("rooms/couple_piano_session/events").set(null).catch(() => {
    // Ignore — RTDB ignores null/empty writes.
  });
}

/**
 * Runs after each test — per-test isolation.
 * Wipes volatile realtime state so tests don't bleed into each other.
 */
export async function cleanupVolatileState() {
  const paths = [
    // dreams collection (brain spec)
    "dreams",
    // watch room (watch spec)
    "rooms/watch_room",
    // love wheel room (brain spec)
    "rooms/love_wheel",
    // date night roulette (brain spec)
    "rooms/date_night_roulette",
    // shared song
    "settings/shared_song",
    // music playlist
    "shared_queue",
    // daily vibes
    "daily_vibes",
    // activity logs (R1)
    "activity_logs",
    // mood history (R1)
    "mood_history",
    // sticky notes
    "sticky_notes",
    // game stats (B2)
    "rooms/game_stats",
  ];

  await Promise.all(
    paths.map(async (p) => {
      try {
        await adminDb.recursiveDelete(adminDb.collection(p));
      } catch {
        // Ignore paths that may not exist (collection is empty).
      }
    })
  );

  // RTDB cleanup — wipe piano events + sketch cursors (B2).
  try { await adminRtdb.ref("rooms/couple_piano_session/events").remove(); } catch {}
  try { await adminRtdb.ref("rooms/sketch_room/cursors").remove(); } catch {}
  // Recreate the seed piano room node so the rule isn't flagged.
  try { await adminRtdb.ref("rooms/couple_piano_session/events").set(null); } catch {}
}

/**
 * Hard reset of the emulator — wipes everything.
 * Use sparingly: only on full-suite failure recovery.
 */
export async function resetAll() {
  await adminDb.recursiveDelete(adminDb.collection("settings"));
  await adminDb.recursiveDelete(adminDb.collection("profiles"));
  await adminDb.recursiveDelete(adminDb.collection("dreams"));
  await adminDb.recursiveDelete(adminDb.collection("activity_logs"));
  await adminDb.recursiveDelete(adminDb.collection("mood_history"));
  await adminDb.recursiveDelete(adminDb.collection("missions"));
}
