/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
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
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, query, orderBy, limit, addDoc, deleteDoc, getDocs } from "firebase/firestore";

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
  journals: Journal[];
  addJournal: (journal: Omit<Journal, "id">) => void;
  deleteJournal: (id: string) => void;
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
  awardXp: (amount: number, reason: string) => void;
  anniversaryDate: string; // ISO date
  birthdayA: string;
  birthdayB: string;
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
  updateCoupleSettings: (annivDate: string, bdayA: string, bdayB: string) => Promise<void>;
}

const CoupleContext = createContext<CoupleContextProps | undefined>(undefined);

export const DEFAULT_AVATAR_A =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80";
export const DEFAULT_AVATAR_B =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80";

// Initial profiles (seeded names/avatars from Supabase)
const initialUserA: Profile = {
  id: "user_a",
  name: "Han-byul",
  avatar: DEFAULT_AVATAR_A,
  mood: "happy",
  status: "Active",
  xp: 0,
  level: 1,
};

const initialUserB: Profile = {
  id: "user_b",
  name: "Min-seok",
  avatar: DEFAULT_AVATAR_B,
  mood: "cozy",
  status: "Away",
  xp: 0,
  level: 1,
};

// Seed memories
const initialMemories: Memory[] = [
  {
    id: "mem-1",
    type: "milestone",
    title: "Our Very First Meeting",
    description: "At the warm, cozy cafe in Hongdae. It was raining softly outside, and you walked in with that bright yellow umbrella. We talked for four hours straight over roasted grain lattes.",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
    date: "2024-10-15T15:30:00.000Z",
    creatorId: "user_a",
    reactions: { "💖": 5, "✨": 3, "☕": 4 },
    comments: [
      { id: "com-1", authorId: "user_b", text: "I was so nervous I kept spinning my coffee cup! Best day of my life.", date: "2024-10-15T22:10:00.000Z" },
    ],
  },
  {
    id: "mem-2",
    type: "milestone",
    title: "Weekend Escape to Jeju",
    description: "Renting that retro turquoise scooter and driving around the coast. The wind tasted like salt, and your laughter was louder than the waves.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
    date: "2025-04-20T10:00:00.000Z",
    creatorId: "user_b",
    reactions: { "🌴": 4, "🛵": 3, "🥰": 6 },
    comments: [
      { id: "com-2", authorId: "user_a", text: "Let's go back this fall! The tangerines will be in season.", date: "2025-04-21T08:15:00.000Z" },
    ],
  },
];

// Seed journals
const initialJournals: Journal[] = [
  {
    id: "jr-1",
    title: "Baked Madeleines Together 🍋",
    description: "We tried baking lemon madeleines from scratch. The first batch got a little too crispy on the bottom, but the kitchen smelled absolutely wonderful. We topped them with a tiny whipped cream snowman.",
    date: "2026-06-25",
    location: "Our kitchen",
    weather: "sunny",
    mood: "cozy",
    tags: ["baking", "home-date", "sweet"],
  },
  {
    id: "jr-2",
    title: "Ghibli Movie Marathon 🍿",
    description: "Curled up under the fuzzy green blanket and watched 'Howl's Moving Castle' and 'Spirited Away'. We ended up ordering spicy tteokbokki and talking about our dream cottage in the woods until 2 AM.",
    date: "2026-06-28",
    location: "Cozy Living Room",
    weather: "rainy",
    mood: "sleepy",
    tags: ["ghibli", "movie", "cozy-night"],
  },
];

// Seed letters
const initialLetters: Letter[] = [
  {
    id: "let-1",
    senderId: "user_b",
    recipientId: "user_a",
    title: "To my favorite person on a rainy morning",
    content: "Hi star,\n\nI woke up listening to the soft rain hitting the window and immediately thought of you. Thank you for making my world feel so warm and colorful. Even on gray days, thinking of your smile makes everything bright.\n\nHave a beautiful day today, and let's eat something delicious tonight!\n\nWith love.",
    isOpened: true,
    reactions: ["💖", "✨"],
    createdAt: "2026-06-29T08:00:00.000Z",
  },
  {
    id: "let-2",
    senderId: "user_a",
    recipientId: "user_b",
    title: "A letter for 1000 days together...",
    content: "My dear love,\n\nI can't believe we are approaching such an amazing milestone. It feels like just yesterday we met in that rainy cafe. Thank you for being my anchor, my best friend, and my greatest cheerleader.\n\nThis is a tiny secret message locked in time, just for you!\n\nForever yours.",
    scheduledFor: "2026-07-05T00:00:00.000Z", // locked for the future
    isOpened: false,
    reactions: [],
    createdAt: "2026-06-30T01:30:00.000Z",
  },
];

