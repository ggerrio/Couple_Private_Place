/**
 * IntroScene.tsx
 *
 * Scene 2 (POSTCARD SUITE) — Postcard delivery reveal.
 *
 * A single large vintage postcard slides into view from below. The
 * recipient name "NICOLA" fades in character-by-character. Beneath
 * the headline: "a postcard from Jakarta · 27 VII" small caps.
 *
 * Auto-advances after 7 seconds so user has time to consume.
 */

import React from "react";
import { motion } from "motion/react";
import {
  Sparkle,
  FloatingEmbers,
  Botany as BotanyImport,
  VintageStamp,
  PostmarkReal,
} from "../svg/Decorations";
import type { BirthdaySceneProps } from "../birthday.types";
import { BIRTHDAY_BADGE, openingLine } from "../birthday.constants";
import { useAudioAmplitude } from "../../core/audioAmplitude";

const Botanical = BotanyImport;

export interface IntroSceneProps extends BirthdaySceneProps { }

export function IntroScene({ content, onAdvance }: BirthdaySceneProps) {
  const nameLetters = (content.heroText || "").split("");
  const subtitle = content.heroSubtitle || "A Postcard for You";
  const amp = useAudioAmplitude();
  return (
    <div
      role="region"
      aria-label="Birthday hero scene"
      className="relative w-full h-full flex flex-col items-center justify-center px-6 py-10 gap-6"
    >
      <FloatingEmbers count={22} />

      {/* Soft warm glow */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="h-[60vh] max-h-[600px] w-[80vw] max-w-[900px] rounded-full bg-amber-200/30 blur-3xl" />
      </div>

      {/* Botanical sprig in corners */}
      <Botanical className="absolute top-8 left-6 md:top-16 md:left-16 w-16 md:w-20 opacity-65" />
      <Botanical
        className="absolute bottom-8 right-6 md:bottom-16 md:right-16 w-20 md:w-24 opacity-65"
        flip
      />

      {/* Subtitle eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="font-serif italic text-xs md:text-sm uppercase tracking-[0.35em] text-[#3a2511] font-bold text-center"
      >
        PREFACE · A BOOK FOR {content.recipientName?.toUpperCase()}
      </motion.p>

      {/* Big title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="font-serif text-[clamp(32px,6vw,64px)] leading-tight text-[#2C2623] tracking-tight text-center max-w-[90%] font-extrabold italic"
      >
        A Book Made Only For You
      </motion.h1>

      {/* Book Title Card / Preface Frame */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.4, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[88vw] max-w-[560px] p-6 md:p-8 rounded-[4px] shadow-[0_20px_40px_rgba(44,38,35,0.10)] flex flex-col justify-between"
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-[4px] pointer-events-none"
          style={{
            background: "linear-gradient(135deg, #FAF8F5 0%, #F4EFE6 60%, #EFE8DC 100%)",
          }}
        />

        <div className="relative z-10 h-full flex flex-col justify-between gap-4">
          <div className="flex items-baseline justify-between border-b border-[#E5DEC9] pb-2">
            <span className="font-serif italic text-[10px] uppercase tracking-[0.25em] text-[#705646]">
              {BIRTHDAY_BADGE.UPPER}
            </span>
            <span className="font-mono text-[9px] tracking-widest text-[#705646]/70">
              27 · VII
            </span>
          </div>

          <div className="flex-grow flex flex-col items-center justify-center py-2 gap-2.5 text-center">
            <p className="font-serif italic text-[#3a2511] text-sm md:text-base leading-relaxed max-w-[92%] font-medium">
              "Not every memory fits inside a photograph."
            </p>
            <p className="font-serif italic text-[#3a2511] text-sm md:text-base leading-relaxed max-w-[92%] font-medium">
              "Some quietly stay inside the heart."
            </p>
            <p className="font-serif italic text-[#3a2511] text-sm md:text-base leading-relaxed max-w-[92%] font-medium">
              "Tonight, I'd like to share a few of mine with you."
            </p>
          </div>

          <div className="border-t border-[#E5DEC9] pt-2 text-center">
            <span className="font-serif italic text-[10px] tracking-[0.3em] text-[#705646]/60 uppercase">
              ✿ dedicated to my Sweetheart ✿
            </span>
          </div>
        </div>
      </motion.div>

      {/* Skip-ahead affordance */}
      <motion.button
        type="button"
        onClick={onAdvance}
        animate={{
          opacity: [0.7, 0.7 + amp * 0.3, 0.7],
          scale: [1, 1 + amp * 0.1, 1],
        }}
        transition={{ repeat: Infinity, duration: 2.4 }}
        className="absolute bottom-[6%] right-6 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.35em] text-[#705646] hover:text-[#2C2623] font-bold focus:outline-none rounded-sm px-2 py-1"
        aria-label="Skip to the next scene"
      >
        Turn Page
        <span aria-hidden>›</span>
      </motion.button>
    </div>
  );
}
