import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CoffeeStain, WashiTape, Sparkle, FloatingEmbers } from "../svg/Decorations";
import type { BirthdaySceneProps } from "../birthday.types";

export function StatsTimelineScene({ onAdvance }: BirthdaySceneProps) {
  const reduced = useReducedMotion();
  const [timePassed, setTimePassed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Live relationship timer dating back to December 14, 2025
  useEffect(() => {
    const startDate = new Date("2025-12-14T00:00:00");

    const tick = () => {
      const now = new Date();
      const diffMs = now.getTime() - startDate.getTime();

      if (diffMs < 0) {
        setTimePassed({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const diffSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(diffSecs / 86400);
      const hours = Math.floor((diffSecs % 86400) / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;

      setTimePassed({ days, hours, minutes, seconds });
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <button
      type="button"
      onClick={onAdvance}
      className="relative w-full h-full flex items-center justify-center cursor-pointer px-4 py-10 outline-none select-none"
      aria-label="Continue to wax seal envelope"
    >
      <FloatingEmbers count={10} />

      {/* Backdrop halo */}
      <div
        aria-hidden
        className="absolute w-[80vw] max-w-[1000px] h-[60vh] rounded-full bg-violet-200/10 blur-3xl pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 1.0 }}
        animate={{
          opacity: 1,
          y: 0,
          rotate: [0.6, 1.0, 0.6],
        }}
        transition={{
          opacity: { delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          y: { delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          rotate: { delay: 1.2, duration: 8, repeat: Infinity, ease: "easeInOut" },
        }}
        whileHover={{
          rotate: -0.2,
          scale: 1.02,
          y: -6,
          boxShadow:
            "0 8px 24px rgba(120,80,40,0.12), 0 40px 80px rgba(120,80,40,0.20)",
          transition: { type: "spring", stiffness: 200, damping: 24 },
        }}
        className="relative w-[88vw] max-w-[820px] aspect-[3/2] flex"
        onClick={(e) => {
          // Prevent advance if clicking on interactive elements
          const target = e.target as HTMLElement;
          if (target.closest(".interactive-target")) {
            e.stopPropagation();
          }
        }}
      >
        {/* Fine paper background */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[4px] pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, #FAF8F5 0%, #F4EFE6 60%, #EFE8DC 100%)",
            boxShadow:
              "0 24px 48px rgba(44,38,35,0.12), 0 4px 12px rgba(44,38,35,0.06)",
          }}
        />

        {/* Single Washi Tape Accent */}
        <WashiTape
          color="sage"
          pattern="dots"
          width={100}
          height={20}
          rotate={-12}
          className="absolute -top-2 left-8 opacity-80"
        />

        {/* Card Header text */}
        <div className="absolute top-3 left-0 right-0 text-center font-serif italic text-[10px] tracking-[0.3em] text-[#705646] z-10">
          CHAPTER III · OUR JOURNEY IN NUMBERS
        </div>

        {/* Vertical divider */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(229,222,201,0.8) 12%, rgba(229,222,201,0.8) 88%, transparent 100%)",
          }}
        />

        {/* LEFT PAGE: Interactive Map & Path */}
        <div className="relative flex-1 px-6 pt-10 pb-6 flex flex-col justify-center items-center text-center overflow-hidden">
          <div className="w-full h-full max-h-[85%] border border-[#e2d3bb] rounded-md bg-[#faf4e6]/50 flex flex-col items-center justify-center p-2 relative">
            {/* SVG Interactive Canvas */}
            <svg viewBox="0 0 300 180" className="w-full h-full text-[#3a2511]">
              <line x1="0" y1="45" x2="300" y2="45" stroke="#ebdcb9" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="300" y2="90" stroke="#ebdcb9" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="0" y1="135" x2="300" y2="135" stroke="#ebdcb9" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="75" y1="0" x2="75" y2="180" stroke="#ebdcb9" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="150" y1="0" x2="150" y2="180" stroke="#ebdcb9" strokeWidth="0.8" strokeDasharray="3 3" />
              <line x1="225" y1="0" x2="225" y2="180" stroke="#ebdcb9" strokeWidth="0.8" strokeDasharray="3 3" />

              {/* Connecting Arc Route */}
              <path
                d="M 50 130 Q 150 20 250 70"
                fill="none"
                stroke="#d4af37"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />

              {/* Glowing Line flow */}
              {!reduced && (
                <motion.path
                  d="M 50 130 Q 150 20 250 70"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2.2"
                  strokeDasharray="18 120"
                  animate={{
                    strokeDashoffset: [200, -200],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3.8,
                    ease: "linear",
                  }}
                />
              )}

              {/* Jakarta Node */}
              <circle cx="50" cy="130" r="5" fill="#7c2b22" />
              <motion.circle
                cx="50"
                cy="130"
                r="10"
                fill="none"
                stroke="#7c2b22"
                strokeWidth="1"
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.0 }}
              />
              <text x="50" y="150" textAnchor="middle" className="font-serif italic text-[8px] fill-[#5C3A1E] font-bold">
                Jakarta, ID
              </text>

              {/* Reseda, LA Node */}
              <circle cx="250" cy="70" r="5" fill="#6d28d9" />
              <motion.circle
                cx="250"
                cy="70"
                r="10"
                fill="none"
                stroke="#6d28d9"
                strokeWidth="1"
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.0, delay: 0.5 }}
              />
              <text x="250" y="55" textAnchor="middle" className="font-serif italic text-[8px] fill-[#5C3A1E] font-bold">
                Reseda, LA
              </text>
            </svg>

            {/* Distance statistics label */}
            <div className="absolute bottom-2.5 left-3 right-3 flex justify-between items-center bg-[#8b5a2b]/5 rounded px-2 py-0.5 border border-[#dfd0bd]/40">
              <span className="font-serif italic text-[8px] text-[#5C3A1E]">
                Reseda, LA ── Jakarta
              </span>
              <span className="font-serif font-bold text-[9.5px] text-[#7c2b22] tracking-wider">
                14,400+ KM
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PAGE: Live dating counter & bottom description */}
        <div className="relative flex-1 px-6 pt-10 pb-6 flex flex-col justify-center items-center text-center overflow-hidden">
          <span className="font-serif italic text-[10px] uppercase tracking-[0.25em] text-[#8a6552]/70 mb-4 block">
            Dating Since Dec 14, 2025
          </span>

          <div className="grid grid-cols-2 gap-3 w-full max-w-[85%] mb-4">
            <div className="border border-[#dfd0bd] bg-[#faf4e6]/50 rounded px-2 py-3 flex flex-col items-center shadow-sm">
              <span className="font-serif text-[#7c2b22] text-2xl font-bold tracking-tight">
                {timePassed.days}
              </span>
              <span className="font-serif italic text-[8.5px] uppercase tracking-wider text-[#8a6552]/70 mt-0.5">
                Days
              </span>
            </div>

            <div className="border border-[#dfd0bd] bg-[#faf4e6]/50 rounded px-2 py-3 flex flex-col items-center shadow-sm">
              <span className="font-serif text-[#3a2511] text-2xl font-bold tracking-tight">
                {String(timePassed.hours).padStart(2, "0")}
              </span>
              <span className="font-serif italic text-[8.5px] uppercase tracking-wider text-[#8a6552]/70 mt-0.5">
                Hours
              </span>
            </div>

            <div className="border border-[#dfd0bd] bg-[#faf4e6]/50 rounded px-2 py-3 flex flex-col items-center shadow-sm">
              <span className="font-serif text-[#3a2511] text-2xl font-bold tracking-tight">
                {String(timePassed.minutes).padStart(2, "0")}
              </span>
              <span className="font-serif italic text-[8.5px] uppercase tracking-wider text-[#8a6552]/70 mt-0.5">
                Mins
              </span>
            </div>

            <div className="border border-[#dfd0bd] bg-[#faf4e6]/50 rounded px-2 py-3 flex flex-col items-center shadow-sm">
              <span className="font-serif text-violet-600 text-2xl font-bold tracking-tight w-[3ch] text-center">
                {String(timePassed.seconds).padStart(2, "0")}
              </span>
              <span className="font-serif italic text-[8.5px] uppercase tracking-wider text-[#8a6552]/70 mt-0.5">
                Secs
              </span>
            </div>
          </div>

          <div className="mt-4 text-center px-4 max-w-[90%] select-none z-10">
            <p className="font-handwrite text-base md:text-lg text-[#7c2b22] italic leading-relaxed tracking-wide">
              "distance is just a number when the destination is you. ✿"
            </p>
          </div>
        </div>

        {/* Small floating sparkles */}
        <Sparkle className="absolute top-[18%] left-[12%] text-amber-400/50" size={16} />
        <Sparkle className="absolute bottom-[24%] right-[10%] text-violet-400/60" size={18} />
      </motion.div>
    </button>
  );
}
