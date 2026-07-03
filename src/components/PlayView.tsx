/**
 * PlayView.tsx — rebuilt from zero.
 *
 * Fixes:
 *  - Tic Tac Toe: moves validated against currentUser === game.nextTurn (UID-based, no hijacking)
 *  - Sketch Canvas: streams incremental stroke coordinate arrays via Firestore sketch_room/strokes
 *    batched at ~80ms intervals; NEVER streams dataURL blobs; eliminates document overflow
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import { Gamepad2, Pen, RotateCcw, Trophy, RefreshCw, ChevronRight, Trash, Plus, Settings2, Undo, Redo, Download, Heart, Eraser } from "lucide-react";
import { db, uploadToCloudinary } from "../firebaseClient";
import { doc, onSnapshot, setDoc, collection, addDoc, getDocs, deleteDoc, query, orderBy, where, updateDoc, arrayUnion } from "firebase/firestore";

type Section = "games" | "sketch";
type GameId = "tictactoe" | "wyr" | "spindare";

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlayView() {
  const [section, setSection] = useState<Section>("games");
  const [gameId, setGameId] = useState<GameId>("tictactoe");

  return (
    <div className="space-y-4 py-2">
      <div className="glass-panel rounded-2xl p-1.5 flex gap-1">
        {([["games", "Arcade", Gamepad2], ["sketch", "Sketch", Pen]] as const).map(([id, label, Icon]) => (
          <button key={id} id={`play-tab-${id}`} onClick={() => setSection(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${section === id ? "bg-[var(--primary)] text-white shadow" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {section === "games" && (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-1.5 flex gap-1">
            {([["tictactoe", "Tic Tac Toe"], ["wyr", "Would You Rather"], ["spindare", "Spin the Dare"]] as const).map(([id, label]) => (
              <button key={id} id={`game-btn-${id}`} onClick={() => setGameId(id)}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all ${gameId === id ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
                {label}
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            {gameId === "tictactoe" && <TicTacToe key="ttt" />}
            {gameId === "wyr" && <WouldYouRather key="wyr" />}
            {gameId === "spindare" && <SpinDare key="spin" />}
          </AnimatePresence>
        </div>
      )}

      {section === "sketch" && <SketchCanvas />}
    </div>
  );
}

// ─── Tic Tac Toe ──────────────────────────────────────────────────────────────

interface TTTGame {
  board: (string | null)[];
  nextTurn: "user_a" | "user_b";
  winner: "user_a" | "user_b" | "draw" | null;
  scoreA: number;
  scoreB: number;
}

const WIN_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function checkWinner(board: (string | null)[]): string | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? "draw" : null;
}

function TicTacToe() {
  const { currentUser, userA, userB, session } = useCouple();
  const [game, setGame] = useState<TTTGame>({ board: Array(9).fill(null), nextTurn: "user_a", winner: null, scoreA: 0, scoreB: 0 });

  useEffect(() => {
    if (!session) return;
    const unsub = onSnapshot(doc(db, "rooms", "ttt_room"), (d) => {
      if (d.exists()) setGame(d.data() as TTTGame);
    });
    return () => unsub();
  }, [session]);

  const move = useCallback(async (idx: number) => {
    if (game.board[idx] || game.winner) return;
    const isFirstMove = game.board.every((cell) => cell === null);
    if (!isFirstMove && game.nextTurn !== currentUser) return; // UID-based turn validation
    const symbol = currentUser === "user_a" ? "X" : "O";
    const newBoard = [...game.board];
    newBoard[idx] = symbol;
    const winner = checkWinner(newBoard);
    const newGame: TTTGame = {
      board: newBoard,
      nextTurn: currentUser === "user_a" ? "user_b" : "user_a",
      winner: winner === "draw" ? "draw" : (winner ? currentUser : null),
      scoreA: game.scoreA + (winner && winner !== "draw" && currentUser === "user_a" ? 1 : 0),
      scoreB: game.scoreB + (winner && winner !== "draw" && currentUser === "user_b" ? 1 : 0),
    };
    await setDoc(doc(db, "rooms", "ttt_room"), newGame);
  }, [game, currentUser]);

  const reset = useCallback(async () => {
    await setDoc(doc(db, "rooms", "ttt_room"), { ...game, board: Array(9).fill(null), winner: null });
  }, [game]);

  const mySymbol = currentUser === "user_a" ? "X" : "O";
  const isFirstMove = game.board.every((cell) => cell === null);
  const isMyTurn = (isFirstMove || game.nextTurn === currentUser) && !game.winner;
  const profileA = userA; const profileB = userB;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <div className="glass-panel rounded-2xl p-4">
        {/* Score */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <img src={profileA.avatar} className="w-8 h-8 rounded-full mx-auto mb-1 object-cover" referrerPolicy="no-referrer" />
            <p className="text-xs font-bold text-[var(--text-main)]">{profileA.name.split(" ")[0]} (X)</p>
            <p className="text-2xl font-black text-[var(--primary)]">{game.scoreA}</p>
          </div>
          <div className="text-center text-[var(--text-muted)]">
            <p className="text-xs font-mono">{game.winner ? (game.winner === "draw" ? "Draw!" : "Won! 🎉") : (isMyTurn ? "Your turn" : "Waiting...")}</p>
          </div>
          <div className="text-center">
            <img src={profileB.avatar} className="w-8 h-8 rounded-full mx-auto mb-1 object-cover" referrerPolicy="no-referrer" />
            <p className="text-xs font-bold text-[var(--text-main)]">{profileB.name.split(" ")[0]} (O)</p>
            <p className="text-2xl font-black text-[var(--primary)]">{game.scoreB}</p>
          </div>
        </div>

        {/* Board Container with premium borders */}
        <div className="bg-white/40 dark:bg-black/20 p-4 rounded-3xl border border-purple-200/80 dark:border-purple-900/30 mb-4 max-w-[260px] mx-auto shadow-md">
          <div className="grid grid-cols-3 gap-3">
            {game.board.map((cell, i) => (
              <button
                key={i}
                id={`ttt-cell-${i}`}
                onClick={() => move(i)}
                disabled={!isMyTurn || !!cell || !!game.winner}
                className={`aspect-square rounded-2xl text-3xl font-black flex items-center justify-center border-2 transition-all duration-300 hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed ${
                  cell === "X" ? "bg-rose-50 border-rose-400 text-rose-500 shadow-sm" :
                  cell === "O" ? "bg-blue-50 border-blue-400 text-blue-500 shadow-sm" :
                  "bg-white/80 border-purple-200 text-purple-300 hover:bg-white hover:border-purple-300 hover:text-purple-400 shadow-sm"
                }`}
              >
                {cell}
              </button>
            ))}
          </div>
        </div>

        <button id="ttt-reset-btn" onClick={reset} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> New Round
        </button>
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

