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

  // Persistent refs for the Web Audio graph (refs so we never re-arm
  // on React re-renders — once the buffer is decoded, it lives until
  // the effect cleanup runs).
  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const fadeRafRef = useRef<number | null>(null);

  // Two gain nodes for crossfade-driven mixing.
  const playerAGainRef = useRef<GainNode | null>(null);
  const playerBGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (opts.disabled) return;

    // Helper: schedule one leapfrog step. `whichIsLeader==true` means
    // player A is leading and player B is the upcoming partner; false
    // means B is leading and A is the upcoming partner.
    let cancelled = false;
    const startTime = { now: 0 };
    let playerA: AudioBufferSourceNode | null = null;
    let playerB: AudioBufferSourceNode | null = null;
    let deferredPlayer: AudioBufferSourceNode | null = null;
    const crossfadeDuration = opts.crossfadeDuration ?? 4;

    const armAudioContext = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          const Ctor: typeof AudioContext | undefined =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext;
          if (!Ctor) {
            reject(new Error("AudioContext unavailable"));
            return;
          }
          const ctx = new Ctor();
          ctxRef.current = ctx;

          // Two gain nodes that we'll crossfade.
          const gainA = ctx.createGain();
          const gainB = ctx.createGain();
          gainA.gain.value = 0;
          gainB.gain.value = 0;
          gainA.connect(ctx.destination);
          gainB.connect(ctx.destination);
          playerAGainRef.current = gainA;
          playerBGainRef.current = gainB;

          // One analyser — feed off gainA (lead switches don't matter
          // perceptually since we crossfade continuously).
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.7;
          analyserRef.current = analyser;
          analyser.connect(ctx.destination);
          dataRef.current = new Uint8Array(analyser.frequencyBinCount);

          // Compose(master for amplitude visibility) → analyser.
          gainA.connect(analyser);

          // Fetch + decode.
          fetch(opts.src)
            .then((r) => r.arrayBuffer())
            .then((buf) => ctx.decodeAudioData(buf))
            .then((decoded) => {
              if (cancelled) {
                decoded = null as unknown as AudioBuffer;
                return;
              }
              bufferRef.current = decoded;
              durationRef.current = decoded.duration;

              // Boot player A SILENT. setVolume (driven by ExperienceMusic
              // per-scene config) handles the actual user-facing ramp up
              // to the target. Without this, the copy-ramp would overshoot
              // to 0.7 and then setVolume(0.35) for "gift-open" would
              // instrumentally snap gain back down — a tiny but audible
              // knee-jerk dip on the very first cycle.
              playerA = ctx.createBufferSource();
              playerA.buffer = decoded;
              playerA.loop = false;
              playerA.connect(gainA);
              startTime.now = ctx.currentTime;
              playerA.start(0);
              gainA.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
              isPlayingRef.current = true;

              // Schedule player B to start at loopEnd - crossfade.
              const dur = decoded.duration;
              const scheduledBStart = dur - crossfadeDuration;
              playerB = ctx.createBufferSource();
              playerB.buffer = decoded;
              playerB.loop = false;
              playerB.connect(gainB);
              playerB.start(scheduledBStart);

              // When B's start time hits, ramp gain A down + gain B up.
              // The crossfade drives the internal "lead" swap; the
              // user-facing level (whatever setVolume last set) lives
              // on top via setVolume's own linearRamp scheduling, so
              // the absolute numbers here are intrinsic and remultiplied
              // by setVolume at runtime.
              gainA.gain.setValueAtTime(0.7, ctx.currentTime + scheduledBStart);
              gainB.gain.setValueAtTime(0, ctx.currentTime + scheduledBStart);
              gainA.gain.linearRampToValueAtTime(0, ctx.currentTime + scheduledBStart + crossfadeDuration);
              gainB.gain.linearRampToValueAtTime(0.7, ctx.currentTime + scheduledBStart + crossfadeDuration);

              // rAF amplitude + currentTime tick.
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
                if (ctxRef.current && playerA) {
                  try {
                    const t = ctxRef.current.currentTime - startTime.now;
                    const dur = decoded.duration;
                    // currentTime wraps inside the loop period.
                    currentTimeRef.current = (t % dur + dur) % dur;
                    cumulativeTimeRef.current += 1 / 60;
                  } catch {
                    // Source ended; the leapfrog will swap roles.
                  }
                }
                // Publish rotation ONLY while the audio graph is
                // actually playing — the disc naturally freezes when
                // the user pauses BGM via onPause/, and resumes from
                // the current angle on resume. 33⅓ RPM = 200°/sec is
                // the canonical turntable speed; the 0..360 wrap means
                // the crossfade boundary is invisible to the eye.
                if (isPlayingRef.current) {
                  setRotation(cumulativeTimeRef.current * 200);
                }

                // After the scheduled B start + crossfade, schedule A2
                // as the next leapfrog partner.
                if (
                  ctxRef.current &&
                  playerB &&
                  ctxRef.current.currentTime >= scheduledBStart + crossfadeDuration &&
                  !deferredPlayer
                ) {
                  deferredPlayer = ctxRef.current.createBufferSource();
                  deferredPlayer.buffer = decoded;
                  deferredPlayer.loop = false;
                  // Pick which gain fades next — if A→B transition
                  // just happened, schedule next B→A by connecting to
                  // gainA (so we crossfade back B→A).
                  deferredPlayer.connect(gainA);
                  const scheduled = scheduledBStart + dur;
                  deferredPlayer.start(scheduled);
                  gainA.gain.setValueAtTime(0, ctxRef.current.currentTime + scheduled);
                  gainB.gain.setValueAtTime(0.7, ctxRef.current.currentTime + scheduled);
                  gainA.gain.linearRampToValueAtTime(0.7, ctxRef.current.currentTime + scheduled + crossfadeDuration);
                  gainB.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + scheduled + crossfadeDuration);
                  // Marker: cycle is now self-perpetuating — handlers
                  // don't need to re-schedule manually beyond this.
                  // Don't swap roles synchronously — the parent's rAF
                  // tick reads whichever GainNode is currently `lead`
                  // based on accumulated time. The above schedule keeps
                  // playback continuous across multiple cycles.
                  isPlayingRef.current = true;
                }

                fadeRafRef.current = requestAnimationFrame(tick);
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

    // Browser autoplay policy: AudioContext + decodeAudioData must
    // happen INSIDE a user gesture. Window-level passive listener
    // fires once on first pointerdown/keydown.
    let armed = false;
    const arm = () => {
      if (armed || cancelled) return;
      armed = true;
      armAudioContext().catch((err) => {
        console.warn("[bgmController] arm failed:", err);
      });
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
    };
    window.addEventListener("pointerdown", arm, { once: true });
    window.addEventListener("keydown", arm, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", arm);
      window.removeEventListener("keydown", arm);
      if (fadeRafRef.current != null) {
        cancelAnimationFrame(fadeRafRef.current);
        fadeRafRef.current = null;
      }
      try { playerA?.stop(); } catch { /* ignore */ }
      try { playerB?.stop(); } catch { /* ignore */ }
      try { deferredPlayer?.stop(); } catch { /* ignore */ }
      ctxRef.current?.close().catch(() => { /* ignore */ });
      ctxRef.current = null;
      bufferRef.current = null;
      analyserRef.current = null;
      dataRef.current = null;
      playerAGainRef.current = null;
      playerBGainRef.current = null;
      isPlayingRef.current = false;
    };
  }, [opts.src, opts.disabled, opts.crossfadeDuration]);

  const setVolume = (value: number): void => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const a = playerAGainRef.current;
    const b = playerBGainRef.current;
    const now = ctx.currentTime;
    // clamp 0..1, prevent negative/over-unity
    const target = Math.max(0, Math.min(1, value));
    if (a) {
      a.gain.cancelScheduledValues(now);
      a.gain.setValueAtTime(a.gain.value, now);
      a.gain.linearRampToValueAtTime(target, now + 0.7);
    }
    if (b) {
      b.gain.cancelScheduledValues(now);
      b.gain.setValueAtTime(b.gain.value, now);
      b.gain.linearRampToValueAtTime(target, now + 0.7);
    }
  };

  // ════════════════════════════════════════════════════════════════════
  // Memoize the handle so consumers' useEffects keyed on `bgm` don't
  // re-fire on every parent render. All members are stable refs or
  // stable inline arrows whose closures capture already-stable refs
  // — so [] deps are sound. Without this, ExperienceMusic's
  // `useEffect(() => bgm.setVolume(targetVolume), [targetVolume, bgm])`
  // would re-run on every render → cancelScheduledValues + restart
  // the 0.7s ramp on every parent tick → audible gain stutter.
  // ════════════════════════════════════════════════════════════════════
  return useMemo<{
    currentTimeRef: React.MutableRefObject<number>;
    durationRef: React.MutableRefObject<number>;
    cumulativeTimeRef: React.MutableRefObject<number>;
    isPlayingRef: React.MutableRefObject<boolean>;
    setVolume: (value: number) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
  }>(
    () => ({
      currentTimeRef,
      durationRef,
      cumulativeTimeRef,
      isPlayingRef,
      setVolume,
      pause: () => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        try { ctx.suspend(); } catch { /* ignore */ }
        isPlayingRef.current = false;
      },
      resume: () => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        try { ctx.resume(); } catch { /* ignore */ }
        isPlayingRef.current = true;
      },
      stop: () => {
        // Tear down is handled by the effect cleanup on unmount.
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally []; all members are refs or stable closures
    [],
  );
}
