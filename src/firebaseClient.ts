/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Load configuration from Vite environment variables (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCs-Zd-8jtDdQ20Gi4r974t3OU-BV1tHHI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "couple-ger-nic.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "couple-ger-nic",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "989892812457",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:989892812457:web:a80478219206a5818753b8",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://couple-ger-nic-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
      return _db;
    })();
  }
  return _dbPromise;
}

// ─── Lazy Realtime Database initialization ─────────────────────────────
let _rtdb: any = null;

export async function getRTDB() {
  if (!_rtdb) {
    const { getDatabase } = await import("firebase/database");
    _rtdb = getDatabase(app);
  }
  return _rtdb;
}

// Standardize Google login prompt
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "placeholder-api-key";

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
