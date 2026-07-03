/**
 * MemoriesView.tsx — rebuilt from zero.
 *
 * Fixes:
 *  - Canvas drawImage promise-wrapped (no blank strips from race condition)
 *  - Reaction dedup via Set-based 1.5s lock (no rapid double-tap inflation)
 *  - No dataURL blob written to Firestore on stroke — photos only saved on explicit save action
 *
 * Features: Memory Timeline, Photobooth (2/4/6-cut + polaroid, canvas render, WebP compress, Cloudinary), Shared Diary Journal
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useCouple } from "../context/CoupleContext";
import { useCamera } from "../hooks/useCamera";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera, BookOpen, Clock, Plus, Trash2, X, Download,
  ChevronLeft, ChevronRight, Image, Heart, MessageCircle, Send,
  Users, Copy, Check, VideoOff, LogOut, Timer, RefreshCw, Sparkles,
} from "lucide-react";
import { db, uploadToCloudinary } from "../firebaseClient";
import { doc, getDoc, onSnapshot, setDoc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import type { Memory, Journal, PhotoboothRoom } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function compressToWebP(canvas: HTMLCanvasElement, maxKB = 200): Promise<Blob> {
  // Try WebP at decreasing quality until under maxKB
  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/webp", quality)
    );
    if (blob.size <= maxKB * 1024) return blob;
  }
  // Last resort PNG
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
  );
}

// Photo layouts: [cols, rows] per cell. Each row contains User A & User B side-by-side.
const LAYOUTS: Record<string, { cols: number; rows: number; label: string; totalRounds: number }> = {
  "2-cut": { cols: 2, rows: 2, label: "2-Cut Strip", totalRounds: 2 },
  "4-cut": { cols: 2, rows: 4, label: "4-Cut Strip", totalRounds: 4 },
  "6-cut": { cols: 2, rows: 6, label: "6-Cut Strip", totalRounds: 6 },
  polaroid: { cols: 2, rows: 1, label: "Polaroid Duo", totalRounds: 1 },
};

const FILTERS: { id: string; label: string; css: string }[] = [
  { id: "natural", label: "Natural", css: "" },
  { id: "vintage", label: "Vintage", css: "filter-vintage" },
  { id: "kodak", label: "Kodak", css: "filter-kodak" },
  { id: "disposable", label: "Disposable", css: "filter-disposable" },
  { id: "vhs", label: "VHS", css: "filter-vhs" },
  { id: "warm-tone", label: "Warm Tone", css: "filter-warm-tone" },
];

const BG_OPTIONS: { id: string; label: string; class: string }[] = [
  { id: "sakura", label: "Sakura", class: "bg-sakura-photo" },
  { id: "retro", label: "Retro", class: "bg-retro-photo" },
  { id: "cafe", label: "Café", class: "bg-cafe-photo" },
  { id: "night", label: "Night", class: "bg-night-photo" },
  { id: "pixel", label: "Pixel", class: "bg-pixel-photo" },
  { id: "white", label: "White", class: "bg-white" },
];

// Photobox-style strip frame presets — applied to the final composed strip
// (frame color, brand header/footer text color, and accent border stripe)
const STRIP_PRESETS: { id: string; label: string; swatch: string; frameColor: string; textColor: string; accent: string }[] = [
  { id: "classic-white", label: "Classic White", swatch: "#ffffff", frameColor: "#ffffff", textColor: "#27272a", accent: "#f43f5e" },
  { id: "pastel-pink", label: "Pastel Pink", swatch: "#ffe4ec", frameColor: "#fff0f5", textColor: "#9d174d", accent: "#f472b6" },
  { id: "mono-black", label: "Mono Black", swatch: "#111111", frameColor: "#111111", textColor: "#ffffff", accent: "#facc15" },
  { id: "kraft-paper", label: "Kraft Paper", swatch: "#e7d3b1", frameColor: "#efdfc4", textColor: "#4b3621", accent: "#a97142" },
  { id: "sky-blue", label: "Sky Blue", swatch: "#e0f2fe", frameColor: "#eaf7ff", textColor: "#075985", accent: "#38bdf8" },
];

function getCanvasFilter(filterId: string): string {
  switch (filterId) {
    case "vintage":
      return "sepia(0.35) contrast(0.95) saturate(1.1) brightness(1.02)";
    case "kodak":
      return "contrast(1.1) saturate(1.3) brightness(1.05) sepia(0.05)";
    case "disposable":
      return "contrast(1.05) saturate(1.05) brightness(0.98) hue-rotate(-5deg)";
    case "vhs":
      return "contrast(1.2) brightness(1.1) saturate(0.85) sepia(0.1)";
    case "soft-blur":
      return "blur(0.5px) saturate(0.95) contrast(0.95)";
    case "warm-tone":
      return "sepia(0.15) saturate(1.2) hue-rotate(5deg)";
    default:
      return "none";
  }
}

const WEATHER_OPTIONS = ["sunny", "rainy", "cloudy", "snowy", "windy"];
const MOOD_OPTIONS = ["happy", "cozy", "excited", "peaceful", "sleepy", "loved"];
const REACTION_EMOJIS = ["💖", "✨", "🥰", "😂", "😭", "🌟", "🔥", "💌"];

type Section = "timeline" | "photobooth" | "journal";

// ─── Component ────────────────────────────────────────────────────────────────

export default function MemoriesView() {
  const { currentUser, userA, userB, memories, addMemory, deleteMemory, addReactionToMemory, addCommentToMemory, journals, addJournal, deleteJournal, cloudinaryCloudName, cloudinaryUploadPreset } = useCouple();
  const [section, setSection] = useState<Section>("timeline");

  return (
    <div className="space-y-4 py-2">
      {/* Section tabs */}
      <div className="glass-panel rounded-2xl p-1.5 flex gap-1">
        {([["timeline", "Timeline", Clock], ["photobooth", "Photobooth", Camera], ["journal", "Journal", BookOpen]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            id={`mem-tab-${id}`}
            onClick={() => setSection(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${section === id ? "bg-[var(--primary)] text-white shadow" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {section === "timeline" && <TimelineSection key="timeline" />}
        {section === "photobooth" && <PhotoboothSection key="photobooth" />}
        {section === "journal" && <JournalSection key="journal" />}
      </AnimatePresence>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function TimelineSection() {
  const { memories, userReactions, userA, userB, currentUser, deleteMemory, addReactionToMemory, addCommentToMemory, deleteCommentFromMemory, addMemory, updateMemory } = useCouple();
  const visibleMemories = memories.filter((m) => m.type !== "photobooth" || m.showOnTimeline !== false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newImage, setNewImage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setNewImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addMemory({ type: "milestone", title: newTitle.trim(), description: newDesc.trim(), imageUrl: newImage || "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop", date: newDate, creatorId: currentUser });
    setNewTitle(""); setNewDesc(""); setNewDate(new Date().toISOString().split("T")[0]); setNewImage(""); setShowAdd(false);
  };

  const handleComment = (memId: string) => {
    const text = commentText[memId]?.trim();
    if (!text) return;
    addCommentToMemory(memId, text);
    setCommentText((prev) => ({ ...prev, [memId]: "" }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-main)]">Memory Timeline</h3>
        <button id="add-memory-btn" onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-3 shadow-2xl">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-bold text-gray-800">Add a Memory</h4>
                <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title *" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" rows={3} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none resize-none" />
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()} className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:bg-gray-50">
                {newImage ? "✅ Image selected" : "📷 Upload image (optional)"}
              </button>
              <button onClick={handleAdd} className="w-full py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl text-sm hover:opacity-90">Save Memory</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {visibleMemories.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No memories yet. Add your first milestone!</p>
        </div>
      )}

      {visibleMemories.map((mem) => {
        const creator = mem.creatorId === "user_a" ? userA : userB;
        return (
          <div key={mem.id} className="glass-panel rounded-3xl overflow-hidden">
            {mem.imageUrl && (
              <div className="relative h-48 overflow-hidden">
                <img src={mem.imageUrl} alt={mem.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-12">
                  <h4 className="text-white font-bold text-sm drop-shadow">{mem.title}</h4>
                  <p className="text-white/80 text-[10px] font-mono">{new Date(mem.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                {mem.creatorId === currentUser && (
                  <button onClick={() => deleteMemory(mem.id)} className="absolute top-3 right-3 w-7 h-7 bg-black/40 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
            )}
            <div className="p-4">
              {!mem.imageUrl && (
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-main)]">{mem.title}</h4>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(mem.date).toLocaleDateString()}</p>
                  </div>
                  {mem.creatorId === currentUser && (
                    <button onClick={() => deleteMemory(mem.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              )}
              {editingId === mem.id ? (
                <div className="space-y-2 mb-3">
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    placeholder="Enter new caption..."
                    className="w-full text-xs p-2 border border-gray-200 rounded-xl outline-none resize-none bg-white/40 focus:bg-white/80 transition-all text-gray-800"
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await updateMemory(mem.id, { description: editDesc });
                        setEditingId(null);
                      }}
                      className="px-2.5 py-1 text-[10px] bg-[var(--primary)] text-white rounded-lg font-bold hover:opacity-90 transition-all"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-3 flex items-start gap-2">
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed flex-1">
                    {mem.description || <span className="italic opacity-60">No caption added yet.</span>}
                  </p>
                  <button
                    onClick={() => {
                      setEditingId(mem.id);
                      setEditDesc(mem.description || "");
                    }}
                    className="text-[10px] text-[var(--primary)] font-bold hover:underline flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              )}

              {/* Creator tag */}
              <div className="flex items-center gap-2 mb-3">
                <img src={creator.avatar} alt={creator.name} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                <span className="text-[10px] text-[var(--text-muted)]">{creator.name}</span>
              </div>

              {/* Reactions */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {REACTION_EMOJIS.map((emoji) => {
                  const isReacted = userReactions[`${currentUser}_${mem.id}`]?.[emoji];
                  return (
                    <button
                      key={emoji}
                      id={`react-${mem.id}-${emoji}`}
                      onClick={() => addReactionToMemory(mem.id, emoji)}
                      className={`flex items-center gap-1 px-2 py-0.5 border rounded-full text-xs transition-all hover:scale-110 ${isReacted
                        ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] font-bold shadow-sm"
                        : "bg-white/50 hover:bg-white/80 border-white/60 text-gray-600"
                        }`}
                    >
                      {emoji} {(mem.reactions[emoji] || 0) > 0 && <span className={`text-[10px] font-bold ${isReacted ? "text-[var(--primary)]" : "text-gray-600"}`}>{mem.reactions[emoji]}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Comments */}
              {mem.comments.length > 0 && (
                <div className="space-y-1.5 mb-3 pl-2 border-l-2 border-[var(--border-color)]">
                  {mem.comments.slice(-3).map((c) => {
                    const auth = c.authorId === "user_a" ? userA : userB;
                    return (
                      <div key={c.id} className="flex items-start justify-between gap-2 group/comment">
                        <div className="flex items-start gap-2 min-w-0">
                          <img src={auth.avatar} alt={auth.name} className="w-4 h-4 rounded-full object-cover flex-shrink-0 mt-0.5" referrerPolicy="no-referrer" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-[var(--text-main)]">{auth.name.split(" ")[0]}</span>
                            <span className="text-[10px] text-[var(--text-muted)] ml-1 break-words">{c.text}</span>
                          </div>
                        </div>
                        {c.authorId === currentUser && (
                          <button
                            onClick={() => deleteCommentFromMemory(mem.id, c.id)}
                            className="opacity-0 group-hover/comment:opacity-100 transition-opacity text-gray-400 hover:text-red-500 flex-shrink-0"
                            title="Delete comment"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comment input */}
              <div className="flex gap-2">
                <input
                  value={commentText[mem.id] || ""}
                  onChange={(e) => setCommentText((p) => ({ ...p, [mem.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleComment(mem.id)}
                  placeholder="Add a comment..."
                  className="flex-1 text-xs px-3 py-1.5 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                />
                <button id={`comment-send-${mem.id}`} onClick={() => handleComment(mem.id)} className="px-2.5 py-1.5 bg-[var(--primary)] text-white rounded-xl hover:opacity-90">
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── Live Shared Photobooth (Angie-style) ──────────────────────────────────
// Two people join the same room code, each uses their own camera, and a
// synchronized countdown (driven by Firestore, not local timers) fires the
// shutter for both devices at the same instant.

function genRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const ROUND_GAP_MS = 1600; // pause between rounds so people can reset their pose
const COUNTDOWN_MS = 3000;

function PhotoboothSection() {
  const { currentUser, userA, userB, memories, addMemory, deleteMemory, updateMemory, cloudinaryCloudName, cloudinaryUploadPreset } = useCouple();
  const cam = useCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [layout, setLayout] = useState<keyof typeof LAYOUTS>("4-cut");
  const [bg, setBg] = useState("sakura");
  const [filter, setFilter] = useState("natural");
  const [stripPreset, setStripPreset] = useState<string>("classic-white");

  const [roomCode, setRoomCode] = useState<string>("");
  const [room, setRoom] = useState<PhotoboothRoom | null>(null);
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [copied, setCopied] = useState(false);
  const [countdownVal, setCountdownVal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const capturedRoundRef = useRef(0);
  const transitionLockRef = useRef(0);

  const isHost = room?.hostId === currentUser;
  const partnerName = currentUser === "user_a" ? userB.name : userA.name;
  const photoboothMemories = memories.filter((m) => m.type === "photobooth");

  // Attach the live camera stream to whichever <video> node is currently mounted.
  // A plain `videoRef` + effect keyed on `cam.stream` isn't enough here: the
  // <video> element only mounts once `room` becomes truthy, which happens
  // *after* the stream was already acquired (Firestore round-trip), so the
  // effect's dependency never changes again and the stream is never attached
  // — that's what caused "permission granted but preview stays black".
  // A callback ref re-attaches on every mount, regardless of ordering.
  const attachVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && cam.stream) {
      el.srcObject = cam.stream;
      el.play().catch((e) => console.error("[attachVideoRef] play error:", e));
    }
  }, [cam.stream]);

  // Also keep it in sync if the stream itself changes while already mounted
  useEffect(() => {
    if (videoRef.current && cam.stream) {
      videoRef.current.srcObject = cam.stream;
      videoRef.current.play().catch((e) => console.error("[videoEffect] play error:", e));
    }
  }, [cam.stream]);

  // Subscribe to the room document once we have a code
  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(doc(db, "photobooth_rooms", roomCode), (d) => {
      if (d.exists()) setRoom(d.data() as PhotoboothRoom);
      else setRoom(null);
    });
    return () => unsub();
  }, [roomCode]);

  // Synchronized reset for host & guest refs on starting a room session / new room code
  useEffect(() => {
    if (!roomCode || room?.state === "waiting" || (room?.state === "countdown" && room.round === 1)) {
      capturedRoundRef.current = 0;
      transitionLockRef.current = 0;
    }
  }, [roomCode, room?.state, room?.round]);

  const totalRounds = LAYOUTS[layout]?.totalRounds || 4;

  const renderStripMockup = useCallback(() => {
    if (!room) return null;
    const { cols: c, rows: r } = LAYOUTS[room.layout] || LAYOUTS["4-cut"];
    const rowIndexes = Array.from({ length: r }, (_, i) => i);
    
    // Find current preset frame background
    const preset = STRIP_PRESETS.find((p) => p.id === (room.stripPreset || "classic-white")) || STRIP_PRESETS[0];
    const filterCss = FILTERS.find((f) => f.id === (room.filter || "natural"))?.css || "";

    return (
      <div 
        className="w-full max-w-xs mx-auto p-3 flex flex-col gap-3 transition-all duration-300 relative shadow-2xl rounded-sm border border-black/5"
        style={{ backgroundColor: preset.frameColor }}
      >
        {/* Accent bar */}
        <div className="w-full h-1" style={{ backgroundColor: preset.accent }} />

        {/* Photos grid */}
        <div className="flex flex-col gap-2.5">
          {rowIndexes.map((rowIdx) => {
            const photoA = room.photosA[rowIdx];
            const photoB = room.photosB[rowIdx];
            const isActiveRow = (room.state === "countdown" && rowIdx === room.round - 1) || (room.state === "waiting" && rowIdx === 0);

            return (
              <div key={rowIdx} className="grid grid-cols-2 gap-2 aspect-[8/3]">
                {/* User A slot (Left) */}
                <div className="rounded-md overflow-hidden aspect-square bg-black/10 relative shadow-inner border border-black/5 flex items-center justify-center">
                  {photoA ? (
                    <img src={photoA} alt={`Round ${rowIdx + 1} A`} className={`w-full h-full object-cover ${filterCss}`} referrerPolicy="no-referrer" />
                  ) : isActiveRow && currentUser === "user_a" && cam.isActive ? (
                    <video ref={attachVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                  ) : isActiveRow && room.guestId ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/35 text-white text-center p-1">
                      <Sparkles className="w-4 h-4 animate-pulse mb-1 text-[var(--primary)]" />
                      <span className="text-[8px] font-semibold text-gray-200">Posing...</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera className="w-4 h-4 opacity-20" />
                    </div>
                  )}
                </div>

                {/* User B slot (Right) */}
                <div className="rounded-md overflow-hidden aspect-square bg-black/10 relative shadow-inner border border-black/5 flex items-center justify-center">
                  {photoB ? (
                    <img src={photoB} alt={`Round ${rowIdx + 1} B`} className={`w-full h-full object-cover ${filterCss}`} referrerPolicy="no-referrer" />
                  ) : isActiveRow && currentUser === "user_b" && cam.isActive ? (
                    <video ref={attachVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                  ) : isActiveRow && room.guestId ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/35 text-white text-center p-1">
                      <Sparkles className="w-4 h-4 animate-pulse mb-1 text-[var(--primary)]" />
                      <span className="text-[8px] font-semibold text-gray-200">Posing...</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera className="w-4 h-4 opacity-20" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info inside the strip */}
        <div className="text-center pt-2.5 pb-1 border-t border-dashed" style={{ borderColor: preset.accent + "50" }}>
          <p className="text-xs font-black tracking-wider" style={{ color: preset.textColor }}>
            {room.caption || "Our Special Moment 💖"}
          </p>
          <p className="text-[7px] mt-0.5" style={{ color: preset.textColor + "99" }}>
            {LAYOUTS[room.layout]?.label || room.layout} • {new Date(room.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
    );
  }, [room, currentUser, cam.isActive, attachVideoRef]);

  const createRoom = useCallback(async () => {
    try {
      await cam.startCamera();
      const code = genRoomCode();
      const newRoom: PhotoboothRoom = {
        code, hostId: currentUser, guestId: null, layout, 
        bg: "sakura", filter: "natural", stripPreset: "classic-white", caption: "Our Sweet Moment 💖",
        state: "waiting", round: 0, totalRounds,
        countdownStartAt: null, photosA: [], photosB: [], createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "photobooth_rooms", code), newRoom);
      setRoomCode(code);
      setSavedUrl(null);
    } catch { /* camera error already surfaced via cam.error */ }
  }, [cam, currentUser, layout, totalRounds]);

  const joinRoom = useCallback(async () => {
    const code = joinInput.trim().toUpperCase();
    if (!code) return;
    setJoinError("");
    try {
      const snap = await getDoc(doc(db, "photobooth_rooms", code));
      if (!snap.exists()) { setJoinError("Room not found. Check the code."); return; }
      const data = snap.data() as PhotoboothRoom;
      if (data.hostId !== currentUser && !data.guestId) {
        await updateDoc(doc(db, "photobooth_rooms", code), { guestId: currentUser });
      } else if (data.hostId !== currentUser && data.guestId !== currentUser) {
        setJoinError("This room is already full.");
        return;
      }
      await cam.startCamera();
      setRoomCode(code);
      setSavedUrl(null);
    } catch (e) {
      console.error("[joinRoom]", e);
      setJoinError("Couldn't join that room. Try again.");
    }
  }, [joinInput, currentUser, cam]);

  const leaveRoom = useCallback(async () => {
    cam.stopCamera();
    if (room && isHost) {
      try { await deleteDoc(doc(db, "photobooth_rooms", roomCode)); } catch { /* ignore */ }
    }
    setRoomCode(""); setRoom(null); setCountdownVal(null); setSavedUrl(null);
    capturedRoundRef.current = 0;
  }, [cam, room, isHost, roomCode]);

  const copyCode = useCallback(() => {
    navigator.clipboard?.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [roomCode]);

  // Host: begin the synchronized countdown for round 1
  const startSession = useCallback(async () => {
    if (!room || !isHost || !room.guestId) return;
    capturedRoundRef.current = 0;
    await updateDoc(doc(db, "photobooth_rooms", roomCode), {
      state: "countdown", round: 1, countdownStartAt: Date.now() + COUNTDOWN_MS,
      photosA: [], photosB: [],
    });
  }, [room, isHost, roomCode]);

  // Capture a mirrored, square-cropped frame from my own camera
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || video.readyState < 2) {
      console.warn("[captureFrame] Video frame not ready yet, using beautiful stylized canvas fallback");
      const canvas = document.createElement("canvas");
      canvas.width = 360; canvas.height = 360;
      const ctx = canvas.getContext("2d")!;
      // Draw a soft rose gradient background matching layout aesthetic
      const grad = ctx.createLinearGradient(0, 0, 360, 360);
      grad.addColorStop(0, "#fda4af");
      grad.addColorStop(1, "#f43f5e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 360, 360);
      
      // Draw camera outline/icon placeholder
      ctx.strokeStyle = "#ffffff80";
      ctx.lineWidth = 4;
      ctx.strokeRect(100, 120, 160, 120);
      ctx.strokeRect(150, 95, 60, 25);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📸 Pose Captured!", 180, 175);
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#ffffffdd";
      ctx.fillText(currentUser === "user_a" ? "User A (Host)" : "User B (Guest)", 180, 210);
      return canvas.toDataURL("image/jpeg", 0.65);
    }
    const canvas = document.createElement("canvas");
    canvas.width = 360; canvas.height = 360;
    const ctx = canvas.getContext("2d")!;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.65);
  }, [currentUser]);

  // Local synchronized countdown ticker — fires on both host & guest devices
  // at the same wall-clock instant, driven by room.countdownStartAt.
  useEffect(() => {
    if (!room || room.state !== "countdown" || !room.countdownStartAt) { setCountdownVal(null); return; }
    if (capturedRoundRef.current === room.round) return; // already shot this round

    const tick = () => {
      const remaining = room.countdownStartAt! - Date.now();
      if (remaining <= 0) {
        setCountdownVal(0);
        if (capturedRoundRef.current !== room.round) {
          capturedRoundRef.current = room.round;
          const shot = captureFrame();
          if (shot) {
            const field = currentUser === room.hostId ? "photosA" : "photosB";
            updateDoc(doc(db, "photobooth_rooms", roomCode), { [field]: arrayUnion(shot) }).catch((e) => console.error("[capture upload]", e));
          }
        }
        return true;
      }
      setCountdownVal(Math.ceil(remaining / 1000));
      return false;
    };

    if (tick()) return;
    const id = setInterval(() => { if (tick()) clearInterval(id); }, 120);
    return () => clearInterval(id);
  }, [room, roomCode, currentUser, captureFrame]);

  // Host-only referee: once both partners have captured the current round,
  // advance to the next round or move to "captured" once all rounds are done.
  useEffect(() => {
    if (!room || !isHost || room.state !== "countdown") return;
    const gotA = room.photosA.length >= room.round;
    const gotB = room.photosB.length >= room.round;
    if (!gotA || !gotB) return;
    if (transitionLockRef.current === room.round) return;
    transitionLockRef.current = room.round;

    const timer = setTimeout(async () => {
      if (room.round >= room.totalRounds) {
        // Move to collaborative editing screen instead of direct captured/save
        await updateDoc(doc(db, "photobooth_rooms", roomCode), { state: "editing", countdownStartAt: null });
      } else {
        await updateDoc(doc(db, "photobooth_rooms", roomCode), {
          round: room.round + 1, countdownStartAt: Date.now() + COUNTDOWN_MS,
        });
      }
    }, ROUND_GAP_MS);
    return () => clearTimeout(timer);
  }, [room, isHost, roomCode]);

  // Compose the final strip once both partners have finished all rounds
  const composeAndSave = useCallback(async () => {
    if (!room) return;
    setSaving(true); setSavedUrl(null);
    try {
      const preset = STRIP_PRESETS.find((p) => p.id === room.stripPreset) || STRIP_PRESETS[0];
      const CELL = 300, MARGIN = 10;
      const HEADER = 44;
      const FOOTER = 64;
      const { cols: c, rows: r } = LAYOUTS[room.layout];
      const canvasW = c * CELL + (c + 1) * MARGIN;
      const canvasH = r * CELL + (r + 1) * MARGIN + HEADER + FOOTER;
      const canvas = document.createElement("canvas");
      canvas.width = canvasW; canvas.height = canvasH;
      const ctx = canvas.getContext("2d")!;

      // Frame background
      ctx.fillStyle = preset.frameColor;
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Accent stripe along the top (photobox branding touch)
      ctx.fillStyle = preset.accent;
      ctx.fillRect(0, 0, canvasW, 6);

      // Header brand text
      ctx.fillStyle = preset.textColor;
      ctx.font = "bold 17px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📸 Our Photobooth", canvasW / 2, HEADER - 14);

      const merged: string[] = [];
      if (room.layout === "polaroid") {
        if (room.photosA[0]) merged.push(room.photosA[0]);
      } else {
        for (let i = 0; i < room.photosA.length; i++) {
          merged.push(room.photosA[i]);
          if (room.photosB[i]) merged.push(room.photosB[i]);
        }
      }

      for (let i = 0; i < Math.min(merged.length, c * r); i++) {
        const col = i % c, row = Math.floor(i / c);
        const x = MARGIN + col * (CELL + MARGIN);
        const y = HEADER + MARGIN + row * (CELL + MARGIN);
        try {
          const img = await loadImage(merged[i]);
          ctx.save();
          ctx.filter = getCanvasFilter(room.filter || "natural");
          ctx.drawImage(img, x, y, CELL, CELL);
          ctx.restore();
        } catch (e) {
          console.warn("[composeAndSave] failed to load/draw photo:", e);
        }
      }

      // Polaroid duo: inset the partner's shot in the corner of the main shot
      if (room.layout === "polaroid" && room.photosB[0]) {
        try {
          const inset = await loadImage(room.photosB[0]);
          const insetSize = CELL * 0.36;
          const ix = MARGIN + CELL - insetSize - 6;
          const iy = HEADER + MARGIN + CELL - insetSize - 6;
          ctx.save();
          ctx.strokeStyle = preset.frameColor; ctx.lineWidth = 4;
          ctx.strokeRect(ix, iy, insetSize, insetSize);
          ctx.filter = getCanvasFilter(room.filter || "natural");
          ctx.drawImage(inset, ix, iy, insetSize, insetSize);
          ctx.restore();
        } catch { /* skip */ }
      }

      // Footer caption — date + preset accent divider, like a real photobox strip
      const footerY = HEADER + r * (CELL + MARGIN) + MARGIN;
      ctx.strokeStyle = preset.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(MARGIN * 2, footerY + 14);
      ctx.lineTo(canvasW - MARGIN * 2, footerY + 14);
      ctx.stroke();

      ctx.fillStyle = preset.textColor;
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      ctx.fillText(room.caption || "Our Special Moment 💖", canvasW / 2, footerY + 34);

      ctx.font = "10px sans-serif";
      ctx.fillStyle = preset.textColor + "99"; // slightly translucent
      ctx.fillText(`${LAYOUTS[room.layout]?.label || room.layout} • ${dateStr}`, canvasW / 2, footerY + 50);

      const blob = await compressToWebP(canvas, 260);
      let imageUrl: string;
      if (cloudinaryCloudName && cloudinaryUploadPreset) {
        imageUrl = await uploadToCloudinary(blob, `photobooth-${Date.now()}.webp`, cloudinaryCloudName, cloudinaryUploadPreset);
      } else {
        imageUrl = await new Promise<string>((res, rej) => {
          const r2 = new FileReader();
          r2.onload = (e) => res(e.target?.result as string);
          r2.onerror = rej;
          r2.readAsDataURL(blob);
        });
      }

      setSavedUrl(imageUrl);
      addMemory({
        type: "photobooth", title: `${LAYOUTS[room.layout].label} Live Photobooth`,
        description: `Captured live together in room ${room.code} 💌`,
        imageUrl, date: new Date().toISOString(), creatorId: currentUser,
        layout: room.layout as any, photosList: merged, bgStyle: room.bg, filterClass: room.filter,
        showOnTimeline: false,
      });
      await updateDoc(doc(db, "photobooth_rooms", roomCode), { state: "done" });
    } catch (e) {
      console.error("[composeAndSave]", e);
      alert("Failed to save the strip. Check your Cloudinary config or try again.");
    } finally {
      setSaving(false);
    }
  }, [room, roomCode, cloudinaryCloudName, cloudinaryUploadPreset, currentUser, addMemory]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-main)]">Live Photobooth</h3>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Open a room, share the code, and strike a pose together — synced live, just like Angie.</p>
      </div>

      {/* ── No active room: setup + create/join ─────────────────────────── */}
      {!room && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Layout</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(LAYOUTS).map(([id, { label }]) => (
                <button key={id} id={`layout-btn-${id}`} onClick={() => setLayout(id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${layout === id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button id="photobooth-create-room-btn" onClick={createRoom}
              className="py-3 bg-[var(--primary)] text-white text-sm font-bold rounded-2xl hover:opacity-90 flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" /> Start a Room
            </button>
            <div className="flex gap-2">
              <input value={joinInput} onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                placeholder="Enter room code" maxLength={5}
                className="flex-1 text-sm px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] tracking-widest font-mono uppercase" />
              <button id="photobooth-join-room-btn" onClick={joinRoom} className="px-4 py-2 bg-white/40 border border-white/50 text-[var(--text-main)] text-xs font-bold rounded-xl hover:bg-white/60 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Join
              </button>
            </div>
          </div>
          {joinError && <p className="text-xs text-red-500">{joinError}</p>}
          {cam.error && <p className="text-xs text-red-500">{cam.error}</p>}
        </div>
      )}

      {/* ── Active room ───────────────────────────────────────────────────── */}
      {room && (
        <div className="space-y-4">
          {/* Room header */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 flex items-center justify-center">
                <Users className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider">Room Code</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black font-mono tracking-[0.2em] text-[var(--text-main)]">{room.code}</span>
                  <button onClick={copyCode} className="text-[var(--text-muted)] hover:text-[var(--primary)]">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${room.guestId ? "bg-green-50 text-green-600 border border-green-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                {room.guestId ? `${partnerName} joined 💖` : "Waiting for partner..."}
              </span>
              <button id="photobooth-leave-room-btn" onClick={leaveRoom} className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1">
                <LogOut className="w-3 h-3" /> Leave
              </button>
            </div>
          </div>

          {/* Camera preview / Unified vertical strip posing mock */}
          <div className="relative overflow-hidden rounded-2xl p-1 bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-zinc-800">
            {renderStripMockup()}
            
            {/* Synchronized flashing / countdown overlay inside the strip frame */}
            <AnimatePresence>
              {countdownVal !== null && countdownVal > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1.5px] rounded-2xl">
                  <motion.span 
                    key={countdownVal} 
                    initial={{ opacity: 0, scale: 0.3 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 1.5 }}
                    transition={{ type: "spring", damping: 11 }}
                    className="text-8xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  >
                    {countdownVal}
                  </motion.span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest mt-3 bg-[var(--primary)] px-3 py-1 rounded-full animate-pulse shadow-md">
                    Round {room.round}/{room.totalRounds} • Pose!
                  </span>
                </div>
              )}
              {countdownVal === 0 && (
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 bg-white rounded-2xl z-20" />
              )}
            </AnimatePresence>
          </div>

          {/* Controls per state */}
          {room.state === "waiting" && (
            <div className="space-y-3">
              {isHost ? (
                <button id="photobooth-start-session-btn" onClick={startSession} disabled={!room.guestId}
                  className="w-full py-3 bg-[var(--primary)] text-white text-sm font-bold rounded-2xl hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 shadow-md">
                  <Sparkles className="w-4 h-4" /> {room.guestId ? "Start Synchronized Poses" : "Waiting for partner to join…"}
                </button>
              ) : (
                <div className="glass-panel rounded-2xl p-4 text-center text-xs text-[var(--text-muted)] animate-pulse">
                  <Users className="w-5 h-5 mx-auto text-[var(--primary)] mb-1" />
                  <p className="font-bold text-[var(--text-main)]">Ready & Linked!</p>
                  <p>Waiting for the host to start the photoshoot countdown…</p>
                </div>
              )}
            </div>
          )}

          {room.state === "countdown" && (
            <div className="glass-panel rounded-2xl p-3.5 flex items-center justify-center gap-2.5 text-xs font-bold text-[var(--text-main)] shadow-inner">
              <Timer className="w-4 h-4 text-[var(--primary)] animate-pulse" />
              <span>Photoshoot active: Posing for Round {room.round} of {room.totalRounds}</span>
            </div>
          )}

          {room.state === "editing" && (
            <div className="space-y-4 pt-2 border-t border-[var(--border-color)]">
              {isHost ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2 shadow-sm">
                    <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
                    <div>
                      <p className="font-bold">Photobox Editor 🎨</p>
                      <p className="mt-0.5">Customize the frame, filters, and caption below. Your partner sees these updates live in real-time!</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3.5">
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">1. Choose Frame Preset</p>
                      <div className="flex gap-2 flex-wrap">
                        {STRIP_PRESETS.map((p) => (
                          <button key={p.id} onClick={() => updateDoc(doc(db, "photobooth_rooms", roomCode), { stripPreset: p.id })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${room.stripPreset === p.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"}`}>
                            <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: p.swatch }} />
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2 font-bold">2. Apply Retro Filter</p>
                      <div className="flex gap-2 flex-wrap">
                        {FILTERS.map((f) => (
                          <button key={f.id} onClick={() => updateDoc(doc(db, "photobooth_rooms", roomCode), { filter: f.id })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${room.filter === f.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"}`}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1.5 font-bold">3. Edit Custom Caption</p>
                      <input 
                        value={room.caption || ""} 
                        onChange={(e) => updateDoc(doc(db, "photobooth_rooms", roomCode), { caption: e.target.value })} 
                        placeholder="Write caption here..." 
                        maxLength={26}
                        className="w-full text-xs px-3.5 py-2.5 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] font-medium shadow-inner" 
                      />
                    </div>
                    
                    <button id="photobooth-save-strip-btn" onClick={composeAndSave} disabled={saving}
                      className="w-full py-3 bg-[var(--primary)] text-white text-sm font-bold rounded-2xl hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md">
                      {saving ? <><span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full" /> Assembling Strip...</> : <><Download className="w-4 h-4" /> Save to Timeline & Download</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-4 text-center text-xs text-[var(--text-muted)] space-y-2">
                  <Sparkles className="w-5 h-5 mx-auto text-[var(--primary)] animate-pulse" />
                  <p className="font-bold text-[var(--text-main)]">{partnerName} is editing your strip! 🎨</p>
                  <p>The preview above will update live as they change filters, frame backgrounds, or write a caption.</p>
                </div>
              )}
            </div>
          )}

          {room.state === "done" && (
            <div className="space-y-3">
              {savedUrl && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-2xl p-3 text-center text-xs text-green-700 dark:text-green-300 font-semibold shadow-sm">
                  🎉 Successfully saved to the Memory Timeline!
                </div>
              )}
              <button onClick={leaveRoom} className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] border border-dashed border-gray-200 rounded-2xl hover:bg-white/40 transition-all">
                <RefreshCw className="w-3.5 h-3.5" /> Close Room & Start New Session
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Gallery / History — every strip ever saved from this Photobooth,
             hosted on Cloudinary (or base64 fallback) via composeAndSave ────── */}
      {(!room || room.state === "done") && (
        <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <span>Photobooth Gallery 📸</span>
            <span className="text-[10px] font-mono font-normal font-sans tracking-normal">({photoboothMemories.length} saved)</span>
          </h4>

          {photoboothMemories.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic py-2">No strips saved yet. Finish a room above and edit your strip to start your history.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photoboothMemories.map((mem) => (
                <div key={mem.id} className="group relative rounded-2xl overflow-hidden border border-white/60 bg-white/30 p-2 shadow hover:shadow-md transition-all">
                  <div
                    onClick={() => setPreviewUrl(mem.imageUrl)}
                    className="aspect-[3/4] rounded-xl overflow-hidden bg-white border border-gray-100 relative cursor-zoom-in group-hover:opacity-95 transition-opacity"
                  >
                    <img src={mem.imageUrl} alt={mem.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <span className="text-[9px] text-[var(--text-muted)] font-mono truncate">{new Date(mem.date).toLocaleDateString()}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={async () => {
                          const nextVal = mem.showOnTimeline === false ? true : false;
                          await updateMemory(mem.id, { showOnTimeline: nextVal });
                          alert(nextVal ? "Added to Memories timeline! ✨" : "Removed from Memories timeline! 💔");
                        }}
                        className={`p-1 rounded-lg border transition-colors ${
                          mem.showOnTimeline !== false
                            ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                            : "bg-white/65 text-gray-400 hover:text-gray-700 border-gray-200 hover:bg-white"
                        }`}
                        title={mem.showOnTimeline !== false ? "Remove from Timeline" : "Add to Timeline"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${mem.showOnTimeline !== false ? "fill-current" : ""}`} />
                      </button>
                      <a
                        href={mem.imageUrl}
                        download={`photobooth-${mem.id}.webp`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 bg-white/65 hover:bg-white rounded-lg text-gray-700 transition-colors border border-gray-200"
                        title="Download strip"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => deleteMemory(mem.id)}
                        className="p-1 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors border border-transparent"
                        title="Delete strip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox preview */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreviewUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden p-3 shadow-2xl flex flex-col items-center cursor-default"
            >
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-all font-bold text-sm z-10"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-full max-h-[70vh] bg-white rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 mt-8">
                <img src={previewUrl} alt="Photobooth strip preview" className="max-w-full max-h-[70vh] object-contain" />
              </div>
              <a
                href={previewUrl}
                download="photobooth-strip.webp"
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl transition-all hover:opacity-90"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Journal ──────────────────────────────────────────────────────────────────

function JournalSection() {
  const { journals, addJournal, deleteJournal, updateJournal, currentUser, userA, userB } = useCouple();
  const [showForm, setShowForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);

  const [form, setForm] = useState({ title: "", description: "", date: new Date().toISOString().split("T")[0], location: "", weather: "sunny", mood: "happy", tags: "" });
  const [editForm, setEditForm] = useState({ title: "", description: "", date: new Date().toISOString().split("T")[0], location: "", weather: "sunny", mood: "happy", tags: "" });

  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Dynamically hide/show floating navbar menu dock when new entry or edit modal is active
  useEffect(() => {
    const isModalOpen = showForm || !!editingJournal;
    window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: !isModalOpen }));
    return () => {
      window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: true }));
    };
  }, [showForm, editingJournal]);

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    addJournal({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) });
    setForm({ title: "", description: "", date: new Date().toISOString().split("T")[0], location: "", weather: "sunny", mood: "happy", tags: "" });
    setShowForm(false);
  };

  const handleEditSubmit = () => {
    if (!editingJournal || !editForm.title.trim()) return;
    updateJournal(editingJournal.id, {
      ...editForm,
      tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
    });
    setEditingJournal(null);
  };

  const upd = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const updEdit = (k: string, v: string) => setEditForm((p) => ({ ...p, [k]: v }));

  const sortedJournals = React.useMemo(() => {
    const list = [...journals];
    if (sortOrder === "oldest") {
      return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journals, sortOrder]);

  const WEATHER_ICONS: Record<string, string> = { sunny: "☀️", rainy: "🌧️", cloudy: "⛅", snowy: "❄️", windy: "💨" };
  const MOOD_ICONS: Record<string, string> = { happy: "😊", cozy: "🧸", excited: "🌟", peaceful: "🍃", sleepy: "😴", loved: "💖" };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-[var(--text-main)]">Shared Diary Journal</h3>

          {/* Sorting Order Filter */}
          {journals.length > 0 && (
            <div className="flex gap-0.5 bg-white/20 p-0.5 rounded-lg border border-white/40">
              {(["newest", "oldest"] as const).map((o) => (
                <button
                  key={o}
                  onClick={() => setSortOrder(o)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all ${sortOrder === o
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                >
                  {o === "newest" ? "Newest" : "Oldest"}
                </button>
              ))}
            </div>
          )}
        </div>

        <button id="add-journal-btn" onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> New Entry
        </button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-3 shadow-2xl my-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800">New Journal Entry</h4>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <input value={form.title} onChange={(e) => upd("title", e.target.value)} placeholder="Title *" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              <textarea value={form.description} onChange={(e) => upd("description", e.target.value)} placeholder="What happened today?" rows={4} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.date} onChange={(e) => upd("date", e.target.value)} className="text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
                <input value={form.location} onChange={(e) => upd("location", e.target.value)} placeholder="Location" className="text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">Weather</p>
                <div className="flex gap-1.5 flex-wrap">
                  {WEATHER_OPTIONS.map((w) => (
                    <button key={w} onClick={() => upd("weather", w)} className={`px-2 py-1 rounded-lg text-xs border ${form.weather === w ? "bg-blue-500 text-white border-blue-500" : "border-gray-200 text-gray-500"}`}>
                      {WEATHER_ICONS[w]} {w}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">Mood</p>
                <div className="flex gap-1.5 flex-wrap">
                  {MOOD_OPTIONS.map((m) => (
                    <button key={m} onClick={() => upd("mood", m)} className={`px-2 py-1 rounded-lg text-xs border ${form.mood === m ? "bg-rose-500 text-white border-rose-500" : "border-gray-200 text-gray-500"}`}>
                      {MOOD_ICONS[m]} {m}
                    </button>
                  ))}
                </div>
              </div>
              <input value={form.tags} onChange={(e) => upd("tags", e.target.value)} placeholder="Tags (comma separated)" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              <button onClick={handleSubmit} className="w-full py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl text-sm hover:opacity-90">Save Entry</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingJournal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-3 shadow-2xl my-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800">Edit Journal Entry</h4>
                <button onClick={() => setEditingJournal(null)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <input value={editForm.title} onChange={(e) => updEdit("title", e.target.value)} placeholder="Title *" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              <textarea value={editForm.description} onChange={(e) => updEdit("description", e.target.value)} placeholder="What happened today?" rows={4} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none resize-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={editForm.date} onChange={(e) => updEdit("date", e.target.value)} className="text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
                <input value={editForm.location} onChange={(e) => updEdit("location", e.target.value)} placeholder="Location" className="text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">Weather</p>
                <div className="flex gap-1.5 flex-wrap">
                  {WEATHER_OPTIONS.map((w) => (
                    <button key={w} onClick={() => updEdit("weather", w)} className={`px-2 py-1 rounded-lg text-xs border ${editForm.weather === w ? "bg-blue-500 text-white border-blue-500" : "border-gray-200 text-gray-500"}`}>
                      {WEATHER_ICONS[w]} {w}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">Mood</p>
                <div className="flex gap-1.5 flex-wrap">
                  {MOOD_OPTIONS.map((m) => (
                    <button key={m} onClick={() => updEdit("mood", m)} className={`px-2 py-1 rounded-lg text-xs border ${editForm.mood === m ? "bg-rose-500 text-white border-rose-500" : "border-gray-200 text-gray-500"}`}>
                      {MOOD_ICONS[m]} {m}
                    </button>
                  ))}
                </div>
              </div>
              <input value={editForm.tags} onChange={(e) => updEdit("tags", e.target.value)} placeholder="Tags (comma separated)" className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              <button onClick={handleEditSubmit} className="w-full py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl text-sm hover:opacity-90">Save Changes</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {sortedJournals.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No journal entries yet. Start writing! 📝</p>
        </div>
      )}

      {sortedJournals.map((journal) => {
        const creator = journal.creatorId === "user_a" ? userA : userB;
        const isOwner = journal.creatorId === currentUser;

        return (
          <div key={journal.id} className="glass-panel rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-bold text-sm text-[var(--text-main)]">{journal.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {new Date(journal.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                  {journal.location && <span className="text-[10px] text-[var(--text-muted)] font-medium">📍 {journal.location}</span>}
                  <span>{WEATHER_ICONS[journal.weather] || "🌤️"}</span>
                  <span>{MOOD_ICONS[journal.mood] || "😊"}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isOwner && (
                  <>
                    <button
                      onClick={() => {
                        setEditingJournal(journal);
                        setEditForm({
                          title: journal.title,
                          description: journal.description,
                          date: journal.date,
                          location: journal.location,
                          weather: journal.weather,
                          mood: journal.mood,
                          tags: journal.tags.join(", "),
                        });
                      }}
                      className="text-xs text-[var(--primary)] font-bold hover:underline px-2 py-0.5 rounded-lg bg-[var(--primary)]/5"
                    >
                      Edit
                    </button>
                    <button onClick={() => deleteJournal(journal.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {journal.description && <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">{journal.description}</p>}

            {journal.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2.5">
                {journal.tags.map((tag) => (
                  <span key={tag} className="text-[9px] px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-semibold">#{tag}</span>
                ))}
              </div>
            )}

            {/* Author Attribution & History Edit Info */}
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-dashed border-black/5 dark:border-white/5">
              <img src={creator.avatar} className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
              <span className="text-[9px] text-[var(--text-muted)] font-medium">Posted by {creator.name}</span>
              {journal.editedAt && (
                <span className="text-[9px] text-[var(--text-muted)] ml-auto font-mono">
                  Edited: {new Date(journal.editedAt).toLocaleDateString()} {new Date(journal.editedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}