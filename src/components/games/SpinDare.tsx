/**
 * SpinDare.tsx — Truth or Dare spin wheel
 */
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Settings2, Plus, Trash } from "lucide-react";
import { useCouple } from "../../context/CoupleContext";
import { getDb } from "../../firebaseClient";
import { toast } from "sonner";
import { Skeleton } from "../extras/Skeleton";

// ─── Default Items ────────────────────────────────────────────────────────────

const DEFAULT_TRUTHS = [
  "What was your first impression of me? 😊",
  "What is your absolute favorite memory of us? 💖",
  "When did you first realize you had feelings for me? 🌸",
  "What is one quirk of mine that you secretly adore? 🥰",
  "What's the best dream you've ever had about us? 💭",
  "If we could run away together tonight, where would we go? ✈️",
];

const DEFAULT_DARES = [
  "Send your partner an embarrassing selfie right now 📸",
  "Record a voice note listing 3 things you love about them 🎙️",
  "Promise to cook their favorite meal this week 🍳",
  "Write a quick 50-word romantic poem right now 📝",
  "Offer to give them a 5-minute back massage next time 💆",
  "Let them choose the next movie you watch together 🎬",
];

// ─── Spin the Dare Component ──────────────────────────────────────────────────

function SpinDare({ onSpinComplete }: { onSpinComplete?: () => void }) {
  const { currentUser } = useCouple();
  const [dbState, setDbState] = useState<{
    truths: string[];
    dares: string[];
    rotation: number;
    spinning: boolean;
    selectedType: "truth" | "dare";
    result: string | null;
  }>({
    truths: DEFAULT_TRUTHS,
    dares: DEFAULT_DARES,
    rotation: 0,
    spinning: false,
    selectedType: "dare",
    result: null,
  });

  const [spinLoading, setSpinLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editorTab, setEditorTab] = useState<"truth" | "dare">("truth");

  // Sync with Firestore
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
      unsub = onSnapshot(
        doc(db, "rooms", "spindare_room"),
        (d: any) => {
          setSpinLoading(false);
          if (d.exists()) {
            const data = d.data();
            setDbState({
              truths: data.truths || DEFAULT_TRUTHS,
              dares: data.dares || DEFAULT_DARES,
              rotation: data.rotation || 0,
              spinning: data.spinning || false,
              selectedType: data.selectedType || "dare",
              result: data.result || null,
            });
          } else {
            setDoc(doc(db, "rooms", "spindare_room"), {
              truths: DEFAULT_TRUTHS,
              dares: DEFAULT_DARES,
              rotation: 0,
              spinning: false,
              selectedType: "dare",
              result: null,
            }).catch(console.error);
          }
        },
        (err) => {
          console.error("[spindare room listener]", err);
          toast.error("Spin the Dare sync lost. Check your connection.");
        }
      );
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const changeSelectedType = useCallback(async (type: "truth" | "dare") => {
    try {
      const db = await getDb();
      const { doc, runTransaction } = await import("firebase/firestore");
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(doc(db, "rooms", "spindare_room"));
        if (sfDoc.exists()) {
          const data = sfDoc.data();
          if (data.spinning) {
            throw new Error("Cannot switch mode while spinning!");
          }
        }
        transaction.set(
          doc(db, "rooms", "spindare_room"),
          { selectedType: type, result: null },
          { merge: true }
        );
      });
    } catch (e: any) {
      if (e?.message === "Cannot switch mode while spinning!") return;
      console.error("[spindare changeType]", e);
      toast.error("Failed to switch mode.");
    }
  }, []);

  const spin = useCallback(async () => {
    if (dbState.spinning) return;
    const items =
      dbState.selectedType === "truth" ? dbState.truths : dbState.dares;
    if (items.length === 0) return;

    const selectedIdx = Math.floor(Math.random() * items.length);
    const sliceSize = 360 / items.length;
    const targetAngle = 360 - (selectedIdx * sliceSize + sliceSize / 2);
    const finalRotation = dbState.rotation + 1440 + targetAngle;

    const db = await getDb();
    const { doc, runTransaction } = await import("firebase/firestore");
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(doc(db, "rooms", "spindare_room"));
      if (sfDoc.exists()) {
        const data = sfDoc.data();
        if (data.spinning) {
          throw new Error("Already spinning!");
        }
      }
      transaction.set(
        doc(db, "rooms", "spindare_room"),
        { spinning: true, rotation: finalRotation, result: null },
        { merge: true }
      );
    });

    setTimeout(async () => {
      try {
        await runTransaction(db, async (transaction) => {
          transaction.set(
            doc(db, "rooms", "spindare_room"),
            { spinning: false, result: items[selectedIdx] },
            { merge: true }
          );
        });
      } catch (e) {
        console.error("[spindare spin result]", e);
        toast.error("Failed to save spin result.");
      }
      onSpinComplete?.();
    }, 3500);
  }, [dbState, onSpinComplete]);

  const addItem = useCallback(async () => {
    const text = newItemText.trim();
    if (!text) return;
    const currentList =
      editorTab === "truth" ? dbState.truths : dbState.dares;
    if (currentList.length >= 20) return;
    const newList = [...currentList, text];

    try {
      const db = await getDb();
      const { doc, runTransaction } = await import("firebase/firestore");
      await runTransaction(db, async (transaction) => {
        transaction.set(
          doc(db, "rooms", "spindare_room"),
          { [editorTab === "truth" ? "truths" : "dares"]: newList },
          { merge: true }
        );
      });
      setNewItemText("");
    } catch (e) {
      console.error("[spindare addItem]", e);
      toast.error("Failed to add item.");
    }
  }, [newItemText, editorTab, dbState]);

  const removeItem = useCallback(
    async (idxToRemove: number) => {
      const currentList =
        editorTab === "truth" ? dbState.truths : dbState.dares;
      if (currentList.length <= 2) return;
      const newList = currentList.filter((_, idx) => idx !== idxToRemove);

      try {
        const db = await getDb();
        const { doc, runTransaction } = await import("firebase/firestore");
        await runTransaction(db, async (transaction) => {
          transaction.set(
            doc(db, "rooms", "spindare_room"),
            { [editorTab === "truth" ? "truths" : "dares"]: newList },
            { merge: true }
          );
        });
      } catch (e) {
        console.error("[spindare removeItem]", e);
        toast.error("Failed to remove item.");
      }
    },
    [editorTab, dbState]
  );

  const items =
    dbState.selectedType === "truth" ? dbState.truths : dbState.dares;
  const colors = [
    "#E6C594", "#B35E6B", "#FAF6F0", "#8C4351",
    "#E8DCC4", "#D59E7C", "#2C1A1D",
  ];

  if (spinLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        role="status"
        aria-label="Loading Spin the Dare"
      >
        <div
          className="p-6 rounded-3xl flex flex-col items-center gap-5 border border-[var(--wood-oak)]/15"
          style={{ backgroundColor: "var(--fabric-cream)" }}
        >
          <div className="w-full flex items-center justify-between">
            <Skeleton height={20} width={180} rounded="8px" />
            <Skeleton width={32} height={32} rounded="12px" />
          </div>
          <Skeleton width={180} height={40} rounded="20px" />
          <Skeleton width={200} height={200} rounded="50%" />
          <Skeleton width={160} height={44} rounded="16px" />
        </div>
        <span className="sr-only">Loading spin wheel...</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <div
        className="p-6 rounded-3xl flex flex-col items-center gap-5 border border-[var(--wood-oak)]/15"
        style={{ backgroundColor: "var(--fabric-cream)" }}
      >
        <div className="w-full flex items-center justify-between">
          <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <span>Spin the Dare Wheel 🎡</span>
          </h4>
          <button
            id="spindare-settings-btn"
            onClick={() => setShowEditor((prev) => !prev)}
            className={`p-2 rounded-xl border cursor-pointer transition-all ${
              showEditor
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                : "bg-white/50 dark:bg-black/25 border-[var(--border-color)] text-[var(--text-main)] hover:bg-white dark:hover:bg-black/40"
            }`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Item Editor */}
        <AnimatePresence>
          {showEditor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden border-b border-[var(--border-color)] pb-4"
            >
              <div className="bg-white/35 dark:bg-black/20 p-4 rounded-2xl border border-[var(--border-color)] space-y-3">
                <div className="flex gap-2">
                  <button
                    id="editor-tab-truth"
                    onClick={() => setEditorTab("truth")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editorTab === "truth"
                        ? "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30"
                        : "bg-white/55 dark:bg-black/25 border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-white dark:hover:bg-black/40"
                    }`}
                  >
                    Truths ({dbState.truths.length}/20)
                  </button>
                  <button
                    id="editor-tab-dare"
                    onClick={() => setEditorTab("dare")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      editorTab === "dare"
                        ? "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30"
                        : "bg-white/55 dark:bg-black/25 border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-white dark:hover:bg-black/40"
                    }`}
                  >
                    Dares ({dbState.dares.length}/20)
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    id="new-item-input"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                    placeholder={`Add new ${editorTab}...`}
                    disabled={
                      (editorTab === "truth"
                        ? dbState.truths
                        : dbState.dares
                      ).length >= 20
                    }
                    className="flex-1 text-xs px-3 py-2 bg-white/60 dark:bg-black/25 border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] disabled:opacity-60 transition-colors"
                  />
                  <button
                    id="add-item-btn"
                    onClick={addItem}
                    disabled={
                      (editorTab === "truth"
                        ? dbState.truths
                        : dbState.dares
                      ).length >= 20 || !newItemText.trim()
                    }
                    className="p-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {(editorTab === "truth" ? dbState.truths : dbState.dares).map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 bg-white/50 dark:bg-black/20 p-2 rounded-xl text-[11px] border border-[var(--border-color)]"
                      >
                        <span className="truncate flex-1 text-[var(--text-main)]">
                          {item}
                        </span>
                        <button
                          id={`remove-item-${idx}`}
                          onClick={() => removeItem(idx)}
                          disabled={
                            (editorTab === "truth"
                              ? dbState.truths
                              : dbState.dares
                            ).length <= 2
                          }
                          className="text-red-400 hover:text-red-600 disabled:opacity-30 cursor-pointer transition-colors"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode toggle */}
        <div className="flex bg-white/60 dark:bg-black/20 p-1 rounded-2xl border border-[var(--border-color)] w-full max-w-[200px] sm:max-w-[208px] gap-1">
          <button
            id="wheel-mode-truth"
            onClick={() => changeSelectedType("truth")}
            disabled={dbState.spinning}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              dbState.selectedType === "truth"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Truth
          </button>
          <button
            id="wheel-mode-dare"
            onClick={() => changeSelectedType("dare")}
            disabled={dbState.spinning}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              dbState.selectedType === "dare"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            Dare
          </button>
        </div>

        {/* Wheel */}
        <div className="relative w-44 sm:w-56 h-44 sm:h-56 flex items-center justify-center bg-amber-950 border-[6px] sm:border-[10px] border-amber-900 rounded-full p-2 sm:p-2.5 shadow-2xl">
          <div className="absolute inset-1.5 sm:inset-2 border-2 border-white/10 rounded-full pointer-events-none z-10" />
          <div
            className="w-full h-full relative rounded-full overflow-hidden"
            style={{
              transition: dbState.spinning
                ? "transform 3.5s cubic-bezier(0.15, 0.75, 0.1, 1)"
                : "none",
              transform: `rotate(${dbState.rotation}deg)`,
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              {items.map((_, i) => {
                const angle = (360 / items.length) * i;
                const nextAngle = (360 / items.length) * (i + 1);
                const r = 100;
                const toRad = (a: number) => ((a - 90) * Math.PI) / 180;
                const x1 = 100 + r * Math.cos(toRad(angle));
                const y1 = 100 + r * Math.sin(toRad(angle));
                const x2 = 100 + r * Math.cos(toRad(nextAngle));
                const y2 = 100 + r * Math.sin(toRad(nextAngle));
                return (
                  <path
                    key={i}
                    d={`M100,100 L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`}
                    fill={colors[i % colors.length]}
                    stroke="rgba(44, 26, 29, 0.15)"
                    strokeWidth="1"
                  />
                );
              })}
              <circle cx="100" cy="100" r="18" fill="white" stroke="#bc6c25" strokeWidth="2.5" />
              <circle cx="100" cy="100" r="4" fill="#bc6c25" />
            </svg>
          </div>
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full text-amber-500 drop-shadow" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 2h4v6h6L12 22 4 8h6z" />
            </svg>
          </div>
        </div>

        <motion.button
          id="spin-dare-btn"
          onClick={spin}
          disabled={dbState.spinning || items.length === 0}
          whileTap={{ scale: 0.94 }}
          className="px-10 py-3 bg-[var(--primary)] text-white font-bold rounded-2xl text-xs hover:opacity-90 disabled:opacity-60 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-md cursor-pointer"
        >
          {dbState.spinning ? "Spinning..." : "Spin Wheel!"}
        </motion.button>

        <AnimatePresence>
          {dbState.result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full bg-white/60 dark:bg-black/25 border border-[var(--border-color)] rounded-2xl p-4 text-center shadow-xs"
            >
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 font-bold">
                {dbState.selectedType === "truth"
                  ? "Truth Question"
                  : "Dare Challenge"}
              </p>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-main)] leading-relaxed px-2">
                {dbState.result}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default SpinDare;
