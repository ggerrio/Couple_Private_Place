import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  RotateCw, ZoomIn, ZoomOut, Trash2, Plus, Smile, RefreshCw,
  FileText, Check, HelpCircle, Sparkles, HelpCircle as InfoIcon,
  Save, Layers, ArrowUp, ArrowDown, Lock, Unlock
} from "lucide-react";
import { useCouple } from "../../context/CoupleContext";
import type { Memory } from "../../types";
import { triggerHaptic } from "../../lib/haptics";
import { toast } from "sonner";
import { getDb } from "../../firebaseClient";
import { CreativeDrawer } from "./CreativeDrawer";

interface BoardElement {
  id: string;
  memoryId?: string;
  type: "polaroid" | "sticky" | "sticker" | "washi";
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  scale: number;
  rotate: number;
  text?: string;
  sticker?: string;
  washiType?: string;
  color?: "yellow" | "pink" | "blue" | "green" | "amber";
  zIndex?: number; // ordering z-index
}

// Expanded sticker presets: includes standard emoticons, cute washi tape snippets, and dried flora
const STICKER_PRESETS = [
  "❤️", "💖", "✨", "🧸", "🌸", "☕", "📷", "🌟", 
  "🩹", "🎀", "🍃", "🍀", "🌻", "💌", "🕯️", "🍿", 
  "🎈", "🐱", "🐾", "🍕"
];

const WASHI_PRESETS = [
  { id: "stripes", label: "Pastel Stripes", bg: "repeating-linear-gradient(45deg, #fbcfe8, #fbcfe8 10px, #fdf2f8 10px, #fdf2f8 20px)" },
  { id: "floral", label: "Rose Petal Floral", bg: "radial-gradient(circle, #fde047 10%, transparent 11%), radial-gradient(circle, #fbcfe8 20%, transparent 21%)" },
  { id: "polka-dots", label: "Sage Polka Dots", bg: "radial-gradient(#bbf7d0 15%, transparent 16%) 0 0 / 12px 12px, radial-gradient(#bbf7d0 15%, transparent 16%) 6px 6px / 12px 12px", bgColor: "#f0fdf4" },
  { id: "glitter", label: "Cosmic Sparkle", bg: "linear-gradient(135deg, #c084fc 0%, #818cf8 100%)" },
  { id: "vintage", label: "Craft Paper", bg: "#f5e0c3" },
];

const STICKY_COLORS = [
  { value: "yellow", label: "Parchment", bg: "bg-yellow-100 border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-900/40", text: "text-yellow-900 dark:text-yellow-200" },
  { value: "pink", label: "Rose Petal", bg: "bg-pink-100 border-pink-200 dark:bg-pink-950/40 dark:border-pink-900/40", text: "text-pink-900 dark:text-pink-200" },
  { value: "blue", label: "Sky Breeze", bg: "bg-blue-100 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900/40", text: "text-blue-900 dark:text-blue-200" },
  { value: "green", label: "Sage Moss", bg: "bg-green-100 border-green-200 dark:bg-green-950/40 dark:border-green-900/40", text: "text-green-900 dark:text-green-200" },
  { value: "amber", label: "Gold Autumn", bg: "bg-amber-100 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/40", text: "text-amber-900 dark:text-amber-200" },
];

interface ScrapbookCanvasProps {
  onSelectMemory: (memory: Memory) => void;
}

