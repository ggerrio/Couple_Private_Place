/**
 * birthday.types.ts
 *
 * Type contracts for the Birthday Experience.
 *
 * Pipeline of 20 handcrafted pages — Vintage Postcard Suite:
 *
 *   1. gift-open    — envelope opens to reveal stack of postcards
 *   2. hero         — "A postcard for Nicola, from afar"
 *   3. scrapbook    — long handwritten letter on postcard-back layout
 *   4..19. photo-N  — 16 unique single-photo slides, alternating
 *                     postcard FRONT (photo-dominant) and BACK
 *                     (text-dominant with stamp + postmark)
 *   20. ending      — final postcard arrives at her door
 */

export type BirthdaySceneId =
  | "gift-open"
  | "hero"
  | "stats-favorites"
  | "scrapbook"
  | "photo-1"
  | "photo-2"
  | "photo-3"
  | "chapter-end-1"
  | "photo-4"
  | "photo-5"
  | "photo-6"
  | "photo-7"
  | "map"
  | "photo-8"
  | "photo-9"
  | "photo-10"
  | "chapter-end-2"
  | "photo-11"
  | "photo-12"
  | "photo-13"
  | "photo-14"
  | "photo-15"
  | "photo-16"
  | "stats-timeline"
  | "seal-close"
  | "ending";

export type BirthdayLayoutKind =
  | "interactive"
  | "cinematic"
  | "spread"
  | "single-photo"
  | "closing";

export interface BirthdaySceneConfig {
  id: BirthdaySceneId;
  /** Display title (debug / progress label). */
  title: string;
  order: number;
  layout: BirthdayLayoutKind;
  advanceMode: "auto" | "manual" | "interactive";
  durationMs?: number;
  bgmVolume?: number;
  /** Per-scene transition override. Falls back to PresentationEngine's default if omitted. */
  transitionVariant?: "fade" | "slide" | "cinematic" | "paper" | "flip" | "none";
}

export interface BirthdayPhoto {
  id: string;
  src: string;
  caption?: string;
  takenAt?: string;
}

export interface BirthdayContent {
  recipientName: string;
  heroSubtitle: string;
  heroText: string;
  letterLines: string[];
  /** Quote rendered on scrapbook scene right-page — sourced from data so it can be personalized. */
  scrapbookQuote: string;
  endingMessage: string;
}

export interface BirthdayTriggerState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export interface BirthdaySceneProps {
  isActive: boolean;
  onAdvance: () => void;
  onPrev: () => void;
  onSkip: () => void;
  /**
   * Optional replay callback. Provided by BirthdayExperience via the
   * engine's onReplay pipeline; only EndingScene consumes it today.
   * When present, the active scene can render a Replay affordance.
   */
  onReplay?: () => void;
  /**
   * Optional scene-jump callback. Provided by the engine so
   * reverse-navigable scenes (currently CityMapScene) can teleport
   * to a different scene by id without leaking engine state into
   * the scene component. Engine ignores unknown ids.
   */
  onJumpTo?: (sceneId: string) => void;
  isFirst: boolean;
  isLast: boolean;
  config: BirthdaySceneConfig;
  content: BirthdayContent;
  photos: BirthdayPhoto[];
  meta?: unknown;
}

export type PostcardSide = "front" | "back";

/**
 * Visual configuration for a single photo slide (Vintage Postcard Suite).
 */
export interface BirthdayPhotoVariant {
  /** Card rotation in degrees (-7..+7). Heavy tilts use ±5..±7. */
  rotation: number;

  /**
   * Which side of the postcard this slide shows:
   * - "front" — photo dominates 80% of card; small "POSTCARD FROM <city>" header top; stamp + postmark bottom-right.
   * - "back"  — small photo top-left, handwritten message fills center, address lines + stamp + postmark on right half.
   */
  postcardSide: PostcardSide;

  /** Origin city on the postmark + header ("A POSTCARD FROM JAKARTA"). */
  postcardCity: string;
  /** Date string on the postmark + date stamp ("27 · VII · MMXXVI"). */
  postcardDate: string;
  /** Optional country shown above address lines on BACK slides. */
  postcardCountry?: string;

  /** Decorative anchor atop the front-side photo card. */
  decoration:
    | "washi-top"
    | "washi-corner"
    | "safety-pin"
    | "paperclip"
    | "wax-seal"
    | "thread-hang"
    | "corners-only"
    | "none";
  decorationColor: "rose" | "sage" | "tan" | "lavender" | "gold";
  captionPosition:
    | "inside-bottom"
    | "outside-bottom"
    | "overlay-side"
    | "corner-stamp"
    | "overleaf";
  captionStyle: "handwrite" | "serif" | "script" | "typewriter";
  captionRotation: number;
  cropMode: "portrait" | "square" | "wide" | "full-bleed";
  /**
   * Natural photo aspect bucket. Drives the postcard photo frame's
   * `aspect-ratio` CSS value so each image keeps its real proportions
   * inside the postcard without stretching/cropping distortion.
   *
   *   • "portrait"  → 3 / 4   (typical phone memory)
   *   • "square"    → 1 / 1   (IG-style, back-slide small photo)
   *   • "wide"      → 16 / 9  (architecture, group, landscape)
   *
   * If omitted, defaults to "portrait" so unknown variants still fit
   * inside the postcard paper without distortion.
   */
  aspect?: "portrait" | "square" | "wide";
  kenBurns: "zoom-in" | "zoom-out" | "pan-up" | "pan-left" | "static";
  hueTint: "cream" | "rose" | "sage" | "sepia" | "none";
  borderStyle: "polaroid" | "thin-frame" | "thick-paper" | "raw" | "torn";
  pageNumberStyle: "roman" | "arabic" | "stamp-letter" | "none";
  ephemera: "botany-corner" | "sparkle-corner" | "wax-corner" | "none";
  captionOverride?: string;
  dateStamp?: string;

  /** Optional motif for the postage stamp on this card. */
  stampMotif?: "rose" | "heart" | "star" | "fern" | "letter";
  /** Optional stamp color tint. */
  stampColor?: "muted-red" | "sage" | "indigo" | "ochre";

  /**
   * Editorial book layout composition. Ensures every single photo slide
   * has a unique visual presentation without consecutive repeats.
   */
  layoutType?:
    | "full-bleed-hero"
    | "asymmetric-portrait"
    | "editorial-two-column"
    | "floating-tilt"
    | "magazine-gallery"
    | "polaroid-stack"
    | "centered-portrait"
    | "diagonal-pair"
    | "full-width-landscape"
    | "double-page-spread"
    | "square-focus"
    | "editorial-offset-story"
    | "framed-art-print"
    | "overlapping-strip"
    | "quiet-minimal"
    | "finale-hero";
}
