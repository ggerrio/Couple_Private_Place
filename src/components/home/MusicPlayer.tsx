/**
 * MusicPlayer.tsx — Slim Orchestrator
 * Composes MusicPlayerControls, MusicPlayerLyrics, and MusicPlayerPlaylist.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion } from "motion/react";
import { ChevronDown, ChevronUp, Music } from "lucide-react";
import { MusicPlayerControls } from "./MusicPlayerControls";
import { MusicPlayerLyrics } from "./MusicPlayerLyrics";
import { MusicPlayerPlaylist } from "./MusicPlayerPlaylist";
import {
  PlaylistTrack, SortMode, RepeatMode,
  fetchPlaylist, fetchVideoDuration, fetchVideoMeta, fetchLyrics, extractVideoId,
  triggerHaptic,
} from "./MusicPlayerUtils";
import { getDb } from "../../firebaseClient";

export function MusicPlayer() {
  const { currentSong, syncSongToPartner, setSongPlayState, updateSongProgress }: any = useCouple();
  const SHARED_PLAYLIST_ID = "PLdf4QJ5Wy29c";

  const [musicExpanded, setMusicExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState("");
  const [lyricsLines, setLyricsLines] = useState<any[] | null>(null);
  const [lyricsSynced, setLyricsSynced] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState("");
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([]);
  const [localVolume, setLocalVolume] = useState(() => Number(localStorage.getItem("music_volume") || "100"));
  const [sharedQueue, setSharedQueue] = useState<any[]>([]);

  // Sync queue from Firestore
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
      const q = query(collection(db, "shared_queue"), orderBy("addedAt", "asc"));
      unsub = onSnapshot(q, (snap) => {
        setSharedQueue(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.error("[MusicPlayer queue listener]", err);
      });
    })();
    return () => { if (unsub) unsub(); };
  }, []);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const lyricsLineRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleVolumeChange = (val: number) => {
    setLocalVolume(val);
    window.dispatchEvent(new CustomEvent("setMusicVolume", { detail: val }));
  };

  // Handle scrub: update local progress + dispatch event for YT seek + Firestore sync
  const handleSeek = useCallback((newProgressMs: number) => {
    updateSongProgress(newProgressMs);
    window.dispatchEvent(new CustomEvent("musicSeekTo", { detail: newProgressMs }));
  }, [updateSongProgress]);

  // Load playlist
  useEffect(() => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
    if (!apiKey) { setPlaylistError("Add VITE_YOUTUBE_API_KEY to load the playlist."); return; }
    const ac = new AbortController();
    (async () => {
      setPlaylistLoading(true); setPlaylistError("");
      try { const tracks = await fetchPlaylist(SHARED_PLAYLIST_ID, apiKey, ac.signal); setPlaylistTracks(tracks); }
      catch (e: any) { if (e.name !== "AbortError") setPlaylistError("Couldn't load the shared playlist right now."); }
      finally { setPlaylistLoading(false); }
    })();
    return () => ac.abort();
  }, []);

  const sortedTracks = useMemo(() => {
    const list = [...playlistTracks];
    if (sortMode === "oldest") return list.reverse();
    if (sortMode === "az") return list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortMode === "za") return list.sort((a, b) => b.title.localeCompare(a.title));
    return list;
  }, [playlistTracks, sortMode]);

  const currentTrackIndex = sortedTracks.findIndex((t) => t.videoId === currentSong.videoId);

  // Fetch lyrics
  useEffect(() => {
    if (!currentSong.videoId || !currentSong.title) { setLyricsLines(null); setLyricsError(""); return; }
    const ac = new AbortController();
    (async () => {
      setLyricsLoading(true); setLyricsError(""); setLyricsLines(null);
      const result = await fetchLyrics(currentSong.title, currentSong.artist, ac.signal);
      if (ac.signal.aborted) return;
      if (!result) setLyricsError("Lyrics not found for this track.");
      else { setLyricsLines(result.lines); setLyricsSynced(result.synced); }
      setLyricsLoading(false);
    })();
    return () => ac.abort();
  }, [currentSong.videoId, currentSong.title, currentSong.artist]);

  const activeLineIndex = useMemo(() => {
    if (!lyricsLines || !lyricsSynced) return -1;
    let idx = -1;
    for (let i = 0; i < lyricsLines.length; i++) {
      if (lyricsLines[i].time <= currentSong.progressMs) idx = i; else break;
    }
    return idx;
  }, [lyricsLines, lyricsSynced, currentSong.progressMs]);

  // Auto-scroll lyrics
  useEffect(() => {
    if (activeLineIndex < 0 || !lyricsScrollRef.current) return;
    const activeEl = lyricsLineRefs.current[activeLineIndex];
    const container = lyricsScrollRef.current;
    if (activeEl && container) {
      container.scrollTo({ top: activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2, behavior: "smooth" });
    }
  }, [activeLineIndex]);

  const playTrack = useCallback(async (track: { videoId: string; title: string; artist: string; artwork?: string; thumbnail?: string }) => {
    triggerHaptic("medium");
    const durationMs = await fetchVideoDuration(track.videoId);
    syncSongToPartner({ title: track.title, artist: track.artist, album: "Romantic Vibe", artwork: track.artwork || track.thumbnail || "", durationMs, progressMs: 0, isPlaying: true, videoId: track.videoId });
  }, [syncSongToPartner]);

  const goToOffset = useCallback(async (offset: number) => {
    if (offset === 1 && sharedQueue.length > 0) {
      const nextFromQueue = sharedQueue[0];
      await playTrack({
        videoId: nextFromQueue.videoId,
        title: nextFromQueue.title,
        artist: nextFromQueue.artist,
        artwork: nextFromQueue.artwork
      });
      try {
        const db = await getDb();
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "shared_queue", nextFromQueue.id));
      } catch (e) {
        console.error("[goToOffset remove queue item error]", e);
      }
      return;
    }

    if (sortedTracks.length === 0) return;
    const currentIndex = sortedTracks.findIndex((t) => t.videoId === currentSong.videoId);
    let nextIndex = shuffleOn ? Math.floor(Math.random() * sortedTracks.length) : (currentIndex === -1 ? 0 : (currentIndex + offset + sortedTracks.length) % sortedTracks.length);
    const nextTrack = sortedTracks[nextIndex];
    if (nextTrack) playTrack({ videoId: nextTrack.videoId, title: nextTrack.title, artist: nextTrack.artist, artwork: nextTrack.thumbnail });
  }, [sortedTracks, currentSong.videoId, shuffleOn, playTrack, sharedQueue]);

  const handleSearchOrPaste = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchError("");
    const pastedId = extractVideoId(q);
    if (pastedId) {
      setSearching(true);
      const meta = await fetchVideoMeta(pastedId);
      await playTrack({ videoId: pastedId, title: meta?.title || "YouTube Track", artist: meta?.artist || "", artwork: meta?.artwork || "" });
      setSearching(false); setSearchQuery(""); return;
    }
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
    if (!apiKey) { setSearchError("Search needs a YouTube API key."); return; }
    setSearching(true);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&videoCategoryId=10&q=${encodeURIComponent(q)}&key=${apiKey}`);
      const json = await res.json();
      const item = json.items?.[0];
      if (!item) { setSearchError("No matching track found."); return; }
      await playTrack({ videoId: item.id.videoId, title: item.snippet.title, artist: item.snippet.channelTitle, artwork: item.snippet.thumbnails?.medium?.url || "" });
      setSearchQuery("");
    } catch { setSearchError("Search failed. Try again."); }
    finally { setSearching(false); }
  }, [searchQuery, playTrack]);

  // Auto-play next song
  useEffect(() => {
    if (!currentSong.isPlaying || !currentSong.durationMs || currentSong.progressMs < currentSong.durationMs) return;
    const now = Date.now();
    const lastSkip = (window as any)._lastAutoSkipTime || 0;
    if (now - lastSkip < 4000) return;
    (window as any)._lastAutoSkipTime = now;
    if (repeatMode === "one") {
      playTrack({ videoId: currentSong.videoId, title: currentSong.title, artist: currentSong.artist, artwork: currentSong.artwork });
    } else { goToOffset(1); }
  }, [currentSong.isPlaying, currentSong.progressMs, currentSong.durationMs, currentSong.videoId, currentSong.title, currentSong.artist, currentSong.artwork, repeatMode, playTrack, goToOffset]);

  return (
    <div className="relative space-y-5 transition-all duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full radio-brass-knob flex items-center justify-center">
              <Music className="w-4 h-4" style={{ color: '#1A0E08' }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)] font-serif">Listening Treehouse</h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {currentSong.isPlaying ? `Now playing: ${currentSong.title}` : "Pick a song or paste a YouTube link"}
              </p>
            </div>
          </div>
          <button onClick={() => setMusicExpanded(!musicExpanded)} className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer">
            {musicExpanded ? <ChevronUp className="w-4 h-4 text-amber-200/60" /> : <ChevronDown className="w-4 h-4 text-amber-200/60" />}
          </button>
        </div>

        {musicExpanded && (
          <>
            <MusicPlayerControls
              currentSong={currentSong}
              shuffleOn={shuffleOn}
              repeatMode={repeatMode}
              localVolume={localVolume}
              onTogglePlay={() => setSongPlayState(!currentSong.isPlaying)}
              onShuffle={() => setShuffleOn(!shuffleOn)}
              onRepeat={() => setRepeatMode((p) => p === "off" ? "all" : p === "all" ? "one" : "off")}
              onSkipBack={() => goToOffset(-1)}
              onSkipForward={() => goToOffset(1)}
              onVolumeChange={handleVolumeChange}
              onSeek={handleSeek}
            />

            {currentSong.isPlaying && (
              <MusicPlayerLyrics
                lyricsLines={lyricsLines}
                lyricsSynced={lyricsSynced}
                lyricsLoading={lyricsLoading}
                lyricsError={lyricsError}
                activeLineIndex={activeLineIndex}
                lyricsScrollRef={lyricsScrollRef}
                lyricsLineRefs={lyricsLineRefs}
              />
            )}

            <MusicPlayerPlaylist
              searchQuery={searchQuery}
              searchError={searchError}
              searching={searching}
              onSearchQueryChange={setSearchQuery}
              onSearch={handleSearchOrPaste}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              playlistLoading={playlistLoading}
              playlistError={playlistError}
              sortedTracks={sortedTracks}
              currentTrackIndex={currentTrackIndex}
              onPlayTrack={(track) => playTrack(track)}
            />
          </>
        )}
      </div>
  );
}