export default function ScrapbookCanvas({ onSelectMemory }: ScrapbookCanvasProps) {
  const { memories } = useCouple();
  const boardRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editingTextValue, setEditingTextValue] = useState("");
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [scrollLocked, setScrollLocked] = useState(true);

  // Prevent background scroll when touch-dragging objects in the scrapbook
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (scrollLocked) {
        const target = e.target as HTMLElement;
        const isInteractive = target.closest(".cursor-grab") || target.closest(".cursor-grabbing") || target.id === "scrapbook-interactive-board";
        if (isInteractive && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    board.addEventListener("touchstart", preventDefaultTouch, { passive: false });
    board.addEventListener("touchmove", preventDefaultTouch, { passive: false });

    return () => {
      board.removeEventListener("touchstart", preventDefaultTouch);
      board.removeEventListener("touchmove", preventDefaultTouch);
    };
  }, [scrollLocked]);


  // Filter memories to only those with image URLs
  const photoMemories = useMemo(() => {
    return memories.filter((m) => m.imageUrl && m.imageUrl.trim() !== "");
  }, [memories]);

  // Firestore synchronization helper functions
  const syncUpdateElement = async (id: string, updates: Partial<BoardElement>) => {
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "scrapbook_elements", id), updates);
    } catch (e) {
      console.error(`Failed to update element ${id} in Firestore:`, e);
      toast.error("Couldn't sync layout changes. 🔗");
    }
  };

  const syncAddElement = async (element: BoardElement) => {
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "scrapbook_elements", element.id), element);
    } catch (e) {
      console.error(`Failed to add element ${element.id} to Firestore:`, e);
      toast.error("Couldn't sync new item. 🔗");
    }
  };

  const syncDeleteElement = async (id: string) => {
    try {
      const db = await getDb();
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "scrapbook_elements", id));
    } catch (e) {
      console.error(`Failed to delete element ${id} from Firestore:`, e);
      toast.error("Couldn't sync deletion. 🔗");
    }
  };

  // Real-time Firestore sync
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    const setupSync = async () => {
      try {
        const db = await getDb();
        const { collection, onSnapshot, query } = await import("firebase/firestore");
        if (cancelled) return;

        const q = query(collection(db, "scrapbook_elements"));
        unsub = onSnapshot(q, (snapshot) => {
          const items: BoardElement[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            items.push({
              id: doc.id,
              memoryId: data.memoryId,
              type: data.type,
              x: data.x !== undefined ? Number(data.x) : 50,
              y: data.y !== undefined ? Number(data.y) : 50,
              scale: data.scale !== undefined ? Number(data.scale) : 1,
              rotate: data.rotate !== undefined ? Number(data.rotate) : 0,
              text: data.text,
              sticker: data.sticker,
              washiType: data.washiType,
              color: data.color,
              zIndex: data.zIndex !== undefined ? Number(data.zIndex) : 10,
            });
          });

          // Sort items by zIndex so they stack in the correct order
          items.sort((a, b) => (a.zIndex || 10) - (b.zIndex || 10));

          if (items.length === 0 && photoMemories.length > 0) {
            initializeDefaultBoardToFirestore();
          } else {
            setElements(items);
          }
        }, (error) => {
          console.error("Firestore Scrapbook Elements subscription failed:", error);
          toast.error("Failed to sync scrapbook in real-time. 🔌");
        });
      } catch (err) {
        console.error("Error setting up Firestore sync:", err);
      }
    };

    setupSync();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [photoMemories]);

  // Populate board with scattered real memories in Firestore if empty
  const initializeDefaultBoardToFirestore = async () => {
    if (photoMemories.length === 0) return;

    const initial: BoardElement[] = photoMemories.map((m, idx) => {
      // Scatter elements nicely across the board
      const columns = 3;
      const row = Math.floor(idx / columns);
      const col = idx % columns;
      
      const baseX = 15 + col * 28 + (Math.random() * 8 - 4);
      const baseY = 15 + row * 32 + (Math.random() * 8 - 4);

      return {
        id: `memory-${m.id}`,
        memoryId: m.id,
        type: "polaroid",
        x: Math.max(5, Math.min(85, baseX)),
        y: Math.max(5, Math.min(85, baseY)),
        scale: 1.0,
        rotate: Math.round(Math.random() * 16 - 8), // rotation between -8deg and 8deg
        zIndex: 10 + idx,
      };
    });

    // Add a default welcoming sticky note
    initial.push({
      id: "welcome-note",
      type: "sticky",
      x: 45,
      y: 40,
      scale: 1.1,
      rotate: -4,
      text: "Our Love Space ❤️\nDrag us around, rotate, scale, and add notes or stickers. Make it ours!",
      color: "pink",
      zIndex: 50,
    });

    try {
      const db = await getDb();
      const { doc, writeBatch } = await import("firebase/firestore");
      const batch = writeBatch(db);
      
      initial.forEach((el) => {
        batch.set(doc(db, "scrapbook_elements", el.id), el);
      });
      
      await batch.commit();
      console.log("Successfully initialized default elements in Firestore");
    } catch (e) {
      console.error("Failed to initialize default board in Firestore:", e);
    }
  };

  // Manual save trigger with simulated vintage loading disket animations (now saves to Firestore)
  const handleManualSave = async () => {
    setIsSavingLayout(true);
    triggerHaptic("medium");
    
    try {
      const db = await getDb();
      const { doc, writeBatch } = await import("firebase/firestore");
      const batch = writeBatch(db);
      
      elements.forEach((el) => {
        batch.set(doc(db, "scrapbook_elements", el.id), el);
      });
      
      await batch.commit();
      
      setTimeout(() => {
        setIsSavingLayout(false);
        triggerHaptic("success");
        toast.success("Retro diskette saved layout sector successfully! 💾🌸");
      }, 1200);
    } catch (err) {
      console.error("Failed to manual save:", err);
      setIsSavingLayout(false);
      toast.error("Manual save failed.");
    }
  };

  // Add a brand new Sticky Note
  const addStickyNote = async () => {
    triggerHaptic("light");
    const colors: Array<"yellow" | "pink" | "blue" | "green" | "amber"> = ["yellow", "pink", "blue", "green", "amber"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 10), 10);
    
    const newNote: BoardElement = {
      id: `sticky-${Date.now()}`,
      type: "sticky",
      x: 35 + Math.random() * 15,
      y: 30 + Math.random() * 15,
      scale: 1.0,
      rotate: Math.round(Math.random() * 12 - 6),
      text: "Double-tap to write something sweet... 📝",
      color: randomColor,
      zIndex: maxZ + 1,
    };
    
    await syncAddElement(newNote);
    setSelectedId(newNote.id);
    toast.success("Sticky note pasted to your board!");
  };

  // Add a cute sticker
  const addSticker = async (stickerEmoji: string) => {
    triggerHaptic("light");
    const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 10), 10);
    const newSticker: BoardElement = {
      id: `sticker-${Date.now()}`,
      type: "sticker",
      x: 40 + Math.random() * 10,
      y: 35 + Math.random() * 10,
      scale: 1.1,
      rotate: Math.round(Math.random() * 20 - 10),
      sticker: stickerEmoji,
      zIndex: maxZ + 1,
    };
    
    await syncAddElement(newSticker);
    setSelectedId(newSticker.id);
    setShowStickerPanel(false);
    toast.success("Ornament placed!");
  };

  // Remove element from board
  const removeElement = async (id: string) => {
    triggerHaptic("medium");
    setSelectedId(null);
    await syncDeleteElement(id);
    toast.info("Removed from board.");
  };

  // Reset the entire canvas layout
  const handleResetBoard = async () => {
    if (confirm("Reset the whole scrapbook layout back to default scattered photos?")) {
      triggerHaptic("medium");
      setSelectedId(null);
      try {
        const db = await getDb();
        const { collection, getDocs, doc, writeBatch } = await import("firebase/firestore");
        const snap = await getDocs(collection(db, "scrapbook_elements"));
        const batch = writeBatch(db);
        snap.forEach((d) => {
          batch.delete(doc(db, "scrapbook_elements", d.id));
        });
        await batch.commit();
        toast.success("Canvas reset!");
      } catch (e) {
        console.error("Failed to reset board:", e);
        toast.error("Failed to reset board.");
      }
    }
  };

  // Update specific values on drag end
  const handleDragEnd = async (id: string, info: any) => {
    if (!boardRef.current) return;
    const boardBounds = boardRef.current.getBoundingClientRect();
    const el = elements.find((e) => e.id === id);
    if (!el) return;

    // Convert absolute viewport mouse release coordinates to percent of our target board container
    const localX = info.point.x - boardBounds.left;
    const localY = info.point.y - boardBounds.top;

    const percentX = (localX / boardBounds.width) * 100;
    const percentY = (localY / boardBounds.height) * 100;

    const newX = Math.max(2, Math.min(95, percentX));
    const newY = Math.max(2, Math.min(95, percentY));

    // Update locally instantly for response feel
    const updated = elements.map((item) => {
      if (item.id === id) {
        return { ...item, x: newX, y: newY };
      }
      return item;
    });
    setElements(updated);

    // Sync to Firestore
    await syncUpdateElement(id, { x: newX, y: newY });
  };

  // Modify rotation directly via the slider
  const setRotationDirect = async (degrees: number) => {
    if (!selectedId) return;
    const updated = elements.map((item) => {
      if (item.id === selectedId) {
        return { ...item, rotate: degrees };
      }
      return item;
    });
    setElements(updated);
    await syncUpdateElement(selectedId, { rotate: degrees });
  };

  // Bring current selected item to front layer (raise z-index)
  const bringToFront = async () => {
    if (!selectedId) return;
    triggerHaptic("light");
    const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 10), 10);
    const newZ = maxZ + 2;
    const updated = elements.map((item) => {
      if (item.id === selectedId) {
        return { ...item, zIndex: newZ };
      }
      return item;
    });
    setElements(updated);
    await syncUpdateElement(selectedId, { zIndex: newZ });
    toast.info("Moved item to top layer! ⬆️");
  };

  // Send current selected item to back layer (decrease z-index)
  const sendToBack = async () => {
    if (!selectedId) return;
    triggerHaptic("light");
    const minZ = elements.reduce((min, el) => Math.min(min, el.zIndex || 10), 10);
    const newZ = Math.max(1, minZ - 2);
    const updated = elements.map((item) => {
      if (item.id === selectedId) {
        return { ...item, zIndex: newZ };
      }
      return item;
    });
    setElements(updated);
    await syncUpdateElement(selectedId, { zIndex: newZ });
    toast.info("Moved item to back layer! ⬇️");
  };

  // Modify scale of selected item
  const scaleSelected = async (factor: "up" | "down") => {
    if (!selectedId) return;
    triggerHaptic("light");
    const amount = factor === "up" ? 0.15 : -0.15;
    const el = elements.find((item) => item.id === selectedId);
    if (!el) return;
    const nextScale = parseFloat(Math.max(0.5, Math.min(2.5, el.scale + amount)).toFixed(2));
    const updated = elements.map((item) => {
      if (item.id === selectedId) {
        return { ...item, scale: nextScale };
      }
      return item;
    });
    setElements(updated);
    await syncUpdateElement(selectedId, { scale: nextScale });
  };

  // Change custom sticky note color
  const changeStickyColor = async (colorName: "yellow" | "pink" | "blue" | "green" | "amber") => {
    if (!selectedId) return;
    triggerHaptic("light");
    const updated = elements.map((item) => {
      if (item.id === selectedId && item.type === "sticky") {
        return { ...item, color: colorName };
      }
      return item;
    });
    setElements(updated);
    await syncUpdateElement(selectedId, { color: colorName });
  };

  // Change custom washi tape design
  const changeWashiType = async (typeId: string) => {
    if (!selectedId) return;
    triggerHaptic("light");
    const updated = elements.map((item) => {
      if (item.id === selectedId && item.type === "washi") {
        return { ...item, washiType: typeId };
      }
      return item;
    });
    setElements(updated);
    await syncUpdateElement(selectedId, { washiType: typeId });
    toast.success("Washi Tape design updated! 🩹");
  };

  // Handle double clicking sticky to edit text
  const handleStartEditText = (el: BoardElement) => {
    if (el.type !== "sticky") return;
    triggerHaptic("light");
    setEditingTextValue(el.text || "");
    setIsEditingText(true);
  };

  const handleSaveTextValue = async () => {
    if (!selectedId) return;
    const updated = elements.map((item) => {
      if (item.id === selectedId) {
        return { ...item, text: editingTextValue };
      }
      return item;
    });
    setElements(updated);
    setIsEditingText(false);
    triggerHaptic("success");
    await syncUpdateElement(selectedId, { text: editingTextValue });
    toast.success("Message updated!");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDropOnBoard = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!boardRef.current) return;

    const rect = boardRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const pctX = Math.max(5, Math.min(85, (rawX / rect.width) * 100));
    const pctY = Math.max(5, Math.min(85, (rawY / rect.height) * 100));

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (!dataStr) return;

      const item = JSON.parse(dataStr);
      const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 10), 10);

      const newEl: BoardElement = {
        id: `${item.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: item.type as "washi" | "sticker" | "sticky",
        x: pctX,
        y: pctY,
        scale: 1.0,
        rotate: Math.round(Math.random() * 16 - 8),
        zIndex: maxZ + 1,
        ...item.props
      };

      await syncAddElement(newEl);
      toast.success(`${item.type === "washi" ? "Washi tape" : item.type === "sticky" ? "Sticky note" : "Sticker"} placed! ✨`);
    } catch (err) {
      console.error("Failed to parse drag-and-drop data:", err);
    }
  };

  const handleAddCreativeItem = async (item: { type: "washi" | "sticker" | "sticky"; props: any }) => {
    const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex || 10), 10);
    const newEl: BoardElement = {
      id: `${item.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: item.type,
      x: 35 + Math.random() * 15,
      y: 30 + Math.random() * 15,
      scale: 1.0,
      rotate: Math.round(Math.random() * 20 - 10),
      zIndex: maxZ + 1,
      ...item.props
    };
    
    await syncAddElement(newEl);
    toast.success(`Creative ${item.type === "washi" ? "Washi tape" : item.type === "sticky" ? "sticky note" : "sticker"} placed! ✨`);
  };

  const activeElement = elements.find((e) => e.id === selectedId);

  return (
    <div className="relative space-y-4 text-left pb-36">
      {/* Interactive Desk Table Board */}
      <div
        ref={boardRef}
        id="scrapbook-interactive-board"
        onDragOver={handleDragOver}
        onDrop={handleDropOnBoard}
        className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-[#E3DAC9] dark:bg-[#1E1915] border-2 border-[#D4A574]/40 dark:border-stone-800 rounded-3xl overflow-hidden shadow-2xl select-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(0, 0, 0, 0.1) 100%),
            url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 60h120M60 0v120' stroke='%238b7355' stroke-width='0.5' fill='none' opacity='0.03'/%3E%3C/svg%3E")
          `,
        }}
      >
        {/* Real Tablewood Margin Accent lines */}
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-[#C4956A]/10 border-r border-[#D4A574]/20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 bg-[#C4956A]/10 border-l border-[#D4A574]/20 pointer-events-none" />

        {/* Scroll Lock Toggle Button */}
        <div className="absolute right-6 top-4 z-30">
          <button
            type="button"
            onClick={() => {
              setScrollLocked(!scrollLocked);
              triggerHaptic("light");
              toast.success(!scrollLocked ? "Table Scroll Locked! 🔒 Drag objects freely." : "Scroll unlocked! 🔓");
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[9px] font-mono font-bold shadow-xs backdrop-blur-xs transition-all cursor-pointer ${
              scrollLocked
                ? "bg-amber-100/90 border-amber-300 text-amber-800 dark:bg-stone-900/90 dark:border-amber-900/50 dark:text-amber-300"
                : "bg-white/80 border-stone-300 text-stone-600 dark:bg-stone-900/80 dark:border-stone-800 dark:text-stone-400"
            }`}
          >
            {scrollLocked ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Locked</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                <span>Unlock</span>
              </>
            )}
            <span>Scroll</span>
          </button>
        </div>

        {/* Empty State Help hint */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)] bg-black/5 dark:bg-black/15 pointer-events-none">
            <HelpCircle className="w-8 h-8 text-[var(--primary)] mb-2 animate-bounce" />
            <p className="font-serif text-sm font-bold">Your Table Canvas is Empty</p>
            <p className="text-xs">Create a customized sticky note or upload new photos to scatter them here!</p>
          </div>
        )}

        {/* Inline Sticky Note Editor */}
        <AnimatePresence>
          {isEditingText && activeElement && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[var(--fabric-cream)] dark:bg-stone-900 border border-[var(--wood-oak)]/30 rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-3 text-left">
                <span className="text-[10px] uppercase tracking-wider text-[var(--primary)] font-bold">Edit Note Message</span>
                <textarea
                  value={editingTextValue}
                  onChange={(e) => setEditingTextValue(e.target.value)}
                  rows={4}
                  maxLength={120}
                  className="w-full text-xs p-3 border border-[var(--border-color)] dark:border-white/10 rounded-xl outline-none resize-none bg-white dark:bg-stone-800 text-[var(--text-main)]"
                  placeholder="Type a heartwarming memory or message..."
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsEditingText(false)}
                    className="px-3 py-1.5 bg-black/5 text-[var(--text-muted)] text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTextValue}
                    className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Done
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Render Canvas Draggable Elements */}
        {elements.map((el) => {
          // Resolve details for Memory Polaroids
          let memory: Memory | undefined;
          if (el.type === "polaroid" && el.memoryId) {
            memory = memories.find((m) => m.id === el.memoryId);
          }

          const isSelected = selectedId === el.id;

          return (
            <motion.div
              key={el.id}
              drag
              dragMomentum={false}
              dragConstraints={boardRef}
              onDragEnd={(event, info) => handleDragEnd(el.id, info)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(el.id);
                triggerHaptic("light");
              }}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                scale: el.scale,
                rotate: `${el.rotate}deg`,
                zIndex: el.zIndex || 10,
                position: "absolute",
              }}
              className={`cursor-grab active:cursor-grabbing select-none transition-shadow ${
                isSelected ? "z-40" : ""
              }`}
            >
              {/* Type 1: Polaroid Memory Photo */}
              {el.type === "polaroid" && memory && (
                <div 
                  className={`p-3 pb-10 bg-white dark:bg-stone-50 border rounded-xs shadow-md transition-all duration-300 w-44 flex flex-col items-center select-none ${
                    isSelected 
                      ? "ring-2 ring-[var(--primary)] border-transparent shadow-xl scale-105" 
                      : "border-neutral-200/60 shadow-md hover:shadow-lg"
                  }`}
                  onDoubleClick={() => {
                    if (memory) onSelectMemory(memory);
                  }}
                >
                  <div className="w-full aspect-square bg-neutral-100 overflow-hidden relative border border-neutral-900/5">
                    <img
                      src={memory.imageUrl}
                      alt={memory.title}
                      loading="lazy"
                      className={`w-full h-full object-cover pointer-events-none ${
                        memory.filterClass === "vintage" ? "filter-vintage" :
                        memory.filterClass === "kodak" ? "filter-kodak" :
                        memory.filterClass === "disposable" ? "filter-disposable" :
                        memory.filterClass === "vhs" ? "filter-vhs" :
                        memory.filterClass === "soft-blur" ? "filter-soft-blur" :
                        memory.filterClass === "warm-tone" ? "filter-warm-tone" :
                        memory.filterClass === "grainy-bw" ? "filter-grainy-bw" :
                        memory.filterClass === "light-leak" ? "filter-light-leak" : ""
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    {memory.filterClass === "light-leak" && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-rose-500/20 to-transparent pointer-events-none mix-blend-screen" />
                    )}
                  </div>
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[90%] text-center">
                    <p className="font-handwrite text-[11px] text-amber-950 tracking-wider rotate-[-1deg] truncate max-w-full leading-tight font-bold">
                      {memory.polaroidNote || memory.title || "A Beautiful Day"}
                    </p>
                  </div>
                </div>
              )}

              {/* Type 2: Customizable Tactile Sticky Note */}
              {el.type === "sticky" && (() => {
                const colorObj = STICKY_COLORS.find((c) => c.value === el.color) || STICKY_COLORS[0];
                return (
                  <div
                    onDoubleClick={() => handleStartEditText(el)}
                    className={`p-3.5 w-44 aspect-square border-l-4 shadow-sm border border-neutral-200/50 rounded-r-xs flex flex-col justify-between text-left select-none transition-all duration-300 ${
                      colorObj.bg
                    } ${
                      isSelected 
                        ? "ring-2 ring-[var(--primary)] border-transparent shadow-lg scale-105" 
                        : "hover:shadow-md"
                    }`}
                  >
                    {/* Tiny metal pin/tape effect on top */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 bg-white/40 dark:bg-white/10 shadow-[0_1px_1px_rgba(0,0,0,0.05)] rounded-sm transform rotate-[-3deg]" />
                    
                    <p className={`font-handwrite text-[11.5px] leading-relaxed tracking-wide whitespace-pre-wrap select-none flex-1 overflow-hidden font-bold ${colorObj.text}`}>
                      {el.text}
                    </p>
                    <span className="text-[7px] text-black/30 dark:text-white/20 font-mono text-right mt-1">
                      Double-tap to write
                    </span>
                  </div>
                );
              })()}

              {/* Type 3: Decorative Scrapbook Stickers */}
              {el.type === "sticker" && (
                <div
                  className={`w-12 h-12 flex items-center justify-center text-3xl transition-transform cursor-grab active:cursor-grabbing ${
                    isSelected ? "ring-2 ring-[var(--primary)] rounded-full bg-white/20 scale-110 p-1" : "hover:scale-115"
                  }`}
                >
                  {el.sticker}
                </div>
              )}

              {/* Type 4: Washi Tape */}
              {el.type === "washi" && (() => {
                // Find background pattern matching presets
                const bgStyle = el.washiType === "stripes" ? "repeating-linear-gradient(45deg, #fbcfe8, #fbcfe8 10px, #fdf2f8 10px, #fdf2f8 20px)" :
                                el.washiType === "floral" ? "radial-gradient(circle, #fde047 10%, transparent 11%), radial-gradient(circle, #fbcfe8 20%, transparent 21%)" :
                                el.washiType === "polka-dots" ? "radial-gradient(#bbf7d0 15%, transparent 16%) 0 0 / 12px 12px, radial-gradient(#bbf7d0 15%, transparent 16%) 6px 6px / 12px 12px" :
                                el.washiType === "glitter" ? "linear-gradient(135deg, #c084fc 0%, #818cf8 100%)" :
                                el.washiType === "vintage" ? "#f5e0c3" :
                                "linear-gradient(90deg, #e2e8f0, #cbd5e1)";
                const bgColorStyle = el.washiType === "polka-dots" ? "#f0fdf4" : undefined;
                const isGradient = bgStyle.startsWith("linear-gradient") || bgStyle.startsWith("radial-gradient") || bgStyle.startsWith("repeating-linear-gradient");
                return (
                  <div
                    className={`h-7 w-32 border border-white/20 shadow-xs mix-blend-multiply dark:mix-blend-screen opacity-90 transition-all cursor-grab active:cursor-grabbing rounded-xs ${
                      isSelected 
                        ? "ring-2 ring-[var(--primary)] scale-105" 
                        : "hover:opacity-100"
                    }`}
                    style={{
                      backgroundImage: isGradient ? bgStyle : undefined,
                      backgroundColor: isGradient ? (bgColorStyle || undefined) : bgStyle,
                      borderStyle: "dashed",
                      borderWidth: "1px",
                    }}
                  />
                );
              })()}
            </motion.div>
          );
        })}
      </div>

      {/* Highly Z-Indexed, Responsive Creative Desk Drawer */}
      <CreativeDrawer
        onAddStickyNote={addStickyNote}
        onAddWashiTape={(washiType) => handleAddCreativeItem({ type: "washi", props: { washiType } })}
        onAddOrnament={addSticker}
        onManualSave={handleManualSave}
        isSavingLayout={isSavingLayout}
        onResetBoard={handleResetBoard}
        activeElement={activeElement}
        onRotateDirect={setRotationDirect}
        onScaleSelected={scaleSelected}
        onStartEditText={handleStartEditText}
        onRemoveElement={removeElement}
        bringToFront={bringToFront}
        sendToBack={sendToBack}
      />

      {/* Quick Desk Guide */}
      <div className="p-3 bg-black/5 dark:bg-black/10 rounded-xl border border-dashed border-[var(--border-color)] dark:border-white/5 flex items-start gap-2 text-[10px] text-[var(--text-muted)] font-mono leading-relaxed">
        <InfoIcon className="w-4 h-4 text-[var(--primary)] mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-[var(--text-main)]">SCRAPBOOKING DESK TRICKS:</span> Drag any polaroid or stickies around. Select any element to unlock the smooth angle rotation range-slider, bring-to-front layer ⬆️ / back-layer ⬇️ ordering, or scale size values. Manual save layout saves directly to our retro floppy disk sectors!
        </div>
      </div>
    </div>
  );
}
