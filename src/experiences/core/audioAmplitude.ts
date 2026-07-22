/**
 * audioAmplitude.ts
 *
 * Singleton amplitude bus for the BGM (Happy Birthday creative-commons mp3).
 * ExperienceMusic wires an AnalyserNode after the first user-gesture
 * unlocks audio.play(), then pushes frequencyData-mean → setAmplitude()
 * on every rAF tick. Scenes subscribe via `useAudioAmplitude()` which
 * re-renders at ~12fps (throttled + delta-gated) so visual hint-copy
 * pulses to the BGM beat without re-rendering the entire scene tree at
 * 60Hz.
 *
 * Returns 0..1 (`0` = silent, `1` = peak). Reduced-motion users short-
 * circuit upstream — see ExperienceMusic's matchMedia check that
 * skips analyser wiring entirely.
 */

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

type Subscriber = (amp: number) => void;

let currentAmplitude = 0;
const subscribers = new Set<Subscriber>();

/**
 * Frames between broadcast-throttle. 80ms ≈ 12.5fps — fast enough
 * for a perceptible pulse, slow enough that 8-subscribed scenes
 * don't render-storm React during BGM playback.
 */
const BROADCAST_INTERVAL_MS = 80;
const DELTA_THRESHOLD = 0.005; // skip silent frames

let lastBroadcastMs = 0;

export function setAmplitude(amp: number): void {
  // Always update the in-bus value so fresh subscribers read the
  // latest sample immediately.
  currentAmplitude = amp;

  const now =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastBroadcastMs < BROADCAST_INTERVAL_MS) return;

  // Skip micro-changes so static BGM frames don't render-storm.
  if (Math.abs(amp - lastBroadcastAmp) < DELTA_THRESHOLD) return;
  lastBroadcastAmp = amp;
  lastBroadcastMs = now;

  subscribers.forEach((fn) => fn(amp));
}
let lastBroadcastAmp = 0;

export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn);
  // Seed the new subscriber immediately so it doesn't start at 0
  // (otherwise the first frame shows flat instead of where the BGM
  // currently sits).
  fn(currentAmplitude);
  return () => {
    subscribers.delete(fn);
  };
}

/**
 * React hook — returns latest amplitude in 0..1. SSR / no-sound
 * environments safely return `0` since the bus starts at zero.
 *
 * Honors prefers-reduced-motion: when the user has the OS-level pref
 * on, the hook returns `0` and skips subscribing. The bus still
 * publishes (ExperienceMusic is unaffected) so toggling the pref off
 * mid-experience re-subscribes automatically.
 *
 *   const amp = useAudioAmplitude();
 *   <motion.p animate={{ scale: [1, 1 + amp * 0.18, 1] }} />
 */
export function useAudioAmplitude(): number {
  const reduced = useReducedMotion();
  const [amp, setAmp] = useState<number>(currentAmplitude);
  useEffect(() => {
    if (reduced) return undefined;
    return subscribe(setAmp);
  }, [reduced]);
  return reduced ? 0 : amp;
}
