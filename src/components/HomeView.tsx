/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useCouple } from "../context/CoupleContext";
import { Memory } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../firebaseClient";
import { onSnapshot, collection, addDoc, deleteDoc, doc, query, orderBy, limit } from "firebase/firestore";
import {
  Heart,
  Calendar,
  CloudSun,
  Smile,
  Music,
  Compass,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Gift,
  CloudLightning,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  Thermometer,
  Wind,
  MapPin,
  AlertCircle,
  Trophy,
  CheckCircle2,
  Plus,
  Play,
  Pause,
  ExternalLink,
  Disc,
  Target,
  Flame,
  Sprout,
  Droplets,
  SkipForward,
  SkipBack,
  Wifi,
  WifiOff,
  Camera,
  X,
  Loader2,
  Shuffle,
  Repeat,
  Repeat1,
  Mic2,
  ChevronUp,
  ChevronDown,
  ListMusic,
  Search,
} from "lucide-react";

const quotes = [
  "In your smile, I see something more beautiful than the stars. ✨",
  "No matter how grey the day is, thinking of you makes my heart blossom. 🌸",
  "If I had a flower for every time I thought of you, I could walk through my garden forever. 🌿",
  "We are made of different stars, but we shine brightest when we are together. ☕",
  "My favorite coffee place is wherever you are sitting across from me. ☕",
  "You make the ordinary moments feel like Studio Ghibli magic. 🏰",
  "With you, life feels like a warm yellow sweater on a chilly autumn afternoon.",
  "You are my favorite notification. 📱💖",
  "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine. 💕",
  "You are my today and all of my tomorrows. 🌅",
  "Whatever our souls are made of, yours and mine are the same. ✨",
  "To love and be loved is to feel the sun from both sides. ☀",
  "I look at you and see the rest of my life in front of my eyes. 💖",
  "The best thing to hold onto in life is each other. 🤝",
  "If I know what love is, it is because of you. 🌸",
  "You are the piece of me I didn't know was missing. 🧩",
  "My heart is and always will be yours. 🔐",
  "To the world you may be one person, but to me you are the world. 🌍",
  "Grow old with me! The best is yet to be. 🪴",
  "Loving you is both my biggest adventure and my safest sanctuary. 🏰",
  "Our love story is my absolute favorite. 📖"
];

// Helper for formatting relative times
const formatRelativeTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  } catch (e) {
    return "Recently";
  }
};

interface ArtisticWeatherIconProps {
  code: number;
  isDay?: boolean;
  className?: string;
}

