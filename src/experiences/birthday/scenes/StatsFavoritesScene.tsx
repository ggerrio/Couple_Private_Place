import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "motion/react";
import { CoffeeStain, WashiTape, Sparkle, FloatingEmbers } from "../svg/Decorations";
import type { BirthdaySceneProps } from "../birthday.types";
import { useAudioAmplitude } from "../../core/audioAmplitude";

export function StatsFavoritesScene({ photos, onAdvance }: BirthdaySceneProps) {
  const reduced = useReducedMotion();
  const amp = useAudioAmplitude();
  const [purpleVibe, setPurpleVibe] = useState(false);

  // Age count-up animation (0 to 21)
  const ageValue = useMotionValue(0);
  const roundedAge = useTransform(ageValue, (latest) => Math.round(latest));

  useEffect(() => {
    if (reduced) {
      ageValue.set(21);
      return;
    }
    const controls = animate(ageValue, 21, {
      duration: 2.2,
      ease: "easeOut",
      delay: 0.4,
    });
    return controls.stop;
  }, [ageValue, reduced]);

  // First photo as Polaroid memory frame
  const firstPhoto = photos?.[0];

  return (
    <button
      type="button"
      onClick={onAdvance}
      className="relative w-full h-full flex items-center justify-center cursor-pointer px-4 py-10 outline-none select-none"
      aria-label="Continue to the letter"
    >
      <FloatingEmbers count={12} />

      {/* Decorative backdrop glow (turns deep violet when purple vibe is active) */}
      <div
        aria-hidden
        className={`absolute w-[80vw] max-w-[1000px] h-[60vh] rounded-full transition-colors duration-1000 blur-3xl pointer-events-none ${
          purpleVibe ? "bg-violet-500/20" : "bg-rose-200/10"
        }`}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 1.5 }}
        animate={{
          opacity: 1,
          y: 0,
          rotate: [1.0, 1.4, 1.0],
        }}
        transition={{
          opacity: { delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          y: { delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          rotate: { delay: 1.2, duration: 8, repeat: Infinity, ease: "easeInOut" },
        }}
        whileHover={{
          rotate: 0.5,
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
          color={purpleVibe ? "lavender" : "rose"}
          pattern="dots"
          width={100}
          height={20}
          rotate={-12}
          className="absolute -top-2 left-1/3 opacity-80"
        />

        {/* Card Header text */}
        <div className="absolute top-3 left-0 right-0 text-center font-serif italic text-[10px] tracking-[0.3em] text-[#705646] z-10">
          CHAPTER I · THE ESSENCE OF YOU
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

        {/* LEFT PAGE: 21 milestone & purple theme accent & text note */}
        <div className="relative flex-1 px-8 pt-10 pb-6 flex flex-col justify-between items-center text-center overflow-hidden">
          <div className="flex flex-col items-center mt-2 w-full">
            <span className="font-serif italic text-[11px] uppercase tracking-[0.25em] text-[#8a6552]/70 mb-1">
              Nicola is turning
            </span>
            <div className="font-serif text-[#3a2511] font-bold text-5xl md:text-6xl tracking-tight leading-none my-1 flex items-baseline gap-1">
              <motion.span>{roundedAge}</motion.span>
              <span className="text-2xl md:text-3xl font-serif italic text-[#7c2b22]">st</span>
            </div>
            <span className="font-handwrite text-[#5C3A1E] text-lg md:text-xl rotate-[-2deg]">
              Birthday milestone!
            </span>
          </div>

          {/* Integrated description text */}
          <div className="font-serif italic text-xs text-[#8a6552]/80 leading-relaxed text-center px-4 max-w-[85%] mt-4 select-none border-t border-[#dfd0bd]/40 pt-4">
            "She loves cozy purple aesthetics, quiet movie nights, and warm memories."
          </div>

          {/* Interactive purple vibe button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPurpleVibe(!purpleVibe);
            }}
            className="interactive-target relative group flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-300 bg-violet-100/40 hover:bg-violet-150/60 shadow-sm transition-all duration-300 outline-none mb-1 z-20 cursor-pointer"
          >
            {purpleVibe && (
              <span className="absolute inset-0 rounded-full ring-2 ring-violet-400/50 animate-ping pointer-events-none" />
            )}
            <motion.span
              animate={purpleVibe ? { scale: [1, 1.25, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-xs"
            >
              💜
            </motion.span>
            <span className="font-serif text-[10px] font-bold uppercase tracking-wider text-violet-700">
              {purpleVibe ? "Purple Vibe ON" : "Turn Purple Vibe ON"}
            </span>
          </button>
        </div>

        {/* RIGHT PAGE: Doodles (Rabbit & Fawn) at the top, Polaroid photo at the bottom */}
        <div className="relative flex-1 px-8 pt-10 pb-6 flex flex-col justify-between items-center overflow-hidden">
          {/* Interactive Doodles (Side-by-side) */}
          <div className="flex justify-around items-center w-full mt-1 gap-2">
            {/* Interactive Rabbit */}
            <motion.div
              whileHover={{ scale: 1.08 }}
              className="interactive-target flex flex-col items-center cursor-pointer group"
              title="Touch me!"
            >
              <svg viewBox="0 0 48 48" width="50" height="50" className="text-[#3a2511]">
                <motion.path
                  d="M18 18 C14 8, 16 2, 19 4 C22 6, 21 12, 21 18 M30 18 C34 8, 32 2, 29 4 C26 6, 27 12, 27 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  animate={{
                    rotate: [0, -6, 6, -3, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "mirror",
                    duration: 3.5,
                    delay: 0.2,
                  }}
                  className="origin-bottom"
                  style={{ transformOrigin: "24px 18px" }}
                />
                <path
                  d="M16 24 C14 28, 16 34, 24 34 C32 34, 34 28, 32 24 C31 20, 17 20, 16 24 Z"
                  fill="#fefefe"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <circle cx="21" cy="25" r="1.2" fill="currentColor" />
                <circle cx="27" cy="25" r="1.2" fill="currentColor" />
                <path d="M23 27 L25 27 L24 28.2 Z" fill="#f472b6" />
                <circle cx="18" cy="27" r="2" fill="#f472b6" opacity="0.35" />
                <circle cx="30" cy="27" r="2" fill="#f472b6" opacity="0.35" />
              </svg>
              <span className="font-serif italic text-[8.5px] text-[#8a6552]/70 group-hover:text-[#7c2b22] transition-colors leading-none mt-0.5">
                Bunnies
              </span>
            </motion.div>

            {/* Interactive Fawn */}
            <motion.div
              whileHover={{ scale: 1.08 }}
              className="interactive-target flex flex-col items-center cursor-pointer group"
              title="Touch me!"
            >
              <svg viewBox="0 0 48 48" width="50" height="50" className="text-[#3a2511]">
                <motion.g
                  animate={{
                    rotate: [0, -4, 4, -2, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    repeatType: "mirror",
                    duration: 4.2,
                  }}
                  className="origin-bottom"
                  style={{ transformOrigin: "24px 34px" }}
                >
                  <path d="M12 24 C6 22, 8 16, 15 20 M36 24 C42 22, 40 16, 33 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path
                    d="M16 22 C14 28, 18 34, 24 34 C30 34, 34 28, 32 22 C30 18, 18 18, 16 22 Z"
                    fill="#d97706"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    opacity="0.9"
                  />
                  <circle cx="21" cy="20" r="0.8" fill="#FFF" />
                  <circle cx="23" cy="21" r="0.6" fill="#FFF" />
                  <circle cx="27" cy="20" r="0.8" fill="#FFF" />
                  <circle cx="20" cy="24" r="1.2" fill="currentColor" />
                  <circle cx="28" cy="24" r="1.2" fill="currentColor" />
                  <ellipse cx="24" cy="28" rx="1.5" ry="1.0" fill="currentColor" />
                </motion.g>
              </svg>
              <span className="font-serif italic text-[8.5px] text-[#8a6552]/70 group-hover:text-[#7c2b22] transition-colors leading-none mt-0.5">
                Fawns
              </span>
            </motion.div>
          </div>

          {/* Polaroid Photo Frame (Fills empty space at bottom right) */}
          <motion.div
            whileHover={{ scale: 1.03, rotate: -1.5 }}
            className="interactive-target mt-3 p-2 bg-[#fefdfa] border border-[#ebdcb9] shadow-md rounded-[2px] w-[64%] aspect-[4/5] flex flex-col justify-between relative select-none"
          >
            {/* Washi tape sticker on top of polaroid */}
            <WashiTape
              color="rose"
              pattern="stripes"
              width={55}
              height={14}
              rotate={-6}
              className="absolute -top-2.5 left-1/2 -translate-x-1/2 opacity-90 z-20"
            />
            {firstPhoto ? (
              <div className="relative w-full h-[78%] bg-[#ebdcb9]/40 overflow-hidden rounded-[1px] border border-[#f0e4cf]">
                <img src={firstPhoto.src} className="w-full h-full object-cover" alt="Nicola memory" />
                <div className="absolute inset-0 bg-[#8b5a2b]/5 mix-blend-overlay" />
              </div>
            ) : (
              <div className="w-full h-[78%] bg-[#ebdcb9]/30 rounded-[1px] border border-[#f0e4cf]" />
            )}
            <span className="font-handwrite text-[9px] text-[#5C3A1E] text-center leading-none mt-1.5 truncate">
              our favorite memory ✿
            </span>
          </motion.div>
        </div>

        {/* Small floating sparkles */}
        <Sparkle className="absolute top-[22%] left-[10%] text-amber-400/50" size={16} />
        <Sparkle className="absolute bottom-[28%] right-[8%] text-violet-400/60" size={18} />
      </motion.div>
    </button>
  );
}
