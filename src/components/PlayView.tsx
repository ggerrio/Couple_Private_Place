/**
 * PlayView.tsx — Game Attic
 * Redesigned with wooden toy-box grid, hover-lift effects, and animated transitions.
 * All game logic, Firebase sync, and Cloudinary uploads are preserved.
 */

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import {
  Gamepad2,
  RefreshCw,
  ChevronRight,
  Music,
  ArrowLeft,
  Palette,
  Sparkles
} from "lucide-react";
import { getDb } from "../firebaseClient";
import { toast } from "sonner";
import { WashiTapeDivider, StickerButton } from "./scrapbook";
import { triggerHaptic } from "../lib/haptics";

type Section = "games" | "sketch" | "piano";
type GameId = "tictactoe" | "wyr" | "spindare";

// ─── Lazy-loaded Games ─────────────────────────────────────────────────────────

const TicTacToe = React.lazy(() => import("./games/TicTacToe"));
const WouldYouRather = React.lazy(() => import("./games/WouldYouRather"));
const SpinDare = React.lazy(() => import("./games/SpinDare"));
const SketchCanvas = React.lazy(() => import("./games/SketchCanvas"));
const VirtualPiano = React.lazy(() => import("./VirtualPiano"));

// ─── Toy Box Card Definitions ─────────────────────────────────────────────────

type ActivityId = "tictactoe" | "wyr" | "spindare" | "sketch" | "piano";

const ACTIVITY_BOXES: { id: ActivityId; title: string; description: string; icon: React.ElementType; emoji: string; accent: string }[] = [
  { id: "tictactoe", title: "Tic Tac Toe", description: "Hearts vs Rings — classic grid battle!", icon: Gamepad2, emoji: "⭕❌", accent: "border-l-rose-400" },
  { id: "wyr", title: "Would You Rather", description: "Romantic dilemmas to debate together.", icon: Sparkles, emoji: "🤔", accent: "border-l-amber-500" },
  { id: "spindare", title: "Spin the Dare", description: "Truth or dare — spin to decide!", icon: RefreshCw, emoji: "🎡", accent: "border-l-[var(--wood-walnut)]" },
  { id: "sketch", title: "Sketch Canvas", description: "Draw together in real-time.", icon: Palette, emoji: "🎨", accent: "border-l-emerald-500" },
  { id: "piano", title: "Grand Piano", description: "Play melodies on a shared piano.", icon: Music, emoji: "🎹", accent: "border-l-blue-500" },
];

