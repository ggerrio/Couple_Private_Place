/**
 * GiftOpeningScene.tsx
 *
 * Scene 1 (CELEBRATION SUITE) — Birthday cake with 16 candles.
 *
 * Design pivot (Feb 2026): the original "kraft envelope + tap wax seal"
 * has been replaced with a celebration cake. The user explicitly asked
 * for "happy birthday" themed instead of "surat banget" — so the iconic
 * gesture is a CAKE-CUTTING moment.
 *
 * Interaction model (Feb 2026 fix): 3-click gimik instead of the
 * previous 16-tap flow.
 *   tap 1: candles dim to ~70 % (mild flicker — "one breath in")
 *   tap 2: candles dim to ~35 % (heavier flutter — "blow harder")
 *   tap 3: all candles extinguish + confetti burst + auto-advance
 *
 * Each tap also triggers a "puff" reaction on the cake itself (small
 * squash + horizontal jitter) so the blowing reads physically instead
 * of as a counter increment.
 *
 * Layout (Feb 2026 fix): padding reduced + balloon anchor points
 * lowered so the cake frame no longer crops at the top on desktop
 * (~1024-1920 px viewports).
 *
 * Note: filename kept `GiftOpeningScene.tsx` for backward-compat with
 * the existing scene-config key "gift-open", but the EXPORTED function
 * name is now `CakeCuttingScene` (more accurate to what it does).
 */

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  BirthdayBalloon,
  CakeWithCandles,
  CelebrationSparkle,
  ConfettiScatter,
  Sparkle,
  VinylDisc,
} from "../svg/Decorations";
import { useAudioAmplitude } from "../../core/audioAmplitude";
import { useVinylRotation } from "../../core/vinylRotation";
import { playSyntheticBlowSound } from "../birthday.utils";

export interface CakeCuttingSceneProps {
  onAdvance: () => void;
}

const TOTAL_CANDLES = 16;

/**
 * Per-stage brightness plateaus. Caller tweens between these on each
 * tap so the candle flame visibly fades rather than snapping off.
 *
 *   1.0  — fully lit (initial)
 *   0.7  — tap 1 (mild dim, gentle flicker)
 *   0.35 — tap 2 (significant dim, flame leaning)
 *   0.0  — tap 3 (extinguished, smoke wisps rise)
 */
const LIT_PLATEAUS = [1, 0.7, 0.35, 0] as const;

/** UI copy that walks the user through the 3-tap arc. */
const STAGE_COPY: Array<{ eyebrow: string; hint: string; sub: string }> = [
  {
    eyebrow: "✿ NICOLA · A BOOK MADE FOR YOU ✿",
    sub:     "16 candles · 3 breaths to open your book",
    hint:    "Tap the cake to take your first breath",
  },
  {
    eyebrow: "💨 breath one",
    sub:     "1 of 3 breaths in",
    hint:    "Tap again — a little harder",
  },
  {
    eyebrow: "💨 breath two",
    sub:     "2 of 3 breaths in",
    hint:    "One last breath to unlatch the book",
  },
  {
    eyebrow: "🎉 Make a wish, Nicola! 🎉",
    sub:     "All candles extinguished · Opening your book",
    hint:    "Opening…",
  },
];

