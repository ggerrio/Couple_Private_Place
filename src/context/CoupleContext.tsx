/**
 * CoupleContext.tsx — rebuilt from zero, now composed from sub‑hooks.
 *
 * Architecture:
 *   ┌──────────────────────────────────────────┐
 *   │ CoupleProvider                           │
 *   │  ├─ useAuthState     (session, slots)    │
 *   │  ├─ useProfileState  (userA, userB)      │
 *   │  ├─ useContentState  (memories, etc.)    │
 *   │  ├─ useEngagementState (garden, song…)   │
 *   │  ├─ useSettingsState (dark mode, dates…) │
 *   │  └─ cross‑domain actions + effects       │
 *   └──────────────────────────────────────────┘
 *   ↓ useCouple() — same API, zero consumer changes
 *
 * Firestore SDK (~1MB) is lazy-loaded via dynamic import() after login.
 */

import React, { createContext, useContext, useEffect, useCallback, useMemo, useState } from "react";

import type {
  Profile, Memory, Journal, Letter, TimeCapsule,
  Mission, Song, ActivityLog, MoodHistoryEntry,
  CustomGreetings, GratitudeEntry,
} from "../types";
import { getDb } from "../firebaseClient";

import { useAuthState } from "./useAuthState";
import { useProfileState } from "./useProfileState";
import { useContentState } from "./useContentState";
import { useEngagementState } from "./useEngagementState";
import { useSettingsState } from "./useSettingsState";
import { initialUserA, initialUserB, initialMemories, initialJournals, initialLetters, initialTimeCapsules, initialMissions, initialLogs, initialMoodHistory, DEFAULT_AVATAR_A, DEFAULT_AVATAR_B, DEFAULT_GREETINGS, lsGet } from "./defaults";

// ─── Public API (unchanged from original) ──────────────────────────────

interface CoupleContextProps {
  session: any;
  isAdmin: boolean;
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
  sendLetter: (letter: Omit<Letter, "id" | "senderId" | "isOpened" | "reactions" | "createdAt">) => Promise<void>;
  openLetter: (id: string) => Promise<void>;
  reactToLetter: (id: string, emoji: string) => Promise<void>;
  timeCapsules: TimeCapsule[];
  addTimeCapsule: (capsule: Omit<TimeCapsule, "id" | "senderId" | "isOpened" | "createdAt">) => Promise<void>;
  openTimeCapsule: (id: string) => Promise<void>;
  missions: Mission[];
  toggleMission: (id: string) => void;
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
  darkMode: boolean;
  toggleDarkMode: () => void;
  fontTheme: string;
  updateFontTheme: (theme: string) => void;
  colorTheme: string;
  updateColorTheme: (theme: string) => void;
  washiTapeTheme: string;
  updateWashiTapeTheme: (theme: string) => void;
  anniversaryDate: string;
  birthdayA: string;
  birthdayB: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  triggerSurprise: (surpriseType: string) => void;
  activeSurprise: string | null;
  setActiveSurprise: (val: string | null) => void;
  customGreetings: CustomGreetings;
  updateCustomGreetings: (greetings: CustomGreetings) => void;
  gratitudes: GratitudeEntry[];
  addGratitude: (text: string) => void;
  liveWeather: Record<string, { code: number; desc: string } | null>;
  updateLiveWeather: (city: string, data: { code: number; desc: string } | null) => void;
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
  memoriesLimit: number;
  loadMoreMemories: () => void;
  journalsLimit: number;
  loadMoreJournals: () => void;
  loginAsDev: (role: "user_a" | "user_b") => void;
}

// ─── Split contexts for granular re-render isolation ─────────────────
// Each context only updates when its specific slice of state changes.
// Components that use the specific hooks (useProfile, useContent, etc.)
// will NOT re-render when unrelated state changes.

// Profile context: user profiles, profile updates
interface ProfileSlice {
  userA: Profile;
  userB: Profile;
  updateProfile: (userId: "user_a" | "user_b", updates: Partial<Profile>) => void;
  currentUser: "user_a" | "user_b";
  partnerId: "user_a" | "user_b";
}
const ProfileCtx = createContext<ProfileSlice | undefined>(undefined);

// Content context: memories, journals, letters, time capsules + CRUD
interface ContentSlice {
  memories: Memory[];
  journals: Journal[];
  letters: Letter[];
  timeCapsules: TimeCapsule[];
  userReactions: Record<string, Record<string, boolean>>;
  addMemory: (memory: any) => void;
  deleteMemory: (id: string) => Promise<void>;
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<void>;
  addReactionToMemory: (memoryId: string, emoji: string) => void;
  addCommentToMemory: (memoryId: string, text: string) => void;
  deleteCommentFromMemory: (memoryId: string, commentId: string) => Promise<void>;
  addJournal: (journal: any) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  updateJournal: (id: string, updates: Partial<Journal>) => Promise<void>;
  sendLetter: (letter: any) => Promise<void>;
  openLetter: (id: string) => Promise<void>;
  reactToLetter: (id: string, emoji: string) => Promise<void>;
  addTimeCapsule: (capsule: any) => Promise<void>;
  openTimeCapsule: (id: string) => Promise<void>;
  memoriesLimit: number;
  journalsLimit: number;
  loadMoreMemories: () => void;
  loadMoreJournals: () => void;
}
const ContentCtx = createContext<ContentSlice | undefined>(undefined);

