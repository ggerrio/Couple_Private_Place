/**
 * AdminCrudConsole.tsx — Ultimate Admin Panel for CRUD operations
 * Allows the administrator to inspect, create, edit, and delete:
 * - Challenges (Missions)
 * - Sticky Notes
 * - Vibe Vinyl Logs
 * - Special Letters
 * - Memories (Timeline)
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCouple } from "../../context/CoupleContext";
import { getDb } from "../../firebaseClient";
import {
  Sparkles, Trash2, Edit2, Plus, Check, X, Award,
  StickyNote, Music, Mail, Image, Calendar, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Mission, Memory, Letter, CustomGreetings } from "../../types";

type CrudTab = "missions" | "sticky_notes" | "vibe_logs" | "letters" | "memories";

const CRUD_TABS: { id: CrudTab; label: string; icon: React.ElementType; color: string }[] = [
  { id: "missions", label: "Missions", icon: Award, color: "text-amber-500" },
  { id: "sticky_notes", label: "Sticky Notes", icon: StickyNote, color: "text-purple-500" },
  { id: "vibe_logs", label: "Vibe Logs", icon: Music, color: "text-pink-500" },
  { id: "letters", label: "Letters", icon: Mail, color: "text-indigo-500" },
  { id: "memories", label: "Memories", icon: Image, color: "text-rose-500" },
];

export function AdminCrudConsole() {
  const [activeTab, setActiveTab] = useState<CrudTab>("missions");

  return (
    <div className="border border-[var(--wood-oak)]/15 rounded-3xl p-4 sm:p-6 space-y-5 bg-[var(--fabric-cream)]/15 shadow-2xs mt-6">
      {/* Console Header */}
      <div className="flex items-start gap-2.5 p-4 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-200/50 rounded-2xl">
        <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="min-w-0">
          <p className="text-xs font-black text-indigo-800 leading-none mb-1">🎮 Ultimate Database CRUD Console</p>
          <p className="text-[10px] text-indigo-600 leading-normal">
            Direct real-time administration panel. Add, modify, or purge records across all key system collections.
          </p>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex flex-wrap gap-1 bg-[var(--fabric-cream)]/50 p-1 rounded-xl border border-[var(--wood-oak)]/10">
        {CRUD_TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === id
                ? "bg-white text-[var(--text-main)] shadow-xs border border-[var(--wood-oak)]/10"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/40"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Active Editor Panel */}
      <div className="min-h-[250px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "missions" && <MissionsCrud />}
            {activeTab === "sticky_notes" && <StickyNotesCrud />}
            {activeTab === "vibe_logs" && <VibeLogsCrud />}
            {activeTab === "letters" && <LettersCrud />}
            {activeTab === "memories" && <MemoriesCrud />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── 1. MISSIONS CRUD ────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function MissionsCrud() {
  const { missions } = useCouple();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [text, setText] = useState("");
  const [type, setType] = useState<"daily" | "weekly">("daily");
  const [completed, setCompleted] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setText("");
    setType("daily");
    setCompleted(false);
  };

  const handleEdit = (mission: Mission) => {
    setEditingId(mission.id);
    setText(mission.text);
    setType(mission.type);
    setCompleted(mission.completed);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Mission text cannot be empty!");
      return;
    }

    try {
      const db = await getDb();
      const { doc, setDoc, updateDoc } = await import("firebase/firestore");

      if (editingId) {
        // Update existing
        await updateDoc(doc(db, "missions", editingId), {
          text,
          type,
          completed,
        });
        toast.success("Mission updated successfully! ✨");
      } else {
        // Create new
        const newId = `mis-${Date.now()}`;
        await setDoc(doc(db, "missions", newId), {
          text,
          type,
          completed,
          created_at: new Date().toISOString(),
        });
        toast.success("New mission added! ✨");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save mission.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mission?")) return;
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "missions", id));
      toast.success("Mission deleted! 🗑️");
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete mission.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          Manage Challenge Missions ({missions.length})
        </h4>
        {editingId && (
          <button onClick={resetForm} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 cursor-pointer">
            <X className="w-3.5 h-3.5" /> Cancel Edit
          </button>
        )}
      </div>

      {/* Editor Form */}
      <form onSubmit={handleSave} className="bg-white/40 dark:bg-black/10 border border-[var(--border-color)]/50 rounded-2xl p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Challenge Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Kiss your partner in the rain"
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Frequency Tier</label>
            <select
              value={type}
              onChange={(e: any) => setType(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
            >
              <option value="daily">Daily Challenge</option>
              <option value="weekly">Weekly Epic</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="mission-completed"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--primary)] border-[var(--border-color)] cursor-pointer"
            />
            <label htmlFor="mission-completed" className="text-[10px] font-bold text-[var(--text-main)] cursor-pointer select-none">
              Mark as Completed
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
        >
          {editingId ? <><Edit2 className="w-3.5 h-3.5" /> Update Mission</> : <><Plus className="w-4 h-4" /> Add Mission</>}
        </button>
      </form>

      {/* List */}
      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {missions.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 p-2 bg-white/50 dark:bg-black/5 border border-[var(--border-color)]/45 rounded-xl hover:bg-white/80 dark:hover:bg-black/10 transition-all">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.completed ? "bg-green-500" : "bg-amber-400"}`} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-main)] truncate">{m.text}</p>
                <span className="text-[8px] font-bold uppercase font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--text-muted)]">
                  {m.type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => handleEdit(m)}
                className="p-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Edit Mission"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDelete(m.id)}
                className="p-1.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Delete Mission"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── 2. STICKY NOTES CRUD ────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

interface StickyNoteModel {
  id: string;
  text: string;
  color: string;
  authorId: "user_a" | "user_b";
  createdAt: string;
}

const NOTE_COLORS = ["yellow", "pink", "blue", "green", "purple"];

function StickyNotesCrud() {
  const { userA, userB } = useCouple();
  const [notes, setNotes] = useState<StickyNoteModel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [text, setText] = useState("");
  const [color, setColor] = useState("yellow");
  const [authorId, setAuthorId] = useState<"user_a" | "user_b">("user_a");

  useEffect(() => {
    let unsubscribe: () => void;
    (async () => {
      try {
        const db = await getDb();
        const { collection, onSnapshot, query, orderBy } = await import("firebase/firestore");
        const q = query(collection(db, "sticky_notes"), orderBy("createdAt", "desc"));
        unsubscribe = onSnapshot(q, (snap) => {
          const list: StickyNoteModel[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              text: data.text || "",
              color: data.color || "yellow",
              authorId: data.authorId || "user_a",
              createdAt: data.createdAt || "",
            });
          });
          setNotes(list);
        });
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setText("");
    setColor("yellow");
    setAuthorId("user_a");
  };

  const handleEdit = (note: StickyNoteModel) => {
    setEditingId(note.id);
    setText(note.text);
    setColor(note.color);
    setAuthorId(note.authorId);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Sticky note content cannot be empty!");
      return;
    }

    try {
      const db = await getDb();
      const { doc, setDoc, updateDoc } = await import("firebase/firestore");

      if (editingId) {
        await updateDoc(doc(db, "sticky_notes", editingId), {
          text,
          color,
          authorId,
        });
        toast.success("Sticky note updated! 📝");
      } else {
        const newId = `note-${Date.now()}`;
        await setDoc(doc(db, "sticky_notes", newId), {
          text,
          color,
          authorId,
          createdAt: new Date().toISOString(),
        });
        toast.success("Sticky note created! 📝");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save sticky note.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sticky note permanently?")) return;
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "sticky_notes", id));
      toast.success("Sticky note deleted!");
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete note.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
          <StickyNote className="w-4 h-4 text-purple-500" />
          Manage Sticky Board Notes ({notes.length})
        </h4>
        {editingId && (
          <button onClick={resetForm} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 cursor-pointer">
            <X className="w-3.5 h-3.5" /> Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white/40 dark:bg-black/10 border border-[var(--border-color)]/50 rounded-2xl p-3.5 space-y-3">
        <div>
          <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Note Content</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a beautiful message..."
            className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all h-16 resize-none"
            maxLength={200}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Author</label>
            <select
              value={authorId}
              onChange={(e: any) => setAuthorId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
            >
              <option value="user_a">{userA.name} (User A)</option>
              <option value="user_b">{userB.name} (User B)</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Color Theme</label>
            <div className="flex gap-1.5 pt-1.5">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                    color === c ? "scale-110 shadow-xs border-indigo-600" : "border-slate-300 opacity-70"
                  }`}
                  style={{
                    backgroundColor:
                      c === "yellow" ? "#fef08a" :
                      c === "pink" ? "#fbcfe8" :
                      c === "blue" ? "#bfdbfe" :
                      c === "green" ? "#bbf7d0" : "#e9d5ff"
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
        >
          {editingId ? <><Edit2 className="w-3.5 h-3.5" /> Update Sticky Note</> : <><Plus className="w-4 h-4" /> Pin Note</>}
        </button>
      </form>

      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {notes.map((n) => {
          const sender = n.authorId === "user_a" ? userA : userB;
          return (
            <div key={n.id} className="flex items-center justify-between gap-3 p-2 bg-white/50 dark:bg-black/5 border border-[var(--border-color)]/45 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 border"
                  style={{
                    backgroundColor:
                      n.color === "yellow" ? "#fef08a" :
                      n.color === "pink" ? "#fbcfe8" :
                      n.color === "blue" ? "#bfdbfe" :
                      n.color === "green" ? "#bbf7d0" : "#e9d5ff"
                  }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{n.text}</p>
                  <p className="text-[8px] font-bold text-[var(--text-muted)]">By {sender.name} • {n.createdAt.split("T")[0]}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(n)}
                  className="p-1.5 bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── 3. VIBE VINYL LOGS CRUD ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

interface VibeLogModel {
  id: string;
  date: string;
  userId: "user_a" | "user_b";
  vibeId: string;
  songTitle: string;
  songArtist: string;
  videoId: string;
  artwork: string;
  durationMs: number;
  createdAt: string;
}

function VibeLogsCrud() {
  const { userA, userB } = useCouple();
  const [logs, setLogs] = useState<VibeLogModel[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState("");
  const [userId, setUserId] = useState<"user_a" | "user_b">("user_a");
  const [vibeId, setVibeId] = useState("chill");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [videoId, setVideoId] = useState("");

  useEffect(() => {
    let unsubscribe: () => void;
    (async () => {
      try {
        const db = await getDb();
        const { collection, onSnapshot, query, orderBy } = await import("firebase/firestore");
        const q = query(collection(db, "daily_vibes"), orderBy("date", "desc"));
        unsubscribe = onSnapshot(q, (snap) => {
          const list: VibeLogModel[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              date: data.date || "",
              userId: data.userId || "user_a",
              vibeId: data.vibeId || "chill",
              songTitle: data.songTitle || "",
              songArtist: data.songArtist || "",
              videoId: data.videoId || "",
              artwork: data.artwork || "",
              durationMs: data.durationMs || 180000,
              createdAt: data.createdAt || "",
            });
          });
          setLogs(list);
        });
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setDate("");
    setUserId("user_a");
    setVibeId("chill");
    setSongTitle("");
    setSongArtist("");
    setVideoId("");
  };

  const handleEdit = (log: VibeLogModel) => {
    setEditingId(log.id);
    setDate(log.date);
    setUserId(log.userId);
    setVibeId(log.vibeId);
    setSongTitle(log.songTitle);
    setSongArtist(log.songArtist);
    setVideoId(log.videoId);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !songTitle.trim() || !songArtist.trim()) {
      toast.error("Please fill in Date, Song Title, and Artist!");
      return;
    }

    try {
      const db = await getDb();
      const { doc, setDoc, updateDoc } = await import("firebase/firestore");

      const entryData = {
        date,
        userId,
        vibeId,
        songTitle,
        songArtist,
        videoId,
        createdAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "daily_vibes", editingId), entryData);
        toast.success("Vibe Vinyl track updated! 🎵");
      } else {
        const id = `${userId}_${date}`;
        await setDoc(doc(db, "daily_vibes", id), entryData);
        toast.success("New Vibe Vinyl track log logged! 🎵");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save vibe log.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this song log?")) return;
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "daily_vibes", id));
      toast.success("Vibe Vinyl track log deleted!");
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete log.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
          <Music className="w-4 h-4 text-pink-500" />
          Manage Daily Vibe Logs ({logs.length})
        </h4>
        {editingId && (
          <button onClick={resetForm} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 cursor-pointer">
            <X className="w-3.5 h-3.5" /> Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white/40 dark:bg-black/10 border border-[var(--border-color)]/50 rounded-2xl p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Target Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">User</label>
            <select
              value={userId}
              onChange={(e: any) => setUserId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
            >
              <option value="user_a">{userA.name} (User A)</option>
              <option value="user_b">{userB.name} (User B)</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Vibe Category</label>
            <select
              value={vibeId}
              onChange={(e) => setVibeId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
            >
              <option value="chill">🍃 Chill & Cozy</option>
              <option value="happy">☀️ Sunshine Happy</option>
              <option value="lofi">🎹 Lo-Fi Study</option>
              <option value="sad">🌧️ Rainy Nostalgia</option>
              <option value="love">💖 Heartbeats</option>
              <option value="hype">⚡ Electric Hype</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Song Title</label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="e.g. Birds of a Feather"
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Artist Name</label>
            <input
              type="text"
              value={songArtist}
              onChange={(e) => setSongArtist(e.target.value)}
              placeholder="e.g. Billie Eilish"
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">YouTube Video ID (Optional)</label>
            <input
              type="text"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="e.g. dFpWeXvY_vM"
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all font-mono"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
        >
          {editingId ? <><Edit2 className="w-3.5 h-3.5" /> Update Vibe Track</> : <><Plus className="w-4 h-4" /> Save Vibe Track</>}
        </button>
      </form>

      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {logs.map((l) => {
          const sender = l.userId === "user_a" ? userA : userB;
          return (
            <div key={l.id} className="flex items-center justify-between gap-3 p-2 bg-white/50 dark:bg-black/5 border border-[var(--border-color)]/45 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm">{l.vibeId === "chill" ? "🍃" : l.vibeId === "happy" ? "☀️" : l.vibeId === "lofi" ? "🎹" : l.vibeId === "sad" ? "🌧️" : l.vibeId === "hype" ? "⚡" : "💖"}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{l.songTitle} - <span className="text-[10px] text-[var(--text-muted)]">{l.songArtist}</span></p>
                  <p className="text-[8px] font-bold text-[var(--text-muted)]">{l.date} • By {sender.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(l)}
                  className="p-1.5 bg-pink-500/10 text-pink-600 hover:bg-pink-500 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(l.id)}
                  className="p-1.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── 4. LETTERS CRUD ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function LettersCrud() {
  const { letters, userA, userB } = useCouple();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [senderId, setSenderId] = useState<"user_a" | "user_b">("user_a");
  const [recipientId, setRecipientId] = useState<"user_a" | "user_b">("user_b");
  const [scheduledFor, setScheduledFor] = useState("");
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    if (senderId === "user_a") setRecipientId("user_b");
    else setRecipientId("user_a");
  }, [senderId]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setSenderId("user_a");
    setScheduledFor("");
    setIsOpened(false);
  };

  const handleEdit = (letter: Letter) => {
    setEditingId(letter.id);
    setTitle(letter.title);
    setContent(letter.content);
    setSenderId(letter.senderId);
    setRecipientId(letter.recipientId);
    setScheduledFor(letter.scheduledFor ? letter.scheduledFor.split("T")[0] : "");
    setIsOpened(letter.isOpened);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in Letter Title and Content!");
      return;
    }

    try {
      const db = await getDb();
      const { doc, setDoc, updateDoc } = await import("firebase/firestore");

      const data = {
        title,
        content,
        senderId,
        recipientId,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        isOpened,
        created_at: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "letters", editingId), data);
        toast.success("Letter updated! 📬");
      } else {
        const id = `letter-${Date.now()}`;
        await setDoc(doc(db, "letters", id), data);
        toast.success("New Letter injected! 📬");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save letter.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this letter permanently?")) return;
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "letters", id));
      toast.success("Letter deleted permanently!");
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete letter.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
          <Mail className="w-4 h-4 text-indigo-500" />
          Manage Live Letters ({letters.length})
        </h4>
        {editingId && (
          <button onClick={resetForm} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 cursor-pointer">
            <X className="w-3.5 h-3.5" /> Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white/40 dark:bg-black/10 border border-[var(--border-color)]/50 rounded-2xl p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Letter Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My dear..."
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Sender</label>
            <select
              value={senderId}
              onChange={(e: any) => setSenderId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
            >
              <option value="user_a">{userA.name} (User A)</option>
              <option value="user_b">{userB.name} (User B)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Content (Markdown supported)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your emotional story..."
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all h-20 resize-none"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Future Lock Date (Optional)</label>
            <input
              type="date"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="letter-opened"
              checked={isOpened}
              onChange={(e) => setIsOpened(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--primary)] border-[var(--border-color)] cursor-pointer"
            />
            <label htmlFor="letter-opened" className="text-[10px] font-bold text-[var(--text-main)] cursor-pointer select-none">
              Mark as Opened/Read
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
        >
          {editingId ? <><Edit2 className="w-3.5 h-3.5" /> Update Letter</> : <><Plus className="w-4 h-4" /> Inject Letter</>}
        </button>
      </form>

      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {letters.map((l) => {
          const sender = l.senderId === "user_a" ? userA : userB;
          return (
            <div key={l.id} className="flex items-center justify-between gap-3 p-2 bg-white/50 dark:bg-black/5 border border-[var(--border-color)]/45 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm">📬</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{l.title}</p>
                  <p className="text-[8px] font-bold text-[var(--text-muted)]">From {sender.name} • {l.isOpened ? "Opened" : "Locked/Unread"}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(l)}
                  className="p-1.5 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(l.id)}
                  className="p-1.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─── 5. MEMORIES CRUD ────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function MemoriesCrud() {
  const { memories, userA, userB } = useCouple();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [type, setType] = useState<"photobooth" | "milestone" | "drawing">("milestone");
  const [date, setDate] = useState("");
  const [creatorId, setCreatorId] = useState<"user_a" | "user_b">("user_a");
  const [showOnTimeline, setShowOnTimeline] = useState(true);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setType("milestone");
    setDate("");
    setCreatorId("user_a");
    setShowOnTimeline(true);
  };

  const handleEdit = (mem: Memory) => {
    setEditingId(mem.id);
    setTitle(mem.title);
    setDescription(mem.description);
    setImageUrl(mem.imageUrl);
    setType(mem.type);
    setDate(mem.date ? mem.date.split("T")[0] : "");
    setCreatorId(mem.creatorId);
    setShowOnTimeline(mem.showOnTimeline !== false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim() || !date) {
      toast.error("Please fill in Title, Image URL, and Date!");
      return;
    }

    try {
      const db = await getDb();
      const { doc, setDoc, updateDoc } = await import("firebase/firestore");

      const data = {
        title,
        description,
        image_url: imageUrl,
        type,
        date: new Date(date).toISOString(),
        created_by: creatorId,
        show_on_timeline: showOnTimeline,
        created_at: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, "memories", editingId), data);
        toast.success("Memory updated! 🎞️");
      } else {
        const id = `mem-${Date.now()}`;
        await setDoc(doc(db, "memories", id), {
          ...data,
          reactions: {},
          comments: [],
        });
        toast.success("New Memory milestone added to Timeline! 🎞️");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save memory.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this memory milestone from the timeline?")) return;
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "memories", id));
      toast.success("Memory deleted permanently!");
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete memory.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
          <Image className="w-4 h-4 text-rose-500" />
          Manage Timeline Memories ({memories.length})
        </h4>
        {editingId && (
          <button onClick={resetForm} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 cursor-pointer">
            <X className="w-3.5 h-3.5" /> Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="bg-white/40 dark:bg-black/10 border border-[var(--border-color)]/50 rounded-2xl p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Memory Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Our first beach holiday"
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
            />
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Milestone Type</label>
            <select
              value={type}
              onChange={(e: any) => setType(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
            >
              <option value="milestone">💖 Milestone Moment</option>
              <option value="photobooth">📸 Life4Cuts Photobooth</option>
              <option value="drawing">🎨 Creative Canvas Drawing</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a sweet memory highlight caption..."
              className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all h-14 resize-none"
            />
          </div>
          <div className="space-y-2 pt-2">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Creator</label>
              <select
                value={creatorId}
                onChange={(e: any) => setCreatorId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white/60 dark:bg-black/20 border border-[var(--border-color)]/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
              >
                <option value="user_a">{userA.name} (User A)</option>
                <option value="user_b">{userB.name} (User B)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 sm:col-span-3">
            <input
              type="checkbox"
              id="mem-show"
              checked={showOnTimeline}
              onChange={(e) => setShowOnTimeline(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--primary)] border-[var(--border-color)] cursor-pointer"
            />
            <label htmlFor="mem-show" className="text-[10px] font-bold text-[var(--text-main)] cursor-pointer select-none">
              Publish on Shared Timeline View
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
        >
          {editingId ? <><Edit2 className="w-3.5 h-3.5" /> Update Memory</> : <><Plus className="w-4 h-4" /> Save Memory</>}
        </button>
      </form>

      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
        {memories.map((m) => {
          const sender = m.creatorId === "user_a" ? userA : userB;
          return (
            <div key={m.id} className="flex items-center justify-between gap-3 p-2 bg-white/50 dark:bg-black/5 border border-[var(--border-color)]/45 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={m.imageUrl} alt={m.title} className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border" referrerPolicy="no-referrer" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-main)] truncate">{m.title}</p>
                  <p className="text-[8px] font-bold text-[var(--text-muted)]">{m.date.split("T")[0]} • By {sender.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(m)}
                  className="p-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="p-1.5 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
