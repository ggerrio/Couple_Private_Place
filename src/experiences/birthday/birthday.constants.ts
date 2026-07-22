/**
 * birthday.constants.ts
 *
 * Centralized celebration copy + accent color used by every birthday
 * scene. Single source of truth so future derivatives / re-skins /
 * additional celebrants don't drift and re-introduce the same
 * string drift we saw when the postcard era got replaced with a
 * celebration aesthetic.
 *
 * ── Usage guidelines ─────────────────────────────────────────────────────--
 *   • TEXT content personalization (recipient name, quote, letter lines,
 *     photo captions) lives in `BIRTHDAY_CONTENT` (birthday.data.ts).
 *     This module is for **UI chrome** — the evergreen celebration
 *     ribbons, eyebrows, and footers that survive personalization.
 *   • Color tokens are exposed both as a hex value (CELEBRATION_ACCENT)
 *     and as a CSS custom property name (CELEBRATION_ACCENT_VAR).
 *     The ExperienceOverlay component injects the variable on its root
 *     so scene files can reference it via Tailwind arbitrary values:
 *       `text-[color:var(--cel-accent)]`
 *       `text-[color:var(--cel-accent)]/70`
 *     The literal class strings stay in source so JIT picks them up
 *     at build time — we never template-literal the colour.
 * ───────────────────────────────────────────────────────────────────────────
 */

// ─── Eyebrow / badge copy ──────────────────────────────────────────────────
/**
 * 🎂 HAPPY BIRTHDAY! 🎂
 * Serif italic uppercase eyebrow used in IntroScene, ScrapbookScene,
 * and the postcard back/Postcard-arrival header.
 *
 * Title-case variant (🎂 Happy Birthday! 🎂) lives in BIRTHDAY_BADGE.TITLE
 * and is reserved for the bold-sans pink header strip on photo-slide
 * front-of-postcards.
 */
export const BIRTHDAY_BADGE = {
  UPPER:   "🎂 HAPPY BIRTHDAY! 🎂",
  TITLE:   "🎂 Happy Birthday! 🎂",
} as const;

// ─── Postcard footer flourishes ───────────────────────────────────────────
/**
 * Tiny bottom-corner micro-text that tags each scene as "one of the
 * sixteen memories" without dominating the layout.
 */
export const BIRTHDAY_FOOTER = {
  /** Scene 3 — ScrapbookScene left edge label */
  SIXTEEN_MEMORIES: "🎂 sixteen memories 🎂",
  /** Scene 20 — EndingScene top-of-card label */
  LAST_MEMORY:      "🎂 the last memory 🎂",
} as const;

/**
 * PhotoSlide front-postcard footer template.
 *
 *   ✿ memory · {dateStamp} ✿
 *
 * `dateStamp` is supplied per-slide by BIRTHDAY_PHOTO_VARIANTS
 * (typically a Roman numeral: "I", "II", ... "XVI").
 */
export function memoryFooter(dateStamp: string): string {
  const safe = (dateStamp ?? "").trim();
  // Match cityFooter's empty-input contract: the two footer-prefix
  // helpers (memoryFooter / cityFooter) render nothing for absent
  // input rather than dangling separators, so callers never have to
  // pre-filter. Note: endingBadge / dialogTitle fall back to
  // non-empty strings (BIRTHDAY_BADGE.UPPER / "Birthday") — they're
  // surfacing rather than erasing the celebrant.
  return safe ? `✿ memory · ${safe} ✿` : "";
}

/**
 * EndingScene eyebrow — bold punchy headline with the recipient's
 * actual name. Stays a helper (not a constant) because it composes
 * user-personalized content with the evergreen badge framing.
 *
 *   🎂 HAPPY BIRTHDAY NICOLA! 🎂
 */
export function endingBadge(recipientName: string): string {
  const name = (recipientName ?? "").trim();
  return name ? `🎂 HAPPY BIRTHDAY ${name.toUpperCase()}! 🎂` : BIRTHDAY_BADGE.UPPER;
}

/**
 * Dialog aria-label compositon — used by BirthdayExperience wrapper
 * so the screen-reader announcement tracks the actual celebrant
 * (drift-proof when BIRTHDAY_CONTENT.recipientName changes).
 *
 *   Happy Birthday Nicola
 */
export function dialogTitle(recipientName: string): string {
  const name = (recipientName ?? "").trim();
  return name ? `Happy Birthday ${name}` : "Birthday";
}

/**
 * IntroScene postcard body copy —
 * replaces the previous "Dearest Nicola — every mile between us is a
 * postcard waiting to be sent." which read too letter-y for a
 * celebration aesthetic.
 *
 *   Today we celebrate you, Nicola ✿
 */
export function openingLine(recipientName: string): string {
  const name = (recipientName ?? "").trim();
  return name ? `Today we celebrate you, ${name} ✿` : "Today we celebrate you ✿";
}

/**
 * ScrapbookScene LEFT-half letter sign-off —
 * replaces the previous "— Yours, always. ✦" which still carried the
 * old consolation-letter vibe.
 *
 *   — Make a wish, Nicola! 🎂
 */
export function letterSignOff(recipientName: string): string {
  const name = (recipientName ?? "").trim();
  return name ? `— Make a wish, ${name}! 🎂` : "— Make a wish! 🎂";
}

/**
 * PhotoSlide back-postcard bottom-right footer template.
 *
 *   🎂 {postcardCity} 🎂
 *
 * `postcardCity` is supplied per-slide by BIRTHDAY_PHOTO_VARIANTS.
 * Returned string drops the badge entirely if no city is supplied.
 */
export function cityFooter(postcardCity: string): string {
  const safe = (postcardCity ?? "").trim();
  return safe ? `🎂 ${safe} 🎂` : "";
}

// ─── Celebration accent colour ────────────────────────────────────────────
/**
 * Deep rose-pink accent used by the celebration headers, postcard
 * eyebrows, and postcard footers. Distinct from the lighter
 * `CELEBRATION_PINK` (#F8C8DC) balloon/petal palette defined in
 * `svg/Decorations.tsx`:
 *
 *   • CELEBRATION_ACCENT — hsl(~341°, 53%, 45%)  — deep, header/eyebrow copy
 *   • CELEBRATION_PINK   — hsl(~341°, 85%, 90%) — pale, balloons/petals
 *
 * They share hue but contrast in **lightness** (the dominant
 * separator), not just saturation. Use ACCENT on cream paper for
 * legible micro-text; use PINK as a fill/graphic accent.
 */
export const CELEBRATION_ACCENT = "#c1476b";

/**
 * CSS custom property name applied at the ExperienceOverlay root.
 * Scene files reference it via Tailwind arbitrary values, e.g.:
 *   `text-[color:var(--cel-accent)]/70`
 * The literal class strings must appear verbatim in source so
 * Tailwind's scanner picks them up at build time.
 */
export const CELEBRATION_ACCENT_VAR = "--cel-accent";
