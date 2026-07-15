/**
 * GratitudePrompt.tsx — Daily Gratitude Practice
 *
 * A warm daily ritual card on the Home tab where each partner can
 * share one thing they're grateful for about the other today.
 * Includes streak tracking and partner visibility.
 */

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCouple } from "../../context/CoupleContext";
import { Heart, Sparkles, Flame, Send, Check } from "lucide-react";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getTodayStr(): string {
  return formatDate(new Date());
}

/** Calculate consecutive days where at least one partner submitted a gratitude */
function calcGratitudeStreak(gratitudes: { userId: string; date: string }[]): number {
  if (gratitudes.length === 0) return 0;

  // Get unique dates where at least one partner submitted
  const uniqueDates = new Set(gratitudes.map((g) => g.date));
  const sorted = [...uniqueDates].sort().reverse();

  if (sorted.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  const todayStr = formatDate(today);

  // Check if today is in the set (or if today hasn't been submitted yet but yesterday was)
  const hasToday = sorted[0] === todayStr;

  // Start from the most recent date in the set
  let checkDate = new Date(sorted[0]);

  for (const dateStr of sorted) {
    const expected = formatDate(checkDate);
    if (dateStr !== expected) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

export function GratitudePrompt() {
  const { currentUser, userA, userB, gratitudes, addGratitude } = useCouple();

  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticEntry, setOptimisticEntry] = useState<{ text: string; date: string } | null>(null);

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  const todayStr = getTodayStr();

  // Has this user submitted today? (real data from context, or optimistic)
  const myTodayGratitude = gratitudes.find(
    (g) => g.userId === currentUser && g.date === todayStr
  );
  // Only use optimistic entry if it matches today — prevents stale data from yesterday
  const effectiveMyEntry = myTodayGratitude || (optimisticEntry?.date === todayStr ? optimisticEntry : null);

  // Has partner submitted today?
  const partnerTodayGratitude = gratitudes.find(
    (g) => g.userId !== currentUser && g.date === todayStr
  );

  // Historic partner gratitudes (for inspiration — last few entries)
  const partnerRecentGratitudes = useMemo(() => {
    return gratitudes
      .filter((g) => g.userId !== currentUser && g.date !== todayStr)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [gratitudes, currentUser, todayStr]);

  // Streak calculation
  const streak = useMemo(() => calcGratitudeStreak(gratitudes), [gratitudes]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    // Optimistically show entry immediately (date-guarded against cross-day staleness)
    setOptimisticEntry({ text: trimmed, date: todayStr });
    addGratitude(trimmed);
    setText("");
    setTimeout(() => setIsSubmitting(false), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Determine if we should show the prompt (not submitted today) or the result
  const showPrompt = !effectiveMyEntry;

  const promptVariants = [
    "What is one thing you're grateful for about your partner today?",
    "What made you smile about your partner today?",
    "What's something your partner did recently that you appreciated?",
    "What quality in your partner are you celebrating today?",
    "What's a small moment with your partner that warmed your heart?",
    "How did your partner make your world better today?",
    "What's something you love about your partner that you haven't said lately?",
  ];
  const promptText = promptVariants[new Date().getDate() % promptVariants.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-[var(--primary)]/20 dark:border-[var(--primary)]/30 p-5 sm:p-6 shadow-xs w-full"
      style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, var(--bg-app)), color-mix(in srgb, var(--color-accent) 6%, var(--bg-app)))"
      }}
    >
      {/* Decorative background elements */}
      <Heart
        className="absolute -bottom-6 -right-6 w-24 h-24 text-[var(--primary)]/10 dark:text-[var(--primary)]/5 pointer-events-none"
        style={{ transform: "rotate(15deg)" }}
      />
      <Sparkles
        className="absolute top-3 right-3 w-5 h-5 text-[var(--color-accent)]/30 dark:text-[var(--color-accent)]/20 pointer-events-none"
      />

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <img loading="lazy"
                src={activeProfile.avatar}
                alt={activeProfile.name}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-800 shadow-xs object-cover"
                referrerPolicy="no-referrer"
              />
              <img loading="lazy"
                src={partnerProfile.avatar}
                alt={partnerProfile.name}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-800 shadow-xs object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--primary)] dark:text-[var(--primary)] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[var(--primary)]" />
                Daily Gratitude
              </span>
              <p className="text-[9px] text-[var(--text-muted)] font-mono">
                A practice of appreciation. Together.
              </p>
            </div>
          </div>

          {/* Streak badge */}
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/60 dark:border-amber-900/30 shadow-xs"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400 fill-current" />
              <span className="text-[11px] font-extrabold text-orange-700 dark:text-orange-300 font-mono">
                {streak} day{streak > 1 ? "s" : ""}
              </span>
            </motion.div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showPrompt ? (
            /* ── INPUT MODE ── */
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <p className="text-sm font-serif italic text-[var(--text-main)] leading-relaxed">
                "{promptText}"
              </p>

              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 280))}
                  onKeyDown={handleKeyDown}
                  placeholder={`Dear ${partnerProfile.name.split(" ")[0]}, today I'm grateful for...`}
                  rows={3}
                  maxLength={280}
                  className="w-full bg-white/80 dark:bg-stone-900/80 border border-[var(--primary)]/20 dark:border-[var(--primary)]/30 rounded-xl px-4 py-3 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50 resize-none outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-[var(--primary)]/60">
                  {text.length}/280
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                  Shared only with your partner 💕
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--color-accent)] hover:opacity-90 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Sending..." : "Share Gratitude"}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── RESULT MODE — showing today's entries ── */
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* You submitted */}
              <div className="flex items-start gap-3 bg-white/70 dark:bg-stone-900/50 rounded-xl p-3.5 border border-[var(--primary)]/10 dark:border-[var(--primary)]/5">
                <img loading="lazy"
                  src={activeProfile.avatar}
                  alt={activeProfile.name}
                  className="w-8 h-8 rounded-full border-2 border-[var(--primary)]/20 dark:border-[var(--primary)]/40 object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-[var(--primary)]">
                      {activeProfile.name.split(" ")[0]}
                    </span>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-[8px] text-emerald-500 dark:text-emerald-400 font-bold">Submitted today</span>
                  </div>
                  <p className="text-xs text-[var(--text-main)] leading-relaxed">
                    {effectiveMyEntry ? effectiveMyEntry.text : "You shared your gratitude today! 💝"}
                  </p>
                </div>
              </div>

              {/* Partner's entry */}
              {partnerTodayGratitude ? (
                <div className="flex items-start gap-3 bg-white/70 dark:bg-stone-900/50 rounded-xl p-3.5 border border-[var(--color-accent)]/10 dark:border-[var(--color-accent)]/5">
                  <img loading="lazy"
                    src={partnerProfile.avatar}
                    alt={partnerProfile.name}
                    className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)]/20 dark:border-[var(--color-accent)]/40 object-cover flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-[var(--color-accent)]">
                        {partnerProfile.name.split(" ")[0]}
                      </span>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[8px] text-emerald-500 dark:text-emerald-400 font-bold">Submitted today</span>
                    </div>
                    <p className="text-xs text-[var(--text-main)] leading-relaxed">
                      {partnerTodayGratitude.text}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 bg-[var(--color-accent)]/5 dark:bg-[var(--color-accent)]/10 rounded-xl p-3.5 border border-[var(--color-accent)]/10">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-[var(--color-accent)]/30 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-3.5 h-3.5 text-[var(--color-accent)]/55" />
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] italic">
                    Waiting for {partnerProfile.name.split(" ")[0]} to share their gratitude today...
                  </p>
                </div>
              )}

              {/* Recent gratitudes from partner (history) */}
              {partnerRecentGratitudes.length > 0 && (
                <div className="pt-2 border-t border-[var(--primary)]/10 dark:border-[var(--primary)]/5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--primary)] mb-2">
                    Recently from {partnerProfile.name.split(" ")[0]}
                  </p>
                  <div className="space-y-1.5">
                    {partnerRecentGratitudes.map((g) => (
                      <div
                        key={g.id}
                        className="flex items-start gap-2 bg-white/50 dark:bg-stone-900/30 rounded-lg p-2.5 border border-[var(--primary)]/10"
                      >
                        <span className="text-[9px] text-[var(--primary)]/70 font-mono flex-shrink-0 mt-0.5">
                          {new Date(g.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                          {g.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset button */}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
