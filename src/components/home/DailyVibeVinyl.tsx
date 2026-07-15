/**
 * DailyVibeVinyl.tsx — 🎵 Daily Vibe Vinyl
 *
 * A daily mood/vibe picker shaped like a vintage vinyl record player.
 * Pick a vibe → it searches YouTube for a matching song and plays it
 * through the shared Listening Treehouse system.
 *
 * Concepts:
 *  - One vibe per day (localStorage-backed)
 *  - Record spins when a vibe is active today
 *  - Connects to CoupleContext → syncSongToPartner (shared player)
 *  - History bar shows last 7 days of vibes
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import { Disc, Music, RotateCw, Calendar, Play, Heart, Volume2, Sparkles, User } from "lucide-react";
import { fetchVideoDuration, triggerHaptic, parseIsoDuration } from "./MusicPlayerUtils";
import { getDb } from "../../firebaseClient";

// ─── Vibe definitions ────────────────────────────────────────────────────────

interface VibeDef {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgGradient: string;
  searchQuery: string; // searched on YouTube
}

const VIBES: VibeDef[] = [
  {
    id: "romantic",
    label: "Romantic",
    emoji: "💕",
    color: "#e11d48",
    bgGradient: "from-rose-400 to-pink-500",
    searchQuery: "romantic love songs",
  },
  {
    id: "mellow",
    label: "Mellow",
    emoji: "🌊",
    color: "#0284c7",
    bgGradient: "from-sky-400 to-blue-500",
    searchQuery: "chill mellow songs",
  },
  {
    id: "happy",
    label: "Happy",
    emoji: "☀️",
    color: "#d97706",
    bgGradient: "from-amber-400 to-orange-500",
    searchQuery: "happy upbeat songs",
  },
  {
    id: "nostalgic",
    label: "Nostalgic",
    emoji: "📼",
    color: "#7c3aed",
    bgGradient: "from-violet-400 to-purple-500",
    searchQuery: "nostalgic sentimental songs",
  },
  {
    id: "energetic",
    label: "Energetic",
    emoji: "⚡",
    color: "#dc2626",
    bgGradient: "from-red-400 to-rose-500",
    searchQuery: "energetic party songs",
  },
  {
    id: "cozy",
    label: "Cozy",
    emoji: "🕯️",
    color: "#a16207",
    bgGradient: "from-amber-300 to-yellow-600",
    searchQuery: "cozy acoustic songs",
  },
];

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

interface DailyVibeEntry {
  date: string; // YYYY-MM-DD
  vibeId: string;
  songTitle: string;
  songArtist: string;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function loadTodayVibe(): DailyVibeEntry | null {
  try {
    const raw = localStorage.getItem("daily_vibe_today");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTodayVibe(entry: DailyVibeEntry) {
  localStorage.setItem("daily_vibe_today", JSON.stringify(entry));
}

function loadVibeHistory(): DailyVibeEntry[] {
  try {
    const raw = localStorage.getItem("daily_vibe_history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVibeHistory(history: DailyVibeEntry[]) {
  localStorage.setItem("daily_vibe_history", JSON.stringify(history));
}

function scoreYouTubeVideo(item: any): number {
  const title = (item.snippet?.title || "").toLowerCase();
  const channel = (item.snippet?.channelTitle || "").toLowerCase();

  let score = 0;

  // ===== Positive =====
  if (title.includes("official music video")) score += 30;
  if (title.includes("official video")) score += 25;
  if (title.includes("official audio")) score += 20;
  if (title.includes("official")) score += 15;

  if (channel.includes("vevo")) score += 25;
  if (channel.includes("records")) score += 20;
  if (channel.includes("music")) score += 5;

  // ===== Negative =====
  const blocked = [
    "lyrics",
    "lyric",
    "cover",
    "karaoke",
    "slowed",
    "sped up",
    "nightcore",
    "8d",
    "bass boosted",
    "fan made",
    "reaction",
    "concert",
    "live",
    "performance",
    "edit audio",
    "reverb",
    "remix"
  ];

  blocked.forEach((word) => {
    if (title.includes(word)) score -= 50;
  });

  return score;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DailyVibeVinyl() {
  const { syncSongToPartner, currentUser, userA, userB } = useCouple();

  const [todayVibe, setTodayVibe] = useState<DailyVibeEntry | null>(loadTodayVibe);
  const [vibeHistory, setVibeHistory] = useState<DailyVibeEntry[]>(loadVibeHistory);
  const [sharedVibes, setSharedVibes] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searching, setSearching] = useState<string | null>(null); // vibeId being searched
  const [vinylSpin, setVinylSpin] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ── Save vibe entry to Firestore ──
  const saveVibeToFirestore = useCallback(async (entry: DailyVibeEntry, videoId?: string, artwork?: string, durationMs?: number) => {
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      const docId = `${currentUser}_${entry.date}`;
      await setDoc(doc(db, "daily_vibes", docId), {
        date: entry.date,
        userId: currentUser,
        vibeId: entry.vibeId,
        songTitle: entry.songTitle,
        songArtist: entry.songArtist,
        videoId: videoId || "",
        artwork: artwork || "",
        durationMs: durationMs || 0,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to save vibe to Firestore:", err);
    }
  }, [currentUser]);

  // ── Prune old daily vibe entries from Firestore ──
  const pruneOldVibes = useCallback(async (db: any) => {
    try {
      const { collection, getDocs, deleteDoc, doc, query, where } = await import("firebase/firestore");
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const sevenDaysAgoStr = d.toISOString().split("T")[0];
      
      const q = query(collection(db, "daily_vibes"), where("date", "<", sevenDaysAgoStr));
      const snap = await getDocs(q);
      const batchPromises = snap.docs.map((docSnap: any) => deleteDoc(doc(db, "daily_vibes", docSnap.id)));
      await Promise.all(batchPromises);
    } catch (err) {
      console.warn("Failed to prune old vibes:", err);
    }
  }, []);

  // ── Load shared vibes from Firestore ──
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    (async () => {
      try {
        const db = await getDb();
        const { collection, onSnapshot, query, orderBy } = await import("firebase/firestore");
        
        // Prune old entries
        pruneOldVibes(db).catch(console.error);
        
        // Listen to all vibes ordered by date desc
        const q = query(collection(db, "daily_vibes"), orderBy("date", "desc"));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const list: any[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...docSnap.data() });
          });
          setSharedVibes(list);
        }, (err) => {
          console.error("Shared vibes subscription error:", err);
        });
      } catch (err) {
        console.error("Failed to setup shared vibes listener:", err);
      }
    })();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Find current user's today's vibe from sharedVibes
  const firestoreTodayVibe = useMemo(() => {
    const today = todayStr();
    const found = sharedVibes.find((v) => v.userId === currentUser && v.date === today);
    if (found) {
      return {
        date: found.date,
        vibeId: found.vibeId,
        songTitle: found.songTitle,
        songArtist: found.songArtist,
      };
    }
    return null;
  }, [sharedVibes, currentUser]);

  // Sync state if Firestore loads
  useEffect(() => {
    if (firestoreTodayVibe) {
      setTodayVibe(firestoreTodayVibe);
      saveTodayVibe(firestoreTodayVibe);
    }
  }, [firestoreTodayVibe]);

  // ── Listen for admin reset event ──
  useEffect(function () {
    function handleReset() {
      setTodayVibe(null);
      setVibeHistory([]);
      setIsPlaying(false);
      setVinylSpin(false);
      saveVibeHistory([]);
    }
    window.addEventListener("dailyVinylReset", handleReset);
    return function () { window.removeEventListener("dailyVinylReset", handleReset); };
  }, []);

  // ── Check if today's vibe is still valid ──
  useEffect(() => {
    const today = todayStr();
    if (todayVibe && todayVibe.date !== today) {
      // Move to history, reset for new day
      const updatedHistory = [todayVibe, ...vibeHistory].slice(0, 14); // keep 14 days
      setVibeHistory(updatedHistory);
      saveVibeHistory(updatedHistory);
      setTodayVibe(null);
      setIsPlaying(false);
      setVinylSpin(false);
      saveTodayVibe(null!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Spin vinyl when playing ──
  useEffect(() => {
    if (isPlaying) {
      setVinylSpin(true);
    } else {
      const t = setTimeout(() => setVinylSpin(false), 600);
      return () => clearTimeout(t);
    }
  }, [isPlaying]);

  // ── Handle vibe selection ──
  const selectVibe = useCallback(
    async (vibe: VibeDef) => {
      if (todayVibe) {
        // If already selected today, just replay the vibe (search again)
        triggerHaptic("medium");
        return;
      }

      triggerHaptic("medium");
      setSearching(vibe.id);

      // Search YouTube for a song matching this vibe
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
      if (!apiKey) {
        // Fallback: save the vibe without a song
        const entry: DailyVibeEntry = {
          date: todayStr(),
          vibeId: vibe.id,
          songTitle: "No API key",
          songArtist: "Configure VITE_YOUTUBE_API_KEY",
        };
        setTodayVibe(entry);
        saveTodayVibe(entry);
        saveVibeToFirestore(entry);
        setIsPlaying(false);
        setSearching(null);
        return;
      }

      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&order=relevance&maxResults=20&q=${encodeURIComponent(
            `${vibe.searchQuery} official`
          )}&key=${apiKey}`
        );
        const json = await res.json();
        const items = json.items ?? [];
        if (!items.length) {
          // Save vibe without song
          const entry: DailyVibeEntry = {
            date: todayStr(),
            vibeId: vibe.id,
            songTitle: "No results",
            songArtist: "Try a different vibe",
          };
          setTodayVibe(entry);
          saveTodayVibe(entry);
          saveVibeToFirestore(entry);
          setSearching(null);
          return;
        }

        // Fetch videos details for precise durations and metadata (part=contentDetails,snippet)
        const videoIds = items.map((it: any) => it.id?.videoId).filter(Boolean);
        let detailedItems = [];
        if (videoIds.length > 0) {
          try {
            const detailsRes = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(",")}&key=${apiKey}`
            );
            const detailsJson = await detailsRes.json();
            detailedItems = detailsJson.items ?? [];
          } catch (err) {
            console.warn("Failed to fetch video details, fallback to search items", err);
          }
        }

        const useDetails = detailedItems.length > 0;
        const candidatesSource = useDetails ? detailedItems : items;

        const scoredCandidates = candidatesSource.map((it: any) => {
          const score = scoreYouTubeVideo(it);
          const durationIso = it.contentDetails?.duration;
          const durationMs = durationIso ? parseIsoDuration(durationIso) : 0;
          return { item: it, score, durationMs };
        });

        // Skip videos that are < 2 minutes (120000ms) or > 8 minutes (480000ms)
        const filteredCandidates = scoredCandidates.filter((c: any) => {
          if (!useDetails) return true; // Can't filter if no duration info
          return c.durationMs >= 120000 && c.durationMs <= 480000;
        });

        const finalCandidates = filteredCandidates.length > 0 ? filteredCandidates : scoredCandidates;

        // Sort by score descending
        finalCandidates.sort((a: any, b: any) => b.score - a.score);

        // Ambil hanya Top 5
        const topCandidates = finalCandidates.slice(0, Math.min(5, finalCandidates.length));

        // Random dari Top 5
        const randomCandidate = topCandidates[Math.floor(Math.random() * topCandidates.length)];

        const item = randomCandidate.item;
        const videoId: string = typeof item.id === "string" ? item.id : (item.id?.videoId || "");
        const title: string = item.snippet?.title || "YouTube Track";
        const artist: string = item.snippet?.channelTitle || "";
        const artwork: string = item.snippet?.thumbnails?.medium?.url || "";
        const durationMs = randomCandidate.durationMs || (await fetchVideoDuration(videoId));

        // Play the song through the shared player
        syncSongToPartner({
          title,
          artist,
          album: `Daily Vibe: ${vibe.label}`,
          artwork,
          durationMs,
          progressMs: 0,
          isPlaying: true,
          videoId,
        });

        setIsPlaying(true);

        const entry: DailyVibeEntry = {
          date: todayStr(),
          vibeId: vibe.id,
          songTitle: title,
          songArtist: artist,
        };
        setTodayVibe(entry);
        saveTodayVibe(entry);
        saveVibeToFirestore(entry, videoId, artwork, durationMs);
      } catch {
        // Save vibe without song on error
        const entry: DailyVibeEntry = {
          date: todayStr(),
          vibeId: vibe.id,
          songTitle: "Search failed",
          songArtist: "Check connection",
        };
        setTodayVibe(entry);
        saveTodayVibe(entry);
        saveVibeToFirestore(entry);
      } finally {
        setSearching(null);
      }
    },
    [todayVibe, syncSongToPartner, saveVibeToFirestore]
  );

  // ── Active vibe definition ──
  const activeVibe = useMemo(
    () => VIBES.find((v) => v.id === todayVibe?.vibeId) || null,
    [todayVibe]
  );

  // ── Day labels ──
  function dayLabel(offset: number): string {
    if (offset === 0) return "Today";
    if (offset === 1) return "Yest.";
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }

  // ── History emoji summary for last 7 days comparing both users ──
  const comparisonLast7Days = useMemo(() => {
    const days: {
      date: string;
      label: string;
      userA: { entry: any; vibeDef: VibeDef | null };
      userB: { entry: any; vibeDef: VibeDef | null };
    }[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      
      const entryA = sharedVibes.find(v => v.userId === "user_a" && v.date === dateStr) || null;
      const entryB = sharedVibes.find(v => v.userId === "user_b" && v.date === dateStr) || null;
      
      const vibeDefA = entryA ? (VIBES.find(v => v.id === entryA.vibeId) || null) : null;
      const vibeDefB = entryB ? (VIBES.find(v => v.id === entryB.vibeId) || null) : null;

      days.push({
        date: dateStr,
        label: dayLabel(i),
        userA: { entry: entryA, vibeDef: vibeDefA },
        userB: { entry: entryB, vibeDef: vibeDefB }
      });
    }
    return days;
  }, [sharedVibes]);

  // ── Shared song history (last 7 days of entries, sorted) ──
  const songHistory = useMemo(() => {
    return [...sharedVibes].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });
  }, [sharedVibes]);

  // ── Replay a song from shared history ──
  const playSong = useCallback((song: any) => {
    if (!song.videoId) return;
    triggerHaptic("medium");
    syncSongToPartner({
      title: song.songTitle,
      artist: song.songArtist,
      album: `Daily Vibe: ${VIBES.find((v) => v.id === song.vibeId)?.label || "Shared Vibe"}`,
      artwork: song.artwork || "",
      durationMs: song.durationMs || 180000,
      progressMs: 0,
      isPlaying: true,
      videoId: song.videoId,
    });
    setIsPlaying(true);
  }, [syncSongToPartner]);

  return (
    <div className="relative px-1 py-4 sm:p-6" id="daily-vibe-vinyl-container">
      <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
        {/* ── Header ── */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold font-mono uppercase tracking-wider shadow-xs">
            <Disc className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" style={{ animationDuration: "5s" }} /> 
            Analog Mood Station
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-main)] font-serif mt-1 tracking-tight">
            Daily Vibe Vinyl
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm">
            Spin today's romantic mood to synchronize a themed track across your shared treehouse.
          </p>
        </div>

        {/* ── Vintage Wood Cabinet Turntable Deck Frame ── */}
        <div className="relative w-full max-w-sm sm:max-w-md mx-auto p-1 rounded-[36px] bg-gradient-to-br from-[#5c4033] via-[#3d2b1f] to-[#2b1e15] shadow-2xl border-2 border-stone-900/60">
          {/* Main turntable chassis faceplate */}
          <div className="relative w-full p-5 sm:p-6 rounded-[32px] bg-gradient-to-br from-[#faf6ee] to-[#ebd9be] dark:from-[#211a15] dark:to-[#140f0c] border border-amber-900/10 shadow-inner flex flex-col items-center overflow-hidden">
            {/* Skeuomorphic corner brass rivets */}
            <div className="absolute top-3.5 left-3.5 w-2 h-2 rounded-full bg-gradient-to-br from-yellow-200 via-amber-500 to-yellow-800 border border-yellow-900/40 shadow-xs" />
            <div className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-gradient-to-br from-yellow-200 via-amber-500 to-yellow-800 border border-yellow-900/40 shadow-xs" />
            <div className="absolute bottom-3.5 left-3.5 w-2 h-2 rounded-full bg-gradient-to-br from-yellow-200 via-amber-500 to-yellow-800 border border-yellow-900/40 shadow-xs" />
            <div className="absolute bottom-3.5 right-3.5 w-2 h-2 rounded-full bg-gradient-to-br from-yellow-200 via-amber-500 to-yellow-800 border border-yellow-900/40 shadow-xs" />

            {/* Subtle wood grains pattern layer */}
            <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none mix-blend-overlay bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* Deck branding and details */}
            <div className="w-full flex items-center justify-between mb-4 border-b border-[#8e7b64]/15 dark:border-[#524130]/25 pb-2.5 z-10">
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-mono font-black tracking-widest text-[#8e7b64] dark:text-[#a18c72] uppercase">HIFI STEREO SYSTEM</span>
                <span className="text-[7px] font-mono font-bold text-[#8e7b64]/70 dark:text-[#a18c72]/60 mt-0.5">MODEL NO. GN-1000</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Vintage VU Level Meter */}
                <div className="w-11 h-6 bg-[#eae0cb] dark:bg-stone-900 border border-[#8e7b64]/30 rounded-md relative overflow-hidden flex items-end justify-center px-1 pb-0.5">
                  <div className="absolute inset-0 bg-[radial-gradient(#e0cfa7_1px,transparent_1px)] [background-size:4px_4px] opacity-20" />
                  <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-red-500/10 to-transparent" />
                  <motion.div
                    className="w-0.5 h-4 bg-rose-600 origin-bottom rounded-full"
                    animate={isPlaying ? { rotate: [-15, 30, -5, 25, 0, 35, -10] } : { rotate: -25 }}
                    transition={isPlaying ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" } : { duration: 0.5 }}
                    style={{ transformOrigin: "bottom center" }}
                  />
                  <span className="absolute bottom-0 text-[5px] font-mono text-[#8e7b64]/70 font-bold">VU</span>
                </div>

                <div className="flex items-center gap-1.5 bg-[#eae0cb] dark:bg-[#2c221b] px-2 py-1 rounded-md border border-[#8e7b64]/20">
                  <span className={`w-1.5 h-1.5 rounded-full ${vinylSpin ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]' : 'bg-stone-300 dark:bg-stone-600'}`} />
                  <span className="text-[8px] font-mono font-black text-[#8e7b64] dark:text-[#a18c72] uppercase">33 RPM</span>
                </div>
              </div>
            </div>

            {/* ── Vinyl Record and Tonearm Container ── */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-[#ebdcb9]/40 dark:bg-black/35 rounded-full p-2 border border-[#8e7b64]/15 dark:border-stone-800 shadow-inner z-10">
              {/* Vinyl disc */}
              <motion.div
                animate={vinylSpin ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  vinylSpin
                    ? { repeat: Infinity, duration: 4, ease: "linear" }
                    : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                }
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, #161616, #2d2d2d, #161616, #333333, #161616, #262626, #161616, #3a3a3a, #161616)`,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.35), inset 0 0 40px rgba(0,0,0,0.5)",
                  border: "4px solid #202020",
                }}
              >
                {/* Vinyl grooves */}
                <div className="absolute inset-[6%] rounded-full border border-[#444]/25" />
                <div className="absolute inset-[14%] rounded-full border border-[#333]/30" />
                <div className="absolute inset-[22%] rounded-full border border-[#444]/20" />
                <div className="absolute inset-[30%] rounded-full border border-[#333]/25" />
                <div className="absolute inset-[38%] rounded-full border border-[#444]/15" />
              </motion.div>

              {/* Center label */}
              <motion.div
                animate={vinylSpin ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  vinylSpin
                    ? { repeat: Infinity, duration: 4, ease: "linear" }
                    : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                }
                className="absolute w-[40%] h-[40%] rounded-full flex flex-col items-center justify-center z-10"
                style={{
                  background: activeVibe
                    ? `linear-gradient(135deg, ${activeVibe.color}25, ${activeVibe.color}45, ${activeVibe.color}15)`
                    : "linear-gradient(135deg, #fdfaf4, #ebd9be)",
                  border: `3px solid ${activeVibe?.color || "#b8a385"}35`,
                  boxShadow: activeVibe
                    ? `0 0 15px ${activeVibe.color}25, inset 0 2px 6px rgba(0,0,0,0.1)`
                    : "0 2px 6px rgba(0,0,0,0.06), inset 0 2px 4px rgba(255,255,255,0.8)",
                }}
              >
                {activeVibe ? (
                  <>
                    <span className="text-2xl sm:text-3xl drop-shadow-sm">{activeVibe.emoji}</span>
                    <span
                      className="text-[8px] font-black mt-1 text-center leading-tight tracking-wider uppercase px-1"
                      style={{ color: activeVibe.color }}
                    >
                      {activeVibe.label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xl opacity-40">🎵</span>
                    <span className="text-[7px] font-black mt-1 text-[#8e7b64] uppercase tracking-widest text-center leading-tight px-1">
                      Select Vibe
                    </span>
                  </>
                )}
                {/* Spindle hole */}
                <div className="absolute w-3 h-3 rounded-full bg-[#111] border-2 border-[#b8a385]/50 flex items-center justify-center shadow-inner" />
              </motion.div>

              {/* Detailed Skeuomorphic Tonearm */}
              <motion.div
                className="absolute -top-4 -right-4 w-24 h-24 z-20 pointer-events-none"
                initial={{ rotate: -45 }}
                animate={vinylSpin ? { rotate: -6 } : { rotate: -45 }}
                transition={{ type: "spring", stiffness: 80, damping: 14 }}
                style={{ transformOrigin: "75% 25%" }}
              >
                {/* Metal Base Pivot */}
                <div className="absolute top-[15%] right-[15%] w-9 h-9 rounded-full bg-gradient-to-br from-[#999] via-[#bbb] to-[#555] shadow-lg flex items-center justify-center">
                  <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-br from-[#bbb] via-[#eee] to-[#777] shadow-sm flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#333]" />
                  </div>
                </div>
                {/* The Arm Line */}
                <div 
                  className="absolute top-[28%] right-[25%] w-1.5 h-20 origin-top rounded-full bg-gradient-to-r from-[#aaa] via-[#ddd] to-[#999] shadow-md"
                  style={{ transform: "rotate(23deg)" }}
                />
                {/* Headshell/Cartridge */}
                <div 
                  className="absolute top-[85%] right-[5%] w-4.5 h-6.5 rounded-[3px] bg-[#222] shadow-md border border-stone-800"
                  style={{ transform: "rotate(28deg)" }}
                >
                  {/* Needle pivot */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#d4af37] rounded-full shadow-inner animate-pulse" />
                </div>
              </motion.div>
            </div>

            {/* Turntable Control Panel (pitch fader, start stop dial) */}
            <div className="w-full mt-6 pt-3 border-t border-[#8e7b64]/15 dark:border-[#524130]/25 flex items-center justify-between text-[#8e7b64] z-10">
              {/* Start/Stop round power knob */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => selectVibe(VIBES[Math.floor(Math.random() * VIBES.length)])}
                  className="relative w-9 h-9 rounded-full bg-gradient-to-br from-stone-200 to-stone-400 dark:from-stone-700 dark:to-stone-900 border border-stone-300 dark:border-stone-600 shadow-md flex items-center justify-center cursor-pointer active:scale-90 transition-all hover:brightness-105"
                  title="Surprise Vibe Mix"
                  id="auto-spin-btn"
                >
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-br from-[#ebdcb9] to-[#d4af37] border ${vinylSpin ? 'border-emerald-500 shadow-xs animate-pulse' : 'border-stone-300'}`} />
                </button>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[8px] font-black font-mono tracking-wider uppercase text-[#8e7b64] dark:text-[#a18c72]">AUTO SPIN</span>
                  <span className="text-[6px] font-bold text-[#8e7b64]/70 dark:text-[#a18c72]/60 mt-0.5">SHUFFLE MIX</span>
                </div>
              </div>

              {/* Pitch slider track */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[7px] font-black font-mono uppercase tracking-wider text-[#8e7b64] dark:text-[#a18c72]">Tone Pitch</span>
                <div className="w-24 h-2 bg-stone-300 dark:bg-stone-800 rounded-full relative flex items-center">
                  <div className="absolute inset-0 bg-inner-shadow-custom rounded-full" />
                  <motion.div 
                    animate={{ x: vinylSpin ? 24 : -24 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="absolute left-1/2 -ml-2 w-4 h-3.5 bg-gradient-to-br from-[#d4af37] via-[#aa7c11] to-[#805c0c] rounded-[3px] shadow-md border border-[#8e7b64]/30 cursor-pointer flex flex-col justify-between py-0.5"
                  >
                    <span className="w-full h-0.5 bg-[#ebdcb9]/40" />
                    <span className="w-full h-0.5 bg-[#ebdcb9]/40" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Vibe Selection Grid ── */}
        <AnimatePresence mode="wait">
          {!todayVibe ? (
            <motion.div
              key="vibe-grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <p className="text-[10px] font-black text-[var(--text-muted)] mb-4 text-center uppercase tracking-widest font-mono">
                ✦ Select Today's Couple Vibe ✦
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {VIBES.map((vibe, idx) => (
                  <motion.button
                    key={vibe.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ scale: 1.04, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectVibe(vibe)}
                    disabled={searching !== null}
                    id={`vibe-btn-${vibe.id}`}
                    className="group relative flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer disabled:opacity-50 bg-white/70 dark:bg-stone-900/30 backdrop-blur-md shadow-sm hover:shadow-lg overflow-hidden border-stone-200 dark:border-stone-800"
                    style={{
                      boxShadow: `0 4px 10px rgba(0,0,0,0.02), inset 0 2px 2px rgba(255,255,255,0.7), 0 0 0 1px ${vibe.color}15`,
                    }}
                  >
                    {/* Glowing subtle background corresponding to vibe color */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300"
                      style={{ backgroundColor: vibe.color }}
                    />
                    
                    {/* Mini peeking vinyl disc effect inside sleeve */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 rounded-l-full bg-zinc-950 border border-zinc-800 translate-x-3 group-hover:translate-x-1.5 transition-transform duration-300 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>

                    {/* Badge Icon Circular Frame */}
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner transition-transform duration-300 group-hover:rotate-12 relative z-10"
                      style={{
                        background: `linear-gradient(135deg, ${vibe.color}15, ${vibe.color}35)`,
                        border: `1.5px solid ${vibe.color}25`
                      }}
                    >
                      {searching === vibe.id ? (
                        <RotateCw className="w-4 h-4 animate-spin" style={{ color: vibe.color }} />
                      ) : (
                        <span className="text-xl drop-shadow-xs">{vibe.emoji}</span>
                      )}
                    </div>
                    
                    <span className="text-xs font-black tracking-wide relative z-10" style={{ color: vibe.color }}>
                      {vibe.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="vibe-active"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full space-y-4"
            >
              {/* Active record sleeve card with peeking vinyl disk */}
              <div className="relative w-full overflow-hidden bg-gradient-to-br from-white to-[#FAF8F5] dark:from-stone-900 dark:to-[#171311] p-5 rounded-2xl border-2 border-[var(--border-color)] shadow-xl flex items-center gap-4">
                {/* Sleeve Left Side Custom Art Case */}
                <div 
                  className="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl shadow-lg border-2 relative"
                  style={{
                    background: `linear-gradient(135deg, ${activeVibe?.color}22, ${activeVibe?.color}44)`,
                    borderColor: activeVibe?.color || "var(--primary)"
                  }}
                >
                  <span className="relative z-10 drop-shadow-sm">{activeVibe?.emoji || "🎵"}</span>
                  <div className="absolute inset-0 rounded-lg bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] opacity-15" />
                </div>

                {/* Sleeve Right Side (Details) */}
                <div className="flex-1 min-w-0 text-left space-y-1">
                  <span className="inline-block text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase shadow-xs" style={{ backgroundColor: `${activeVibe?.color}15`, color: activeVibe?.color }}>
                    {activeVibe?.label} Groove Active
                  </span>
                  
                  <h4 className="text-xs sm:text-sm font-black text-[var(--text-main)] truncate mt-1">
                    {todayVibe?.songTitle || "Searching..."}
                  </h4>
                  <p className="text-[10px] text-[var(--text-muted)] truncate font-medium">
                    {todayVibe?.songArtist || "Synchronizing with treehouse room"}
                  </p>
                </div>

                {/* Sleeve Peeking Vinyl Disk on Right Side */}
                <div className="relative w-14 h-14 flex-shrink-0 rounded-full bg-zinc-950 border border-zinc-800 shadow-md flex items-center justify-center animate-spin" style={{ animationDuration: "5s" }}>
                  <div className="w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <div className="absolute w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                  {/* Vinyl grooving visualizer line */}
                  <div className="absolute inset-2 rounded-full border border-stone-800/60" />
                </div>
              </div>

              {/* Music Spectrum Waves */}
              {isPlaying && (
                <div className="flex items-center justify-center gap-2.5 bg-[var(--primary)]/5 border border-[var(--primary)]/10 py-3 px-4 rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-[var(--primary)]">Coupled Sync:</span>
                  <div className="flex items-end gap-1 h-3.5">
                    {[...Array(8)].map((_, i) => (
                      <motion.span
                        key={i}
                        animate={{ height: ["4px", "14px", "4px"] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.5 + i * 0.12,
                          ease: "easeInOut",
                        }}
                        className="w-1 rounded-full"
                        style={{ backgroundColor: activeVibe?.color || "var(--primary)" }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)] ml-1 font-semibold">Broadcasting now</span>
                </div>
              )}

              {/* Reset daily limit info */}
              <p className="text-[9px] text-[var(--text-muted)] text-center font-bold tracking-wide">
                ✨ One beautiful mood entry today. Tune back in tomorrow!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Vibe History (last 7 days) ── */}
        <div className="w-full border-t border-[var(--border-color)]/70 pt-4 mt-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            id="vibe-history-toggle-btn"
            className="flex items-center gap-2 mx-auto px-4 py-2.5 rounded-xl bg-white/60 dark:bg-black/15 border border-[var(--border-color)]/60 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/80 dark:hover:bg-black/20 transition-all cursor-pointer shadow-xs"
          >
            <Music className="w-3.5 h-3.5 text-[var(--primary)] animate-pulse" />
            Recent vibes history
            <motion.span
              animate={{ rotate: showHistory ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="inline-block"
            >
              ▼
            </motion.span>
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden space-y-4 pt-4"
              >
                {/* ── Visual Comparison Grid ── */}
                <div className="bg-white/40 dark:bg-black/10 rounded-xl p-3 border border-[var(--border-color)]/50 space-y-3">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] pb-1 border-b border-[var(--border-color)]/30">
                    <Calendar className="w-3 h-3 text-[var(--primary)]" />
                    <span>7-Day Vibe Map</span>
                  </div>

                  {/* Row headers for days */}
                  <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                    <div className="text-[8px] font-bold text-[var(--text-muted)]">Day</div>
                    <div className="flex justify-between gap-1">
                      {comparisonLast7Days.map((day, idx) => (
                        <div key={idx} className="flex-1 text-center text-[7px] font-bold font-mono text-[var(--text-muted)] uppercase tracking-tight">
                          {day.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User A row */}
                  <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-4 h-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center overflow-hidden border border-[var(--border-color)] flex-shrink-0">
                        {userA.avatar ? (
                          <img src={userA.avatar} alt={userA.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[7px] font-black uppercase">{userA.name?.slice(0, 2) || "A"}</span>
                        )}
                      </div>
                      <span className="text-[8px] font-black text-[var(--text-main)] truncate">
                        {currentUser === "user_a" ? "Me (A)" : userA.name || "User A"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-1">
                      {comparisonLast7Days.map((day, idx) => {
                        const { entry, vibeDef } = day.userA;
                        return (
                          <div
                            key={idx}
                            onClick={() => entry && playSong(entry)}
                            className={`flex-1 aspect-square rounded-full flex items-center justify-center text-xs border transition-all duration-300 relative group cursor-pointer ${
                              entry ? "hover:-translate-y-0.5 hover:scale-105 hover:shadow-xs" : "border-dashed border-[var(--border-color)] opacity-40"
                            }`}
                            style={{
                              borderColor: vibeDef ? `${vibeDef.color}55` : "var(--border-color)",
                              backgroundColor: vibeDef ? `${vibeDef.color}15` : "transparent",
                            }}
                            title={entry ? `${userA.name}: ${vibeDef?.label} - ${entry.songTitle}` : "No vibe yet"}
                          >
                            {vibeDef ? (
                              <>
                                <span className="drop-shadow-xs">{vibeDef.emoji}</span>
                                <span className="absolute bottom-0 w-1 h-1 rounded-full" style={{ backgroundColor: vibeDef.color }} />
                              </>
                            ) : (
                              <span className="text-[6px] text-[var(--text-muted)]/50 font-mono">•</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* User B row */}
                  <div className="grid grid-cols-[80px_1fr] items-center gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-4 h-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center overflow-hidden border border-[var(--border-color)] flex-shrink-0">
                        {userB.avatar ? (
                          <img src={userB.avatar} alt={userB.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[7px] font-black uppercase">{userB.name?.slice(0, 2) || "B"}</span>
                        )}
                      </div>
                      <span className="text-[8px] font-black text-[var(--text-main)] truncate">
                        {currentUser === "user_b" ? "Me (B)" : userB.name || "User B"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-1">
                      {comparisonLast7Days.map((day, idx) => {
                        const { entry, vibeDef } = day.userB;
                        return (
                          <div
                            key={idx}
                            onClick={() => entry && playSong(entry)}
                            className={`flex-1 aspect-square rounded-full flex items-center justify-center text-xs border transition-all duration-300 relative group cursor-pointer ${
                              entry ? "hover:-translate-y-0.5 hover:scale-105 hover:shadow-xs" : "border-dashed border-[var(--border-color)] opacity-40"
                            }`}
                            style={{
                              borderColor: vibeDef ? `${vibeDef.color}55` : "var(--border-color)",
                              backgroundColor: vibeDef ? `${vibeDef.color}15` : "transparent",
                            }}
                            title={entry ? `${userB.name}: ${vibeDef?.label} - ${entry.songTitle}` : "No vibe yet"}
                          >
                            {vibeDef ? (
                              <>
                                <span className="drop-shadow-xs">{vibeDef.emoji}</span>
                                <span className="absolute bottom-0 w-1 h-1 rounded-full" style={{ backgroundColor: vibeDef.color }} />
                              </>
                            ) : (
                              <span className="text-[6px] text-[var(--text-muted)]/50 font-mono">•</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Detailed Music Log List ── */}
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[var(--border-color)]">
                  <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] px-1 mb-1">
                    <Music className="w-2.5 h-2.5" />
                    <span>Vibe Track Log</span>
                  </div>

                  {songHistory.length === 0 ? (
                    <div className="text-center py-4 text-[9px] font-semibold text-[var(--text-muted)] italic bg-white/20 dark:bg-black/5 rounded-xl border border-[var(--border-color)]/40">
                      No tunes shared in the last 7 days yet. Choose a vibe to start!
                    </div>
                  ) : (
                    songHistory.map((song, i) => {
                      const user = song.userId === "user_a" ? userA : userB;
                      const isMe = song.userId === currentUser;
                      const vibeDef = VIBES.find((v) => v.id === song.vibeId);

                      return (
                        <div
                          key={song.id || i}
                          onClick={() => song.videoId && playSong(song)}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-white/50 dark:bg-black/10 border border-[var(--border-color)]/40 hover:bg-white/80 dark:hover:bg-black/20 hover:border-[var(--primary)]/30 transition-all cursor-pointer group shadow-2xs"
                        >
                          {/* Left: Avatar & Who Badge */}
                          <div className="relative flex-shrink-0">
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-[var(--border-color)]/70 shadow-2xs">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-[var(--primary)]/10 flex items-center justify-center text-[8px] font-black uppercase">
                                  {user.name?.slice(0, 2) || "U"}
                                </div>
                              )}
                            </div>
                            <span
                              className={`absolute -bottom-1 -right-1 text-[5px] px-1 py-0.5 rounded-full font-black uppercase tracking-widest text-white shadow-2xs border border-white/20`}
                              style={{ backgroundColor: isMe ? "#10b981" : "#3b82f6" }}
                            >
                              {isMe ? "Me" : "Lover"}
                            </span>
                          </div>

                          {/* Middle: Title, Artist, Date */}
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] font-bold text-[var(--text-muted)]">
                                {song.date === todayStr() ? "Today" : song.date}
                              </span>
                              {vibeDef && (
                                <span
                                  className="text-[6px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                                  style={{ backgroundColor: `${vibeDef.color}15`, color: vibeDef.color }}
                                >
                                  {vibeDef.emoji} {vibeDef.label}
                                </span>
                              )}
                            </div>
                            <h5 className="text-[10px] font-extrabold text-[var(--text-main)] truncate mt-0.5 group-hover:text-[var(--primary)] transition-colors">
                              {song.songTitle}
                            </h5>
                            <p className="text-[8px] font-semibold text-[var(--text-muted)] truncate">
                              {song.songArtist}
                            </p>
                          </div>

                          {/* Right: Play Button / Spinner */}
                          {song.videoId && (
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-all shadow-3xs">
                              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
