/**
 * EndingScene.tsx
 *
 * Scene 20 (POSTCARD SUITE) — Final postcard arrives.
 *
 * The final postcard serves as a wax-sealed envelope with a single
 * message "this letter is yours · forever" + recipient name. The
 * stamp lands with spring physics, postmark settles, and a soft
 * scrapbook-palette confetti bursts behind. Drifting petals + a
 * centered "with love, always" message frame the moment.
 *
 * The Finish button now sits z-30 with pointer-events-auto and a
 * clear focus ring so it can be clicked through any decorative SVG.
 * A secondary "Send it again" ghost button restarts the experience
 * (via engine `onReplay` → replayCount key-remount).
 */

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Sparkle,
  SparkleLarge,
  Petal,
  HeartOutline,
  Botany as BotanyImport,
  Star,
  VintageStamp,
  PostmarkReal,
  CreaseMark,
  CoffeeStain,
} from "../svg/Decorations";
import { ChevronRight, RotateCcw } from "lucide-react";
import { ScrapbookConfetti } from "../ScrapbookConfetti";
import type { BirthdaySceneProps } from "../birthday.types";
import { BIRTHDAY_FOOTER, endingBadge } from "../birthday.constants";

const Botany = BotanyImport;

export function EndingScene({ content, onAdvance, onReplay }: BirthdaySceneProps) {
  const reduced = useReducedMotion();
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setConfetti(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-6 py-10 select-none"
      role="region"
      aria-label="Final postcard"
    >
      <ScrapbookConfetti active={confetti} count={48} duration={4500} />

      <div
        aria-hidden
        className="absolute w-[78vw] max-w-[820px] h-[44vh] rounded-full bg-rose-200/25 blur-3xl pointer-events-none"
      />

      <Botany className="absolute top-[6%] left-[4%] w-16 md:w-20 opacity-60" />
      <Botany
        className="absolute bottom-[6%] right-[4%] w-20 md:w-24 opacity-60"
        flip
      />

      {/* Drifting petals — fewer + varied */}
      {!reduced &&
        Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute"
            initial={{
              y: -40,
              x: `${12 + (i * 17) % 76}vw`,
              rotate: 0,
              opacity: 0,
            }}
            animate={{
              y: ["0%", "110vh"],
              rotate: [0, 220 + i * 30],
              opacity: [0, 0.85, 0.85, 0.5, 0],
            }}
            transition={{
              duration: 9 + (i % 3),
              delay: i * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Petal
              color={
                ["#F4C4D6", "#F8D8B4", "#E5C66B", "#C5B7DA", "#B7C9A8"][i % 5]
              }
            />
          </motion.span>
        ))}

      {/* Eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="font-serif italic text-xs md:text-sm uppercase tracking-[0.35em] text-[#705646] mb-4"
      >
        EPILOGUE · FOR {content.recipientName?.toUpperCase()}
      </motion.p>

      {/* Final book back cover */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-[520px] aspect-[16/10] w-[82vw] z-10 p-6 rounded-[4px] shadow-[0_24px_48px_rgba(44,38,35,0.12)] flex flex-col justify-between"
      >
        {/* Fine paper background */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[4px] pointer-events-none"
          style={{
            background: "linear-gradient(135deg, #FAF8F5 0%, #F4EFE6 60%, #EFE8DC 100%)",
          }}
        />

        {/* Top eyebrow */}
        <div className="relative pt-1 pb-2 border-b border-[#E5DEC9] flex items-baseline justify-between">
          <span className="font-serif italic text-[10px] uppercase tracking-[0.25em] text-[#705646]">
            EPILOGUE
          </span>
          <span className="font-mono text-[9px] tracking-widest text-[#705646]/70">
            27 · VII
          </span>
        </div>

        {/* Big handwritten message */}
        <div className="relative flex-1 flex items-center justify-center py-4 px-6 text-center">
          <div className="space-y-3 max-w-[80%]">
            <h2 className="font-serif text-2xl md:text-4xl text-[#3a2511] leading-tight">
              {content.endingMessage}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-4 text-[#7d5a36]">
              <HeartOutline className="text-rose-500" size={16} />
              <span className="font-serif italic text-base tracking-wider">
                {content.recipientName}
              </span>
              <HeartOutline className="text-rose-500" size={16} />
            </div>
            <p className="font-handwrite text-base md:text-lg text-[#3a2511] italic mt-3">
              this letter is yours — buat selamanya.
            </p>
          </div>
        </div>

        {/* Stamp + postmark cluster */}
        <motion.div
          initial={{ x: 200, y: -180, scale: 0.4, rotate: -45, opacity: 0 }}
          animate={{ x: 0, y: 0, scale: 1, rotate: -8, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 14,
            delay: 1.2,
            mass: 0.7,
          }}
          className="absolute -bottom-5 -right-2 flex items-end justify-end gap-2 w-[180px]"
        >
          <VintageStamp motif="heart" color="muted-red" size={86} />
          <PostmarkReal
            city="JAKARTA"
            date="27 · VII"
            rotate={-12}
            size={100}
          />
        </motion.div>

        {/* Tiny footer */}
        <div className="absolute bottom-1 left-0 right-0 text-center font-serif italic text-[8px] tracking-[0.4em] text-[#5b3a32]/40">
          ✿ sixteen memories — forever ✿
        </div>
      </motion.div>

      {/* Decorative ornaments around card */}
      <SparkleLarge className="absolute top-[10%] left-[8%] text-amber-400/60" size={36} />
      <Star className="absolute -bottom-2 right-2 text-rose-300/70" size={28} />
      <Sparkle className="inline-block text-amber-400 ml-1 mt-3" size={14} />

      {/* Replay + Finish buttons grouped — explicit z-30 + pointer-events-auto
          so they intercept clicks despite decorative SVGs on top. Replay is a
          ghost button (cream bg, brown border/text); Finish stays primary
          (solid brown). Both spring-in for visual rhythm at end-of-experience. */}
      <div className="relative z-30 mt-8 flex items-center justify-center gap-3">
        {onReplay && (
          <motion.button
            type="button"
            onClick={onReplay}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 160,
              damping: 22,
              delay: 1.3,
              duration: 0.6,
            }}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-[#fbf3df] text-[#5C3A1E] text-sm font-serif italic border border-[#5C3A1E]/30 cursor-pointer pointer-events-auto shadow-[0_6px_16px_rgba(120,80,40,0.18)] hover:bg-[#f0e0bf] focus:outline-none focus:ring-2 focus:ring-amber-300/70 focus:ring-offset-2 focus:ring-offset-[#fbf3df]"
            aria-label="Replay the birthday experience from the start"
          >
            <RotateCcw className="w-4 h-4" aria-hidden />
            Send it again
          </motion.button>
        )}
        <motion.button
          type="button"
          onClick={onAdvance}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 160,
            damping: 22,
            delay: 1.4,
            duration: 0.6,
          }}
          className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#5C3A1E] text-amber-50 text-sm font-serif italic shadow-[0_12px_28px_rgba(60,30,0,0.30)] cursor-pointer pointer-events-auto focus:outline-none focus:ring-2 focus:ring-amber-300/70 focus:ring-offset-2 focus:ring-offset-[#fbf3df]"
          aria-label="Finish and close the birthday experience"
        >
          Finish
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      <motion.p
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="absolute bottom-[4%] left-0 right-0 text-center text-[10px] uppercase tracking-[0.4em] text-[#5b3a32] font-bold"
      >
        Until the next postcard ✿
      </motion.p>
    </div>
  );
}
