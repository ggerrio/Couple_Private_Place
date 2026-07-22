/**
 * birthdayScenes.test.ts — structural assertions on BIRTHDAY_SCENES.
 *
 * Verifies the post-TS-fix shape that the PreOrderScene literal-array
 * cast + re-sequencing `.map((s, idx) => ({...s, order: idx+1}))` is
 * designed to produce in production:
 *
 *   1. Total length = 22 (3 lead-in + 7 photos + map + 9 photos + 2 closing)
 *   2. The "map" reverse-nav montage IS at index 10 (i.e. between
 *      photo-7 and photo-8), in the SAME position the engine reads
 *      when navigating
 *   3. The order field is unique and 1..N sequential (the
 *      re-sequencer's only job)
 *   4. The id sequence is exactly:
 *        gift-open, hero, scrapbook,
 *        photo-1..photo-7,
 *        map,
 *        photo-8..photo-16,
 *        seal-close, ending
 */

import { describe, expect, it } from "vitest";
import {
  BIRTHDAY_SCENES,
  BIRTHDAY_CITY_PIN_POSITIONS,
} from "../birthday.data";

describe("BIRTHDAY_SCENES", () => {
  it("has exactly 24 entries (post-P4 splice)", () => {
    expect(BIRTHDAY_SCENES).toHaveLength(24);
  });

  it("places the 'map' reverse-nav montage between photo-7 and photo-8", () => {
    expect(BIRTHDAY_SCENES[10].id).toBe("photo-7");
    expect(BIRTHDAY_SCENES[11].id).toBe("map");
    expect(BIRTHDAY_SCENES[12].id).toBe("photo-8");
  });

  it("has leading scenes in order: gift-open, hero, stats-favorites, scrapbook", () => {
    expect(BIRTHDAY_SCENES.slice(0, 4).map((s) => s.id)).toEqual([
      "gift-open",
      "hero",
      "stats-favorites",
      "scrapbook",
    ]);
  });

  it("has closing scenes in order: stats-timeline, seal-close, ending", () => {
    expect(BIRTHDAY_SCENES.slice(-3).map((s) => s.id)).toEqual([
      "stats-timeline",
      "seal-close",
      "ending",
    ]);
  });

  it("orders 1..N sequentially (re-sequencer works)", () => {
    const orders = BIRTHDAY_SCENES.map((s) => s.order);
    expect(orders).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
  });

  it("contains all 16 photos each exactly once", () => {
    const photoIds = BIRTHDAY_SCENES.filter((s) =>
      s.id.startsWith("photo-"),
    ).map((s) => s.id);
    expect(photoIds).toHaveLength(16);
    const unique = new Set(photoIds);
    expect(unique.size).toBe(16);
    // Sequence should monotonically number from 1 to 16 with no gaps.
    expect(photoIds).toEqual([
      "photo-1", "photo-2", "photo-3", "photo-4", "photo-5", "photo-6",
      "photo-7", "photo-8", "photo-9", "photo-10", "photo-11", "photo-12",
      "photo-13", "photo-14", "photo-15", "photo-16",
    ]);
  });

  it("BIRTHDAY_CITY_PIN_POSITIONS has exactly 16 entries", () => {
    expect(BIRTHDAY_CITY_PIN_POSITIONS).toHaveLength(16);
  });

  it("every pin position has x and y in 0..100 range", () => {
    for (const pos of BIRTHDAY_CITY_PIN_POSITIONS) {
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(100);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(100);
    }
  });
});
