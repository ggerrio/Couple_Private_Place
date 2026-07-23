/**
 * ExperienceProgress.tsx
 *
 * Minimal top-center progress indicator. Replaces the previous 24-heart
 * glyph row with a thin animated fill bar + a quiet "n / N" fraction
 * counter. Reduces visual noise, doesn't spoil total count at a glance,
 * and uses a smooth spring-animated width transition so progress reads
 * as continuous, not stepped.
 *
 * The bar is 120px on mobile, up to 200px on wider screens; the fraction
 * text is 9px font — just visible enough to orient without dominating.
 * A small heart glyph sits at the fill position and pulses on beat.
 */

import React from "react";
import { motion } from "motion/react";

export type ExperienceProgressVariant = "dots" | "bar" | "heart";

export interface ExperienceProgressProps {
  /** Total number of scenes. */
  total?: number;
  /** Current 0-indexed scene. */
  currentIndex?: number;
  variant?: ExperienceProgressVariant;
  sceneConfigs?: { id: string; title?: string }[];
}

export function ExperienceProgress({
  total,
  currentIndex = 0,
  variant = "heart",
  sceneConfigs,
}: ExperienceProgressProps) {
  const computedTotal = total ?? sceneConfigs?.length ?? 0;
  if (computedTotal <= 0) return null;

  const progressPct = ((currentIndex + 1) / computedTotal) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#1A1412]/90 dark:bg-black/90 backdrop-blur-md border border-white/30 shadow-lg"
      style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
      data-experience-progress
      data-variant={variant}
    >
      {/* Thin progress bar */}
      <div className="relative w-[100px] md:w-[160px] h-[4px] rounded-full bg-white/20 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 20,
          }}
        />
        {/* Heart marker at fill position — gently pulses */}
        <motion.span
          className="absolute top-1/2 -translate-y-1/2 text-[10px] text-rose-400 leading-none select-none pointer-events-none"
          style={{ left: `${progressPct}%`, transform: `translateX(-50%) translateY(-50%)` }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          aria-hidden
        >
          ♥
        </motion.span>
      </div>

      {/* Fraction counter */}
      <span
        className="font-mono text-xs font-bold tracking-[0.14em] text-white tabular-nums select-none min-w-[2.5em] text-center drop-shadow-sm"
        aria-label={`Scene ${currentIndex + 1} of ${computedTotal}`}
      >
        {currentIndex + 1}
        <span className="text-white/70 font-semibold"> / </span>
        {computedTotal}
      </span>
    </motion.div>
  );
}
