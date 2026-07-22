/**
 * bgmController.test.ts — Vitest cases for setVolume behavior.
 *
 * Covers:
 *   1. setVolume CLAMPS negative input to 0 + over-unity to 1
 *   2. Method-call order on each GainParam: cancelScheduledValues →
 *      setValueAtTime → linearRampToValueAtTime (per Web Audio spec)
 *   3. Both player-A AND player-B gains receive identical scheduled
 *      events in PARALLEL (i.e. not serially) so the leapfrog
 *      crossfade keeps running while user-facing level ramps
 *   4. Calling setVolume before the audio graph has armed is a no-op
 *      (ctxRef.current is null)
 *
 * Tests use the hand-rolled MockAudioContext stub installed by
 * vitest.setup.ts. To inspect each gain node's method-call history
 * we attach an `installTrackedAudioContextStub()` and read the most
 * recently instantiated MockAudioContext.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useBgmController } from "../bgmController";
import {
  __getLastContext,
  __resetLastContext,
  installTrackedAudioContextStub,
  type MockAudioContext,
} from "../../../test-utils/stubs/AudioContextStub";

// Install the tracked (lastContext-recording) subclass AFTER the
// baseline stub, so post-arm contexts are introspectable.
installTrackedAudioContextStub();

const fireUserGesture = () => {
  // pointerdown is what bgmController listens for as the "first
  // gesture" required by browser autoplay policy.
  window.dispatchEvent(new Event("pointerdown"));
};

describe("bgmController.setVolume", () => {
  beforeEach(() => {
    // Reset the lastContext tracker so no-arm/no-disabled tests
    // don't pick up the context from a previous test's arm.
    __resetLastContext();
  });

  afterEach(() => {
    // Reset trackable state for the next test (the install function
    // resets the constructor's lastContext as a side-effect of the
    // first arm).
  });

  it("clamps negative input to 0 on BOTH gain nodes", async () => {
    const { result } = renderHook(() =>
      useBgmController({ src: "/audio.mp3" }),
    );

    await act(async () => {
      fireUserGesture();
    });

    await waitFor(() => {
      expect(result.current.isPlayingRef.current).toBe(true);
    });

    const ctx = __getLastContext() as MockAudioContext;
    expect(ctx).not.toBeNull();
    // arm() built gainA + gainB during mount.
    expect(ctx.gains.length).toBeGreaterThanOrEqual(2);

    act(() => result.current.setVolume(-0.5));

    // The most recent linearRamp method on each gain should target 0.
    for (const gain of ctx.gains) {
      const lastRamp = [...gain.gain.history]
        .reverse()
        .find((h) => h.method === "linearRampToValueAtTime");
      expect(lastRamp?.value).toBe(0);
    }
  });

  it("clamps over-unity input (>1) to 1", async () => {
    const { result } = renderHook(() =>
      useBgmController({ src: "/audio.mp3" }),
    );

    await act(async () => {
      fireUserGesture();
    });
    await waitFor(() => {
      expect(result.current.isPlayingRef.current).toBe(true);
    });

    const ctx = __getLastContext() as MockAudioContext;

    act(() => result.current.setVolume(2.5));

    // Latest ramps should target 1, NOT 2.5.
    for (const gain of ctx.gains) {
      const lastRamp = [...gain.gain.history]
        .reverse()
        .find((h) => h.method === "linearRampToValueAtTime");
      expect(lastRamp?.value).toBe(1);
    }
  });

  it("calls cancelScheduledValues BEFORE setValueAtTime + linearRamp on each gain", async () => {
    const { result } = renderHook(() =>
      useBgmController({ src: "/audio.mp3" }),
    );
    await act(async () => {
      fireUserGesture();
    });
    await waitFor(() => {
      expect(result.current.isPlayingRef.current).toBe(true);
    });

    const ctx = __getLastContext() as MockAudioContext;
    // Reset history to isolate the setVolume() call (boot writes
    // its own initial ramp; we want to see ONLY what setVolume just
    // appended).
    for (const gain of ctx.gains) {
      gain.gain.history.length = 0;
    }

    act(() => result.current.setVolume(0.42));

    for (const gain of ctx.gains) {
      const methods = gain.gain.history.map((h) => h.method);
      const cancelIdx = methods.indexOf("cancelScheduledValues");
      const setIdx = methods.indexOf("setValueAtTime");
      const rampIdx = methods.indexOf("linearRampToValueAtTime");
      expect(cancelIdx).toBeGreaterThanOrEqual(0);
      expect(setIdx).toBeGreaterThanOrEqual(0);
      expect(rampIdx).toBeGreaterThanOrEqual(0);
      // Cancel should precede setValueAtTime, which should precede
      // linearRampToValueAtTime (per Web Audio spec ordering).
      expect(cancelIdx).toBeLessThan(setIdx);
      expect(setIdx).toBeLessThan(rampIdx);
    }
  });

  it("ramps BOTH gainA and gainB in parallel (not serially)", async () => {
    const { result } = renderHook(() =>
      useBgmController({ src: "/audio.mp3" }),
    );
    await act(async () => {
      fireUserGesture();
    });
    await waitFor(() => {
      expect(result.current.isPlayingRef.current).toBe(true);
    });

    const ctx = __getLastContext() as MockAudioContext;
    for (const gain of ctx.gains) {
      gain.gain.history.length = 0;
    }

    act(() => result.current.setVolume(0.7));

    // Each gain should record exactly 3 events (cancel + set + ramp).
    // If bgmController did them serially with awaits between, only
    // one gain's history might be empty until the sync rollback.
    for (const gain of ctx.gains) {
      expect(gain.gain.history.length).toBe(3);
      expect(gain.gain.history[0].method).toBe("cancelScheduledValues");
      expect(gain.gain.history[1].method).toBe("setValueAtTime");
      expect(gain.gain.history[2].method).toBe("linearRampToValueAtTime");
    }
  });

  it("setVolume is a no-op when the audio graph has not armed yet (ctxRef.current === null)", () => {
    // Do NOT fire pointerdown — graph stays unarmed.
    const { result } = renderHook(() =>
      useBgmController({ src: "/audio.mp3" }),
    );

    act(() => result.current.setVolume(0.5));

    // No context was instantiated because the arm never fired.
    expect(__getLastContext()).toBeNull();
  });

  it("setVolume no-op when disabled: true", () => {
    const { result } = renderHook(() =>
      useBgmController({ src: "/audio.mp3", disabled: true }),
    );

    // Even with a fake pointerdown, the disabled gate keeps arms off.
    act(() => {
      fireUserGesture();
    });

    act(() => result.current.setVolume(0.5));

    expect(__getLastContext()).toBeNull();
  });
});
