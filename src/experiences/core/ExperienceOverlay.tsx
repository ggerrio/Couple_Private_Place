/**
 * ExperienceOverlay.tsx
 *
 * Full-screen modal wrapper. Establishes a premium cream-on-charcoal
 * backdrop, suppresses the underlying app's tab dock and dark-mode
 * chrome, and centers the experience.
 *
 * a11y: aria-modal dialog, focus-trapped within stage, Escape forwarded.
 */

import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CELEBRATION_ACCENT,
  CELEBRATION_ACCENT_VAR,
} from "../birthday/birthday.constants";

export interface ExperienceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Optional override z-index (default 90 — above dock, below toasts). */
  zIndex?: number;
}

export function ExperienceOverlay({
  isOpen,
  onClose,
  children,
  title,
  zIndex = 90,
}: ExperienceOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Body scroll-lock while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Focus the wrapper when opened so the experience stage can claim focus
  useEffect(() => {
    if (isOpen) {
      containerRef.current?.focus();
    }
  }, [isOpen]);

  // Escape handler (in addition to engine keydown for clarity here too)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={title ?? "Experience"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 outline-none"
          // Inject the celebration accent as a CSS custom property so
          // descendant scenes can reference it via Tailwind arbitrary
          // values (`text-[color:var(--cel-accent)]`) without needing
          // to know the actual hex. Single source of truth.
          //
          // The `as React.CSSProperties` cast is load-bearing: motion's
          // `MotionStyle` (motion@12.42.2 verified) does NOT carry the
          // `[--${string}]: …` index signature that React.CSSProperties
          // does, so bracket-access keys get flagged with TS2353 without
          // the cast. Keep this cast.
          style={
            { [CELEBRATION_ACCENT_VAR]: CELEBRATION_ACCENT, zIndex } as React.CSSProperties
          }
        >
          {/* Warm cream gradient backdrop with subtle vignette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 30%, rgba(255,247,237,0.96), rgba(233,221,208,0.94) 35%, rgba(196,178,158,0.88))",
            }}
          />
          {/* Subtle paper texture overlay */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBoNjBNMCAyMGg2ME0wIDMwaDYwTTAgNDBoNjBNMCA1MGg2ME0xMCAwdjYwTTIwIDB2NjBNMzAgMHY2ME00MCAwdjYwTTUwIDB2NjAiIHN0cm9rZT0iIzhiNzM1NSIgc3Ryb2tlLXdpZHRoPSIwLjE1IiBvcGFjaXR5PSIwLjA4IiBmaWxsPSJub25lIi8+PC9zdmc+\")",
            }}
          />
          {/* Soft top/bottom light bloom — GPU optimized radial gradients */}
          <div
            aria-hidden
            className="absolute -top-40 left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(253,230,138,0.3)_0%,transparent_70%)] pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute -bottom-40 right-1/4 w-[60vw] h-[60vh] rounded-full bg-[radial-gradient(circle_at_center,rgba(254,205,211,0.25)_0%,transparent_70%)] pointer-events-none"
          />

          {/* Content layer */}
          <div className="relative w-full h-full flex items-center justify-center">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