// Seed time capsules
const initialTimeCapsules: TimeCapsule[] = [
  {
    id: "capsule-1",
    senderId: "user_a",
    openDate: "2027-01-01T00:00:00.000Z",
    message: "Our dreams for 2027! Did we finally start our small plant garden? Are we drinking coffee in a little wooden cottage? I hope we are still as happy and laugh as much as we do today. Remember that I love you more with every passing day.",
    isOpened: false,
    createdAt: "2026-06-25T12:00:00.000Z",
  },
];

// Seed missions
const initialMissions: Mission[] = [
  { id: "mis-1", text: "Take a Life4Cuts photo print together", xpReward: 50, completed: false, type: "daily" },
  { id: "mis-2", text: "Send a sweet morning Live Letter", xpReward: 30, completed: false, type: "daily" },
  { id: "mis-3", text: "Water the Virtual Garden plant", xpReward: 20, completed: false, type: "daily" },
  { id: "mis-4", text: "Watch a synchronized YouTube stream", xpReward: 40, completed: false, type: "daily" },
  { id: "mis-5", text: "Post a new baking or travel Journal entry", xpReward: 100, completed: false, type: "weekly" },
  { id: "mis-6", text: "Win 3 rounds of Mini Games", xpReward: 80, completed: false, type: "weekly" },
];

const initialSpotifySong: Song = {
  title: "Somethin' Stupid",
  artist: "Robbie Williams, Nicole Kidman",
  album: "Romantic Vibe",
  artwork: "https://i.scdn.co/image/ab67616d00004851a1fec51b4d321f10723fa14a",
  durationMs: 200000,
  progressMs: 0,
  isPlaying: false,
};

const initialLogs: ActivityLog[] = [
  { id: "log-1", userId: "user_b", text: "updated their status to 'Sipping hand-drip coffee ☕'", timestamp: "2026-06-29T21:40:00.000Z" },
  { id: "log-2", userId: "user_a", text: "watered the Virtual Garden 🌿", timestamp: "2026-06-29T22:15:00.000Z" },
  { id: "log-3", userId: "user_b", text: "sent a new sealed Live Letter 'To my favorite person...'", timestamp: "2026-06-29T23:05:00.000Z" },
];

const initialMoodHistory: MoodHistoryEntry[] = [];

