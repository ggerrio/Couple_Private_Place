/**
 * ExperienceMusic.tsx
 *
 * Persistent BGM player scoped to the experience. Refactored (P3)
 * to delegate the seamless-loop crossfade to `useBgmController` —
 * which Web-Audio-API leapfrog-schedules two AudioBufferSourceNodes
 * from the same decoded buffer so the loop boundary is inaudible.
 *
 * Past: a single `<audio loop>` with an analyser attached; the
 *       re-attack at the loop boundary was a noticeable click.
 * Now:  a bgmController hook owning source→analyser→destination +
 *       dual GainNodes for crossfade. No visible JSX in this
 *       component any more — the graph is fully headless.
 *
 * Volume ramps per scene still happen here via `bgm.setVolume`,
 * which lerps BOTH gain nodes in parallel so the crossfade keeps
 * running uninterrupted while user-facing level changes.
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { useReducedMotion } from "motion/react";
import { useBgmController } from "./bgmController";

export interface ExperienceMusicConfig {
  /** BGM volume hint 0..1. */
  bgmVolume?: number;
  id: string;
}

export interface ExperienceMusicProps {
  src: string;
  sceneConfigs?: ExperienceMusicConfig[];
  /** Current scene id — engine passes this to update volume. */
  currentSceneId?: string;
  autoPlay?: boolean;
  /**
   * Preserved for backwards compatibility. BGM now loops
   * seamlessly via the leapfrog crossfade inside bgmController,
   * so `loop=false` is ignored — the track will continue through
   * the crossfade anyway.
   */
  loop?: boolean;
  /** Notify parent when playback state changes. */
  onPlayingChange?: (playing: boolean) => void;
}

export interface ExperienceMusicHandle {
  play: () => Promise<void>;
  pause: () => void;
  fadeOut: (durationMs?: number) => void;
}

export const ExperienceMusic = forwardRef<
  ExperienceMusicHandle,
  ExperienceMusicProps
>(function ExperienceMusic(
  {
    src,
    sceneConfigs,
    currentSceneId,
    autoPlay = true,
    loop: _loop = true,
    onPlayingChange,
  },
  ref,
) {
  const reduced = useReducedMotion();
  const lastReportedPlayingRef = useRef<boolean | null>(null);

  const bgm = useBgmController({
    src,
    disabled: !autoPlay,
  });

  // Per-scene volume fade — re-target BOTH gain nodes whenever the
  // engine reports a new scene id. The 700ms ramp is hidden inside
  // bgmController.setVolume so we don't see the crossfade boundary
  // pop when the level changes mid-crossfade.
  const targetVolume = (() => {
    const cfg = sceneConfigs?.find((s) => s.id === currentSceneId);
    return cfg?.bgmVolume ?? 0.7;
  })();

  useEffect(() => {
    bgm.setVolume(targetVolume);
  }, [targetVolume, bgm]);

  // Bridge bgm.isPlayingRef → onPlayingChange prop. 250ms polling
  // is enough granularity (loaders / play-state chips only need
  // coarse transitions; the audio bus itself stays sample-accurate).
  useEffect(() => {
    const id = window.setInterval(() => {
      const playing = bgm.isPlayingRef.current;
      if (lastReportedPlayingRef.current === playing) return;
      lastReportedPlayingRef.current = playing;
      onPlayingChange?.(playing);
    }, 250);
    return () => window.clearInterval(id);
  }, [bgm.isPlayingRef, onPlayingChange]);

  useImperativeHandle(
    ref,
    () => ({
      play: async () => {
        bgm.resume();
      },
      pause: () => {
        bgm.pause();
      },
      fadeOut: (durationMs = 1500) => {
        bgm.setVolume(0);
        window.setTimeout(() => {
          bgm.pause();
          // Restore gain so a subsequent resume() plays at the
          // requested scene volume again instead of silence.
          bgm.setVolume(targetVolume);
        }, durationMs);
      },
    }),
    [bgm, targetVolume],
  );

  // No visible JSX — bgmController owns the Web Audio graph.
  return null;
});
