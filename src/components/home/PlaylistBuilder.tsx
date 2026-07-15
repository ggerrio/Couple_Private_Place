/**
 * PlaylistBuilder.tsx — Shared collaborative playlist queue
 * Partners can add songs to a shared queue that persists in Firestore.
 * Integrates with the existing MusicPlayer's syncSongToPartner.
 */
import React, { useState, useEffect, useCallback } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Music, Trash2, Play, Search, X } from "lucide-react";
import { getDb } from "../../firebaseClient";
import { toast } from "sonner";
import { Skeleton } from "../extras/Skeleton";
import { extractVideoId, fetchVideoMeta, fetchVideoDuration } from "./MusicPlayerUtils";

interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  artwork: string;
  addedBy: "user_a" | "user_b";
  addedAt: string;
}

export default function PlaylistBuilder() {
  const { currentUser, userA, userB, syncSongToPartner } = useCouple();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [loading, setLoading] = useState(true);

  // Sync queue from Firestore
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
      const q = query(collection(db, "shared_queue"), orderBy("addedAt", "asc"));
      unsub = onSnapshot(q, (snap) => {
        setQueue(snap.docs.map((d) => ({
          id: d.id,
          videoId: d.data().videoId || "",
          title: d.data().title || "",
          artist: d.data().artist || "",
          artwork: d.data().artwork || "",
          addedBy: d.data().addedBy || "user_a",
          addedAt: d.data().addedAt || "",
        })));
        setLoading(false);
      }, (err) => {
        console.error("[queue listener]", err);
        toast.error("Failed to sync shared queue.");
        setLoading(false);
      });
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const addToQueue = useCallback(async (videoId: string, title: string, artist: string, artwork: string) => {
    try {
      const db = await getDb();
      const { collection, addDoc } = await import("firebase/firestore");
      await addDoc(collection(db, "shared_queue"), {
        videoId,
        title,
        artist,
        artwork: artwork || "",
        addedBy: currentUser,
        addedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[addToQueue]", e);
      toast.error("Failed to add to queue");
    }
  }, [currentUser]);

  const removeFromQueue = useCallback(async (id: string) => {
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "shared_queue", id));
    } catch (e) {
      console.error("[removeFromQueue]", e);
    }
  }, []);

  const playNow = useCallback(async (item: QueueItem) => {
    const videoDurationMs = await fetchVideoDuration(item.videoId);
    syncSongToPartner({
      title: item.title,
      artist: item.artist,
      album: "",
      artwork: item.artwork,
      durationMs: videoDurationMs || 0,
      progressMs: 0,
      isPlaying: true,
      videoId: item.videoId,
    });
    removeFromQueue(item.id);
    toast.success(`Now playing: ${item.title}`);
  }, [syncSongToPartner, removeFromQueue]);

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;

    const pastedId = extractVideoId(q);
    if (pastedId) {
      setSearching(true);
      const meta = await fetchVideoMeta(pastedId);
      await addToQueue(
        pastedId,
        meta?.title || "YouTube Track",
        meta?.artist || "Unknown",
        meta?.artwork || ""
      );
      setSearching(false);
      setSearchQuery("");
      return;
    }

    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
    if (!apiKey) { toast.error("Add VITE_YOUTUBE_API_KEY to search"); return; }

    setSearching(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&videoCategoryId=10&q=${encodeURIComponent(q)}&key=${apiKey}`
      );
      const json = await res.json();
      const item = json.items?.[0];
      if (!item) { toast.error("No matching track found."); return; }
      await addToQueue(
        item.id.videoId,
        item.snippet.title,
        item.snippet.channelTitle,
        item.snippet.thumbnails?.medium?.url || ""
      );
      setSearchQuery("");
    } catch {
      toast.error("Search failed.");
    } finally {
      setSearching(false);
    }
  }, [searchQuery, addToQueue]);

  const partnerName = currentUser === "user_a" ? userB.name.split(" ")[0] : userA.name.split(" ")[0];

  if (loading) {
    return (
      <div id="playlist-builder" role="status" aria-label="Loading shared queue">
        <div className="bg-[var(--fabric-cream)]/40 border border-[var(--wood-oak)]/15 rounded-3xl p-4 md:p-5">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Skeleton width={16} height={16} rounded="6px" />
              <Skeleton height={18} width={110} rounded="6px" />
              <Skeleton height={14} width={60} rounded="4px" />
            </div>
            <Skeleton height={18} width={80} rounded="6px" />
          </div>

          {/* Queue items skeleton — 3 items */}
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white/50 border border-[var(--border-color)] rounded-xl p-2.5">
                <Skeleton width={32} height={32} rounded="50%" />
                <Skeleton width={32} height={32} rounded="8px" />
                <div className="flex-1 space-y-1">
                  <Skeleton height={14} width={`${60 + i * 10}%`} rounded="6px" />
                  <Skeleton height={10} width={`${40 + i * 8}%`} rounded="4px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="playlist-builder">
      <div className="bg-[var(--fabric-cream)]/40 border border-[var(--wood-oak)]/15 rounded-3xl p-4 md:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-[var(--text-main)] font-serif">Shared Queue</h3>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">({queue.length} songs)</span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[var(--primary)] font-bold hover:underline cursor-pointer"
          >
            {expanded ? "Collapse" : "Add Song +"}
          </button>
        </div>

        {/* Search / Add form */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-3"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search or paste YouTube link..."
                  className="flex-1 text-xs px-3 py-2 bg-white/70 border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)]"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-3 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer hover:opacity-90 flex items-center gap-1"
                >
                  {searching ? "..." : <Search className="w-3.5 h-3.5" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Queue list */}
        {queue.length === 0 ? (
          <div className="text-center py-6">
            <Music className="w-8 h-8 text-[var(--text-muted)]/30 mx-auto mb-2" />
            <p className="text-xs text-[var(--text-muted)] italic">Queue is empty. Add a song together! 🎵</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1" data-lenis-prevent>
            {queue.map((item, idx) => {
              const isMine = item.addedBy === currentUser;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-2.5 bg-white/50 border border-[var(--border-color)] rounded-xl p-2.5 group hover:bg-white/70 transition-colors"
                >
                  {/* Play button */}
                  <button
                    onClick={() => playNow(item)}
                    className="w-8 h-8 rounded-full bg-[var(--primary)]/10 hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white flex items-center justify-center transition-all cursor-pointer flex-shrink-0 border border-[var(--primary)]/20"
                    title="Play now"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  {/* Thumbnail */}
                  {item.artwork ? (
                    <img src={item.artwork} alt={item.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-[var(--text-muted)]/40" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[var(--text-main)] truncate">{item.title}</p>
                    <p className="text-[9px] text-[var(--text-muted)] truncate font-mono">
                      {item.artist} · Added by {isMine ? "you" : partnerName}
                    </p>
                  </div>

                  {/* Remove */}
                  {isMine && (
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-all cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