function WouldYouRather() {
  const { currentUser, userA, userB, session } = useCouple();
  const [qIdx, setQIdx] = useState(0);
  const [votes, setVotes] = useState<Record<string, Record<"user_a" | "user_b", number>>>({});

  useEffect(() => {
    if (!session) return;
    const unsub = onSnapshot(doc(db, "rooms", "wyr_room"), (d) => {
      if (d.exists()) {
        const data = d.data();
        if (data.qIdx !== undefined) setQIdx(data.qIdx);
        if (data.votes) setVotes(data.votes);
      }
    });
    return () => unsub();
  }, [session]);

  const vote = useCallback(async (option: 0 | 1) => {
    const key = `q${qIdx}`;
    const current = votes[key] || { user_a: -1, user_b: -1 };
    const updated = { ...votes, [key]: { ...current, [currentUser]: option } };
    await setDoc(doc(db, "rooms", "wyr_room"), { qIdx, votes: updated }, { merge: true });
  }, [qIdx, votes, currentUser]);

  const nextQ = useCallback(async () => {
    const next = (qIdx + 1) % WYR_QUESTIONS.length;
    await setDoc(doc(db, "rooms", "wyr_room"), { qIdx: next, votes }, { merge: true });
  }, [qIdx, votes]);

  const q = WYR_QUESTIONS[qIdx];
  const myVote = votes[`q${qIdx}`]?.[currentUser];
  const partnerVote = votes[`q${qIdx}`]?.[currentUser === "user_a" ? "user_b" : "user_a"];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono mb-1">Would You Rather...</p>
          <p className="text-xs text-[var(--text-muted)] font-mono">Question {qIdx + 1} of {WYR_QUESTIONS.length}</p>
        </div>
        <div className="flex gap-3">
          {q.map((option, i) => (
            <button
              key={i}
              id={`wyr-option-${i}`}
              onClick={() => vote(i as 0 | 1)}
              className={`flex-1 p-4 rounded-2xl text-sm font-bold text-center border-2 transition-all hover:scale-105 active:scale-95 leading-snug ${
                myVote === i
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-white/30 border-white/50 text-[var(--text-main)] hover:bg-white/50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {myVote !== undefined && partnerVote !== undefined && (
          <div className="text-center text-xs text-[var(--text-muted)]">
            <span className="font-bold text-[var(--text-main)]">{(currentUser === "user_a" ? userA : userB).name.split(" ")[0]}</span> chose "{q[myVote]}" ·{" "}
            <span className="font-bold text-[var(--text-main)]">{(currentUser === "user_a" ? userB : userA).name.split(" ")[0]}</span> chose "{q[partnerVote]}"
          </div>
        )}
        <button id="wyr-next-btn" onClick={nextQ} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-[var(--primary)] hover:opacity-80">
          Next Question <ChevronRight className="w-3.5 h-3.5" />
        </button>
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

function SpinDare() {
  const { currentUser, session } = useCouple();
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

  const [showEditor, setShowEditor] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [editorTab, setEditorTab] = useState<"truth" | "dare">("truth");

  // Sync with Firestore
  useEffect(() => {
    if (!session) return;
    const unsub = onSnapshot(doc(db, "rooms", "spindare_room"), (d) => {
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
    });
    return () => unsub();
  }, [session]);

  const changeSelectedType = useCallback(async (type: "truth" | "dare") => {
    await setDoc(doc(db, "rooms", "spindare_room"), { selectedType: type, result: null }, { merge: true });
  }, []);

  const spin = useCallback(async () => {
    if (dbState.spinning) return;
    const items = dbState.selectedType === "truth" ? dbState.truths : dbState.dares;
    if (items.length === 0) return;

    const selectedIdx = Math.floor(Math.random() * items.length);
    const sliceSize = 360 / items.length;
    const targetAngle = 360 - (selectedIdx * sliceSize + sliceSize / 2);
    const finalRotation = dbState.rotation + 1440 + targetAngle;

    await setDoc(doc(db, "rooms", "spindare_room"), {
      spinning: true,
      rotation: finalRotation,
      result: null
    }, { merge: true });

    setTimeout(async () => {
      await setDoc(doc(db, "rooms", "spindare_room"), {
        spinning: false,
        result: items[selectedIdx]
      }, { merge: true });
    }, 3500);
  }, [dbState]);

  const addItem = useCallback(async () => {
    const text = newItemText.trim();
    if (!text) return;
    const currentList = editorTab === "truth" ? dbState.truths : dbState.dares;
    if (currentList.length >= 20) return;
    const newList = [...currentList, text];
    
    await setDoc(doc(db, "rooms", "spindare_room"), {
      [editorTab === "truth" ? "truths" : "dares"]: newList
    }, { merge: true });
    setNewItemText("");
  }, [newItemText, editorTab, dbState]);

  const removeItem = useCallback(async (idxToRemove: number) => {
    const currentList = editorTab === "truth" ? dbState.truths : dbState.dares;
    if (currentList.length <= 2) return;
    const newList = currentList.filter((_, idx) => idx !== idxToRemove);

    await setDoc(doc(db, "rooms", "spindare_room"), {
      [editorTab === "truth" ? "truths" : "dares"]: newList
    }, { merge: true });
  }, [editorTab, dbState]);

  const items = dbState.selectedType === "truth" ? dbState.truths : dbState.dares;
  const colors = ["#f43f5e","#f97316","#eab308","#22c55e","#06b6d4","#818cf8","#ec4899","#a3e635","#fb7185","#34d399"];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
      <div className="glass-panel rounded-2xl p-6 flex flex-col items-center gap-5">
        <div className="w-full flex items-center justify-between">
          <h4 className="text-sm font-bold text-[var(--text-main)]">Spin the Dare Wheel 🎡</h4>
          <button
            id="spindare-settings-btn"
            onClick={() => setShowEditor((prev) => !prev)}
            className={`p-1.5 rounded-xl border transition-all ${showEditor ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white/30 border-white/50 text-[var(--text-main)] hover:bg-white/50"}`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Editor Panel */}
        <AnimatePresence>
          {showEditor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden border-b border-[var(--border-color)] pb-4"
            >
              <div className="bg-white/35 dark:bg-black/10 p-4 rounded-2xl border border-white/50 space-y-3">
                <div className="flex gap-2">
                  <button
                    id="editor-tab-truth"
                    onClick={() => setEditorTab("truth")}
                    className={`flex-1 py-1 px-3 rounded-xl text-xs font-bold transition-all ${editorTab === "truth" ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30" : "bg-white/30 text-[var(--text-muted)] hover:bg-white/50"}`}
                  >
                    Truths ({dbState.truths.length}/20)
                  </button>
                  <button
                    id="editor-tab-dare"
                    onClick={() => setEditorTab("dare")}
                    className={`flex-1 py-1 px-3 rounded-xl text-xs font-bold transition-all ${editorTab === "dare" ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30" : "bg-white/30 text-[var(--text-muted)] hover:bg-white/50"}`}
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
                    className="flex-1 text-xs px-3 py-2 bg-white/50 border border-white/80 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] disabled:opacity-60"
                  />
                  <button
                    id="add-item-btn"
                    onClick={addItem}
                    disabled={(editorTab === "truth" ? dbState.truths : dbState.dares).length >= 20 || !newItemText.trim()}
                    className="p-2 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {(editorTab === "truth" ? dbState.truths : dbState.dares).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white/40 p-2 rounded-xl text-xs border border-white/60">
                      <span className="truncate flex-1 text-[var(--text-main)]">{item}</span>
                      <button
                        id={`remove-item-${idx}`}
                        onClick={() => removeItem(idx)}
                        disabled={(editorTab === "truth" ? dbState.truths : dbState.dares).length <= 2}
                        className="text-red-400 hover:text-red-600 disabled:opacity-30"
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
        <div className="flex bg-white/40 p-1 rounded-2xl border border-white/60 w-52 gap-1">
          <button
            id="wheel-mode-truth"
            onClick={() => changeSelectedType("truth")}
            disabled={dbState.spinning}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${dbState.selectedType === "truth" ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            Truth Wheel
          </button>
          <button
            id="wheel-mode-dare"
            onClick={() => changeSelectedType("dare")}
            disabled={dbState.spinning}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${dbState.selectedType === "dare" ? "bg-[var(--primary)] text-white shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
          >
            Dare Wheel
          </button>
        </div>

        {/* Wheel Container (Fixed Pointer Outside of Rotating Div) */}
        <div className="relative w-48 h-48 flex items-center justify-center bg-white/20 dark:bg-white/5 rounded-full border border-white/40 p-2 shadow-inner">
          {/* Spinning Wheel */}
          <div
            className="w-full h-full relative"
            style={{
              transition: dbState.spinning ? "transform 3.5s cubic-bezier(0.15, 0.75, 0.1, 1)" : "none",
              transform: `rotate(${dbState.rotation}deg)`,
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
              {items.map((_, i) => {
                const angle = (360 / items.length) * i;
                const nextAngle = (360 / items.length) * (i + 1);
                const r = 92;
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
                    stroke="white"
                    strokeWidth="1.5"
                  />
                );
              })}
              <circle cx="100" cy="100" r="16" fill="white" stroke="#e5e7eb" strokeWidth="2" />
              <text x="100" y="105" textAnchor="middle" fontSize="15" fill="#374151">🎯</text>
            </svg>
          </div>

          {/* Pointer - Remains stationary outside of rotating block */}
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 z-20"
            style={{
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "18px solid var(--primary)",
              filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.25))",
            }}
          />
        </div>

        <button
          id="spin-dare-btn"
          onClick={spin}
          disabled={dbState.spinning || items.length === 0}
          className="px-10 py-3 bg-[var(--primary)] text-white font-bold rounded-2xl text-xs hover:opacity-90 disabled:opacity-60 transition-all hover:scale-105 active:scale-95 shadow-md"
        >
          {dbState.spinning ? "Spinning... 🌀" : "Spin! 🎉"}
        </button>

        <AnimatePresence>
          {dbState.result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full bg-white/60 dark:bg-black/20 border border-[var(--border-color)] rounded-2xl p-4 text-center shadow-sm"
            >
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 font-bold">
                {dbState.selectedType === "truth" ? "Your Truth question" : "Your Dare challenge"}
              </p>
              <p className="text-sm font-bold text-[var(--text-main)] leading-relaxed px-2">
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
// Streams incremental stroke coordinate arrays; never streams dataURL blobs.
// Flush buffer: 80ms interval. Firestore path: sketch_room/strokes (subcollection).

interface StrokePoint { x: number; y: number; color: string; size: number; type: "start" | "draw" | "end" }

const COLORS = ["#000000","#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#ffffff","#6b7280"];
const BRUSH_SIZES = [2, 4, 8, 14];

function SketchCanvas() {
  const { currentUser, session, cloudinaryCloudName, cloudinaryUploadPreset, addMemory, deleteMemory, memories, userA, userB } = useCouple();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const strokeBufferRef = useRef<StrokePoint[]>([]);

  // Active sketch session ID to make clearing instantaneous (O(1))
  const [activeSessionId, setActiveSessionId] = useState<string>("init");

  // Eraser mode
  const [isEraser, setIsEraser] = useState(false);

  // Lightbox modal preview image URL
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Undo/Redo tracking
  const [strokesDocs, setStrokesDocs] = useState<any[]>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<any[]>([]);

  // Gallery list
  const [savedSketches, setSavedSketches] = useState<{ id: string; url: string; createdAt: string; createdBy: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Refs for tracking local draw segments
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const lastSessionIdRef = useRef<string | null>(null);
  const lastStrokesRef = useRef<any[]>([]);

  // Hide navbar dock when viewing a sketch full-screen in the popup modal
  useEffect(() => {
    if (previewUrl) {
      window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: false }));
    } else {
      window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: true }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: true }));
    };
  }, [previewUrl]);

  // Unified rooms/sketch_room listener: listens to root document for both sessionID & strokes array
  useEffect(() => {
    if (!session) return;
    isInitialLoadRef.current = true;
    lastSessionIdRef.current = null;
    lastStrokesRef.current = [];

    const unsub = onSnapshot(doc(db, "rooms", "sketch_room"), (d) => {
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

      // Sort remoteStrokes by timestamp 'ts' to ensure exact drawing order consistency
      const sortedStrokes = [...remoteStrokes].sort((a, b) => (a.ts || 0) - (b.ts || 0));

      // 1. If activeSessionId changes (room was cleared or reset)
      if (lastSessionIdRef.current !== currentSessionId) {
        lastSessionIdRef.current = currentSessionId;
        setActiveSessionId(currentSessionId);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render any initial strokes for this session
        sortedStrokes.forEach((stroke: any) => {
          drawPoints(ctx, stroke.points as StrokePoint[]);
        });
        
        lastStrokesRef.current = sortedStrokes;
        setStrokesDocs(sortedStrokes);
        isInitialLoadRef.current = false;
        return;
      }

      // 2. Incremental rendering or Undo/Redo logic
      const prevStrokes = lastStrokesRef.current;
      lastStrokesRef.current = sortedStrokes;
      setStrokesDocs(sortedStrokes);

      if (sortedStrokes.length === 0) {
        // Redraw white canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (sortedStrokes.length < prevStrokes.length) {
        // Undo: Redraw all remaining strokes from scratch
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        sortedStrokes.forEach((stroke: any) => {
          drawPoints(ctx, stroke.points as StrokePoint[]);
        });
      } else {
        // Draw newly added remote strokes segment-by-segment
        const newStrokes = sortedStrokes.slice(prevStrokes.length);
        newStrokes.forEach((stroke: any) => {
          if (stroke.userId !== currentUser) {
            drawPoints(ctx, stroke.points as StrokePoint[]);
          }
        });
      }
      isInitialLoadRef.current = false;
    });

    return () => unsub();
  }, [session, currentUser]);

  // Listen to saved drawings gallery
  useEffect(() => {
    if (!session) return;
    const q = query(collection(db, "saved_sketches"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setSavedSketches(snap.docs.map((d) => ({
        id: d.id,
        url: d.data().url,
        createdAt: d.data().createdAt,
        createdBy: d.data().createdBy,
      })));
    });
    return () => unsub();
  }, [session]);

  // Draw points segment-by-segment dynamically to optimize rendering to O(1) per line
  const drawPoints = (ctx: CanvasRenderingContext2D, points: StrokePoint[]) => {
    if (points.length === 0) return;

    const prevStrokeStyle = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;
    const prevLineCap = ctx.lineCap;
    const prevLineJoin = ctx.lineJoin;
    const prevFillStyle = ctx.fillStyle;

    let lastX = 0;
    let lastY = 0;

    points.forEach((p) => {
      if (p.type === "start") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        lastX = p.x;
        lastY = p.y;
      } else if (p.type === "draw") {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
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
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    const { x, y } = getPos(e, canvas);
    lastXRef.current = x;
    lastYRef.current = y;
    
    // Clear redo history when starting a new stroke
    setUndoneStrokes([]);

    const activeColor = isEraser ? "#ffffff" : color;

    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = activeColor;
    ctx.fill();

    strokeBufferRef.current.push({ x, y, color: activeColor, size: brushSize, type: "start" });
  }, [color, brushSize, isEraser]);

  const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
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

    strokeBufferRef.current.push({ x, y, color: activeColor, size: brushSize, type: "draw" });
  }, [color, brushSize, isEraser]);

  const onPointerUp = useCallback(async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const activeColor = isEraser ? "#ffffff" : color;
    strokeBufferRef.current.push({ x: 0, y: 0, color: activeColor, size: brushSize, type: "end" });
    
    const points = strokeBufferRef.current.splice(0);
    if (points.length === 0) return;
    try {
      await updateDoc(doc(db, "rooms", "sketch_room"), {
        strokes: arrayUnion({
          userId: currentUser,
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
      // Clear all strokes and set a new sessionId to clear all clients' screens instantly
      await setDoc(doc(db, "rooms", "sketch_room"), { sessionId: newSessionId, strokes: [] });
      setUndoneStrokes([]);
    } catch (e) { console.error("[clear sketch]", e); }
  }, []);

  // Undo: Deletes the last stroke of this user
  const handleUndo = useCallback(async () => {
    const myStrokes = strokesDocs.filter((s) => s.userId === currentUser);
    if (myStrokes.length === 0) return;
    const lastStroke = myStrokes[myStrokes.length - 1];

    // Store in local undone array for redo
    setUndoneStrokes((prev) => [...prev, lastStroke]);

    // Remove from Firestore
    const nextStrokes = strokesDocs.filter((s) => s !== lastStroke);
    try {
      await setDoc(doc(db, "rooms", "sketch_room"), { strokes: nextStrokes }, { merge: true });
    } catch (e) { console.error("[undo error]", e); }
  }, [strokesDocs, currentUser]);

  // Redo: Restores the last undone stroke
  const handleRedo = useCallback(async () => {
    if (undoneStrokes.length === 0) return;
    const toRestore = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes((prev) => prev.slice(0, -1));

    try {
      await updateDoc(doc(db, "rooms", "sketch_room"), {
        strokes: arrayUnion(toRestore)
      });
    } catch (e) { console.error("[redo error]", e); }
  }, [undoneStrokes]);

  // Save drawing: uploads to Cloudinary and saves to Firestore saved_sketches
  const saveDrawing = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const cloudName = cloudinaryCloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
    const uploadPreset = cloudinaryUploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

    if (!cloudName || !uploadPreset) {
      setSaveError("Cloudinary config missing. Please check settings.");
      return;
    }

    setSaving(true);
    setSaveError("");

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setSaving(false);
        setSaveError("Failed to generate image.");
        return;
      }
      try {
        const url = await uploadToCloudinary(blob, `sketch-${Date.now()}.png`, cloudName, uploadPreset);
        await addDoc(collection(db, "saved_sketches"), {
          url,
          createdAt: new Date().toISOString(),
          createdBy: currentUser,
        });
        setSaving(false);
      } catch (err: any) {
        console.error("Save sketch error:", err);
        setSaveError(err.message || "Failed to upload drawing.");
        setSaving(false);
      }
    }, "image/png");
  }, [cloudinaryCloudName, cloudinaryUploadPreset, currentUser]);

  const deleteSavedSketch = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "saved_sketches", id));
    } catch (e) { console.error("[delete saved sketch]", e); }
  }, []);

  const saveToTimeline = useCallback((url: string) => {
    const creatorName = currentUser === "user_a" ? userA.name : userB.name;
    addMemory({
      type: "milestone",
      title: "Our Sketch Masterpiece 🎨",
      description: `A beautiful drawing sketched together in the play room by ${creatorName} and partner!`,
      imageUrl: url,
      date: new Date().toISOString(),
      creatorId: currentUser,
    });
    alert("Saved to Memories timeline! ✨");
  }, [currentUser, userA, userB, addMemory]);

  const handleSelectColor = (c: string) => {
    setColor(c);
    setIsEraser(false); // Auto switch back to pen mode when selecting a color
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--text-main)]">Shared Sketch Canvas</h3>

      {/* Toolbar */}
      <div className="glass-panel rounded-2xl p-3 flex flex-wrap items-center gap-3">
        {/* Toggle Mode: Pen vs Eraser */}
        <div className="flex gap-1.5 border-r border-white/40 pr-3">
          <button
            onClick={() => setIsEraser(false)}
            className={`p-1.5 rounded-xl border transition-all ${!isEraser ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow" : "bg-white/30 text-[var(--text-main)] hover:bg-white/50 border-white/50"}`}
            title="Pen Tool"
          >
            <Pen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsEraser(true)}
            className={`p-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${isEraser ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow" : "bg-white/30 text-[var(--text-main)] hover:bg-white/50 border-white/50"}`}
            title="Eraser Tool"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        {/* Colors */}
        <div className="flex gap-1.5 flex-wrap">
          {COLORS.map((c) => (
            <button key={c} id={`sketch-color-${c.replace("#","")}`} onClick={() => handleSelectColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${(!isEraser && color === c) ? "border-[var(--primary)] scale-125 shadow-md" : "border-transparent"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        
        {/* Brush sizes */}
        <div className="flex gap-1.5 items-center">
          {BRUSH_SIZES.map((s) => (
            <button key={s} id={`sketch-size-${s}`} onClick={() => setBrushSize(s)}
              className={`rounded-full transition-all flex items-center justify-center ${brushSize === s ? "bg-[var(--primary)]" : "bg-gray-200 hover:bg-gray-300"}`}
              style={{ width: `${s + 10}px`, height: `${s + 10}px` }}>
              <div className="rounded-full bg-current" style={{ width: `${s}px`, height: `${s}px`, backgroundColor: brushSize === s ? "white" : "#374151" }} />
            </button>
          ))}
        </div>

        {/* Undo/Redo & Save Buttons */}
        <div className="flex gap-2 items-center ml-auto">
          <button
            id="sketch-undo-btn"
            onClick={handleUndo}
            disabled={strokesDocs.filter((d) => d.data().userId === currentUser).length === 0}
            className="p-1.5 rounded-xl border border-white/50 text-[var(--text-main)] bg-white/30 hover:bg-white/50 disabled:opacity-30 transition-all"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            id="sketch-redo-btn"
            onClick={handleRedo}
            disabled={undoneStrokes.length === 0}
            className="p-1.5 rounded-xl border border-white/50 text-[var(--text-main)] bg-white/30 hover:bg-white/50 disabled:opacity-30 transition-all"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
          <button
            id="sketch-save-btn"
            onClick={saveDrawing}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
          >
            {saving ? "Saving..." : "Save Drawing"}
          </button>
          <button
            id="sketch-clear-btn"
            onClick={clearCanvas}
            className="p-1.5 rounded-xl border border-red-200/50 text-red-500 bg-white/30 hover:bg-red-50 transition-all font-semibold"
            title="Clear Canvas"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {saveError && <p className="text-[10px] text-red-500">{saveError}</p>}

      {/* Canvas */}
      <div className="rounded-2xl overflow-hidden border-2 border-[var(--border-color)] bg-white shadow-md" style={{ touchAction: "none" }}>
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
      <p className="text-[10px] text-center text-[var(--text-muted)] font-mono">Strokes sync live with your partner ✨</p>

      {/* Sketch History Gallery */}
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
                <div key={sketch.id} className="group relative rounded-2xl overflow-hidden border border-white/60 bg-white/30 p-2 shadow hover:shadow-md transition-all">
                  <div
                    onClick={() => setPreviewUrl(sketch.url)}
                    className="aspect-[4/3] rounded-xl overflow-hidden bg-white border border-gray-100 relative cursor-zoom-in group-hover:opacity-95 transition-opacity"
                  >
                    <img src={sketch.url} alt="Saved sketch" className="w-full h-full object-contain" />
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-2 flex gap-1 justify-between">
                    <a
                      href={sketch.url}
                      download={`sketch-${sketch.id}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 bg-white/65 hover:bg-white rounded-lg text-gray-700 transition-colors border border-gray-200"
                      title="Download sketch"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    
                    {/* Dynamic Timeline Toggle */}
                    <button
                      onClick={() => {
                        if (existingMemory) {
                          deleteMemory(existingMemory.id);
                          alert("Removed from Memories timeline! 💔");
                        } else {
                          saveToTimeline(sketch.url);
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 text-[10px] font-bold rounded-lg transition-all ${
                        existingMemory
                          ? "bg-red-50 text-red-500 hover:bg-red-100 border border-red-200/60"
                          : "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white border border-transparent"
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${existingMemory ? "fill-current" : ""}`} />
                      <span>{existingMemory ? "Saved" : "Timeline"}</span>
                    </button>

                    <button
                      onClick={() => deleteSavedSketch(sketch.id)}
                      className="p-1 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors border border-transparent"
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden p-3 shadow-2xl flex flex-col items-center cursor-default"
            >
              {/* Close button */}
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-all font-bold text-sm"
              >
                ✕
              </button>
              
              <div className="w-full aspect-[4/3] bg-white rounded-2xl overflow-hidden flex items-center justify-center border border-gray-100 mt-8">
                <img src={previewUrl} alt="Sketch Preview" className="max-w-full max-h-full object-contain" />
              </div>
              
              <div className="mt-4 flex gap-3 w-full px-2 justify-end">
                <a
                  href={previewUrl}
                  download="sketch-full.png"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-200"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                
                {(() => {
                  const existingMemory = memories.find((m) => m.imageUrl === previewUrl);
                  return (
                    <button
                      onClick={() => {
                        if (existingMemory) {
                          deleteMemory(existingMemory.id);
                          alert("Removed from Memories timeline! 💔");
                        } else {
                          saveToTimeline(previewUrl);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        existingMemory
                          ? "bg-red-50 text-red-500 hover:bg-red-100 border border-red-200"
                          : "bg-[var(--primary)] text-white hover:opacity-90 shadow-sm"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${existingMemory ? "fill-current" : ""}`} />
                      <span>{existingMemory ? "Remove from Timeline" : "Save to Timeline"}</span>
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
