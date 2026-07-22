/**
 * SceneTransition.tsx
 *
 * Wraps each scene inside a motion variant so AnimatePresence can
 * coordinate enter/exit. Five named variants:
 *   - fade       — soft cross-fade (cinematic)
 *   - slide      — horizontal slide (sequential pages)
 *   - cinematic  — scale + slight blur (hero reveals)
 *   - paper      — paper page-turn (slight rotateY + skew), default
 *   - flip       — full flip (big-impact moments)
 *
 * If `reducedMotion` is true (from useReducedMotion), we collapse to a
 * short opacity-only fade so we respect the user's a11y preferences.
 *
 * Each variant exposes a plain {initial, animate, exit} object; `direction`
 * is consumed at the parent level by selecting which keyframe set to use.
 */

import React from "react";
import { motion } from "motion/react";

export type SceneTransitionVariant =
  | "fade"
  | "slide"
  | "cinematic"
  | "paper"
  | "flip";

export interface SceneTransitionProps {
  variant: SceneTransitionVariant;
  sceneKey: string;
  /** direction = 1 forward, -1 back; flips the slide/paper/flip sign. */
  direction: 1 | -1;
  reducedMotion?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Variant builders — pure plain-object shape (no mixed form bugs).
type Keyframe = { [k: string]: number | string };
type VariantSet = { initial: Keyframe; animate: Keyframe; exit: Keyframe };

function buildVariants(direction: 1 | -1): Record<SceneTransitionVariant, VariantSet> {
  const f = direction > 0 ? 1 : -1;
  return {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, x: 60 * f },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -60 * f },
    },
    cinematic: {
      initial: { opacity: 0, scale: 0.94, filter: "blur(8px)" },
      animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
      exit: { opacity: 0, scale: 1.06, filter: "blur(6px)" },
    },
    paper: {
      initial: { opacity: 0, rotateY: -45 * f, rotateX: 8, rotate: -4 * f, x: 320 * f, z: -100, scale: 0.85 },
      animate: { opacity: 1, rotateY: 0, rotateX: 0, rotate: 0, x: 0, z: 0, scale: 1 },
      exit: { opacity: 0, rotateY: 45 * f, rotateX: -8, rotate: 4 * f, x: -320 * f, z: -100, scale: 0.85 },
    },
    flip: {
      initial: { opacity: 0, rotateY: -90 * f },
      animate: { opacity: 1, rotateY: 0 },
      exit: { opacity: 0, rotateY: 90 * f },
    },
  };
}

function transitionFor(variant: SceneTransitionVariant) {
  switch (variant) {
    case "paper":
      return {
        type: "spring" as const,
        stiffness: 85,
        damping: 14,
        mass: 0.9,
        opacity: {
          type: "tween",
          ease: "easeInOut",
          duration: 0.65,
        },
      };
    case "flip":
      return { duration: 0.75, ease: [0.65, 0, 0.35, 1] as const };
    case "cinematic":
      return { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };
    default:
      return { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };
  }
}

export function SceneTransition({
  variant,
  sceneKey,
  direction,
  reducedMotion,
  children,
  className,
}: SceneTransitionProps) {
  if (reducedMotion) {
    return (
      <motion.div
        key={sceneKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className={className}
        style={{ perspective: 1500 }}
      >
        {children}
      </motion.div>
    );
  }

  const variants = buildVariants(direction)[variant];

  return (
    <motion.div
      key={sceneKey}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transitionFor(variant)}
      className={className}
      style={{
        perspective: 1500,
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
}
