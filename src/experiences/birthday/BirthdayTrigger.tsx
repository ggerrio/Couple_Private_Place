/**
 * BirthdayTrigger.tsx
 *
 * Splits "what gets pressed" from "what happens after".
 *
 *   useBirthdayTrigger(opts)
 *     Returns { isOpen, open, close } + opt-in auto-fire support.
 *     By default the trigger is MANUAL: nothing fires on mount.
 *     If opts.autoFireOnBirthday is true, it auto-opens once on
 *     Nicola's birthday (with the localStorage-flag dedupe pattern
 *     that mirrors useConfetti in ConfettiEffect.tsx).
 *
 *   BirthdayReplayButton
 *     "Open Birthday Gift" CTA the host embeds in HomeView. Calls
 *     open() from the hook. Visual: a tactile sticker-style button
 *     with gift-box iconography.
 */

import { useCallback, useEffect, useState } from "react";
import {
  isBirthdayToday,
  hasFiredToday,
  markFiredToday,
} from "./birthday.utils";
import type { BirthdayTriggerState } from "./birthday.types";

export interface UseBirthdayTriggerOptions {
  /** Birthday string in MM-DD format. Pass the recipient's birthday. */
  birthdayMmDd?: string;
  /** When true, auto-opens once per day on a birthday match. */
  autoFireOnBirthday?: boolean;
}

export function useBirthdayTrigger(
  opts: UseBirthdayTriggerOptions = {},
): BirthdayTriggerState {
  const { birthdayMmDd, autoFireOnBirthday = false } = opts;
  const [isOpen, setOpen] = useState(false);

  const isEligible = !!birthdayMmDd && isBirthdayToday(birthdayMmDd);

  useEffect(() => {
    if (!autoFireOnBirthday) return;
    if (!isEligible) return;
    if (hasFiredToday()) return;
    setOpen(true);
    markFiredToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFireOnBirthday, isEligible]);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  return { isOpen, open, close };
}

// ── UI: "Open Birthday Gift" button ──────────────────────────────────

export interface BirthdayReplayButtonProps {
  onOpen: () => void;
  className?: string;
  label?: string;
}

import { Gift } from "lucide-react";
import { motion } from "motion/react";

export function BirthdayReplayButton({
  onOpen,
  className,
  label = "Open Birthday Gift",
}: BirthdayReplayButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileHover={{ y: -2, rotate: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 18 }}
      className={
        className ??
        "group relative inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl border border-[#E8B4B8]/60 dark:border-rose-900/40 bg-[#FDFBF7] dark:bg-stone-900 shadow-[0_8px_24px_rgba(180,140,120,0.18)] hover:shadow-[0_14px_32px_rgba(180,140,120,0.28)] transition-shadow cursor-pointer select-none"
      }
      aria-label="Open your birthday gift"
    >
      {/* Outer ribbon sticker band — corner ornaments */}
      <span className="absolute -top-1.5 left-6 w-12 h-3 bg-[#D4A574]/55 -rotate-3 rounded-[2px] pointer-events-none shadow-[0_1px_3px_rgba(122,90,58,0.15)]" />
      <span className="absolute -bottom-1.5 right-8 w-12 h-3 bg-[#D4A574]/55 rotate-2 rounded-[2px] pointer-events-none shadow-[0_1px_3px_rgba(122,90,58,0.15)]" />

      <Gift className="w-4 h-4 text-[#B1762E] dark:text-amber-300 transition-transform group-hover:scale-110" />
      <span className="text-sm font-bold tracking-wider text-[#5C3A1E] dark:text-amber-100">
        {label}
      </span>
      <span aria-hidden className="text-base">🎁</span>
    </motion.button>
  );
}