// ─── Main PlayView Component ──────────────────────────────────────────────────
const PlayView = React.memo(function PlayView() {
  const [section, setSection] = useState<Section>("games");
  const [gameId, setGameId] = useState<GameId>("tictactoe");
  const [activeActivity, setActiveActivity] = useState<ActivityId | null>(null);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [gameStats, setGameStats] = useState<Record<string, { playCount: number; streak: number }>>({
    tictactoe: { playCount: 24, streak: 5 },
    wyr: { playCount: 42, streak: 8 },
    spindare: { playCount: 15, streak: 3 },
    sketch: { playCount: 18, streak: 4 },
    piano: { playCount: 50, streak: 12 },
  });

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
      unsub = onSnapshot(doc(db, "rooms", "game_stats"), (d: any) => {
        if (d.exists()) {
          const data = d.data();
          setGameStats({
            tictactoe: data.tictactoe || { playCount: 24, streak: 5 },
            wyr: data.wyr || { playCount: 42, streak: 8 },
            spindare: data.spindare || { playCount: 15, streak: 3 },
            sketch: data.sketch || { playCount: 18, streak: 4 },
            piano: data.piano || { playCount: 50, streak: 12 },
          });
        } else {
          // ✅ Seed-only merge — if a partner created this doc first, we don't clobber their stats
          setDoc(doc(db, "rooms", "game_stats"), {
            tictactoe: { playCount: 24, streak: 5 },
            wyr: { playCount: 42, streak: 8 },
            spindare: { playCount: 15, streak: 3 },
            sketch: { playCount: 18, streak: 4 },
            piano: { playCount: 50, streak: 12 },
          }, { merge: true }).catch(console.error);
        }
      }, (err) => {
        console.error("[game stats listener]", err);
        toast.error("Failed to load game stats.");
      });
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const incrementStats = useCallback(async (id: ActivityId) => {
    try {
      const db = await getDb();
      const { doc, runTransaction } = await import("firebase/firestore");
      const statsRef = doc(db, "rooms", "game_stats");
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(statsRef);
        const currentRemote = sfDoc.exists() ? sfDoc.data() : {};
        const currentVal = (currentRemote[id] || { playCount: 0, streak: 0 }) as { playCount: number; streak: number };
        const updatedStats = {
          ...currentRemote,
          [id]: {
            playCount: currentVal.playCount + 1,
            streak: currentVal.streak + 1,
          }
        };
        transaction.set(statsRef, updatedStats, { merge: true });
      });
    } catch (e) {
      console.error("Failed to increment stats:", e);
      toast.error("Couldn't update game stats. Check your connection.");
    }
  }, []);

  const openActivity = (id: ActivityId) => {
    if (id === "tictactoe" || id === "wyr" || id === "spindare") {
      setSection("games");
      setGameId(id as GameId);
    } else if (id === "sketch") {
      setSection("sketch");
    } else if (id === "piano") {
      setSection("piano");
    }
    setActiveActivity(id);
    incrementStats(id);
  };

  const goBack = () => {
    setActiveActivity(null);
  };

  return (
    <div id="play-view">
      <div className="text-center pb-4">
        <h2 className="text-2xl font-serif font-bold text-[var(--text-main)]">🎮 Game Attic</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">Pick a box, open it, and play together!</p>
      </div>

      <WashiTapeDivider color="gold" label="Toy Boxes" />

      <LayoutGroup id="game-attic">
        <AnimatePresence mode="popLayout">
          {/* ═══ GRID VIEW — Toy Box Selection ═══ */}
          {!activeActivity && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {ACTIVITY_BOXES.map((box) => (
                  <motion.button
                    key={box.id}
                    id={`attic-box-${box.id}`}
                    onClick={() => openActivity(box.id)}
                    whileHover="hover"
                    initial="initial"
                    layoutId={`activity-box-${box.id}`}
                    className="relative text-left w-full cursor-pointer select-none group"
                    style={{ perspective: 1000 }}
                  >
                    {/* Distressed vintage sticker badge */}
                    <div className="absolute -top-2.5 -right-1 z-35 rotate-[5deg] border-2 border-dashed border-[var(--wood-oak)] px-2 py-0.5 rounded shadow-md select-none font-mono text-[8px] font-bold text-[var(--text-main)] transition-transform group-hover:scale-110 group-hover:rotate-[-3deg] flex items-center gap-1 pointer-events-none" style={{ backgroundColor: 'var(--fabric-cream)' }}>
                      <span>🎮 {gameStats[box.id]?.playCount || 0}</span>
                      <span className="text-[var(--wood-oak)]/40">|</span>
                      <span className="accent-coral">🔥 {gameStats[box.id]?.streak || 0}</span>
                    </div>

                    {/* The Wooden Lid (Lifts on hover) */}
                    <motion.div
                      variants={{
                        initial: { rotateX: 0, y: 0, scaleY: 1 },
                        hover: { rotateX: -25, y: -6, scaleY: 0.95 }
                      }}
                      transition={{ type: "spring", stiffness: 200, damping: 14 }}
                      className="h-7 bg-[var(--wood-walnut)] rounded-t-xl border-b-4 border-amber-950/40 relative z-20 flex items-center justify-between px-3 shadow-md"
                      style={{ transformOrigin: "top" }}
                    >
                      <div className="w-1.5 h-1.5 bg-yellow-500/80 rounded-full border border-amber-600/30" />
                      <div className="w-3.5 h-2.5 bg-yellow-500 rounded-b-md shadow-xs border border-amber-600/30" />
                      <div className="w-1.5 h-1.5 bg-yellow-500/80 rounded-full border border-amber-600/30" />
                    </motion.div>

                    {/* The Box Body */}
                    <div className="bg-[var(--fabric-cream)] rounded-b-xl border-x border-b border-[var(--wood-oak)]/30 shadow-md relative z-10 overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/10 to-transparent pointer-events-none" />
                      <div className="p-5 pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-white/60 border border-[var(--wood-oak)]/15 flex items-center justify-center shadow-2xs">
                            <box.icon className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[var(--text-main)] font-serif flex items-center gap-1.5">
                            {box.title} <span className="text-base font-normal text-gray-500">{box.emoji}</span>
                          </h3>
                          <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed min-h-[36px]">{box.description}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider group-hover:gap-1.5 transition-all">
                          <span>Open Box</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══ ACTIVE GAME VIEW ═══ */}
          {activeActivity && (
            <motion.div
              key={`active-${activeActivity}`}
              layoutId={`activity-box-${activeActivity}`}
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 bg-[var(--fabric-cream)]/35 p-4 rounded-3xl border border-[var(--wood-oak)]/20 shadow-sm"
            >
              {/* Back Button with Box label */}
              <div className="flex items-center justify-between">
                <StickerButton
                  id="attic-back-btn"
                  onClick={goBack}
                  color="gold"
                  size="sm"
                  icon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  Back to Attic
                </StickerButton>
                {/* Active game sticker badge — also shown in active view */}
                <div className="rotate-[-2deg] border-2 border-dashed border-[var(--wood-oak)] px-3 py-1 rounded shadow-md font-mono text-[9px] font-bold text-[var(--text-main)] flex items-center gap-1.5" style={{ backgroundColor: 'var(--fabric-cream)' }}>
                  <span>🎮 {gameStats[activeActivity]?.playCount || 0} plays</span>
                  <span className="text-[var(--wood-oak)]/40">·</span>
                  <span className="text-orange-600">🔥 {gameStats[activeActivity]?.streak || 0} streak</span>
                </div>
              </div>

              {/* Game Sub-Tabs (only for games section) */}
              {section === "games" && (
                <div className="space-y-2">
                  {/* Mobile Accordion */}
                  <div className="md:hidden w-full relative z-40">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setMenuExpanded(!menuExpanded);
                      }}
                      className="w-full p-3 rounded-2xl border border-[var(--wood-oak)]/15 font-bold text-xs flex items-center justify-between shadow-xs select-none cursor-pointer"
                      style={{ backgroundColor: "var(--fabric-cream)" }}
                    >
                      <span className="flex items-center gap-2 text-[var(--primary)] font-extrabold">
                        🎮 {gameId === "tictactoe" ? "Tic Tac Toe ⭕❌" : gameId === "wyr" ? "Would You Rather? 🤔" : "Spin the Dare 🎡"}
                      </span>
                      <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        Switch Game {menuExpanded ? "▲" : "▼"}
                      </span>
                    </button>
                    <AnimatePresence>
                      {menuExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-1.5 rounded-2xl border border-[var(--wood-oak)]/15 divide-y divide-[var(--wood-oak)]/10 shadow-lg absolute left-0 right-0 z-50"
                          style={{ backgroundColor: "var(--fabric-cream)" }}
                        >
                          {([["tictactoe", "Tic Tac Toe ⭕❌"], ["wyr", "Would You Rather? 🤔"], ["spindare", "Spin the Dare 🎡"]] as const).map(([id, label]) => {
                            if (id === gameId) return null; // hide active in list
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => {
                                  triggerHaptic("light");
                                  setGameId(id);
                                  setMenuExpanded(false);
                                }}
                                className="w-full text-left py-3 px-4 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 cursor-pointer block bg-transparent border-none outline-none select-none"
                              >
                                {label}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Desktop Tabs */}
                  <div role="tablist" aria-label="Game selection" className="hidden md:flex p-2 rounded-2xl gap-1 relative overflow-hidden border border-[var(--wood-oak)]/15" style={{ backgroundColor: "var(--fabric-cream)" }}>
                    {([["tictactoe", "Tic Tac Toe ⭕❌"], ["wyr", "Would You Rather? 🤔"], ["spindare", "Spin the Dare 🎡"]] as const).map(([id, label]) => {
                      const isSelected = gameId === id;
                      return (
                        <button
                          key={id}
                          id={`game-btn-${id}`}
                          role="tab"
                          aria-selected={isSelected}
                          onClick={() => setGameId(id)}
                          className={`relative flex-1 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer z-10 select-none ${
                            isSelected
                              ? "text-[var(--primary)] font-extrabold"
                              : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/10"
                          }`}
                        >
                          <span className="relative z-10">{label}</span>
                          {isSelected && (
                            <motion.div
                              layoutId="activePlaySubTab"
                              className="absolute inset-0 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl -z-10 shadow-3xs"
                              transition={{ type: "spring", stiffness: 350, damping: 28 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Render Active Game/Activity — Lazy loaded */}
              <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading game...</div>}>
                {section === "games" && gameId === "tictactoe" && (
                  <TicTacToe onGameComplete={() => incrementStats("tictactoe")} />
                )}
                {section === "games" && gameId === "wyr" && (
                  <WouldYouRather onVote={() => incrementStats("wyr")} />
                )}
                {section === "games" && gameId === "spindare" && (
                  <SpinDare onSpinComplete={() => incrementStats("spindare")} />
                )}
                {section === "sketch" && (
                  <SketchCanvas onSave={() => incrementStats("sketch")} />
                )}
                {section === "piano" && (
                  <VirtualPiano />
                )}
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
);

export default PlayView;
