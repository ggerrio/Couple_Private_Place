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
} from "lucide-react";
import { getDb } from "../../firebaseClient";
import { toast } from "sonner";
import { SectionHeader } from "../extras/SectionHeader";
import { triggerHaptic } from "../../lib/haptics";
import { StickerButton, WashiTapeDivider } from "../scrapbook";

const EMOJI_BURSTS = ["💖", "😂", "🔥", "✨", "🥹", "👏"];

export default function WatchPanel() {
  const { currentUser, userA, userB, session } = useCouple();

  const [room, setRoom] = useState<{
    videoId: string;
    isPlaying: boolean;
    chatMessages: { id: string; userId: string; text: string; ts: number }[];
  }>({ videoId: "", isPlaying: false, chatMessages: [] });

  const [videoInput, setVideoInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [particles, setParticles] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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
      const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
      const docRef = doc(db, "rooms", "watch_room");
      unsub = onSnapshot(docRef, async (d: any) => {
        if (d.exists() && d.data()) {
          const data = d.data();
          const now = Date.now();
          const cutoff = now - 24 * 60 * 60 * 1000;
          const rawMsgs = data.chatMessages || [];
          const validMsgs = rawMsgs.filter((m: any) => m.ts && m.ts >= cutoff);
          if (validMsgs.length < rawMsgs.length) {
            try { await setDoc(docRef, { chatMessages: validMsgs }, { merge: true }); } catch {}
          }
          setRoom({ videoId: data.videoId ?? "", isPlaying: !!data.isPlaying, chatMessages: validMsgs });
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
    await setDoc(docRef, { videoId: id, isPlaying: false, chatMessages: room.chatMessages || [] }, { merge: true });
    setVideoInput("");
    triggerHaptic("medium");
    toast.success("Video loaded! 🎬");
  }, [videoInput, room.chatMessages]);

  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const msg = { id: `${Date.now()}-${Math.random()}`, userId: currentUser, text: chatInput.trim(), ts: Date.now() };
    const db = await getDb();
    const { doc, setDoc } = await import("firebase/firestore");
    const docRef = doc(db, "rooms", "watch_room");
    await setDoc(docRef, { videoId: room.videoId || "", isPlaying: room.isPlaying, chatMessages: [...(room.chatMessages || []).slice(-49), msg] }, { merge: true });
    setChatInput("");
    triggerHaptic("light");
  }, [chatInput, room, currentUser]);

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
                <iframe key={iframeKey}
                  src={`https://www.youtube.com/embed/${room.videoId}?autoplay=0&rel=0`}
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
              <button onClick={() => setIframeKey((k) => k + 1)} title="Force refresh"
                className="p-2 border border-[var(--wood-oak)]/25 hover:border-[var(--primary)] bg-[var(--fabric-cream)] rounded-lg transition-all cursor-pointer">
                <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
              </button>
              <button onClick={async () => { const __db = await getDb(); const { doc: __doc, setDoc: __set } = await import("firebase/firestore"); const __dr = __doc(__db, "rooms", "watch_room"); await __set(__dr, { videoId: "", isPlaying: false, chatMessages: room.chatMessages || [] }, { merge: true }); }}
                title="Clear Screen" className="p-2 border border-[var(--wood-oak)]/25 hover:bg-[var(--primary)]/10 rounded-lg transition-all cursor-pointer">
                <Trash2 className="w-4 h-4 text-rose-500" />
              </button>
            </div>

          </div>
        </div>

        {/* Right Chat Window */}
        <div className={`${theaterSize === "compact" ? "lg:col-span-7" : theaterSize === "expanded" ? "lg:col-span-3" : "lg:col-span-4"} flex flex-col justify-between p-5 h-[480px] overflow-hidden shadow-xl transition-all duration-300 rounded-3xl border-2 border-[var(--wood-oak)]/30`}
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
