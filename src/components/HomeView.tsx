/**
 * HomeView.tsx — rebuilt from zero.
 *
 * Fixes:
 *  - YouTube IFrame engine removed entirely; no window.YT lifecycle conflicts
 *  - Weather fetch uses AbortController; no setState-on-unmount leaks
 *  - Mood sync writes to DB only on user action, never inside an interval
 *
 * Features: Days of Love counter, weather grid, mood picker with log,
 *           Sweet Notes Board, activity feed, cosmetic song player (display only).
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, CloudSun, Smile, StickyNote, Activity,
  Music, Play, Pause, Plus, Trash2, Send, Loader2, X,
  Search, Shuffle, SkipBack, SkipForward, Repeat, Repeat1, ListMusic,
  Mic2, ChevronDown, ChevronUp,
} from "lucide-react";
import { db } from "../firebaseClient";
import { onSnapshot, collection, addDoc, deleteDoc, doc, query, orderBy, limit } from "firebase/firestore";

// ─── Shared playlist (YouTube Music) ───────────────────────────────────────────
// https://music.youtube.com/playlist?list=PLdf4QJ5Wy29c
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

// Parse an ISO-8601 duration (e.g. "PT3M42S") into milliseconds
function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  return (h * 3600 + m * 60 + s) * 1000;
}

// Fetch exact video duration from the YouTube Data API (needs VITE_YOUTUBE_API_KEY)
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

// Fetch full metadata (title/artist/artwork/duration) for a raw pasted video ID
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

// Parse an LRC-format synced-lyrics string ("[mm:ss.xx]line") into timed lines
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

// Clean up common YouTube metadata from title/artist to improve lyrics search matches
function cleanSearchTerm(title: string, artist: string): { cleanTitle: string; cleanArtist: string } {
  let t = title;
  let a = artist;

  // Remove common YouTube additions
  t = t.replace(/\(.*?\)/g, ""); // Remove anything in parentheses
  t = t.replace(/\[.*?\]/g, ""); // Remove anything in brackets
  t = t.replace(/(official video|official audio|official lyric video|official music video|music video|lyric video|official|mv|audio|video)/gi, "");

  // If title has artist prepended like "Artist - Title", separate them
  if (t.includes(" - ")) {
    const parts = t.split(" - ");
    if (parts.length === 2) {
      if (!a || a.toLowerCase() === "unknown artist" || a.toLowerCase() === parts[0].trim().toLowerCase() || parts[0].trim().toLowerCase().includes(a.toLowerCase())) {
        a = parts[0].trim();
      }
      t = parts[1];
    }
  }

  // Clean unknown artist string
  if (a.toLowerCase() === "unknown artist") {
    a = "";
  }

  return { cleanTitle: t.trim(), cleanArtist: a.trim() };
}

// Fetch lyrics for a track from lrclib.net (free, no API key required)
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

  // Try with cleaned metadata first
  let result = await tryFetch(cleanTitle, cleanArtist);
  
  // Fallback to original metadata if different and cleaned search failed
  if (!result && (cleanTitle !== title || cleanArtist !== artist)) {
    result = await tryFetch(title, artist);
  }
  
  return result;
}

// ─── Days counter ─────────────────────────────────────────────────────────────
function daysApart(isoDate: string): number {
  const start = new Date(isoDate);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

// ─── Weather widget ───────────────────────────────────────────────────────────
interface WeatherData {
  temp: number;
  desc: string;
  icon: string;
  city: string;
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

// ─── Moods ────────────────────────────────────────────────────────────────────
const MOODS = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "cozy", emoji: "🧸", label: "Cozy" },
  { id: "sleepy", emoji: "😴", label: "Sleepy" },
  { id: "excited", emoji: "🌟", label: "Excited" },
  { id: "loved", emoji: "💖", label: "Loved" },
  { id: "bored", emoji: "😐", label: "Bored" },
  { id: "stressed", emoji: "😤", label: "Stressed" },
  { id: "peaceful", emoji: "🍃", label: "Peaceful" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomeView() {
  const {
    currentUser, userA, userB,
    anniversaryDate,
    currentSong, setSongPlayState, syncSongToPartner,
    activityLogs, addMoodHistoryEntry, moodHistory,
  } = useCouple();

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;
  const days = daysApart(anniversaryDate);

  // ── Weather ────────────────────────────────────────────────────────────────
  const [weatherA, setWeatherA] = useState<WeatherData | null>(null);
  const [weatherB, setWeatherB] = useState<WeatherData | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    const cities = [
      { city: userA.weatherCity || "Seoul", setter: setWeatherA },
      { city: userB.weatherCity || "Seoul", setter: setWeatherB },
    ];
    cities.forEach(({ city, setter }) => {
      fetchWeather(city, ac.signal).then((d) => { if (d) setter(d); });
    });
    return () => ac.abort();
  }, [userA.weatherCity, userB.weatherCity]);

  // ── Mood picker ────────────────────────────────────────────────────────────
  const [moodNote, setMoodNote] = useState("");
  const [moodSubmitting, setMoodSubmitting] = useState(false);

  const handleMoodSelect = useCallback(async (moodId: string, isFromNoteSubmit = false) => {
    setMoodSubmitting(true);
    // If clicking the currently active mood again, toggle it to "none" (unless submitting a note)
    const targetMood = (!isFromNoteSubmit && activeProfile.mood === moodId) ? "none" : moodId;
    addMoodHistoryEntry(targetMood, moodNote.trim() || undefined);
    setMoodNote("");
    setTimeout(() => setMoodSubmitting(false), 600);
  }, [addMoodHistoryEntry, moodNote, activeProfile.mood]);

  // ── Sweet Notes Board ─────────────────────────────────────────────────────
  const [notes, setNotes] = useState<{ id: string; text: string; author: string; color: string }[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const NOTE_COLORS = ["bg-yellow-50 border-yellow-200", "bg-pink-50 border-pink-200", "bg-blue-50 border-blue-200", "bg-green-50 border-green-200", "bg-purple-50 border-purple-200"];

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
            color: data.color || "bg-yellow-50 border-yellow-200",
          };
        });
        setNotes(list.slice(0, 12)); // cap at 12 notes
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
      await addDoc(collection(db, "sticky_notes"), {
        text,
        author: activeProfile.name,
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
        createdAt: Date.now(),
      });
    } catch (e) {
      console.error("[addNote]", e);
    }
  }, [noteInput, activeProfile.name]);

  const removeNote = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "sticky_notes", id));
    } catch (e) {
      console.error("[removeNote]", e);
    }
  }, []);

  // ── Search / paste bar ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  // ── Shared playlist (fetched once from YouTube Music playlist) ────────────
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // ── Player mode toggles (local per-device preference) ─────────────────────
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");

  type SortOption = "recent" | "oldest" | "az" | "za";
  const [sortMode, setSortMode] = useState<SortOption>("recent");

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
    return list; // "recent" is default order returned by YouTube
  }, [playlistTracks, sortMode]);



  // ── Lyrics ─────────────────────────────────────────────────────────────────
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsLines, setLyricsLines] = useState<LyricLine[] | null>(null);
  const [lyricsSynced, setLyricsSynced] = useState(false);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState("");
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const lyricsLineRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Extract 11-char YouTube video ID from any YouTube URL format
  const extractVideoId = (url: string): string => {
    if (!url.trim()) return "";
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|watch\?v=|\?v=)([\w-]{11})/);
    if (match) return match[1];
    // If user pasted just the 11-char ID directly
    if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
    return "";
  };

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

  // Sync activeIndex whenever the partner changes the track (so both devices' UI agree)
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

  // Auto-scroll the active lyric line into view
  useEffect(() => {
    if (activeLineIndex < 0) return;
    lyricsLineRefs.current[activeLineIndex]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeLineIndex]);

  const playTrack = useCallback(async (track: { videoId: string; title: string; artist: string; artwork?: string }, index: number | null = null) => {
    setActiveIndex(index);
    const durationMs = await fetchVideoDuration(track.videoId);
    syncSongToPartner({
      title: track.title,
      artist: track.artist,
      album: "Romantic Vibe",
      artwork: track.artwork || "",
      durationMs,
      progressMs: 0,
      isPlaying: true,
      videoId: track.videoId,
    });
  }, [syncSongToPartner]);

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

  const goToOffset = useCallback((offset: 1 | -1) => {
    if (sortedTracks.length === 0) return;
    let nextIdx: number;
    if (shuffleOn) {
      nextIdx = Math.floor(Math.random() * sortedTracks.length);
    } else {
      const base = activeIndex ?? -1;
      nextIdx = (base + offset + sortedTracks.length) % sortedTracks.length;
    }
    const t = sortedTracks[nextIdx];
    playTrack({ videoId: t.videoId, title: t.title, artist: t.artist, artwork: t.thumbnail }, nextIdx);
  }, [sortedTracks, activeIndex, shuffleOn, playTrack]);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);



  return (
    <div className="space-y-6 py-2">

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-6 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute w-40 h-40 bg-rose-400 rounded-full blur-3xl -top-10 -left-10" />
          <div className="absolute w-40 h-40 bg-pink-400 rounded-full blur-3xl -bottom-10 -right-10" />
        </div>
        <div className="relative z-10">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg animate-float">
              <Heart className="w-6 h-6 fill-current text-white animate-heartbeat" />
            </div>
          </div>
          <h2 className="text-3xl font-black font-display text-[var(--text-main)]">{days.toLocaleString()}</h2>
          <p className="text-sm text-[var(--text-muted)] font-semibold mt-1">Days of Love Together ✨</p>
          <p className="text-xs text-[var(--text-muted)] mt-2 font-mono">Since {new Date(anniversaryDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--primary)]">{Math.floor(days / 7)}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Weeks</p>
            </div>
            <div className="w-px bg-[var(--border-color)]" />
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--primary)]">{Math.floor(days / 30)}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Months</p>
            </div>
            <div className="w-px bg-[var(--border-color)]" />
            <div className="text-center">
              <p className="text-lg font-bold text-[var(--primary)]">{days * 24}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Hours</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Daily Whisper ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.02 }}
        className="glass-panel rounded-3xl p-5 text-center relative overflow-hidden"
      >
        <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-[0.2em] font-bold mb-2">Daily Whisper</p>
        <p className="text-sm font-serif italic text-[var(--text-main)] leading-relaxed">
          "Grow old with me! The best is yet to be."
        </p>
        <p className="text-[10px] text-[var(--text-muted)] font-mono mt-2">— Robert Browning</p>
      </motion.div>

      {/* ── Weather Grid ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center gap-2 mb-3">
          <CloudSun className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">Real-Time Weather</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[{ profile: userA, weather: weatherA }, { profile: userB, weather: weatherB }].map(({ profile, weather }) => (
            <div key={profile.id} className="glass-panel rounded-2xl p-4 text-center">
              <img src={profile.avatar} alt={profile.name} className="w-10 h-10 rounded-full mx-auto mb-2 object-cover border-2 border-white/60" referrerPolicy="no-referrer" />
              <p className="text-xs font-bold text-[var(--text-main)]">{profile.name.split(" ")[0]}</p>
              {weather ? (
                <>
                  <p className="text-2xl mt-1">{weather.icon}</p>
                  <p className="text-lg font-black text-[var(--primary)]">{weather.temp}°C</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{weather.desc}</p>
                  <p className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">{weather.city}</p>
                </>
              ) : (
                <div className="mt-2 flex items-center justify-center gap-1 text-[var(--text-muted)]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-[10px]">Loading...</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Mood Sync ────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Smile className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">Mood Sync</h3>
        </div>

        {/* Current moods display */}
        <div className="flex gap-3 mb-4">
          {[{ mood: activeProfile.mood, note: activeProfile.moodNote, label: activeProfile.name.split(" ")[0] }, { mood: partnerProfile.mood, note: partnerProfile.moodNote, label: partnerProfile.name.split(" ")[0] }].map(({ mood, note, label }, i) => (
            <div key={i} className="flex-1 bg-white/40 rounded-2xl p-3 text-center">
              <p className="text-xl">
                {mood === "none" ? "☁️" : (MOODS.find((m) => m.id === mood)?.emoji || "☁️")}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1">{label}</p>
              <p className="text-[9px] text-[var(--text-muted)] capitalize">
                {(!mood || mood === "none") ? "—" : mood}
              </p>
              {mood !== "none" && note && <p className="text-[9px] text-[var(--text-muted)] mt-1 italic">"{note}"</p>}
            </div>
          ))}
        </div>

        {/* Mood picker */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {MOODS.map((m) => (
            <button
              key={m.id}
              id={`mood-btn-${m.id}`}
              onClick={() => handleMoodSelect(m.id)}
              disabled={moodSubmitting}
              className={`rounded-xl p-2 text-center transition-all hover:scale-105 active:scale-95 border ${activeProfile.mood === m.id
                ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                : "bg-white/30 border-white/50 hover:bg-white/50"
                }`}
            >
              <span className="text-lg block">{m.emoji}</span>
              <span className="text-[8px] font-semibold">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={moodNote}
            onChange={(e) => setMoodNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleMoodSelect(activeProfile.mood || "none", true)}
            placeholder="Add a mood note... (optional)"
            className="flex-1 text-xs px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
          />
          <button
            id="mood-note-send-btn"
            onClick={() => handleMoodSelect(activeProfile.mood || "none", true)}
            className="px-3 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      {/* ── Sweet Notes Board ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">Sweet Notes Board</h3>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">{notes.length}/12</span>
        </div>

        {/* Add note */}
        <div className="flex gap-2 mb-4">
          <input
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNote()}
            placeholder="Leave a sweet note for your love..."
            maxLength={120}
            className="flex-1 text-xs px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
          />
          <button id="add-note-btn" onClick={addNote} className="px-3 py-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Notes grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <AnimatePresence>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`relative ${note.color} border rounded-xl p-3 text-xs group`}
              >
                <p className="text-[var(--text-main)] leading-relaxed break-words pr-5">{note.text}</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-1.5 font-mono">— {note.author}</p>
                <button
                  onClick={() => removeNote(note.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {notes.length === 0 && (
            <div className="col-span-2 sm:col-span-3 text-center py-6 text-[var(--text-muted)]">
              <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No notes yet. Leave your love a sweet message! 💌</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Listening Together — Spotify-style synced player ─────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel rounded-3xl p-5 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Music className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">Listening Together</h3>
          {currentSong.isPlaying && currentSong.videoId && (
            <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-green-500 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              NOW SYNCED
            </span>
          )}
        </div>

        {/* Search / paste bar */}
        <div className="relative mb-4">
          <input
            id="song-search-input"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearchOrPaste()}
            placeholder="Search track or paste YouTube link..."
            className="w-full text-xs pl-9 pr-9 py-2.5 bg-white/30 border border-white/50 rounded-2xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
          />
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              id="song-search-clear-btn"
              onClick={() => { setSearchQuery(""); setSearchError(""); }}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            id="song-search-btn"
            onClick={handleSearchOrPaste}
            disabled={searching}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 disabled:opacity-60"
          >
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
          </button>
        </div>
        {searchError && <p className="text-[10px] text-red-500 -mt-2 mb-3">{searchError}</p>}



        {/* Now-playing card — picture-disc vinyl that mirrors the album cover */}
        <div className="rounded-2xl bg-black p-4 flex items-center gap-4 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-br from-rose-500/30 via-transparent to-transparent" />
          <div className="relative w-16 h-16 flex-shrink-0">
            {/* Grooved black disc base */}
            <div
              className={`absolute inset-0 rounded-full shadow-lg ${currentSong.isPlaying ? "animate-spin-slow" : ""}`}
              style={{ background: "repeating-radial-gradient(circle at center, #2a2a2a 0px, #2a2a2a 1.5px, #000 2.5px, #000 5px)" }}
            >
              {/* Album cover wraps the disc like a picture-vinyl, grooves peeking at the rim */}
              <div className="absolute inset-[3px] rounded-full overflow-hidden border border-black/70">
                {currentSong.artwork
                  ? <img src={currentSong.artwork} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-neutral-800 flex items-center justify-center"><Music className="w-4 h-4 text-white/30" /></div>}
              </div>
              {/* Spindle hole */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-black border border-white/30" />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0 relative">
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${currentSong.isPlaying && currentSong.videoId ? "text-emerald-400" : "text-white/40"}`}>
              {currentSong.videoId ? (currentSong.isPlaying ? "● Now Synced" : "Sync Paused") : "Nothing playing"}
            </p>
            <p className="text-sm font-bold text-white truncate">{currentSong.title || "No track selected"}</p>
            <p className="text-[11px] text-white/50 truncate">
              {currentSong.artist || "Search or paste a link to start"}{currentSong.album ? ` • ${currentSong.album}` : ""}
            </p>
          </div>
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-4 mb-1">
          <button
            id="player-shuffle-btn"
            onClick={() => setShuffleOn((s) => !s)}
            className={`p-2 rounded-full transition-colors ${shuffleOn ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            id="player-prev-btn"
            onClick={() => goToOffset(-1)}
            disabled={playlistTracks.length === 0}
            className="p-2 text-[var(--text-main)] hover:text-[var(--primary)] disabled:opacity-30 transition-colors"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            id="player-play-pause-btn"
            onClick={() => setSongPlayState(!currentSong.isPlaying)}
            disabled={!currentSong.videoId}
            className="w-12 h-12 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {currentSong.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            id="player-next-btn"
            onClick={() => goToOffset(1)}
            disabled={playlistTracks.length === 0}
            className="p-2 text-[var(--text-main)] hover:text-[var(--primary)] disabled:opacity-30 transition-colors"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button
            id="player-repeat-btn"
            onClick={cycleRepeat}
            className={`p-2 rounded-full transition-colors ${repeatMode !== "off" ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-center text-[9px] text-[var(--text-muted)] font-mono mb-3">
          {currentSong.videoId ? "🔊 SDK ACTIVE" : "🔈 SDK IDLE"}
        </p>

        {/* Lyrics toggle */}
        {currentSong.videoId && (
          <button
            id="lyrics-toggle-btn"
            onClick={() => setShowLyrics((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2 mb-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
          >
            <Mic2 className="w-3.5 h-3.5" /> Lyrics {showLyrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Lyrics panel */}
        <AnimatePresence>
          {showLyrics && currentSong.videoId && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div ref={lyricsScrollRef} className="max-h-56 overflow-y-auto rounded-2xl bg-black/90 p-4 space-y-2.5">
                {lyricsLoading && (
                  <div className="flex items-center justify-center gap-2 text-white/50 py-6">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> <span className="text-xs">Finding lyrics...</span>
                  </div>
                )}
                {!lyricsLoading && lyricsError && (
                  <p className="text-xs text-white/40 text-center py-6">{lyricsError}</p>
                )}
                {!lyricsLoading && !lyricsError && lyricsLines && !lyricsSynced && (
                  <p className="text-[10px] text-amber-400/80 text-center mb-2">Unsynced lyrics — timing unavailable for this track</p>
                )}
                {!lyricsLoading && lyricsLines && lyricsLines.map((line, i) => (
                  <div
                    key={i}
                    ref={(el) => { lyricsLineRefs.current[i] = el; }}
                    className={`text-sm leading-relaxed transition-all duration-300 ${lyricsSynced
                        ? i === activeLineIndex
                          ? "text-white font-bold scale-[1.03] origin-left"
                          : i < activeLineIndex
                            ? "text-white/25"
                            : "text-white/50"
                        : "text-white/70"
                      }`}
                  >
                    {line.text}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {currentSong.videoId && (
          <button
            id="clear-song-btn"
            onClick={() => syncSongToPartner({ title: "", artist: "", album: "", artwork: "", durationMs: 0, progressMs: 0, isPlaying: false, videoId: "" })}
            className="w-full mb-4 text-[10px] text-red-400 hover:text-red-600 hover:underline"
          >
            Clear current track
          </button>
        )}

        {/* Shared playlist */}
        <div className="border-t border-[var(--border-color)] pt-4">
          <div className="flex items-center gap-1.5 mb-2.5">
            <ListMusic className="w-3.5 h-3.5 text-[var(--primary)]" />
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Our Romantic Playlist</p>
            {playlistTracks.length > 0 && (
              <span className="text-[9px] text-[var(--text-muted)] font-mono ml-auto">{playlistTracks.length} tracks</span>
            )}
          </div>

          {/* Sorting Filter Controls */}
          {!playlistLoading && playlistTracks.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {([
                ["recent", "Recently Added"],
                ["oldest", "Oldest First"],
                ["az", "A to Z"],
                ["za", "Z to A"]
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-lg transition-all border ${
                    sortMode === mode
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm"
                      : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {playlistLoading && (
            <div className="flex items-center gap-2 text-[var(--text-muted)] py-4 justify-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> <span className="text-xs">Loading playlist...</span>
            </div>
          )}
          {playlistError && !playlistLoading && (
            <p className="text-xs text-[var(--text-muted)] text-center py-3">{playlistError}</p>
          )}

          {!playlistLoading && sortedTracks.length > 0 && (
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {sortedTracks.map((track, i) => {
                const isActive = currentSong.videoId === track.videoId;
                return (
                  <button
                    key={`${track.videoId}-${i}`}
                    id={`playlist-track-${i}`}
                    onClick={() => playTrack({ videoId: track.videoId, title: track.title, artist: track.artist, artwork: track.thumbnail }, i)}
                    className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors ${isActive ? "bg-[var(--primary)]/10" : "hover:bg-white/40"}`}
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-black/10 relative">
                      {track.thumbnail
                        ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Music className="w-3.5 h-3.5 text-[var(--text-muted)]" /></div>}
                      {isActive && currentSong.isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-end justify-center gap-0.5 pb-1.5">
                          {[0, 1, 2].map((b) => (
                            <span key={b} className="w-0.5 bg-white rounded-full animate-pulse" style={{ height: `${4 + b * 2}px`, animationDelay: `${b * 0.15}s` }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isActive ? "text-[var(--primary)]" : "text-[var(--text-main)]"}`}>{track.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{track.artist}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!playlistLoading && !playlistError && playlistTracks.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center py-4">Playlist is empty.</p>
          )}
        </div>
      </motion.div>

      {/* ── Activity Feed ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">Activity Feed</h3>
        </div>
        <div className="space-y-2.5">
          {activityLogs.slice(0, 10).map((log) => {
            const profile = log.userId === "user_a" ? userA : userB;
            return (
              <div key={log.id} className="flex items-start gap-3">
                <img src={profile.avatar} alt={profile.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5 border border-white/50" referrerPolicy="no-referrer" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-main)] leading-relaxed">
                    <span className="font-bold">{profile.name.split(" ")[0]}</span>{" "}{log.text}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                    {new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          {activityLogs.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center py-4">No activity yet. Start exploring the app! ✨</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}