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

  // Dedicated photo for Slide 3 (CHAPTER I · THE ESSENCE OF YOU)
  // Index 16 (photo17) prevents sharing photo 1 with Slide 5
  const polaroidPhoto = photos?.[16] ?? photos?.[0];

  return (
    <button
      type="button"
      onClick={onAdvance}
      className="relative w-full h-full flex items-center justify-center cursor-pointer px-3 sm:px-4 py-8 sm:py-10 outline-none select-none"
      aria-label="Continue to the letter"
    >
      <FloatingEmbers count={12} />

      {/* Decorative backdrop glow (turns deep violet when purple vibe is active) */}
      <div
        aria-hidden
        className={`absolute w-[80vw] max-w-[1000px] h-[60vh] rounded-full transition-colors duration-1000 pointer-events-none ${purpleVibe ? "bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.3)_0%,transparent_70%)]" : "bg-[radial-gradient(circle_at_center,rgba(254,205,211,0.25)_0%,transparent_70%)]"
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
        className="relative w-[95vw] sm:w-[88vw] max-w-[820px] min-h-[50vh] sm:aspect-[3/2] flex flex-col sm:flex-row overflow-y-auto sm:overflow-hidden"
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
        <div className="absolute top-3 left-0 right-0 text-center font-serif italic text-[10px] tracking-[0.3em] text-[#3a2511] z-10 font-bold">
          LITTLE THINGS I LOVE ABOUT YOU
        </div>

        {/* Vertical divider */}
        <div
          aria-hidden
          className="hidden sm:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(229,222,201,0.8) 12%, rgba(229,222,201,0.8) 88%, transparent 100%)",
          }}
        />

        {/* LEFT PAGE: Poetic list of little things I love about Nicola */}
        <div
          data-testid="left-page-column"
          className="relative flex-1 px-3 sm:px-5 pt-6 sm:pt-8 pb-3 sm:pb-5 flex flex-col justify-between items-start overflow-hidden text-left"
        >
          <div className="w-full flex flex-col gap-2 mt-1">
            <span className="font-serif italic text-[10px] md:text-xs uppercase tracking-[0.2em] text-[#705646] font-bold">
              Little Things I Love About You
            </span>
            <div className="w-8 h-px bg-[#705646]/40 mb-1" />

            <div className="flex flex-col gap-2.5">
              {[
                "The way your smile always arrives before your words.",
                "The way you get excited over the smallest things.",
                "The sparkle in your eyes whenever something makes you genuinely happy.",
                "The way hearing your voice can instantly make everything feel lighter.",
                "The comfort of knowing you're only one message away, even across the distance.",
                "The way you always manage to calm the chaos inside my mind.",
                "How you became my safe place without ever trying to be.",
                "The way you make me want to become a better man, little by little.",
                "The way 'my baby girl' stopped being just a nickname and quietly became my favorite person.",
                "And maybe... it was never just one thing. It has always been you."
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.35, duration: 0.6, ease: "easeOut" }}
                  className="flex items-start gap-1"
                >
                  <span className="text-[#7c2b22] text-[10px] sm:text-xs mt-0.5 select-none">✿</span>
                  <p className="font-handwrite text-[11px] sm:text-[13px] md:text-[15px] text-[#3a2511] font-bold leading-snug sm:leading-tight">
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Age milestone at the bottom */}
          <motion.div
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + 7 * 0.35 + 0.2, duration: 0.7 }}
            className="w-full border-t border-[#dfd0bd]/60 pt-2 flex flex-col items-center text-center mt-3"
          >
            <span className="font-serif text-[#7c2b22] font-extrabold text-sm md:text-base tracking-widest uppercase">
              Twenty-one.
            </span>
            <span className="font-serif italic text-[9px] md:text-[10px] text-[#705646] font-semibold mt-0.5 leading-snug">
              Yet somehow, every year only makes you more wonderful.
            </span>
          </motion.div>
        </div>

        {/* RIGHT PAGE: Doodles (Rabbit & Fawn) at the top, Polaroid photo at the bottom */}
        <div className="relative flex-1 px-4 sm:px-8 pt-6 sm:pt-10 pb-3 sm:pb-6 flex flex-col justify-between items-center overflow-hidden">
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

          {/* Polaroid Photo Frame (Original proportions, slim bottom border) */}
          <motion.div
            whileHover={{ scale: 1.03, rotate: -1.5 }}
            className="interactive-target mt-1 p-1.5 pb-2 bg-[#fefdfa] border border-[#ebdcb9] shadow-md rounded-[2px] w-[80%] sm:w-[62%] aspect-[4/5] flex flex-col justify-between relative select-none"
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
            {polaroidPhoto ? (
              <div className="relative w-full flex-1 bg-[#ebdcb9]/40 overflow-hidden rounded-[1px] border border-[#f0e4cf]">
                <img src={polaroidPhoto.src} className="w-full h-full object-cover" alt="Nicola memory" />
                <div className="absolute inset-0 bg-[#8b5a2b]/5 mix-blend-overlay" />
              </div>
            ) : (
              <div className="w-full flex-1 bg-[#ebdcb9]/30 rounded-[1px] border border-[#f0e4cf]" />
            )}
            <span className="font-handwrite text-xs md:text-sm font-bold text-[#4a2b13] text-center leading-none mt-1.5 truncate">
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
