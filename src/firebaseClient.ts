/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";

// Load configuration from Vite environment variables (.env).
// All 6 keys are REQUIRED — fail fast at module load with a clear error
// pointing to .env.example if any are missing. This eliminates the
// previous hardcoded fallback values that were accidentally leaked in
// git history. To rotate a leaked key, see Google Cloud Console for the
// `couple-ger-nic` project and create new credentials; never bake the
// replacement into source control.
const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
  "VITE_FIREBASE_DATABASE_URL",
] as const;

for (const key of requiredEnvVars) {
  const value = import.meta.env[key];
  if (!value || value === "") {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
        `Copy .env.example to .env and fill in the value.`
    );
  }
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// 🧪 Emulator detection — for Playwright E2E tests
// Set VITE_USE_FIREBASE_EMULATOR=true in dev:test mode; nothing in prod.
const USE_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

if (USE_EMULATOR) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

// ─── Lazy Firestore initialization ──────────────────────────────────────
// Firestore SDK (~1MB) is only loaded after user logs in.
// Dynamic import() makes Vite split it into a separate chunk.
let _db: any = null;
let _dbPromise: Promise<any> | null = null;

export async function getDb() {
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const firestore = await import("firebase/firestore");
      try {
        _db = firestore.initializeFirestore(app, {
          localCache: firestore.persistentLocalCache({
            tabManager: firestore.persistentMultipleTabManager(),
          })
        });
      } catch (err) {
        console.warn("Firestore persistent cache failed to initialize, falling back to default:", err);
        _db = firestore.getFirestore(app);
      }
      if (USE_EMULATOR) {
        try {
          firestore.connectFirestoreEmulator(_db, "127.0.0.1", 8080);
        } catch (e) {
          // already connected — ignore
        }
      }
      return _db;
    })();
  }
  return _dbPromise;
}

// ─── Lazy Realtime Database initialization ─────────────────────────────
let _rtdb: any = null;

export async function getRTDB() {
  if (!_rtdb) {
    const { getDatabase, connectDatabaseEmulator } = await import("firebase/database");
    _rtdb = getDatabase(app);
    if (USE_EMULATOR) {
      try { connectDatabaseEmulator(_rtdb, "127.0.0.1", 9000); } catch {}
    }
  }
  return _rtdb;
}

// Standardize Google login prompt
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// 🧪 DEV-only window bridge — exposes firebase primitives to Playwright.
// NEVER set in production (guarded by import.meta.env.DEV which is false during build).
if (import.meta.env.DEV && typeof window !== "undefined") {
  // Minimal surface area; expandable as tests need more hooks.
  (window as any).__fcb = { app, auth, googleProvider, USE_EMULATOR };
}

// Always true once module loads (above loop would have thrown if apiKey was
// missing). Kept as an exported boolean for existing consumers in
// EmotionalAdminPanel / VirtualPiano so they don't need to change.
export const isFirebaseConfigured = !!firebaseConfig.apiKey;

/**
 * Image storage workaround for Firebase Free (Spark) Plan.
 * Returns the base64 image data directly. Firestore stores this as a string in the document,
 * completely avoiding the need for a Firebase Storage bucket (which requires Blaze billing).
 */
export const uploadBase64Image = async (base64Data: string, filename: string): Promise<string> => {
  try {
    if (!base64Data || !base64Data.startsWith("data:image")) {
      return base64Data;
    }

    // Base64 Upload Bypass - Storing image directly in Firestore document
    return base64Data;
  } catch (err) {
    console.error("Base64 processing error:", err);
    return base64Data;
  }
};

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

/**
 * Uploads a file Blob directly to Cloudinary using unsigned upload presets.
 */
export const uploadToCloudinary = async (
  fileBlob: Blob,
  filename: string,
  cloudName: string,
  uploadPreset: string
): Promise<string> => {
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing. Please verify your Cloud Name and Upload Preset settings.");
  }
  const formData = new FormData();
  formData.append("file", fileBlob, filename);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "couple-space/photobooth/strip");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Cloudinary upload raw error:", errorBody);
    throw new Error(`Cloudinary upload failed: ${res.statusText}`);
  }

  const responseJson = await res.json();
  let url = responseJson.secure_url || "";
  if (url.includes("/upload/")) {
    url = url.replace("/upload/", "/upload/f_auto,q_auto,w_1200,c_limit/");
  }
  return url;
};
