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
  const [relax, setRelax] = useState(false);
  const [isLastFrame, setIsLastFrame] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setConfetti(true), 600);
    const tr = window.setTimeout(() => setRelax(true), 4500);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(tr);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10 select-none"
      role="region"
      aria-label="Final postcard"
    >
      <ScrapbookConfetti active={confetti} count={48} duration={4500} />

      <div
        aria-hidden
        className="absolute w-[78vw] max-w-[820px] h-[44vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(254,205,211,0.35)_0%,transparent_70%)] pointer-events-none"
      />

      <Botany className="absolute top-[6%] left-[4%] w-16 md:w-20 opacity-60" />
      <Botany
        className="absolute bottom-[6%] right-[4%] w-20 md:w-24 opacity-60"
        flip
      />

      {/* Drifting petals */}
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
              opacity: relax
                ? [0, 0.4, 0.4, 0.22, 0]
                : [0, 0.85, 0.85, 0.5, 0],
            }}
            transition={{
              duration: (9 + (i % 3)) * (relax ? 1.8 : 1),
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
        className="font-serif italic text-xs md:text-sm uppercase tracking-[0.35em] text-[#3a2511] font-bold mb-4"
      >
        EPILOGUE · FOR {content.recipientName?.toUpperCase()}
      </motion.p>

      {/* Final book back cover */}
      <motion.div
        key={isLastFrame ? "last-frame" : "first-frame"}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-[520px] aspect-[4/3] sm:aspect-[16/10] w-[88vw] sm:w-[82vw] z-10 p-4 sm:p-6 rounded-[4px] shadow-[0_24px_48px_rgba(44,38,35,0.12)] flex flex-col justify-between"
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
          <span className="font-serif italic text-[10px] uppercase tracking-[0.25em] text-[#3a2511] font-bold">
            EPILOGUE
          </span>
          <span className="font-mono text-[9px] tracking-widest text-[#3a2511]/80">
            27 · VII
          </span>
        </div>

        {/* Main message rendering based on frame state */}
        <div className="relative flex-1 flex flex-col items-center justify-center py-4 px-2 text-center gap-3">
          {!isLastFrame ? (
            <>
              <h2 className="font-serif italic text-xl md:text-2xl text-[#3a2511] font-extrabold leading-snug max-w-[90%]">
                "No matter how many birthdays come after this..."
              </h2>
              <p className="font-handwrite text-lg md:text-xl text-[#7c2b22] font-bold italic max-w-[85%] mt-1.5">
                I hope I still get to celebrate them with you.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-serif italic text-2xl md:text-3xl text-[#7c2b22] font-extrabold leading-tight tracking-wide">
                Happy Birthday, Sweetheart.
              </h2>
              <p className="font-handwrite text-lg md:text-2xl text-[#3a2511] font-bold italic mt-2.5">
                I'll never get tired... of writing our story.
              </p>
            </>
          )}
        </div>

        {/* Stamp + postmark cluster */}
        <motion.div
          initial={{ x: 100, y: 100, scale: 0.8, opacity: 0 }}
          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
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
      <SparkleLarge className="absolute top-[10%] left-[8%] text-amber-400/60 pointer-events-none" size={36} />
      <Star className="absolute -bottom-2 right-2 text-rose-300/70 pointer-events-none" size={28} />

      {/* Buttons */}
      <div className="relative z-30 mt-8 flex items-center justify-center gap-3">
        {!isLastFrame ? (
          <motion.button
            type="button"
            onClick={() => setIsLastFrame(true)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#5C3A1E] text-amber-50 text-sm font-serif italic shadow-[0_12px_28px_rgba(60,30,0,0.30)] cursor-pointer pointer-events-auto focus:outline-none focus:ring-2 focus:ring-amber-300/70"
          >
            Turn to the last page
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        ) : (
          <>
            {onReplay && (
              <motion.button
                type="button"
                onClick={onReplay}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-[#fbf3df] text-[#5C3A1E] text-sm font-serif italic border border-[#5C3A1E]/30 cursor-pointer pointer-events-auto shadow-[0_6px_16px_rgba(120,80,40,0.18)] hover:bg-[#f0e0bf] focus:outline-none"
                aria-label="Replay the birthday experience"
              >
                <RotateCcw className="w-4 h-4" />
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
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#5C3A1E] text-amber-50 text-sm font-serif italic shadow-[0_12px_28px_rgba(60,30,0,0.30)] cursor-pointer pointer-events-auto focus:outline-none"
            >
              Finish
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </>
        )}
      </div>

      <motion.p
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="absolute bottom-[4%] left-0 right-0 text-center uppercase tracking-[0.4em] text-[#5b3a32] font-bold text-[10px]"
      >
        Until the next chapter ✿
      </motion.p>
    </div>
  );
}