const ArtisticWeatherIcon: React.FC<ArtisticWeatherIconProps> = ({ code, isDay = true, className = "w-8 h-8" }) => {
  // Map weather code to general states: sunny, cloudy, rainy, snowy, stormy
  let state: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" = "sunny";
  if (code === 0) state = "sunny";
  else if (code === 1 || code === 2 || code === 3) state = "cloudy";
  else if (code === 45 || code === 48) state = "cloudy";
  else if (code === 51 || code === 53 || code === 55) state = "rainy";
  else if (code === 61 || code === 63 || code === 65) state = "rainy";
  else if (code === 71 || code === 73 || code === 75) state = "snowy";
  else if (code === 80 || code === 81 || code === 82) state = "rainy";
  else if (code === 95 || code === 96 || code === 99) state = "stormy";

  if (state === "sunny") {
    return (
      <svg
        className={`${className} hover:scale-110 transition-transform duration-300`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="artistic-icon-sunny"
      >
        <circle cx="50" cy="50" r="20" fill="#dda15e" opacity="0.85" />
        <path
          d="M50 12 C52 22, 48 22, 50 12 Z M50 88 C48 78, 52 78, 50 88 Z"
          stroke="#bc6c25"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M12 50 C22 52, 22 48, 12 50 Z M88 50 C78 48, 78 52, 88 50 Z"
          stroke="#bc6c25"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M23 23 C31 29, 29 31, 23 23 Z M77 77 C69 71, 71 69, 77 77 Z"
          stroke="#bc6c25"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M77 23 C71 29, 69 31, 77 23 Z M23 77 C29 69, 31 71, 23 77 Z"
          stroke="#bc6c25"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="50" cy="50" r="12" stroke="#283618" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    );
  }

  if (state === "cloudy") {
    return (
      <svg
        className={`${className} hover:scale-110 transition-transform duration-300`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="artistic-icon-cloudy"
      >
        {isDay && (
          <circle cx="62" cy="38" r="14" fill="#dda15e" opacity="0.6" />
        )}
        <path
          d="M25 65 C20 65, 16 60, 16 54 C16 47, 22 43, 28 43 C30 32, 40 25, 52 25 C64 25, 73 34, 75 45 C82 45, 88 50, 88 57 C88 64, 82 65, 78 65 Z"
          fill="#fbf7f0"
          stroke="#283618"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M32 50 C38 48, 44 48, 48 51"
          stroke="#bc6c25"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M54 58 C62 56, 68 58, 72 61"
          stroke="#bc6c25"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (state === "rainy") {
    return (
      <svg
        className={`${className} hover:scale-110 transition-transform duration-300`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="artistic-icon-rainy"
      >
        <path
          d="M25 55 C20 55, 16 50, 16 44 C16 37, 22 33, 28 33 C30 22, 40 15, 52 15 C64 15, 73 24, 75 35 C82 35, 88 40, 88 47 C88 54, 82 55, 78 55 Z"
          fill="#f4eae1"
          stroke="#283618"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <g>
          <path
            d="M32 65 L28 77"
            stroke="#bc6c25"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M50 68 L46 82"
            stroke="#dda15e"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M68 64 L64 76"
            stroke="#bc6c25"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <path
          d="M24 84 C28 84, 30 82, 30 82"
          stroke="#283618"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M44 87 C48 87, 50 85, 50 85"
          stroke="#283618"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (state === "snowy") {
    return (
      <svg
        className={`${className} hover:scale-110 transition-transform duration-300`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="artistic-icon-snowy"
      >
        <path
          d="M25 55 C20 55, 16 50, 16 44 C16 37, 22 33, 28 33 C30 22, 40 15, 52 15 C64 15, 73 24, 75 35 C82 35, 88 40, 88 47 C88 54, 82 55, 78 55 Z"
          fill="#ffffff"
          stroke="#283618"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <g>
          <path d="M35 65 L35 73 M31 69 L39 69" stroke="#bc6c25" strokeWidth="2" strokeLinecap="round" />
          <path d="M50 68 L50 78 M45 73 L55 73" stroke="#dda15e" strokeWidth="2" strokeLinecap="round" />
          <path d="M65 65 L65 73 M61 69 L69 69" stroke="#bc6c25" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      className={`${className} hover:scale-110 transition-transform duration-300`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      id="artistic-icon-stormy"
    >
      <path
        d="M25 55 C20 55, 16 50, 16 44 C16 37, 22 33, 28 33 C30 22, 40 15, 52 15 C64 15, 73 24, 75 35 C82 35, 88 40, 88 47 C88 54, 82 55, 78 55 Z"
        fill="#eae0d5"
        stroke="#283618"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M52 52 L42 68 L54 68 L46 85"
        stroke="#bc6c25"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#dda15e"
      />
    </svg>
  );
};

// Define global window types for Spotify Playback SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

function daysUntilBirthday(birthdayStr: string): number | null {
  if (!birthdayStr) return null;
  const parts = birthdayStr.split("-");
  if (parts.length < 2) return null;

  let month = 0;
  let day = 0;
  if (parts[0].length === 4) {
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    month = parseInt(parts[0], 10) - 1;
    day = parseInt(parts[1], 10);
  }

  if (isNaN(month) || isNaN(day)) return null;

  const today = new Date();
  const currentYear = today.getFullYear();

  let nextBday = new Date(currentYear, month, day);
  today.setHours(0, 0, 0, 0);
  nextBday.setHours(0, 0, 0, 0);

  if (nextBday.getTime() < today.getTime()) {
    nextBday.setFullYear(currentYear + 1);
  }

  const diffTime = nextBday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatBirthdayDisplay(birthdayStr: string): string {
  if (!birthdayStr) return "Not set";
  const parts = birthdayStr.split("-");
  if (parts.length < 2) return "Not set";

  let month = 0;
  let day = 0;
  if (parts[0].length === 4) {
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  } else {
    month = parseInt(parts[0], 10) - 1;
    day = parseInt(parts[1], 10);
  }

  if (isNaN(month) || isNaN(day)) return "Not set";
  const date = new Date(2000, month, day);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function formatAnniversaryDisplay(dateStr: string): string {
  if (!dateStr) return "October 15";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "October 15";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export default function HomeView() {
  const {
    currentUser,
    theme,
    darkMode,
    userA,
    userB,
    updateProfile,
    currentSong,
    setSongPlayState,
    anniversaryDate,
    birthdayA,
    birthdayB,
    awardXp,
    moodHistory,
    addMoodHistoryEntry,
    syncSongToPartner,
    updateSongProgress,
    memories,
  } = useCouple();

  const nextMilestoneTitle = "Our Next Anniversary";
  const nextMilestoneDate = useMemo(() => {
    if (!anniversaryDate) return "";
    const anniv = new Date(anniversaryDate);
    if (isNaN(anniv.getTime())) return "";
    const today = new Date();
    const currentYear = today.getFullYear();
    let nextAnniv = new Date(anniv);
    nextAnniv.setFullYear(currentYear);
    if (today > nextAnniv) {
      nextAnniv.setFullYear(currentYear + 1);
    }
    return nextAnniv.toISOString().split("T")[0];
  }, [anniversaryDate]);

  // ── Firestore Activity Logs Listener ──
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setActivityLogs(snap.docs.map((d) => ({
        id: d.id,
        userId: d.data().user_id,
        text: d.data().text,
        timestamp: d.data().timestamp
      })));
    }, (err) => {
      console.error("[activity_logs listener]", err);
    });
    return unsub;
  }, []);

  // STATE FOR SPOTLIGHT MEMORY OF THE DAY
  const [spotlightMemory, setSpotlightMemory] = useState<Memory | null>(null);
  const [rotationCountdown, setRotationCountdown] = useState<string>("24h");

  useEffect(() => {
    if (!memories || memories.length === 0) {
      setSpotlightMemory(null);
      return;
    }

    const memoriesWithImages = memories.filter(
      (m) => m.imageUrl && m.imageUrl.trim() !== ""
    );
    if (memoriesWithImages.length === 0) {
      setSpotlightMemory(null);
      return;
    }

    const selectSpotlight = () => {
      const storedId = localStorage.getItem("couple_spotlight_memory_id");
      const storedTime = localStorage.getItem("couple_spotlight_selected_at");
      const now = Date.now();
      let selected: Memory | undefined;

      if (storedId && storedTime) {
        const selectedAt = parseInt(storedTime, 10);
        // Check if less than 24 hours (86,400,000 ms)
        if (now - selectedAt < 24 * 60 * 60 * 1000) {
          selected = memoriesWithImages.find((m) => m.id === storedId);
        }
      }

      if (!selected) {
        const randomIndex = Math.floor(Math.random() * memoriesWithImages.length);
        selected = memoriesWithImages[randomIndex];
        localStorage.setItem("couple_spotlight_memory_id", selected.id);
        localStorage.setItem("couple_spotlight_selected_at", now.toString());
      }

      setSpotlightMemory(selected || null);
    };

    selectSpotlight();

    const updateCountdown = () => {
      const storedTime = localStorage.getItem("couple_spotlight_selected_at");
      if (storedTime) {
        const elapsed = Date.now() - parseInt(storedTime, 10);
        const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);

        if (remainingMs <= 0) {
          selectSpotlight();
        } else {
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setRotationCountdown(`${hours}h ${minutes}m`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 15000); // update every 15s

    return () => clearInterval(interval);
  }, [memories]);

  // Haptic feedback trigger for tactile mobile confirmation
  const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" = "light") => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      try {
        if (type === "light") {
          window.navigator.vibrate(12);
        } else if (type === "medium") {
          window.navigator.vibrate(35);
        } else if (type === "heavy") {
          window.navigator.vibrate(70);
        } else if (type === "success") {
          window.navigator.vibrate([20, 40, 20]);
        }
      } catch (err) {
        console.warn("Haptics check failed:", err);
      }
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  // Relationship Streak & Virtual Pet State (Calico Cat "Mimi")
  const [streakCount, setStreakCount] = useState<number>(() => {
    const stored = localStorage.getItem("couple_relationship_streak");
    return stored ? parseInt(stored, 10) : 18;
  });
  const [lastCheckInDate, setLastCheckInDate] = useState<string>(() => {
    return localStorage.getItem("couple_last_streak_date") || "";
  });
  const [plantParticles, setPlantParticles] = useState<{ id: number; x: number; y: number; type: "water" | "heart" | "sparkle" }[]>([]);

  const isCheckedInToday = lastCheckInDate === todayStr;

  const handleCheckIn = () => {
    if (isCheckedInToday) {
      triggerHaptic("success");
      triggerWaterAnimation();
      awardXp(5, "feeding extra treats to Mimi (+5 XP)");
      return;
    }

    const nextStreak = streakCount + 1;
    setStreakCount(nextStreak);
    setLastCheckInDate(todayStr);
    localStorage.setItem("couple_relationship_streak", nextStreak.toString());
    localStorage.setItem("couple_last_streak_date", todayStr);

    triggerHaptic("success");
    triggerWaterAnimation();
    awardXp(25, "feeding Mimi a treat and keeping our relationship streak alive! 🐱🐟");
  };

  const triggerWaterAnimation = () => {
    const newParticles: { id: number; x: number; y: number; type: "water" | "heart" | "sparkle" }[] = [];
    // Spawn only 6 lightweight interactive particles (fish, hearts, sparks) for perfect aesthetics and performance
    for (let i = 0; i < 6; i++) {
      newParticles.push({
        id: Math.random(),
        x: 20 + Math.random() * 60,
        y: 60 + Math.random() * 15,
        type: Math.random() > 0.6 ? "water" : (Math.random() > 0.5 ? "heart" : "sparkle")
      });
    }
    setPlantParticles(newParticles);

    setTimeout(() => {
      setPlantParticles([]);
    }, 1200);
  };

  // --- YouTube API Synced Listening Together implementation ---
  const SHARED_PLAYLIST_ID = "PLdf4QJ5Wy29c";

  interface PlaylistTrack {
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
  }

  interface LyricLine {
    time: number; // ms
    text: string;
  }

  function parseIsoDuration(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const h = parseInt(match[1] || "0", 10);
    const m = parseInt(match[2] || "0", 10);
    const s = parseInt(match[3] || "0", 10);
    return (h * 3600 + m * 60 + s) * 1000;
  }

  async function fetchVideoDuration(videoId: string): Promise<number> {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
    if (!apiKey || !videoId) return 0;
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`);
      const json = await res.json();
      const iso = json.items?.[0]?.contentDetails?.duration;
      return iso ? parseIsoDuration(iso) : 0;
    } catch {
      return 0;
    }
  }

  async function fetchVideoMeta(videoId: string): Promise<{ title: string; artist: string; artwork: string; durationMs: number } | null> {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
    if (!apiKey || !videoId) return null;
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
      const json = await res.json();
      const item = json.items?.[0];
      if (!item) return null;
      return {
        title: item.snippet?.title || "YouTube Track",
        artist: item.snippet?.channelTitle || "",
        artwork: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
        durationMs: item.contentDetails?.duration ? parseIsoDuration(item.contentDetails.duration) : 0,
      };
    } catch {
      return null;
    }
  }

  function parseLrc(raw: string): LyricLine[] {
    const timeTag = /\[(\d{2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    const lines: LyricLine[] = [];
    for (const rawLine of raw.split("\n")) {
      const tags = [...rawLine.matchAll(timeTag)];
      if (tags.length === 0) continue;
      const text = rawLine.replace(timeTag, "").trim();
      for (const tag of tags) {
        const min = parseInt(tag[1], 10);
        const sec = parseInt(tag[2], 10);
        const frac = tag[3] ? parseInt(tag[3].padEnd(3, "0").slice(0, 3), 10) : 0;
        lines.push({ time: min * 60000 + sec * 1000 + frac, text: text || "♪" });
      }
    }
    return lines.sort((a, b) => a.time - b.time);
  }

  function cleanSearchTerm(title: string, artist: string): { cleanTitle: string; cleanArtist: string } {
    let t = title;
    let a = artist;
    t = t.replace(/\(.*?\)/g, "");
    t = t.replace(/\[.*?\]/g, "");
    t = t.replace(/(official video|official audio|official lyric video|official music video|music video|lyric video|official|mv|audio|video)/gi, "");
    if (t.includes(" - ")) {
      const parts = t.split(" - ");
      if (parts.length === 2) {
        if (!a || a.toLowerCase() === "unknown artist" || a.toLowerCase() === parts[0].trim().toLowerCase() || parts[0].trim().toLowerCase().includes(a.toLowerCase())) {
          a = parts[0].trim();
        }
        t = parts[1];
      }
    }
    if (a.toLowerCase() === "unknown artist") {
      a = "";
    }
    return { cleanTitle: t.trim(), cleanArtist: a.trim() };
  }

  async function fetchLyrics(title: string, artist: string, signal: AbortSignal): Promise<{ lines: LyricLine[]; synced: boolean } | null> {
    if (!title.trim()) return null;
    const { cleanTitle, cleanArtist } = cleanSearchTerm(title, artist);
    const tryFetch = async (tName: string, aName: string): Promise<{ lines: LyricLine[]; synced: boolean } | null> => {
      try {
        const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(tName)}&artist_name=${encodeURIComponent(aName)}`;
        const res = await fetch(url, { signal });
        if (!res.ok) return null;
        const results = await res.json();
        if (!Array.isArray(results) || results.length === 0) return null;
        const best = results.find((r: any) => r.syncedLyrics) || results.find((r: any) => r.plainLyrics) || null;
        if (!best) return null;
        if (best.syncedLyrics) {
          const lines = parseLrc(best.syncedLyrics);
          return lines.length > 0 ? { lines, synced: true } : null;
        }
        if (best.plainLyrics) {
          const lines = best.plainLyrics.split("\n").filter((l: string) => l.trim()).map((text: string) => ({ time: 0, text }));
          return lines.length > 0 ? { lines, synced: false } : null;
        }
        return null;
      } catch {
        return null;
      }
    };
    let result = await tryFetch(cleanTitle, cleanArtist);
    if (!result && (cleanTitle !== title || cleanArtist !== artist)) {
      result = await tryFetch(title, artist);
    }
    return result;
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState("");
  const [lyricsLines, setLyricsLines] = useState<LyricLine[] | null>(null);
  const [lyricsSynced, setLyricsSynced] = useState(false);
  const [sortMode, setSortMode] = useState<"recent" | "oldest" | "az" | "za">("recent");
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState("");
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const [extractedColor, setExtractedColor] = useState<string>("rgba(239, 68, 68, 0.08)");

  useEffect(() => {
    if (!currentSong.artwork) {
      setExtractedColor("rgba(239, 68, 68, 0.08)");
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = currentSong.artwork;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          setExtractedColor(`rgba(${r}, ${g}, ${b}, 0.12)`);
        }
      } catch (e) {
        console.warn("Failed to extract color from artwork:", e);
      }
    };
    img.onerror = () => {
      setExtractedColor("rgba(239, 68, 68, 0.08)");
    };
  }, [currentSong.artwork]);

  // Load the shared romantic playlist once on mount
  useEffect(() => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
    if (!apiKey) { setPlaylistError("Add VITE_YOUTUBE_API_KEY to load the playlist."); return; }
    const ac = new AbortController();
    (async () => {
      setPlaylistLoading(true);
      setPlaylistError("");
      try {
        let allTracks: PlaylistTrack[] = [];
        let nextPageToken = "";
        do {
          const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${SHARED_PLAYLIST_ID}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ""}`;
          const res = await fetch(url, { signal: ac.signal });
          const json = await res.json();
          if (json.error) throw new Error(json.error.message || "Playlist request failed");

          const pageTracks: PlaylistTrack[] = (json.items || [])
            .filter((it: any) => it.snippet?.title && it.snippet.title !== "Deleted video" && it.snippet.title !== "Private video")
            .map((it: any) => ({
              videoId: it.snippet.resourceId?.videoId,
              title: it.snippet.title,
              artist: it.snippet.videoOwnerChannelTitle || it.snippet.channelTitle || "Unknown Artist",
              thumbnail: it.snippet.thumbnails?.medium?.url || it.snippet.thumbnails?.default?.url || "",
            }))
            .filter((t: PlaylistTrack) => !!t.videoId);

          allTracks = [...allTracks, ...pageTracks];
          nextPageToken = json.nextPageToken || "";
        } while (nextPageToken);

        setPlaylistTracks(allTracks);
      } catch (e: any) {
        if (e.name !== "AbortError") setPlaylistError("Couldn't load the shared playlist right now.");
      } finally {
        setPlaylistLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const sortedTracks = useMemo(() => {
    const list = [...playlistTracks];
    if (sortMode === "oldest") {
      return list.reverse();
    }
    if (sortMode === "az") {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortMode === "za") {
      return list.sort((a, b) => b.title.localeCompare(a.title));
    }
    return list;
  }, [playlistTracks, sortMode]);

  // Sync activeIndex whenever the partner changes the track
  useEffect(() => {
    if (!currentSong.videoId || sortedTracks.length === 0) return;
    const idx = sortedTracks.findIndex((t) => t.videoId === currentSong.videoId);
    setActiveIndex(idx >= 0 ? idx : null);
  }, [currentSong.videoId, sortedTracks]);

  // Fetch synced lyrics whenever the track identity changes
  useEffect(() => {
    if (!currentSong.videoId || !currentSong.title) {
      setLyricsLines(null); setLyricsError(""); return;
    }
    const ac = new AbortController();
    (async () => {
      setLyricsLoading(true); setLyricsError(""); setLyricsLines(null);
      const result = await fetchLyrics(currentSong.title, currentSong.artist, ac.signal);
      if (ac.signal.aborted) return;
      if (!result) { setLyricsError("Lyrics not found for this track."); }
      else { setLyricsLines(result.lines); setLyricsSynced(result.synced); }
      setLyricsLoading(false);
    })();
    return () => ac.abort();
  }, [currentSong.videoId, currentSong.title, currentSong.artist]);

  // Which lyric line is "now" based on live playback progress
  const activeLineIndex = useMemo(() => {
    if (!lyricsLines || !lyricsSynced) return -1;
    let idx = -1;
    for (let i = 0; i < lyricsLines.length; i++) {
      if (lyricsLines[i].time <= currentSong.progressMs) idx = i; else break;
    }
    return idx;
  }, [lyricsLines, lyricsSynced, currentSong.progressMs]);

  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const lyricsLineRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Auto-scroll the active lyric line into view inside its container only
  useEffect(() => {
    if (activeLineIndex < 0 || !lyricsScrollRef.current) return;
    const activeEl = lyricsLineRefs.current[activeLineIndex];
    const container = lyricsScrollRef.current;
    if (activeEl && container) {
      const containerHeight = container.clientHeight;
      const elOffsetTop = activeEl.offsetTop;
      const elHeight = activeEl.clientHeight;
      const targetScroll = elOffsetTop - containerHeight / 2 + elHeight / 2;
      container.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  }, [activeLineIndex]);

  const playTrack = useCallback(async (track: { videoId: string; title: string; artist: string; artwork?: string; thumbnail?: string }) => {
    triggerHaptic("medium");
    const durationMs = await fetchVideoDuration(track.videoId);
    syncSongToPartner({
      title: track.title,
      artist: track.artist,
      album: "Romantic Vibe",
      artwork: track.artwork || track.thumbnail || "",
      durationMs,
      progressMs: 0,
      isPlaying: true,
      videoId: track.videoId,
    });
  }, [syncSongToPartner]);

  const cycleRepeat = useCallback(() => {
    triggerHaptic("light");
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const goToOffset = useCallback((offset: number) => {
    if (sortedTracks.length === 0) return;
    triggerHaptic("medium");
    const currentIndex = sortedTracks.findIndex((t) => t.videoId === currentSong.videoId);
    let nextIndex = 0;
    if (shuffleOn) {
      nextIndex = Math.floor(Math.random() * sortedTracks.length);
    } else {
      if (currentIndex === -1) {
        nextIndex = 0; // default to first song of playlist if current song is a searched custom track
      } else {
        nextIndex = (currentIndex + offset + sortedTracks.length) % sortedTracks.length;
      }
    }
    const nextTrack = sortedTracks[nextIndex];
    if (nextTrack) {
      playTrack({ videoId: nextTrack.videoId, title: nextTrack.title, artist: nextTrack.artist, artwork: nextTrack.thumbnail });
    }
  }, [sortedTracks, currentSong.videoId, shuffleOn, playTrack]);

  // Auto-play next song when current song finishes
  useEffect(() => {
    if (!currentSong.isPlaying || !currentSong.durationMs || currentSong.progressMs < currentSong.durationMs) {
      return;
    }
    const now = Date.now();
    const lastSkip = (window as any)._lastAutoSkipTime || 0;
    if (now - lastSkip < 4000) return;
    (window as any)._lastAutoSkipTime = now;

    if (repeatMode === "one") {
      playTrack({
        videoId: currentSong.videoId,
        title: currentSong.title,
        artist: currentSong.artist,
        artwork: currentSong.artwork
      });
    } else {
      goToOffset(1);
    }
  }, [currentSong.isPlaying, currentSong.progressMs, currentSong.durationMs, currentSong.videoId, currentSong.title, currentSong.artist, currentSong.artwork, repeatMode, playTrack, goToOffset]);

  const extractVideoId = (url: string): string => {
    if (!url.trim()) return "";
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|watch\?v=|\?v=)([\w-]{11})/);
    if (match) return match[1];
    if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
    return "";
  };

  const handleSearchOrPaste = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchError("");
    const pastedId = extractVideoId(q);
    if (pastedId) {
      setSearching(true);
      const meta = await fetchVideoMeta(pastedId);
      await playTrack({
        videoId: pastedId,
        title: meta?.title || "YouTube Track",
        artist: meta?.artist || "",
        artwork: meta?.artwork || "",
      });
      setSearching(false);
      setSearchQuery("");
      return;
    }

    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
    if (!apiKey) { setSearchError("Search needs a YouTube API key."); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&videoCategoryId=10&q=${encodeURIComponent(q)}&key=${apiKey}`
      );
      const json = await res.json();
      const item = json.items?.[0];
      if (!item) { setSearchError("No matching track found."); return; }
      await playTrack({
        videoId: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        artwork: item.snippet.thumbnails?.medium?.url || "",
      });
      setSearchQuery("");
    } catch {
      setSearchError("Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  }, [searchQuery, playTrack]);

  // --- Quote and milestone counting states ---
  const [fetchedQuote, setFetchedQuote] = useState<{ content: string; author: string } | null>(() => {
    try {
      const cached = localStorage.getItem("romantic_daily_quote");
      if (cached) return JSON.parse(cached);
    } catch (e) { }
    return null;
  });
  const [quoteLoading, setQuoteLoading] = useState(false);

  const fetchRomanticQuote = async (force = false) => {
    setQuoteLoading(true);
    try {
      const cachedTime = localStorage.getItem("romantic_daily_quote_time");
      const now = Date.now();
      if (!force && cachedTime && fetchedQuote && (now - parseInt(cachedTime, 10)) < 24 * 60 * 60 * 1000) {
        setQuoteLoading(false);
        return;
      }
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("https://api.quotable.io/random?tags=love", { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        if (data && data.content) {
          const newQuote = { content: data.content, author: data.author || "Unknown" };
          setFetchedQuote(newQuote);
          localStorage.setItem("romantic_daily_quote", JSON.stringify(newQuote));
          localStorage.setItem("romantic_daily_quote_time", now.toString());
          setQuoteLoading(false);
          return;
        }
      }
      throw new Error("Failed api response");
    } catch (err) {
      const curatedPool = [
        {
          content: "In all the world, there is no heart for me like yours, a sanctuary where my soul finally finds its rest. In all the world, there is no love for you like mine—boundless, timeless, and deeper than the furthest oceans.",
          author: "Maya Angelou"
        },
        {
          content: "I would rather share one fleeting lifetime of mortal days with you, wrapped in your warmth, than face all the cold and empty ages of this world alone in immortal silence.",
          author: "J.R.R. Tolkien"
        },
        {
          content: "If I know what love is, if I understand the quiet grace of a beating heart and the light that guides me through the dark, it is entirely because of you and the magic you brought into my life.",
          author: "Hermann Hesse"
        },
        {
          content: "My heart is, and always will be, yours. No matter where the tides of time take us, and no matter how the world changes around us, my love remains an unshakeable monument dedicated only to you.",
          author: "Jane Austen"
        },
        {
          content: "Grow old along with me, hand in hand through the fading seasons! Step into the twilight of our years without fear, for the best of our love is yet to be, and our greatest chapters are still unwritten.",
          author: "Robert Browning"
        },
        {
          content: "You are my heart, my life, my one and only thought. When I look into the future, I see no path, no light, and no joy that does not begin and end with your hand intertwined in mine.",
          author: "Arthur Conan Doyle"
        },
        {
          content: "I love you not only for what you are, but for what I am when I am with you. I love you for passing over all the foolish, weak things that I cannot help dimly seeing, and for drawing out into the light all the beautiful belongings that no one else had looked quite far enough to find.",
          author: "Roy Croft"
        },
        {
          content: "Whatever our souls are made of, his and mine are the exact same substance, woven from the same starlight, beating to the same ancient rhythm, destined to find each other across a thousand lifetimes.",
          author: "Emily Brontë"
        },
        {
          content: "I want you to know that you have been the last dream of my soul. In my darkest hours, when the world seemed bitter and gray, the mere thought of your smile was the only light that kept my spirit alive.",
          author: "Charles Dickens"
        },
        {
          content: "To love or have loved, that is enough. Ask nothing further. There is no other pearl to be found in the dark folds of life. To love is to touch the edge of heaven, and you are my paradise.",
          author: "Victor Hugo"
        },
        {
          content: "Doubt thou the stars are fire; Doubt that the sun doth move; Doubt truth to be a liar; But never, my dearest love, doubt that the flame of my devotion burns exclusively and eternally for you.",
          author: "William Shakespeare"
        },
        {
          content: "You should be kissed, and often, and by someone who knows how. But more than that, you should be cherished every second of every day, as if you were the very air that holds the world together.",
          author: "Margaret Mitchell"
        },
        {
          content: "If I had a flower for every time I thought of you, I could walk through my own beautiful garden forever, lost in a labyrinth of roses that bloom only because you exist in this universe.",
          author: "Alfred Tennyson"
        }
      ];
      const randomIndex = Math.floor(Math.random() * curatedPool.length);
      const chosen = curatedPool[randomIndex];
      setFetchedQuote(chosen);
      localStorage.setItem("romantic_daily_quote", JSON.stringify(chosen));
      localStorage.setItem("romantic_daily_quote_time", Date.now().toString());
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetchRomanticQuote();
  }, []);

  const [daysCount, setDaysCount] = useState(0);
  const [nextAnniversaryDays, setNextAnniversaryDays] = useState(0);
  const [nextMilestoneDays, setNextMilestoneDays] = useState(0);
  const [birthdayDays, setBirthdayDays] = useState({ userA: 0, userB: 0 });

  useEffect(() => {
    const start = new Date(anniversaryDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysCount(diffDays);

    const currentYear = today.getFullYear();
    let nextAnniv = new Date(anniversaryDate);
    if (!isNaN(nextAnniv.getTime())) {
      nextAnniv.setFullYear(currentYear);
      if (today > nextAnniv) {
        nextAnniv.setFullYear(currentYear + 1);
      }
      const annivDiff = nextAnniv.getTime() - today.getTime();
      setNextAnniversaryDays(Math.max(0, Math.ceil(annivDiff / (1000 * 60 * 60 * 24))));
    } else {
      setNextAnniversaryDays(0);
    }

    const targetMilestone = new Date(nextMilestoneDate);
    const dTarget = new Date(targetMilestone.getFullYear(), targetMilestone.getMonth(), targetMilestone.getDate());
    const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const milestoneDiff = dTarget.getTime() - dToday.getTime();
    setNextMilestoneDays(Math.max(0, Math.ceil(milestoneDiff / (1000 * 60 * 60 * 24))));

    const bdayDaysA = daysUntilBirthday(birthdayA) ?? 0;
    const bdayDaysB = daysUntilBirthday(birthdayB) ?? 0;

    setBirthdayDays({
      userA: bdayDaysA,
      userB: bdayDaysB,
    });
  }, [anniversaryDate, nextMilestoneDate, birthdayA, birthdayB]);

  const [moodNote, setMoodNote] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("happy");

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  // ── Sweet Notes Board Firestore Implementation ──
  const [notes, setNotes] = useState<{ id: string; text: string; author: string; color: string }[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const NOTE_COLORS = [
    "bg-yellow-50 border-yellow-200 text-amber-900",
    "bg-pink-50 border-pink-200 text-pink-900",
    "bg-blue-50 border-blue-200 text-blue-900",
    "bg-green-50 border-green-200 text-emerald-900",
    "bg-purple-50 border-purple-200 text-purple-900"
  ];

  useEffect(() => {
    const q = query(collection(db, "sticky_notes"), orderBy("createdAt", "desc"), limit(12));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setNotes([]);
      } else {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            text: data.text || "",
            author: data.author || "",
            color: data.color || "bg-yellow-50 border-yellow-200 text-amber-900",
          };
        });
        setNotes(list.slice(0, 12));
      }
    }, (err) => {
      console.error("[sticky_notes listener]", err);
    });
    return unsub;
  }, []);

  const addNote = useCallback(async () => {
    if (!noteInput.trim()) return;
    const text = noteInput.trim();
    setNoteInput("");
    try {
      const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
      await addDoc(collection(db, "sticky_notes"), {
        text,
        author: activeProfile.name,
        color,
        createdAt: Date.now(),
      });
      awardXp(15, "leaving a sweet sticky note 📝");
      await addDoc(collection(db, "activity_logs"), {
        user_id: currentUser,
        text: `pasted a new sticky note: "${text.substring(0, 25)}${text.length > 25 ? "..." : ""}" 📝`,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error("[addNote]", e);
    }
  }, [noteInput, activeProfile.name, currentUser, awardXp]);

  const removeNote = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "sticky_notes", id));
      triggerHaptic("light");
    } catch (e) {
      console.error("[removeNote]", e);
    }
  }, []);

  // Sync selected mood when user changes
  useEffect(() => {
    if (activeProfile.mood) {
      setSelectedMood(activeProfile.mood);
    }
  }, [currentUser, activeProfile.mood]);

  // Geolocation query to automatically fetch local weather (reverse-geocoded to city name)
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Use nominatim for reverse-geocoding to get a human-readable city name
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
              { headers: { "Accept-Language": "en" } }
            );
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              const cityName =
                addr.city ||
                addr.town ||
                addr.municipality ||
                addr.county ||
                addr.state ||
                `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
              if (activeProfile.weatherCity !== cityName) {
                updateProfile(currentUser, { weatherCity: cityName });
              }
            }
          } catch {
            // Fallback: use lat/lon as-is but don't store raw coords – keep existing city name
            console.warn("Reverse geocoding failed; keeping existing weather city.");
          }
        },
        (error) => {
          console.warn("Geolocation query failed or denied:", error);
        }
      );
    }
  }, [currentUser, activeProfile.weatherCity, updateProfile]);

  // Weather city presets for manual selection
  const CITY_PRESETS = [
    { name: "Seoul", lat: 37.5665, lon: 126.9780 },
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 }
  ];

  const getWeatherInfo = (code: number, isDay: boolean = true) => {
    if (code === 0) return { label: "Clear Skies", icon: Sun, color: "text-amber-500" };
    if (code === 1 || code === 2 || code === 3) {
      return { label: "Partly Cloudy", icon: CloudSun, color: "text-amber-400" };
    }
    if (code === 45 || code === 48) return { label: "Foggy Morn", icon: Cloud, color: "text-zinc-400" };
    if (code === 51 || code === 53 || code === 55) return { label: "Soft Drizzle", icon: CloudDrizzle, color: "text-indigo-400 animate-pulse" };
    if (code === 61 || code === 63 || code === 65) return { label: "Steady Rain", icon: CloudRain, color: "text-blue-500" };
    if (code === 71 || code === 73 || code === 75) return { label: "Gentle Snow", icon: CloudSnow, color: "text-sky-300 animate-bounce" };
    if (code === 80 || code === 81 || code === 82) return { label: "Passing Showers", icon: CloudRain, color: "text-blue-400" };
    if (code === 95 || code === 96 || code === 99) return { label: "Thunder Skies", icon: CloudLightning, color: "text-yellow-600 animate-pulse" };
    return { label: "Mild Breeze", icon: CloudSun, color: "text-amber-400" };
  };

  // ── Weather wttr.in Integration ──
  interface WeatherData {
    temp: number;
    desc: string;
    icon: string;
    city: string;
    code: number;
  }

  function mapWwoToWmo(wwoCode: string): number {
    const n = parseInt(wwoCode);
    if (n === 113) return 0; // Sunny
    if (n <= 119) return 2; // Cloudy
    if (n <= 143) return 45; // Foggy
    if (n <= 176) return 80; // Shower
    if (n <= 260) return 61; // Rain
    if (n <= 350) return 71; // Snow
    return 95; // Storm
  }

  async function fetchWeather(city: string, signal: AbortSignal): Promise<WeatherData | null> {
    try {
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
      const res = await fetch(url, { signal });
      if (!res.ok) return null;
      const json = await res.json();
      const cur = json.current_condition?.[0];
      if (!cur) return null;
      return {
        temp: parseInt(cur.temp_C),
        desc: cur.weatherDesc?.[0]?.value ?? "Unknown",
        icon: weatherIcon(cur.weatherCode),
        city,
        code: mapWwoToWmo(cur.weatherCode)
      };
    } catch {
      return null;
    }
  }

  function weatherIcon(code: string): string {
    const n = parseInt(code);
    if (n === 113) return "☀️";
    if (n <= 119) return "⛅";
    if (n <= 143) return "🌫️";
    if (n <= 176) return "🌦️";
    if (n <= 260) return "🌧️";
    if (n <= 350) return "❄️";
    return "🌩️";
  }

  const [weatherA, setWeatherA] = useState<WeatherData | null>(null);
  const [weatherB, setWeatherB] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [showPartnerSelector, setShowPartnerSelector] = useState<boolean>(false);

  useEffect(() => {
    const ac = new AbortController();
    setWeatherLoading(true);
    setWeatherError(null);
    const cities = [
      { city: userA.weatherCity || "Seoul", setter: setWeatherA },
      { city: userB.weatherCity || "Seoul", setter: setWeatherB },
    ];
    Promise.all(
      cities.map(({ city, setter }) =>
        fetchWeather(city, ac.signal).then((d) => {
          if (d) setter(d);
        })
      )
    )
      .then(() => setWeatherLoading(false))
      .catch((err) => {
        if (err.name !== "AbortError") {
          setWeatherError("Weather Sync Failed");
          setWeatherLoading(false);
        }
      });
    return () => ac.abort();
  }, [userA.weatherCity, userB.weatherCity]);

  const activeWeather = currentUser === "user_a" ? weatherA : weatherB;
  const partnerWeather = currentUser === "user_a" ? weatherB : weatherA;
  const partnerCity = currentUser === "user_a" ? (userB.weatherCity || "Paris") : (userA.weatherCity || "Seoul");
  const partnerLoading = weatherLoading;

  const localWeather = activeWeather ? {
    temp: activeWeather.temp,
    description: activeWeather.desc,
    code: activeWeather.code,
    name: activeWeather.city,
    windspeed: 12,
    isDay: true
  } : null;

  const fetchWeatherByCoords = async (lat: number, lon: number, customName?: string) => {
    if (customName) {
      updateProfile(currentUser, { weatherCity: customName });
    }
  };

  const changeQuote = () => {
    fetchRomanticQuote(true);
    awardXp(5, "finding daily inspiration 🌸");
  };

  const handleMoodSelect = (mood: string) => {
    updateProfile(currentUser, { mood });
    awardXp(10, "sharing your feelings");
  };

  const moodsList = [
    { value: "happy", emoji: "😊", label: "Happy" },
    { value: "cozy", emoji: "🧸", label: "Cozy" },
    { value: "sleepy", emoji: "😴", label: "Sleepy" },
    { value: "excited", emoji: "🌟", label: "Excited" },
    { value: "loved", emoji: "💖", label: "Loved" },
    { value: "bored", emoji: "😐", label: "Bored" },
    { value: "stressed", emoji: "😤", label: "Stressed" },
    { value: "peaceful", emoji: "🍃", label: "Peaceful" },
  ];

  // Song duration parser
  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Dynamic Ambient background style generator based on album/song artwork or title
  const getAmbientStyles = () => {
    const isDark = darkMode || theme === "night" || theme === "cyber-lavender";

    // Use the extracted artwork color as the card background, blending it with dark/light theme background colors
    const background = currentSong.isPlaying && extractedColor
      ? (isDark
        ? `linear-gradient(to bottom right, rgba(20, 20, 25, 0.95), ${extractedColor.replace("0.12", "0.25")})`
        : `linear-gradient(to bottom right, rgba(255, 255, 255, 0.95), ${extractedColor.replace("0.12", "0.18")})`)
      : (isDark
        ? "rgba(20, 20, 25, 0.75)"
        : "rgba(255, 255, 255, 0.35)");

    const shadowColor = currentSong.isPlaying ? extractedColor : "rgba(0, 0, 0, 0.05)";
    const borderColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";

    return {
      background,
      borderColor,
      // Soft, low-contrast shadow matching the extracted album cover color
      boxShadow: `0 20px 40px -10px ${shadowColor}, 0 1px 3px rgba(0, 0, 0, 0.05)`,
    };
  };
  const dailyMessages = [
    "Welcome back to our little bubble.",
    "I'm so happy you're here today.",
    "Our little corner of the world is waiting for us.",
    "Every day feels a little brighter with you here.",
    "Another beautiful day begins with us together.",
    "Our story quietly grows with every new day.",
    "This little space always feels like home.",
    "Every moment we save becomes another treasured memory.",
    "The best part of today is sharing it with you.",
    "No matter where we are, this place always brings us together.",
    "Another page of our story is ready to be written.",
    "Some memories are small, but they mean everything.",
    "This little bubble holds all the moments we never want to lose.",
    "Love lives in the little things we do together.",
    "Every visit adds another warm memory to our collection.",
    "A quiet place, a warm heart, and the two of us.",
    "Nothing feels more comforting than being here with you.",
    "The sweetest memories always begin with ordinary days.",
    "Our happiest moments are the ones we create together.",
    "Home has never been a place. It has always been you.",
    "Another day to smile, laugh, and make new memories together.",
    "Thank you for making every day feel a little more special.",
    "Every photo, every letter, every memory tells our story.",
    "This is where our favorite memories come to stay.",
    "Even the simplest moments become unforgettable with you.",
    "Here's to another beautiful day in our little world.",
    "Every heartbeat of this place is filled with our memories.",
    "No distance can make this place feel any less like home.",
    "The little things we share become the memories we treasure.",
    "Today is another chance to make something worth remembering.",
  ];

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );

  const message = dailyMessages[dayOfYear % dailyMessages.length];
  return (
    <div className="space-y-6" id="home-view-container">
      {/* 1. Welcoming Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-white/40 border border-neutral-200/40 p-4 sm:p-5 md:p-6 lg:p-8 text-center md:text-left md:flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.03)] backdrop-blur-md"
        id="home-welcome-hero"
      >
        <div className="space-y-4 md:max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100/50 text-rose-600 rounded-full text-xs font-semibold tracking-wide shadow-xs">
            <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
            <span className="font-sans">Our Private Digital Sanctuary</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif text-[var(--text-main)] font-semibold leading-tight">
            Welcome home, <span className="font-sans font-extrabold text-[var(--primary)]">{activeProfile.name.split(" ")[0]}</span>
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-[var(--text-muted)] font-medium leading-relaxed">
            {message} {partnerProfile.name.split(" ")[0]} is currently{" "}
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-neutral-900/5 text-[var(--text-main)] border border-neutral-900/5 font-mono mx-1">
              {partnerProfile.status}
            </span>.
          </p>
        </div>

        {/* Premium Days of Love Counter Box */}
        <div className="mt-6 md:mt-0 flex flex-col items-center bg-white/90 text-[var(--text-main)] px-10 py-8 rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-neutral-200/50 relative overflow-hidden group min-w-[220px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100/30 to-transparent rounded-full pointer-events-none blur-xl" />
          <Heart className="w-10 h-10 fill-rose-50 text-rose-100/40 absolute -top-1 -left-1" />
          <span className="text-xs font-bold tracking-widest uppercase text-[var(--text-muted)] font-sans">Days of Love</span>
          <span className="text-5xl md:text-6xl font-black font-serif text-[var(--primary)] my-1 tracking-tight">{daysCount}</span>
          <span className="text-[10px] text-[var(--text-muted)] border border-neutral-200 px-3 py-1 rounded-full font-bold font-mono uppercase bg-white/50 tracking-wider">
            Since {anniversaryDate ? new Date(anniversaryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Oct 15, 2024"}
          </span>
        </div>
      </motion.div>

      {/* Main Responsive Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-stretch mt-4" id="home-bento-grid">

        {/* Relationship Streak & Growing-Plant Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.02 }}
          className="bg-white/40 border border-neutral-200/40 p-4 sm:p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md lg:col-span-12 xl:col-span-12"
          id="relationship-streak-plant-card"
        >
          {/* Particle Overlay (Hearts, Sparkles, Fish, Paws) */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {plantParticles.map((p) => {
              let emoji = "💖";
              if (p.type === "water") {
                emoji = Math.random() > 0.5 ? "🐟" : "🐾";
              } else if (p.type === "sparkle") {
                emoji = "✨";
              }
              return (
                <motion.div
                  key={p.id}
                  className="absolute select-none pointer-events-none text-xl"
                  style={{ left: `${p.x}%`, top: `70px` }}
                  animate={{
                    y: [0, -100],
                    x: [0, (Math.random() - 0.5) * 25],
                    opacity: [0, 1, 0.8, 0],
                    scale: [0.6, 1.2, 0.4]
                  }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                >
                  {emoji}
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 items-center">

            {/* Left Column: Interactive Calico Cat Virtual Pet */}
            <div className="md:col-span-4 lg:col-span-3 flex justify-center">
              <div className="relative flex-shrink-0 w-36 h-36 bg-gradient-to-b from-amber-50/50 to-rose-50/30 rounded-2xl border border-white/50 shadow-inner flex items-center justify-center select-none overflow-hidden group">

                {/* Soft Ambient glow in background */}
                <div className="absolute inset-0 bg-radial-gradient from-rose-100/10 to-transparent pointer-events-none" />

                <svg viewBox="0 0 100 100" className="w-28 h-28 overflow-visible">
                  <defs>
                    {/* Cushion gradient */}
                    <linearGradient id="cushionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffb5a7" />
                      <stop offset="100%" stopColor="#fec5bb" />
                    </linearGradient>
                  </defs>

                  <style>{`
                  @keyframes tailWag {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(10deg); }
                  }
                  @keyframes catEarL {
                    0%, 90%, 100% { transform: rotate(0deg); }
                    95% { transform: rotate(-4deg); }
                  }
                  @keyframes catEarR {
                    0%, 88%, 100% { transform: rotate(0deg); }
                    93% { transform: rotate(4deg); }
                  }
                  .cat-tail {
                    animation: tailWag 3s ease-in-out infinite;
                    transform-origin: 68px 65px;
                  }
                  .cat-ear-l {
                    animation: catEarL 4.5s ease-in-out infinite;
                    transform-origin: 36px 36px;
                  }
                  .cat-ear-r {
                    animation: catEarR 4.5s ease-in-out infinite;
                    transform-origin: 64px 36px;
                  }
                `}</style>

                  {/* Cozy Cushion */}
                  <ellipse cx="50" cy="78" rx="42" ry="14" fill="url(#cushionGrad)" />
                  <ellipse cx="50" cy="78" rx="38" ry="11" fill="none" stroke="#fcd5ce" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Cat Tail */}
                  <path
                    className="cat-tail"
                    d="M 68 65 Q 85 55 82 38 Q 79 32 75 35 Q 75 42 74 52"
                    fill="none"
                    stroke="#d4a373"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  {/* Tail Tip (Charcoal Black patch) */}
                  <path
                    className="cat-tail"
                    d="M 82 38 Q 79 32 75 35"
                    fill="none"
                    stroke="#2f3e46"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />

                  {/* Cat Body */}
                  <ellipse cx="50" cy="63" rx="28" ry="20" fill="#faf9f6" />

                  {/* Calico Patches on Body */}
                  <path d="M 58 48 Q 74 50 72 65 Q 60 74 52 68 Z" fill="#e76f51" opacity="0.95" />
                  <path d="M 32 58 Q 22 66 36 78 Q 44 76 38 64 Z" fill="#2f3e46" opacity="0.95" />

                  {/* Cat Head */}
                  <circle cx="50" cy="43" r="15" fill="#faf9f6" />

                  {/* Head Patches */}
                  <path d="M 50 28 Q 66 28 64 45 Q 56 55 50 43 Z" fill="#e76f51" opacity="0.95" />
                  <path d="M 35 43 Q 32 50 38 52 Q 40 45 35 43 Z" fill="#2f3e46" opacity="0.95" />

                  {/* Cat Ears */}
                  {/* Left Ear */}
                  <path
                    className="cat-ear-l"
                    d="M 34 35 L 38 22 L 46 32 Z"
                    fill="#2f3e46"
                  />
                  <path
                    className="cat-ear-l"
                    d="M 36 33 L 39 25 L 43 31 Z"
                    fill="#ffb5a7"
                  />

                  {/* Right Ear */}
                  <path
                    className="cat-ear-r"
                    d="M 66 35 L 62 22 L 54 32 Z"
                    fill="#faf9f6"
                  />
                  <path
                    className="cat-ear-r"
                    d="M 64 33 L 61 25 L 57 31 Z"
                    fill="#ffb5a7"
                  />

                  {/* Face Details */}
                  {/* Whiskers */}
                  <line x1="32" y1="44" x2="22" y2="43" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="32" y1="47" x2="21" y2="48" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="68" y1="44" x2="78" y2="43" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="68" y1="47" x2="79" y2="48" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Eyes */}
                  {isCheckedInToday ? (
                    <>
                      <path d="M 39 43 Q 43 46 47 43" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                      <path d="M 53 43 Q 57 46 61 43" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="38" cy="48" r="2.5" fill="#fec5bb" opacity="0.8" />
                      <circle cx="62" cy="48" r="2.5" fill="#fec5bb" opacity="0.8" />
                    </>
                  ) : (
                    <>
                      <line x1="38" y1="44" x2="46" y2="44" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                      <line x1="54" y1="44" x2="62" y2="44" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                    </>
                  )}

                  {/* Nose & Mouth */}
                  <polygon points="49.2,47 50.8,47 50,48.2" fill="#ffb5a7" />
                  <path d="M 47.5 49 Q 50 51.2 50 49 Q 50 51.2 52.5 49" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Accessories based on Streak */}
                  {streakCount >= 5 && (
                    <g>
                      <circle cx="20" cy="74" r="6" fill="#f43f5e" />
                      <path d="M 20 80 Q 15 82 12 79 M 20 68 Q 23 65 21 62" fill="none" stroke="#f43f5e" strokeWidth="1" />
                    </g>
                  )}

                  {streakCount >= 15 && (
                    <g>
                      <path d="M 41 51 Q 50 54 59 51" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="50" cy="53.5" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
                      <circle cx="50" cy="54.5" r="0.6" fill="#1e293b" />
                    </g>
                  )}

                  {streakCount >= 30 && (
                    <path
                      d="M 44 26 L 42 16 L 47 20 L 50 14 L 53 20 L 58 16 L 56 26 Z"
                      fill="#fbbf24"
                      stroke="#d97706"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>

                {/* Micro pet/feed badge overlay */}
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    triggerWaterAnimation();
                  }}
                  title="Feed or Pet Mimi!"
                  className="absolute bottom-1.5 right-1.5 p-1.5 bg-white/90 hover:bg-white rounded-full border border-pink-100 text-rose-500 shadow-sm hover:scale-110 active:scale-95 transition-all duration-300"
                >
                  🐾
                </button>
              </div>
            </div>

            {/* Right Column: Information & Actions */}
            <div className="md:col-span-8 lg:col-span-9 space-y-4 text-center md:text-left min-w-0">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                    <Flame className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl lg:text-2xl font-extrabold text-[var(--text-main)] font-display flex items-center gap-2">
                      {streakCount} Day Love Streak
                    </h3>
                    <p className="text-xs md:text-sm text-[var(--text-muted)] font-mono font-bold tracking-wider uppercase">
                      Consecutive Check-ins & Pet Status
                    </p>
                  </div>
                </div>

                <span className="text-xs md:text-sm bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-1 rounded-full font-bold">
                  {streakCount >= 30
                    ? "Royal Calico 👑"
                    : streakCount >= 15
                      ? "Cozy Companion 🐱"
                      : streakCount >= 5
                        ? "Playful Kitty 🧶"
                        : "Sleepy Kitten 🐾"}
                </span>
              </div>

              <p className="text-sm md:text-base lg:text-lg text-[var(--text-muted)] leading-relaxed font-medium">
                {isCheckedInToday
                  ? "Marsha is happily purring beside us. Every visit, every cuddle, and every little bit of love helps her grow happier while making our little bubble feel even more like home."
                  : "Marsha is curled up, waiting for today's cuddle and treat. Feed her and check in today to keep your relationship streak alive and earn XP."}
              </p>

              {/* Growth milestone indicator */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs md:text-sm text-[var(--text-muted)] font-mono font-semibold">
                  <span>Next Accessory Unlock Progress</span>
                  <span>{streakCount >= 30 ? "Maximum Level" : `${Math.round((streakCount % 10) * 10)}%`}</span>
                </div>
                <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: streakCount >= 30 ? "100%" : `${Math.max(5, (streakCount % 10) * 10)}%` }}
                  />
                </div>
                <p className="text-xs md:text-sm text-[var(--text-muted)]/80 italic font-medium">
                  {streakCount >= 30
                    ? "Incredible! Mimi is in her ultimate, most majestic form, loving you both eternally! 👑"
                    : `Next Accessory Unlock: ${Math.ceil((streakCount + 0.1) / 10) * 10}-day streak milestone!`}
                </p>
              </div>

              {/* Check-In Action Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={handleCheckIn}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2.5 shadow-sm hover:scale-[1.01] active:scale-[0.99] ${isCheckedInToday
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
                    : "bg-gradient-to-r from-rose-400 to-amber-500 hover:opacity-95 text-white"
                    }`}
                >
                  {isCheckedInToday ? (
                    <>
                      <span>🐾 Give Mimi Salmon Treat (+5 XP)</span>
                    </>
                  ) : (
                    <>
                      <span>🐟 Feed Mimi & Check In (+25 XP)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    triggerHaptic("heavy");
                    setStreakCount(1);
                    localStorage.setItem("couple_relationship_streak", "1");
                  }}
                  className="text-xs text-gray-400 hover:text-rose-400 transition-colors font-mono py-1 px-2 mt-2 sm:mt-0"
                  title="Only use if you want to start fresh with a new calico kitten!"
                >
                  Reset Pet Status
                </button>
              </div>

            </div>
          </div>
        </motion.div>

        {/* SPOTLIGHT: MEMORY OF THE DAY WIDGET */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.04 }}
          className="bg-white/40 border border-neutral-200/40 p-4 sm:p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md lg:col-span-12 xl:col-span-12"
          id="spotlight-memory-widget"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-200/20 to-transparent rounded-full pointer-events-none blur-2xl" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 items-center">

            {/* Left: Text Info block */}
            <div className="md:col-span-7 lg:col-span-8 space-y-4.5 text-center md:text-left min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-50 to-rose-50 border border-rose-100/60 rounded-full text-xs font-extrabold uppercase tracking-widest text-rose-600 shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-500 fill-current animate-spin-slow" />
                <span>Memory Spotlight of the Day</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[var(--text-main)] font-bold italic tracking-tight leading-tight">
                {spotlightMemory ? spotlightMemory.title : "Capture a Moment Today!"}
              </h2>

              <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed max-w-2xl font-medium">
                {spotlightMemory
                  ? (spotlightMemory.description || "A beautiful moment frozen in time. No description was left, but the feelings are forever shared in our digital home.")
                  : "Your digital timeline is waiting for its next gorgeous chapter. Capture a photobooth strip or log a cozy milestone, and it might be spotlighted here for 24 hours!"}
              </p>

              {/* Date and Countdown details */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm pt-1">
                <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-xs font-semibold">
                  <Calendar className="w-4 h-4 text-rose-400" />
                  <span>
                    {spotlightMemory
                      ? `Captured: ${new Date(spotlightMemory.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                      : "No memories added yet"}
                  </span>
                </div>

                {spotlightMemory && (
                  <div className="text-[10px] bg-rose-50/80 text-rose-700 border border-rose-100 px-3 py-1 rounded-full font-mono uppercase font-black tracking-wider flex items-center gap-1.5 shadow-xs">
                    <span className="animate-pulse">●</span> Rotates In: {rotationCountdown}
                  </div>
                )}
              </div>

              {/* Actions: Love & Explore */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                {spotlightMemory ? (
                  <>
                    <button
                      onClick={() => {
                        triggerHaptic("success");
                        awardXp(15, "showering love on our Spotlight Memory of the Day!");

                        // Confetti / Floating Emojis explosion
                        const count = 14;
                        const rect = document.getElementById("spotlight-frame")?.getBoundingClientRect();
                        const xBase = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
                        const yBase = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
                        for (let i = 0; i < count; i++) {
                          const star = document.createElement("div");
                          star.innerText = ["💖", "🌸", "✨", "🥰", "🎀", "🧸"][Math.floor(Math.random() * 6)];
                          star.style.position = "fixed";
                          star.style.left = `${xBase + (Math.random() - 0.5) * 120}px`;
                          star.style.top = `${yBase + (Math.random() - 0.5) * 120}px`;
                          star.style.fontSize = `${24 + Math.random() * 24}px`;
                          star.style.pointerEvents = "none";
                          star.style.zIndex = "9999";
                          star.style.transition = "all 1s cubic-bezier(0.1, 0.8, 0.3, 1)";
                          document.body.appendChild(star);
                          setTimeout(() => {
                            star.style.transform = `translateY(-140px) scale(0.2) rotate(${(Math.random() - 0.5) * 200}deg)`;
                            star.style.opacity = "0";
                          }, 50);
                          setTimeout(() => star.remove(), 1050);
                        }
                      }}
                      className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95"
                    >
                      <span>🥰 Aww, Love This! (+15 XP)</span>
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        window.dispatchEvent(new CustomEvent("changeTab", { detail: "memories" }));
                      }}
                      className="px-5 py-3 bg-white/75 hover:bg-white text-gray-700 hover:text-rose-600 border border-gray-200/80 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 hover:scale-103 shadow-xs"
                    >
                      <span>View Full Timeline</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      triggerHaptic("medium");
                      window.dispatchEvent(new CustomEvent("changeTab", { detail: "memories" }));
                    }}
                    className="px-6 py-3.5 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 shadow hover:scale-105 active:scale-95 group"
                  >
                    <Camera className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-6" />
                    <span>Open Photobooth & Save Memories</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right: The stylized framed photo */}
            <div className="md:col-span-5 lg:col-span-4 flex justify-center md:justify-end w-full">
              {spotlightMemory ? (
                <motion.div
                  id="spotlight-frame"
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 120, damping: 14 }}
                  className="relative bg-white p-5 pb-14 rounded-sm shadow-[0_15px_40px_rgba(0,0,0,0.18)] border border-gray-200/70 flex flex-col items-center gap-3.5 w-64 -rotate-2 group"
                >
                  {/* Visual paper tape design sticking polaroid onto card */}
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-100/60 border-x border-dashed border-yellow-200/80 backdrop-blur-[1px] rotate-2 shadow-sm" />

                  {/* Image layout container */}
                  <div className="w-full aspect-square overflow-hidden bg-gray-50 border border-gray-100 rounded relative shadow-inner">
                    <img
                      src={spotlightMemory.imageUrl}
                      alt={spotlightMemory.title}
                      className="w-full h-full object-cover pointer-events-none select-none group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-300/5 via-transparent to-white/10 pointer-events-none" />
                  </div>

                  {/* Handwriting handwriting style typography */}
                  <div className="text-center w-full pt-1.5 font-serif select-none">
                    <p className="text-sm font-black text-gray-800 italic tracking-wide truncate max-w-full">
                      ✨ {spotlightMemory.title} ✨
                    </p>
                    <p className="text-[10px] font-mono text-gray-400 mt-1 uppercase tracking-widest font-bold">
                      ♥ {new Date(spotlightMemory.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} ♥
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="relative bg-white/40 border-2 border-dashed border-gray-300/80 p-6 rounded-3xl flex flex-col items-center justify-center text-center w-52 aspect-square shadow-inner">
                  <Camera className="w-10 h-10 text-gray-300 mb-2 animate-pulse" />
                  <p className="text-[11px] font-semibold text-gray-500 font-serif italic">No memories spotlighted yet</p>
                  <p className="text-[9px] text-gray-400 mt-1">Photos from your photobooth or milestones will shine here!</p>
                </div>
              )}
            </div>

          </div>
        </motion.div>

        {/* Milestone & Special Days Consolidated Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="bg-white/40 border border-neutral-200/40 p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl lg:col-span-8 xl:col-span-8 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md"
          id="milestone-special-days-card"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)]">

            {/* Left Side: Next Milestone Countdown */}
            <div className="space-y-4 pb-6 md:pb-0">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm font-mono font-bold tracking-widest uppercase text-[var(--text-muted)]">
                  Next Milestone
                </span>
                <span className="text-xs md:text-sm bg-rose-50 text-rose-600 px-3.5 py-1 rounded-full font-serif font-bold italic shadow-xs border border-rose-100">
                  {nextMilestoneDate ? new Date(nextMilestoneDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "October 15, 2026"}
                </span>
              </div>

              <div className="py-4 text-center">
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-[var(--text-main)] mb-1 font-serif italic">
                  "{nextMilestoneTitle || "Our Next Milestone"}"
                </p>
                <div className="font-serif text-7xl md:text-8xl lg:text-9xl font-extralight italic tracking-tight text-[var(--primary)] leading-none animate-pulse-slow my-3">
                  {nextMilestoneDays}
                </div>
                <div className="text-xs md:text-sm font-mono font-bold tracking-widest uppercase text-[var(--text-muted)]">
                  Days Remaining
                </div>
              </div>

              <p className="text-xs md:text-sm text-[var(--text-muted)] text-center font-serif italic border-t border-[var(--border-color)] pt-4 mt-2">
                "Every step closer is a beautiful step together."
              </p>
            </div>

            {/* Right Side: Special Days (Anniversary & Birthdays) */}
            <div className="space-y-5 pt-6 md:pt-0 md:pl-8">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-base md:text-lg lg:text-xl font-bold text-[var(--text-main)] flex items-center gap-2.5">
                  <Calendar className="w-5 h-5 text-rose-500" />
                  Special Days
                </h3>
                <span className="text-xs md:text-sm bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 rounded-full font-bold">
                  Countdown
                </span>
              </div>

              <div className="space-y-4 divide-y divide-[var(--border-color)]">
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-pink-100 rounded-lg text-pink-500">
                      <Heart className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-bold text-[var(--text-main)]">Next Anniversary</p>
                      <p className="text-xs md:text-sm text-[var(--text-muted)] mt-0.5">{formatAnniversaryDisplay(anniversaryDate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg md:text-xl lg:text-2xl font-extrabold text-pink-600 font-display">{nextAnniversaryDays}</span>
                    <span className="text-xs md:text-sm text-[var(--text-muted)] block mt-0.5">days left</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-100 rounded-lg text-yellow-600">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-bold text-[var(--text-main)]">{userA.name.split(" ")[0]}'s Birthday</p>
                      <p className="text-xs md:text-sm text-[var(--text-muted)] mt-0.5">{formatBirthdayDisplay(birthdayA)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg md:text-xl lg:text-2xl font-extrabold text-yellow-600 font-display">{birthdayDays.userA}</span>
                    <span className="text-xs md:text-sm text-[var(--text-muted)] block mt-0.5">days left</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 rounded-lg text-blue-500">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm md:text-base font-bold text-[var(--text-main)]">{userB.name.split(" ")[0]}'s Birthday</p>
                      <p className="text-xs md:text-sm text-[var(--text-muted)] mt-0.5">{formatBirthdayDisplay(birthdayB)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg md:text-xl lg:text-2xl font-extrabold text-blue-600 font-display">{birthdayDays.userB}</span>
                    <span className="text-xs md:text-sm text-[var(--text-muted)] block mt-0.5">days left</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Daily Quote Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="bg-white/40 border border-neutral-200/40 p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden group flex flex-col justify-between h-full shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md lg:col-span-4 xl:col-span-4"
          id="quote-card"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-200/10 to-transparent rounded-full pointer-events-none blur-xl" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs md:text-sm font-extrabold text-[var(--primary)] tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-current text-[var(--primary)]" />
                Curated Daily Love Quote
              </h4>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  changeQuote();
                }}
                title="Draw a custom whisper of inspiration"
                className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>

            <div className="text-sm md:text-base font-serif italic text-[var(--text-main)] leading-relaxed relative z-10 py-1.5 font-medium">
              {quoteLoading ? (
                <span className="flex items-center gap-1.5 text-[var(--text-muted)] animate-pulse font-sans text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" /> Fetching romantic whisper...
                </span>
              ) : fetchedQuote ? (
                <>
                  "{fetchedQuote.content}"
                  {fetchedQuote.author && (
                    <span className="block text-right text-xs text-[var(--text-muted)] font-mono not-italic mt-2">
                      — {fetchedQuote.author}
                    </span>
                  )}
                </>
              ) : (
                `"In your smile, I see something more beautiful than the stars."`
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-3 border-t border-[var(--border-color)] text-[10px] text-[var(--text-muted)] relative z-10 font-mono">
            <span>Stable for 24 hours</span>
            <span>Next update in {(() => {
              const now = new Date();
              const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
              return Math.max(1, Math.round((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)));
            })()}h</span>
          </div>
          <Heart className="w-20 h-20 text-[var(--primary)]/5 absolute -right-6 -bottom-6 -rotate-12 pointer-events-none" />
        </motion.div>

        {/* Skies & Couple Mood Sync Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="bg-white/40 border border-neutral-200/40 p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl lg:col-span-12 xl:col-span-12 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md"
          id="mood-skies-sync-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-4 gap-3">
            <div className="flex items-center gap-3">
              <Smile className="w-6 h-6 text-rose-500 animate-bounce-slow" />
              <div>
                <h3 className="text-lg md:text-xl font-bold text-[var(--text-main)] font-serif italic">
                  Skies & Couple Mood Sync
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Share your current feelings and stay in sync with each other's moods and local weather.
                </p>
              </div>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-3.5 py-1 rounded-full font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Synchronized
            </span>
          </div>

          {/* Core Grid: My Skies & Mood vs Partner's Skies & Mood */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)]">

            {/* Left Column: Current User (My Side) */}
            <div className="flex flex-col space-y-4 pb-6 md:pb-0 md:pr-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={activeProfile.avatar}
                    alt={activeProfile.name}
                    className="w-11 h-11 rounded-full border-2 border-[var(--primary)]/20 object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider font-bold">My State</p>
                    <p className="text-base font-extrabold text-[var(--text-main)] truncate max-w-[150px]">
                      {activeProfile.name.split(" ")[0]}
                    </p>
                  </div>
                </div>

                {/* Active Mood Showcase */}
                <div className="flex items-center gap-2 bg-white/50 border border-white/60 p-2 px-3 rounded-2xl shadow-xs">
                  <span className="text-3xl">
                    {moodsList.find((m) => m.value === activeProfile.mood)?.emoji || "🌸"}
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] text-[var(--text-muted)] font-bold">Current Mood</p>
                    <p className="text-xs font-black text-[var(--primary)] capitalize">
                      {activeProfile.mood || "Happy"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Local Weather section */}
              <div className="bg-white/30 border border-white/20 p-4 rounded-2xl flex items-center justify-between shadow-xs relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-100/10 to-transparent rounded-full pointer-events-none blur-md" />

                {weatherLoading ? (
                  <div className="w-full py-4 flex flex-col items-center justify-center space-y-1.5">
                    <Compass className="w-6 h-6 text-[var(--primary)] animate-spin" />
                    <span className="text-xs text-[var(--text-muted)] animate-pulse font-medium">Sensing my skies...</span>
                  </div>
                ) : weatherError && !localWeather ? (
                  <div className="w-full py-2 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                    <span className="text-xs text-red-500 font-bold">Skies hazy</span>
                    <button
                      type="button"
                      onClick={() => fetchWeatherByCoords(CITY_PRESETS[0].lat, CITY_PRESETS[0].lon, CITY_PRESETS[0].name)}
                      className="text-[10px] underline text-[var(--primary)] mt-1 font-semibold"
                    >
                      Load fallback
                    </button>
                  </div>
                ) : localWeather ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="space-y-1 text-left">
                      <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                        {localWeather.name}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-display text-[var(--text-main)]">{localWeather.temp}°C</span>
                      </div>
                      <span className="text-xs text-[var(--primary)] font-bold block">
                        {localWeather.description}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono pt-1">
                        <Wind className="w-3 h-3" />
                        <span>{localWeather.windspeed} km/h wind</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center pr-1">
                      <ArtisticWeatherIcon code={localWeather.code} isDay={localWeather.isDay} className="w-14 h-14" />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right Column: Partner (Partner's Side) */}
            <div className="flex flex-col space-y-4 pt-6 md:pt-0 md:pl-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={partnerProfile.avatar}
                    alt={partnerProfile.name}
                    className="w-11 h-11 rounded-full border-2 border-[var(--primary)]/20 object-cover shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider font-bold">Partner's State</p>
                    <p className="text-base font-extrabold text-[var(--text-main)] truncate max-w-[150px]">
                      {partnerProfile.name.split(" ")[0]}
                    </p>
                  </div>
                </div>

                {/* Partner's Showcase */}
                <div className="flex items-center gap-2 bg-white/50 border border-white/60 p-2 px-3 rounded-2xl shadow-xs">
                  <span className="text-3xl">
                    {moodsList.find((m) => m.value === partnerProfile.mood)?.emoji || "🌸"}
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] text-[var(--text-muted)] font-bold">Current Mood</p>
                    <p className="text-xs font-black text-[var(--primary)] capitalize">
                      {partnerProfile.mood || "Happy"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Partner's Weather section */}
              <div className="bg-white/30 border border-white/20 p-4 rounded-2xl flex items-center justify-between shadow-xs relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100/10 to-transparent rounded-full pointer-events-none blur-md" />

                {partnerLoading ? (
                  <div className="w-full py-4 flex flex-col items-center justify-center space-y-1.5">
                    <Compass className="w-6 h-6 text-[var(--accent)] animate-spin" />
                    <span className="text-xs text-[var(--text-muted)] animate-pulse font-medium">Sensing partner skies...</span>
                  </div>
                ) : partnerWeather ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                          {partnerWeather ? partnerWeather.city : partnerCity} Skies
                        </span>
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-display text-[var(--text-main)]">{partnerWeather.temp}°C</span>
                      </div>
                      <span className="text-xs text-[var(--primary)] font-bold block">
                        {partnerWeather.desc}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono pt-1">
                        <Thermometer className="w-3.5 h-3.5" />
                        <span>Feels wonderful</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center pr-1">
                      <ArtisticWeatherIcon code={partnerWeather.code} isDay={true} className="w-14 h-14" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full py-4 flex flex-col items-center justify-center">
                    <span className="text-xs text-[var(--text-muted)] font-mono">Unreachable skies</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Interactive Mood Selector for Current User */}
          <div className="space-y-4 bg-black/5 p-5 rounded-2xl border border-black/5 mt-6">
            <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider font-bold text-center md:text-left">
              How are you feeling right now?
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {moodsList.map((moodItem) => (
                <button
                  key={moodItem.value}
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedMood(moodItem.value);
                  }}
                  className={`py-3 px-1 text-center rounded-2xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${selectedMood === moodItem.value
                    ? "bg-white text-[var(--text-main)] shadow-md scale-110 font-extrabold border-2 border-[var(--primary)]/20"
                    : "bg-white/30 border border-white/20 text-gray-400 hover:text-gray-600 hover:scale-105 hover:bg-white/60"
                    }`}
                  title={moodItem.label}
                >
                  <span className="text-2xl md:text-3xl">{moodItem.emoji}</span>
                  <span className="text-[10px] block capitalize mt-1 font-semibold truncate max-w-full">{moodItem.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <input
                type="text"
                placeholder="Attach a cozy whisper or mood note (optional)..."
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs font-serif italic text-[var(--text-main)] bg-white/80 border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--primary)] placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("success");
                  addMoodHistoryEntry(selectedMood, moodNote);
                  setMoodNote("");
                }}
                className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm transition-colors flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 fill-current animate-heartbeat" />
                <span>Update & Gain +15 XP</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Sweet Notes Board Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="bg-white/40 border border-neutral-200/40 p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl lg:col-span-12 xl:col-span-12 space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md"
          id="sweet-notes-board-card"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-3 gap-2">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-spin-slow flex-shrink-0" />
              <div>
                <h3 className="text-base md:text-lg font-bold text-[var(--text-main)] font-serif italic">
                  Sweet Notes Board
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                  Pin a sweet whisper, cute reminder, or an "I love you" on our shared couple corkboard.
                </p>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto">
              {notes.length}/12 notes active
            </span>
          </div>

          {/* Stick a New Note Input Form */}
          <div className="bg-black/5 p-2 sm:p-3 rounded-xl border border-black/5 flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="text"
              placeholder="Write a sweet reminder or note here..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              maxLength={150}
              className="flex-1 w-full px-3 py-1.5 text-xs font-sans text-slate-800 bg-white/80 border border-[var(--border-color)] rounded-lg focus:outline-none focus:border-[var(--primary)] placeholder-gray-400 h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addNote();
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                triggerHaptic("medium");
                addNote();
              }}
              disabled={!noteInput.trim()}
              className={`w-full sm:w-auto px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold tracking-wider uppercase shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap h-9 ${noteInput.trim()
                ? "bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white hover:scale-[1.01] active:scale-95"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
            >
              <Plus className="w-3 h-3" />
              <span>Stick Note (+15 XP)</span>
            </button>
          </div>

          {/* Sticky Notes Corkboard Grid */}
          {notes.length === 0 ? (
            <div className="py-8 text-center text-[var(--text-muted)] italic font-serif text-xs">
              Our notes board is empty... write a sweet whisper above to start! 📝♥
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pt-1">
              {notes.map((note, index) => {
                const tilts = ["rotate-1", "-rotate-1", "rotate-2", "-rotate-2", "rotate-3", "-rotate-3"];
                const tiltClass = tilts[index % tilts.length];

                return (
                  <motion.div
                    key={note.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.04, rotate: 0, zIndex: 10 }}
                    transition={{ type: "spring", stiffness: 120, damping: 12 }}
                    className={`relative p-3 pb-3.5 pt-6 rounded-xl shadow-sm border flex flex-col justify-between aspect-square transition-all duration-300 ${note.color} ${tiltClass}`}
                  >
                    {/* Visual Red/Rose Thumbtack / Pin decoration */}
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex flex-col items-center select-none pointer-events-none z-10">
                      <div className="w-2.5 h-2.5 bg-rose-500 rounded-full border border-rose-400 shadow-sm relative">
                        <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white/60 rounded-full" />
                      </div>
                      <div className="w-[1.5px] h-1 bg-gray-400/80 -mt-0.5" />
                    </div>

                    {/* Delete Note Button */}
                    <button
                      type="button"
                      onClick={() => removeNote(note.id)}
                      className="absolute top-1.5 right-1.5 p-0.5 bg-black/5 hover:bg-black/10 rounded-full text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove Note"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Note Content */}
                    <div className="flex-1 overflow-y-auto pr-0.5 mt-1">
                      <p className="text-xs font-sans font-medium leading-snug tracking-normal whitespace-pre-wrap select-text">
                        {note.text}
                      </p>
                    </div>

                    {/* Note Footer */}
                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-black/5 font-mono text-[8px] font-bold text-black/40">
                      <span className="truncate max-w-[50px]">♥ {note.author.split(" ")[0]}</span>
                      <span>📝 card</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* 3. YouTube Listening Together Player */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.4 }}
          className="p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl relative overflow-hidden bg-white/40 border border-neutral-200/40 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md group lg:col-span-12 transition-all duration-500"
          style={getAmbientStyles()}
          id="youtube-listening-together"
        >
          {/* Decorative glowing gradient circle */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-red-500/20 transition-all duration-700" />

          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* LEFT COLUMN: Player & Search */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${currentSong.isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                <h3 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-1.5 font-display">
                  <Music className="w-4 h-4 text-red-500" />
                  Listening Together
                </h3>
              </div>

              {/* URL Paste & Search Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-medium">
                  <span>Search song or paste YouTube Link:</span>
                  {searchError && <span className="text-red-500 font-semibold">{searchError}</span>}
                </div>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search or paste link..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchOrPaste()}
                      className="w-full pl-8 pr-3 py-2 text-xs text-[var(--text-main)] bg-white/70 border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-red-500 font-mono text-[11px]"
                    />
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchOrPaste}
                    disabled={searching}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1 shadow-sm"
                  >
                    {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Search</span>
                  </button>
                </div>
              </div>

              {/* Interactive Vinyl disk player details */}
              <div className="flex items-center gap-5 p-4 bg-white/30 border border-white/40 rounded-xl backdrop-blur-md relative">
                {/* Spinning Vinyl Record */}
                <div className="relative flex-shrink-0 select-none">
                  <img
                    src={currentSong.artwork || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=256&auto=format&fit=crop"}
                    alt="Album Artwork"
                    className={`w-16 h-16 rounded-full object-cover border-2 border-black/10 shadow-lg transition-transform duration-1000 ${currentSong.isPlaying ? "animate-spin-slow" : ""
                      }`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 m-auto w-4 h-4 bg-[var(--bg-app)] border-2 border-black/20 rounded-full shadow-inner flex items-center justify-center">
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  </div>
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                  <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-[9px] font-bold text-red-600">
                    Our Kind Of Melody
                  </span>
                  <p className="text-xs font-bold text-[var(--text-main)] truncate font-display tracking-tight mt-1">
                    {currentSong.title}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{currentSong.artist}</p>

                  {/* Equalizer lines */}
                  {currentSong.isPlaying && (
                    <div className="flex items-end gap-0.5 h-3.5 pt-1">
                      <span className="w-0.5 bg-red-500 rounded-full animate-pulse" style={{ height: '70%' }} />
                      <span className="w-0.5 bg-red-500 rounded-full animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                      <span className="w-0.5 bg-red-500 rounded-full animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                      <span className="w-0.5 bg-red-500 rounded-full animate-pulse" style={{ height: '80%', animationDelay: '450ms' }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Synced Lyrics replacing YouTube Video Player */}
              <div className="overflow-hidden rounded-xl border border-black/10 bg-white/20 backdrop-blur-md p-3.5 h-[160px] flex flex-col justify-center">
                <div
                  ref={lyricsScrollRef}
                  className="space-y-3.5 h-full overflow-y-auto px-2 scroll-smooth font-serif text-xs md:text-sm leading-relaxed text-center italic text-gray-500 flex flex-col justify-start"
                >
                  {lyricsLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-[var(--text-muted)] my-auto">
                      <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                      <span className="text-[9px] font-mono">Loading matching lyrics...</span>
                    </div>
                  ) : lyricsLines ? (
                    lyricsLines.map((line, idx) => {
                      const isActive = idx === activeLineIndex;
                      return (
                        <div
                          key={idx}
                          ref={(el) => { lyricsLineRefs.current[idx] = el; }}
                          className={`py-1 transition-all duration-300 ${isActive
                            ? "text-red-600 font-bold scale-105 animate-pulse"
                            : "opacity-45 scale-100 hover:opacity-85"
                            }`}
                        >
                          {line.text}
                        </div>
                      );
                    })
                  ) : (
                    <div className="my-auto text-[10px] text-gray-400 font-mono text-center">
                      No lyrics file parsed for this track.
                    </div>
                  )}
                </div>
              </div>

              {/* Transport controls */}
              <div className="flex items-center justify-between py-2.5 px-4 bg-white/40 border border-white/50 rounded-xl">
                <div className="flex items-center gap-1">
                  {/* Shuffle Button */}
                  <button
                    type="button"
                    onClick={() => setShuffleOn(!shuffleOn)}
                    className={`p-1.5 rounded-lg transition-all ${shuffleOn ? "bg-red-50 text-red-600 font-bold" : "text-gray-400 hover:text-gray-600"
                      }`}
                    title="Shuffle Playlist"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>

                  {/* Repeat Button */}
                  <button
                    type="button"
                    onClick={cycleRepeat}
                    className={`p-1.5 rounded-lg transition-all flex items-center gap-0.5 ${repeatMode !== "off" ? "bg-red-50 text-red-600 font-bold" : "text-gray-400 hover:text-gray-600"
                      }`}
                    title="Repeat Track"
                  >
                    {repeatMode === "one" ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                    {repeatMode !== "off" && <span className="text-[8px] font-mono">{repeatMode === "one" ? "1" : "all"}</span>}
                  </button>
                </div>

                {/* Player Navigation Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => goToOffset(-1)}
                    className="p-1.5 hover:bg-black/5 active:scale-90 rounded-full text-red-600 transition-all"
                    title="Previous Track"
                  >
                    <SkipBack className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSongPlayState(!currentSong.isPlaying)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white active:scale-95 rounded-full shadow transition-all"
                    title={currentSong.isPlaying ? "Pause" : "Play"}
                  >
                    {currentSong.isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => goToOffset(1)}
                    className="p-1.5 hover:bg-black/5 active:scale-90 rounded-full text-red-600 transition-all"
                    title="Next Track"
                  >
                    <SkipForward className="w-4 h-4 fill-current" />
                  </button>
                </div>

                {/* Progress counter */}
                <div className="text-[10px] font-mono text-[var(--text-muted)] font-bold flex items-center gap-1.5">
                  <span>{Math.floor(currentSong.progressMs / 60000)}:{(Math.floor((currentSong.progressMs % 60000) / 1000)).toString().padStart(2, "0")}</span>
                  <span>/</span>
                  <span>{Math.floor(currentSong.durationMs / 60000)}:{(Math.floor((currentSong.durationMs % 60000) / 1000)).toString().padStart(2, "0")}</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Shared Playlist */}
            <div className="flex-1 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[var(--border-color)] pt-4 md:pt-0 md:pl-6 space-y-4">

              {/* Header controls for right pane */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-1.5 font-display">
                  <Music className="w-4 h-4 text-red-500" />
                  Shared Playlist
                </h4>
                <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold">
                  {playlistTracks.length} vibe tracks
                </span>
              </div>

              {/* Dynamic Playlist Pane */}
              <div className="flex-1 min-h-[220px] max-h-[380px] overflow-y-auto pr-1">
                <div className="space-y-2">
                  {/* Sorting Filter Controls */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {([
                      ["recent", "Recent"],
                      ["oldest", "Oldest"],
                      ["az", "A to Z"],
                      ["za", "Z to A"]
                    ] as const).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSortMode(mode)}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all border ${sortMode === mode
                          ? "bg-red-500 border-red-500 text-white shadow-sm"
                          : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Playlist Tracks Mapping */}
                  <div className="space-y-1.5">
                    {sortedTracks.map((track) => {
                      const isCurrent = track.videoId === currentSong.videoId;
                      return (
                        <button
                          key={track.videoId}
                          type="button"
                          onClick={() => playTrack(track)}
                          className={`w-full text-left p-2 rounded-xl border text-xs transition-all flex items-center gap-2.5 ${isCurrent
                            ? "bg-red-50/70 border-red-200 font-semibold text-red-900 shadow-sm"
                            : "bg-white/40 border-[var(--border-color)] hover:bg-white/80 text-[var(--text-main)]"
                            }`}
                        >
                          <img
                            src={track.thumbnail}
                            alt="thumbnail"
                            className="w-10 h-10 rounded-lg object-cover border"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate leading-tight font-display text-[11px]">{track.title}</p>
                            <p className="text-[9px] text-[var(--text-muted)] truncate mt-0.5">{track.artist}</p>
                          </div>
                          {isCurrent && currentSong.isPlaying && (
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping mr-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </div> {/* Closing home-bento-grid */}
    </div>
  );
}