export function CakeCuttingScene({ onAdvance }: CakeCuttingSceneProps) {
  // 0 = untouched, 1 = first breath, 2 = second breath, 3 = extinguished.
  const [blowCount, setBlowCount] = useState(0);
  const [burstFired, setBurstFired] = useState(false);
  const [shutterOpen, setShutterOpen] = useState(false);
  const reduced = useReducedMotion();
  const amp = useAudioAmplitude();
  // Disc rotation reading directly from bgmController's cumulative
  // time via the vinylRotation bus (P5). When AudioContext pauses /
  // resumes, the bus freezes / resumes in lockstep because the
  // controller only publishes while isPlayingRef.current is true.
  const vinylRotation = useVinylRotation();

  // Tween stage UI label transitions on each tap so the eyebrow
  // text crossfades instead of snapping.
  const litLevel = LIT_PLATEAUS[blowCount] ?? 0;
  const allBlown = blowCount >= 3;
  const stage = STAGE_COPY[blowCount] ?? STAGE_COPY[STAGE_COPY.length - 1];

  // When the third breath finishes, fire confetti burst then auto-advance.
  useEffect(() => {
    if (!allBlown) return;
    const t1 = window.setTimeout(() => setBurstFired(true), 200);
    const t2 = window.setTimeout(() => onAdvance(), reduced ? 1300 : 2400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [allBlown, onAdvance, reduced]);

  // Cake-entry sweep shutter — two aged-paper panels meet along the
  // horizontal centerline, then slide outward in 1.0s. The unmount via
  // state keeps post-shutter React tree clean.
  useEffect(() => {
    const t = window.setTimeout(() => setShutterOpen(true), 140);
    return () => window.clearTimeout(t);
  }, []);

  // Each tap triggers a 380 ms puff-jitter on the cake so the blow
  // gesture reads as a physical punch against the cake, not as a
  // counter increment.
  const [puffKey, setPuffKey] = useState(0);

  const tap = () => {
    if (allBlown) return;
    const nextBlowCount = blowCount + 1;
    playSyntheticBlowSound(nextBlowCount >= 3);
    setBlowCount((n) => Math.min(n + 1, 3));
    setPuffKey((k) => k + 1);
  };

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center select-none px-6 py-4 gap-4 overflow-hidden"
      role="region"
      aria-label="Birthday cake scene"
    >
      {/* Background confetti scatter (gentle while candles are lit,
          ramps up once extinguished). */}
      <ConfettiScatter
        className="absolute inset-0"
        count={28}
        seed={42}
      />

      {/* Cake-entry shutter panels — two aged-paper bands meet in the
          middle then slide upward/downward off the viewport. Renders
          once, unmounts after the lift. */}
      {!shutterOpen && (
        <>
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: "-100%" }}
            transition={{ duration: 1.0, ease: [0.65, 0, 0.35, 1] }}
            className="absolute top-0 left-0 right-0 h-1/2 z-30 overflow-hidden pointer-events-none"
            aria-hidden
            style={{
              background:
                "linear-gradient(135deg, #fbf3df 0%, #f0e0bf 70%, #e8d4a6 100%)",
              boxShadow:
                "inset 0 -8px 20px rgba(120,80,40,0.18)",
            }}
          />
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: "100%" }}
            transition={{ duration: 1.0, ease: [0.65, 0, 0.35, 1] }}
            className="absolute bottom-0 left-0 right-0 h-1/2 z-30 overflow-hidden pointer-events-none"
            aria-hidden
            style={{
              background:
                "linear-gradient(135deg, #fbf3df 0%, #f0e0bf 70%, #e8d4a6 100%)",
              boxShadow:
                "inset 0 8px 20px rgba(120,80,40,0.18)",
            }}
          />
        </>
      )}

      {/* Floating balloons in corners — anchored LOWER than before so
          they don't crowd the top of the viewport on desktop. Fade-in
          delayed past the cake-entry shutter finish (1.2s) so they
          emerge WITH the cake, not THROUGH the receding shutter. */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: [-4, 4, -4], opacity: 1 }}
        transition={{
          y: { repeat: Infinity, duration: 4.2, ease: "easeInOut" },
          opacity: { delay: 1.2, duration: 0.6 },
        }}
        className="absolute top-[12%] left-[5%]"
      >
        <BirthdayBalloon size={60} color="pink" />
      </motion.div>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: [4, -4, 4], opacity: 1 }}
        transition={{
          y: { repeat: Infinity, duration: 4.6, ease: "easeInOut", delay: 0.4 },
          opacity: { delay: 1.38, duration: 0.6 },
        }}
        className="absolute top-[16%] right-[7%]"
      >
        <BirthdayBalloon size={54} color="mint" />
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{
          y: [-3, 3, -3],
          opacity: 1,
        }}
        transition={{
          y: { repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.8 },
          opacity: { delay: 1.56, duration: 0.6 },
        }}
        className="absolute top-[20%] right-[16%]"
      >
        <BirthdayBalloon size={48} color="yellow" />
      </motion.div>

      {/* Eyebrow + sub copy that walks the user through. Swaps on
          each blow with a quick crossfade. */}
      <motion.div
        key={`stage-${blowCount}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col items-center text-center"
      >
        <p
          className={`font-serif italic text-base md:text-lg uppercase tracking-[0.45em] ${
            allBlown ? "text-[#7c2b22]" : "text-[#8a6a44]"
          }`}
        >
          {stage.eyebrow}
        </p>
        <p className="font-serif italic text-xs md:text-sm tracking-wider text-[#7d5a36]/75 mt-1">
          {stage.sub}
        </p>
      </motion.div>

      {/* Cake — tappable. Cake is split into 2 layers so the CSS
          `cakePuff` keyframe (squash + tilt on tap) and the Framer
          Motion `animate` (idle float / celebration spin) never fight
          over the same `transform` property:
            • outer <div>  holds the puff keyframe (CSS only)
            • inner motion.div  holds idle + celebration (framer only) */}
      <div
        key={`puff-${puffKey}`}
        className="relative"
        style={{
          perspective: 1000,
          // Each tap retriggers a short squash-tilt that reads as
          // "the cake absorbed your breath". Gated to blowing-only so
          // the celebration spin isn't doubled-up on the 3rd tap.
          animation:
            blowCount > 0 && !allBlown
              ? "cakePuff 0.45s cubic-bezier(0.22, 1, 0.36, 1)"
              : undefined,
        }}
      >
        <motion.div
          role="button"
          tabIndex={!allBlown ? 0 : -1}
          aria-label={
            allBlown
              ? "All candles blown — confetti celebration"
              : "Tap the cake to blow out the candles"
          }
          onClick={tap}
          onKeyDown={(e) => {
            if (allBlown) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              tap();
            }
          }}
          className="relative cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60 rounded-3xl"
          whileHover={allBlown ? undefined : { scale: 1.02 }}
          whileTap={allBlown ? undefined : { scale: 0.94 }}
          animate={
            allBlown
              ? { scale: [1, 1.06, 1], rotate: [0, -2, 2, 0] }
              : { y: [0, -4, 0] }
          }
          transition={
            allBlown
              ? { duration: 1.6, repeat: Infinity }
              : { repeat: Infinity, duration: 2.6, ease: "easeInOut" }
          }
        >
          <CakeWithCandles
            litLevel={litLevel}
            candleCount={TOTAL_CANDLES}
            cakeMessage={allBlown ? "🎉" : "NICOLA"}
            width={300}
          />
        </motion.div>
      </div>

      {/* VinylDisc — compact "now spinning" badge anchored mid-left
          edge so it stays clear of the balloons (top corners) and the
          cake-tap focal area (center). At 48px it reads as a quiet
          music indicator instead of a second focal point next to the
          cake. Rotation is dictated by BGM playback via the
          vinylRotation bus, so the disc visibly confirms "audio is
          playing" without any extra UI chrome. Pointer-events-none so
          it never blocks the cake-tap funnel. */}
      <VinylDisc
        rotation={vinylRotation}
        size={48}
        className="absolute top-[46%] left-[3%] z-10 pointer-events-none drop-shadow-[0_4px_8px_rgba(58,37,17,0.30)]"
      />

      {/* Hint copy — last so the eye reads the cake first. Pulses to
          BGM amplitude via the audioAmplitude bus. */}
      <motion.p
        key={`hint-${blowCount}`}
        animate={
          allBlown
            ? { opacity: 0 }
            : {
                opacity: [0.55, 1, 0.55],
                scaleY: [1, 1 + amp * 0.16, 1],
              }
        }
        transition={
          allBlown
            ? { duration: 0.3 }
            : { repeat: Infinity, duration: 1.9 }
        }
        className="text-xs font-bold tracking-[0.32em] uppercase text-[#7d5a36] origin-bottom"
      >
        {stage.hint}
      </motion.p>

      {/* Confetti-burst on completion */}
      {burstFired && (
        <ConfettiScatter className="absolute inset-0" count={64} seed={99} />
      )}

      {/* Floating celebration sparkles on completion */}
      {allBlown && (
        <div className="absolute inset-0 pointer-events-none">
          <CelebrationSparkle
            className="absolute top-[16%] left-[12%]"
            size={56}
            color="#FFC857"
          />
          <CelebrationSparkle
            className="absolute top-[20%] right-[12%]"
            size={48}
            color="#F8C8DC"
          />
          <CelebrationSparkle
            className="absolute bottom-[18%] left-[18%]"
            size={42}
            color="#A8E6CF"
          />
          <CelebrationSparkle
            className="absolute bottom-[20%] right-[20%]"
            size={56}
            color="#FFE066"
          />
        </div>
      )}
    </div>
  );
}

// Backward-compat alias — early callers may have looked for the old name.
export { CakeCuttingScene as GiftOpeningScene };
