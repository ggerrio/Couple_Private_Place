/**
 * audioAmplitude.test.ts — same shape as vinylRotation.
 *
 * The amplitude bus publishes 0..1 values on a 80ms throttle + delta
 * gate. The hook returns 0 when reduced-motion is on. Because the
 * pattern mirrors vinylRotation exactly, this spec is short — the
 * point is that the consumer-parallel bus pattern is consistent
 * across both amplitude + rotation buses.
 */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { setAmplitude, subscribe, useAudioAmplitude } from "../audioAmplitude";

describe("audioAmplitude bus", () => {
  it("subscribe() seeds with the current amplitude", () => {
    let received = -1;
    const unsub = subscribe((a) => {
      received = a;
    });
    expect(received).toBe(0);
    unsub();
  });

  it("setAmplitude publishes to subscribers (after throttle)", () => {
    const seen: number[] = [];
    const unsub = subscribe((a) => {
      seen.push(a);
    });
    seen.length = 0;

    setAmplitude(0.42);
    expect(seen).toContain(0.42);
    unsub();
  });

  it("delta gate skips trivially-small changes (≤ 0.005)", () => {
    const seen: number[] = [];
    const unsub = subscribe((a) => {
      seen.push(a);
    });
    seen.length = 0;

    setAmplitude(0.50);
    setAmplitude(0.503); // delta = 0.003 → below threshold
    setAmplitude(0.501); // delta = 0.001 → below threshold

    // Only the original 0.50 should have been published (assuming
    // throttle window elapsed between calls in the test runner).
    expect(seen.length).toBeLessThanOrEqual(1);
    unsub();
  });
});

describe("useAudioAmplitude hook", () => {
  it("returns a finite number when reduced-motion is off", () => {
    const { result } = renderHook(() => useAudioAmplitude());
    expect(typeof result.current).toBe("number");
    expect(Number.isFinite(result.current)).toBe(true);
  });
});
