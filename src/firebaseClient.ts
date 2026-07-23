/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";

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

const USE_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
export const isFirebaseConfigured = !!firebaseConfig.apiKey;

if (USE_EMULATOR) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

// DEV-only window bridge — exposes firebase primitives to Playwright.
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as any).__fcb = { app, auth, googleProvider, USE_EMULATOR };
}

// ─── Lazy Firestore initialization ──────────────────────────────────────
// Firestore SDK (~1MB) is only loaded after user logs in.
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
        } catch {
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

/**
 * Image storage workaround for Firebase Free (Spark) Plan.
 * Returns the base64 image data directly.
 */
export const uploadBase64Image = async (base64Data: string, _filename: string): Promise<string> => {
  if (!base64Data || !base64Data.startsWith("data:image")) return base64Data;
  return base64Data;
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
