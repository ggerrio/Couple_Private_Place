/**
 * vinylRotation.ts
 *
 * P5 singleton rotation bus. Mirrors `audioAmplitude.ts` exactly so
 * any scene can render a spinning `<VinylDisc rotation={...} />` that
 * visually responds to BGM playback without each consumer rAF-polling.
 *
 * Data flow:
 *   • `bgmController` calls `setRotation((cumulativeTime * 200) % 360)`
 *     on every animation frame, gated by `isPlayingRef.current` so the
 *     disc freezes naturally when BGM is paused.
 *   • `useVinylRotation()` subscribes once on mount; the bus pushes
 *     the latest degree value to all subscribers on a throttled
 *     broadcast (~16fps with 0.5° delta gate — silent frames don't
 *     bump React renders).
 *   • Honors `prefers-reduced-motion`: hook returns `0` and skips
 *     subscribing when the OS-level pref is on. The bus still
 *     publishes upstream so toggling the pref off mid-experience
 *     re-subscribes automatically.
 *
 * Why 33⅓ RPM = 200°/sec?
 *   • The canonical turntable speed for full-length albums. Quickly
 *     reads as "music is playing" without feeling frantic.
 *   • `VinylDisc` already has a `transition: transform 60ms linear`
 *     baked in; the 200°/sec × 60ms = ~12° per CSS frame advances
 *     smoothly without per-step judder.
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

type Subscriber = (deg: number) => void;

let currentRotation = 0;
const subscribers = new Set<Subscriber>();

/**
 * Frames between broadcast-throttle. 64ms ≈ 16fps which lines up
 * with the VinylDisc CSS transition window (~60ms) so subscribers
 * render exactly when CSS is ready to lerp to the next frame. Slow
 * enough to keep React quiet; fast enough to read as a real disc.
 * No delta gate — bgmController publishes `cumulativeTime*200` so
 * every publish already advances well past any meaningful threshold;
 * the throttle alone is sufficient gating for the only known caller.
 */
const BROADCAST_INTERVAL_MS = 64;

let lastBroadcastMs = 0;

export function setRotation(deg: number): void {
  // Wrap into 0..359 so a fresh subscriber's seed value is always in
  // the same DOM-transform range (cosmetic — browsers handle > 360°
  // identically but it's a clean number for the spacer).
  const wrapped = ((deg % 360) + 360) % 360;
  // Always update the in-bus value synchronously BEFORE the throttle
  // check so:
  //   • fresh subscribers seed with the latest rotation regardless of
  //     throttle state
  //   • test assertions using `getCurrentRotation()` don't race the
  //     throttle gate
  //   • the Produce→Consume path stays consistent (no stale display
  //     if a sub happens during the throttle window)
  const isSameAsCurrent = wrapped === currentRotation;
  currentRotation = wrapped;

  const now =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastBroadcastMs < BROADCAST_INTERVAL_MS) return;
  if (isSameAsCurrent) return;
  lastBroadcastMs = now;
  subscribers.forEach((fn) => fn(wrapped));
}

/** Read the current disc rotation in 0..359 — primarily for tests. */
export function getCurrentRotation(): number {
  return currentRotation;
}

export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn);
  // Seed the new subscriber immediately so its first render shows the
  // current disc angle instead of starting at 0°.
  fn(currentRotation);
  return () => {
    subscribers.delete(fn);
  };
}

/**
 * React hook — returns the latest disc rotation in degrees (0..359).
 * SSR / muted environments safely return `0` since the bus starts at
 * zero. When the OS-level "reduce motion" pref is on, the hook short-
 * circuits to `0` and skips subscribing so the disc stays frozen.
 *
 *   const rotation = useVinylRotation();
 *   <VinylDisc rotation={rotation} size={64} className="..." />
 */
export function useVinylRotation(): number {
  const reduced = useReducedMotion();
  const [rot, setRot] = useState<number>(currentRotation);
  useEffect(() => {
    if (reduced) return undefined;
    return subscribe(setRot);
  }, [reduced]);
  return reduced ? 0 : rot;
}
