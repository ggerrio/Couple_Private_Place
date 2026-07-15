/**
 * PlayView.tsx — Game Attic
 * Redesigned with wooden toy-box grid, hover-lift effects, and animated transitions.
 * All game logic, Firebase sync, and Cloudinary uploads are preserved.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import {
  Gamepad2,
  Pen,
  RotateCcw,
  Trophy,
  RefreshCw,
  ChevronRight,
  Trash,
  Plus,
  Settings2,
  Undo,
  Redo,
  Download,
  Heart,
  Eraser,
  Music,
  ArrowLeft,
  Palette,
  Sparkles,
  Lock,
  Unlock
} from "lucide-react";
import { getDb } from "../firebaseClient";
import VirtualPiano from "./VirtualPiano";
import { toast } from "sonner";
import { WashiTapeDivider, StickerButton } from "./scrapbook";
import { Skeleton } from "./extras/Skeleton";
import { triggerHaptic } from "../lib/haptics";

type Section = "games" | "sketch" | "piano";
type GameId = "tictactoe" | "wyr" | "spindare";

// ─── Safe Fallback Database Wrappers ──────────────────────────────────────────

const safeUpdateDoc = async (docRef: any, data: any) => {
  const db = await getDb();
  if ((db as any).isFallback) {
    const path = docRef.path;
    const existingStr = localStorage.getItem(`fs_fallback_${path}`);
    const existing = existingStr ? JSON.parse(existingStr) : {};

    const finalData = { ...existing };
    for (const key in data) {
      if (data[key] && typeof data[key] === "object" && data[key]._arrayUnion) {
        const arr = Array.isArray(finalData[key]) ? finalData[key] : [];
        finalData[key] = [...arr, ...data[key].values];
      } else {
        finalData[key] = data[key];
      }
    }

    localStorage.setItem(`fs_fallback_${path}`, JSON.stringify(finalData));

    window.dispatchEvent(new StorageEvent("storage", {
      key: `fs_fallback_${path}`,
      newValue: JSON.stringify(finalData)
    }));
    return;
  }

  const { updateDoc, arrayUnion } = await import("firebase/firestore");
  const realData = { ...data };
  for (const key in realData) {
    if (realData[key] && typeof realData[key] === "object" && realData[key]._arrayUnion) {
      realData[key] = arrayUnion(...realData[key].values);
    }
  }
  return await updateDoc(docRef, realData);
};

const customArrayUnion = (...values: any[]) => {
  return { _arrayUnion: true, values };
};

export async function uploadToCloudinary(blob: Blob, filename: string, cloudName: string, uploadPreset: string): Promise<string> {
  if (!cloudName || !uploadPreset) {
    console.warn("Cloudinary not configured, generating safe local object URL");
    return URL.createObjectURL(blob);
  }
  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("upload_preset", uploadPreset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("Failed to upload image to Cloudinary");
  }
  const data = await response.json();
  return data.secure_url;
}

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
          setDoc(doc(db, "rooms", "game_stats"), {
            tictactoe: { playCount: 24, streak: 5 },
            wyr: { playCount: 42, streak: 8 },
            spindare: { playCount: 15, streak: 3 },
            sketch: { playCount: 18, streak: 4 },
            piano: { playCount: 50, streak: 12 },
          }).catch(console.error);
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
      const { doc, setDoc } = await import("firebase/firestore");
      const statsRef = doc(db, "rooms", "game_stats");
      const currentVal = gameStats[id] || { playCount: 0, streak: 0 };
      const updatedStats = {
        ...gameStats,
        [id]: {
          playCount: currentVal.playCount + 1,
          streak: currentVal.streak + 1,
        }
      };
      await setDoc(statsRef, updatedStats, { merge: true });
    } catch (e) {
      console.error("Failed to increment stats:", e);
      toast.error("Couldn't update game stats. Check your connection.");
    }
  }, [gameStats]);

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

              {/* Render Active Game/Activity */}
              <div style={{ display: section === "games" && gameId === "tictactoe" ? "block" : "none" }}>
                <TicTacToe onGameComplete={() => incrementStats("tictactoe")} />
              </div>
              <div style={{ display: section === "games" && gameId === "wyr" ? "block" : "none" }}>
                <WouldYouRather onVote={() => incrementStats("wyr")} />
              </div>
              <div style={{ display: section === "games" && gameId === "spindare" ? "block" : "none" }}>
                <SpinDare onSpinComplete={() => incrementStats("spindare")} />
              </div>
              <div style={{ display: section === "sketch" ? "block" : "none" }}>
                <SketchCanvas onSave={() => incrementStats("sketch")} />
              </div>
              <div style={{ display: section === "piano" ? "block" : "none" }}>
                <VirtualPiano />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
);

export default PlayView;

// ─── Tic Tac Toe ──────────────────────────────────────────────────────────────

interface TTTGame {
  board: (string | null)[];
  nextTurn: "user_a" | "user_b";
  winner: "user_a" | "user_b" | "draw" | null;
  scoreA: number;
  scoreB: number;
}

const WIN_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

function checkWinner(board: (string | null)[]): string | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? "draw" : null;
}

