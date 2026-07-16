/**
 * TicTacToe.tsx — Hearts vs Rings classic grid battle
 */
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Heart, RotateCcw } from "lucide-react";
import { useCouple } from "../../context/CoupleContext";
import { getDb } from "../../firebaseClient";
import { toast } from "sonner";
import { Skeleton } from "../extras/Skeleton";

// ─── Types & Constants ────────────────────────────────────────────────────────

interface TTTGame {
  board: (string | null)[];
  nextTurn: "user_a" | "user_b";
  winner: "user_a" | "user_b" | "draw" | null;
  scoreA: number;
  scoreB: number;
}

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: (string | null)[]): string | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? "draw" : null;
}

// ─── Tic Tac Toe Component ────────────────────────────────────────────────────

function TicTacToe({ onGameComplete }: { onGameComplete?: () => void }) {
  const { currentUser, userA, userB } = useCouple();
  const [game, setGame] = useState<TTTGame>({
    board: Array(9).fill(null),
    nextTurn: "user_a",
    winner: null,
    scoreA: 0,
    scoreB: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
      unsub = onSnapshot(
        doc(db, "rooms", "ttt_room"),
        (d: any) => {
          if (d.exists()) {
            setGame(d.data() as TTTGame);
          } else {
            setDoc(doc(db, "rooms", "ttt_room"), {
              board: Array(9).fill(null),
              nextTurn: "user_a",
              winner: null,
              scoreA: 0,
              scoreB: 0,
            }).catch(console.error);
          }
          setIsLoading(false);
        },
        (err) => {
          console.error("[ttt room listener]", err);
          toast.error("Tic Tac Toe sync lost. Check your connection.");
        }
      );
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const move = useCallback(
    async (idx: number) => {
      if (game.board[idx] || game.winner) return;
      if (game.nextTurn !== currentUser) return;
      const symbol = currentUser === "user_a" ? "X" : "O";
      const newBoard = [...game.board];
      newBoard[idx] = symbol;
      const winner = checkWinner(newBoard);

      const isWinnerA =
        winner && winner !== "draw" && currentUser === "user_a";
      const isWinnerB =
        winner && winner !== "draw" && currentUser === "user_b";

      const newGame: TTTGame = {
        board: newBoard,
        nextTurn: currentUser === "user_a" ? "user_b" : "user_a",
        winner:
          winner === "draw" ? "draw" : winner ? currentUser : null,
        scoreA: game.scoreA + (isWinnerA ? 1 : 0),
        scoreB: game.scoreB + (isWinnerB ? 1 : 0),
      };
      try {
        const db = await getDb();
        const { doc, runTransaction } = await import("firebase/firestore");
        await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(
            doc(db, "rooms", "ttt_room")
          );
          if (sfDoc.exists()) {
            const currentData = sfDoc.data() as TTTGame;
            if (currentData.board.join("") !== game.board.join("")) {
              throw new Error("Board state changed by partner");
            }
            if (currentData.winner) {
              throw new Error("Game already finished");
            }
          }
          transaction.set(doc(db, "rooms", "ttt_room"), newGame);
        });
      } catch (e: any) {
        if (
          e?.message === "Board state changed by partner" ||
          e?.message === "Game already finished"
        ) {
          return;
        }
        console.error("[ttt move]", e);
        toast.error("Failed to send move. Check your connection.");
        return;
      }

      if (winner) {
        onGameComplete?.();
      }
    },
    [game, currentUser, onGameComplete]
  );

  const reset = useCallback(async () => {
    try {
      const db = await getDb();
      const { doc, runTransaction } = await import("firebase/firestore");
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, "rooms", "ttt_room");
        transaction.set(ref, {
          ...game,
          board: Array(9).fill(null),
          winner: null,
        });
      });
    } catch (e) {
      console.error("[ttt reset]", e);
      toast.error("Failed to reset game. Please try again.");
    }
  }, [game]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
        role="status"
        aria-label="Loading Tic Tac Toe"
      >
        <div
          className="p-6 rounded-3xl border border-[var(--wood-oak)]/15"
          style={{ backgroundColor: "var(--fabric-cream)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="text-center w-28 space-y-2">
              <Skeleton
                width={36}
                height={36}
                rounded="50%"
                className="mx-auto"
              />
              <Skeleton
                height={14}
                width="70%"
                rounded="6px"
                className="mx-auto"
              />
              <Skeleton
                height={24}
                width="40%"
                rounded="6px"
                className="mx-auto"
              />
            </div>
            <Skeleton height={28} width={100} rounded="20px" />
            <div className="text-center w-28 space-y-2">
              <Skeleton
                width={36}
                height={36}
                rounded="50%"
                className="mx-auto"
              />
              <Skeleton
                height={14}
                width="70%"
                rounded="6px"
                className="mx-auto"
              />
              <Skeleton
                height={24}
                width="40%"
                rounded="6px"
                className="mx-auto"
              />
            </div>
          </div>
          <div className="relative aspect-square max-w-[260px] mx-auto">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton
                  key={i}
                  width="100%"
                  height="100%"
                  rounded="16px"
                  className="aspect-square"
                />
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      <div
        className="p-6 rounded-3xl border border-[var(--wood-oak)]/15"
        style={{ backgroundColor: "var(--fabric-cream)" }}
      >
        {/* Scoreboard */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-center w-28">
            <img
              src={profileA.avatar}
              alt={`${profileA.name.split(" ")[0]}'s avatar`}
              className="w-9 h-9 rounded-full mx-auto mb-1 object-cover border border-[var(--border-color)]"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)] truncate">
              {profileA.name.split(" ")[0]} (Hearts)
            </p>
            <p className="text-2xl font-black text-[var(--primary)] font-serif">
              {game.scoreA}
            </p>
          </div>
          <div className="text-center flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1.5 rounded-full select-none block max-w-[130px] mx-auto truncate">
              {game.winner
                ? game.winner === "draw"
                  ? "Draw!"
                  : "Victory! 🎉"
                : isMyTurn
                ? "Your turn 🌸"
                : "Waiting..."}
            </span>
          </div>
          <div className="text-center w-28">
            <img
              src={profileB.avatar}
              alt={`${profileB.name.split(" ")[0]}'s avatar`}
              className="w-9 h-9 rounded-full mx-auto mb-1 object-cover border border-[var(--border-color)]"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-main)] truncate">
              {profileB.name.split(" ")[0]} (Rings)
            </p>
            <p className="text-2xl font-black text-[var(--primary)] font-serif">
              {game.scoreB}
            </p>
          </div>
        </div>

        {/* Board */}
        <div className="relative aspect-square max-w-[260px] mx-auto p-4 bg-black/5 rounded-3xl border border-[var(--border-color)] shadow-inner">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none text-[var(--primary)]/15"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M5 33.5 C 30 31, 70 35, 95 33.5" />
            <path d="M5 66.5 C 25 68, 75 65, 95 66.5" />
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
                  <svg
                    className="w-8 h-8 text-[var(--accent)] fill-none stroke-current stroke-[2.5]"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="7" />
                    <circle
                      cx="12"
                      cy="7"
                      r="1.5"
                      className="fill-current text-[var(--primary)]"
                    />
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

export default TicTacToe;