// Engagement context: missions, garden, song, mood, gratitudes
interface EngagementSlice {
  missions: Mission[];
  toggleMission: (id: string) => void;
  gardenPlant: string;
  waterLevel: number;
  waterPlant: () => void;
  changePlantType: (type: any) => void;
  currentSong: Song;
  setSongPlayState: (playing: boolean) => void;
  updateSongProgress: (progressMs: number) => void;
  syncSongToPartner: (song: Song) => void;
  activityLogs: ActivityLog[];
  addActivity: (text: string) => void;
  moodHistory: MoodHistoryEntry[];
  addMoodHistoryEntry: (mood: string, note?: string) => void;
  gratitudes: GratitudeEntry[];
  addGratitude: (text: string) => void;
}
const EngagementCtx = createContext<EngagementSlice | undefined>(undefined);

// Settings context: theme, dates, preferences
interface SettingsSlice {
  darkMode: boolean;
  toggleDarkMode: () => void;
  fontTheme: string;
  updateFontTheme: (theme: string) => void;
  colorTheme: string;
  updateColorTheme: (theme: string) => void;
  washiTapeTheme: string;
  updateWashiTapeTheme: (theme: string) => void;
  anniversaryDate: string;
  birthdayA: string;
  birthdayB: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  activeSurprise: string | null;
  setActiveSurprise: (val: string | null) => void;
  customGreetings: CustomGreetings;
  updateCustomGreetings: (greetings: CustomGreetings) => void;
  liveWeather: Record<string, { code: number; desc: string } | null>;
  updateLiveWeather: (city: string, data: any) => void;
}
const SettingsCtx = createContext<SettingsSlice | undefined>(undefined);

const CoupleContext = createContext<CoupleContextProps | undefined>(undefined);

