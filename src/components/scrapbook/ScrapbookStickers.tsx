import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import { getDb } from "../../firebaseClient";
import { Sparkles, Trash2, Sticker, X, HelpCircle, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { triggerHaptic } from "../../lib/haptics";
import { cn } from "@/lib/utils";

// ─── LocalStorage fallback helpers ──────────────────────────────────────
const STICKERS_LOCAL_KEY = "scrapbook_stickers_local";

function loadLocalStickers(pageId: string): StickerInstance[] {
  try {
    const raw = localStorage.getItem(STICKERS_LOCAL_KEY);
    if (!raw) return [];
    const all: StickerInstance[] = JSON.parse(raw);
    return all.filter((s) => s.pageId === pageId);
  } catch { return []; }
}

function setLocalStickers(stickers: StickerInstance[]) {
  try {
    localStorage.setItem(STICKERS_LOCAL_KEY, JSON.stringify(stickers));
  } catch { /* ignore */ }
}

export interface StickerInstance {
  id: string;
  emoji: string;
  label: string;
  color: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  rotation: number;
  scale: number;
  pageId: string;
  pastedBy: string;
  timestamp: number;
}

export interface StickerType {
  id: string;
  emoji: string;
  label: string;
  color: string; // Tailwind styling matching the sticker look
}

export const STICKER_SHEET: StickerType[] = [
  { id: "heart", emoji: "❤️", label: "Heart", color: "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100" },
  { id: "bear", emoji: "🧸", label: "Teddy", color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" },
  { id: "flower", emoji: "🌸", label: "Sakura", color: "bg-pink-50 border-pink-200 text-pink-500 hover:bg-pink-100" },
  { id: "sparkle", emoji: "✨", label: "Sparkles", color: "bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100" },
  { id: "coffee", emoji: "☕", label: "Coffee", color: "bg-amber-50 border-amber-900/10 text-amber-900 hover:bg-amber-100" },
  { id: "cat", emoji: "🐾", label: "Paws", color: "bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100" },
  { id: "dino", emoji: "🦕", label: "Dino", color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" },
  { id: "cupcake", emoji: "🧁", label: "Cupcake", color: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-500 hover:bg-fuchsia-100" },
  { id: "donut", emoji: "🍩", label: "Donut", color: "bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100" },
  { id: "letter", emoji: "💌", label: "Letter", color: "bg-red-50 border-red-100 text-red-500 hover:bg-red-100" },
  { id: "camera", emoji: "📷", label: "Camera", color: "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100" },
  { id: "music", emoji: "🎵", label: "Music", color: "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100" },
  { id: "star", emoji: "🌟", label: "Star", color: "bg-yellow-50 border-amber-200 text-amber-600 hover:bg-yellow-100" },
  { id: "clover", emoji: "🍀", label: "Clover", color: "bg-green-50 border-green-200 text-green-600 hover:bg-green-100" },
  { id: "bubble", emoji: "💭", label: "Bubble", color: "bg-sky-50 border-sky-100 text-sky-500 hover:bg-sky-100" },
  { id: "koala", emoji: "🐨", label: "Koala", color: "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100" },
  { id: "cat_g", emoji: "🐱", label: "Kitty", color: "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100" },
  { id: "pizza", emoji: "🍕", label: "Pizza", color: "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100" },
  { id: "balloon", emoji: "🎈", label: "Balloon", color: "bg-red-50 border-red-200 text-red-500 hover:bg-red-100" },
  { id: "rainbow", emoji: "🌈", label: "Rainbow", color: "bg-indigo-50 border-indigo-100 text-indigo-500 hover:bg-indigo-100" },
];

/**
 * Generates a stable pseudo-random rotation offset between -3deg and 3deg for a given sticker ID,
 * ensuring consistency across renders and making their placement appear organic and handmade.
 */
function getRandomRotation(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const deg = ((Math.abs(hash) % 60) / 10) - 3; // range between -3 and +3
  return `${deg}deg`;
}

interface ScrapbookStickersProps {
  activeTab: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ScrapbookStickers({ activeTab, containerRef }: ScrapbookStickersProps) {
  const { currentUser, userA, userB }: any = useCouple();
  const activeProfile = currentUser === "user_a" ? userA : userB;

  const [isOpen, setIsOpen] = useState(false);
  const [stickers, setStickers] = useState<StickerInstance[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  const [customStickers, setCustomStickers] = useState<StickerType[]>([]);
  const [customEmoji, setCustomEmoji] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Sync Stickers from Firestore with localStorage fallback
  useEffect(() => {
    let unsub: (() => void) | null = null;
    
    // Load from localStorage first for instant display
    const localStickers = loadLocalStickers(activeTab);
    if (localStickers.length > 0) {
      setStickers(localStickers);
    }

    (async () => {
      try {
        const db = await getDb();
        const { query: q, collection, where, onSnapshot } = await import("firebase/firestore");
        const queryRef = q(collection(db, "scrapbook_stickers"), where("pageId", "==", activeTab));
        
        unsub = onSnapshot(
          queryRef,
          (snap) => {
            const list: StickerInstance[] = snap.docs.map((d) => {
              const data = d.data();
              return {
                id: d.id,
                emoji: data.emoji || "✨",
                label: data.label || "Sticker",
                color: data.color || "bg-yellow-50",
                x: data.x !== undefined ? Number(data.x) : 50,
                y: data.y !== undefined ? Number(data.y) : 50,
                rotation: data.rotation !== undefined ? Number(data.rotation) : 0,
                scale: data.scale !== undefined ? Number(data.scale) : 1,
                pageId: data.pageId || activeTab,
                pastedBy: data.pastedBy || "Anonymous",
                timestamp: data.timestamp || Date.now(),
              };
            });
            // Sync to localStorage + state
            setLocalStickers(list);
            setStickers(list);
          },
          (err) => {
            console.warn("[scrapbook_stickers] Firestore unavailable, using local:", err);
            // Already loaded from localStorage above
          }
        );
      } catch (err) {
        console.warn("Failed to load stickers from Firestore, using local:", err);
      }
    })();
    return () => { if (unsub) unsub(); };
  }, [activeTab]);

  // Sync Custom Sticker Pack Definitions from Firestore
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const db = await getDb();
        const { collection, onSnapshot, query, orderBy } = await import("firebase/firestore");
        const queryRef = query(collection(db, "custom_couple_stickers"), orderBy("timestamp", "asc"));
        
        unsub = onSnapshot(queryRef, (snap) => {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              emoji: data.emoji || "✨",
              label: data.label || "Custom",
              color: data.color || "bg-pink-50 border-pink-200 text-pink-500 hover:bg-pink-100",
            };
          });
          setCustomStickers(list);
        });
      } catch (err) {
        console.error("Failed to load custom stickers:", err);
      }
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const handleAddCustomSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmoji.trim() || !customLabel.trim()) return;
    triggerHaptic("medium");
    try {
      const db = await getDb();
      const { collection, addDoc } = await import("firebase/firestore");
      
      const stickerColorThemes = [
        "bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100",
        "bg-pink-50 border-pink-200 text-pink-500 hover:bg-pink-100",
        "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
        "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
        "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100",
        "bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100"
      ];
      const randomColor = stickerColorThemes[Math.floor(Math.random() * stickerColorThemes.length)];

      await addDoc(collection(db, "custom_couple_stickers"), {
        emoji: customEmoji.trim(),
        label: customLabel.trim(),
        color: randomColor,
        timestamp: Date.now()
      });

      setCustomEmoji("");
      setCustomLabel("");
      setIsAddingCustom(false);
      toast.success(`Successfully added "${customLabel}" custom sticker! 🎨✨`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save custom sticker.");
    }
  };

  const handleDeleteCustomStickerType = async (id: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("heavy");
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "custom_couple_stickers", id));
      toast.info(`Removed "${label}" from custom couple pack.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete custom sticker.");
    }
  };

  // Click Sticker on the sheet to paste it
  const pasteSticker = useCallback(async (stickerType: StickerType) => {
    triggerHaptic("medium");
    
    // Generate sticker data locally first
    const id = `sticker-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const rx = 25 + Math.random() * 50;
    const ry = 25 + Math.random() * 50;
    const rRotation = -20 + Math.random() * 40;

    const newSticker: StickerInstance = {
      id,
      emoji: stickerType.emoji,
      label: stickerType.label,
      color: stickerType.color,
      x: rx,
      y: ry,
      rotation: rRotation,
      scale: 1,
      pageId: activeTab,
      pastedBy: activeProfile.name,
      timestamp: Date.now(),
    };

    // Show on UI immediately via local state
    setStickers((prev) => {
      const updated = [...prev, newSticker];
      setLocalStickers(updated);
      return updated;
    });
    toast.success(`Pasted a cute ${stickerType.label} sticker! 🩹`);

    // Then try Firestore (best effort)
    try {
      const db = await getDb();
      const { collection, doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(collection(db, "scrapbook_stickers"), id), newSticker);
    } catch (err) {
      console.warn("[pasteSticker] Firestore unavailable, local only:", err);
    }
  }, [activeTab, activeProfile.name]);

  // Update Sticker Position after dragging
  const updateStickerPosition = useCallback(async (id: string, x: number, y: number) => {
    // Update local state immediately
    setStickers((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } : s));
      setLocalStickers(updated);
      return updated;
    });
    // Then try Firestore
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "scrapbook_stickers", id), {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
      });
    } catch (err) {
      console.warn("[updateStickerPosition] Firestore unavailable, local only:", err);
    }
  }, []);

  // Delete Sticker
  const peelSticker = useCallback(async (id: string, label: string) => {
    triggerHaptic("light");
    // Remove from local state immediately
    setStickers((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      setLocalStickers(updated);
      return updated;
    });
    setSelectedStickerId(null);
    toast.info(`Peeled off the ${label} sticker 💨`);
    // Then try Firestore
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "scrapbook_stickers", id));
    } catch (err) {
      console.warn("[peelSticker] Firestore unavailable, local only:", err);
    }
  }, []);

  // Rotate Sticker slightly when clicked
  const rotateSticker = useCallback(async (id: string, currentRotation: number) => {
    triggerHaptic("light");
    const nextRotation = (currentRotation + 30) % 360;
    // Update local state immediately
    setStickers((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, rotation: nextRotation } : s));
      setLocalStickers(updated);
      return updated;
    });
    // Then try Firestore
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "scrapbook_stickers", id), {
        rotation: nextRotation
      });
    } catch (err) {
      console.warn("[rotateSticker] Firestore unavailable, local only:", err);
    }
  }, []);

  return (
    <>
      {/* RENDER STICKERS ON THE VIEWPORT RELATIVE TO THE CONTAINER */}
      <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden">
        {stickers.map((sticker) => {
          const isSelected = selectedStickerId === sticker.id;
          // Dynamic key includes position so Framer Motion resets internal transform on re-render
          // Uses Math.round to avoid excessive re-mounts from tiny floating point changes
          const stickerDragKey = `${sticker.id}-${Math.round(sticker.x)}-${Math.round(sticker.y)}`;
          return (
            <motion.div
              key={stickerDragKey}
              initial={false}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0, rotate: 20 }}
              transition={{ type: "spring", stiffness: 220, damping: 20 }}
              drag
              dragMomentum={false}
              dragElastic={0.05}
              dragConstraints={containerRef || undefined}
              onDragStart={() => {
                setSelectedStickerId(sticker.id);
                triggerHaptic("light");
              }}
              onDragEnd={(_e, info) => {
                if (!containerRef.current) return;
                const rect = containerRef.current.getBoundingClientRect();

                // Use info.offset (delta from drag start) instead of info.point (absolute position)
                const deltaPercentX = (info.offset.x / rect.width) * 100;
                const deltaPercentY = (info.offset.y / rect.height) * 100;

                updateStickerPosition(
                  sticker.id, 
                  Math.max(2, Math.min(98, sticker.x + deltaPercentX)), 
                  Math.max(2, Math.min(98, sticker.y + deltaPercentY))
                );
              }}
              className="absolute pointer-events-auto cursor-grab active:cursor-grabbing group"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) rotate(${getRandomRotation(sticker.id)})`,
              }}
            >
              {/* Sticker wrapper with physical die-cut border style */}
              <motion.div
                animate={{
                  rotate: sticker.rotation,
                  scale: isSelected ? 1.15 : 1,
                  boxShadow: isSelected 
                    ? "0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.1)" 
                    : "0 4px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative px-3.5 py-2.5 bg-white dark:bg-zinc-800 rounded-full border-4 border-white dark:border-zinc-700 font-sans text-2xl flex items-center justify-center select-none shadow-[2px_2px_5px_rgba(0,0,0,0.1)]"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStickerId(isSelected ? null : sticker.id);
                  triggerHaptic("light");
                }}
              >
                <span className="relative z-10 pointer-events-none filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
                  {sticker.emoji}
                </span>
                <div className="absolute inset-0 rounded-inherit border border-neutral-200/40 dark:border-white/10 pointer-events-none" />
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900/90 text-white text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xs uppercase tracking-wider">
                  {sticker.pastedBy}
                </div>
              </motion.div>

              {/* Action Bubbles for Selected Sticker */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2 py-1 rounded-full shadow-lg border border-neutral-100 dark:border-zinc-800 z-50 pointer-events-auto"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); rotateSticker(sticker.id, sticker.rotation); }}
                      className="w-6 h-6 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-zinc-800 dark:text-zinc-200 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); peelSticker(sticker.id, sticker.label); }}
                      className="w-6 h-6 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedStickerId(null); }}
                      className="w-6 h-6 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-500 dark:bg-zinc-800 dark:text-zinc-400 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* FLOAT FLOATING sticker sheet toggle button */}
      <div className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-50">
        <motion.button
          onClick={() => {
            setIsOpen(!isOpen);
            triggerHaptic("light");
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border text-xs font-bold transition-all duration-300 cursor-pointer z-50",
            isOpen 
              ? "bg-rose-500 text-white border-rose-600" 
              : "bg-white dark:bg-zinc-800 text-[#2D2A26] dark:text-[#FAF6F0] border-[#E8DDD0] dark:border-zinc-700 hover:border-rose-400"
          )}
        >
          <Sticker className={cn("w-4 h-4", isOpen && "animate-bounce")} />
          <span>{isOpen ? "Close Sticker Book" : "Peel & Paste Stickers"}</span>
        </motion.button>

        {/* Sticker sheet popup */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-14 left-0 w-80 sm:w-96 max-w-[calc(100vw-32px)] bg-[#FAF6F0] dark:bg-zinc-900 border-2 border-[#E8DDD0] dark:border-zinc-800 rounded-2xl shadow-2xl p-4 z-50"
            >
              {/* Scrapbook Tape Accent on Popup */}
              <div className="absolute -top-2 left-1/3 w-16 h-4 bg-[#E8B4B8]/60 border-l border-r border-dashed border-rose-300/30 transform rotate-1 pointer-events-none" />

              <div className="flex items-center justify-between mb-2 pb-2 border-b border-dashed border-neutral-300 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">✨</span>
                  <h3 className="font-handwrite text-lg font-bold text-amber-950 dark:text-neutral-100">
                    Gerrio & Nicole's Sticker Sheet
                  </h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-neutral-100 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer text-neutral-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-amber-900/60 dark:text-neutral-400/70 font-sans mb-3 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 flex-shrink-0" />
                Tap a sticker to paste it on this page. Drag or hold to reposition and peel!
              </p>

              {/* Grid of Emojis */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-amber-950/70 dark:text-neutral-400 mb-1.5 font-serif">
                    🌸 Classic Stickers
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {STICKER_SHEET.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => pasteSticker(st)}
                        className={cn(
                          "aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:scale-105 active:scale-95 group",
                          st.color
                        )}
                      >
                        <span className="text-2xl group-hover:animate-float">{st.emoji}</span>
                        <span className="text-[8px] mt-1 font-sans text-neutral-500 font-medium tracking-wide truncate max-w-full px-0.5">
                          {st.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Sticker Pack */}
                <div className="border-t border-dashed border-neutral-300 dark:border-zinc-800 pt-3">
                  <div className="flex justify-between items-center mb-1.5">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-amber-950/70 dark:text-neutral-400 font-serif">
                      🎨 Custom Couple Pack
                    </h4>
                    <button
                      onClick={() => {
                        setIsAddingCustom(!isAddingCustom);
                        triggerHaptic("light");
                      }}
                      className="text-[9px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      {isAddingCustom ? "Cancel" : "+ Custom Sticker"}
                    </button>
                  </div>

                  {isAddingCustom && (
                    <form onSubmit={handleAddCustomSticker} className="bg-amber-100/40 dark:bg-zinc-800/50 p-2.5 rounded-xl mb-3 space-y-2 border border-amber-200/40 dark:border-zinc-700">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] uppercase tracking-wider font-bold block text-neutral-500 mb-0.5">Emoji</label>
                          <input
                            type="text"
                            required
                            maxLength={2}
                            placeholder="e.g. 🫂"
                            value={customEmoji}
                            onChange={(e) => setCustomEmoji(e.target.value)}
                            className="w-full text-xs px-2 py-1.5 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white rounded border border-neutral-200 dark:border-zinc-700 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] uppercase tracking-wider font-bold block text-neutral-500 mb-0.5">Label Name</label>
                          <input
                            type="text"
                            required
                            maxLength={10}
                            placeholder="e.g. Hug"
                            value={customLabel}
                            onChange={(e) => setCustomLabel(e.target.value)}
                            className="w-full text-xs px-2 py-1.5 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white rounded border border-neutral-200 dark:border-zinc-700 outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded cursor-pointer"
                      >
                        Create & Add to Pack
                      </button>
                    </form>
                  )}

                  {customStickers.length === 0 ? (
                    <p className="text-[9px] text-neutral-400 italic">No custom stickers yet. Click + Custom Sticker to make one!</p>
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      {customStickers.map((st) => (
                        <div key={st.id} className="relative group/custom aspect-square">
                          <button
                            onClick={() => pasteSticker(st)}
                            className={cn(
                              "w-full h-full rounded-xl border border-dashed flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:scale-105 active:scale-95 group",
                              st.color
                            )}
                          >
                            <span className="text-2xl group-hover:animate-float">{st.emoji}</span>
                            <span className="text-[8px] mt-1 font-sans text-neutral-500 font-medium tracking-wide truncate max-w-full px-0.5">
                              {st.label}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomStickerType(st.id, st.label, e)}
                            className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white hover:bg-red-600 rounded-full flex items-center justify-center text-[8px] font-bold shadow-md cursor-pointer opacity-0 group-hover/custom:opacity-100 transition-opacity z-10"
                            title="Delete custom sticker type"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
