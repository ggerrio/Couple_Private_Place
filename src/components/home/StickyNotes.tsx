import React, { useState, useEffect, useCallback } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion } from "motion/react";
import { getDb } from "../../firebaseClient";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyJournalPage } from "../scrapbook";
import { triggerHaptic } from "../../lib/haptics";
import { cn } from "../../lib/utils";

const NOTE_COLORS = [
  "bg-yellow-50 border-yellow-200 text-amber-900",
  "bg-pink-50 border-pink-200 text-pink-900",
  "bg-blue-50 border-blue-200 text-blue-900",
  "bg-green-50 border-green-200 text-emerald-900",
  "bg-purple-50 border-purple-200 text-purple-900",
];

export function StickyNotes() {
  const { currentUser, userA, userB }: any = useCouple();
  const activeProfile = currentUser === "user_a" ? userA : userB;
  const [notes, setNotes] = useState<
    { id: string; text: string; author: string; color: string }[]
  >([]);
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { query: q, collection, orderBy: ob, onSnapshot, limit: l } = await import("firebase/firestore");
      const queryRef = q(collection(db, "sticky_notes"), ob("createdAt", "desc"), l(12));
      unsub = onSnapshot(
        queryRef,
        (snap) => {
          if (snap.empty) {
            setNotes([]);
          } else {
            const list = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                text: data.text || "",
                author: data.author || "",
                color:
                  data.color || "bg-yellow-50 border-yellow-200 text-amber-900",
              };
            });
            setNotes(list.slice(0, 12));
          }
        },
        (err) => {
          console.error("[sticky_notes listener]", err);
          toast.error("Failed to sync sticky notes.");
        }
      );
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const addNote = useCallback(async () => {
    if (!noteInput.trim()) return;
    const text = noteInput.trim();
    setNoteInput("");
    try {
      const db = await getDb();
      const { collection, addDoc } = await import("firebase/firestore");
      const color =
        NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
      await addDoc(collection(db, "sticky_notes"), {
        text,
        author: activeProfile.name,
        color,
        createdAt: Date.now(),
      });
      await addDoc(collection(db, "activity_logs"), {
        user_id: currentUser,
        text: `pasted a new sticky note: "${text.substring(0, 25)}${text.length > 25 ? "..." : ""}" 📝`,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.error("[addNote]", e);
    }
  }, [noteInput, activeProfile.name, currentUser]);

  const removeNote = useCallback(async (id: string) => {
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "sticky_notes", id));
      triggerHaptic("light");
    } catch (e) {
      console.error("[removeNote]", e);
    }
  }, []);

  const content = (
    <div className="p-3 space-y-4 relative z-[2]">
      {/* Add Note Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Write a sweet thought..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addNote(); }
          }}
          className="flex-1 px-3 py-2 text-xs bg-white/70 border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder-gray-400"
        />
        <button
          onClick={addNote}
          disabled={!noteInput.trim()}
          className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Post
        </button>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {notes.map((note) => {
          // Helper for organic individual rotation offsets (deterministic based on note id)
          const getRotation = (id: string) => {
            let hash = 0;
            for (let i = 0; i < id.length; i++) {
              hash = id.charCodeAt(i) + ((hash << 5) - hash);
            }
            return (hash % 8) - 4; // value between -4 and +4
          };

          const getTapeRotation = (id: string) => {
            let hash = 0;
            for (let i = 0; i < id.length; i++) {
              hash = id.charCodeAt(i) + ((hash << 7) - hash);
            }
            return (hash % 6) - 3; // tape value between -3 and +3
          };

          const noteRotation = getRotation(note.id);
          const tapeRotation = getTapeRotation(note.id);

          return (
            <div
              key={note.id}
              className={cn(
                "relative p-4 pb-5 rounded-sm border shadow-[2px_2px_5px_rgba(45,42,38,0.06)] hover:shadow-lg group transition-all duration-300 hover:scale-[1.03] hover:rotate-0",
                note.color
              )}
              style={{
                transform: `rotate(${noteRotation}deg)`,
              }}
            >
              {/* Cute Washi Tape atop Sticky Note */}
              <div 
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-11 h-4 bg-amber-200/50 dark:bg-amber-600/35 backdrop-blur-[0.5px] border-l border-r border-dashed border-amber-400/40 transform z-10 shadow-[0_1px_1px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden"
                style={{ 
                  transform: `translateX(-50%) rotate(${tapeRotation}deg)`,
                  clipPath: "polygon(0% 15%, 8% 0%, 92% 0%, 100% 20%, 97% 85%, 85% 100%, 15% 100%, 3% 80%)"
                }}
              >
                {/* Visual strip details inside mini tape */}
                <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.25)_4px,rgba(255,255,255,0.25)_8px)]" />
              </div>

              <button
                onClick={() => removeNote(note.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-white/90 dark:bg-zinc-800/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-neutral-200 dark:border-zinc-700 cursor-pointer z-20 shadow-xs"
              >
                <X className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              </button>
              
              <p className="text-base md:text-lg leading-relaxed font-handwrite tracking-wide text-neutral-800 dark:text-neutral-100 pr-1 select-text">
                {note.text}
              </p>
              
              <p className="text-[9px] mt-3 opacity-70 font-mono tracking-wider text-right uppercase">
                — {note.author}
              </p>
            </div>
          );
        })}
        {notes.length === 0 && (
          <div className="col-span-full">
            <EmptyJournalPage
              icon="💕"
              message="No sweet notes yet. Leave one for your partner!"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2 }}
      id="sweet-notes-board"
    >
      {content}
    </motion.div>
  );
}
