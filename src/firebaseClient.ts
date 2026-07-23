/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { isDemoMode } from "./utils/demoMode";

// ─── Demo mode guard ──────────────────────────────────────────────────
// When VITE_DEMO_MODE=true (or ?demo=1 or localStorage.demo_mode),
// skip ALL Firebase initialization entirely. The app runs on dummy data
// from defaults.ts + localStorage — no external services needed.
// This enables zero-dependency demo deployment (GitHub Pages, etc.).
const DEMO = isDemoMode();

// ─── Firebase init (skipped in demo mode) ─────────────────────────────
// All Firebase exports are stubbed-out strings/null so consumers written
// with optional chaining (?.) or truthy guards degrade safely.
let _app: any = null;
let _auth: any = null;
let _googleProvider: any = null;
let _firebaseConfigured = false;

if (!DEMO) {
  // Load configuration from Vite environment variables (.env).
  // All 6 keys are REQUIRED — fail fast at module load with a clear error
  // pointing to .env.example if any are missing.
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
  const USE_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

  _app = initializeApp(firebaseConfig);
  _auth = getAuth(_app);
  _googleProvider = new GoogleAuthProvider();
  _googleProvider.setCustomParameters({ prompt: "select_account" });
  _firebaseConfigured = !!firebaseConfig.apiKey;

  if (USE_EMULATOR) {
    connectAuthEmulator(_auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }

  // 🧪 DEV-only window bridge — exposes firebase primitives to Playwright.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    (window as any).__fcb = { app: _app, auth: _auth, googleProvider: _googleProvider, USE_EMULATOR };
  }
}

export const app = _app;
export const auth = _auth;
export const googleProvider = _googleProvider;
export const isFirebaseConfigured = _firebaseConfigured;

// ─── Lazy Firestore initialization ──────────────────────────────────────
// Firestore SDK (~1MB) is only loaded after user logs in.
// In demo mode, getDb() returns null so all Firestore operations skip.
let _db: any = null;
let _dbPromise: Promise<any> | null = null;

export async function getDb() {
  if (DEMO) return null;
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const firestore = await import("firebase/firestore");
      try {
        _db = firestore.initializeFirestore(_app, {
          localCache: firestore.persistentLocalCache({
            tabManager: firestore.persistentMultipleTabManager(),
          })
        });
      } catch (err) {
        console.warn("Firestore persistent cache failed to initialize, falling back to default:", err);
        _db = firestore.getFirestore(_app);
      }
      if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
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
  if (DEMO) return null;
  if (!_rtdb) {
    const { getDatabase, connectDatabaseEmulator } = await import("firebase/database");
    _rtdb = getDatabase(_app);
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
      try { connectDatabaseEmulator(_rtdb, "127.0.0.1", 9000); } catch {}
    }
  }
  return _rtdb;
}

/**
 * Image storage workaround for Firebase Free (Spark) Plan.
 * Returns the base64 image data directly.
 */
export const uploadBase64Image = async (base64Data: string, filename: string): Promise<string> => {
  try {
    if (!base64Data || !base64Data.startsWith("data:image")) {
      return base64Data;
    }
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
  if (!cloudName || !uploadPreset || isDemoMode()) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(fileBlob);
    });
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
