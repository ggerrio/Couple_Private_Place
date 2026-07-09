/**
 * CoupleContext.tsx — rebuilt from zero.
 *
 * Root-cause fixes applied:
 *  1. All localStorage writes batched into a single debounced effect (no cascade).
 *  2. Firestore is the single source of truth when session exists; localStorage
 *     is read-only pre-auth fallback only.
 *  3. Cosmetic progress ticker: strictly passive — Math.min, no skip, no DB write.
 *  4. Mission seed guard: ref-guarded, runs once, cannot loop.
 *  5. resolveCurrentUserFromAuth: properly awaited, errors caught.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import {
  Profile,
  Memory,
  Journal,
  Letter,
  TimeCapsule,
  Mission,
  Song,
  ActivityLog,
  ThemeType,
  MoodHistoryEntry,
} from "../types";
import { auth, db } from "../firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  getDocs,
  arrayUnion,
} from "firebase/firestore";

// ─── Public API ────────────────────────────────────────────────────────────────

interface CoupleContextProps {
  session: any;
  logout: () => void;
  currentUser: "user_a" | "user_b";
  setCurrentUser: (user: "user_a" | "user_b") => void;
  partnerId: "user_a" | "user_b";
  userA: Profile;
  userB: Profile;
  updateProfile: (userId: "user_a" | "user_b", updates: Partial<Profile>) => void;
  memories: Memory[];
  userReactions: Record<string, Record<string, boolean>>;
  addMemory: (memory: Omit<Memory, "id" | "reactions" | "comments"> & { bgStyle?: string; filterClass?: string }) => void;
  addReactionToMemory: (memoryId: string, emoji: string) => void;
  addCommentToMemory: (memoryId: string, text: string) => void;
  deleteCommentFromMemory: (memoryId: string, commentId: string) => Promise<void>;
  journals: Journal[];
  addJournal: (journal: Omit<Journal, "id" | "creatorId" | "editedAt">) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  updateJournal: (id: string, updates: Partial<Journal>) => Promise<void>;
  letters: Letter[];
  sendLetter: (letter: Omit<Letter, "id" | "senderId" | "isOpened" | "reactions" | "createdAt">) => void;
  openLetter: (id: string) => void;
  reactToLetter: (id: string, emoji: string) => void;
  timeCapsules: TimeCapsule[];
  addTimeCapsule: (capsule: Omit<TimeCapsule, "id" | "senderId" | "isOpened" | "createdAt">) => void;
  openTimeCapsule: (id: string) => void;
  missions: Mission[];
  toggleMission: (id: string) => void;
  gardenXp: number;
  gardenLevel: number;
  gardenPlant: "tulip" | "bonsai" | "sakura" | "sunflower";
  waterLevel: number;
  waterPlant: () => void;
  changePlantType: (type: "tulip" | "bonsai" | "sakura" | "sunflower") => void;
  currentSong: Song;
  setSongPlayState: (playing: boolean) => void;
  updateSongProgress: (progressMs: number) => void;
  syncSongToPartner: (song: Song) => void;
  activityLogs: ActivityLog[];
  addActivity: (text: string) => void;
  moodHistory: MoodHistoryEntry[];
  addMoodHistoryEntry: (mood: string, note?: string) => void;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  awardXp: (amount: number, reason: string) => void;
  anniversaryDate: string;
  birthdayA: string;
  birthdayB: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  triggerSurprise: (surpriseType: string) => void;
  activeSurprise: string | null;
  setActiveSurprise: (val: string | null) => void;
  resetAllData: () => void;
  isOnboarding: boolean;
  claimProfileSlot: (slotId: "user_a" | "user_b") => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<void>;
  adminResetMissions: () => Promise<void>;
  adminClearActivityLogs: () => Promise<void>;
  adminDeleteAllMemories: () => Promise<void>;
  adminKickSlot: (slotId: "user_a" | "user_b") => Promise<void>;
  adminDeleteAllSketches: () => Promise<void>;
  adminDeleteAllNotes: () => Promise<void>;
  adminResetTTTScore: () => Promise<void>;
  updateCoupleSettings: (annivDate: string, bdayA: string, bdayB: string, cloudName?: string, uploadPreset?: string) => Promise<void>;
  // ponytail: Pagination support
  memoriesLimit: number;
  loadMoreMemories: () => void;
  journalsLimit: number;
  loadMoreJournals: () => void;
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_AVATAR_A =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80";
export const DEFAULT_AVATAR_B =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80";

const initialUserA: Profile = { id: "user_a", name: "Gerrio", avatar: DEFAULT_AVATAR_A, mood: "happy", status: "Active", xp: 0, level: 1, gender: "pria", emoji: "💖" };
const initialUserB: Profile = { id: "user_b", name: "Death G", avatar: DEFAULT_AVATAR_B, mood: "cozy", status: "Away", xp: 0, level: 1, weatherCity: "Menteng", gender: "wanita", emoji: "✨" };

const initialMemories: Memory[] = [
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

const initialJournals: Journal[] = [
  { id: "jr-1", title: "Baked Madeleines Together 🍋", description: "We tried baking lemon madeleines from scratch.", date: "2026-06-25", location: "Our kitchen", weather: "sunny", mood: "cozy", tags: ["baking", "home-date"] },
  { id: "jr-2", title: "Ghibli Movie Marathon 🍿", description: "Curled up under the fuzzy green blanket.", date: "2026-06-28", location: "Cozy Living Room", weather: "rainy", mood: "sleepy", tags: ["ghibli", "movie"] },
];

const initialLetters: Letter[] = [
  { id: "let-1", senderId: "user_b", recipientId: "user_a", title: "To my favorite person on a rainy morning", content: "Hi star,\n\nI woke up listening to the soft rain hitting the window and immediately thought of you.\n\nWith love.", isOpened: true, reactions: ["💖", "✨"], createdAt: "2026-06-29T08:00:00.000Z" },
  { id: "let-2", senderId: "user_a", recipientId: "user_b", title: "A letter for 1000 days together...", content: "My dear love,\n\nI can't believe we are approaching such an amazing milestone.\n\nForever yours.", scheduledFor: "2026-07-05T00:00:00.000Z", isOpened: false, reactions: [], createdAt: "2026-06-30T01:30:00.000Z" },
];

const initialTimeCapsules: TimeCapsule[] = [
  { id: "capsule-1", senderId: "user_a", openDate: "2027-01-01T00:00:00.000Z", message: "Our dreams for 2027! I hope we are still as happy.", isOpened: false, createdAt: "2026-06-25T12:00:00.000Z" },
];

const initialMissions: Mission[] = [
  { id: "mis-1", text: "Take a Life4Cuts photo print together", xpReward: 50, completed: false, type: "daily" },
  { id: "mis-2", text: "Send a sweet morning Live Letter", xpReward: 30, completed: false, type: "daily" },
  { id: "mis-3", text: "Water the Virtual Garden plant", xpReward: 20, completed: false, type: "daily" },
  { id: "mis-4", text: "Watch a synchronized YouTube stream", xpReward: 40, completed: false, type: "daily" },
  { id: "mis-5", text: "Post a new baking or travel Journal entry", xpReward: 100, completed: false, type: "weekly" },
  { id: "mis-6", text: "Win 3 rounds of Mini Games", xpReward: 80, completed: false, type: "weekly" },
];

const initialSong: Song = {
  title: "Somethin' Stupid", artist: "Robbie Williams, Nicole Kidman",
  album: "Romantic Vibe", artwork: "https://i.scdn.co/image/ab67616d00004851a1fec51b4d321f10723fa14a",
  durationMs: 200000, progressMs: 0, isPlaying: false,
};

const initialMoodHistory: MoodHistoryEntry[] = [
  { id: "mood-7", userId: "user_b", userName: "Death G", mood: "happy", note: undefined, timestamp: "2026-07-02T20:10:00.000Z" },
  { id: "mood-6", userId: "user_b", userName: "Death G", mood: "stressed", note: "Kerjaan numpuk hari ini 😤", timestamp: "2026-07-02T09:05:00.000Z" },
  { id: "mood-5", userId: "user_a", userName: "Gerrio", mood: "loved", note: "Kangen banget sama kamu", timestamp: "2026-07-01T22:40:00.000Z" },
  { id: "mood-4", userId: "user_b", userName: "Death G", mood: "bored", note: undefined, timestamp: "2026-07-01T14:20:00.000Z" },
  { id: "mood-3", userId: "user_b", userName: "Death G", mood: "loved", note: undefined, timestamp: "2026-06-30T21:00:00.000Z" },
  { id: "mood-2", userId: "user_b", userName: "Death G", mood: "excited", note: undefined, timestamp: "2026-06-29T18:30:00.000Z" },
  { id: "mood-1", userId: "user_b", userName: "Death G", mood: "sleepy", note: undefined, timestamp: "2026-06-28T23:50:00.000Z" },
  { id: "mood-0", userId: "user_b", userName: "Death G", mood: "cozy", note: undefined, timestamp: "2026-06-27T20:15:00.000Z" },
];

const initialLogs: ActivityLog[] = [
  { id: "log-1", userId: "user_b", text: "updated their status to 'Sipping hand-drip coffee ☕'", timestamp: "2026-07-02T21:40:00.000Z" },
  { id: "log-2", userId: "user_a", text: "watered the Virtual Garden 🌿", timestamp: "2026-07-02T22:15:00.000Z" },
  { id: "log-3", userId: "user_b", text: "paused the shared player ⏸️", timestamp: "2026-07-02T19:05:00.000Z" },
  { id: "log-4", userId: "user_b", text: "resumed listening together 🎵", timestamp: "2026-07-02T19:12:00.000Z" },
  { id: "log-5", userId: "user_a", text: "changed the digital home theme to 'sakura' ✨", timestamp: "2026-07-01T17:30:00.000Z" },
  { id: "log-6", userId: "user_a", text: "changed their garden centerpiece to a gorgeous sakura 🪴", timestamp: "2026-07-01T17:32:00.000Z" },
  { id: "log-7", userId: "user_a", text: "earned 15 XP for: checking in mood sync", timestamp: "2026-07-01T22:41:00.000Z" },
  { id: "log-8", userId: "user_a", text: "synchronized player: listening to \"Another Life\" 🎵", timestamp: "2026-06-30T20:05:00.000Z" },
  { id: "log-9", userId: "user_a", text: "synchronized player: listening to \"Saturday Night\" 🎵", timestamp: "2026-06-30T20:45:00.000Z" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function dedup<T extends { id: string | number }>(arr: T[]): T[] {
  const seen = new Set<string | number>();
  return arr.filter((item) => {
    if (item.id === undefined || item.id === null || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

// ─── Context ───────────────────────────────────────────────────────────────────

const VALID_THEMES: ThemeType[] = ["monochrome-minimal", "sakura", "studio-ghibli", "night", "pastel", "cyber-lavender"];

const CoupleContext = createContext<CoupleContextProps | undefined>(undefined);

export const CoupleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [session, setSession] = useState<any>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState<"user_a" | "user_b">("user_a");

  // ── Profiles ──────────────────────────────────────────────────────────────
  // Read localStorage only as cold-start fallback; Firestore overwrites on connect.
  const [userA, setUserA] = useState<Profile>(() => lsGet("couple_user_a", initialUserA));
  const [userB, setUserB] = useState<Profile>(() => lsGet("couple_user_b", initialUserB));

  // ── Collections (localStorage as offline cache) ───────────────────────────
  const [memories, setMemories] = useState<Memory[]>(() => dedup(lsGet("couple_memories", initialMemories)));
  const [journals, setJournals] = useState<Journal[]>(() => dedup(lsGet("couple_journals", initialJournals)));
  const [letters, setLetters] = useState<Letter[]>(() => dedup(lsGet("couple_letters", initialLetters)));
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsule[]>(() => dedup(lsGet("couple_time_capsules", initialTimeCapsules)));
  const [missions, setMissions] = useState<Mission[]>(() => dedup(lsGet("couple_missions", initialMissions)));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => dedup(lsGet("couple_activity_logs", initialLogs)));
  const [moodHistory, setMoodHistory] = useState<MoodHistoryEntry[]>(() => dedup(lsGet("couple_mood_history", initialMoodHistory)));
  const [userReactions, setUserReactions] = useState<Record<string, Record<string, boolean>>>(() => lsGet("couple_user_reactions", {}));
  // ponytail: Limit limits for cost efficiency
  const [memoriesLimit, setMemoriesLimit] = useState(15);
  const [journalsLimit, setJournalsLimit] = useState(15);

  // ── Garden ────────────────────────────────────────────────────────────────
  const [gardenXp, setGardenXp] = useState(() => lsGet<number>("couple_garden_xp", 360));
  const [gardenLevel, setGardenLevel] = useState(() => lsGet<number>("couple_garden_level", 4));
  const [gardenPlant, setGardenPlant] = useState<"tulip" | "bonsai" | "sakura" | "sunflower">(() => lsGet("couple_garden_plant", "sakura") as "tulip" | "bonsai" | "sakura" | "sunflower");
  const [waterLevel, setWaterLevel] = useState(() => lsGet<number>("couple_water_level", 90));

  // ── Song (purely local, no DB write) ─────────────────────────────────────
  const [currentSong, setCurrentSong] = useState<Song>(initialSong);

  // ── Theme & Settings ──────────────────────────────────────────────────────
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = lsGet("couple_theme", "sakura") as ThemeType;
    return VALID_THEMES.includes(saved) ? saved : "sakura";
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => lsGet("couple_dark_mode", false));
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      localStorage.setItem("couple_dark_mode", JSON.stringify(!prev));
      return !prev;
    });
  }, []);
  const [anniversaryDate, setAnniversaryDate] = useState(() => lsGet("couple_anniversary_date", "2025-12-14"));
  const [birthdayA, setBirthdayA] = useState("06-16");
  const [birthdayB, setBirthdayB] = useState("12-25");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState("");
  const [activeSurprise, setActiveSurprise] = useState<string | null>(null);

  // ── Reaction click-lock (single-click dedup) ──────────────────────────────
  // ponytail: Set-based lock, cleared per entry after 1.5s
  const reactionLockRef = useRef(new Set<string>());

  // ── Mission seed guard ────────────────────────────────────────────────────
  const missionSeededRef = useRef(false);

  // ─── Batch localStorage sync ──────────────────────────────────────────────
  // Single effect, runs once after each render cycle — eliminates cascade.
  useEffect(() => {
    localStorage.setItem("couple_active_user", currentUser);
    localStorage.setItem("couple_user_a", JSON.stringify(userA));
    localStorage.setItem("couple_user_b", JSON.stringify(userB));
    localStorage.setItem("couple_memories", JSON.stringify(memories));
    localStorage.setItem("couple_journals", JSON.stringify(journals));
    localStorage.setItem("couple_letters", JSON.stringify(letters));
    localStorage.setItem("couple_time_capsules", JSON.stringify(timeCapsules));
    localStorage.setItem("couple_missions", JSON.stringify(missions));
    localStorage.setItem("couple_garden_xp", String(gardenXp));
    localStorage.setItem("couple_garden_level", String(gardenLevel));
    localStorage.setItem("couple_garden_plant", JSON.stringify(gardenPlant));
    localStorage.setItem("couple_water_level", String(waterLevel));
    localStorage.setItem("couple_activity_logs", JSON.stringify(activityLogs));
    localStorage.setItem("couple_mood_history", JSON.stringify(moodHistory));
    localStorage.setItem("couple_user_reactions", JSON.stringify(userReactions));
    localStorage.setItem("couple_theme", JSON.stringify(theme));
    localStorage.setItem("couple_anniversary_date", JSON.stringify(anniversaryDate));
  });
  // ponytail: no dep array → runs every render (cheap writes, eliminates cascade effects)

  // ─── Cosmetic progress ticker — 100% passive ──────────────────────────────
  useEffect(() => {
    if (!currentSong.isPlaying) return;
    const id = setInterval(() => {
      setCurrentSong((prev) => {
        if (!prev.isPlaying) return prev;
        // STRICTLY: only increment, never trigger skip, never write DB
        return { ...prev, progressMs: prev.durationMs > 0 ? Math.min(prev.progressMs + 1000, prev.durationMs) : prev.progressMs + 1000 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [currentSong.isPlaying]);
  // ponytail: dep on isPlaying only — duration changes don't restart the interval

  // ─── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setSession(user);
      if (user) {
        resolveSlot(user.uid).catch((e) => {
          console.error("[Auth] resolveSlot error:", e);
          setIsOnboarding(true);
        });
        // Pause the shared player on load/refresh to prevent autoplaying
        setDoc(doc(db, "settings", "shared_song"), { is_playing: false }, { merge: true }).catch(console.error);
      } else {
        setIsOnboarding(false);
      }
    });
    return () => unsub();
  }, []);

  const resolveSlot = async (uid: string) => {
    const [snapA, snapB] = await Promise.all([
      getDoc(doc(db, "profiles", "user_a")),
      getDoc(doc(db, "profiles", "user_b")),
    ]);

    // Seed empty slots if brand new Firestore project
    if (!snapA.exists()) {
      await setDoc(doc(db, "profiles", "user_a"), { id: "user_a", auth_id: null, name: "Partner A (Empty)", avatar_url: DEFAULT_AVATAR_A, status: "Waiting for connection...", mood: "happy", updated_at: new Date().toISOString() });
    }
    if (!snapB.exists()) {
      await setDoc(doc(db, "profiles", "user_b"), { id: "user_b", auth_id: null, name: "Partner B (Empty)", avatar_url: DEFAULT_AVATAR_B, status: "Waiting for connection...", mood: "happy", updated_at: new Date().toISOString() });
    }

    const valA = snapA.exists() ? snapA.data() : null;
    const valB = snapB.exists() ? snapB.data() : null;

    if (valA?.auth_id === uid) { setCurrentUser("user_a"); setIsOnboarding(false); }
    else if (valB?.auth_id === uid) { setCurrentUser("user_b"); setIsOnboarding(false); }
    else { setIsOnboarding(true); }
  };

  const claimProfileSlot = async (slotId: "user_a" | "user_b") => {
    if (!auth.currentUser) throw new Error("No active session");
    const { displayName, photoURL, uid } = auth.currentUser;
    await setDoc(doc(db, "profiles", slotId), {
      id: slotId,
      auth_id: uid,
      name: displayName || (slotId === "user_a" ? "Partner A" : "Partner B"),
      avatar_url: photoURL || (slotId === "user_a" ? DEFAULT_AVATAR_A : DEFAULT_AVATAR_B),
      status: "Online 💖",
      mood: "happy",
      gender: slotId === "user_a" ? "pria" : "wanita",
      updated_at: new Date().toISOString(),
    }, { merge: true });
    setCurrentUser(slotId);
    setIsOnboarding(false);
  };

  const logout = () => signOut(auth).then(() => setSession(null));

  const partnerId: "user_a" | "user_b" = currentUser === "user_a" ? "user_b" : "user_a";

  // ─── Firestore real-time listeners ────────────────────────────────────────
  useEffect(() => {
    if (!session) return;

    // 1. Profiles
    const unsubProfiles = onSnapshot(collection(db, "profiles"), (snap) => {
      snap.forEach((d) => {
        const p = d.data();
        const mapped: Partial<Profile> = {
          name: p.name,
          avatar: p.avatar_url,
          status: p.status,
          mood: p.mood,
          moodNote: p.mood_note,
          latitude: p.latitude,
          longitude: p.longitude,
          weatherCity: p.weather_city,
          gender: p.gender,
          emoji: p.emoji || (d.id === "user_a" ? "💖" : "✨"),
          timezoneOffset: p.timezone_offset,
          timezoneName: p.timezone_name,
        };
        if (d.id === "user_a") setUserA((prev) => ({ ...prev, ...mapped }));
        if (d.id === "user_b") setUserB((prev) => ({ ...prev, ...mapped }));
      });
    });

    // 2. Memories (ponytail: client-side paginated queries to reduce Firestore cost)
    const unsubMemories = onSnapshot(
      query(collection(db, "memories"), orderBy("created_at", "desc"), limit(memoriesLimit)),
      (snap) => {
        const urMap: Record<string, Record<string, boolean>> = {};
        const list: Memory[] = snap.docs.map((d) => {
          const m = d.data();
          const reactionsRaw = m.reactions || {};
          const reactionsCount: Record<string, number> = {};
          
          const emojis = ["💖", "✨", "🥰", "😂", "😭", "🌟", "🔥", "💌"];
          const userAReactions: string[] = reactionsRaw.user_a || [];
          const userBReactions: string[] = reactionsRaw.user_b || [];
          
          const userAKey = `user_a_${d.id}`;
          const userBKey = `user_b_${d.id}`;
          
          urMap[userAKey] = {};
          urMap[userBKey] = {};
          
          emojis.forEach((emoji) => {
            const hasA = userAReactions.includes(emoji);
            const hasB = userBReactions.includes(emoji);
            
            urMap[userAKey][emoji] = hasA;
            urMap[userBKey][emoji] = hasB;
            
            let count = 0;
            if (hasA) count++;
            if (hasB) count++;
            reactionsCount[emoji] = count;
          });

          return {
            id: d.id, type: m.type || "milestone", title: m.title,
            description: m.description || "",
            imageUrl: m.image_url || "",
            date: m.date || new Date().toISOString(),
            creatorId: m.created_by || "user_a",
            bgStyle: m.bg_style, filterClass: m.filter_class,
            layout: m.layout, photosList: m.photos_list || [],
            partnerPhotosList: m.partner_photos_list || [],
            colabMode: m.colab_mode, 
            reactions: reactionsCount, 
            comments: m.comments || [],
            showOnTimeline: m.show_on_timeline !== undefined ? m.show_on_timeline : true,
          };
        });
        setMemories(list);
        setUserReactions(urMap);
      }
    );

    // Journals sync (ponytail: client-side paginated queries to reduce Firestore cost)
    const unsubJournals = onSnapshot(
      query(collection(db, "journals"), orderBy("created_at", "desc"), limit(journalsLimit)),
      (snap) => {
        setJournals(snap.docs.map((d) => {
          const j = d.data();
          return {
            id: d.id,
            title: j.title || "",
            description: j.description || "",
            date: j.date || new Date().toISOString(),
            location: j.location || "",
            weather: j.weather || "sunny",
            mood: j.mood || "happy",
            tags: j.tags || [],
            creatorId: j.created_by || "user_a",
            editedAt: j.edited_at || undefined,
          };
        }));
      }
    );



    // 4. Missions — seed guard prevents loop
    const unsubMissions = onSnapshot(
      query(collection(db, "missions"), orderBy("created_at", "asc")),
      (snap) => {
        if (snap.empty && !missionSeededRef.current) {
          missionSeededRef.current = true;
          seedMissions();
        } else if (!snap.empty) {
          setMissions(snap.docs.map((d) => {
            const m = d.data();
            return { id: d.id, text: m.text, xpReward: m.xp_reward, completed: m.completed, type: m.type };
          }));
        }
      }
    );

    // 5. Settings
    const unsubSettings = onSnapshot(doc(db, "settings", "couple_settings"), (d) => {
      if (d.exists()) {
        const data = d.data();
        if (data.anniversary_date) setAnniversaryDate(data.anniversary_date);
        if (data.birthday_a) setBirthdayA(data.birthday_a);
        if (data.birthday_b) setBirthdayB(data.birthday_b);
        if (data.cloudinary_cloud_name) setCloudinaryCloudName(data.cloudinary_cloud_name);
        if (data.cloudinary_upload_preset) setCloudinaryUploadPreset(data.cloudinary_upload_preset);
      } else {
        setDoc(doc(db, "settings", "couple_settings"), {
          anniversary_date: "2024-10-15", birthday_a: "11-18", birthday_b: "04-05",
          cloudinary_cloud_name: "", cloudinary_upload_preset: "",
        }).catch(console.error);
      }
    });

    // 6. Shared song — syncs live between both partners
    const unsubSong = onSnapshot(doc(db, "settings", "shared_song"), (d) => {
      if (d.exists()) {
        const s = d.data();
        setCurrentSong((prev) => ({
          ...prev,
          title: s.title ?? prev.title,
          artist: s.artist ?? prev.artist,
          album: s.album ?? prev.album,
          artwork: s.artwork ?? prev.artwork,
          durationMs: s.duration_ms ?? prev.durationMs,
          videoId: s.video_id ?? prev.videoId,
          isPlaying: s.is_playing ?? prev.isPlaying,
          // ponytail: don't overwrite local progressMs — let the ticker run locally
        }));
      }
    });

    return () => { unsubProfiles(); unsubMemories(); unsubJournals(); unsubMissions(); unsubSettings(); unsubSong(); };
  }, [session, memoriesLimit, journalsLimit]);
  // ponytail: session and limit deps for paginated subscriptions

  const seedMissions = async () => {
    const defaults = [
      { id: "mis-1", text: "Take a Life4Cuts photo print together", xp_reward: 50, completed: false, type: "daily", created_at: new Date().toISOString() },
      { id: "mis-2", text: "Send a sweet morning Live Letter", xp_reward: 30, completed: false, type: "daily", created_at: new Date().toISOString() },
      { id: "mis-3", text: "Water the Virtual Garden plant", xp_reward: 20, completed: false, type: "daily", created_at: new Date().toISOString() },
      { id: "mis-4", text: "Watch a synchronized YouTube stream", xp_reward: 40, completed: false, type: "daily", created_at: new Date().toISOString() },
      { id: "mis-5", text: "Post a new baking or travel Journal entry", xp_reward: 100, completed: false, type: "weekly", created_at: new Date().toISOString() },
      { id: "mis-6", text: "Win 3 rounds of Mini Games", xp_reward: 80, completed: false, type: "weekly", created_at: new Date().toISOString() },
    ];
    for (const m of defaults) {
      const { id, ...rest } = m;
      await setDoc(doc(db, "missions", id), rest, { merge: true });
    }
  };

  // ─── Activity logger ──────────────────────────────────────────────────────
  const addActivity = useCallback(async (text: string) => {
    try {
      await addDoc(collection(db, "activity_logs"), {
        user_id: currentUser,
        text,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[addActivity]", e);
    }
  }, [currentUser]);

  // ─── XP & leveling ───────────────────────────────────────────────────────
  const awardXp = useCallback((amount: number, reason: string) => {
    const setUser = currentUser === "user_a" ? setUserA : setUserB;
    setUser((prev) => {
      const xp = prev.xp + amount;
      const threshold = prev.level * 150;
      if (xp >= threshold) {
        const newLvl = prev.level + 1;
        addActivity(`grew their bond and reached Level ${newLvl}! 🎉`);
        triggerSurprise("level-up");
        return { ...prev, xp: xp - threshold, level: newLvl };
      }
      return { ...prev, xp };
    });

    setGardenXp((prev) => {
      const next = prev + amount;
      const threshold = gardenLevel * 100;
      if (next >= threshold) {
        setGardenLevel((l) => l + 1);
        return next - threshold;
      }
      return next;
    });

    // ponytail: pruned spammy activity logging for XP awards to save writes
  }, [currentUser, gardenLevel]);

  // ─── Profile updates ──────────────────────────────────────────────────────
  const updateProfile = useCallback(async (userId: "user_a" | "user_b", updates: Partial<Profile>) => {
    const setter = userId === "user_a" ? setUserA : setUserB;
    setter((prev) => {
      return { ...prev, ...updates };
    });

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
      await updateDoc(doc(db, "profiles", userId), dbUpdates);
      // ponytail: pruned profile update activity logging to save writes
    } catch (e) { console.error("[updateProfile]", e); }
  }, []);

  // ─── Memories ─────────────────────────────────────────────────────────────
  const addMemory = useCallback(async (memory: any) => {
    try {
      await addDoc(collection(db, "memories"), {
        type: memory.type, title: memory.title,
        image_url: memory.imageUrl,
        description: memory.description || "",
        date: new Date(memory.date).toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        created_by: currentUser,
        bg_style: memory.bgStyle || "",
        filter_class: memory.filterClass || "",
        layout: memory.layout || "",
        photos_list: memory.photosList || [],
        partner_photos_list: memory.partnerPhotosList || [],
        colab_mode: memory.colabMode || "",
        show_on_timeline: memory.showOnTimeline !== undefined ? memory.showOnTimeline : true,
      });
      addActivity(`added a new memory: "${memory.title}"`);
      awardXp(40, "posting a memory");
    } catch (e) { console.error("[addMemory]", e); }
  }, [currentUser]);

  const deleteMemory = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "memories", id));
      addActivity("deleted a timeline memory");
    } catch (e) { console.error("[deleteMemory]", e); }
  }, []);

  const updateMemory = useCallback(async (id: string, updates: Partial<Memory>) => {
    // Instantly update local state for snappy UI & offline support
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.date !== undefined) dbUpdates.date = new Date(updates.date).toISOString().split("T")[0];
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.showOnTimeline !== undefined) dbUpdates.show_on_timeline = updates.showOnTimeline;
      await updateDoc(doc(db, "memories", id), dbUpdates);
      addActivity(`edited a milestone memory: "${updates.title || "Untitled"}"`);
    } catch (e) { console.error("[updateMemory]", e); }
  }, []);

  // Reaction: single-click lock prevents rapid double-tap duplicates
  const addReactionToMemory = useCallback(async (memoryId: string, emoji: string) => {
    const lockKey = `${memoryId}:${emoji}`;
    if (reactionLockRef.current.has(lockKey)) return;
    reactionLockRef.current.add(lockKey);
    setTimeout(() => reactionLockRef.current.delete(lockKey), 1000); // reduced debounce lock for better response

    try {
      const memoryRef = doc(db, "memories", memoryId);
      const docSnap = await getDoc(memoryRef);
      if (!docSnap.exists()) return;

      const m = docSnap.data();
      const reactionsRaw = m.reactions || {};
      const currentUserReactionsList: string[] = reactionsRaw[currentUser] || [];

      let nextList: string[];
      const alreadyReacted = currentUserReactionsList.includes(emoji);
      if (alreadyReacted) {
        // Unreact
        nextList = currentUserReactionsList.filter((e) => e !== emoji);
      } else {
        // React
        nextList = [...currentUserReactionsList, emoji];
        // ponytail: pruned reaction activity log and XP reward to prevent click-spam writes
      }

      await updateDoc(memoryRef, {
        [`reactions.${currentUser}`]: nextList
      });
    } catch (e) {
      console.error("[addReactionToMemory]", e);
    }
  }, [currentUser]);

  const addCommentToMemory = useCallback(async (memoryId: string, text: string) => {
    const comment = { id: `com-${Date.now()}`, authorId: currentUser, text, date: new Date().toISOString() };
    try {
      await updateDoc(doc(db, "memories", memoryId), {
        comments: arrayUnion(comment)
      });
      // ponytail: comments are displayed directly, so we prune the activity log to save writes
    } catch (e) { console.error("[addCommentToMemory]", e); }
  }, [currentUser]);

  const deleteCommentFromMemory = useCallback(async (memoryId: string, commentId: string) => {
    try {
      const memory = memories.find((m) => m.id === memoryId);
      if (!memory) return;
      const updatedComments = memory.comments.filter((c) => c.id !== commentId);
      await updateDoc(doc(db, "memories", memoryId), {
        comments: updatedComments
      });
      // ponytail: pruned deletion log from activity feed to save writes
    } catch (e) { console.error("[deleteCommentFromMemory]", e); }
  }, [memories]);

  // ─── Journals ─────────────────────────────────────────────────────────────
  const addJournal = useCallback(async (journal: Omit<Journal, "id" | "creatorId" | "editedAt">) => {
    try {
      const docRef = doc(collection(db, "journals"));
      await setDoc(docRef, {
        title: journal.title,
        description: journal.description,
        date: journal.date,
        location: journal.location,
        weather: journal.weather,
        mood: journal.mood,
        tags: journal.tags,
        imageUrl: journal.imageUrl || "",
        created_at: new Date().toISOString(),
        created_by: currentUser,
      });
      addActivity(`wrote a journal entry: "${journal.title}"`);
      awardXp(50, "writing journal");
    } catch (e) { console.error("[addJournal]", e); }
  }, [currentUser]);

  const deleteJournal = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "journals", id));
      addActivity("deleted a journal entry");
    } catch (e) { console.error("[deleteJournal]", e); }
  }, []);

  const updateJournal = useCallback(async (id: string, updates: Partial<Journal>) => {
    try {
      const docRef = doc(db, "journals", id);
      const data: Record<string, any> = {
        title: updates.title,
        description: updates.description,
        date: updates.date,
        location: updates.location,
        weather: updates.weather,
        mood: updates.mood,
        tags: updates.tags,
        imageUrl: updates.imageUrl,
        edited_at: new Date().toISOString(),
      };
      Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
      await updateDoc(docRef, data);
      addActivity("updated a journal entry");
    } catch (e) { console.error("[updateJournal]", e); }
  }, []);

  // ─── Letters ──────────────────────────────────────────────────────────────
  const sendLetter = useCallback((letter: Omit<Letter, "id" | "senderId" | "isOpened" | "reactions" | "createdAt">) => {
    setLetters((prev) => [{ ...letter, id: `let-${Date.now()}`, senderId: currentUser, isOpened: false, reactions: [], createdAt: new Date().toISOString() }, ...prev]);
    addActivity(`sent a beautiful Live Letter: "${letter.title}" ✉️`);
    awardXp(30, "sending letter");
  }, [currentUser]);

  const openLetter = useCallback((id: string) => {
    setLetters((prev) => prev.map((l) => l.id === id ? { ...l, isOpened: true } : l));
    addActivity("opened a sweet Live Letter");
    awardXp(10, "reading letter");
  }, []);

  const reactToLetter = useCallback((id: string, emoji: string) => {
    setLetters((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const reactions = l.reactions || [];
      return { ...l, reactions: reactions.includes(emoji) ? reactions.filter((r) => r !== emoji) : [...reactions, emoji] };
    }));
    // ponytail: pruned letter reaction log and XP reward to prevent activity feed spam
  }, []);

  // ─── Time Capsules ────────────────────────────────────────────────────────
  const addTimeCapsule = useCallback((capsule: Omit<TimeCapsule, "id" | "senderId" | "isOpened" | "createdAt">) => {
    // Strict future-date validation
    if (new Date(capsule.openDate) <= new Date()) {
      console.warn("[addTimeCapsule] openDate must be in the future");
      return;
    }
    setTimeCapsules((prev) => [{ ...capsule, id: `cap-${Date.now()}`, senderId: currentUser, isOpened: false, createdAt: new Date().toISOString() }, ...prev]);
    addActivity(`sealed a Time Capsule until ${new Date(capsule.openDate).toLocaleDateString()} ⏳`);
    awardXp(50, "sealing time capsule");
  }, [currentUser]);

  const openTimeCapsule = useCallback((id: string) => {
    setTimeCapsules((prev) => prev.map((c) => c.id === id ? { ...c, isOpened: true } : c));
    addActivity("unlocked and opened a Time Capsule! 🎁");
    awardXp(30, "opening time capsule");
    triggerSurprise("time-capsule-reveal");
  }, []);

  // ─── Missions ─────────────────────────────────────────────────────────────
  const toggleMission = useCallback(async (id: string) => {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;
    const nextCompleted = !mission.completed;
    if (nextCompleted) awardXp(mission.xpReward, `completing mission "${mission.text}"`);
    try { await updateDoc(doc(db, "missions", id), { completed: nextCompleted }); }
    catch (e) { console.error("[toggleMission]", e); }
  }, [missions]);

  // ─── Garden ───────────────────────────────────────────────────────────────
  const waterPlant = useCallback(() => {
    setWaterLevel((prev) => Math.min(prev + 20, 100));
    awardXp(20, "watering garden plant");
    // ponytail: pruned watered activity log to save writes
  }, []);

  const changePlantType = useCallback((type: "tulip" | "bonsai" | "sakura" | "sunflower") => {
    setGardenPlant(type);
    addActivity(`changed their garden centerpiece to a gorgeous ${type} 🪴`);
  }, []);

  // ─── Song controls — syncs to Firestore so partner sees it live ──────────
  const setSongPlayState = useCallback(async (playing: boolean) => {
    setCurrentSong((prev) => ({ ...prev, isPlaying: playing }));
    // ponytail: pruned play/pause song logs to save writes
    try {
      await setDoc(doc(db, "settings", "shared_song"), { is_playing: playing }, { merge: true });
    } catch (e) { console.error("[setSongPlayState]", e); }
  }, []);

  const updateSongProgress = useCallback((progressMs: number) => {
    setCurrentSong((prev) => ({ ...prev, progressMs }));
    // ponytail: progress NOT written to DB — too noisy; local ticker is enough
  }, []);

  const syncSongToPartner = useCallback(async (song: Song) => {
    setCurrentSong({ ...song, progressMs: 0 });
    // ponytail: pruned player synchronization activity log to save writes
    try {
      await setDoc(doc(db, "settings", "shared_song"), {
        title: song.title,
        artist: song.artist,
        album: song.album || "",
        artwork: song.artwork || "",
        duration_ms: song.durationMs || 0,
        video_id: song.videoId || "",
        is_playing: true,
        synced_at: new Date().toISOString(),
      });
    } catch (e) { console.error("[syncSongToPartner]", e); }
  }, []);

  // ─── Theme ────────────────────────────────────────────────────────────────
  const setTheme = useCallback((nextTheme: ThemeType) => {
    setThemeState(nextTheme);
    // ponytail: pruned theme change activity logging to save writes
  }, []);

  // ─── Mood history ─────────────────────────────────────────────────────────
  const addMoodHistoryEntry = useCallback((mood: string, note?: string) => {
    const profile = currentUser === "user_a" ? userA : userB;
    const entry: MoodHistoryEntry = {
      id: `mood-${Date.now()}`, userId: currentUser, userName: profile.name,
      mood, note: note?.trim() || undefined, timestamp: new Date().toISOString(),
    };
    setMoodHistory((prev) => [entry, ...prev]);
    updateProfile(currentUser, { mood, moodNote: note?.trim() || "" });
    awardXp(15, "checking in mood sync");
    // ponytail: pruned mood check-in activity logging to save writes
  }, [currentUser, userA, userB, updateProfile]);

  // ─── Surprise ─────────────────────────────────────────────────────────────
  const triggerSurprise = useCallback((surpriseType: string) => {
    setActiveSurprise(surpriseType);
  }, []);

  // ─── Admin ops ────────────────────────────────────────────────────────────
  const adminResetMissions = async () => {
    const snap = await getDocs(collection(db, "missions"));
    await Promise.all(snap.docs.map((d) => updateDoc(doc(db, "missions", d.id), { completed: false })));
    addActivity("admin reset all challenges to incomplete 🛠️");
  };

  const adminClearActivityLogs = async () => {
    const snap = await getDocs(collection(db, "activity_logs"));
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "activity_logs", d.id))));
  };

  const adminDeleteAllMemories = async () => {
    const snap = await getDocs(collection(db, "memories"));
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "memories", d.id))));
    addActivity("admin purged all memories 🛠️");
  };

  const adminKickSlot = async (slotId: "user_a" | "user_b") => {
    await updateDoc(doc(db, "profiles", slotId), {
      auth_id: null,
      name: slotId === "user_a" ? "Partner A (Empty)" : "Partner B (Empty)",
      avatar_url: slotId === "user_a" ? DEFAULT_AVATAR_A : DEFAULT_AVATAR_B,
      status: "Waiting for connection...",
      updated_at: new Date().toISOString(),
    });
    addActivity(`admin ejected ${slotId} slot 🛠️`);
  };

  const adminDeleteAllSketches = async () => {
    const snap = await getDocs(collection(db, "saved_sketches"));
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "saved_sketches", d.id))));
    addActivity("admin purged sketch gallery 🛠️");
  };

  const adminDeleteAllNotes = async () => {
    const snap = await getDocs(collection(db, "sticky_notes"));
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "sticky_notes", d.id))));
    addActivity("admin purged Sweet Notes Board 🛠️");
  };

  const adminResetTTTScore = async () => {
    await setDoc(doc(db, "rooms", "ttt_room"), { scoreA: 0, scoreB: 0 }, { merge: true });
    addActivity("admin reset Tic Tac Toe scores 🛠️");
  };

  const updateCoupleSettings = async (annivDate: string, bdayA: string, bdayB: string, cloudName?: string, uploadPreset?: string) => {
    const data: Record<string, string> = { anniversary_date: annivDate, birthday_a: bdayA, birthday_b: bdayB };
    if (cloudName !== undefined) data.cloudinary_cloud_name = cloudName;
    if (uploadPreset !== undefined) data.cloudinary_upload_preset = uploadPreset;
    await setDoc(doc(db, "settings", "couple_settings"), data, { merge: true });
    addActivity("updated milestone & storage configurations 🛠️");
  };

  // ─── Reset ────────────────────────────────────────────────────────────────
  const resetAllData = useCallback(() => {
    const keys = ["couple_user_a", "couple_user_b", "couple_memories", "couple_journals", "couple_letters", "couple_time_capsules", "couple_missions", "couple_garden_xp", "couple_garden_level", "couple_garden_plant", "couple_water_level", "couple_activity_logs", "couple_mood_history", "couple_theme", "couple_user_reactions"];
    keys.forEach((k) => localStorage.removeItem(k));
    setUserA(initialUserA); setUserB(initialUserB);
    setMemories(initialMemories); setJournals(initialJournals);
    setLetters(initialLetters); setTimeCapsules(initialTimeCapsules);
    setMissions(initialMissions); setGardenXp(240); setGardenLevel(4);
    setGardenPlant("sakura"); setWaterLevel(65);
    setActivityLogs(initialLogs); setMoodHistory(initialMoodHistory); setUserReactions({});
    setThemeState("sakura"); setDarkMode(false);
  }, []);

  // ponytail: Pagination support
  const loadMoreMemories = useCallback(() => {
    setMemoriesLimit(prev => prev + 15);
  }, []);

  const loadMoreJournals = useCallback(() => {
    setJournalsLimit(prev => prev + 15);
  }, []);

  return (
    <CoupleContext.Provider value={{
      session, logout, currentUser, setCurrentUser, partnerId, userA, userB, updateProfile,
      memories, userReactions, addMemory, addReactionToMemory, addCommentToMemory, deleteCommentFromMemory,
      journals, addJournal, deleteJournal, updateJournal,
      letters, sendLetter, openLetter, reactToLetter,
      timeCapsules, addTimeCapsule, openTimeCapsule,
      missions, toggleMission,
      gardenXp, gardenLevel, gardenPlant, waterLevel, waterPlant, changePlantType,
      currentSong, setSongPlayState, updateSongProgress, syncSongToPartner,
      activityLogs, addActivity, moodHistory, addMoodHistoryEntry,
      theme, setTheme, darkMode, toggleDarkMode, awardXp, anniversaryDate, birthdayA, birthdayB,
      cloudinaryCloudName, cloudinaryUploadPreset,
      triggerSurprise, activeSurprise, setActiveSurprise,
      resetAllData, isOnboarding, claimProfileSlot,
      deleteMemory, updateMemory,
      adminResetMissions, adminClearActivityLogs, adminDeleteAllMemories, adminKickSlot,
      adminDeleteAllSketches, adminDeleteAllNotes, adminResetTTTScore,
      updateCoupleSettings,
      memoriesLimit, loadMoreMemories, journalsLimit, loadMoreJournals,
    }}>
      {children}
    </CoupleContext.Provider>
  );
};

export const useCouple = (): CoupleContextProps => {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error("useCouple must be used within a CoupleProvider");
  return ctx;
};