/**
 * firebase-admin-client.ts — Admin SDK singleton for E2E test setup/teardown.
 *
 * Always points at the local emulator (no real credentials needed).
 * /e2e/auth-helpers.ts uses this to mint custom tokens.
 * /e2e/setup-firestore-data.ts uses this to seed profiles + admin_config.
 */
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database";

const EMULATOR_PROJECT_ID = "demo-couple-test";

// Admin SDK must reach the emulator — point it at 127.0.0.1:8080 (Firestore).
// (Auth + RTDB use their own ports; we set those explicitly when calling.)
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";

const app = getApps().length === 0
  ? initializeApp({
      projectId: EMULATOR_PROJECT_ID,
      databaseURL: `https://${EMULATOR_PROJECT_ID}.firebaseio.com`,
    })
  : getApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminRtdb = getDatabase(app);

export const TEST_PROJECT_ID = EMULATOR_PROJECT_ID;

// Standard test identities — NEVER collide with real prod accounts.
export const TEST_USERS = {
  admin: {
    uid: "test-admin-uid",
    email: "admin@test.local",
    password: "testpassword123",
  },
  partner: {
    uid: "test-partner-uid",
    email: "partner@test.local",
    password: "testpassword123",
  },
} as const satisfies Record<string, TestUser>;

/** Single test-user shape — exported for typing helper args across e2e files. */
export type TestUser = {
  uid: string;
  email: string;
  password: string;
};

export const ADMIN_EMAIL = TEST_USERS.admin.email;
