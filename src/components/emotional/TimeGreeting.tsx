/**
 * TimeGreeting.tsx — Shows a warm time-of-day greeting banner
 * Integrates with useTimeOfDay hook for morning/afternoon/evening/night detection.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTimeOfDay } from "../../hooks/useTimeOfDay";
import { useCouple } from "../../context/CoupleContext";
import { Sparkles, Moon, Sun, CloudSun } from "lucide-react";

export function TimeGreeting() {
  const { customGreetings } = useCouple();
  const { greeting, emoji, period, isLateNight, isEarlyMorning } = useTimeOfDay(customGreetings);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // Auto-hide after 6 seconds, but allow re-show if dismissed was a while ago
  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [dismissed, period]);

  // Re-show when period changes (if dismissed)
  useEffect(() => {
    setDismissed(false);
    setVisible(true);
  }, [period]);

  const getPeriodIcon = () => {
    if (period === "morning") return <Sun className="w-4 h-4 text-amber-500" />;
    if (period === "afternoon") return <CloudSun className="w-4 h-4 text-amber-400" />;
    if (period === "evening") return <Sun className="w-4 h-4 text-orange-500" />;
    return <Moon className="w-4 h-4 text-indigo-400" />;
  };

  const getPeriodColors = () => {
    if (period === "morning") return "from-amber-50/80 to-yellow-50/80 border-amber-200/40 text-amber-800";
    if (period === "afternoon") return "from-sky-50/80 to-blue-50/80 border-sky-200/40 text-sky-800";
    if (period === "evening") return "from-orange-50/80 to-rose-50/80 border-orange-200/40 text-orange-800";
    return "from-indigo-50/80 to-purple-50/80 border-indigo-200/40 text-indigo-800";
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-r ${getPeriodColors()} p-3 sm:p-4 mb-4`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl sm:text-2xl flex-shrink-0">{emoji}</span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold leading-tight flex items-center gap-1.5">
                  {getPeriodIcon()}
                  <span>{greeting}! {isLateNight && "🌙 Time to rest, love."}</span>
                </p>
                <p className="text-[10px] sm:text-[11px] opacity-70 mt-0.5 font-medium">
                  {isEarlyMorning
                    ? "A brand new day for us to share. ☕"
                    : isLateNight
                    ? "The stars are out, and you're still on my mind. 💫"
                    : "Every moment with you is a treasure. 💖"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Dismiss greeting"
            >
              <Sparkles className="w-3 h-3 opacity-40 hover:opacity-70" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * NightAmbient — Subtle overlay + moon icon for late-night browsing
 * Renders a gentle gradient overlay and decorative moon when it's late.
 */
export function NightAmbient() {
  const { isLateNight, period } = useTimeOfDay();
  if (!isLateNight) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.8, ease: "easeOut" }}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    >
      {/* Subtle dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, rgba(15, 10, 30, 0.06) 0%, rgba(15, 10, 30, 0.03) 100%)`,
        }}
      />
      {/* Floating decorative stars — fade in with extra delay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
        className="absolute top-12 right-12 sm:top-20 sm:right-20"
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="1.5" fill="currentColor" className="text-indigo-300" />
          <circle cx="10" cy="18" r="1" fill="currentColor" className="text-indigo-300" />
          <circle cx="50" cy="12" r="1" fill="currentColor" className="text-indigo-300" />
          <circle cx="42" cy="45" r="1.2" fill="currentColor" className="text-indigo-300" />
          <circle cx="15" cy="48" r="0.8" fill="currentColor" className="text-indigo-300" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
