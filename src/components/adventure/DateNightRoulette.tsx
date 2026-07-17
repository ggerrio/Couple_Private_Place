/**
 * DateNightRoulette.tsx — Synced random-pick for LDR couples 🎲
 *
 * Two-user lock-step "what should we do tonight?" feature. Whichever user
 * taps "Spin Tonight!", both clients see the reels spin and land on the
 * SAME item (deterministic seed = FNV-1a hash of `spinId`, identical on
 * both ends). Result auto-expires 24h later.
 *
 * Lives at singleton doc `rooms/date_night_roulette` (same pattern as
 * `watch_room` — see WatchPanel).
 *
 * ⌐⌐ Categories:  Movie · Deep Talk · Bedtime Chapter · Cook Together ⌐⌐
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Film, MessageCircle, BookOpen, ChefHat, Sparkles, RefreshCw, Loader2,
  Dice5, ChevronDown, ChevronUp, PartyPopper, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useCouple } from "../../context/CoupleContext";
import { getDb } from "../../firebaseClient";
import { triggerHaptic } from "../../lib/haptics";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import type { DateNightRoulette as DateNightSession } from "../../types";

type CategoryId = "movie" | "topic" | "chapter" | "recipe";

interface Item {
  label: string;
  emoji: string;
  hint: string;
}

interface Category {
  id: CategoryId;
  label: string;
  icon: React.ElementType;
  description: string;
  items: Item[];
}

// Static color maps (Tailwind JIT does not pick up dynamic string-class names
// like `bg-${color}-100`, so we enumerate them explicitly).
const COLOR_CLASSES: Record<CategoryId, {
  bg: string; text: string; ring: string; border: string;
  chipBg: string; chipRing: string; gradient: string;
}> = {
  movie: {
    bg: "bg-rose-100 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-300 dark:ring-rose-700",
    border: "border-rose-300 dark:border-rose-800",
    chipBg: "bg-rose-100/80 dark:bg-rose-950/60",
    chipRing: "ring-rose-300/60 dark:ring-rose-700/60",
    gradient: "from-rose-100 via-pink-100 to-orange-100 dark:from-rose-950/40 dark:via-pink-950/40 dark:to-orange-950/30",
  },
  topic: {
    bg: "bg-blue-100 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-300 dark:ring-blue-700",
    border: "border-blue-300 dark:border-blue-800",
    chipBg: "bg-blue-100/80 dark:bg-blue-950/60",
    chipRing: "ring-blue-300/60 dark:ring-blue-700/60",
    gradient: "from-blue-100 via-sky-100 to-cyan-100 dark:from-blue-950/40 dark:via-sky-950/40 dark:to-cyan-950/30",
  },
  chapter: {
    bg: "bg-purple-100 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    ring: "ring-purple-300 dark:ring-purple-700",
    border: "border-purple-300 dark:border-purple-800",
    chipBg: "bg-purple-100/80 dark:bg-purple-950/60",
    chipRing: "ring-purple-300/60 dark:ring-purple-700/60",
    gradient: "from-purple-100 via-violet-100 to-fuchsia-100 dark:from-purple-950/40 dark:via-violet-950/40 dark:to-fuchsia-950/30",
  },
  recipe: {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-300 dark:ring-amber-700",
    border: "border-amber-300 dark:border-amber-800",
    chipBg: "bg-amber-100/80 dark:bg-amber-950/60",
    chipRing: "ring-amber-300/60 dark:ring-amber-700/60",
    gradient: "from-amber-100 via-orange-100 to-rose-100 dark:from-amber-950/40 dark:via-orange-950/40 dark:to-rose-950/30",
  },
};

const CATEGORIES: Category[] = [
  {
    id: "movie",
    label: "Movie Night",
    icon: Film,
    description: "Pick what to watch together over videocall",
    items: [
      { label: "Romance", emoji: "💕", hint: "Cozy blanket, dim lights, a classic romcom" },
      { label: "Comedy", emoji: "😂", hint: "Lighthearted laughs — silly or witty" },
      { label: "Action", emoji: "💥", hint: "Edge-of-seat popcorn action" },
      { label: "Sci-Fi", emoji: "🚀", hint: "Mind-bending trek through space together" },
      { label: "Fantasy", emoji: "🐉", hint: "Magical worlds & new adventures" },
      { label: "Documentary", emoji: "🎬", hint: "Real stories that spark convos" },
      { label: "Thriller", emoji: "🔪", hint: "Mystery to unravel together" },
      { label: "Animated", emoji: "🎨", hint: "Studio Ghibli or Pixar night" },
      { label: "K-Drama", emoji: "🌸", hint: "Korean drama marathon" },
      { label: "Anime", emoji: "✨", hint: "Series binge & character debate" },
    ],
  },
  {
    id: "topic",
    label: "Deep Talk",
    icon: MessageCircle,
    description: "A conversation prompt for meaningful chat",
    items: [
      { label: "Childhood dreams", emoji: "🌱", hint: "What did you want to become?" },
      { label: "Future plans", emoji: "🎯", hint: "Where do you see us in 5 years?" },
      { label: "What makes us feel loved", emoji: "💖", hint: "Five love languages reflection" },
      { label: "Biggest fears", emoji: "🕯️", hint: "Share something vulnerable" },
      { label: "Favorite memory of us", emoji: "📷", hint: "Recall a perfect moment" },
      { label: "Bucket list ideas", emoji: "🌟", hint: "What dreams should we add?" },
      { label: "If we met yesterday", emoji: "✨", hint: "First impression — fresh take" },
      { label: "Proudest moment", emoji: "🏆", hint: "What you bragged to your friends" },
      { label: "Letter to future us", emoji: "💌", hint: "Write a time-capsule message" },
      { label: "Silly would-you-rather", emoji: "🤪", hint: "Light + silly this time" },
    ],
  },
  {
    id: "chapter",
    label: "Bedtime Chapter",
    icon: BookOpen,
    description: "Share a cozy bedtime story chapter",
    items: [
      { label: "Chapter 1: First message", emoji: "💬", hint: "Remember when we first DM-ed?" },
      { label: "Chapter 2: First call", emoji: "📞", hint: "Hands shaking before dialing" },
      { label: "Chapter 3: First laugh", emoji: "😆", hint: "When we realized we click" },
      { label: "Chapter 4: Late nights", emoji: "🌙", hint: "Till-sunrise conversations" },
      { label: "Chapter 5: Walls down", emoji: "🌧️", hint: "When we let our guard drop" },
      { label: "Chapter 6: Future talk", emoji: "🚀", hint: "When \"us\" became real" },
      { label: "Chapter 7: Inside jokes", emoji: "🤭", hint: "Lingo only we understand" },
      { label: "Chapter 8: The reunion", emoji: "🤗", hint: "When video became IRL" },
      { label: "Chapter 9: Quiet moments", emoji: "🍃", hint: "When silence says everything" },
      { label: "Chapter 10: Next chapter", emoji: "📖", hint: "What we'll write together" },
    ],
  },
  {
    id: "recipe",
    label: "Cook Together",
    icon: ChefHat,
    description: "Same recipe, two kitchens, one video call",
    items: [
      { label: "Pasta from scratch", emoji: "🍝", hint: "Roll the dough together" },
      { label: "Homemade pizza", emoji: "🍕", hint: "Topping battle — who wins?" },
      { label: "Korean BBQ", emoji: "🥩", hint: "Marinate + grill showdown" },
      { label: "Pancake artistry", emoji: "🥞", hint: "Whose face-shape wins?" },
      { label: "Ramen upgrade", emoji: "🍜", hint: "Soft-boiled egg challenge" },
      { label: "Sushi rolls", emoji: "🍣", hint: "Rolling technique showdown" },
      { label: "Smoothie bowl art", emoji: "🥣", hint: "Topping decoration contest" },
      { label: "Tacos together", emoji: "🌮", hint: "Build your own + compare" },
      { label: "Bake brownies", emoji: "🍫", hint: "Gooey-center challenge" },
      { label: "Hot pot adventure", emoji: "🍲", hint: "Broth + sauce pairing" },
    ],
  },
];

const SPIN_DURATION_MS = 2800;
const EXPIRY_HOURS = 24;

// FNV-1a 32-bit string hash, deterministic on every JS engine.
// Both clients pass the same `spinId` and arrive at the same bucket index
// without needing a third-party RNG library.
const hashSpinId = (s: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
};

// `crypto.randomUUID` is supported in modern browsers & Node — fallback to a
// Date+Math hex string just in case (the hash then differs per page but each
// client still arrives at the same bucket from its own seed).
const makeSpinId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export default function DateNightRoulette() {
  const { currentUser, userA, userB, session } = useCouple();
  const [doc, setDoc] = useState<DateNightSession | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("movie");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Animation state — derived from `doc.startedAt` so both clients land
  // on the same item, even with latency, by computing how much time is
  // remaining in the SPIN_DURATION_MS window.
  const [displayIdx, setDisplayIdx] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Reveal confetti — fires when showResult transitions to true.
  const [revealConfetti, setRevealConfetti] = useState<
    Array<{ id: string; emoji: string; x: number; y: number }>
  >([]);

  const spinTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Current cycle interval (mutable), updated by decel schedule so cycle()
  // can read it and both clients compute the same frame-indexed item slot.
  const currentTickMsRef = useRef<number>(80);

  // ── Firestore sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    let unsub: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const db = await getDb();
        if (cancelled) return;
        const { doc: docFn, onSnapshot } = await import("firebase/firestore");
        const ref = docFn(db, "rooms", "date_night_roulette");
        unsub = onSnapshot(
          ref,
          (snap) => {
            const data = snap.data() as DateNightSession | undefined;
            if (!data || Date.now() > data.expiresAt) {
              setDoc(null);
              setShowResult(false);
              return;
            }
            // When a NEW spin arrives, reset result overlay so animation runs.
            setShowResult(false);
            setRevealConfetti([]);
            setDoc(data);
          },
          (err) => {
            console.error("[date-night roulette listener]", err);
          }
        );
      } catch (err) {
        console.error("[date-night roulette setup]", err);
      }
    })();
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [session]);

  // ── Animation engine (mirrored on both clients via shared timestamp) ──
  useEffect(() => {
    if (!doc) {
      setIsSpinning(false);
      setShowResult(false);
      if (spinTickRef.current) {
        clearInterval(spinTickRef.current);
        spinTickRef.current = null;
      }
      return;
    }

    const category = CATEGORIES.find((c) => c.id === doc.selectedCategory);
    if (!category || category.items.length === 0) return;
    const items = category.items;
    const resultIdx = hashSpinId(doc.spinId) % items.length;
    setDisplayIdx(resultIdx);

    const elapsed = Date.now() - doc.startedAt;

    if (elapsed >= SPIN_DURATION_MS) {
      // Animation already finished — skip straight to final result.
      setIsSpinning(false);
      setShowResult(true);
      return;
    }

    setIsSpinning(true);
    setShowResult(false);
    const remaining = SPIN_DURATION_MS - elapsed;

    // Both clients share `spinSeed = hashSpinId(doc.spinId)` so the cycling
    // item index is *deterministic* across devices — not just the final
    // landing, but every frame. This gives true frame-by-frame visual sync.
    const spinSeed = hashSpinId(doc.spinId);

    // Slot quantum = smallest tick (80ms). Both clients derive `slotIdx`
    // from elapsed-time divided by this quantum — independent of current
    // decel stage — so the displayed item index advances MONOTONICALLY and
    // never "rewinds" across a tick-rate swap. The current `tickMs` only
    // controls how often the screen refreshes; the underlying item
    // sequence (`seed + slotIdx`) is decel-stage independent.
    const SLOT_QUANTUM_MS = 80;
    const cycle = () => {
      const elapsedMs = Date.now() - doc.startedAt;
      const slotIdx = Math.max(0, Math.floor(elapsedMs / SLOT_QUANTUM_MS));
      const idx = (spinSeed + slotIdx) % items.length;
      if (idx !== displayIdx) setDisplayIdx(idx);
    };

    // Compute initial tickMs based on how far into the spin we are — fixes
    // double-firing of decel setTimeouts when a client joins mid-spin. The
    // same ref read inside `cycle()` so once updated by decel, both clients
    // instantly agree.
    const tickByStage = (e: number): number => {
      if (e >= 2400) return 350;
      if (e >= 2100) return 240;
      if (e >= 1500) return 160;
      if (e >= 800) return 100;
      return 80;
    };
    currentTickMsRef.current = tickByStage(elapsed);
    spinTickRef.current = setInterval(cycle, currentTickMsRef.current);
    // Fire one immediate cycle so the first frame already shows the right
    // idx (instead of waiting up to currentTickMs).
    cycle();

    const resetSpin = (newTickMs: number) => {
      currentTickMsRef.current = newTickMs;
      if (spinTickRef.current) clearInterval(spinTickRef.current);
      spinTickRef.current = setInterval(cycle, newTickMs);
      // Cycle once immediately so callers see the swap instantly.
      cycle();
    };

    const decelTimers: ReturnType<typeof setTimeout>[] = [];
    const offsetT = (offset: number) => Math.max(0, doc.startedAt + offset - Date.now());

    // Decelerate as we approach end. Only schedule setTimeouts for offsets
    // we are not yet past — prevents the "two-of-them-fire-immediately"
    // bug when a client joins after the slow phase has begun.
    const stages: Array<{ offset: number; ms: number }> = [
      { offset: 800, ms: 100 },
      { offset: 1500, ms: 160 },
      { offset: 2100, ms: 240 },
      { offset: 2400, ms: 350 },
    ];
    for (const s of stages) {
      if (elapsed < s.offset) {
        decelTimers.push(setTimeout(() => resetSpin(s.ms), offsetT(s.offset)));
      }
    }

    // Lock at the computed result idx at the canonical end-time.
    const endTimer = setTimeout(() => {
      if (spinTickRef.current) {
        clearInterval(spinTickRef.current);
        spinTickRef.current = null;
      }
      decelTimers.forEach(clearTimeout);
      setDisplayIdx(resultIdx);
      setIsSpinning(false);
      setShowResult(true);
      triggerHaptic("success");
    }, remaining);

    return () => {
      clearTimeout(endTimer);
      decelTimers.forEach(clearTimeout);
      if (spinTickRef.current) {
        clearInterval(spinTickRef.current);
        spinTickRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  // ── Reveal confetti ────────────────────────────────────────────────
  // Spawns a 4-emoji explosion when `showResult` transitions to true.
  // Cleared after ~2.2s so it doesn't linger across re-spins. Matches the
  // existing "🎉 moment" idiom in DreamBoard's completion confetti (see
  // CONFETTI_EMOJIS constant there).
  useEffect(() => {
    if (!showResult) return;
    const emojis = ["🎉", "✨", "💖", "🌟"];
    const items = emojis.map((emoji, i) => ({
      id: `reveal-${Date.now()}-${i}`,
      emoji,
      x: 12 + i * 22 + Math.random() * 4,
      y: 35 + Math.random() * 10,
    }));
    setRevealConfetti(items);
    const clear = setTimeout(() => setRevealConfetti([]), 2200);
    return () => clearTimeout(clear);
  }, [showResult]);

  // ── Action: start a new spin ──────────────────────────────────────
  const handleSpin = useCallback(async () => {
    if (!currentUser) return;
    if (!session) return;
    if (isSpinning) return;
    triggerHaptic("medium");
    try {
      const db = await getDb();
      const { doc: docFn, setDoc } = await import("firebase/firestore");
      const ref = docFn(db, "rooms", "date_night_roulette");
      const payload: DateNightSession = {
        spinId: makeSpinId(),
        spunBy: currentUser,
        selectedCategory: activeCategory,
        startedAt: Date.now(),
        expiresAt: Date.now() + EXPIRY_HOURS * 60 * 60 * 1000,
      };
      await setDoc(ref, payload);
      const partner = currentUser === "user_a" ? userB : userA;
      const partnerName = partner?.name?.split(" ")[0] || "your partner";
      toast.success(`Spin started — ${partnerName} will see the same pick 🎲`, { duration: 3000 });
    } catch (err) {
      console.error("[spin]", err);
      toast.error("Couldn't start spin. Check your connection.");
    }
  }, [currentUser, session, isSpinning, activeCategory, userA, userB]);

  // ── Derived render data ───────────────────────────────────────────
  // Fallback to first category if Firestore held a stale/invalid value — keeps
  // the renderer crash-safe if a future schema change breaks an existing doc.
  const currentCat = CATEGORIES.find((c) => c.id === (doc?.selectedCategory ?? activeCategory)) ?? CATEGORIES[0];
  const items = currentCat.items;
  const resultIdxLocal = doc ? hashSpinId(doc.spinId) % items.length : 0;
  const displayItem = items[Math.min(displayIdx, items.length - 1)];
  const spoolerLabel = currentCat.label;
  const isSelfSpin = doc?.spunBy === currentUser;
  const hoursLeft = doc ? Math.max(0, Math.round((doc.expiresAt - Date.now()) / 3600000)) : 0;
  const palette = COLOR_CLASSES[currentCat.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 transition-all duration-300 shadow-lg",
        palette.border,
        "bg-gradient-to-br",
        palette.gradient
      )}
    >
      {/* Decorative corner sparkles */}
      <div className="absolute top-2 right-3 text-amber-300 dark:text-amber-500 opacity-40 pointer-events-none">
        <Sparkles className="w-3 h-3" />
      </div>

      {/* ── Header bar (always visible, collapse toggle ── */}
      <button
        type="button"
        onClick={() => { setIsCollapsed((v) => !v); triggerHaptic("light"); }}
        className="w-full px-4 pt-3.5 pb-2 flex items-center justify-between gap-2 text-left cursor-pointer"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            palette.bg
          )}>
            <Dice5 className={cn("w-4 h-4", palette.text)} />
          </div>
          <div className="min-w-0">
            <span className={cn("text-sm font-black tracking-tight", palette.text)}>
              Date Night Roulette
            </span>
            {doc && !isSpinning && (
              <div className="flex items-center gap-1 text-[9px] font-mono opacity-70 mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span>
                  {hoursLeft}h left · {spoolerLabel}
                </span>
              </div>
            )}
            {isSpinning && (
              <div className="text-[9px] font-mono opacity-70 mt-0.5 flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>spinning together…</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono opacity-60 flex-shrink-0">
          <span>{isCollapsed ? "Open" : "Hide"}</span>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3">
              {/* ── Category chips (only when no active spin) ── */}
              {!doc && (
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const sel = cat.id === activeCategory;
                    const palette = COLOR_CLASSES[cat.id];
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setActiveCategory(cat.id); triggerHaptic("light"); }}
                        className={cn(
                          "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer",
                          sel
                            ? `${palette.chipBg} ${palette.text} ${palette.border} ring-2 ${palette.chipRing} shadow-xs scale-105`
                            : "bg-white/40 dark:bg-black/20 border-transparent text-[var(--text-muted)] hover:bg-white/60 dark:hover:bg-black/30"
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Slot-machine reveal card ── */}
              <div className={cn(
                "relative h-40 sm:h-48 rounded-2xl overflow-hidden border-2 backdrop-blur-sm",
                palette.border,
                "bg-white/50 dark:bg-black/20"
              )}>
                <AnimatePresence mode="wait">
                  {!doc && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-4"
                    >
                      <PartyPopper className={cn(
                        "w-7 h-7 mb-2",
                        palette.text
                      )} />
                      <p className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        palette.text
                      )}>
                        {currentCat.description}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1 italic max-w-[26ch]">
                        Both of you will land on the same pick — synced across screens 🎲
                      </p>
                    </motion.div>
                  )}

                  {doc && isSpinning && (
                    <motion.div
                      key="spinning"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 flex flex-col items-center justify-center"
                    >
                      <Loader2 className={cn(
                        "w-4 h-4 mb-1.5 animate-spin",
                        palette.text
                      )} />
                      <span className="text-4xl sm:text-5xl drop-shadow-sm animate-pulse select-none">
                        {displayItem?.emoji}
                      </span>
                      <span className={cn(
                        "text-lg sm:text-xl font-black tracking-tight mt-1 drop-shadow-sm",
                        palette.text
                      )}>
                        {displayItem?.label}
                      </span>
                      <span className="text-[9px] mt-1.5 opacity-60 font-mono">
                        {isSelfSpin ? "you started — partner is watching… 🌙" : "partner is choosing… hang tight 🤞"}
                      </span>
                    </motion.div>
                  )}

                  {doc && !isSpinning && showResult && (
                    <motion.div
                      key="result"
                      initial={{ scale: 0.6, opacity: 0, rotateY: 180 }}
                      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                      transition={{ type: "spring", stiffness: 180, damping: 16 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
                    >
                      {/* Reveal confetti — 4-emoji burst synced to showResult. */}
                      <AnimatePresence>
                        {revealConfetti.map((c) => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 1, scale: 0.4, x: `${c.x}%`, y: `${c.y}%` }}
                            animate={{ opacity: 0, y: `${c.y - 32}%`, scale: 1.6, rotate: (Math.random() - 0.5) * 60 }}
                            transition={{ duration: 2.0, ease: "easeOut" }}
                            className="absolute text-3xl pointer-events-none select-none"
                          >
                            {c.emoji}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <motion.span
                        initial={{ rotate: -20, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
                        className="text-5xl sm:text-6xl drop-shadow-md select-none mb-1"
                      >
                        {items[resultIdxLocal]?.emoji}
                      </motion.span>
                      <h3 className={cn(
                        "text-lg sm:text-xl font-black tracking-tight drop-shadow-sm",
                        palette.text
                      )}>
                        {items[resultIdxLocal]?.label}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-[var(--text-main)] mt-1 max-w-[34ch] font-serif italic leading-relaxed">
                        “{items[resultIdxLocal]?.hint}”
                      </p>
                      <div className="text-[8px] mt-2 opacity-55 font-mono flex items-center gap-1.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>
                          picked by {doc.spunBy === "user_a"
                            ? (userA?.name?.split(" ")[0] || "user_a")
                            : (userB?.name?.split(" ")[0] || "user_b")}
                          · {hoursLeft}h window
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Action row ── */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] text-[var(--text-muted)] font-mono leading-tight max-w-[60%]">
                  {!doc && (
                    <span>LDR-friendly activities you can do together over videocall 💛</span>
                  )}
                  {doc && !isSpinning && !isSelfSpin && (
                    <span>
                      {userA?.name?.split(" ")[0]} & {userB?.name?.split(" ")[0]} — your tonight plan 🌙
                    </span>
                  )}
                  {doc && !isSpinning && isSelfSpin && (
                    <span>
                      Saved for tonight. Hit <b>re-spin</b> for a different vibe.
                    </span>
                  )}
                  {doc && isSpinning && (
                    <span>Hold tight — both reels are locking in…</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSpin}
                  disabled={isSpinning || !currentUser}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border-2",
                    palette.chipBg,
                    palette.text,
                    palette.border,
                    "hover:shadow-lg",
                    (isSpinning || !currentUser) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isSpinning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Spinning…
                    </>
                  ) : doc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      Re-spin
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Spin Tonight
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
// Re-export internal types for unit-test consumers.
export type { Item, Category };
