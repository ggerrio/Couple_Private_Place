/**
 * sceneJump.test.ts — pure-helper tests for PresentationEngine.jumpTo.
 *
 * The helper was extracted from a useCallback closure in the engine
 * so the direction resolution could be tested without mounting
 * <AnimatePresence> mode="wait" + <SceneTransition>. Verifies:
 *   1. Forward-only resolution (higher index → direction=1)
 *   2. Backward-only resolution (lower index → direction=-1)
 *   3. Unknown id → null (caller short-circuits the goTo call)
 *   4. Same-index resolution → still returns a tuple (callers handle
 *      same-id as a no-op; we just confirm the helper doesn't lie)
 */

import { describe, expect, it } from "vitest";
import { resolveJumpTo } from "../sceneJump";

const SCENES = [
  { id: "gift-open" },
  { id: "hero" },
  { id: "scrapbook" },
  { id: "photo-1" },
  { id: "photo-7" },
  { id: "map" },
  { id: "photo-8" },
  { id: "photo-16" },
  { id: "seal-close" },
  { id: "ending" },
];

describe("resolveJumpTo", () => {
  it("returns forward direction (1) when target index > current", () => {
    const r = resolveJumpTo(SCENES, 4 /* map */, "ending");
    expect(r).toEqual({ index: 9, direction: 1 });
  });

  it("returns backward direction (-1) when target index < current", () => {
    const r = resolveJumpTo(SCENES, 6 /* photo-8 */, "photo-7");
    expect(r).toEqual({ index: 4, direction: -1 });
  });

  it("returns null when targetId is unknown to the scenes array", () => {
    const r = resolveJumpTo(SCENES, 0, "definitely-not-a-scene");
    expect(r).toBeNull();
  });

  it("returns a tuple even when target === current (caller treats as no-op)", () => {
    // When idx === currentIndex the `idx > currentIndex` test resolves
    // to false, so direction is `-1` by convention (consistent with
    // "backward" framing of "matched position"). The engine's goTo
    // bails on equal-index anyway, so callers are unaffected.
    const r = resolveJumpTo(SCENES, 5 /* map */, "map");
    expect(r).toEqual({ index: 5, direction: -1 });
  });

  it("preserves city-map → photo-1 reverse-nav jump direction (most common user path)", () => {
    // The P4 city-map pin's tap calls onJumpTo('photo-N'); the engine
    // here resolves the direction so AnimatePresence slides backwards
    // (direction=-1) when the user jumps from a later scene to an
    // earlier one.
    const r = resolveJumpTo(SCENES, 5 /* map */, "photo-1");
    expect(r).toEqual({ index: 3, direction: -1 });
  });
});
