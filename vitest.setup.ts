/**
 * vitest.setup.ts — global setup for the unit-test environment.
 *
 * Pays once at suite-start so individual tests don't have to repeat:
 *   • install AudioContext stub (jsdom has no Web Audio API)
 *   • stub requestAnimationFrame / cancelAnimationFrame as no-ops
 *     (jsdom's default is inline-dispatch, which bgmController's
 *     recursive tick would loop on)
 *   • stub matchMedia so motion/react's useReducedMotion hook
 *     doesn't blow up
 *   • unconditional fetch stub returning a non-zero ArrayBuffer so
 *     bgmController's arm() chain (fetch → arrayBuffer →
 *     decodeAudioData) can resolve
 */

import { vi } from "vitest";
import { installAudioContextStub } from "./src/test-utils/stubs/AudioContextStub";

installAudioContextStub();

// rAF no-op — Vitest tests don't need real animation ticks. Tests
// that DO need to advance rAF can manually pump (rare — bgmController
// is the only call site that requires rAF coordination, and that's
// mocked at the level of inspecting gain param state directly).
vi.stubGlobal("requestAnimationFrame", (_cb: FrameRequestCallback) => 0);
vi.stubGlobal("cancelAnimationFrame", (__id: number) => {});

// Unconditional fetch stub. jsdom's fetch returns Promise.reject for
// relative URLs; we want bgmController's arm chain to resolve.
vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({
    arrayBuffer: async () => new ArrayBuffer(1024),
  })),
);

// matchMedia polyfill — useReducedMotion from motion/react reads this.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    })),
  });
}
