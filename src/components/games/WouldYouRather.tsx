/**
 * WouldYouRather.tsx — Romantic dilemmas to debate together
 */
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useCouple } from "../../context/CoupleContext";
import { getDb } from "../../firebaseClient";
import { toast } from "sonner";
import { Skeleton } from "../extras/Skeleton";

// ─── Questions ────────────────────────────────────────────────────────────────

const WYR_QUESTIONS: [string, string][] = [
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

// ─── Would You Rather Component ───────────────────────────────────────────────

function WouldYouRather({ onVote }: { onVote?: () => void }) {
  const { currentUser, userA, userB } = useCouple();
  const [qIdx, setQIdx] = useState(0);
  const [votes, setVotes] = useState<
    Record<string, Record<"user_a" | "user_b", number>>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
      unsub = onSnapshot(
        doc(db, "rooms", "wyr_room"),
        (d: any) => {
          if (d.exists()) {
            const data = d.data();
            if (data.qIdx !== undefined) setQIdx(data.qIdx);
            if (data.votes) setVotes(data.votes);
          } else {
            setDoc(doc(db, "rooms", "wyr_room"), { qIdx: 0, votes: {} }).catch(
              console.error
            );
          }
          setIsLoading(false);
        },
        (err) => {
          console.error("[wyr room listener]", err);
          toast.error("Would You Rather sync lost. Check your connection.");
        }
      );
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const vote = useCallback(
    async (option: 0 | 1) => {
      const key = `q${qIdx}`;
      const current = votes[key] || { user_a: -1, user_b: -1 };
      const updated = {
        ...votes,
        [key]: { ...current, [currentUser]: option },
      };
      try {
        const db = await getDb();
        const { doc, runTransaction } = await import("firebase/firestore");
        await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(doc(db, "rooms", "wyr_room"));
          if (sfDoc.exists()) {
            const currentData = sfDoc.data();
            if (currentData.qIdx !== qIdx) {
              throw new Error("Question changed by partner");
            }
          }
          transaction.set(
            doc(db, "rooms", "wyr_room"),
            { qIdx, votes: updated },
            { merge: true }
          );
        });
        onVote?.();
      } catch (e: any) {
        if (e?.message === "Question changed by partner") {
          return;
        }
        console.error("[wyr vote]", e);
        toast.error("Failed to submit vote. Check your connection.");
      }
    },
    [qIdx, votes, currentUser, onVote]
  );

  const nextQ = useCallback(async () => {
    const next = (qIdx + 1) % WYR_QUESTIONS.length;
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(
        doc(db, "rooms", "wyr_room"),
        { qIdx: next, votes },
        { merge: true }
      );
    } catch (e) {
      console.error("[wyr next]", e);
      toast.error("Failed to load next question.");
    }
  }, [qIdx, votes]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        role="status"
        aria-label="Loading Would You Rather"
      >
        <div
          className="p-6 rounded-3xl border border-[var(--wood-oak)]/15 space-y-4"
          style={{ backgroundColor: "var(--fabric-cream)" }}
        >
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
  const partnerVote =
    votes[`q${qIdx}`]?.[
      currentUser === "user_a" ? "user_b" : "user_a"
    ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <div
        className="p-6 rounded-3xl border border-[var(--wood-oak)]/15 space-y-4"
        style={{ backgroundColor: "var(--fabric-cream)" }}
      >
        <div className="text-center">
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-mono mb-1">
            Would You Rather...
          </p>
          <p className="text-xs text-[var(--text-muted)] font-mono">
            Question {qIdx + 1} of {WYR_QUESTIONS.length}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {q.map((option, i) => (
            <motion.button
              key={i}
              id={`wyr-option-${i}`}
              onClick={() => vote(i as 0 | 1)}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 p-4 rounded-2xl text-xs sm:text-sm font-bold text-center border-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 leading-snug cursor-pointer ${
                myVote === i
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
            <span className="font-bold text-[var(--text-main)]">
              {(currentUser === "user_a" ? userA : userB).name.split(" ")[0]}
            </span>{" "}
            chose &ldquo;{q[myVote]}&rdquo; <br />
            <span className="font-bold text-[var(--text-main)]">
              {(currentUser === "user_a" ? userB : userA).name.split(" ")[0]}
            </span>{" "}
            chose &ldquo;{q[partnerVote]}&rdquo;
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

export default WouldYouRather;
