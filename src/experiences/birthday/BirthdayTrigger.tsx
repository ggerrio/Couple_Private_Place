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
import { preArmAudio } from "./birthdayGesture";
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

// ── UI: "Open Your Birthday Gift" button ── Scrapbook Romantic Theme ──

export interface BirthdayReplayButtonProps {
  onOpen: () => void;
  className?: string;
  label?: string;
}

import { motion } from "motion/react";

export function BirthdayReplayButton({
  onOpen,
  className,
  label = "Open Your Birthday Gift",
}: BirthdayReplayButtonProps) {

  const handleClick = () => {
    preArmAudio();
    onOpen();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 15 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={className ?? "fixed bottom-20 left-6 sm:bottom-[160px] sm:left-10 z-50"}
    >
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{ scale: 1.05, y: -3 }}
        whileTap={{ scale: 0.97 }}
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="group relative px-5 py-3 rounded-xl 
          bg-[#FDF6F0] dark:bg-[#2A1F1A] 
          backdrop-blur-sm
          border-2 border-dashed border-[#C4A882]/60 dark:border-[#8B7355]/50
          shadow-[4px_4px_0px_#C4A882/30] dark:shadow-[4px_4px_0px_#5C4A3A]
          hover:shadow-[6px_6px_0px_#A08060/40] dark:hover:shadow-[6px_6px_0px_#7A6048]
          hover:border-[#A08060]/80 dark:hover:border-[#B8966E]/70
          flex items-center gap-3 cursor-pointer select-none
          transition-colors duration-500"
        title={label}
        aria-label={label}
      >
        {/* Hand-drawn style decorative corner marks */}
        <span className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#8B7355]/40 dark:border-[#B8966E]/40 rounded-tl-sm" />
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#8B7355]/40 dark:border-[#B8966E]/40 rounded-tr-sm" />
        <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#8B7355]/40 dark:border-[#B8966E]/40 rounded-bl-sm" />
        <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#8B7355]/40 dark:border-[#B8966E]/40 rounded-br-sm" />

        {/* Subtle washi tape strip at top */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 
          bg-[#E8D5C4]/70 dark:bg-[#5C4A3A]/60 
          rotate-[-2deg] rounded-sm
          border border-[#C4A882]/20"
        />

        {/* Pulsing heart notification dot */}
        <span className="absolute -top-2 -right-2 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C75B5B]/60 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-[#C75B5B] 
            shadow-sm flex items-center justify-center">
            <span className="text-[8px] text-white">♥</span>
          </span>
        </span>

        {/* Gift icon with gentle float */}
        <motion.span
          animate={{ y: [-1, 1.5, -1], rotate: [-1, 1, -1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-lg select-none"
        >
          🎁
        </motion.span>

        {/* Label text */}
        <span className="text-sm font-medium tracking-wide
          text-[#5C4033] dark:text-[#D4B896]
          font-serif">
          {label}
        </span>

        {/* Small decorative flourish */}
        <span className="text-[#C4A882]/50 dark:text-[#8B7355]/50 text-xs select-none">
          ✿
        </span>
      </motion.button>

      {/* Subtle shadow/depth layer for scrapbook depth */}
      <div className="absolute inset-0 rounded-xl bg-[#C4A882]/10 dark:bg-[#5C4A3A]/20 
        translate-x-1.5 translate-y-1.5 -z-10 pointer-events-none" />
    </motion.div>
  );
}