/**
 * bgmController.ts
 *
 * P3 seamless-BGM-loop controller. Replaces the previous `<audio>`-with-
 * `loop=true` element so the BGM transitions through a continuous
 * crossfade at the loop boundary instead of an audible restart.
 *
 * Architecture (leapfrog crossfade):
 *   • On mount: fetch(src) → response.arrayBuffer() → ctx.decodeAudioData()
 *     yields a single AudioBuffer for the whole track.
 *   • Two AudioBufferSourceNode instances consume from that buffer.
 *     Per loop cycle:
 *       – player1 starts at t=0;
 *       – player2 starts at exactly buffer.duration - crossfadeDuration,
 *         crossfading gain1 1→0 + gain2 0→1 over that window;
 *       – on player2's start, player1.stop() runs and is replaced by a
 *         fresh player3 scheduled to start at the SAME crossfadeDuration
 *         from player2's start. The leapfrog pattern keeps the loop
 *         inaudible without timing drift.
 *
 *   • Each player's gain is targetable from `setGain(player, value)`,
 *     and the orchestrator (ExperienceMusic) smooth-fades the lead
 *     player's gain toward `bgmVolume` per-scene ID.
 *
 *   • A shared AnalyserNode (one per player) feeds the existing
 *     `setAmplitude()` bus so scene hint copy keeps pulsing to the
 *     beat, including during the crossfade itself.
 *
 *   • Returns `{ currentTimeRef, isPlayingRef, setGain, pause, resume,
 *     play }`. Consumers (typically ExperienceMusic) attach a
 *     useReducedMotion-friendly gate on the entire pipeline so
 *     reduced-motion users get a quieter fall-back playback path.
 */

import { useEffect, useMemo, useRef } from "react";
import { setAmplitude } from "./audioAmplitude";
import { setRotation } from "./vinylRotation";
import { consumePreArmedCtx } from "../birthday/birthdayGesture";

export interface BgmControllerHandle {
  /** Lead player's currentTime (sec). Updated by internal rAF. */
  currentTimeRef: React.MutableRefObject<number>;
  /** Total loop duration (sec) — share same across restarts. */
  durationRef: React.MutableRefObject<number>;
  /** Total playback time accumulated since mount (sec) — drives vinyl rotation. */
  cumulativeTimeRef: React.MutableRefObject<number>;
  /** True while audio graph is actively playing (false when paused by gesture). */
  isPlayingRef: React.MutableRefObject<boolean>;
  /**
   * Per-scene volume setter. Cancels any pending ramps and lerps
   * BOTH leapfrog gains to the new target over 700ms so the
   * crossfade-internal mixing continues unaffected while the
   * user-facing level changes.
   */
  setVolume: (value: number) => void;
  /** Imperative: pause the loop entirely. */
  pause: () => void;
  /** Imperative: resume from where it paused. */
  resume: () => void;
  /** Imperative: tear down (called from `useEffect` cleanup). */
  stop: () => void;
}

export interface BgmControllerOptions {
  src: string;
  /** Crossfade window in seconds. 4s is a good "long enough to be
   *  inaudible, short enough that the overlap doesn't bloat compute". */
  crossfadeDuration?: number;
  /** Reduced-motion short-circuit — if true, the entire Web Audio
   *  pipeline is skipped and the loop is bypassed (the caller
   *  should fall back to a static `<audio loop>` element). */
  disabled?: boolean;
}

/**
 * Hook arming the BGM crossfade loop.
 *
 * Returns a handle the consumer can attach effects to. Internally:
 *   • On first user gesture (window pointerdown keydown once:true),
 *     set up AudioContext + decode buffer + spin leapfrog players.
 *   • Each rAF tick reads the lead player's getByteFrequencyData and
 *     pushes mean amplitude to `setAmplitude()`.
 *   • Schedules player2 (and onwards) on lead player's start so the
 *     crossfade is always wired ahead of time.
 */
