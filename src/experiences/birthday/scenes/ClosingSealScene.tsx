/**
 * ClosingSealScene.tsx
 *
 * Scene between photo-16 and the ending card — a wax seal motif drops
 * from the top, the celebrant's first-letter initial resolves, two
 * printed lines fade in, then auto-advance to EndingScene. Tap also
 * skips.
 *
 * Why a standalone scene (not another decoration on photo-16):
 *   • Gives the journey a clear "ceremony" beat before the closing
 *     card — Apple-Keynote-style "second-biggest-moment" rule.
 *   • Decouples the seal from the photo-grid's busy chrome so it
 *     gets its own moment to be admired.
 *   • 4-second duration (or 2.2s reduced-motion) — long enough to
 *     read, short enough not to extend the journey noticeably.
 *
 * Added after a photo-16 → before `ending` per `BIRTHDAY_SCENES`
 * array order, and wired to the `seal-close` BirthdaySceneId union
 * member + BASE_COMPONENT_MAP entry in BirthdayExperience.tsx.
 */

import React, { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WaxSeal, Sparkle, SparkleLarge } from "../svg/Decorations";
import type { BirthdaySceneProps } from "../birthday.types";
import { BIRTHDAY_BADGE } from "../birthday.constants";
import { useAudioAmplitude } from "../../core/audioAmplitude";

export function ClosingSealScene({ content, onAdvance }: BirthdaySceneProps) {
  const reduced = useReducedMotion();
  const amp = useAudioAmplitude();

  // Both tap AND auto-advance should fire onAdvance exactly once.
  useEffect(() => {
    const t = window.setTimeout(onAdvance, reduced ? 2200 : 7500);
    return () => window.clearTimeout(t);
  }, [onAdvance, reduced]);

  const initial = (content.recipientName || "N").charAt(0).toUpperCase();

  return (
    <div
      role="region"
      aria-label="Closing wax seal scene"
      onClick={onAdvance}
      className="relative w-full h-full flex flex-col items-center justify-center select-none px-6 py-10 gap-6 overflow-hidden cursor-pointer"
    >
      {/* Soft warm glow + paper grain */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, rgba(250,248,245,0.98), rgba(244,239,230,0.96) 45%, rgba(229,222,201,0.92))",
        }}
      />

      {/* Top eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="font-serif italic text-xs md:text-sm uppercase tracking-[0.35em] text-[#705646]"
      >
        THE COLLECTOR'S SEAL
      </motion.p>

      {/* Wax seal drops from above the viewport, settles, gently pulses
          to the BGM amplitude so it reads as "still alive" without being
          distracting. */}
      <motion.div
        initial={{ y: -260, opacity: 0, rotate: -8, scale: 0.65 }}
        animate={
          reduced
            ? { y: 0, opacity: 1, rotate: -2, scale: 1 }
            : {
                y: [-260, 0, 4, -2, 0],
                scaleY: [0.65, 1, 0.82, 1.05, 1 + amp * 0.06],
                scaleX: [0.65, 1, 1.15, 0.98, 1 + amp * 0.06],
                rotate: [-8, -8, 2, -2, -2],
                opacity: [0, 1, 1, 1, 1],
              }
        }
        transition={
          reduced
            ? { duration: 0.5 }
            : {
                duration: 1.8,
                times: [0, 0.22, 0.3, 0.42, 1],
                ease: "easeOut",
                delay: 0.25,
              }
        }
        className="relative mt-2 z-10"
      >
        <WaxSeal initial={initial} size={132} color="crimson" pressDelay={0.65} />
      </motion.div>

      {/* Physical wooden/brass stamp overlay tool drops, presses down, and lifts back up */}
      {!reduced && (
        <motion.div
          initial={{ y: -340, scale: 1.4, opacity: 0, rotate: -15 }}
          animate={{
            y: [-340, 25, 45, -340], // Drop down, press/squash, lift away
            opacity: [0, 1, 1, 0],
            scale: [1.4, 1.05, 0.94, 1.4],
            rotate: [-15, -8, -5, -15],
          }}
          transition={{
            duration: 2.0,
            times: [0, 0.22, 0.32, 1],
            ease: "easeInOut",
            delay: 0.25,
          }}
          className="absolute z-20 pointer-events-none origin-bottom"
          style={{
            transformOrigin: "center 80px", // Align rotation around the stamp brass head
          }}
        >
          <svg viewBox="0 0 64 128" width="80" height="160" className="text-[#a37a3a] drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]">
            {/* Wooden Handle */}
            <path d="M32 12 C18 12, 18 36, 28 64 C28 72, 22 80, 22 86 L42 86 C42 80, 36 72, 36 64 C46 36, 46 12, 32 12 Z" fill="#8b5a2b" stroke="#5c3a21" strokeWidth="1" />
            {/* Wooden Handle Grain lines */}
            <path d="M32 18 C28 30, 28 50, 32 60" stroke="#5c3a21" strokeWidth="0.8" fill="none" opacity="0.4" />
            {/* Brass Base Collar */}
            <path d="M22 86 L42 86 L44 100 L20 100 Z" fill="#D4AF37" stroke="#aa7c11" strokeWidth="1" />
            <ellipse cx="32" cy="100" rx="12" ry="4" fill="#AA7C11" />
            {/* Reflection shine */}
            <path d="M24 88 L26 98" stroke="#FFF" strokeWidth="1" opacity="0.45" />
          </svg>
        </motion.div>
      )}

      {/* Closing message — celebrant's first name resolves softly */}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7 }}
        className="font-serif italic text-3xl md:text-5xl text-[#3a2511] text-center leading-tight"
      >
        For {content.recipientName}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.7 }}
        className="font-handwrite text-base md:text-lg text-[#5c3a1e] italic text-center max-w-[80%]"
      >
        sealed with love — today and always ✿
      </motion.p>

      {/* Decorative sparkles — quiet, away from the seal focal point */}
      <Sparkle
        className="absolute top-[18%] left-[12%] text-amber-400/70"
        size={20}
      />
      <Sparkle
        className="absolute top-[28%] right-[14%] text-rose-400/60"
        size={24}
      />
      <SparkleLarge
        className="absolute bottom-[26%] left-[18%] text-amber-300/40"
        size={32}
      />

      {/* Auto-advance hint copy — gently pulses to BGM amplitude */}
      <motion.p
        animate={{
          opacity: [0.42, 0.42 + amp * 0.55, 0.42],
          scale: [1, 1 + amp * 0.14, 1],
        }}
        transition={{ repeat: Infinity, duration: 2.4 }}
        className="absolute bottom-[6%] left-0 right-0 text-center text-[10px] uppercase tracking-[0.4em] text-[#5b3a32] font-bold"
      >
        one last postcard — almost there ✦
      </motion.p>
    </div>
  );
}
