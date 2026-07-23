/**
 * ScrapbookScene.tsx
 *
 * Scene 3 (POSTCARD SUITE) — Long handwritten letter on a postcard
 * back. The letter fills the LEFT half (multi-line handwritten script
 * with stagger-in animation), and the RIGHT half contains a stamp +
 * postmark + 3 dashed address lines for "To: Nicola".
 *
 * Tapping anywhere on the card advances to photo-1.
 */

import React from "react";
import { motion } from "motion/react";
import {
  PostmarkReal,
  AddressLines,
  VintageStamp,
  CoffeeStain,
  WashiTape,
  Sparkle,
  FloatingEmbers,
} from "../svg/Decorations";
import type { BirthdaySceneProps } from "../birthday.types";
import { BIRTHDAY_BADGE, BIRTHDAY_FOOTER, letterSignOff } from "../birthday.constants";
import { useAudioAmplitude } from "../../core/audioAmplitude";

export function ScrapbookScene({ content, onAdvance }: BirthdaySceneProps) {
  const letter = content.letterLines;
  const amp = useAudioAmplitude();

  return (
    <button
      type="button"
      onClick={onAdvance}
      className="relative w-full h-full flex items-center justify-center cursor-pointer px-3 sm:px-4 py-6 sm:py-10 outline-none"
      aria-label="Continue from the letter"
    >
      <FloatingEmbers count={10} />

      {/* Backdrop halo */}
      <div
        aria-hidden
        className="absolute w-[80vw] max-w-[1000px] h-[60vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(254,205,211,0.4)_0%,transparent_70%)] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{
          opacity: 1,
          y: 0,
          rotate: [-1.7, -1.3, -1.7],
        }}
        transition={{
          opacity: { delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          y: { delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] },
          rotate: { delay: 1.2, duration: 8, repeat: Infinity, ease: "easeInOut" },
        }}
        whileHover={{
          rotate: -0.5,
          scale: 1.02,
          y: -6,
          boxShadow:
            "0 8px 24px rgba(120,80,40,0.12), 0 40px 80px rgba(120,80,40,0.20)",
          transition: { type: "spring", stiffness: 200, damping: 24 },
        }}
        className="relative w-[95vw] sm:w-[88vw] max-w-[820px] aspect-[4/3] sm:aspect-[3/2] flex"
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
          color="rose"
          pattern="dots"
          width={100}
          height={20}
          rotate={-15}
          className="absolute -top-2 left-8 opacity-80"
        />

        {/* Card Header text */}
        <div className="absolute top-3 left-0 right-0 text-center font-serif italic text-[10px] tracking-[0.3em] text-[#3a2511] font-bold z-10">
          PROLOGUE · A LETTER FOR {content.recipientName?.toUpperCase()}
        </div>

        {/* Vertical division */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(229,222,201,0.8) 12%, rgba(229,222,201,0.8) 88%, transparent 100%)",
          }}
        />

        {/* LEFT half: handwritten letter */}
        <div className="relative flex-1 px-3 sm:px-7 md:px-10 pt-5 sm:pt-8 pb-4 sm:pb-6 text-left overflow-hidden">
          <h3 className="font-serif italic text-[#5C3A1E] text-sm sm:text-base md:text-lg mb-1.5 sm:mb-2">
            Dear {content.recipientName},
          </h3>
          <div className="font-handwrite text-[#3a2511] text-[11px] sm:text-[13px] md:text-[15px] leading-[1.5] sm:leading-[1.7] tracking-[0.01em] space-y-1.5 sm:space-y-2.5 max-h-[65%] sm:max-h-[68%] overflow-hidden">
            {letter.slice(0, 5).map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.22, duration: 0.6 }}
              >
                {line}
              </motion.p>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.2, duration: 0.6 }}
            className="absolute bottom-3 sm:bottom-4 left-3 sm:left-7 md:left-10 font-serif italic text-[#7c2b22] text-xs sm:text-sm"
          >
            {letterSignOff(content.recipientName)}
          </motion.div>
        </div>

        {/* RIGHT half: stamp + postmark + address */}
        <div className="relative flex-1 px-3 sm:px-7 md:px-10 pt-5 sm:pt-8 pb-4 sm:pb-6 overflow-hidden">
          {/* Stamp in top-right corner */}
          <motion.div
            initial={{ x: 180, y: -160, scale: 0.4, rotate: -45, opacity: 0 }}
            animate={{ x: 0, y: 0, scale: 1, rotate: -8, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 14,
              delay: 0.5,
              mass: 0.7,
            }}
            className="absolute -top-1 -right-2"
          >
            <VintageStamp motif="heart" color="muted-red" size={96} />
          </motion.div>

          {/* Address lines */}
          <div className="mt-24 relative h-[40%]">
            <AddressLines count={3} className="absolute inset-0" />
            {/* Handwritten "To: Nicola" overlay (using content) */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
              className="absolute top-2 left-3 font-serif italic text-[12px] text-[#3a2511]"
            >
              To: {content.recipientName}
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="absolute top-[2.4rem] left-3 font-handwrite text-sm text-[#3a2511] rotate-[-1.5deg]"
            >
              Your boy G, My HEART
            </motion.span>
          </div>

          {/* Postmark overlapping stamp */}
          <motion.div
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            transition={{ delay: 1.1, duration: 0.4 }}
            className="absolute top-4 right-12"
          >
            <PostmarkReal
              city="JAKARTA"
              date="27 · VII"
              rotate={-15}
              size={100}
            />
          </motion.div>

          {/* Quote on lower-right corner */}
          <motion.blockquote
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.7 }}
            className="absolute bottom-3 left-7 right-7 text-center font-serif italic text-[#5C3A1E] text-xs md:text-sm leading-relaxed"
          >
            " {content.scrapbookQuote} "
          </motion.blockquote>

          <Sparkle className="absolute bottom-1 right-3 text-amber-400/85" size={16} />
        </div>

      </motion.div>

      {/* Tap-to-continue hint */}
      <motion.p
        animate={{
          opacity: [0.4, 1, 0.4],
          scale: [1, 1 + amp * 0.14, 1],
        }}
        transition={{ repeat: Infinity, duration: 2.4 }}
        className="absolute bottom-[6%] left-0 right-0 text-center text-[10px] uppercase tracking-[0.4em] text-[#5b3a32] font-bold origin-center"
      >
        Tap to turn the page
      </motion.p>
    </button>
  );
}
