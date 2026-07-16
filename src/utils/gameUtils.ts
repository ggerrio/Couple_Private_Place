/**
 * gameUtils.ts — Shared utilities for PlayView games
 */

import { getDb } from "../firebaseClient";

/**
 * Safe fallback-aware Firestore updateDoc wrapper that also works with localStorage
 */
export const safeUpdateDoc = async (docRef: any, data: any) => {
  const db = await getDb();
  if ((db as any).isFallback) {
    const path = docRef.path;
    const existingStr = localStorage.getItem(`fs_fallback_${path}`);
    const existing = existingStr ? JSON.parse(existingStr) : {};

    const finalData = { ...existing };
    for (const key in data) {
      if (data[key] && typeof data[key] === "object" && data[key]._arrayUnion) {
        const arr = Array.isArray(finalData[key]) ? finalData[key] : [];
        finalData[key] = [...arr, ...data[key].values];
      } else {
        finalData[key] = data[key];
      }
    }

    localStorage.setItem(`fs_fallback_${path}`, JSON.stringify(finalData));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: `fs_fallback_${path}`,
        newValue: JSON.stringify(finalData),
      })
    );
    return;
  }

  const { updateDoc, arrayUnion } = await import("firebase/firestore");
  const realData = { ...data };
  for (const key in realData) {
    if (realData[key] && typeof realData[key] === "object" && realData[key]._arrayUnion) {
      realData[key] = arrayUnion(...realData[key].values);
    }
  }
  return await updateDoc(docRef, realData);
};

/**
 * Helper to build arrayUnion payload for safeUpdateDoc
 */
export const customArrayUnion = (...values: any[]) => {
  return { _arrayUnion: true, values };
};

/**
 * Upload a blob to Cloudinary and return the secure URL.
 * Falls back to local object URL if Cloudinary is not configured.
 */
export async function uploadToCloudinary(
  blob: Blob,
  filename: string,
  cloudName: string,
  uploadPreset: string
): Promise<string> {
  if (!cloudName || !uploadPreset) {
    console.warn("Cloudinary not configured, generating safe local object URL");
    return URL.createObjectURL(blob);
  }
  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("upload_preset", uploadPreset);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }
  const data = await response.json();
  return data.secure_url;
}