export const CoupleProvider: React.FC<{ children: React.ReactNode; activeTab?: string }> = ({ children, activeTab }) => {
  // ─── Compose sub-hooks ──────────────────────────────────────────────
  const auth = useAuthState();
  const profile = useProfileState();
  const content = useContentState();
  const engagement = useEngagementState();
  const settings = useSettingsState();

  const { currentUser, partnerId } = auth;
  const { userA, userB, setUserA, setUserB, updateProfile } = profile;

  // ─── Admin state (from Firestore, not env var) ─────────────────────
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const isAdmin = auth.session && adminEmail ? auth.session.email === adminEmail : false;
  const {
    memories, setMemories, journals, setJournals,
    letters, setLetters, timeCapsules, setTimeCapsules,
    userReactions, setUserReactions,
    memoriesLimit, journalsLimit, reactionLockRef,
    loadMoreMemories, loadMoreJournals,
  } = content;
  const {
    missions, setMissions, activityLogs, setActivityLogs,
    moodHistory, setMoodHistory, gratitudes, setGratitudes,
    missionSeededRef,
    gardenPlant, setGardenPlant, waterLevel, setWaterLevel,
    currentSong, setCurrentSong,
  } = engagement;
  const {
    darkMode, setDarkMode, toggleDarkMode,
    anniversaryDate, setAnniversaryDate, birthdayA, setBirthdayA, birthdayB, setBirthdayB,
    cloudinaryCloudName, setCloudinaryCloudName, cloudinaryUploadPreset, setCloudinaryUploadPreset,
    activeSurprise, setActiveSurprise, customGreetings, setCustomGreetings,
    liveWeather, setLiveWeather,
    fontTheme, updateFontTheme,
    colorTheme, updateColorTheme,
    washiTapeTheme, updateWashiTapeTheme,
  } = settings;

  // ─── Batch localStorage sync (deferred to next paint) ───────────────
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      localStorage.setItem("couple_active_user", currentUser);
      localStorage.setItem("couple_user_a", JSON.stringify(userA));
      localStorage.setItem("couple_user_b", JSON.stringify(userB));
      localStorage.setItem("couple_memories", JSON.stringify(memories));
      localStorage.setItem("couple_journals", JSON.stringify(journals));
      localStorage.setItem("couple_letters", JSON.stringify(letters));
      localStorage.setItem("couple_time_capsules", JSON.stringify(timeCapsules));
      localStorage.setItem("couple_missions", JSON.stringify(missions));
      localStorage.setItem("couple_garden_plant", JSON.stringify(gardenPlant));
      localStorage.setItem("couple_water_level", String(waterLevel));
      localStorage.setItem("couple_activity_logs", JSON.stringify(activityLogs));
      localStorage.setItem("couple_mood_history", JSON.stringify(moodHistory));
      localStorage.setItem("couple_user_reactions", JSON.stringify(userReactions));
      localStorage.setItem("couple_anniversary_date", JSON.stringify(anniversaryDate));
      localStorage.setItem("couple_custom_greetings", JSON.stringify(customGreetings));
      localStorage.setItem("couple_gratitudes", JSON.stringify(gratitudes));
    });
    return () => cancelAnimationFrame(handle);
  });
  // ponytail: no dep array → runs every render; deferred to next paint via rAF

  // ─── Cosmetic progress ticker ──────────────────────────────────────
  useEffect(() => {
    if (!currentSong.isPlaying) return;
    const id = setInterval(() => {
      setCurrentSong((prev) => {
        if (!prev.isPlaying) return prev;
        return { ...prev, progressMs: prev.durationMs > 0 ? Math.min(prev.progressMs + 1000, prev.durationMs) : prev.progressMs + 1000 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [currentSong.isPlaying]);

  // ─── Firestore helpers ─────────────────────────────────────────────
  const isTabActive = useCallback((tabs: string[]) => !activeTab || tabs.includes(activeTab), [activeTab]);

  // Always-on listeners: lightweight docs needed globally
  useEffect(() => {
    if (!auth.session) return;
    const cleanups: (() => void)[] = [];
    let cancelled = false;

    (async () => {
      const db = await getDb();
      const { doc, setDoc, collection,
        onSnapshot, query, orderBy,
        addDoc, deleteDoc, getDocs } = await import("firebase/firestore");
      if (cancelled) return;

      // Profiles — always needed
      const unsubProfiles = onSnapshot(collection(db, "profiles"), (snap: any) => {
        snap.forEach((d: any) => {
          const p = d.data();
          const mapped: Partial<Profile> = {
            name: p.name, avatar: p.avatar_url, status: p.status, mood: p.mood,
            moodNote: p.mood_note, latitude: p.latitude, longitude: p.longitude,
            weatherCity: p.weather_city, gender: p.gender,
            emoji: p.emoji || (d.id === "user_a" ? "💖" : "✨"),
            timezoneOffset: p.timezone_offset, timezoneName: p.timezone_name,
            lastActive: p.last_active,
          };
          if (d.id === "user_a") setUserA((prev) => ({ ...prev, ...mapped }));
          if (d.id === "user_b") setUserB((prev) => ({ ...prev, ...mapped }));
        });
      }, (err: any) => { console.error("[profiles listener]", err); });
      cleanups.push(unsubProfiles);

      // Missions — always needed (small docs, used in Home + Settings)
      const unsubMissions = onSnapshot(
        query(collection(db, "missions"), orderBy("created_at", "asc")),
        (snap: any) => {
          if (snap.empty && !missionSeededRef.current) {
            missionSeededRef.current = true;
            const defaults = [
              { id: "mis-1", text: "Take a Life4Cuts photo print together", completed: false, type: "daily", created_at: new Date().toISOString() },
              { id: "mis-2", text: "Send a sweet morning Live Letter", completed: false, type: "daily", created_at: new Date().toISOString() },
              { id: "mis-3", text: "Water the Virtual Garden plant", completed: false, type: "daily", created_at: new Date().toISOString() },
              { id: "mis-4", text: "Watch a synchronized YouTube stream", completed: false, type: "daily", created_at: new Date().toISOString() },
              { id: "mis-5", text: "Post a new baking or travel Journal entry", completed: false, type: "weekly", created_at: new Date().toISOString() },
              { id: "mis-6", text: "Win 3 rounds of Mini Games", completed: false, type: "weekly", created_at: new Date().toISOString() },
            ];
            defaults.forEach((m) => {
              const { id, ...rest } = m;
              setDoc(doc(db, "missions", id), rest, { merge: true });
            });
          } else if (!snap.empty) {
            setMissions(snap.docs.map((d: any) => {
              const m = d.data();
              return { id: d.id, text: m.text, completed: m.completed, type: m.type };
            }));
          }
        },
        (err: any) => { console.error("[missions listener]", err); }
      );
      cleanups.push(unsubMissions);

      // Settings — always needed
      const unsubSettings = onSnapshot(doc(db, "settings", "couple_settings"), (d: any) => {
        if (d.exists()) {
          const data = d.data();
          if (data.anniversary_date) setAnniversaryDate(data.anniversary_date);
          if (data.birthday_a) setBirthdayA(data.birthday_a);
          if (data.birthday_b) setBirthdayB(data.birthday_b);
          if (data.cloudinary_cloud_name) setCloudinaryCloudName(data.cloudinary_cloud_name);
          if (data.cloudinary_upload_preset) setCloudinaryUploadPreset(data.cloudinary_upload_preset);
          if (data.custom_greetings) setCustomGreetings(data.custom_greetings);
        } else {
          setDoc(doc(db, "settings", "couple_settings"), {
            anniversary_date: "2024-10-15", birthday_a: "11-18", birthday_b: "04-05",
            cloudinary_cloud_name: "", cloudinary_upload_preset: "",
            custom_greetings: DEFAULT_GREETINGS,
          }).catch(console.error);
        }
      }, (err: any) => { console.error("[settings listener]", err); });
      cleanups.push(unsubSettings);

      // Shared song — always needed (visible in Home, but needed for music controls)
      const unsubSong = onSnapshot(doc(db, "settings", "shared_song"), (d: any) => {
        if (d.exists()) {
          const s = d.data();
          setCurrentSong((prev) => {
            const newVideoId = s.video_id ?? prev.videoId;
            const isNewSong = newVideoId && newVideoId !== prev.videoId;
            return {
              ...prev,
              title: s.title ?? prev.title, artist: s.artist ?? prev.artist,
              album: s.album ?? prev.album, artwork: s.artwork ?? prev.artwork,
              durationMs: s.duration_ms ?? prev.durationMs,
              videoId: newVideoId,
              isPlaying: s.is_playing ?? prev.isPlaying,
              progressMs: isNewSong ? 0 : prev.progressMs,
            };
          });
        }
      }, (err: any) => { console.error("[shared song listener]", err); });
      cleanups.push(unsubSong);

      // Admin config — always needed
      const unsubAdminConfig = onSnapshot(doc(db, "settings", "admin_config"), (d: any) => {
        const expectedPartnerEmail = (import.meta as any).env?.VITE_PARTNER_EMAIL || "nicola.aliciazkim@gmail.com";
        const expectedAdminEmail = (import.meta as any).env?.VITE_ADMIN_EMAIL || "pratamagerrio@gmail.com";

        if (d.exists()) {
          const data = d.data();
          setAdminEmail(data.admin_email || expectedAdminEmail);

          // If we are logged in as admin, and the document is missing partner_email or has outdated data, merge it in
          if (auth.session && auth.session.email?.toLowerCase() === (data.admin_email || expectedAdminEmail).toLowerCase()) {
            if (data.partner_email !== expectedPartnerEmail || data.admin_email !== expectedAdminEmail) {
              setDoc(doc(db, "settings", "admin_config"), {
                admin_email: expectedAdminEmail,
                partner_email: expectedPartnerEmail,
              }, { merge: true }).catch(console.error);
            }
          }
        } else {
          setDoc(doc(db, "settings", "admin_config"), {
            admin_email: expectedAdminEmail,
            partner_email: expectedPartnerEmail,
          }).catch(console.error);
          setAdminEmail(expectedAdminEmail);
        }
      }, (err: any) => { console.error("[admin_config listener]", err); });
      cleanups.push(unsubAdminConfig);
    })();

    return () => {
      cancelled = true;
      cleanups.forEach(fn => fn());
    };
  }, [auth.session]);

  // Tab-specific: Memories + Journals — only when activeTab is "home" or "memories"
  useEffect(() => {
    if (!auth.session || !isTabActive(["home", "memories"])) return;
    const cleanups: (() => void)[] = [];
    let cancelled = false;

    (async () => {
      const db = await getDb();
      const { doc, collection,
        onSnapshot, query, orderBy, limit } = await import("firebase/firestore");
      if (cancelled) return;

      const unsubMemories = onSnapshot(
        query(collection(db, "memories"), orderBy("created_at", "desc"), limit(memoriesLimit)),
        (snap: any) => {
          const urMap: Record<string, Record<string, boolean>> = {};
          const list: Memory[] = snap.docs.map((d: any) => {
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
              description: m.description || "", imageUrl: m.image_url || "",
              date: m.date || new Date().toISOString(), creatorId: m.created_by || "user_a",
              bgStyle: m.bg_style, filterClass: m.filter_class,
              layout: m.layout, photosList: m.photos_list || [],
              partnerPhotosList: m.partner_photos_list || [], colabMode: m.colab_mode,
              reactions: reactionsCount, comments: m.comments || [],
              showOnTimeline: m.show_on_timeline !== undefined ? m.show_on_timeline : true,
            };
          });
          setMemories(list);
          setUserReactions(urMap);
        },
        (err: any) => { console.error("[memories listener]", err); }
      );
      cleanups.push(unsubMemories);

      const unsubJournals = onSnapshot(
        query(collection(db, "journals"), orderBy("created_at", "desc"), limit(journalsLimit)),
        (snap: any) => {
          setJournals(snap.docs.map((d: any) => {
            const j = d.data();
            return {
              id: d.id, title: j.title || "", description: j.description || "",
              date: j.date || new Date().toISOString(), location: j.location || "",
              weather: j.weather || "sunny", mood: j.mood || "happy",
              tags: j.tags || [], creatorId: j.created_by || "user_a",
              editedAt: j.edited_at || undefined,
            };
          }));
        },
        (err: any) => { console.error("[journals listener]", err); }
      );
      cleanups.push(unsubJournals);
    })();

    return () => {
      cancelled = true;
      cleanups.forEach(fn => fn());
    };
  }, [auth.session, activeTab, memoriesLimit, journalsLimit, isTabActive]);

  // Tab-specific: Letters + Time Capsules — only when activeTab is "together"
  useEffect(() => {
    if (!auth.session || !isTabActive(["together"])) return;
    const cleanups: (() => void)[] = [];
    let cancelled = false;

    (async () => {
      const db = await getDb();
      const { collection,
        onSnapshot, query, orderBy } = await import("firebase/firestore");
      if (cancelled) return;

      const unsubLetters = onSnapshot(
        query(collection(db, "letters"), orderBy("created_at", "desc")),
        (snap: any) => {
          setLetters(snap.docs.map((d: any) => {
            const l = d.data();
            return {
              id: d.id,
              senderId: l.senderId || "user_a",
              recipientId: l.recipientId || "user_b",
              title: l.title || "",
              content: l.content || "",
              scheduledFor: l.scheduledFor || undefined,
              isOpened: l.isOpened || false,
              reactions: l.reactions || [],
              createdAt: l.created_at || new Date().toISOString(),
            };
          }));
        },
        (err: any) => { console.error("[letters listener]", err); }
      );
      cleanups.push(unsubLetters);

      const unsubTimeCapsules = onSnapshot(
        query(collection(db, "time_capsules"), orderBy("created_at", "desc")),
        (snap: any) => {
          setTimeCapsules(snap.docs.map((d: any) => {
            const c = d.data();
            return {
              id: d.id,
              senderId: c.senderId || "user_a",
              openDate: c.openDate || new Date().toISOString(),
              message: c.message || "",
              isOpened: c.isOpened || false,
              createdAt: c.created_at || new Date().toISOString(),
            };
          }));
        },
        (err: any) => { console.error("[time_capsules listener]", err); }
      );
      cleanups.push(unsubTimeCapsules);
    })();

    return () => {
      cancelled = true;
      cleanups.forEach(fn => fn());
    };
  }, [auth.session, activeTab, isTabActive]);

  // Tab-specific: Gratitudes — only when activeTab is "home"
  useEffect(() => {
    if (!auth.session || !isTabActive(["home"])) return;
    const cleanups: (() => void)[] = [];
    let cancelled = false;

    (async () => {
      const db = await getDb();
      const { collection,
        onSnapshot, query, orderBy } = await import("firebase/firestore");
      if (cancelled) return;

      const unsubGratitudes = onSnapshot(
        query(collection(db, "gratitudes"), orderBy("createdAt", "desc")),
        (snap: any) => {
          setGratitudes(snap.docs.map((d: any) => {
            const g = d.data();
            return {
              id: d.id,
              userId: g.userId,
              text: g.text,
              date: g.date,
              createdAt: g.createdAt || new Date().toISOString(),
            };
          }));
        },
        (err: any) => { console.error("[gratitudes listener]", err); }
      );
      cleanups.push(unsubGratitudes);
    })();

    return () => {
      cancelled = true;
      cleanups.forEach(fn => fn());
    };
  }, [auth.session, activeTab, isTabActive]);

  // ─── Cross‑domain actions ──────────────────────────────────────────

  const addActivity = useCallback(async (text: string) => {
    try {
      const db = await getDb();
      const { addDoc, collection } = await import("firebase/firestore");
      await addDoc(collection(db, "activity_logs"), {
        user_id: currentUser, text, timestamp: new Date().toISOString(),
      });
    } catch (e) { console.error("[addActivity]", e); }
  }, [currentUser]);

  const triggerSurprise = useCallback((surpriseType: string) => {
    setActiveSurprise(surpriseType);
  }, [setActiveSurprise]);

  // ─── Memories ──────────────────────────────────────────────────────
  const addMemory = useCallback(async (memory: any) => {
    try {
      const db = await getDb();
      const { addDoc, collection } = await import("firebase/firestore");
      await addDoc(collection(db, "memories"), {
        type: memory.type, title: memory.title, image_url: memory.imageUrl,
        description: memory.description || "",
        date: new Date(memory.date).toISOString().split("T")[0],
        created_at: new Date().toISOString(), created_by: currentUser,
        bg_style: memory.bgStyle || "", filter_class: memory.filterClass || "",
        layout: memory.layout || "", photos_list: memory.photosList || [],
        partner_photos_list: memory.partnerPhotosList || [],
        colab_mode: memory.colabMode || "",
        show_on_timeline: memory.showOnTimeline !== undefined ? memory.showOnTimeline : true,
      });
      addActivity(`added a new memory: "${memory.title}"`);
    } catch (e) { console.error("[addMemory]", e); }
  }, [currentUser]);

  const deleteMemory = useCallback(async (id: string) => {
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "memories", id));
      addActivity("deleted a timeline memory");
    } catch (e) { console.error("[deleteMemory]", e); }
  }, []);

  const updateMemory = useCallback(async (id: string, updates: Partial<Memory>) => {
    setMemories((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
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

  const addReactionToMemory = useCallback(async (memoryId: string, emoji: string) => {
    const lockKey = `${memoryId}:${emoji}`;
    if (reactionLockRef.current.has(lockKey)) return;
    reactionLockRef.current.add(lockKey);
    setTimeout(() => reactionLockRef.current.delete(lockKey), 1000);
    try {
      const db = await getDb();
      const { doc, getDoc, updateDoc } = await import("firebase/firestore");
      const memoryRef = doc(db, "memories", memoryId);
      const docSnap = await getDoc(memoryRef);
      if (!docSnap.exists()) return;
      const m = docSnap.data();
      const reactionsRaw = m.reactions || {};
      const currentUserReactionsList: string[] = reactionsRaw[currentUser] || [];
      const nextList = currentUserReactionsList.includes(emoji)
        ? currentUserReactionsList.filter((e: string) => e !== emoji)
        : [...currentUserReactionsList, emoji];
      await updateDoc(memoryRef, { [`reactions.${currentUser}`]: nextList });
    } catch (e) { console.error("[addReactionToMemory]", e); }
  }, [currentUser]);

  const addCommentToMemory = useCallback(async (memoryId: string, text: string) => {
    const comment = { id: `com-${Date.now()}`, authorId: currentUser, text, date: new Date().toISOString() };
    try {
      const db = await getDb();
      const { doc, updateDoc, arrayUnion } = await import("firebase/firestore");
      await updateDoc(doc(db, "memories", memoryId), { comments: arrayUnion(comment) });
    } catch (e) { console.error("[addCommentToMemory]", e); }
  }, [currentUser]);

  const deleteCommentFromMemory = useCallback(async (memoryId: string, commentId: string) => {
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      const memory = memories.find((m) => m.id === memoryId);
      if (!memory) return;
      await updateDoc(doc(db, "memories", memoryId), {
        comments: memory.comments.filter((c: any) => c.id !== commentId),
      });
    } catch (e) { console.error("[deleteCommentFromMemory]", e); }
  }, [memories]);

  // ─── Journals ──────────────────────────────────────────────────────
  const addJournal = useCallback(async (journal: Omit<Journal, "id" | "creatorId" | "editedAt">) => {
    try {
      const db = await getDb();
      const { doc, setDoc, collection } = await import("firebase/firestore");
      const docRef = doc(collection(db, "journals"));
      await setDoc(docRef, {
        title: journal.title, description: journal.description, date: journal.date,
        location: journal.location, weather: journal.weather, mood: journal.mood,
        tags: journal.tags, imageUrl: journal.imageUrl || "",
        created_at: new Date().toISOString(), created_by: currentUser,
      });
      addActivity(`wrote a journal entry: "${journal.title}"`);
    } catch (e) { console.error("[addJournal]", e); }
  }, [currentUser]);

  const deleteJournal = useCallback(async (id: string) => {
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "journals", id));
      addActivity("deleted a journal entry");
    } catch (e) { console.error("[deleteJournal]", e); }
  }, []);

  const updateJournal = useCallback(async (id: string, updates: Partial<Journal>) => {
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      const docRef = doc(db, "journals", id);
      const data: Record<string, any> = {
        title: updates.title, description: updates.description, date: updates.date,
        location: updates.location, weather: updates.weather, mood: updates.mood,
        tags: updates.tags, imageUrl: updates.imageUrl, edited_at: new Date().toISOString(),
      };
      Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
      await updateDoc(docRef, data);
      addActivity("updated a journal entry");
    } catch (e) { console.error("[updateJournal]", e); }
  }, []);

  // ─── Letters ───────────────────────────────────────────────────────
  const sendLetter = useCallback(async (letter: Omit<Letter, "id" | "senderId" | "isOpened" | "reactions" | "createdAt">) => {
    try {
      const db = await getDb();
      const { addDoc, collection } = await import("firebase/firestore");
      await addDoc(collection(db, "letters"), {
        senderId: currentUser,
        recipientId: letter.recipientId,
        title: letter.title,
        content: letter.content,
        scheduledFor: letter.scheduledFor || null,
        isOpened: false,
        reactions: [],
        created_at: new Date().toISOString(),
      });
      addActivity(`sent a beautiful Live Letter: "${letter.title}" ✉️`);
    } catch (e) { console.error("[sendLetter]", e); }
  }, [currentUser]);

  const openLetter = useCallback(async (id: string) => {
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "letters", id), { isOpened: true });
      addActivity("opened a sweet Live Letter");
    } catch (e) { console.error("[openLetter]", e); }
  }, []);

  const reactToLetter = useCallback(async (id: string, emoji: string) => {
    try {
      const db = await getDb();
      const { doc, getDoc, updateDoc } = await import("firebase/firestore");
      const docRef = doc(db, "letters", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      const reactions: string[] = data.reactions || [];
      const nextReactions = reactions.includes(emoji)
        ? reactions.filter((e: string) => e !== emoji)
        : [...reactions, emoji];
      await updateDoc(docRef, { reactions: nextReactions });
    } catch (e) { console.error("[reactToLetter]", e); }
  }, []);

  // ─── Time Capsules ─────────────────────────────────────────────────
  const addTimeCapsule = useCallback(async (capsule: Omit<TimeCapsule, "id" | "senderId" | "isOpened" | "createdAt">) => {
    if (new Date(capsule.openDate) <= new Date()) { console.warn("[addTimeCapsule] openDate must be in the future"); return; }
    try {
      const db = await getDb();
      const { addDoc, collection } = await import("firebase/firestore");
      await addDoc(collection(db, "time_capsules"), {
        senderId: currentUser,
        openDate: capsule.openDate,
        message: capsule.message,
        isOpened: false,
        created_at: new Date().toISOString(),
      });
      addActivity(`sealed a Time Capsule until ${new Date(capsule.openDate).toLocaleDateString()} ⏳`);
    } catch (e) { console.error("[addTimeCapsule]", e); }
  }, [currentUser]);

  const openTimeCapsule = useCallback(async (id: string) => {
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "time_capsules", id), { isOpened: true });
      addActivity("unlocked and opened a Time Capsule! 🎁");
      triggerSurprise("time-capsule-reveal");
    } catch (e) { console.error("[openTimeCapsule]", e); }
  }, []);

  // ─── Missions ──────────────────────────────────────────────────────
  const toggleMission = useCallback(async (id: string) => {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;
    const nextCompleted = !mission.completed;
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "missions", id), { completed: nextCompleted });
    } catch (e) { console.error("[toggleMission]", e); }
  }, [missions]);

  // ─── Garden ────────────────────────────────────────────────────────
  const waterPlant = useCallback(() => {
    setWaterLevel((prev) => Math.min(prev + 20, 100));
  }, []);

  const changePlantType = useCallback((type: "tulip" | "bonsai" | "sakura" | "sunflower") => {
    setGardenPlant(type);
    addActivity(`changed their garden centerpiece to a gorgeous ${type} 🪴`);
  }, []);

  // ─── Song controls ────────────────────────────────────────────────
  const setSongPlayState = useCallback(async (playing: boolean) => {
    setCurrentSong((prev) => ({ ...prev, isPlaying: playing }));
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "shared_song"), { is_playing: playing }, { merge: true });
    } catch (e) { console.error("[setSongPlayState]", e); }
  }, []);

  const updateSongProgress = useCallback((progressMs: number) => {
    setCurrentSong((prev) => ({ ...prev, progressMs }));
  }, []);

  const syncSongToPartner = useCallback(async (song: Song) => {
    setCurrentSong({ ...song, progressMs: 0 });
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "shared_song"), {
        title: song.title, artist: song.artist, album: song.album || "",
        artwork: song.artwork || "", duration_ms: song.durationMs || 0,
        video_id: song.videoId || "", is_playing: true,
        synced_at: new Date().toISOString(),
      });
    } catch (e) { console.error("[syncSongToPartner]", e); }
  }, []);

  // ─── Mood history ─────────────────────────────────────────────────
  const addMoodHistoryEntry = useCallback((mood: string, note?: string) => {
    const profile = currentUser === "user_a" ? userA : userB;
    const entry: MoodHistoryEntry = {
      id: `mood-${Date.now()}`, userId: currentUser, userName: profile.name,
      mood, note: note?.trim() || undefined, timestamp: new Date().toISOString(),
    };
    setMoodHistory((prev) => [entry, ...prev]);
    updateProfile(currentUser, { mood, moodNote: note?.trim() || "" });
  }, [currentUser, userA, userB, updateProfile]);

  // ─── Gratitudes ───────────────────────────────────────────────────
  const addGratitude = useCallback(async (text: string) => {
    const today = new Date().toISOString().split("T")[0];
    const docId = `${currentUser}_${today}`;
    const entry = {
      userId: currentUser,
      text: text.trim(),
      date: today,
      createdAt: new Date().toISOString(),
    };
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "gratitudes", docId), entry, { merge: true });
      addActivity(`shared their daily gratitude: "${text.trim().slice(0, 50)}${text.trim().length > 50 ? "..." : ""}" 💝`);
    } catch (e) {
      console.error("[addGratitude]", e);
    }
  }, [currentUser, addActivity]);

  const updateCustomGreetings = useCallback(async (greetings: CustomGreetings) => {
    setCustomGreetings(greetings);
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "couple_settings"), {
        custom_greetings: greetings
      }, { merge: true });
    } catch (e) {
      console.error("[save custom greetings error]", e);
    }
  }, []);

  const updateLiveWeather = useCallback((city: string, data: { code: number; desc: string } | null) => {
    setLiveWeather((prev) => ({ ...prev, [city]: data }));
  }, []);

  // ─── Admin ops (all use lazy Firestore) ────────────────────────────
  const adminResetMissions = async () => {
    const db = await getDb();
    const { collection, getDocs, doc, updateDoc } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "missions"));
    await Promise.all(snap.docs.map((d: any) => updateDoc(doc(db, "missions", d.id), { completed: false })));
    addActivity("admin reset all challenges to incomplete 🛠️");
  };

  const adminClearActivityLogs = async () => {
    const db = await getDb();
    const { collection, getDocs, doc, deleteDoc } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "activity_logs"));
    await Promise.all(snap.docs.map((d: any) => deleteDoc(doc(db, "activity_logs", d.id))));
  };

  const adminDeleteAllMemories = async () => {
    const db = await getDb();
    const { collection, getDocs, doc, deleteDoc } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "memories"));
    await Promise.all(snap.docs.map((d: any) => deleteDoc(doc(db, "memories", d.id))));
    addActivity("admin purged all memories 🛠️");
  };

  const adminKickSlot = async (slotId: "user_a" | "user_b") => {
    const db = await getDb();
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "profiles", slotId), {
      auth_id: null, name: slotId === "user_a" ? "Partner A (Empty)" : "Partner B (Empty)",
      avatar_url: slotId === "user_a" ? DEFAULT_AVATAR_A : DEFAULT_AVATAR_B,
      status: "Waiting for connection...", updated_at: new Date().toISOString(),
    });
    addActivity(`admin ejected ${slotId} slot 🛠️`);
  };

  const adminDeleteAllSketches = async () => {
    const db = await getDb();
    const { collection, getDocs, doc, deleteDoc } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "saved_sketches"));
    await Promise.all(snap.docs.map((d: any) => deleteDoc(doc(db, "saved_sketches", d.id))));
    addActivity("admin purged sketch gallery 🛠️");
  };

  const adminDeleteAllNotes = async () => {
    const db = await getDb();
    const { collection, getDocs, doc, deleteDoc } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "sticky_notes"));
    await Promise.all(snap.docs.map((d: any) => deleteDoc(doc(db, "sticky_notes", d.id))));
    addActivity("admin purged Sweet Notes Board 🛠️");
  };

  const adminResetTTTScore = async () => {
    const db = await getDb();
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "rooms", "ttt_room"), { scoreA: 0, scoreB: 0 }, { merge: true });
    addActivity("admin reset Tic Tac Toe scores 🛠️");
  };

  const updateCoupleSettings = async (annivDate: string, bdayA: string, bdayB: string, cloudName?: string, uploadPreset?: string) => {
    const db = await getDb();
    const { doc, setDoc } = await import("firebase/firestore");
    const data: Record<string, string> = { anniversary_date: annivDate, birthday_a: bdayA, birthday_b: bdayB };
    if (cloudName !== undefined) data.cloudinary_cloud_name = cloudName;
    if (uploadPreset !== undefined) data.cloudinary_upload_preset = uploadPreset;
    await setDoc(doc(db, "settings", "couple_settings"), data, { merge: true });
    addActivity("updated milestone & storage configurations 🛠️");
  };

  // ─── Reset ─────────────────────────────────────────────────────────
  const resetAllData = useCallback(() => {
    const keys = ["couple_user_a", "couple_user_b", "couple_memories", "couple_journals", "couple_letters", "couple_time_capsules", "couple_missions", "couple_garden_xp", "couple_garden_level", "couple_garden_plant", "couple_water_level", "couple_activity_logs", "couple_mood_history", "couple_user_reactions"];
    keys.forEach((k) => localStorage.removeItem(k));
    setUserA(initialUserA); setUserB(initialUserB);
    setMemories(initialMemories); setJournals(initialJournals);
    setLetters(initialLetters); setTimeCapsules(initialTimeCapsules);
    setMissions(initialMissions);
    setGardenPlant("sakura"); setWaterLevel(65);
    setActivityLogs(initialLogs); setMoodHistory(initialMoodHistory); setUserReactions({});
    setDarkMode(false);
  }, []);

  // ─── Split context values (each memoized independently) ─────────────
  const profileValue = useMemo(() => ({
    userA, userB, updateProfile, currentUser, partnerId,
  }), [userA, userB, updateProfile, currentUser, partnerId]);

  const contentValue = useMemo(() => ({
    memories, journals, letters, timeCapsules, userReactions,
    addMemory, deleteMemory, updateMemory,
    addReactionToMemory, addCommentToMemory, deleteCommentFromMemory,
    addJournal, deleteJournal, updateJournal,
    sendLetter, openLetter, reactToLetter,
    addTimeCapsule, openTimeCapsule,
    memoriesLimit, journalsLimit, loadMoreMemories, loadMoreJournals,
  }), [
    memories, journals, letters, timeCapsules, userReactions,
    addMemory, deleteMemory, updateMemory,
    addReactionToMemory, addCommentToMemory, deleteCommentFromMemory,
    addJournal, deleteJournal, updateJournal,
    sendLetter, openLetter, reactToLetter,
    addTimeCapsule, openTimeCapsule,
    memoriesLimit, journalsLimit, loadMoreMemories, loadMoreJournals,
  ]);

  const engagementValue = useMemo(() => ({
    missions, toggleMission,
    gardenPlant, waterLevel, waterPlant, changePlantType,
    currentSong, setSongPlayState, updateSongProgress, syncSongToPartner,
    activityLogs, addActivity,
    moodHistory, addMoodHistoryEntry,
    gratitudes, addGratitude,
  }), [
    missions, toggleMission,
    gardenPlant, waterLevel, waterPlant, changePlantType,
    currentSong, setSongPlayState, updateSongProgress, syncSongToPartner,
    activityLogs, addActivity,
    moodHistory, addMoodHistoryEntry,
    gratitudes, addGratitude,
  ]);

  const settingsValue = useMemo(() => ({
    darkMode, toggleDarkMode,
    fontTheme, updateFontTheme,
    colorTheme, updateColorTheme,
    washiTapeTheme, updateWashiTapeTheme,
    anniversaryDate, birthdayA, birthdayB,
    cloudinaryCloudName, cloudinaryUploadPreset,
    activeSurprise, setActiveSurprise,
    customGreetings, updateCustomGreetings,
    liveWeather, updateLiveWeather,
  }), [
    darkMode, toggleDarkMode,
    fontTheme, updateFontTheme,
    colorTheme, updateColorTheme,
    washiTapeTheme, updateWashiTapeTheme,
    anniversaryDate, birthdayA, birthdayB,
    cloudinaryCloudName, cloudinaryUploadPreset,
    activeSurprise, setActiveSurprise,
    customGreetings, updateCustomGreetings,
    liveWeather, updateLiveWeather,
  ]);

  const contextValue = useMemo(() => ({
    session: auth.session, isAdmin, logout: auth.logout, currentUser, setCurrentUser: auth.setCurrentUser, partnerId,
    userA, userB, updateProfile,
    memories, userReactions, addMemory, addReactionToMemory, addCommentToMemory, deleteCommentFromMemory,
    journals, addJournal, deleteJournal, updateJournal,
    letters, sendLetter, openLetter, reactToLetter,
    timeCapsules, addTimeCapsule, openTimeCapsule,
    missions, toggleMission,
    gardenPlant, waterLevel, waterPlant, changePlantType,
    currentSong, setSongPlayState, updateSongProgress, syncSongToPartner,
    activityLogs, addActivity, moodHistory, addMoodHistoryEntry,
    darkMode, toggleDarkMode, anniversaryDate, birthdayA, birthdayB,
    fontTheme, updateFontTheme,
    colorTheme, updateColorTheme,
    washiTapeTheme, updateWashiTapeTheme,
    cloudinaryCloudName, cloudinaryUploadPreset,
    triggerSurprise, activeSurprise, setActiveSurprise,
    customGreetings, updateCustomGreetings,
    gratitudes, addGratitude,
    liveWeather, updateLiveWeather,
    resetAllData, isOnboarding: auth.isOnboarding, claimProfileSlot: auth.claimProfileSlot,
    deleteMemory, updateMemory,
    adminResetMissions, adminClearActivityLogs, adminDeleteAllMemories, adminKickSlot,
    adminDeleteAllSketches, adminDeleteAllNotes, adminResetTTTScore,
    updateCoupleSettings,
    memoriesLimit, loadMoreMemories, journalsLimit, loadMoreJournals,
    loginAsDev: auth.loginAsDev,
  }), [
    auth.session, isAdmin, auth.currentUser, auth.isOnboarding, auth.partnerId,
    auth.loginAsDev,
    currentUser, partnerId,
    userA, userB,
    memories, userReactions, journals, letters, timeCapsules,
    memoriesLimit, journalsLimit,
    missions, activityLogs, moodHistory, gratitudes,
    gardenPlant, waterLevel,
    currentSong,
    darkMode, anniversaryDate, birthdayA, birthdayB,
    cloudinaryCloudName, cloudinaryUploadPreset,
    activeSurprise, customGreetings, liveWeather,
    fontTheme, updateFontTheme,
    colorTheme, updateColorTheme,
    washiTapeTheme, updateWashiTapeTheme,
  ]);

  return (
    <ProfileCtx.Provider value={profileValue}>
      <ContentCtx.Provider value={contentValue}>
        <EngagementCtx.Provider value={engagementValue}>
          <SettingsCtx.Provider value={settingsValue}>
            <CoupleContext.Provider value={contextValue}>
              {children}
            </CoupleContext.Provider>
          </SettingsCtx.Provider>
        </EngagementCtx.Provider>
      </ContentCtx.Provider>
    </ProfileCtx.Provider>
  );
};

export { CoupleContext };
export { DEFAULT_AVATAR_A, DEFAULT_AVATAR_B } from "./defaults";

export const useCouple = (): CoupleContextProps => {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error("useCouple must be used within a CoupleProvider");
  return ctx;
};

// ─── Granular selector hooks ──────────────────────────────────────────
// These hooks only trigger re-render when their specific slice changes.
// Use these instead of useCouple() when you only need a subset of data.

export const useProfileSlice = (): ProfileSlice => {
  const ctx = useContext(ProfileCtx);
  if (!ctx) throw new Error("useProfileSlice must be used within a CoupleProvider");
  return ctx;
};

export const useContentSlice = (): ContentSlice => {
  const ctx = useContext(ContentCtx);
  if (!ctx) throw new Error("useContentSlice must be used within a CoupleProvider");
  return ctx;
};

export const useEngagementSlice = (): EngagementSlice => {
  const ctx = useContext(EngagementCtx);
  if (!ctx) throw new Error("useEngagementSlice must be used within a CoupleProvider");
  return ctx;
};

export const useSettingsSlice = (): SettingsSlice => {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettingsSlice must be used within a CoupleProvider");
  return ctx;
};
