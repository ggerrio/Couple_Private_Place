/**
 * defaults.ts — Shared default values for CoupleContext sub-hooks
 */
import type { Profile, Memory, Journal, Letter, TimeCapsule, Song, ActivityLog, MoodHistoryEntry, CustomGreetings, GratitudeEntry } from "../types";

export const DEFAULT_AVATAR_A =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80";
export const DEFAULT_AVATAR_B =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80";

export const DEFAULT_GREETINGS: CustomGreetings = {
  morning: "Good morning, sunshine! ☀️ Ready for another beautiful day together?",
  afternoon: "Hey there, love! 🌤️ Hope your day is as lovely as you are.",
  evening: "Hihi, darling! 🌅 The stars are coming out, just like our love.",
  night: "Sweet dreams, starlight! 🌙 I'll be right here in your heart.",
};

export const initialUserA: Profile = { id: "user_a", name: "Gerrio", avatar: DEFAULT_AVATAR_A, mood: "happy", status: "Active", gender: "pria", emoji: "💖" };
export const initialUserB: Profile = { id: "user_b", name: "Death G", avatar: DEFAULT_AVATAR_B, mood: "cozy", status: "Away", weatherCity: "Menteng", gender: "wanita", emoji: "✨" };

export const initialMemories: Memory[] = [
  {
    id: "mem-1", type: "milestone", title: "Our Very First Meeting",
    description: "At the warm, cozy cafe in Hongdae. It was raining softly outside, and you walked in with that bright yellow umbrella.",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
    date: "2024-10-15T15:30:00.000Z", creatorId: "user_a",
    reactions: { "💖": 5, "✨": 3, "☕": 4 },
    comments: [{ id: "com-1", authorId: "user_b", text: "I was so nervous! Best day of my life.", date: "2024-10-15T22:10:00.000Z" }],
  },
  {
    id: "mem-2", type: "milestone", title: "Weekend Escape to Jeju",
    description: "Renting that retro turquoise scooter and driving around the coast.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    date: "2025-04-20T10:00:00.000Z", creatorId: "user_b",
    reactions: { "🌴": 4, "🛵": 3, "🥰": 6 },
    comments: [{ id: "com-2", authorId: "user_a", text: "Let's go back this fall!", date: "2025-04-21T08:15:00.000Z" }],
  },
];

export const initialJournals: Journal[] = [
  { id: "jr-1", title: "Baked Madeleines Together 🍋", description: "We tried baking lemon madeleines from scratch.", date: "2026-06-25", location: "Our kitchen", weather: "sunny", mood: "cozy", tags: ["baking", "home-date"] },
  { id: "jr-2", title: "Ghibli Movie Marathon 🍿", description: "Curled up under the fuzzy green blanket.", date: "2026-06-28", location: "Cozy Living Room", weather: "rainy", mood: "sleepy", tags: ["ghibli", "movie"] },
];

export const initialLetters: Letter[] = [
  { id: "let-1", senderId: "user_b", recipientId: "user_a", title: "To my favorite person on a rainy morning", content: "Hi star,\n\nI woke up listening to the soft rain hitting the window and immediately thought of you.\n\nWith love.", isOpened: true, reactions: ["💖", "✨"], createdAt: "2026-06-29T08:00:00.000Z" },
  { id: "let-2", senderId: "user_a", recipientId: "user_b", title: "A letter for 1000 days together...", content: "My dear love,\n\nI can't believe we are approaching such an amazing milestone.\n\nForever yours.", scheduledFor: "2026-07-05T00:00:00.000Z", isOpened: false, reactions: [], createdAt: "2026-06-30T01:30:00.000Z" },
];

export const initialTimeCapsules: TimeCapsule[] = [
  { id: "capsule-1", senderId: "user_a", openDate: "2027-01-01T00:00:00.000Z", message: "Our dreams for 2027! I hope we are still as happy.", isOpened: false, createdAt: "2026-06-25T12:00:00.000Z" },
];



export const initialSong: Song = {
  title: "Somethin' Stupid", artist: "Robbie Williams, Nicole Kidman",
  album: "Romantic Vibe", artwork: "https://i.scdn.co/image/ab67616d00004851a1fec51b4d321f10723fa14a",
  durationMs: 200000, progressMs: 0, isPlaying: false,
};

export const initialMoodHistory: MoodHistoryEntry[] = [
  { id: "mood-7", userId: "user_b", userName: "Death G", mood: "happy", note: undefined, timestamp: "2026-07-02T20:10:00.000Z" },
  { id: "mood-6", userId: "user_b", userName: "Death G", mood: "stressed", note: "Kerjaan numpuk hari ini 😤", timestamp: "2026-07-02T09:05:00.000Z" },
  { id: "mood-5", userId: "user_a", userName: "Gerrio", mood: "loved", note: "Kangen banget sama kamu", timestamp: "2026-07-01T22:40:00.000Z" },
  { id: "mood-4", userId: "user_b", userName: "Death G", mood: "bored", note: undefined, timestamp: "2026-07-01T14:20:00.000Z" },
  { id: "mood-3", userId: "user_b", userName: "Death G", mood: "loved", note: undefined, timestamp: "2026-06-30T21:00:00.000Z" },
  { id: "mood-2", userId: "user_b", userName: "Death G", mood: "excited", note: undefined, timestamp: "2026-06-29T18:30:00.000Z" },
  { id: "mood-1", userId: "user_b", userName: "Death G", mood: "sleepy", note: undefined, timestamp: "2026-06-28T23:50:00.000Z" },
  { id: "mood-0", userId: "user_b", userName: "Death G", mood: "cozy", note: undefined, timestamp: "2026-06-27T20:15:00.000Z" },
];

export const initialLogs: ActivityLog[] = [
  { id: "log-1", userId: "user_b", text: "updated their status to 'Sipping hand-drip coffee ☕'", timestamp: "2026-07-02T21:40:00.000Z" },
  { id: "log-2", userId: "user_a", text: "watered the Virtual Garden 🌿", timestamp: "2026-07-02T22:15:00.000Z" },
  { id: "log-3", userId: "user_b", text: "paused the shared player ⏸️", timestamp: "2026-07-02T19:05:00.000Z" },
  { id: "log-4", userId: "user_b", text: "resumed listening together 🎵", timestamp: "2026-07-02T19:12:00.000Z" },
  { id: "log-6", userId: "user_a", text: "changed their garden centerpiece to a gorgeous sakura 🪴", timestamp: "2026-07-01T17:32:00.000Z" },
  { id: "log-7", userId: "user_a", text: "earned 15 XP for: checking in mood sync", timestamp: "2026-07-01T22:41:00.000Z" },
  { id: "log-8", userId: "user_a", text: "synchronized player: listening to \"Another Life\" 🎵", timestamp: "2026-06-30T20:05:00.000Z" },
  { id: "log-9", userId: "user_a", text: "synchronized player: listening to \"Saturday Night\" 🎵", timestamp: "2026-06-30T20:45:00.000Z" },
];

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function dedup<T extends { id: string | number }>(arr: T[]): T[] {
  const seen = new Set<string | number>();
  return arr.filter((item) => {
    if (item.id === undefined || item.id === null || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
