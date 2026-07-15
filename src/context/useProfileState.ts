/**
 * useProfileState.ts — User profile state management
 * Extracted from CoupleContext for modularity.
 */
import { useState, useCallback } from "react";
import { getDb } from "../firebaseClient";
import { lsGet, initialUserA, initialUserB } from "./defaults";
import type { Profile } from "../types";

export function useProfileState() {
  const [userA, setUserA] = useState<Profile>(() => lsGet("couple_user_a", initialUserA));
  const [userB, setUserB] = useState<Profile>(() => lsGet("couple_user_b", initialUserB));

  const updateProfile = useCallback(async (userId: "user_a" | "user_b", updates: Partial<Profile>) => {
    const setter = userId === "user_a" ? setUserA : setUserB;
    setter((prev) => ({ ...prev, ...updates }));

    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
    if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
    if (updates.weatherCity !== undefined) dbUpdates.weather_city = updates.weatherCity;
    if (updates.moodNote !== undefined) dbUpdates.mood_note = updates.moodNote;
    if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji;
    if (updates.timezoneOffset !== undefined) dbUpdates.timezone_offset = updates.timezoneOffset;
    if (updates.timezoneName !== undefined) dbUpdates.timezone_name = updates.timezoneName;

    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "profiles", userId), dbUpdates);
    } catch (e) { console.error("[updateProfile]", e); }
  }, []);

  return { userA, setUserA, userB, setUserB, updateProfile };
}
