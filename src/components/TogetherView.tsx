/**
 * TogetherView.tsx — rebuilt from zero.
 *
 * Fixes:
 *  - Activity status preset writes to DB only on button click, never via useEffect watching profile state
 *  - Watch Together uses Firestore rooms/watch_room for sync state; plain <iframe> embed (no window.postMessage or YouTube JS API)
 *  - Letter schedule validation enforced before send
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Radio, Film, Plus, X, Lock, LockOpen, Send, Heart,
  Play, Pause, ChevronRight, Smile, RefreshCw, Trash2,
} from "lucide-react";
import { db } from "../firebaseClient";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

type Section = "letters" | "status" | "watch";

// ─── Status presets ────────────────────────────────────────────────────────────
const STATUS_PRESETS = [
  { emoji: "📚", label: "Studying" },
  { emoji: "💻", label: "Coding" },
  { emoji: "☕", label: "Drinking Coffee" },
  { emoji: "😴", label: "Sleeping" },
  { emoji: "🎮", label: "Gaming" },
  { emoji: "🎵", label: "Listening to Music" },
  { emoji: "🍳", label: "Cooking" },
  { emoji: "📱", label: "On Phone" },
  { emoji: "🏃", label: "Working Out" },
  { emoji: "🌸", label: "Relaxing" },
  { emoji: "✈️", label: "Traveling" },
  { emoji: "💖", label: "Thinking of You" },
];

const LETTER_REACTIONS = ["💖", "✨", "😭", "🥰", "💌", "🌸"];

// ─── Emoji particles (Theater) ─────────────────────────────────────────────────
interface EmojiParticle { id: string; emoji: string; x: number; y: number }

// ─── Component ────────────────────────────────────────────────────────────────

export default function TogetherView() {
  const [section, setSection] = useState<Section>("letters");

  return (
    <div className="space-y-4 py-2">
      <div className="glass-panel rounded-2xl p-1.5 flex gap-1">
        {([["letters", "Letters", Mail], ["status", "Status", Radio], ["watch", "Theater", Film]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            id={`together-tab-${id}`}
            onClick={() => setSection(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${section === id ? "bg-[var(--primary)] text-white shadow" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {section === "letters" && <LettersSection key="letters" />}
        {section === "status" && <StatusSection key="status" />}
        {section === "watch" && <WatchSection key="watch" />}
      </AnimatePresence>
    </div>
  );
}

// ─── Letters ──────────────────────────────────────────────────────────────────

function LettersSection() {
  const { letters, sendLetter, openLetter, reactToLetter, currentUser, userA, userB } = useCouple();
  const [showCompose, setShowCompose] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", recipientId: "user_b" as "user_a" | "user_b", scheduledFor: "" });

  const handleSend = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (form.scheduledFor && new Date(form.scheduledFor) <= new Date()) {
      alert("Scheduled date must be in the future.");
      return;
    }
    sendLetter({ title: form.title.trim(), content: form.content.trim(), recipientId: form.recipientId, scheduledFor: form.scheduledFor || undefined });
    setForm({ title: "", content: "", recipientId: "user_b", scheduledFor: "" });
    setShowCompose(false);
  };

  const isLocked = (letter: any) => {
    if (!letter.scheduledFor) return false;
    return new Date(letter.scheduledFor) > new Date();
  };

  const openedLetter = selectedLetter ? letters.find((l) => l.id === selectedLetter) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-main)]">Live Letters</h3>
        <button id="compose-letter-btn" onClick={() => setShowCompose(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> Compose
        </button>
      </div>

      {/* Compose modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-3 shadow-2xl my-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800">✉️ Compose Letter</h4>
                <button onClick={() => setShowCompose(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1">To</p>
                <select value={form.recipientId} onChange={(e) => setForm((p) => ({ ...p, recipientId: e.target.value as any }))}
                  className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none">
                  <option value="user_a">{userA.name}</option>
                  <option value="user_b">{userB.name}</option>
                </select>
              </div>
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Letter title *" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="Write your letter... (Markdown supported)" rows={6} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none resize-none font-mono" />
              <div>
                <p className="text-[10px] text-gray-400 mb-1">Schedule reveal (optional — must be future date)</p>
                <input type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm((p) => ({ ...p, scheduledFor: e.target.value }))} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              </div>
              <button onClick={handleSend} className="w-full py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl text-sm hover:opacity-90">
                {form.scheduledFor ? "Seal & Schedule 🔒" : "Send Letter 💌"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter detail */}
      <AnimatePresence>
        {openedLetter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl my-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-800 text-sm leading-tight pr-4">{openedLetter.title}</h4>
                <button onClick={() => setSelectedLetter(null)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <div className="bg-amber-50 rounded-2xl p-4 mb-4">
                <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{openedLetter.content}</pre>
              </div>
              <div className="flex gap-2 flex-wrap">
                {LETTER_REACTIONS.map((emoji) => (
                  <button key={emoji} onClick={() => reactToLetter(openedLetter.id, emoji)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all hover:scale-110 ${openedLetter.reactions.includes(emoji) ? "bg-rose-100 border-rose-300" : "bg-gray-50 border-gray-200"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
              {openedLetter.reactions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {openedLetter.reactions.map((r, i) => <span key={i} className="text-lg">{r}</span>)}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letters list */}
      {letters.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]"><Mail className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No letters yet. Write your first! 💌</p></div>
      )}

      {letters.map((letter) => {
        const sender = letter.senderId === "user_a" ? userA : userB;
        const locked = isLocked(letter);
        return (
          <div key={letter.id} className={`glass-panel rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${locked ? "opacity-70" : ""}`}
            onClick={() => {
              if (locked) return;
              if (!letter.isOpened && letter.recipientId === currentUser) openLetter(letter.id);
              setSelectedLetter(letter.id);
            }}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${locked ? "bg-gray-100" : "bg-rose-100"}`}>
                {locked ? <Lock className="w-4 h-4 text-gray-400" /> : <LockOpen className="w-4 h-4 text-rose-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-[var(--text-main)] truncate">{locked ? "🔒 Sealed until " + new Date(letter.scheduledFor!).toLocaleDateString() : letter.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <img src={sender.avatar} alt={sender.name} className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <span className="text-[10px] text-[var(--text-muted)]">From {sender.name.split(" ")[0]}</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(letter.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {!letter.isOpened && letter.recipientId === currentUser && !locked && (
                <span className="text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold flex-shrink-0">NEW</span>
              )}
              {letter.reactions.length > 0 && (
                <div className="flex gap-0.5 flex-shrink-0">
                  {letter.reactions.slice(0, 3).map((r, i) => <span key={i} className="text-sm">{r}</span>)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── Status ───────────────────────────────────────────────────────────────────

function StatusSection() {
  const { currentUser, userA, userB, updateProfile } = useCouple();
  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;
  const [customStatus, setCustomStatus] = useState("");

  // Write only on explicit click — never inside a useEffect watching profile
  const setPreset = useCallback((preset: typeof STATUS_PRESETS[0]) => {
    updateProfile(currentUser, { status: `${preset.emoji} ${preset.label}` });
  }, [currentUser, updateProfile]);

  const setCustom = useCallback(() => {
    if (!customStatus.trim()) return;
    updateProfile(currentUser, { status: customStatus.trim() });
    setCustomStatus("");
  }, [customStatus, currentUser, updateProfile]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--text-main)]">Live Activity Status</h3>

      {/* Partner comparison */}
      <div className="grid grid-cols-2 gap-3">
        {[{ profile: activeProfile, label: "You" }, { profile: partnerProfile, label: "Partner" }].map(({ profile, label }) => (
          <div key={profile.id} className="glass-panel rounded-2xl p-4 text-center">
            <img src={profile.avatar} alt={profile.name} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-white/60" referrerPolicy="no-referrer" />
            <p className="text-xs font-bold text-[var(--text-main)]">{label}</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{profile.name.split(" ")[0]}</p>
            <p className="text-xs text-[var(--primary)] mt-1.5 font-semibold leading-tight">{profile.status}</p>
          </div>
        ))}
      </div>

      {/* Presets */}
      <div>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Set your status</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {STATUS_PRESETS.map((preset) => (
            <button
              key={preset.label}
              id={`status-preset-${preset.label.replace(/\s/g, "-").toLowerCase()}`}
              onClick={() => setPreset(preset)}
              className={`p-2.5 rounded-xl text-center border transition-all hover:scale-105 active:scale-95 ${activeProfile.status === `${preset.emoji} ${preset.label}` ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white/30 border-white/50 hover:bg-white/50"}`}
            >
              <span className="text-xl block">{preset.emoji}</span>
              <span className="text-[9px] font-semibold block mt-0.5 truncate">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom */}
      <div className="flex gap-2">
        <input
          value={customStatus}
          onChange={(e) => setCustomStatus(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setCustom()}
          placeholder="Set a custom status..."
          maxLength={60}
          className="flex-1 text-xs px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
        />
        <button id="custom-status-set-btn" onClick={setCustom} className="px-3 py-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90">
          <Send className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Watch Together ────────────────────────────────────────────────────────────
// Uses Firestore rooms/watch_room for shared state; plain <iframe> embed, no JS API

interface WatchRoom {
  videoId: string;
  isPlaying: boolean;
  chatMessages: { id: string; userId: string; text: string; ts: number }[];
}

function WatchSection() {
  const { currentUser, userA, userB, session } = useCouple();
  const [room, setRoom] = useState<WatchRoom>({ videoId: "", isPlaying: false, chatMessages: [] });
  const [videoInput, setVideoInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [particles, setParticles] = useState<EmojiParticle[]>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const EMOJI_BURSTS = ["💖", "😂", "🔥", "✨", "🥹", "👏"];

  // Listen to Firestore watch room
  useEffect(() => {
    if (!session) return;
    const unsub = onSnapshot(doc(db, "rooms", "watch_room"), (d) => {
      if (d.exists()) setRoom(d.data() as WatchRoom);
    });
    return () => unsub();
  }, [session]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room.chatMessages.length]);

  const extractVideoId = (url: string): string => {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return match ? match[1] : url.trim();
  };

  const setVideo = useCallback(async () => {
    const id = extractVideoId(videoInput);
    if (!id) return;
    await setDoc(doc(db, "rooms", "watch_room"), { videoId: id, isPlaying: false, chatMessages: room.chatMessages }, { merge: true });
    setVideoInput("");
  }, [videoInput, room.chatMessages]);

  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const msg = { id: `${Date.now()}`, userId: currentUser, text: chatInput.trim(), ts: Date.now() };
    await setDoc(doc(db, "rooms", "watch_room"), {
      ...room,
      chatMessages: [...(room.chatMessages || []).slice(-49), msg],
    }, { merge: true });
    setChatInput("");
  }, [chatInput, room, currentUser]);

  const burstEmoji = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setParticles((prev) => [...prev, { id, emoji, x: Math.random() * 80 + 10, y: Math.random() * 60 + 20 }]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), 2000);
  };

  const activeProfile = currentUser === "user_a" ? userA : userB;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--text-main)]">Watch Together Theater</h3>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          value={videoInput}
          onChange={(e) => setVideoInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setVideo()}
          placeholder="YouTube URL or video ID..."
          className="flex-1 text-xs px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
        />
        <button id="set-video-btn" onClick={setVideo} className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 text-xs font-bold shrink-0">
          Load
        </button>
        {room.videoId && (
          <>
            <button 
              onClick={() => setIframeKey((prev) => prev + 1)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
              title="Refresh Player Locally"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button 
              onClick={async () => {
                await setDoc(doc(db, "rooms", "watch_room"), { videoId: "", isPlaying: false, chatMessages: room.chatMessages }, { merge: true });
              }}
              className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
              title="Clear Theater Video"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </>
        )}
      </div>

      {/* Player */}
      {room.videoId ? (
        <div className="relative rounded-2xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          <iframe
            key={iframeKey}
            src={`https://www.youtube.com/embed/${room.videoId}?autoplay=0&rel=0`}
            title="Watch Together"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
          {/* Emoji particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -80 }}
              transition={{ duration: 2 }}
              className="absolute text-2xl pointer-events-none"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="aspect-video glass-panel rounded-2xl flex items-center justify-center">
          <div className="text-center text-[var(--text-muted)]">
            <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Paste a YouTube URL above to start watching together 🎬</p>
          </div>
        </div>
      )}

      {/* Emoji burst buttons */}
      <div className="flex gap-2 justify-center">
        {EMOJI_BURSTS.map((emoji) => (
          <button key={emoji} onClick={() => burstEmoji(emoji)} className="text-xl hover:scale-125 transition-transform active:scale-95">{emoji}</button>
        ))}
      </div>

      {/* Live chat */}
      <div className="glass-panel rounded-2xl p-4">
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Live Chat</p>
        <div className="h-40 overflow-y-auto space-y-2 mb-3">
          {(room.chatMessages || []).map((msg) => {
            const profile = msg.userId === "user_a" ? userA : userB;
            const isMe = msg.userId === currentUser;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                <img src={profile.avatar} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                <div className={`max-w-[70%] px-3 py-1.5 rounded-2xl text-xs ${isMe ? "bg-[var(--primary)] text-white rounded-br-md" : "bg-white/50 text-[var(--text-main)] rounded-bl-md"}`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {(!room.chatMessages || room.chatMessages.length === 0) && (
            <p className="text-[10px] text-center text-[var(--text-muted)]">No messages yet. Say hello! 👋</p>
          )}
          <div ref={chatBottomRef} />
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Send a message..."
            className="flex-1 text-xs px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
          />
          <button id="chat-send-btn" onClick={sendChat} className="px-3 py-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90">
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
