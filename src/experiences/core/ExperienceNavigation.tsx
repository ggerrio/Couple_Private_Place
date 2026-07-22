/**
 * ExperienceNavigation.tsx
 *
 * Floating bottom-center nav row. Three controls:
 *   - Back   (← chevron)
 *   - Skip   (close button)
 *   - Next   (→ chevron)
 *
 * Hover lifts subtly; respects disabled state at first/last.
 */

import React from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface ExperienceNavigationProps {
  onPrev?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  canPrev: boolean;
  canNext: boolean;
  placement?: "top" | "bottom";
  showLabels?: boolean;
}

export function ExperienceNavigation({
  onPrev,
  onNext,
  onSkip,
  canPrev,
  canNext,
  showLabels = false,
}: ExperienceNavigationProps) {
  const baseBtn =
    "flex items-center justify-center w-11 h-11 rounded-full bg-white/70 dark:bg-stone-900/65 text-[#5C3A1E] dark:text-amber-100 shadow-[0_4px_14px_rgba(120,90,60,0.18)] backdrop-blur-md border border-white/60 dark:border-white/10 transition-colors hover:bg-white dark:hover:bg-stone-800";

  const disabledBtn =
    "opacity-40 cursor-not-allowed pointer-events-none";

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 z-[100] flex items-center justify-center gap-3"
      style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      data-experience-nav
    >
      <motion.button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        whileTap={{ scale: 0.92 }}
        aria-label="Previous scene (Left arrow)"
        className={`${baseBtn} ${!canPrev ? disabledBtn : ""}`}
      >
        <ChevronLeft className="w-5 h-5" />
      </motion.button>
      <motion.button
        type="button"
        onClick={onSkip}
        whileTap={{ scale: 0.92 }}
        aria-label="Close experience (Escape)"
        className={baseBtn}
      >
        <X className="w-4 h-4" />
      </motion.button>
      <motion.button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        whileTap={{ scale: 0.92 }}
        aria-label="Next scene (Right arrow)"
        className={`${baseBtn} ${!canNext ? disabledBtn : ""}`}
      >
        <ChevronRight className="w-5 h-5" />
      </motion.button>
      {showLabels && (
        <span className="sr-only">Use arrow keys to navigate, Escape to close.</span>
      )}
    </motion.div>
  );
}
