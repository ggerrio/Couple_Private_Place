/**
 * AnniversaryCountdown.tsx — Live countdown to the next anniversary
 * Shows days, hours, minutes, seconds until the big day.
 */
import React, { useState, useEffect } from "react";
import { useCouple } from "../../context/CoupleContext";

import { motion } from "motion/react";
import { Heart, Sparkles } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const now = new Date().getTime();
  const diff = Math.max(0, target.getTime() - now);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function getNextAnniversary(anniversaryStr: string): Date {
  const anniv = new Date(anniversaryStr);
  if (isNaN(anniv.getTime())) return new Date();
  const today = new Date();
  const currentYear = today.getFullYear();
  const next = new Date(anniv);
  next.setFullYear(currentYear);
  if (next.getTime() < today.getTime()) next.setFullYear(currentYear + 1);
  return next;
}

export function AnniversaryCountdown() {
  const { anniversaryDate } = useCouple();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nextDate, setNextDate] = useState<Date>(new Date());
  const [anniversaryYears, setAnniversaryYears] = useState(0);

  useEffect(() => {
    if (!anniversaryDate) return;
    const next = getNextAnniversary(anniversaryDate);
    setNextDate(next);

    // Calculate how many years this anniversary marks
    const start = new Date(anniversaryDate);
    const yrs = next.getFullYear() - start.getFullYear();
    setAnniversaryYears(yrs);

    setTimeLeft(calcTimeLeft(next));
    // Update every 10s instead of 1s — saves 90% CPU, still accurate enough for countdown
    const id = setInterval(() => setTimeLeft(calcTimeLeft(next)), 10000);
    return () => clearInterval(id);
  }, [anniversaryDate]);

  if (!anniversaryDate) return null;

  const isToday = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div id="anniversary-countdown-card">
      <div className="relative overflow-hidden">
        {/* Decorative floating hearts */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <Heart className="absolute top-2 right-4 w-4 h-4 text-[var(--primary)]/20 dark:text-[var(--primary)]/10 animate-float" />
          <Heart className="absolute bottom-3 left-8 w-3 h-3 text-[var(--color-accent)]/20 dark:text-[var(--color-accent)]/10 animate-float" style={{ animationDelay: "1.5s" }} />
          <Sparkles className="absolute top-1/2 right-12 w-3 h-3 text-[var(--primary)]/30 dark:text-[var(--primary)]/15 animate-pulse-slow" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Milestone badge */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--color-accent)] flex items-center justify-center shadow-md">
            <span className="text-3xl">
              {isToday ? "🎉" : anniversaryYears >= 5 ? "🥂" : anniversaryYears >= 2 ? "💖" : "🌸"}
            </span>
          </div>

          {/* Countdown info */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-[var(--text-main)] font-serif flex items-center gap-2 justify-center sm:justify-start">
              {isToday ? "🎉 Anniversary Today! 🎉" : `Countdown to ${anniversaryYears}${getOrdinal(anniversaryYears)} Anniversary`}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {isToday
                ? `Celebrating ${anniversaryYears} wonderful years together! 💕`
                : `${nextDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
            </p>

            {!isToday && (
              <div className="flex items-center gap-3 sm:gap-4 mt-3 justify-center sm:justify-start">
                {[
                  { label: "Days", value: timeLeft.days },
                  { label: "Hours", value: pad(timeLeft.hours) },
                  { label: "Minutes", value: pad(timeLeft.minutes) },
                  { label: "Seconds", value: pad(timeLeft.seconds) },
                ].map((unit) => (
                  <div key={unit.label} className="flex flex-col items-center">
                    <span className="text-xl md:text-2xl font-black font-display text-[var(--primary)] tabular-nums">
                      {unit.value}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-wider font-bold mt-0.5">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isToday && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--primary)]/10 rounded-full border border-[var(--primary)]/20"
              >
                <Heart className="w-4 h-4 text-[var(--primary)] fill-current animate-heartbeat" />
                <span className="text-xs font-bold text-[var(--text-main)]">Happy Anniversary, love! 💕</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getOrdinal(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}

export default AnniversaryCountdown;