function TicTacToe({ onGameComplete }: { onGameComplete?: () => void }) {
  const { currentUser, userA, userB } = useCouple();
  const [game, setGame] = useState<TTTGame>({ board: Array(9).fill(null), nextTurn: "user_a", winner: null, scoreA: 0, scoreB: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
      unsub = onSnapshot(doc(db, "rooms", "ttt_room"), (d: any) => {
        if (d.exists()) {
          setGame(d.data() as TTTGame);
        } else {
          setDoc(doc(db, "rooms", "ttt_room"), { board: Array(9).fill(null), nextTurn: "user_a", winner: null, scoreA: 0, scoreB: 0 }).catch(console.error);
        }
        setIsLoading(false);
      }, (err) => {
        console.error("[ttt room listener]", err);
        toast.error("Tic Tac Toe sync lost. Check your connection.");
      });
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const move = useCallback(async (idx: number) => {
    if (game.board[idx] || game.winner) return;
    if (game.nextTurn !== currentUser) return;
    const symbol = currentUser === "user_a" ? "X" : "O";
    const newBoard = [...game.board];
    newBoard[idx] = symbol;
    const winner = checkWinner(newBoard);

    let isWinnerA = winner && winner !== "draw" && currentUser === "user_a";
    let isWinnerB = winner && winner !== "draw" && currentUser === "user_b";

    const newGame: TTTGame = {
      board: newBoard,
      nextTurn: currentUser === "user_a" ? "user_b" : "user_a",
      winner: winner === "draw" ? "draw" : (winner ? currentUser : null),
      scoreA: game.scoreA + (isWinnerA ? 1 : 0),
      scoreB: game.scoreB + (isWinnerB ? 1 : 0),
    };
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "ttt_room"), newGame);
    } catch (e) {
      console.error("[ttt move]", e);
      toast.error("Failed to send move. Check your connection.");
      return;
    }

    if (winner) {
      onGameComplete?.();
    }
  }, [game, currentUser, onGameComplete]);

  const reset = useCallback(async () => {
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "ttt_room"), { ...game, board: Array(9).fill(null), winner: null });
    } catch (e) {
      console.error("[ttt reset]", e);
      toast.error("Failed to reset game. Please try again.");
    }
  }, [game]);

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4" role="status" aria-label="Loading Tic Tac Toe">
        <div className="p-6 rounded-3xl border border-[var(--wood-oak)]/15" style={{ backgroundColor: "var(--fabric-cream)" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="text-center w-28 space-y-2">
              <Skeleton width={36} height={36} rounded="50%" className="mx-auto" />
              <Skeleton height={14} width="70%" rounded="6px" className="mx-auto" />
              <Skeleton height={24} width="40%" rounded="6px" className="mx-auto" />
            </div>
            <Skeleton height={28} width={100} rounded="20px" />
            <div className="text-center w-28 space-y-2">
              <Skeleton width={36} height={36} rounded="50%" className="mx-auto" />
              <Skeleton height={14} width="70%" rounded="6px" className="mx-auto" />
              <Skeleton height={24} width="40%" rounded="6px" className="mx-auto" />
            </div>
          </div>
          <div className="relative aspect-square max-w-[260px] mx-auto">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} width="100%" height="100%" rounded="16px" className="aspect-square" />
              ))}
            </div>
          </div>
        </div>
        <span className="sr-only">Connecting to game room...</span>
      </motion.div>
    );
  }

  const isMyTurn = game.nextTurn === currentUser && !game.winner;
  const profileA = userA;
  const profileB = userB;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <div className="p-6 rounded-3xl border border-[var(--wood-oak)]/15" style={{ backgroundColor: "var(--fabric-cream)" }}>
        {/* Scoreboard display */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center w-28">
            <img src={profileA.avatar} alt={`${profileA.name.split(" ")[0]}'s avatar`} className="w-9 h-9 rounded-full mx-auto mb-1 object-cover border border-[var(--border-color)]" referrerPolicy="no-referrer" loading="lazy" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)] truncate">{profileA.name.split(" ")[0]} (Hearts)</p>
            <p className="text-2xl font-black text-[var(--primary)] font-serif">{game.scoreA}</p>
          </div>
          <div className="text-center flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1.5 rounded-full select-none block max-w-[130px] mx-auto truncate">
              {game.winner ? (game.winner === "draw" ? "Draw!" : "Victory! 🎉") : (isMyTurn ? "Your turn 🌸" : "Waiting...")}
            </span>
          </div>
          <div className="text-center w-28">
            <img src={profileB.avatar} alt={`${profileB.name.split(" ")[0]}'s avatar`} className="w-9 h-9 rounded-full mx-auto mb-1 object-cover border border-[var(--border-color)]" referrerPolicy="no-referrer" loading="lazy" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)] truncate">{profileB.name.split(" ")[0]} (Rings)</p>
            <p className="text-2xl font-black text-[var(--primary)] font-serif">{game.scoreB}</p>
          </div>
        </div>

        {/* Board Container with Artistic Brushstrokes */}
        <div className="relative aspect-square max-w-[260px] mx-auto p-4 bg-black/5 rounded-3xl border border-[var(--border-color)] shadow-inner">
          {/* Handdrawn Brushstroke Grid Divider Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none text-[var(--primary)]/15" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {/* Horizontal lines */}
            <path d="M5 33.5 C 30 31, 70 35, 95 33.5" />
            <path d="M5 66.5 C 25 68, 75 65, 95 66.5" />
            {/* Vertical lines */}
            <path d="M33.5 5 C 35 25, 31 75, 33.5 95" />
            <path d="M66.5 5 C 65 30, 68 70, 66.5 95" />
          </svg>

          <div className="grid grid-cols-3 gap-3 relative z-10 h-full">
            {game.board.map((cell, i) => (
              <motion.button
                key={i}
                id={`ttt-cell-${i}`}
                onClick={() => move(i)}
                disabled={!isMyTurn || !!cell || !!game.winner}
                whileTap={{ scale: 0.92 }}
                className="aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:scale-100 disabled:translate-y-0 disabled:cursor-not-allowed cursor-pointer bg-white/60 dark:bg-black/25 border border-[var(--border-color)] hover:bg-white/95 dark:hover:bg-black/40 shadow-xs"
              >
                {cell === "X" && (
                  <Heart className="w-8 h-8 text-[var(--primary)] fill-current animate-heartbeat" />
                )}
                {cell === "O" && (
                  <svg className="w-8 h-8 text-[var(--accent)] fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="7" />
                    <circle cx="12" cy="7" r="1.5" className="fill-current text-[var(--primary)]" />
                  </svg>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button
          id="ttt-reset-btn"
          onClick={reset}
          whileTap={{ scale: 0.96 }}
          className="w-full py-2.5 mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[var(--primary)] hover:bg-white/50 dark:hover:bg-black/25 rounded-xl border border-[var(--border-color)] transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New Round
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Would You Rather ─────────────────────────────────────────────────────────

const WYR_QUESTIONS = [
  ["Live without music 🎵", "Live without movies 🎬"],
  ["Always be 10 minutes early ⏰", "Always be 20 minutes late 😅"],
  ["Have the ability to fly ✈️", "Have the ability to be invisible 👻"],
  ["Only eat sweet food 🍰", "Only eat savory food 🍜"],
  ["Know the beginning of every story 📖", "Know the ending of every story 🔮"],
  ["Speak every language 🌍", "Play every instrument 🎹"],
  ["Be famous for something embarrassing 😳", "Be obscure but respected 🌟"],
  ["Live in the mountains ⛰️", "Live by the ocean 🌊"],
  ["Have a pause button for life ⏸️", "Have a rewind button for life ⏪"],
  ["Always have to sing your words 🎤", "Always have to dance when music plays 💃"],
];

function WouldYouRather({ onVote }: { onVote?: () => void }) {
  const { currentUser, userA, userB } = useCouple();
  const [qIdx, setQIdx] = useState(0);
  const [votes, setVotes] = useState<Record<string, Record<"user_a" | "user_b", number>>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
      unsub = onSnapshot(doc(db, "rooms", "wyr_room"), (d: any) => {
        if (d.exists()) {
          const data = d.data();
          if (data.qIdx !== undefined) setQIdx(data.qIdx);
          if (data.votes) setVotes(data.votes);
        } else {
          setDoc(doc(db, "rooms", "wyr_room"), { qIdx: 0, votes: {} }).catch(console.error);
        }
        setIsLoading(false);
      }, (err) => {
        console.error("[wyr room listener]", err);
        toast.error("Would You Rather sync lost. Check your connection.");
      });
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const vote = useCallback(async (option: 0 | 1) => {
    const key = `q${qIdx}`;
    const current = votes[key] || { user_a: -1, user_b: -1 };
    const updated = { ...votes, [key]: { ...current, [currentUser]: option } };
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "wyr_room"), { qIdx, votes: updated }, { merge: true });
      onVote?.();
    } catch (e) {
      console.error("[wyr vote]", e);
      toast.error("Failed to submit vote. Check your connection.");
    }
  }, [qIdx, votes, currentUser, onVote]);

  const nextQ = useCallback(async () => {
    const next = (qIdx + 1) % WYR_QUESTIONS.length;
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "wyr_room"), { qIdx: next, votes }, { merge: true });
    } catch (e) {
      console.error("[wyr next]", e);
      toast.error("Failed to load next question.");
    }
  }, [qIdx, votes]);

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status" aria-label="Loading Would You Rather">
        <div className="p-6 rounded-3xl border border-[var(--wood-oak)]/15 space-y-4" style={{ backgroundColor: "var(--fabric-cream)" }}>
          <div className="text-center space-y-2">
            <Skeleton height={12} width="40%" rounded="6px" className="mx-auto" />
            <Skeleton height={12} width="25%" rounded="6px" className="mx-auto" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton height={80} rounded="16px" className="flex-1" />
            <Skeleton height={80} rounded="16px" className="flex-1" />
          </div>
        </div>
        <span className="sr-only">Loading questions...</span>
      </motion.div>
    );
  }

  const q = WYR_QUESTIONS[qIdx];
  const myVote = votes[`q${qIdx}`]?.[currentUser];
  const partnerVote = votes[`q${qIdx}`]?.[currentUser === "user_a" ? "user_b" : "user_a"];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="p-6 rounded-3xl border border-[var(--wood-oak)]/15 space-y-4" style={{ backgroundColor: "var(--fabric-cream)" }}>
        <div className="text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono mb-1">Would You Rather...</p>
          <p className="text-xs text-[var(--text-muted)] font-mono">Question {qIdx + 1} of {WYR_QUESTIONS.length}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {q.map((option, i) => (
            <motion.button
              key={i}
              id={`wyr-option-${i}`}
              onClick={() => vote(i as 0 | 1)}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 p-4 rounded-2xl text-xs sm:text-sm font-bold text-center border-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 leading-snug cursor-pointer ${myVote === i
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                : "bg-white/50 dark:bg-black/25 border-[var(--border-color)] text-[var(--text-main)] hover:bg-white dark:hover:bg-black/40"
                }`}
            >
              {option}
            </motion.button>
          ))}
        </div>
        {myVote !== undefined && partnerVote !== undefined && (
          <div className="text-center text-xs text-[var(--text-muted)] bg-black/5 p-3 rounded-2xl border border-[var(--border-color)] leading-relaxed">
            <span className="font-bold text-[var(--text-main)]">{(currentUser === "user_a" ? userA : userB).name.split(" ")[0]}</span> chose &ldquo;{q[myVote]}&rdquo; <br />
            <span className="font-bold text-[var(--text-main)]">{(currentUser === "user_a" ? userB : userA).name.split(" ")[0]}</span> chose &ldquo;{q[partnerVote]}&rdquo;
          </div>
        )}
        <motion.button
          id="wyr-next-btn"
          onClick={nextQ}
          whileTap={{ scale: 0.96 }}
          className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-[var(--primary)] hover:opacity-85 cursor-pointer duration-200 hover:-translate-y-0.5"
        >
          Next Question <ChevronRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Spin the Dare ────────────────────────────────────────────────────────────

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

  // Sync with Firestore fallback
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
      unsub = onSnapshot(doc(db, "rooms", "spindare_room"), (d: any) => {
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
      }, (err) => {
        console.error("[spindare room listener]", err);
        toast.error("Spin the Dare sync lost. Check your connection.");
      });
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  const changeSelectedType = useCallback(async (type: "truth" | "dare") => {
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "spindare_room"), { selectedType: type, result: null }, { merge: true });
    } catch (e) {
      console.error("[spindare changeType]", e);
      toast.error("Failed to switch mode.");
    }
  }, []);

  const spin = useCallback(async () => {
    if (dbState.spinning) return;
    const items = dbState.selectedType === "truth" ? dbState.truths : dbState.dares;
    if (items.length === 0) return;

    const selectedIdx = Math.floor(Math.random() * items.length);
    const sliceSize = 360 / items.length;
    const targetAngle = 360 - (selectedIdx * sliceSize + sliceSize / 2);
    const finalRotation = dbState.rotation + 1440 + targetAngle;

    const db = await getDb();
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "rooms", "spindare_room"), {
      spinning: true,
      rotation: finalRotation,
      result: null
    }, { merge: true });

    setTimeout(async () => {
      try {
        await setDoc(doc(db, "rooms", "spindare_room"), {
          spinning: false,
          result: items[selectedIdx]
        }, { merge: true });
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
    const currentList = editorTab === "truth" ? dbState.truths : dbState.dares;
    if (currentList.length >= 20) return;
    const newList = [...currentList, text];

    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "spindare_room"), {
        [editorTab === "truth" ? "truths" : "dares"]: newList
      }, { merge: true });
      setNewItemText("");
    } catch (e) {
      console.error("[spindare addItem]", e);
      toast.error("Failed to add item.");
    }
  }, [newItemText, editorTab, dbState]);

  const removeItem = useCallback(async (idxToRemove: number) => {
    const currentList = editorTab === "truth" ? dbState.truths : dbState.dares;
    if (currentList.length <= 2) return;
    const newList = currentList.filter((_, idx) => idx !== idxToRemove);

    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "spindare_room"), {
        [editorTab === "truth" ? "truths" : "dares"]: newList
      }, { merge: true });
    } catch (e) {
      console.error("[spindare removeItem]", e);
      toast.error("Failed to remove item.");
    }
  }, [editorTab, dbState]);

  const items = dbState.selectedType === "truth" ? dbState.truths : dbState.dares;
  const colors = ["#E6C594", "#B35E6B", "#FAF6F0", "#8C4351", "#E8DCC4", "#D59E7C", "#2C1A1D"];

  if (spinLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status" aria-label="Loading Spin the Dare">
        <div className="p-6 rounded-3xl flex flex-col items-center gap-5 border border-[var(--wood-oak)]/15" style={{ backgroundColor: "var(--fabric-cream)" }}>
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="p-6 rounded-3xl flex flex-col items-center gap-5 border border-[var(--wood-oak)]/15" style={{ backgroundColor: "var(--fabric-cream)" }}>
        <div className="w-full flex items-center justify-between">
          <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <span>Spin the Dare Wheel 🎡</span>
          </h4>
          <button
            id="spindare-settings-btn"
            onClick={() => setShowEditor((prev) => !prev)}
            className={`p-2 rounded-xl border cursor-pointer transition-all ${showEditor
              ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
              : "bg-white/50 dark:bg-black/25 border-[var(--border-color)] text-[var(--text-main)] hover:bg-white dark:hover:bg-black/40"
              }`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Custom Wheel Item Editor */}
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
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${editorTab === "truth"
                      ? "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30"
                      : "bg-white/55 dark:bg-black/25 border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-white dark:hover:bg-black/40"
                      }`}
                  >
                    Truths ({dbState.truths.length}/20)
                  </button>
                  <button
                    id="editor-tab-dare"
                    onClick={() => setEditorTab("dare")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${editorTab === "dare"
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
                    disabled={(editorTab === "truth" ? dbState.truths : dbState.dares).length >= 20}
                    className="flex-1 text-xs px-3 py-2 bg-white/60 dark:bg-black/25 border border-[var(--border-color)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] disabled:opacity-60 transition-colors"
                  />
                  <button
                    id="add-item-btn"
                    onClick={addItem}
                    disabled={(editorTab === "truth" ? dbState.truths : dbState.dares).length >= 20 || !newItemText.trim()}
                    className="p-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-xs transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {(editorTab === "truth" ? dbState.truths : dbState.dares).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white/50 dark:bg-black/20 p-2 rounded-xl text-[11px] border border-[var(--border-color)]">
                      <span className="truncate flex-1 text-[var(--text-main)]">{item}</span>
                      <button
                        id={`remove-item-${idx}`}
                        onClick={() => removeItem(idx)}
                        disabled={(editorTab === "truth" ? dbState.truths : dbState.dares).length <= 2}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Wheel Mode */}
        <div className="flex bg-white/60 dark:bg-black/20 p-1 rounded-2xl border border-[var(--border-color)] w-full max-w-[200px] sm:max-w-[208px] gap-1">
          <button
            id="wheel-mode-truth"
            onClick={() => changeSelectedType("truth")}
            disabled={dbState.spinning}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${dbState.selectedType === "truth" ? "bg-[var(--primary)] text-white shadow-xs" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            Truth
          </button>
          <button
            id="wheel-mode-dare"
            onClick={() => changeSelectedType("dare")}
            disabled={dbState.spinning}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${dbState.selectedType === "dare" ? "bg-[var(--primary)] text-white shadow-xs" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            Dare
          </button>
        </div>

        {/* Wheel Frame */}
        <div className="relative w-44 sm:w-56 h-44 sm:h-56 flex items-center justify-center bg-amber-950 border-[6px] sm:border-[10px] border-amber-900 rounded-full p-2 sm:p-2.5 shadow-2xl">
          <div className="absolute inset-1.5 sm:inset-2 border-2 border-white/10 rounded-full pointer-events-none z-10" />

          {/* Spinning Wheel */}
          <div
            className="w-full h-full relative rounded-full overflow-hidden"
            style={{
              transition: dbState.spinning ? "transform 3.5s cubic-bezier(0.15, 0.75, 0.1, 1)" : "none",
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

          {/* Golden Brass Needle Pointer */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full text-amber-500 drop-shadow" viewBox="0 0 24 24" fill="currentColor">
              {/* Ujung tajam sekarang berada di bawah (Y=22) */}
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
                {dbState.selectedType === "truth" ? "Truth Question" : "Dare Challenge"}
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

// ─── Sketch Canvas ────────────────────────────────────────────────────────────

interface StrokePoint {
  x: number;
  y: number;
  color: string;
  size: number;
  type: "start" | "draw" | "end"
}

const COLORS = ["#000000", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff", "#6b7280"];
const BRUSH_SIZES = [2, 4, 8, 14];

function SketchCanvas({ onSave }: { onSave?: () => void }) {
  const { currentUser, cloudinaryCloudName, cloudinaryUploadPreset, addMemory, memories, userA, userB } = useCouple();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const strokeBufferRef = useRef<StrokePoint[]>([]);

  const [activeSessionId, setActiveSessionId] = useState<string>("init");
  const [isEraser, setIsEraser] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scrollLocked, setScrollLocked] = useState(true);

  const [strokesDocs, setStrokesDocs] = useState<any[]>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<any[]>([]);
  const [savedSketches, setSavedSketches] = useState<{ id: string; url: string; createdAt: string; createdBy: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Physical touch scroll-lock to prevent page scrolling on mobile devices while drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (scrollLocked) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    // Use passive: false to allow calling e.preventDefault()
    canvas.addEventListener("touchstart", preventDefaultTouch, { passive: false });
    canvas.addEventListener("touchmove", preventDefaultTouch, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", preventDefaultTouch);
      canvas.removeEventListener("touchmove", preventDefaultTouch);
    };
  }, [scrollLocked]);

  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const lastSessionIdRef = useRef<string | null>(null);
  const lastStrokesRef = useRef<any[]>([]);

  // Toggle bottom navbar visibility on preview modal
  useEffect(() => {
    if (previewUrl) {
      window.dispatchEvent(new CustomEvent("hideNavbar", { detail: true }));
    } else {
      window.dispatchEvent(new CustomEvent("hideNavbar", { detail: false }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent("hideNavbar", { detail: false }));
    };
  }, [previewUrl]);

  // Sync Room strokes live
  useEffect(() => {
    isInitialLoadRef.current = true;
    lastSessionIdRef.current = null;
    lastStrokesRef.current = [];
    let unsub: (() => void) | null = null;

    (async () => {
      const db = await getDb();
      const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
      unsub = onSnapshot(doc(db, "rooms", "sketch_room"), (d: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (!d.exists()) {
          setDoc(doc(db, "rooms", "sketch_room"), { sessionId: "init", strokes: [] }).catch(console.error);
          return;
        }

        const data = d.data();
        const currentSessionId = data.sessionId || "init";
        const remoteStrokes = data.strokes || [];

        const sortedStrokes = [...remoteStrokes].sort((a: any, b: any) => (a.ts || 0) - (b.ts || 0));

        if (lastSessionIdRef.current !== currentSessionId) {
          lastSessionIdRef.current = currentSessionId;
          setActiveSessionId(currentSessionId);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          sortedStrokes.forEach((stroke: any) => {
            drawPoints(ctx, stroke.points || [], stroke.color, stroke.size);
          });

          lastStrokesRef.current = sortedStrokes;
          setStrokesDocs(sortedStrokes);
          isInitialLoadRef.current = false;
          return;
        }

        const prevStrokes = lastStrokesRef.current;
        lastStrokesRef.current = sortedStrokes;
        setStrokesDocs(sortedStrokes);

        if (sortedStrokes.length === 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (sortedStrokes.length < prevStrokes.length) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          sortedStrokes.forEach((stroke: any) => {
            drawPoints(ctx, stroke.points || [], stroke.color, stroke.size);
          });
        } else {
          const newStrokes = sortedStrokes.slice(prevStrokes.length);
          newStrokes.forEach((stroke: any) => {
            if (stroke.userId !== currentUser) {
              drawPoints(ctx, stroke.points || [], stroke.color, stroke.size);
            }
          });
        }
        isInitialLoadRef.current = false;
      }, (err) => {
        console.error("[sketch room listener]", err);
        toast.error("Sketch canvas sync lost. Check your connection.");
      });
    })();

    return () => { if (unsub) unsub(); };
  }, [currentUser]);

  // Listen to saved drawings gallery
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      const db = await getDb();
      if (cancelled) return;

      if ((db as any).isFallback) {
        const syncSavedSketches = () => {
          const listStr = localStorage.getItem("fs_fallback_saved_sketches") || "[]";
          try {
            const list = JSON.parse(listStr);
            list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setSavedSketches(list);
          } catch (e) {
            setSavedSketches([]);
          }
        };

        syncSavedSketches();

        const handleStorage = (e: StorageEvent) => {
          if (e.key === "fs_fallback_saved_sketches") syncSavedSketches();
        };
        window.addEventListener("storage", handleStorage);
        window.addEventListener("fs_fallback_saved_sketches_updated", syncSavedSketches);

        const cleanup = () => {
          window.removeEventListener("storage", handleStorage);
          window.removeEventListener("fs_fallback_saved_sketches_updated", syncSavedSketches);
        };
        unsub = cleanup;
        return;
      }

      const { query: q, collection, orderBy: ob, onSnapshot: rawOnSnapshot } = await import("firebase/firestore");
      const queryRef = q(collection(db, "saved_sketches"), ob("createdAt", "desc"));
      unsub = rawOnSnapshot(queryRef, (snap: any) => {
        setSavedSketches(snap.docs.map((d: any) => ({
          id: d.id,
          url: d.data().url,
          createdAt: d.data().createdAt,
          createdBy: d.data().createdBy,
        })));
      }, (err) => {
        console.error("[saved sketches listener]", err);
        toast.error("Failed to sync sketch gallery.");
      });
    })();

    return () => {
      cancelled = true;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const drawPoints = (ctx: CanvasRenderingContext2D, points: any[], strokeColor?: string, strokeSize?: number) => {
    if (!points || points.length === 0) return;

    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;
    const prevLineCap = ctx.lineCap;
    const prevLineJoin = ctx.lineJoin;
    const prevFillStyle = ctx.fillStyle;

    let lastX = 0;
    let lastY = 0;

    points.forEach((p) => {
      const type = p.t || p.type;
      const color = p.color || strokeColor || "#000000";
      const size = p.size || strokeSize || 4;

      if (type === "start" || type === "s") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        lastX = p.x;
        lastY = p.y;
      } else if (type === "draw" || type === "d") {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        lastX = p.x;
        lastY = p.y;
      }
    });

    ctx.strokeStyle = prevStrokeStyle;
    ctx.lineWidth = prevLineWidth;
    ctx.lineCap = prevLineCap;
    ctx.lineJoin = prevLineJoin;
    ctx.fillStyle = prevFillStyle;
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: lastXRef.current, y: lastYRef.current };
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  // Enforce Max points
  const MAX_POINTS = 30000;
  const totalPoints = strokesDocs.reduce((acc, s) => acc + (s.points?.length || 0), 0);
  const isLimitReached = totalPoints >= MAX_POINTS;

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (isLimitReached) {
      toast.error("Canvas points limit reached! Clear canvas or undo some strokes to draw more.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const { x, y } = getPos(e, canvas);
    lastXRef.current = x;
    lastYRef.current = y;

    setUndoneStrokes([]);

    const activeColor = isEraser ? "#ffffff" : color;

    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = activeColor;
    ctx.fill();

    strokeBufferRef.current.push({ x: Math.round(x), y: Math.round(y), t: "s" } as any);
  }, [color, brushSize, isEraser, isLimitReached]);

  const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!isDrawingRef.current || isLimitReached) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getPos(e, canvas);
    const ctx = canvas.getContext("2d")!;

    const activeColor = isEraser ? "#ffffff" : color;

    ctx.beginPath();
    ctx.moveTo(lastXRef.current, lastYRef.current);
    ctx.lineTo(x, y);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastXRef.current = x;
    lastYRef.current = y;

    strokeBufferRef.current.push({ x: Math.round(x), y: Math.round(y), t: "d" } as any);
  }, [color, brushSize, isEraser, isLimitReached]);

  const onPointerUp = useCallback(async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const activeColor = isEraser ? "#ffffff" : color;
    strokeBufferRef.current.push({ x: 0, y: 0, t: "e" } as any);

    const points = strokeBufferRef.current.splice(0);
    if (points.length === 0) return;
    try {
      const db = await getDb();
      const { doc } = await import("firebase/firestore");
      await safeUpdateDoc(doc(db, "rooms", "sketch_room"), {
        strokes: customArrayUnion({
          userId: currentUser,
          color: activeColor,
          size: brushSize,
          points,
          ts: Date.now(),
        })
      });
    } catch (e) {
      console.error("[sketch save stroke]", e);
    }
  }, [color, brushSize, isEraser, currentUser]);

  const clearCanvas = useCallback(async () => {
    const newSessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "sketch_room"), { sessionId: newSessionId, strokes: [] });
      setUndoneStrokes([]);
      setStrokesDocs([]);
    } catch (e) { console.error("[clear sketch]", e); }
  }, []);

  const handleUndo = useCallback(async () => {
    const myStrokes = strokesDocs.filter((s) => s.userId === currentUser);
    if (myStrokes.length === 0) return;
    const lastStroke = myStrokes[myStrokes.length - 1];

    setUndoneStrokes((prev) => [...prev, lastStroke]);

    const nextStrokes = strokesDocs.filter((s) => s !== lastStroke);
    setStrokesDocs(nextStrokes); // Optimistic Update
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "sketch_room"), { strokes: nextStrokes }, { merge: true });
    } catch (e) { console.error("[undo error]", e); }
  }, [strokesDocs, currentUser]);

  const handleRedo = useCallback(async () => {
    if (undoneStrokes.length === 0) return;
    const toRestore = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes((prev) => prev.slice(0, -1));

    const nextStrokes = [...strokesDocs, toRestore];
    setStrokesDocs(nextStrokes); // Optimistic Update
    try {
      const db = await getDb();
      const { doc } = await import("firebase/firestore");
      await safeUpdateDoc(doc(db, "rooms", "sketch_room"), {
        strokes: customArrayUnion(toRestore)
      });
    } catch (e) { console.error("[redo error]", e); }
  }, [undoneStrokes, strokesDocs]);

  const saveDrawing = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cloudName = cloudinaryCloudName || (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME || "";
    const uploadPreset = cloudinaryUploadPreset || (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

    setSaving(true);
    setSaveError("");

    const db = await getDb();

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setSaving(false);
        setSaveError("Failed to generate image.");
        return;
      }
      try {
        const url = await uploadToCloudinary(blob, `sketch-${Date.now()}.png`, cloudName, uploadPreset);

        const newDoc = {
          url,
          createdAt: new Date().toISOString(),
          createdBy: currentUser,
        };

        if ((db as any).isFallback) {
          const listStr = localStorage.getItem("fs_fallback_saved_sketches") || "[]";
          let list = [];
          try { list = JSON.parse(listStr); } catch (e) { }
          const item = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, ...newDoc };
          list.push(item);
          localStorage.setItem("fs_fallback_saved_sketches", JSON.stringify(list));
          window.dispatchEvent(new CustomEvent("fs_fallback_saved_sketches_updated"));
        } else {
          const { collection, addDoc } = await import("firebase/firestore");
          await addDoc(collection(db, "saved_sketches"), newDoc);
        }

        setSaving(false);
        onSave?.();
      } catch (err: any) {
        console.error("Save sketch error:", err);
        setSaveError(err.message || "Failed to upload drawing.");
        setSaving(false);
      }
    }, "image/png");
  }, [cloudinaryCloudName, cloudinaryUploadPreset, currentUser, onSave]);

  const deleteSavedSketch = useCallback(async (id: string) => {
    try {
      const db = await getDb();
      if ((db as any).isFallback) {
        const listStr = localStorage.getItem("fs_fallback_saved_sketches") || "[]";
        let list = [];
        try { list = JSON.parse(listStr); } catch (e) { }
        list = list.filter((item: any) => item.id !== id);
        localStorage.setItem("fs_fallback_saved_sketches", JSON.stringify(list));
        window.dispatchEvent(new CustomEvent("fs_fallback_saved_sketches_updated"));
      } else {
        const { doc: rawDoc, deleteDoc: rawDeleteDoc } = await import("firebase/firestore");
        await rawDeleteDoc(rawDoc(db, "saved_sketches", id));
      }
    } catch (e) { console.error("[delete saved sketch]", e); }
  }, []);

  const saveToTimeline = useCallback((url: string) => {
    const creatorName = currentUser === "user_a" ? userA.name : userB.name;
    const partnerName = currentUser === "user_a" ? userB.name : userA.name;

    addMemory({
      type: "drawing",
      title: "Our Sketch Masterpiece 🎨",
      description: `A beautiful drawing sketched together in the play room by ${creatorName} and ${partnerName}!`,
      imageUrl: url,
      date: new Date().toISOString(),
      creatorId: currentUser,
    });

    toast.success("Saved to Memories timeline! ✨");
  }, [currentUser, userA, userB, addMemory]);

  const handleSelectColor = (c: string) => {
    setColor(c);
    setIsEraser(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <WashiTapeDivider color="coral" label="Sketch" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[var(--text-main)]">Collaborative Sketch Studio</h3>
        <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all ${isLimitReached ? "bg-red-50 text-red-500 border-red-200 animate-pulse" : "bg-white/40 text-[var(--text-muted)] border-[var(--border-color)]"}`}>
          Detail: {totalPoints.toLocaleString()} / {MAX_POINTS.toLocaleString()} {isLimitReached && "⚠️ Limit Reached"}
        </div>
      </div>

      {/* Toolbar controls */}
      <div className="p-3 rounded-2xl flex flex-wrap items-center gap-3 border border-[var(--wood-oak)]/15" style={{ backgroundColor: "var(--fabric-cream)" }}>
        {/* Draw vs Erase toggle */}
        <div className="flex gap-1.5 border-r border-[var(--border-color)] pr-3">
          <button
            onClick={() => setIsEraser(false)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${!isEraser
              ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
              : "bg-white/50 dark:bg-black/25 border-[var(--border-color)] text-[var(--text-main)] hover:bg-white dark:hover:bg-black/40"
              }`}
            title="Pen Tool"
          >
            <Pen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsEraser(true)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${isEraser
              ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
              : "bg-white/50 dark:bg-black/25 border-[var(--border-color)] text-[var(--text-main)] hover:bg-white dark:hover:bg-black/40"
              }`}
            title="Eraser Tool"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        {/* Dynamic color palette options */}
        <div className="flex gap-1.5 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              id={`sketch-color-${c.replace("#", "")}`}
              onClick={() => handleSelectColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${(!isEraser && color === c)
                ? "border-[var(--primary)] scale-110 shadow-sm"
                : "border-white/40"
                }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Brush sizes weight selection */}
        <div className="flex gap-2 items-center">
          <span className="text-[9px] uppercase font-bold text-[var(--text-muted)]">Weight:</span>
          {BRUSH_SIZES.map((s) => (
            <button
              key={s}
              id={`sketch-size-${s}`}
              onClick={() => setBrushSize(s)}
              className={`rounded-full transition-all flex items-center justify-center cursor-pointer ${brushSize === s ? "bg-[var(--primary)]" : "bg-neutral-200 hover:bg-neutral-300"
                }`}
              style={{ width: `${s + 12}px`, height: `${s + 12}px` }}
            >
              <div
                className="rounded-full bg-current"
                style={{
                  width: `${s}px`,
                  height: `${s}px`,
                  backgroundColor: brushSize === s ? "white" : "var(--text-main)"
                }}
              />
            </button>
          ))}
        </div>

        {/* Undo/Redo/Save Action row */}
        <div className="flex gap-2 items-center sm:ml-auto w-full sm:w-auto justify-end">
          <button
            id="sketch-scroll-lock-btn"
            onClick={() => {
              setScrollLocked(!scrollLocked);
              toast.success(!scrollLocked ? "Scroll locked! 🔒 Drawing focus engaged." : "Scroll unlocked! 🔓");
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
              scrollLocked 
                ? "border-amber-200 text-amber-800 bg-amber-50 dark:bg-amber-950/20" 
                : "border-[var(--border-color)] text-[var(--text-muted)] bg-white/50"
            }`}
            title={scrollLocked ? "Disable Drawing Scroll-Lock" : "Enable Drawing Scroll-Lock"}
          >
            {scrollLocked ? <Lock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> : <Unlock className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{scrollLocked ? "Scroll Locked" : "Lock Scroll"}</span>
          </button>
          <button
            id="sketch-undo-btn"
            onClick={handleUndo}
            disabled={strokesDocs.filter((s) => s.userId === currentUser).length === 0}
            className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-main)] bg-white/50 dark:bg-black/25 hover:bg-white dark:hover:bg-black/40 disabled:opacity-35 transition-all cursor-pointer"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            id="sketch-redo-btn"
            onClick={handleRedo}
            disabled={undoneStrokes.length === 0}
            className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-main)] bg-white/50 dark:bg-black/25 hover:bg-white dark:hover:bg-black/40 disabled:opacity-35 transition-all cursor-pointer"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
          <button
            id="sketch-save-btn"
            onClick={saveDrawing}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-xs cursor-pointer duration-200 hover:-translate-y-0.5"
          >
            {saving ? "Saving..." : "Save Artwork"}
          </button>
          <button
            id="sketch-clear-btn"
            onClick={clearCanvas}
            className="p-1.5 rounded-xl border border-red-200 text-red-500 bg-white/50 dark:bg-black/25 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all font-semibold cursor-pointer duration-200 hover:-translate-y-0.5"
            title="Clear Canvas"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {saveError && <p className="text-[10px] text-red-500">{saveError}</p>}

      {/* Studio Art Easel Frame (With border-0 on canvas container!) */}
      <div className="relative pt-4 pb-6 px-4 bg-amber-950/5 rounded-3xl border border-amber-900/10">
        {/* Top wood bar */}
        <div className="w-16 h-2.5 bg-amber-900 mx-auto rounded-t shadow-xs" />

        {/* Canvas (CLEAN NO-BORDER DESIGN) */}
        <div className="rounded-2xl overflow-hidden border-0 bg-white shadow-xl" style={{ touchAction: "none" }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            className="w-full h-auto block"
            onMouseDown={onPointerDown}
            onMouseMove={onPointerMove}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
            onTouchStart={onPointerDown}
            onTouchMove={onPointerMove}
            onTouchEnd={onPointerUp}
            style={{ cursor: isEraser ? "cell" : "crosshair", touchAction: "none" }}
          />
        </div>

        {/* Bottom wood tray shelf */}
        <div className="w-[105%] -ml-[2.5%] h-3.5 bg-amber-950 rounded shadow-xs mt-1.5 relative z-10" />

        {/* Easel Leg Stands */}
        <div className="flex justify-between px-8 mt-1 relative z-0">
          <div className="w-3.5 h-8 bg-amber-900 rounded-b shadow-xs" />
          <div className="w-3.5 h-8 bg-amber-900 rounded-b shadow-xs" />
        </div>
      </div>
      <p className="text-[10px] text-center text-[var(--text-muted)] font-mono">Both players sketch live together in real-time ✨</p>

      {/* Shared Gallery */}
      <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <span>Sketch Gallery 🎨</span>
          <span className="text-[10px] font-mono font-normal">({savedSketches.length} saved)</span>
        </h4>

        {savedSketches.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic py-2">No drawings saved in the gallery yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {savedSketches.map((sketch) => {
              const existingMemory = memories.find((m) => m.imageUrl === sketch.url);
              return (
                <div key={sketch.id} className="group relative rounded-2xl overflow-hidden border border-[var(--border-color)] bg-white/30 dark:bg-black/10 p-2 shadow-xs hover:shadow-md transition-all">
                  <div
                    onClick={() => setPreviewUrl(sketch.url)}
                    className="aspect-[4/3] rounded-xl overflow-hidden bg-white dark:bg-black/20 border border-[var(--border-color)]/30 relative cursor-zoom-in group-hover:opacity-95 transition-opacity"
                  >
                    <img src={sketch.url} alt="Saved sketch" className="w-full h-full object-contain" loading="lazy" />
                  </div>

                  {/* Actions */}
                  <div className="mt-2 flex gap-1 justify-between">
                    <a
                      href={sketch.url}
                      download={`sketch-${sketch.id}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 bg-[var(--card-bg)] hover:bg-[var(--card-bg-solid)] rounded-lg text-[var(--text-main)] transition-all cursor-pointer hover:-translate-y-0.5 border border-[var(--border-color)]"
                      title="Download sketch"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>

                    {/* Save to memories timeline toggle */}
                    <button
                      onClick={() => {
                        saveToTimeline(sketch.url);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer hover:-translate-y-0.5 ${existingMemory
                        ? "bg-red-50 text-red-500 hover:bg-red-100 border border-red-200/60"
                        : "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white border border-transparent"
                        }`}
                    >
                      <Heart className={`w-3 h-3 ${existingMemory ? "fill-current animate-heartbeat" : ""}`} />
                      <span>{existingMemory ? "Saved" : "Timeline"}</span>
                    </button>

                    <button
                      onClick={() => deleteSavedSketch(sketch.id)}
                      className="p-1 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-all cursor-pointer hover:-translate-y-0.5 border border-transparent"
                      title="Delete sketch"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal Pop-up view */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewUrl(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Sketch preview"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setPreviewUrl(null);
              }
              if (e.key === 'Tab') {
                const modal = e.currentTarget;
                const focusable = modal.querySelectorAll<HTMLElement>(
                  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) {
                  e.preventDefault();
                  return;
                }
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                  if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                  }
                } else {
                  if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                  }
                }
              }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full bg-[var(--card-bg-solid)] text-[var(--text-main)] rounded-3xl overflow-hidden p-5 shadow-2xl flex flex-col items-center cursor-default text-left"
            >
              {/* Close button */}
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-4 right-4 bg-[var(--border-color)]/30 hover:bg-[var(--border-color)]/50 text-[var(--text-main)] w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer font-bold text-sm"
              >
                ✕
              </button>

              <div className="w-full aspect-[4/3] bg-[var(--bg-app)] rounded-2xl overflow-hidden flex items-center justify-center border border-[var(--border-color)]/40 mt-8">
                <img src={previewUrl} alt="Sketch Preview" className="max-w-full max-h-full object-contain" loading="lazy" />
              </div>

              <div className="mt-4 flex gap-3 w-full px-2 justify-end">
                <a
                  href={previewUrl}
                  download="sketch-full.png"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-200 cursor-pointer duration-200 hover:-translate-y-0.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>

                <button
                  onClick={() => {
                    saveToTimeline(previewUrl);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl transition-all cursor-pointer duration-200 hover:-translate-y-0.5 shadow-xs"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" /> Save to Memories
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