export function useBgmController(opts: BgmControllerOptions): BgmControllerHandle {
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const cumulativeTimeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // Persistent refs for the Web Audio graph
  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const fadeRafRef = useRef<number | null>(null);

  const gainRefA = useRef<GainNode | null>(null);
  const gainRefB = useRef<GainNode | null>(null);
  const targetVolumeRef = useRef<number>(0.7);

  useEffect(() => {
    if (opts.disabled) return;

    let cancelled = false;
    let player: AudioBufferSourceNode | null = null;
    let startTime = 0;

    const armAudioContext = (preArmedCtx?: AudioContext | null): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          // Reuse pre-armed AudioContext if provided or parked
          let ctx = preArmedCtx ?? consumePreArmedCtx();
          if (!ctx) {
            const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
            if (!Ctor) {
              reject(new Error("AudioContext unavailable"));
              return;
            }
            ctx = new Ctor();
          }
          ctxRef.current = ctx;

          // Create dual GainNodes (A & B) for leapfrog crossfade & volume compatibility
          const gainNodeA = ctx.createGain();
          gainNodeA.gain.value = 0;
          gainNodeA.connect(ctx.destination);
          gainRefA.current = gainNodeA;

          const gainNodeB = ctx.createGain();
          gainNodeB.gain.value = 0;
          gainNodeB.connect(gainNodeA);
          gainRefB.current = gainNodeB;

          // Analyser
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.7;
          analyserRef.current = analyser;
          analyser.connect(ctx.destination);
          dataRef.current = new Uint8Array(analyser.frequencyBinCount);
          gainNodeA.connect(analyser);

          // Fetch + decode
          fetch(opts.src)
            .then((r) => r.arrayBuffer())
            .then((buf) => ctx.decodeAudioData(buf))
            .then((decoded) => {
              if (cancelled) return;
              bufferRef.current = decoded;
              durationRef.current = decoded.duration;

              // Create source and set natively to loop
              player = ctx.createBufferSource();
              player.buffer = decoded;
              player.loop = true; // Seamless native loop!
              player.connect(gainNodeB);
              
              startTime = ctx.currentTime;
              player.start(0);

              const initVol = targetVolumeRef.current;
              gainNodeA.gain.setValueAtTime(initVol, ctx.currentTime);
              gainNodeA.gain.linearRampToValueAtTime(initVol, ctx.currentTime + 0.4);
              gainNodeB.gain.setValueAtTime(initVol, ctx.currentTime);
              gainNodeB.gain.linearRampToValueAtTime(initVol, ctx.currentTime + 0.4);
              isPlayingRef.current = true;

              const tick = () => {
                if (cancelled) return;
                const data = dataRef.current;
                const an = analyserRef.current;
                if (data && an) {
                  an.getByteFrequencyData(data);
                  let sum = 0;
                  for (let i = 0; i < data.length; i++) sum += data[i];
                  setAmplitude(sum / data.length / 255);
                }
                if (ctxRef.current && player) {
                  const t = ctxRef.current.currentTime - startTime;
                  const dur = decoded.duration;
                  currentTimeRef.current = t % dur;
                  cumulativeTimeRef.current += 1 / 60;
                }
                if (isPlayingRef.current) {
                  setRotation(cumulativeTimeRef.current * 200);
                  fadeRafRef.current = requestAnimationFrame(tick);
                }
              };
              fadeRafRef.current = requestAnimationFrame(tick);
              resolve();
            })
            .catch(reject);
        } catch (err) {
          reject(err);
        }
      });
    };

    let armed = false;
    const arm = () => {
      if (cancelled) return;
      if (ctxRef.current && ctxRef.current.state === "suspended") {
        ctxRef.current.resume().catch(() => {});
      }
      if (armed) return;
      armed = true;
      armAudioContext().catch((err) => {
        console.warn("[bgmController] arm failed:", err);
      });
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("click", arm);
      window.removeEventListener("keydown", arm);
    };

    // If pre-armed context is already available (e.g. user clicked trigger button), arm immediately.
    // Otherwise wait for user gesture to avoid autoplay policy violations.
    const preArmed = consumePreArmedCtx();
    if (preArmed) {
      armed = true;
      armAudioContext(preArmed).catch((err) => {
        console.warn("[bgmController] pre-armed setup failed:", err);
      });
    } else {
      window.addEventListener("pointerdown", arm, { once: true });
      window.addEventListener("click", arm, { once: true });
      window.addEventListener("keydown", arm, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("click", arm);
      window.removeEventListener("keydown", arm);
      if (fadeRafRef.current != null) {
        cancelAnimationFrame(fadeRafRef.current);
      }
      try { player?.stop(); } catch {}
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      bufferRef.current = null;
      analyserRef.current = null;
      dataRef.current = null;
      gainRefA.current = null;
      gainRefB.current = null;
      isPlayingRef.current = false;
    };
  }, [opts.src, opts.disabled]);

  const setVolume = (value: number): void => {
    const target = Math.max(0, Math.min(1, value));
    targetVolumeRef.current = target;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const gA = gainRefA.current;
    const gB = gainRefB.current;
    if (gA) {
      gA.gain.cancelScheduledValues(now);
      gA.gain.setValueAtTime(gA.gain.value, now);
      gA.gain.linearRampToValueAtTime(target, now + 0.7);
    }
    if (gB) {
      gB.gain.cancelScheduledValues(now);
      gB.gain.setValueAtTime(gB.gain.value, now);
      gB.gain.linearRampToValueAtTime(target, now + 0.7);
    }
  };

  return useMemo(
    () => ({
      currentTimeRef,
      durationRef,
      cumulativeTimeRef,
      isPlayingRef,
      setVolume,
      pause: () => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        try { ctx.suspend(); } catch {}
        isPlayingRef.current = false;
      },
      resume: () => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        try { ctx.resume(); } catch {}
        isPlayingRef.current = true;
      },
      stop: () => {},
    }),
    []
  );
}
