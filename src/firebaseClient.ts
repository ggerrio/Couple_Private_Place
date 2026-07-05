/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Load configuration from Vite environment variables (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder-auth-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder-project-id",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder-messaging-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "placeholder-app-id",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
};

const app = initializeApp(firebaseConfig);

// DEBUG: cetak databaseURL yang benar-benar dipakai supaya bisa dicocokkan
// dengan URL yang tertera di Firebase Console > Realtime Database
console.log("[firebaseClient] RTDB databaseURL in use:", firebaseConfig.databaseURL);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  })
});
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export const isFirebaseConfigured =
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_API_KEY !== "placeholder-api-key";

// Standardize Google login prompt
googleProvider.setCustomParameters({
  prompt: "select_account",
});

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

    console.log(`[Base64 Upload Bypass] Storing image ${filename} directly in Firestore document.`);
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
