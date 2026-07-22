/**
 * PresentationEngine.tsx
 *
 * Generic scene router. Owns:
 *   - active index state (forward/back via direction tracking)
 *   - AnimatePresence wrapping SceneTransition → next scene component
 *   - keyboard nav (Arrow keys, Escape → closeRequest)
 *   - auto-advance timer (per-scene durationMs)
 *   - a11y: aria-live announces current scene title; tabIndex focus on stage
 *   - honors prefers-reduced-motion: short-circuits transition variants
 *
 * All decorative / non-runtime logic is in caller code (birthday).
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import type { BirthdayContent, BirthdayPhoto, BirthdaySceneProps } from "../birthday/birthday.types";
import { SceneTransition } from "./SceneTransition";
import { ExperienceProgress } from "./ExperienceProgress";
import { ExperienceNavigation } from "./ExperienceNavigation";
import { resolveJumpTo } from "./sceneJump";
import type { BirthdaySceneConfig } from "../birthday/birthday.types";

export interface SceneComponentProps<TMeta = unknown> {
  isActive: boolean;
  onAdvance: () => void;
  onPrev: () => void;
  onSkip: () => void;
  /**
   * Optional replay callback. When provided, the active scene (typically
   * the LAST scene) can render a Replay affordance. The orchestrator
   * (BirthdayExperience) implements this by incrementing a `replayCount`
   * and re-keying the PresentationEngine so it remounts at index 0.
   */
  onReplay?: () => void;
  /**
   * Optional scene-jump callback. The engine resolves the id to
   * its array index and forwards via the existing goTo pipeline
   * (preserving direction tracking for the AnimatePresence).
   */
  onJumpTo?: (sceneId: string) => void;
  isFirst: boolean;
  isLast: boolean;
  config: import("../birthday/birthday.types").BirthdaySceneConfig;
  /** Content shared across scenes (recipient name, hero text, letter, etc.). */
  content?: import("../birthday/birthday.types").BirthdayContent;
  /** Photo collection to render in scene-specific layouts. */
  photos?: import("../birthday/birthday.types").BirthdayPhoto[];
  meta?: TMeta;
}

export interface PresentationScene<TMeta = unknown> {
  id: string;
  component: React.ComponentType<SceneComponentProps<TMeta>>;
  durationMs?: number;
  meta?: TMeta;
  /** Per-scene transition override. Falls back to the engine-level default if omitted. */
  transitionVariant?: "fade" | "slide" | "cinematic" | "paper" | "flip";
}

export interface PresentationEngineProps<TMeta = unknown> {
  scenes: PresentationScene<TMeta>[];
  initialSceneId?: string;
  /** Default variant for inter-scene transition; each scene can override. */
  transitionVariant?: "fade" | "slide" | "cinematic" | "paper" | "flip";
  /** Called when the final scene is dismissed. */
  onComplete?: () => void;
  /** Called when Escape is pressed (or close button). */
  onCloseRequest?: () => void;
  /**
   * Optional replay callback forwarded to active scenes so the LAST
   * scene can render a Replay affordance. No default behavior here —
   * the parent decides how to restart (key-remount, pushScene, etc.).
   */
  onReplay?: () => void;
  className?: string;
  birthdayContent?: BirthdayContent;
  birthdayPhotos?: BirthdayPhoto[];
}

export function PresentationEngine<TMeta = unknown>({
  scenes,
  transitionVariant = "paper",
  onComplete,
  onCloseRequest,
  onReplay,
  className,
  birthdayContent,
  birthdayPhotos,
}: PresentationEngineProps<TMeta>) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const advanceTimerRef = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);

  const total = scenes.length;

  const goTo = useCallback(
    (next: number, dir: 1 | -1) => {
      if (next < 0) {
        onCloseRequest?.();
        return;
      }
      if (next >= total) {
        onComplete?.();
        return;
      }
      setDirection(dir);
      setIndex(next);
    },
    [total, onComplete, onCloseRequest],
  );

  const advance = useCallback(() => goTo(index + 1, 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, -1), [goTo, index]);
  const skip = useCallback(() => onComplete?.(), [onComplete]);
  /**
   * Scene-le jump-to. Resolves the requested id against the
   * scenes array and routes through goTo so AnimatePresence
   * sees the direction change for the proper transition.
   */
  const jumpTo = useCallback(
    (id: string) => {
      // Direction + id → index resolved in the pure helper
      // (`sceneJump.ts`) so unit tests can lock it down without
      // mounting the full engine.
      const resolved = resolveJumpTo(scenes, index, id);
      if (!resolved) return;
      goTo(resolved.index, resolved.direction);
    },
    [scenes, index, goTo],
  );

  // Keyboard nav (Arrow keys only — Escape handled separately)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCloseRequest?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [advance, prev, onCloseRequest]);

  const current = scenes[index];

  // Auto-advance timer per scene duration
  useEffect(() => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (!current?.durationMs || current.durationMs <= 0) return;
    advanceTimerRef.current = window.setTimeout(() => {
      advance();
    }, current.durationMs);
    return () => {
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [current?.id, advance]);

  // Move focus to the stage when the active scene changes (a11y)
  // preventScroll keeps the page steady — without it the focus scroll-jumps on every Next.
  useEffect(() => {
    stageRef.current?.focus({ preventScroll: true });
  }, [current?.id]);

  const baseProps = useMemo(
    () => ({
      content: birthdayContent as BirthdayContent,
      photos: (birthdayPhotos ?? []) as BirthdayPhoto[],
    }),
    [birthdayContent, birthdayPhotos],
  );

  if (!current) return null;

  const SceneComp = current.component as React.ComponentType<SceneComponentProps<TMeta>>;

  // Derive lightweight scene-config data for the active scene + props
  const activeSceneConfig: BirthdaySceneConfig = {
    id: current.id as BirthdaySceneProps["config"]["id"],
    title: String(current.id),
    order: index,
    layout: "interactive",
    advanceMode: current.durationMs ? "auto" : "manual",
    durationMs: current.durationMs,
  };

  return (
    <div
      ref={stageRef}
      tabIndex={-1}
      role="region"
      aria-label={`Birthday scene ${index + 1} of ${total}: ${current.id}`}
      aria-live="polite"
      className={className ?? "relative w-full h-full outline-none"}
      data-scene={current.id}
    >
      <ExperienceProgress total={total} currentIndex={index} variant="heart" />
      <ExperienceNavigation
        onPrev={prev}
        onNext={advance}
        onSkip={onCloseRequest}
        canPrev={index > 0}
        canNext={index < total - 1}
      />

      <AnimatePresence mode="wait" initial={false}>
        <SceneTransition
          key={current.id}
          sceneKey={current.id}
          variant={current.transitionVariant ?? transitionVariant}
          direction={direction}
          reducedMotion={!!reduced}
          className="w-full h-full flex items-center justify-center"
        >
          <SceneComp
            isActive
            onAdvance={advance}
            onPrev={prev}
            onSkip={skip}
            onReplay={onReplay}
            onJumpTo={jumpTo}
            isFirst={index === 0}
            isLast={index === total - 1}
            config={activeSceneConfig}
            meta={current.meta}
            {...(baseProps as object)}
          />
        </SceneTransition>
      </AnimatePresence>
    </div>
  );
}