// Helper to safely parse and deduplicate lists retrieved from localStorage
const getInitialListState = <T extends { id: string | number }>(
  key: string,
  initial: T[]
): T[] => {
  const saved = localStorage.getItem(key);
  if (!saved) return initial;
  try {
    const parsed = JSON.parse(saved) as T[];
    if (!Array.isArray(parsed)) return initial;
    const seen = new Set<string | number>();
    return parsed.filter((item) => {
      if (!item || item.id === undefined || item.id === null) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  } catch (e) {
    return initial;
  }
};

export const CoupleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);

  // Current active session profile
  const [currentUser, setCurrentUser] = useState<"user_a" | "user_b">("user_a");

  const resolveCurrentUserFromAuth = async (authUserId: string) => {
    console.log("[DEBUG AUTH] Resolving profile for user UUID:", authUserId);
    try {
      const docRefA = doc(db, "profiles", "user_a");
      const docRefB = doc(db, "profiles", "user_b");
      
      let docA = await getDoc(docRefA);
      let docB = await getDoc(docRefB);
      
      // Auto-seed profile slots if Firestore is brand new (using clean placeholders)
      if (!docA.exists()) {
        console.log("[DEBUG AUTH] Seeding initial empty slot for Partner A");
        const initialA = {
          id: "user_a",
          auth_id: null,
          name: "Partner A (Empty)",
          avatar_url: DEFAULT_AVATAR_A,
          status: "Waiting for connection...",
          mood: "happy",
          updated_at: new Date().toISOString()
        };
        await setDoc(docRefA, initialA);
        docA = await getDoc(docRefA);
      }
      
      if (!docB.exists()) {
        console.log("[DEBUG AUTH] Seeding initial empty slot for Partner B");
        const initialB = {
          id: "user_b",
          auth_id: null,
          name: "Partner B (Empty)",
          avatar_url: DEFAULT_AVATAR_B,
          status: "Waiting for connection...",
          mood: "happy",
          updated_at: new Date().toISOString()
        };
        await setDoc(docRefB, initialB);
        docB = await getDoc(docRefB);
      }
      
      const valA = docA.exists() ? docA.data() : null;
      const valB = docB.exists() ? docB.data() : null;
      
      if (valA?.auth_id === authUserId) {
        console.log("[DEBUG AUTH] Found matching slot: user_a");
        setCurrentUser("user_a");
        setIsOnboarding(false);
      } else if (valB?.auth_id === authUserId) {
        console.log("[DEBUG AUTH] Found matching slot: user_b");
        setCurrentUser("user_b");
        setIsOnboarding(false);
      } else {
        console.log("[DEBUG AUTH] No slot claimed yet. Redirecting to onboarding.");
        setIsOnboarding(true);
      }
    } catch (e) {
      console.error("[DEBUG AUTH] resolveCurrentUserFromAuth caught error:", e);
      setIsOnboarding(true);
    }
  };

  const claimProfileSlot = async (slotId: "user_a" | "user_b") => {
    if (!auth.currentUser) {
      console.error("No active session to claim profile slot");
      return;
    }
    try {
      // Extract real user details from Google authentication details
      const googleName = auth.currentUser.displayName || (slotId === "user_a" ? "Partner A" : "Partner B");
      const googleAvatar = auth.currentUser.photoURL || (slotId === "user_a" ? DEFAULT_AVATAR_A : DEFAULT_AVATAR_B);
      
      await setDoc(doc(db, "profiles", slotId), {
        id: slotId,
        auth_id: auth.currentUser.uid,
        name: googleName,
        avatar_url: googleAvatar,
        status: "Online 💖",
        mood: "happy",
        updated_at: new Date().toISOString()
      }, { merge: true });
      
      setCurrentUser(slotId);
      setIsOnboarding(false);
    } catch (e) {
      console.error("Error claiming slot:", e);
      throw e;
    }
  };

  useEffect(() => {
    console.log("[DEBUG AUTH] Initializing Firebase auth listener...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[DEBUG AUTH] onAuthStateChanged user changed:", !!user);
      setSession(user);
      if (user) {
        resolveCurrentUserFromAuth(user.uid);
      } else {
        setIsOnboarding(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setSession(null);
  };

  const partnerId = currentUser === "user_a" ? "user_b" : "user_a";

  // Persistent States
  const [userA, setUserA] = useState<Profile>(() => {
    const saved = localStorage.getItem("couple_user_a");
    return saved ? JSON.parse(saved) : initialUserA;
  });

  const [userB, setUserB] = useState<Profile>(() => {
    const saved = localStorage.getItem("couple_user_b");
    return saved ? JSON.parse(saved) : initialUserB;
  });

  const [memories, setMemories] = useState<Memory[]>(() => 
    getInitialListState("couple_memories", initialMemories)
  );

  const [journals, setJournals] = useState<Journal[]>(() => 
    getInitialListState("couple_journals", initialJournals)
  );

  const [letters, setLetters] = useState<Letter[]>(() => 
    getInitialListState("couple_letters", initialLetters)
  );

  const [timeCapsules, setTimeCapsules] = useState<TimeCapsule[]>(() => 
    getInitialListState("couple_time_capsules", initialTimeCapsules)
  );

  const [missions, setMissions] = useState<Mission[]>(() => 
    getInitialListState("couple_missions", initialMissions)
  );

  const [gardenXp, setGardenXp] = useState<number>(() => {
    const saved = localStorage.getItem("couple_garden_xp");
    return saved ? parseInt(saved) : 240;
  });

  const [gardenLevel, setGardenLevel] = useState<number>(() => {
    const saved = localStorage.getItem("couple_garden_level");
    return saved ? parseInt(saved) : 4;
  });

  const [gardenPlant, setGardenPlant] = useState<"tulip" | "bonsai" | "sakura" | "sunflower">(() => {
    const saved = localStorage.getItem("couple_garden_plant");
    return (saved as "tulip" | "bonsai" | "sakura" | "sunflower") || "sakura";
  });

  const [waterLevel, setWaterLevel] = useState<number>(() => {
    const saved = localStorage.getItem("couple_water_level");
    return saved ? parseInt(saved) : 65;
  });

  const [currentSong, setCurrentSong] = useState<Song>(initialSpotifySong);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => 
    getInitialListState("couple_activity_logs", initialLogs)
  );

  const [moodHistory, setMoodHistory] = useState<MoodHistoryEntry[]>(() => 
    getInitialListState("couple_mood_history", initialMoodHistory)
  );

  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem("couple_theme");
    return (saved as ThemeType) || "minimal-white";
  });

  const [activeSurprise, setActiveSurprise] = useState<string | null>(null);

  const [userReactions, setUserReactions] = useState<Record<string, Record<string, boolean>>>(() => {
    try {
      const saved = localStorage.getItem("couple_user_reactions");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [anniversaryDate, setAnniversaryDate] = useState<string>(() => {
    return localStorage.getItem("couple_anniversary_date") || "2024-10-15";
  });
  const [birthdayA, setBirthdayA] = useState<string>("11-18");
  const [birthdayB, setBirthdayB] = useState<string>("04-05");

  // Firestore Real-Time Listeners
  useEffect(() => {
    if (!session) return;

    // 1. Profiles Real-Time Listener
    const unsubProfiles = onSnapshot(collection(db, "profiles"), (snapshot) => {
      const profilesData: any[] = [];
      snapshot.forEach((doc) => {
        profilesData.push({ id: doc.id, ...doc.data() });
      });

      const uA = profilesData.find((p) => p.id === "user_a");
      const uB = profilesData.find((p) => p.id === "user_b");
      if (uA) {
        setUserA((prev) => ({
          ...prev,
          name: uA.name || prev.name,
          avatar: uA.avatar_url || prev.avatar,
          status: uA.status || prev.status,
          mood: uA.mood || prev.mood,
        }));
      }
      if (uB) {
        setUserB((prev) => ({
          ...prev,
          name: uB.name || prev.name,
          avatar: uB.avatar_url || prev.avatar,
          status: uB.status || prev.status,
          mood: uB.mood || prev.mood,
        }));
      }
    });

    // 2. Memories Real-Time Listener
    const qMemories = query(collection(db, "memories"), orderBy("created_at", "desc"));
    const unsubMemories = onSnapshot(qMemories, (snapshot) => {
      const memoriesList: Memory[] = [];
      snapshot.forEach((doc) => {
        const m = doc.data();
        memoriesList.push({
          id: doc.id,
          type: m.type || "milestone",
          title: m.title,
          description: "",
          imageUrl: m.image_url,
          date: m.date || new Date().toISOString(),
          creatorId: "user_a",
          reactions: {},
          comments: [],
        });
      });
      setMemories(memoriesList);
    });

    // 3. Activity Logs Real-Time Listener
    const qLogs = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const logsList: ActivityLog[] = [];
      snapshot.forEach((doc) => {
        const log = doc.data();
        logsList.push({
          id: doc.id,
          userId: log.user_id,
          text: log.text,
          timestamp: log.timestamp,
        });
      });
      setActivityLogs(logsList);
    });

    // 4. Missions Real-Time Listener
    const qMissions = query(collection(db, "missions"), orderBy("created_at", "asc"));
    const unsubMissions = onSnapshot(qMissions, (snapshot) => {
      const missionsList: Mission[] = [];
      snapshot.forEach((doc) => {
        const m = doc.data();
        missionsList.push({
          id: doc.id,
          text: m.text,
          xpReward: m.xp_reward,
          completed: m.completed,
          type: m.type,
        });
      });

      if (missionsList.length === 0) {
        seedDefaultMissions();
      } else {
        setMissions(missionsList);
      }
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "couple_settings"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.anniversary_date) {
          setAnniversaryDate(data.anniversary_date);
          localStorage.setItem("couple_anniversary_date", data.anniversary_date);
        }
        if (data.birthday_a) setBirthdayA(data.birthday_a);
        if (data.birthday_b) setBirthdayB(data.birthday_b);
      } else {
        setDoc(doc(db, "settings", "couple_settings"), {
          anniversary_date: "2024-10-15",
          birthday_a: "11-18",
          birthday_b: "04-05"
        }).catch(err => console.error("Error seeding settings:", err));
      }
    });

    return () => {
      unsubProfiles();
      unsubMemories();
      unsubLogs();
      unsubMissions();
      unsubSettings();
    };
  }, [session]);

  const seedDefaultMissions = async () => {
    const defaultMissions = [
      { id: "mission-1", text: "Water the digital plant together", xp_reward: 15, completed: false, type: "daily", created_at: new Date().toISOString() },
      { id: "mission-2", text: "Share your current mood status", xp_reward: 10, completed: false, type: "daily", created_at: new Date().toISOString() },
      { id: "mission-3", text: "Listen to the same Spotify track", xp_reward: 20, completed: false, type: "daily", created_at: new Date().toISOString() },
      { id: "mission-4", text: "Take a virtual LDR photobox strip", xp_reward: 25, completed: false, type: "daily", created_at: new Date().toISOString() }
    ];
    for (const m of defaultMissions) {
      await setDoc(doc(db, "missions", m.id), m);
    }
  };

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem("couple_active_user", currentUser);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("couple_user_a", JSON.stringify(userA));
  }, [userA]);

  useEffect(() => {
    localStorage.setItem("couple_user_b", JSON.stringify(userB));
  }, [userB]);

  useEffect(() => {
    localStorage.setItem("couple_memories", JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem("couple_user_reactions", JSON.stringify(userReactions));
  }, [userReactions]);

  useEffect(() => {
    localStorage.setItem("couple_journals", JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem("couple_letters", JSON.stringify(letters));
  }, [letters]);

  useEffect(() => {
    localStorage.setItem("couple_time_capsules", JSON.stringify(timeCapsules));
  }, [timeCapsules]);

  useEffect(() => {
    localStorage.setItem("couple_missions", JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem("couple_garden_xp", gardenXp.toString());
  }, [gardenXp]);

  useEffect(() => {
    localStorage.setItem("couple_garden_level", gardenLevel.toString());
  }, [gardenLevel]);

  useEffect(() => {
    localStorage.setItem("couple_garden_plant", gardenPlant);
  }, [gardenPlant]);

  useEffect(() => {
    localStorage.setItem("couple_water_level", waterLevel.toString());
  }, [waterLevel]);

  useEffect(() => {
    localStorage.setItem("couple_activity_logs", JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem("couple_mood_history", JSON.stringify(moodHistory));
  }, [moodHistory]);

  useEffect(() => {
    localStorage.setItem("couple_theme", theme);
  }, [theme]);

  // Simulate Spotify track updates
  useEffect(() => {
    let interval: any = null;
    if (currentSong.isPlaying) {
      interval = setInterval(() => {
        setCurrentSong((prev) => {
          const nextProgress = prev.progressMs + 1000;
          if (nextProgress >= prev.durationMs) {
            window.dispatchEvent(new CustomEvent("spotifyTrackFinished"));
            return { ...prev, progressMs: 0 };
          }
          return { ...prev, progressMs: nextProgress };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSong.isPlaying, currentSong.durationMs]);

  // Custom logging
  const addActivity = async (text: string) => {
    try {
      const newLog = {
        user_id: currentUser,
        text,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, "activity_logs"), newLog);
    } catch (e) {
      console.error(e);
    }
  };

  // Profile update helper
  const updateProfile = async (userId: "user_a" | "user_b", updates: Partial<Profile>) => {
    if (userId === "user_a") {
      setUserA((prev) => {
        const next = { ...prev, ...updates };
        if (updates.status && updates.status !== prev.status) {
          addActivity(`updated their status to '${updates.status}'`);
        }
        if (updates.mood && updates.mood !== prev.mood) {
          addActivity(`feels ${updates.mood} today`);
        }
        return next;
      });
    } else {
      setUserB((prev) => {
        const next = { ...prev, ...updates };
        if (updates.status && updates.status !== prev.status) {
          addActivity(`updated their status to '${updates.status}'`);
        }
        if (updates.mood && updates.mood !== prev.mood) {
          addActivity(`feels ${updates.mood} today`);
        }
        return next;
      });
    }

    try {
      const dbUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.avatar !== undefined) dbUpdates.avatar_url = updates.avatar;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.mood !== undefined) dbUpdates.mood = updates.mood;

      await updateDoc(doc(db, "profiles", userId), dbUpdates);

      if (updates.name !== undefined) {
        addActivity(`updated their display name to "${updates.name}"`);
      }
      if (updates.avatar !== undefined) {
        addActivity("updated their profile photo");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Award XP to active user
  const awardXp = (amount: number, reason: string) => {
    const actUser = currentUser === "user_a" ? userA : userB;
    const currentXp = actUser.xp + amount;
    const currentLvl = actUser.level;
    const nextLvlThreshold = currentLvl * 150;

    let newLvl = currentLvl;
    let finalXp = currentXp;

    if (currentXp >= nextLvlThreshold) {
      newLvl += 1;
      finalXp = currentXp - nextLvlThreshold;
      addActivity(`grew their bond and reached Level ${newLvl}! 🎉`);
      triggerSurprise("level-up");
    }

    if (currentUser === "user_a") {
      setUserA((prev) => ({ ...prev, xp: finalXp, level: newLvl }));
    } else {
      setUserB((prev) => ({ ...prev, xp: finalXp, level: newLvl }));
    }

    // Award XP to Garden too
    const nextGardenXp = gardenXp + amount;
    const nextGardenLvlThreshold = gardenLevel * 100;
    if (nextGardenXp >= nextGardenLvlThreshold) {
      setGardenLevel(gardenLevel + 1);
      setGardenXp(nextGardenXp - nextGardenLvlThreshold);
      addActivity(`grew the Virtual Garden plant to level ${gardenLevel + 1}! 🌿`);
    } else {
      setGardenXp(nextGardenXp);
    }

    addActivity(`earned ${amount} XP for: ${reason}`);
  };

  // Memories & Photobooth
  const addMemory = async (memory: Omit<Memory, "id" | "reactions" | "comments"> & { bgStyle?: string; filterClass?: string }) => {
    try {
      await addDoc(collection(db, "memories"), {
        type: memory.type,
        title: memory.title,
        image_url: memory.imageUrl,
        date: new Date(memory.date).toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      });
      addActivity(`added a new memory: "${memory.title}"`);
      awardXp(40, `posting a memory`);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      await deleteDoc(doc(db, "memories", id));
      addActivity(`deleted a timeline memory`);
    } catch (e) {
      console.error("Error deleting memory:", e);
    }
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    try {
      const docRef = doc(db, "memories", id);
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.date !== undefined) dbUpdates.date = new Date(updates.date).toISOString().split("T")[0];
      
      await updateDoc(docRef, dbUpdates);
      addActivity(`edited a milestone memory: "${updates.title || 'Untitled'}"`);
    } catch (e) {
      console.error("Error updating memory:", e);
    }
  };

  // Admin resets
  const adminResetMissions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "missions"));
      for (const docSnap of querySnapshot.docs) {
        await updateDoc(doc(db, "missions", docSnap.id), {
          completed: false
        });
      }
      addActivity("admin reset all challenges to incomplete 🛠️");
    } catch (e) {
      console.error("Admin reset missions error:", e);
    }
  };

  const adminClearActivityLogs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "activity_logs"));
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(doc(db, "activity_logs", docSnap.id));
      }
      addActivity("admin cleared all activity logs 🛠️");
    } catch (e) {
      console.error("Admin clear activity logs error:", e);
    }
  };

  const adminDeleteAllMemories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "memories"));
      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(doc(db, "memories", docSnap.id));
      }
      addActivity("admin purged all milestone & photostrip memories 🛠️");
    } catch (e) {
      console.error("Admin purge memories error:", e);
    }
  };

  const updateCoupleSettings = async (annivDate: string, bdayA: string, bdayB: string) => {
    try {
      await setDoc(doc(db, "settings", "couple_settings"), {
        anniversary_date: annivDate,
        birthday_a: bdayA,
        birthday_b: bdayB
      }, { merge: true });
      addActivity(`updated special milestone configurations (Anniversary & Birthdays) 🛠️`);
    } catch (e) {
      console.error("Error updating settings:", e);
      throw e;
    }
  };

  const addReactionToMemory = (memoryId: string, emoji: string) => {
    if (!currentUser || (currentUser !== "user_a" && currentUser !== "user_b")) {
      console.warn("Invalid user identity. Cannot register reaction.");
      return;
    }
    const reactionKey = `${currentUser}_${memoryId}`;
    setUserReactions((prevUserReactions) => {
      const memoryReactions = prevUserReactions[reactionKey] || {};
      const alreadyReacted = !!memoryReactions[emoji];

      // Update memories state inside to guarantee atomic, synchronized checks
      setMemories((prevMemories) =>
        prevMemories.map((m) => {
          if (m.id === memoryId) {
            const count = m.reactions[emoji] || 0;
            const diff = alreadyReacted ? -1 : 1;
            const nextCount = Math.max(0, count + diff);
            return {
              ...m,
              reactions: {
                ...m.reactions,
                [emoji]: nextCount,
              },
            };
          }
          return m;
        })
      );

      // Log activity and award XP on state transition
      if (!alreadyReacted) {
        addActivity(`reacted to memory with ${emoji}`);
        awardXp(5, "reacting to memory");
      } else {
        addActivity(`removed reaction ${emoji} from memory`);
      }

      return {
        ...prevUserReactions,
        [reactionKey]: {
          ...memoryReactions,
          [emoji]: !alreadyReacted,
        },
      };
    });
  };

  const addCommentToMemory = (memoryId: string, text: string) => {
    const newComment = {
      id: "com-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      authorId: currentUser,
      text,
      date: new Date().toISOString(),
    };
    setMemories((prev) =>
      prev.map((m) => {
        if (m.id === memoryId) {
          return {
            ...m,
            comments: [...m.comments, newComment],
          };
        }
        return m;
      })
    );
    addActivity(`commented on a memory`);
    awardXp(15, "commenting on memory");
  };

  // Journal
  const addJournal = (journal: Omit<Journal, "id">) => {
    const newJournal: Journal = {
      ...journal,
      id: "jr-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
    };
    setJournals((prev) => [newJournal, ...prev]);
    addActivity(`wrote a journal entry: "${journal.title}"`);
    awardXp(50, "writing journal");
  };

  const deleteJournal = (id: string) => {
    setJournals((prev) => prev.filter((j) => j.id !== id));
    addActivity(`deleted a journal entry`);
  };

  // Live Letters
  const sendLetter = (letter: Omit<Letter, "id" | "senderId" | "isOpened" | "reactions" | "createdAt">) => {
    const newLetter: Letter = {
      ...letter,
      id: "let-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      senderId: currentUser,
      isOpened: false,
      reactions: [],
      createdAt: new Date().toISOString(),
    };
    setLetters((prev) => [newLetter, ...prev]);
    addActivity(`sent a beautiful Live Letter: "${letter.title}" ✉️`);
    awardXp(30, "sending letter");
  };

  const openLetter = (id: string) => {
    setLetters((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isOpened: true } : l))
    );
    addActivity(`opened a sweet Live Letter`);
    awardXp(10, "reading letter");
  };

  const reactToLetter = (id: string, emoji: string) => {
    setLetters((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const currentReactions = l.reactions || [];
          if (currentReactions.includes(emoji)) {
            return { ...l, reactions: currentReactions.filter((r) => r !== emoji) };
          }
          return { ...l, reactions: [...currentReactions, emoji] };
        }
        return l;
      })
    );
    addActivity(`reacted ${emoji} to a letter`);
    awardXp(5, "reacting to letter");
  };

  // Time Capsules
  const addTimeCapsule = (capsule: Omit<TimeCapsule, "id" | "senderId" | "isOpened" | "createdAt">) => {
    const newCapsule: TimeCapsule = {
      ...capsule,
      id: "cap-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      senderId: currentUser,
      isOpened: false,
      createdAt: new Date().toISOString(),
    };
    setTimeCapsules((prev) => [newCapsule, ...prev]);
    addActivity(`sealed a Time Capsule until ${new Date(capsule.openDate).toLocaleDateString()} ⏳`);
    awardXp(50, "sealing time capsule");
  };

  const openTimeCapsule = (id: string) => {
    setTimeCapsules((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isOpened: true } : c))
    );
    addActivity(`unlocked and opened a Time Capsule! 🎁`);
    awardXp(30, "opening time capsule");
    triggerSurprise("time-capsule-reveal");
  };

  // Missions
  const toggleMission = async (id: string) => {
    const mission = missions.find((m) => m.id === id);
    if (!mission) return;
    const nextCompleted = !mission.completed;

    if (nextCompleted) {
      awardXp(mission.xpReward, `completing mission "${mission.text}"`);
    }

    try {
      await updateDoc(doc(db, "missions", id), {
        completed: nextCompleted
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Virtual Garden
  const waterPlant = () => {
    setWaterLevel((prev) => Math.min(prev + 20, 100));
    addActivity(`watered their shared plant 💧`);
    awardXp(20, "watering garden plant");
  };

  const changePlantType = (type: "tulip" | "bonsai" | "sakura" | "sunflower") => {
    setGardenPlant(type);
    addActivity(`changed their garden centerpiece to a gorgeous ${type} 🪴`);
  };

  // Spotify Playback Simulators
  const setSongPlayState = (playing: boolean) => {
    setCurrentSong((prev) => ({ ...prev, isPlaying: playing }));
    addActivity(playing ? `resumed listening together 🎵` : `paused the shared player ⏸️`);
  };

  const updateSongProgress = (progressMs: number) => {
    setCurrentSong((prev) => ({ ...prev, progressMs }));
  };

  const syncSongToPartner = (song: Song) => {
    setCurrentSong(song);
    addActivity(`synchronized Spotify: listening to "${song.title}"`);
  };

  // Change Theme
  const setTheme = (nextTheme: ThemeType) => {
    setThemeState(nextTheme);
    addActivity(`changed the digital home theme to '${nextTheme}' ✨`);
  };

  // Add Mood History Entry
  const addMoodHistoryEntry = (mood: string, note?: string) => {
    const userProfile = currentUser === "user_a" ? userA : userB;
    const newEntry: MoodHistoryEntry = {
      id: "mood-" + Date.now() + "-" + Math.floor(Math.random() * 1000000),
      userId: currentUser,
      userName: userProfile.name,
      mood,
      note: note?.trim() || undefined,
      timestamp: new Date().toISOString()
    };
    setMoodHistory((prev) => [newEntry, ...prev]);
    updateProfile(currentUser, { mood });
    if (note && note.trim()) {
      addActivity(`shared a mood note: "${note.trim()}"`);
    }
    awardXp(15, "checking in mood sync");
  };

  // Trigger special moments or surprise modes
  const triggerSurprise = (surpriseType: string) => {
    setActiveSurprise(surpriseType);
  };

  // Reset all local storage data back to defaults
  const resetAllData = () => {
    localStorage.removeItem("couple_user_a");
    localStorage.removeItem("couple_user_b");
    localStorage.removeItem("couple_memories");
    localStorage.removeItem("couple_journals");
    localStorage.removeItem("couple_letters");
    localStorage.removeItem("couple_time_capsules");
    localStorage.removeItem("couple_missions");
    localStorage.removeItem("couple_garden_xp");
    localStorage.removeItem("couple_garden_level");
    localStorage.removeItem("couple_garden_plant");
    localStorage.removeItem("couple_water_level");
    localStorage.removeItem("couple_activity_logs");
    localStorage.removeItem("couple_mood_history");
    localStorage.removeItem("couple_theme");
    localStorage.removeItem("couple_user_reactions");

    setUserA(initialUserA);
    setUserB(initialUserB);
    setMemories(initialMemories);
    setJournals(initialJournals);
    setLetters(initialLetters);
    setTimeCapsules(initialTimeCapsules);
    setMissions(initialMissions);
    setGardenXp(240);
    setGardenLevel(4);
    setGardenPlant("sakura");
    setWaterLevel(65);
    setActivityLogs(initialLogs);
    setMoodHistory(initialMoodHistory);
    setUserReactions({});
    setThemeState("minimal-white");
    addActivity("restored the private couple digital home to factory default 🌸");
  };

  return (
    <CoupleContext.Provider
      value={{
        session,
        logout,
        currentUser,
        setCurrentUser,
        partnerId,
        userA,
        userB,
        updateProfile,
        memories,
        userReactions,
        addMemory,
        addReactionToMemory,
        addCommentToMemory,
        journals,
        addJournal,
        deleteJournal,
        letters,
        sendLetter,
        openLetter,
        reactToLetter,
        timeCapsules,
        addTimeCapsule,
        openTimeCapsule,
        missions,
        toggleMission,
        gardenXp,
        gardenLevel,
        gardenPlant,
        waterLevel,
        waterPlant,
        changePlantType,
        currentSong,
        setSongPlayState,
        updateSongProgress,
        syncSongToPartner,
        activityLogs,
        addActivity,
        moodHistory,
        addMoodHistoryEntry,
        theme,
        setTheme,
        awardXp,
        anniversaryDate,
        birthdayA,
        birthdayB,
        triggerSurprise,
        activeSurprise,
        setActiveSurprise,
        resetAllData,
        isOnboarding,
        claimProfileSlot,
        deleteMemory,
        updateMemory,
        adminResetMissions,
        adminClearActivityLogs,
        adminDeleteAllMemories,
        updateCoupleSettings,
      }}
    >
      {children}
    </CoupleContext.Provider>
  );
};

export const useCouple = () => {
  const context = useContext(CoupleContext);
  if (!context) {
    throw new Error("useCouple must be used within a CoupleProvider");
  }
  return context;
};
