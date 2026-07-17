/**
 * WatchPanel.tsx — Watch Together tab (Theater Sync)
 * Scrapbook redesign: removed tree-panel/tree-card, uses StickerButton
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Tv, Film, Plus, RefreshCw, Trash2, MessageSquare, Send,
  Smile, X,
  Play, Pause, Clock,
} from "lucide-react";
import { getDb } from "../../firebaseClient";
import { toast } from "sonner";
import { SectionHeader } from "../extras/SectionHeader";
import { triggerHaptic } from "../../lib/haptics";
import { StickerButton, WashiTapeDivider } from "../scrapbook";
import {
  record as recordLatency,
  getTabId,
  tabWriteTs,
  isLatencyOverlayEnabled,
} from "../../utils/latencyTracker";

const LATENCY_LISTENER_ID = "heartbeat:watch_room";

const EMOJI_BURSTS = ["💖", "😂", "🔥", "✨", "🥹", "👏"];

export default function WatchPanel() {
  const { currentUser, userA, userB, session } = useCouple();

  const [room, setRoom] = useState<{
    videoId: string;
    isPlaying: boolean;
    currentTime: number;
    chatMessages: { id: string; userId: string; text: string; ts: number }[];
  }>({ videoId: "", isPlaying: false, currentTime: 0, chatMessages: [] });

  const [videoInput, setVideoInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [seekInput, setSeekInput] = useState("");
  const [particles, setParticles] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const lastFirestoreSyncRef = useRef(0);

  // ── Safe postMessage to theater iframe ──────────────────────────────
  const safePostMessage = useCallback((msg: string) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(msg, "*");
    } catch {
      // Ignore — iframe channel may close during navigation
    }
  }, []);

  const [theaterSize, setTheaterSize] = useState<"compact" | "medium" | "expanded">(() => {
    return (localStorage.getItem("couple_theater_size") as any) || "medium";
  });

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;
  const isPartnerOnline = !partnerProfile.status?.toLowerCase().includes("waiting for connection");

  // Sizing changes listener from Workshop settings
  useEffect(() => {
    const handler = (e: Event) => { setTheaterSize((e as CustomEvent).detail); };
    window.addEventListener("theaterSizeChanged", handler);
    return () => window.removeEventListener("theaterSizeChanged", handler);
  }, []);

  // Listen to Firestore watch room doc
  useEffect(() => {
    if (!session) return;
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot, updateDoc, arrayRemove } = await import("firebase/firestore");
      const docRef = doc(db, "rooms", "watch_room");
      unsub = onSnapshot(docRef, async (d: any) => {
        if (d.exists() && d.data()) {
          const data = d.data();
          const now = Date.now();
          const cutoff = now - 24 * 60 * 60 * 1000;
          const rawMsgs = data.chatMessages || [];
          const validMsgs = rawMsgs.filter((m: any) => m.ts && m.ts >= cutoff);
          // ✅ Race-safe 24h trim: use arrayRemove on stale IDs only.
          // This avoids clobbering the array when concurrent arrayUnion(msg)
          // sends from sendChat are in flight.
          if (validMsgs.length < rawMsgs.length) {
            try {
              const staleIds = rawMsgs
                .filter((m: any) => !m.ts || m.ts < cutoff)
                .map((m: any) => m.id)
                .filter(Boolean);
              if (staleIds.length > 0) {
                await updateDoc(docRef, { chatMessages: arrayRemove(...staleIds) });
              }
            } catch (err) {
              console.error("[watch chat trim]", err);
            }
          }
          // ⏱️ Latency overlay instrumentation (dev-only): when this snapshot's
          // sibling _clientTabId matches our tab and listenerId matches, it's
          // our own write echoed back — record write→display delta.
          if (import.meta.env.DEV && isLatencyOverlayEnabled()) {
            const writeTs = typeof data._clientWriteTs === "number" ? data._clientWriteTs : null;
            const lsId = data._clientListenerId;
            const myId = data._clientTabId;
            if (writeTs != null && lsId === LATENCY_LISTENER_ID) {
              recordLatency(LATENCY_LISTENER_ID, {
                ts: now,
                deltaMs: myId === getTabId() ? now - writeTs : null,
                partnerWrite: myId !== getTabId(),
                stale: false,
              });
            }
          }
          // Compute new state outside setRoom to keep updater pure
          const newVideoId = data.videoId ?? "";
          const newIsPlaying = !!data.isPlaying;
          const newCurrentTime = typeof data.currentTime === 'number' ? data.currentTime : -1;
          let needsSeek = false;
          let seekTarget = -1;
          setRoom((prev) => {
            const isDifferentVideo = newVideoId && newVideoId !== prev.videoId;
            if (newCurrentTime >= 0 && prev.videoId === newVideoId && prev.videoId) {
              const localEstimate = prev.currentTime || 0;
              if (Math.abs(newCurrentTime - localEstimate) > 2) {
                needsSeek = true;
                seekTarget = newCurrentTime;
              }
            }
            return {
              videoId: newVideoId,
              isPlaying: isDifferentVideo ? false : newIsPlaying,
              chatMessages: validMsgs,
              currentTime: isDifferentVideo ? 0 : (needsSeek ? newCurrentTime : prev.currentTime || 0),
            };
          });
          // Dispatch seek AFTER state settles (pure updater = no side effects)
          if (needsSeek && newVideoId) {
            setTimeout(() => {
              safePostMessage(JSON.stringify({ event: "command", func: "seekTo", args: [seekTarget, true] }));
            }, 100);
          }
        }
      }, (err) => {
        console.error("[watch room listener]", err);
        toast.error("Failed to sync watch room. Check your connection.");
      });
    })();
    return () => { if (unsub) unsub(); };
  }, [session]);

  const setVideo = useCallback(async () => {
    const id = extractVideoId(videoInput);
    if (!id) { toast.error("Please enter a valid YouTube URL or ID."); return; }
    const db = await getDb();
    const { doc, setDoc } = await import("firebase/firestore");
    const docRef = doc(db, "rooms", "watch_room");
    await setDoc(docRef, { videoId: id, isPlaying: false, currentTime: 0, chatMessages: room.chatMessages || [],  ...tabWriteTs(LATENCY_LISTENER_ID) }, { merge: true });
    setVideoInput("");
    triggerHaptic("medium");
    toast.success("Video loaded! 🎬");
  }, [videoInput, room.chatMessages]);

  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const msg = { id: `${Date.now()}-${Math.random()}`, userId: currentUser, text: chatInput.trim(), ts: Date.now() };
    try {
      const db = await getDb();
      const { doc, updateDoc, arrayUnion } = await import("firebase/firestore");
      const docRef = doc(db, "rooms", "watch_room");
      // ✅ Race-safe: arrayUnion appends without clobbering concurrent partner messages.
      // After write, the listener trims to the most recent 50 (24h cutoff + last 50 cap).
      // ⏱️ Sibling fields stamped for the latency overlay (top-level so arrayUnion
      // doesn't try to merge them into the chatMessages array).
      await updateDoc(docRef, {
        chatMessages: arrayUnion(msg),
        ...tabWriteTs(LATENCY_LISTENER_ID),
      });
    } catch (e) {
      console.error("[sendChat]", e);
      toast.error("Couldn't send chat. Try again.");
      return;
    }
    setChatInput("");
    triggerHaptic("light");
  }, [chatInput, currentUser]);

  // ── Toggle play/pause — writes to Firestore to sync with partner ─────
  const togglePlay = useCallback(async () => {
    if (!room.videoId) return;
    const nextPlaying = !room.isPlaying;
    const db = await getDb();
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "rooms", "watch_room"), {
      videoId: room.videoId,
      isPlaying: nextPlaying,
      currentTime: room.currentTime || 0,
      chatMessages: room.chatMessages || [],
      ...tabWriteTs(LATENCY_LISTENER_ID),
    }, { merge: true });
    triggerHaptic("medium");
  }, [room.videoId, room.isPlaying, room.currentTime, room.chatMessages]);

  // ── Send play/pause commands to YouTube iframe when isPlaying changes ─
  useEffect(() => {
    if (!room.videoId) return;
    setRoom((prev) => {
      if (!prev.videoId) return prev;
      return prev;
    });
    const cmd = room.isPlaying ? "playVideo" : "pauseVideo";
    const t = setTimeout(() => {
      safePostMessage(JSON.stringify({ event: "command", func: cmd, args: [] }));
    }, 500); // 500ms delay so iframe JS API initializes
    return () => clearTimeout(t);
  }, [room.videoId, room.isPlaying, safePostMessage]);

  // ── Accurate progress tracking via YouTube iframe postMessage ───────
  // Listens for onInfoDelivery events which include exact currentTime
  // Throttles Firestore writes to every 5s to stay within write budget
  useEffect(() => {
    if (!room.videoId) return;

    const handler = (e: MessageEvent) => {
      // Only process messages from our YouTube iframe
      if (e.source !== iframeRef.current?.contentWindow) return;

      let data: any;
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }

      // ── onInfoDelivery: YouTube periodically sends currentTime
      if (data?.event === 'onInfoDelivery' && data.info?.currentTime != null) {
        const actualTime = data.info.currentTime;

        // Update local state so the time display stays accurate
        setRoom((prev) => {
          // Skip if time difference is negligible (< 500ms) to avoid re-render spam
          if (Math.abs(prev.currentTime - actualTime) < 0.5) return prev;
          return { ...prev, currentTime: actualTime };
        });

        // Throttled Firestore write (every 5s)
        const now = Date.now();
        if (now - lastFirestoreSyncRef.current >= 5000) {
          lastFirestoreSyncRef.current = now;
          (async () => {
            try {
              const db = await getDb();
              const { doc, setDoc } = await import("firebase/firestore");
              await setDoc(doc(db, "rooms", "watch_room"), {
                currentTime: actualTime,
                updatedAt: new Date().toISOString(),
                ...tabWriteTs(LATENCY_LISTENER_ID),
              }, { merge: true });
            } catch { /* skip */ }
          })();
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [room.videoId]);

  // ── Auto-scroll chat ────────────────────────────────────────────────
  useEffect(() => {
    if (chatBottomRef.current) {
      const container = chatBottomRef.current.parentElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [room.chatMessages?.length]);

  // ─── extractVideoId must be defined before setVideo/sendChat ───────────
  const extractVideoId = (url: string): string => {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return match ? match[1] : url.trim();
  };

  // ── Parse timestamp input (MM:SS, HH:MM:SS, or raw seconds) → seconds ─
  const parseTimestamp = useCallback((input: string): number | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    // Try MM:SS or HH:MM:SS
    const colonMatch = trimmed.match(/^(?:(\d+):)?(\d+):(\d+)$/);
    if (colonMatch) {
      if (colonMatch[1] !== undefined) {
        // HH:MM:SS
        return parseInt(colonMatch[1]) * 3600 + parseInt(colonMatch[2]) * 60 + parseInt(colonMatch[3]);
      }
      // MM:SS
      return parseInt(colonMatch[2]) * 60 + parseInt(colonMatch[3]);
    }
    // Try raw seconds (e.g. "90")
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 0) return num;
    return null;
  }, []);

  // ── Seek to timestamp — syncs with partner via Firestore ────────────
  const handleSeek = useCallback(async () => {
    const seconds = parseTimestamp(seekInput);
    if (seconds === null || !room.videoId) {
      toast.error("Enter a valid timestamp (e.g. 1:30 or 90).");
      return;
    }
    // Seek local iframe
    safePostMessage(JSON.stringify({ event: "command", func: "seekTo", args: [seconds, true] }));
    // Update local state
    setRoom((prev) => ({ ...prev, currentTime: seconds }));
    // Sync to Firestore so partner also seeks
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "watch_room"), {
        currentTime: seconds,
        updatedAt: new Date().toISOString(),
        ...tabWriteTs(LATENCY_LISTENER_ID),
      }, { merge: true });
    } catch { /* skip */ }
    setSeekInput("");
    triggerHaptic("medium");
    const fmt = seconds >= 3600
      ? `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
      : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    toast.success(`Sought to ${fmt} ⏩`);
  }, [seekInput, room.videoId, safePostMessage, parseTimestamp]);

  const burstEmoji = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setParticles((prev) => [...prev, { id, emoji, x: Math.random() * 80 + 10, y: Math.random() * 60 + 20 }]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), 2000);
    triggerHaptic("light");
  };

  return (
    <div>
      <SectionHeader
        chapter="The Heartbeat"
        title="Co-Watching Theater"
        subtitle="Watch videos together synchronized in real-time."
      />

      <WashiTapeDivider color="lavender" label="Screen" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        {/* Left Movie Player Stream */}
        <div className={`${theaterSize === "compact" ? "lg:col-span-5" : theaterSize === "expanded" ? "lg:col-span-9" : "lg:col-span-8"} space-y-4 transition-all duration-300`}>
          {/* Cinematic Wood Easel Frame */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-[16px] border-[var(--wood-walnut)] bg-[var(--wood-walnut)] shadow-[inset_0_4px_12px_rgba(0,0,0,0.95),0_10px_30px_rgba(0,0,0,0.65)] p-0.5" style={{ paddingBottom: "56.25%", height: 0 }}>
              {room.videoId ? (
                <iframe key={iframeKey} ref={iframeRef}
                  src={`https://www.youtube.com/embed/${room.videoId}?autoplay=0&rel=0&enablejsapi=1&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`}
                  title="Watch Together"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen className="absolute inset-0 w-full h-full border-0 rounded-xl" />
              ) : (
                <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-neutral-500 border border-white/15">
                    <Tv className="w-8 h-8 stroke-1" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">Private Movie Theater Screen</p>
                    <p className="text-neutral-500 text-xs mt-1 max-w-sm">Enter a YouTube URL below to load your favorite stream!</p>
                  </div>
                </div>
              )}
              {particles.map((p) => (
                <motion.div key={p.id} initial={{ opacity: 1, scale: 0.5, y: 0 }}
                  animate={{ opacity: 0, y: -100, scale: 1.6 }} transition={{ duration: 2.2, ease: "easeOut" }}
                  className="absolute text-3xl pointer-events-none z-30" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                  {p.emoji}
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between px-20 -mt-2 relative z-0">
              <div className="w-5 h-16 bg-[var(--wood-walnut)] rounded-b shadow-lg transform rotate-12 border-t border-[var(--wood-oak)]/20" />
              <div className="w-4 h-24 bg-[var(--wood-oak)] rounded-b shadow-md -mt-2 border-t border-black/10" />
              <div className="w-5 h-16 bg-[var(--wood-walnut)] rounded-b shadow-lg transform -rotate-12 border-t border-[var(--wood-oak)]/20" />
            </div>
          </div>

          {/* Control Panel */}
          <div className="p-5 rounded-3xl border border-[var(--wood-oak)]/15"
            style={{ backgroundColor: "var(--fabric-cream)" }}>
            <div className="flex gap-2">
              <input type="text" value={videoInput} onChange={(e) => setVideoInput(e.target.value)}
                placeholder="Paste YouTube URL or ID..." onKeyDown={(e) => e.key === "Enter" && setVideo()}
                className="flex-1 bg-black/5 text-xs rounded-lg px-3 outline-none border border-transparent focus:border-[var(--primary)] text-gray-800 font-semibold" />
              <StickerButton onClick={setVideo} color="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Load
              </StickerButton>
              {room.videoId && (
                <StickerButton onClick={togglePlay} color="primary" size="sm"
                  icon={room.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}>
                  {room.isPlaying ? "Pause" : "Play"}
                </StickerButton>
              )}
              <button onClick={() => setIframeKey((k) => k + 1)} title="Force refresh"
                className="p-2 border border-[var(--wood-oak)]/25 hover:border-[var(--primary)] bg-[var(--fabric-cream)] rounded-lg transition-all cursor-pointer">
                <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
              <button onClick={async () => { const __db = await getDb(); const { doc: __doc, setDoc: __set } = await import("firebase/firestore"); const __dr = __doc(__db, "rooms", "watch_room"); await __set(__dr, { videoId: "", isPlaying: false, chatMessages: room.chatMessages || [] }, { merge: true }); }}
                title="Clear Screen" className="p-2 border border-[var(--wood-oak)]/25 hover:bg-[var(--primary)]/10 rounded-lg transition-all cursor-pointer">
                <Trash2 className="w-4 h-4 text-rose-500" />
              </button>
            </div>

            {/* Timestamp Seek */}
            {room.videoId && (
              <div className="flex gap-2 mt-3">
                <div className="flex items-center gap-1.5 flex-1 bg-black/5 rounded-lg px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input type="text" value={seekInput} onChange={(e) => setSeekInput(e.target.value)}
                    placeholder="1:30 or 90s..." onKeyDown={(e) => e.key === "Enter" && handleSeek()}
                    className="flex-1 bg-transparent text-xs outline-none text-[var(--text-main)] font-semibold" />
                </div>
                <StickerButton onClick={handleSeek} color="tan" size="sm" icon={<Clock className="w-3.5 h-3.5" />}>
                  Seek
                </StickerButton>
                {/* Current time display */}
                <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)]">
                  <span>{room.currentTime >= 3600
                    ? `${Math.floor(room.currentTime / 3600)}:${String(Math.floor((room.currentTime % 3600) / 60)).padStart(2, "0")}:${String(room.currentTime % 60).padStart(2, "0")}`
                    : `${Math.floor(room.currentTime / 60)}:${String(room.currentTime % 60).padStart(2, "0")}`}</span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Chat Window */}
        <div className={`${theaterSize === "compact" ? "lg:col-span-7" : theaterSize === "expanded" ? "lg:col-span-3" : "lg:col-span-4"} flex flex-col justify-between p-4 sm:p-5 h-[360px] sm:h-[480px] overflow-hidden shadow-xl transition-all duration-300 rounded-3xl border-2 border-[var(--wood-oak)]/30`}
          style={{ backgroundColor: "var(--fabric-cream)" }}>
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] border-b pb-2 flex items-center gap-1.5 flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-rose-500 animate-pulse" /> Theater Chat Log
              </h4>
              <div className="space-y-3.5 mt-3 flex-1 overflow-y-auto text-xs pr-1 scrollbar-thin scrollbar-thumb-black/5 pl-1.5">
                {room.chatMessages && room.chatMessages.length > 0 ? (
                  room.chatMessages.map((msg) => {
                    const profile = msg.userId === "user_a" ? userA : userB;
                    return (
                      <div key={msg.id} className="font-serif border-b border-[var(--wood-oak)]/10 pb-2.5 text-left">
                        <div className="flex items-center gap-2 text-[9px] font-mono text-[var(--text-muted)] mb-1">
                          <img src={profile.avatar} alt={profile.name} className="w-4 h-4 rounded-full object-cover border border-[var(--wood-oak)]/20" loading="lazy" />
                          <span className="font-bold text-[var(--primary)]">{profile.name.split(" ")[0]}</span>
                          <span>·</span>
                          <span>{new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-[var(--text-main)] font-handwrite text-base italic leading-relaxed pl-3.5 border-l-2 border-[var(--primary)]/30">{msg.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[var(--text-muted)] space-y-1">
                    <Smile className="w-8 h-8 text-neutral-300 stroke-1" />
                    <p className="text-xs">No entries in the log yet.</p>
                    <p className="text-[10px]">Type below to note your thoughts!</p>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            </div>
            <div className="space-y-2 flex-shrink-0">
              <div className="flex justify-between items-center bg-black/5 p-1 rounded-lg">
                {EMOJI_BURSTS.map((emoji) => (
                  <button key={emoji} onClick={() => burstEmoji(emoji)}
                    className="text-lg hover:scale-135 active:scale-90 transition-all cursor-pointer">{emoji}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Write comment..."
                  className="flex-1 bg-black/5 text-xs rounded-lg px-3 outline-none border border-transparent focus:border-[var(--primary)] text-gray-800 font-semibold" />
                <StickerButton onClick={sendChat} color="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                  Send
                </StickerButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
