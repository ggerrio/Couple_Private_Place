/**
 * birthday.data.ts
 *
 * Single source of truth for birthday scene list, photos, BGM, and
 * (now-personalized) content text for Nicola.
 *
 * ── Personalization map ──
 *   Edit `BIRTHDAY_CONTENT` (names + letter + ending line).
 *   Edit `BIRTHDAY_PHOTO_CAPTIONS` (16 handwritten memory notes).
 *   Search for `[GER: refine]` to find the lines where only you
 *   can write the actual inside joke / memory that makes this
 *   experience real instead of template.
 *
 * ── POSTCARD SUITE ───
 *   The 16 single-photo slides are styled as a sequence of vintage
 *   postcards Nicola receives. Each variant declares its ORIGIN CITY
 *   and DATE on the postmark + caption header. Pattern is staggered
 *   (F-F-B-F-B-F-F-B-F-F-B-B-F-F-B-F) so user sees 10 FRONTS and
 *   6 BACKS in an organic rhythm — not perfectly alternate.
 *   Starts and ends on FRONT to maximize photo impact.
 *
 * ── Caption authoring notes ──
 *   Every caption is anchored to the city on that slide so each
 *   postcard feels like it was mailed FROM somewhere specific.
 *   Length: ~12-20 words (fits handwritten caption slot rotated by
 *   captionRotation). No cap on creativity.
 */

import birthdayBGM from "../../assets/birthday/music/Happy-Birthday-Arranged-by-Mira.mp3";
import type {
  BirthdayPhoto,
  BirthdayContent,
  BirthdayPhotoVariant,
  BirthdaySceneId,
  BirthdaySceneConfig,
} from "./birthday.types";

// ── Photo Imports ───────────────────────────────────────────────────
import photo1 from "../../assets/birthday/photos/roblox_1.png";
import photo2 from "../../assets/birthday/photos/sweet_heart_(2).jpeg";
import photo3 from "../../assets/birthday/photos/sweet_heart_(11).jpeg";
import photo4 from "../../assets/birthday/photos/Our_Sketch_Masterpiece.jpg";
import photo5 from "../../assets/birthday/photos/heartopia_2.jpg";
import photo6 from "../../assets/birthday/photos/sweet_heart_(6).jpeg";
import photo7 from "../../assets/birthday/photos/sweet_heart_(7).jpeg";
import photo8 from "../../assets/birthday/photos/sweet_heart_(16).jpeg";
import photo9 from "../../assets/birthday/photos/It_Takes_Two_7_23_2026.png";
import photo10 from "../../assets/birthday/photos/sweet_heart_(19).jpeg";
import photo11 from "../../assets/birthday/photos/sweet_heart_(5).jpeg";
import photo12 from "../../assets/birthday/photos/sweet_heart_(12).jpeg";
import photo13 from "../../assets/birthday/photos/sweet_heart_(17).jpeg";
import photo14 from "../../assets/birthday/photos/Screenshot_1.png";
import photo15 from "../../assets/birthday/photos/sweet_heart_(9).jpeg";
import photo16 from "../../assets/birthday/photos/sweet_heart_(18).jpeg";
import statsPhoto from "../../assets/birthday/photos/sweet_heart_(1).jpeg";

// Foto khusus untuk Slide 3 ("CHAPTER I · THE ESSENCE OF YOU")
export const STATS_FAVORITES_PHOTO = statsPhoto;

// ════════════════════════════════════════════════════════════════════════
// 📸 PENGATURAN SLIDE FOTO (SLIDE 1 - 16)
// Edit Foto, Judul Header, Subtitle, dan Caption per slide DI SINI!
// ════════════════════════════════════════════════════════════════════════
export interface SlideConfigItem {
  slide: number;
  photo: string;
  headerTitle: string;
  headerSubtitle: string;
  caption: string;
}

export const SLIDES_CONFIG: SlideConfigItem[] = [
  {
    slide: 1,
    photo: photo1,
    headerTitle: "CHAPTER I",
    headerSubtitle: "OUR STORY",
    caption: "I still smile every time I see this.",
  },
  {
    slide: 2,
    photo: photo2,
    headerTitle: "FIRST SMILE",
    headerSubtitle: "SWEET MOMENT",
    caption: "Some moments never ask for attention. They simply become unforgettable.",
  },
  {
    slide: 3,
    photo: photo3,
    headerTitle: "YOGYAKARTA",
    headerSubtitle: "SWEET MEMORY",
    caption: "If happiness had a face, it'd probably look a little like this.",
  },
  {
    slide: 4,
    photo: photo4,
    headerTitle: "SUNSET WAVES",
    headerSubtitle: "OCEAN BREEZE",
    caption: "I don't remember every word we said. I only remember not wanting the day to end.",
  },
  {
    slide: 5,
    photo: photo5,
    headerTitle: "ANCIENT PATHS",
    headerSubtitle: "TIMELESS MOMENT",
    caption: "It's funny how love quietly hides inside ordinary moments.",
  },
  {
    slide: 6,
    photo: photo6,
    headerTitle: "ORCHARD LAUGHTER",
    headerSubtitle: "SWEET DAYS",
    caption: "You probably didn't notice it. I did.",
  },
  {
    slide: 7,
    photo: photo7,
    headerTitle: "GREEN CANOPY",
    headerSubtitle: "WISH COME TRUE",
    caption: "One picture. A thousand little feelings.",
  },
  {
    slide: 8,
    photo: photo8,
    headerTitle: "CALM SMILE",
    headerSubtitle: "TOGETHER ALWAYS",
    caption: "Somehow... you always make every place feel like home.",
  },
  {
    slide: 9,
    photo: photo9,
    headerTitle: "BUSY STREETS",
    headerSubtitle: "LOST WITH YOU",
    caption: "Thank you for every ordinary day that somehow became extraordinary.",
  },
  {
    slide: 10,
    photo: photo10,
    headerTitle: "GARDEN GLOW",
    headerSubtitle: "MY WHOLE WORLD",
    caption: "We never needed perfect moments. We only needed each other.",
  },
  {
    slide: 11,
    photo: photo11,
    headerTitle: "NIGHT SKYLINE",
    headerSubtitle: "BRIGHTEST LIGHT",
    caption: "I hope this memory never gets old.",
  },
  {
    slide: 12,
    photo: photo12,
    headerTitle: "STREET BITES",
    headerSubtitle: "SWEET & SPICY",
    caption: "I hope one day you get to see yourself the way I see you. Not just as someone beautiful, but as the person who quietly became my safest place, my favorite thought, and the reason so many ordinary days turned into memories I'll always want to keep.",
  },
  {
    slide: 13,
    photo: photo13,
    headerTitle: "NEON CROWD",
    headerSubtitle: "ONLY YOU",
    caption: "Even distance couldn't make this memory any smaller.",
  },
  {
    slide: 14,
    photo: photo14,
    headerTitle: "COLD BITES",
    headerSubtitle: "HOLD ME CLOSE",
    caption: "Another page. Another reason to be grateful.",
  },
  {
    slide: 15,
    photo: photo15,
    headerTitle: "BAMBOO PATH",
    headerSubtitle: "STILL IN TIME",
    caption: "Every picture tells a story. My favorite stories always have you in them.",
  },
  {
    slide: 16,
    photo: photo16,
    headerTitle: "MY HOME",
    headerSubtitle: "FOREVER & ALWAYS",
    caption: "And somehow... we're still writing the next chapter.",
  },
];

export const BIRTHDAY_PHOTOS: BirthdayPhoto[] = [
  ...SLIDES_CONFIG.map((s, idx) => ({
    id: `sweet-heart-${idx + 1}`,
    src: s.photo,
    caption: s.caption,
  })),
  {
    id: "sweet-heart-stats",
    src: STATS_FAVORITES_PHOTO,
    caption: "our favorite memory ✿",
  },
];

// ── Music ────────────────────────────────────────────────────────────
export const BIRTHDAY_BGM_SRC: string = birthdayBGM;

// ── Photo variants (16) — POSTCARD SUITE ────────────────────────────
// Pattern: F-F-B-F-B-F-F-B-F-F-B-B-F-F-B-F
// start + end on FRONT. 10 fronts (photo-dominant), 6 backs (text).
//
// postcardCity choices reflect actual travel Ger + Nicola have shared
// (Indonesia, then up the long-distance arc: Manila, Singapore, KL,
// Bangkok, Tokyo, Osaka, Kyoto, then closing back in Jakarta). Each
// postcardCity is referenced in its matching caption — when you swap
// the caption for an inside-joke, keep the city anchor so the
// postmark still feels authentic.
const BASE_PHOTO_VARIANTS: BirthdayPhotoVariant[] = [
  // 1. F — CHAPTER I — sage washi
  {
    layoutType: "full-bleed-hero",
    postcardSide: "front",
    postcardCity: "CHAPTER I",
    postcardDate: "27 · VII",
    postcardCountry: "OUR STORY",
    rotation: -1.8,
    decoration: "washi-top",
    decorationColor: "sage",
    captionPosition: "inside-bottom",
    captionStyle: "handwrite",
    captionRotation: -0.8,
    aspect: "portrait",
    cropMode: "portrait",
    kenBurns: "zoom-in",
    hueTint: "cream",
    borderStyle: "thin-frame",
    pageNumberStyle: "roman",
    ephemera: "botany-corner",
    stampMotif: "rose",
    stampColor: "muted-red",
    dateStamp: "I",
  },
  // 2. F — FIRST SMILE — rose washi
  {
    layoutType: "asymmetric-portrait",
    postcardSide: "front",
    postcardCity: "FIRST SMILE",
    postcardDate: "27 · VII",
    postcardCountry: "SWEET MOMENT",
    rotation: 2.6,
    decoration: "washi-corner",
    decorationColor: "rose",
    captionPosition: "outside-bottom",
    captionStyle: "serif",
    captionRotation: -1.5,
    aspect: "portrait",
    cropMode: "portrait",
    kenBurns: "pan-up",
    hueTint: "rose",
    borderStyle: "polaroid",
    pageNumberStyle: "stamp-letter",
    ephemera: "sparkle-corner",
    stampMotif: "fern",
    stampColor: "ochre",
    dateStamp: "II",
  },
  // 3. B — GOLDEN HOUR — paperclip
  {
    layoutType: "editorial-two-column",
    postcardSide: "back",
    postcardCity: "GOLDEN HOUR",
    postcardDate: "27 · VII",
    postcardCountry: "WARM MEMORIES",
    rotation: 0.4,
    decoration: "paperclip",
    decorationColor: "tan",
    captionPosition: "overlay-side",
    captionStyle: "typewriter",
    captionRotation: 1.2,
    aspect: "square",
    cropMode: "square",
    kenBurns: "static",
    hueTint: "sepia",
    borderStyle: "thin-frame",
    pageNumberStyle: "arabic",
    ephemera: "none",
    stampMotif: "letter",
    stampColor: "ochre",
    dateStamp: "III",
  },
  // 4. F — LOVE & LIGHT — heavy tilt, lavender corner
  {
    layoutType: "floating-tilt",
    postcardSide: "front",
    postcardCity: "LOVE & LIGHT",
    postcardDate: "27 · VII",
    postcardCountry: "WITH YOU",
    rotation: -4.5,
    decoration: "washi-corner",
    decorationColor: "lavender",
    captionPosition: "inside-bottom",
    captionStyle: "handwrite",
    captionRotation: 1.6,
    aspect: "portrait",
    cropMode: "portrait",
    kenBurns: "zoom-out",
    hueTint: "rose",
    borderStyle: "torn",
    pageNumberStyle: "none",
    ephemera: "botany-corner",
    stampMotif: "star",
    stampColor: "sage",
    dateStamp: "IV",
  },
  // 5. B — LAUGHTER — wax seal
  {
    layoutType: "magazine-gallery",
    postcardSide: "back",
    postcardCity: "LAUGHTER",
    postcardDate: "27 · VII",
    postcardCountry: "UNFORGETTABLE",
    rotation: 1.6,
    decoration: "wax-seal",
    decorationColor: "rose",
    captionPosition: "corner-stamp",
    captionStyle: "serif",
    captionRotation: 0,
    aspect: "portrait",
    cropMode: "full-bleed",
    kenBurns: "pan-left",
    hueTint: "sage",
    borderStyle: "thick-paper",
    pageNumberStyle: "roman",
    ephemera: "wax-corner",
    stampMotif: "heart",
    stampColor: "muted-red",
    dateStamp: "V",
  },
  // 6. F — COZY NIGHTS — center polaroid, tan top washi
  {
    layoutType: "polaroid-stack",
    postcardSide: "front",
    postcardCity: "COZY NIGHTS",
    postcardDate: "27 · VII",
    postcardCountry: "FAVORITE DAYS",
    rotation: -1.4,
    decoration: "washi-top",
    decorationColor: "tan",
    captionPosition: "outside-bottom",
    captionStyle: "handwrite",
    captionRotation: -1.0,
    aspect: "portrait",
    cropMode: "portrait",
    kenBurns: "zoom-in",
    hueTint: "cream",
    borderStyle: "polaroid",
    pageNumberStyle: "stamp-letter",
    ephemera: "sparkle-corner",
    stampMotif: "rose",
    stampColor: "indigo",
    dateStamp: "VI",
  },
  // 7. F — DEAR NICOLA — sage corners
  {
    layoutType: "centered-portrait",
    postcardSide: "front",
    postcardCity: "DEAR NICOLA",
    postcardDate: "27 · VII",
    postcardCountry: "MY HEART",
    rotation: 2.4,
    decoration: "corners-only",
    decorationColor: "sage",
    captionPosition: "inside-bottom",
    captionStyle: "serif",
    captionRotation: 0.8,
    aspect: "portrait",
    cropMode: "portrait",
    kenBurns: "pan-up",
    hueTint: "sage",
    borderStyle: "thin-frame",
    pageNumberStyle: "arabic",
    ephemera: "botany-corner",
    stampMotif: "fern",
    stampColor: "sage",
    dateStamp: "VII",
  },
  // 8. B — OUR JOURNEY — hanging thread (PORTRAIT ORIENTATION)
  {
    layoutType: "diagonal-pair",
    postcardSide: "back",
    postcardCity: "OUR JOURNEY",
    postcardDate: "27 · VII",
    postcardCountry: "HAND IN HAND",
    rotation: -0.2,
    decoration: "thread-hang",
    decorationColor: "gold",
    captionPosition: "overleaf",
    captionStyle: "handwrite",
    captionRotation: -0.6,
    aspect: "portrait",
    cropMode: "portrait",
    kenBurns: "static",
    hueTint: "cream",
    borderStyle: "polaroid",
    pageNumberStyle: "roman",
    ephemera: "none",
    stampMotif: "star",
    stampColor: "ochre",
    dateStamp: "VIII",
  },
  // 9. F — BRIGHT SHINE — heavy gold corner
  {
    layoutType: "full-width-landscape",
    postcardSide: "front",
    postcardCity: "BRIGHT SHINE",
    postcardDate: "27 · VII",
    postcardCountry: "TOGETHER",
    rotation: 4.0,
    decoration: "washi-corner",
    decorationColor: "gold",
    captionPosition: "outside-bottom",
    captionStyle: "serif",
    captionRotation: -1.8,
    aspect: "portrait",
    cropMode: "portrait",
    kenBurns: "zoom-in",
    hueTint: "sepia",
    borderStyle: "polaroid",
    pageNumberStyle: "stamp-letter",
    ephemera: "sparkle-corner",
    stampMotif: "star",
    stampColor: "ochre",
    dateStamp: "IX",
  },
  // 10. F — SOULMATES — center thin-frame
  {
    layoutType: "double-page-spread",
    postcardSide: "front",
    postcardCity: "SOULMATES",
    postcardDate: "27 · VII",
    postcardCountry: "SIDE BY SIDE",
    rotation: -1.0,
    decoration: "washi-corner",
    decorationColor: "rose",
    captionPosition: "overlay-side",
    captionStyle: "script",
    captionRotation: -1.0,
    aspect: "wide",
    cropMode: "wide",
    kenBurns: "pan-left",
    hueTint: "rose",
    borderStyle: "thin-frame",
    pageNumberStyle: "arabic",
    ephemera: "wax-corner",
    stampMotif: "rose",
    stampColor: "muted-red",
    dateStamp: "X",
  },
  // 11. B — MIDNIGHT TALKS — paperclip, typewriter
  {
    layoutType: "square-focus",
    postcardSide: "back",
    postcardCity: "MIDNIGHT TALKS",
    postcardDate: "27 · VII",
    postcardCountry: "FOREVER",
    rotation: 1.0,
    decoration: "paperclip",
    decorationColor: "sage",
    captionPosition: "inside-bottom",
    captionStyle: "typewriter",
    captionRotation: 0,
    aspect: "square",
    cropMode: "square",
    kenBurns: "static",
    hueTint: "cream",
    borderStyle: "thin-frame",
    pageNumberStyle: "arabic",
    ephemera: "sparkle-corner",
    stampMotif: "letter",
    stampColor: "sage",
    dateStamp: "XI",
  },
  // 12. B — SWEET BLISS — heavy tilt, torn edge
  {
    layoutType: "editorial-offset-story",
    postcardSide: "back",
    postcardCity: "SWEET BLISS",
    postcardDate: "27 · VII",
    postcardCountry: "ALWAYS WE",
    rotation: -3.5,
    decoration: "washi-top",
    decorationColor: "lavender",
    captionPosition: "overleaf",
    captionStyle: "handwrite",
    captionRotation: 1.8,
    aspect: "portrait",
    cropMode: "portrait",
    kenBurns: "zoom-out",
    hueTint: "sepia",
    borderStyle: "torn",
    pageNumberStyle: "roman",
    ephemera: "botany-corner",
    stampMotif: "fern",
    stampColor: "indigo",
    dateStamp: "XII",
  },
  // 13. F — NEON DREAMS — center polaroid, sage top washi + wax combo
  {
    layoutType: "framed-art-print",
    postcardSide: "front",
    postcardCity: "NEON DREAMS",
    postcardDate: "27 · VII",
    postcardCountry: "JUST US TWO",
    rotation: 2.6,
    decoration: "wax-seal",
    decorationColor: "sage",
    captionPosition: "overleaf",
    captionStyle: "serif",
    captionRotation: -1.2,
    aspect: "portrait",
    cropMode: "full-bleed",
    kenBurns: "zoom-out",
    hueTint: "sage",
    borderStyle: "thick-paper",
    pageNumberStyle: "roman",
    ephemera: "wax-corner",
    stampMotif: "rose",
    stampColor: "indigo",
    dateStamp: "XIII",
  },
  // 14. F — WARM EMBRACE — heavy tilt, gold corner
  {
    layoutType: "overlapping-strip",
    postcardSide: "front",
    postcardCity: "WARM EMBRACE",
    postcardDate: "27 · VII",
    postcardCountry: "ENDLESS LOVE",
    rotation: -0.6,
    decoration: "thread-hang",
    decorationColor: "gold",
    captionPosition: "overleaf",
    captionStyle: "serif",
    captionRotation: -0.8,
    aspect: "wide",
    cropMode: "wide",
    kenBurns: "zoom-in",
    hueTint: "cream",
    borderStyle: "polaroid",
    pageNumberStyle: "stamp-letter",
    ephemera: "none",
    stampMotif: "star",
    stampColor: "ochre",
    dateStamp: "XIV",
  },
  // 15. B — QUIET WONDER — letter, paperclip
  {
    layoutType: "quiet-minimal",
    postcardSide: "back",
    postcardCity: "QUIET WONDER",
    postcardDate: "27 · VII",
    postcardCountry: "STILL TIME",
    rotation: 1.4,
    decoration: "paperclip",
    decorationColor: "tan",
    captionPosition: "inside-bottom",
    captionStyle: "script",
    captionRotation: 0.8,
    aspect: "square",
    cropMode: "square",
    kenBurns: "static",
    hueTint: "sepia",
    borderStyle: "thin-frame",
    pageNumberStyle: "roman",
    ephemera: "none",
    stampMotif: "letter",
    stampColor: "muted-red",
    dateStamp: "XV",
  },
  // 16. F — FINALE: FOREVER & EVER — biggest, most colorful
  {
    layoutType: "finale-hero",
    postcardSide: "front",
    postcardCity: "FOREVER & EVER",
    postcardDate: "27 · VII · MMXXVI",
    postcardCountry: "FOR YOU ALWAYS",
    rotation: -1.5,
    decoration: "washi-top",
    decorationColor: "rose",
    captionPosition: "outside-bottom",
    captionStyle: "serif",
    captionRotation: 0,
    aspect: "portrait",
    cropMode: "full-bleed",
    kenBurns: "zoom-in",
    hueTint: "rose",
    borderStyle: "thick-paper",
    pageNumberStyle: "roman",
    ephemera: "wax-corner",
    stampMotif: "heart",
    stampColor: "muted-red",
    dateStamp: "XVI · the finale",
  },
];

export const BIRTHDAY_PHOTO_VARIANTS: BirthdayPhotoVariant[] = BASE_PHOTO_VARIANTS.map(
  (variant, idx) => ({
    ...variant,
    postcardCity: SLIDES_CONFIG[idx]?.headerTitle ?? variant.postcardCity,
    postcardCountry: SLIDES_CONFIG[idx]?.headerSubtitle ?? variant.postcardCountry,
  })
);

// ── Scene order & per-scene configuration ────────────────────────────
const ROMAN: string[] = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII",
  "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI",
];

export const BIRTHDAY_SCENE_ORDER: BirthdaySceneId[] = [
  "gift-open",
  "hero",
  "stats-favorites",
  "scrapbook",
  "photo-1", "photo-2", "photo-3",
  "chapter-end-1",
  "photo-4", "photo-5", "photo-6", "photo-7",
  "map",
  "photo-8", "photo-9", "photo-10",
  "chapter-end-2",
  "photo-11", "photo-12", "photo-13", "photo-14", "photo-15", "photo-16",
  "stats-timeline",
  "seal-close",
  "ending",
];

// ══════════════════════════════════════════════════════════════════════════
// P4 — `map` reverse-nav montage splices between photo-7 and photo-8.
// PreOrderScene strips `order` so the literal array below can be cast
// once to `PreOrderScene[]` (avoiding the "object-literal widening"
// TS error you get when unannotated object literals + spreads are
// assigned to a typed array). We re-sequence by index at the end so
// `order` is reliably 1..Nsequential for any consumer (progress HUD,
// debug overlay, etc.). Order is then a property of BIRTHDAY_SCENES
// only — the intermediate BIRTHDAY_PHOTO_SCENES const never carries it.
// ══════════════════════════════════════════════════════════════════════════
type PreOrderScene = Omit<BirthdaySceneConfig, "order">;

const BIRTHDAY_PHOTO_SCENES: PreOrderScene[] = BIRTHDAY_PHOTO_VARIANTS.map(
  (variant, i) => ({
    id: `photo-${i + 1}` as BirthdaySceneId,
    title: `${ROMAN[i] ?? i + 1} ${variant.postcardSide === "front" ? "Front" : "Back"
      } — ${variant.postcardCity}`,
    layout: "single-photo" as const,
    advanceMode: "manual" as const,
    bgmVolume: 0.72,
  }),
);

export const BIRTHDAY_SCENES: BirthdaySceneConfig[] = (
  [
    {
      id: "gift-open",
      title: "Open Your Envelope",
      layout: "interactive",
      advanceMode: "interactive",
      bgmVolume: 0.35,
      transitionVariant: "cinematic",
    },
    {
      id: "hero",
      title: "A Postcard for You",
      layout: "cinematic",
      advanceMode: "auto",
      durationMs: 7000,
      bgmVolume: 0.55,
      transitionVariant: "fade",
    },
    {
      id: "stats-favorites",
      title: "All About Nicola",
      layout: "spread",
      advanceMode: "manual",
      bgmVolume: 0.65,
      transitionVariant: "slide",
    },
    {
      id: "scrapbook",
      title: "A Letter From Afar",
      layout: "spread",
      advanceMode: "manual",
      bgmVolume: 0.65,
      transitionVariant: "slide",
    },
    ...BIRTHDAY_PHOTO_SCENES.slice(0, 3),
    {
      id: "chapter-end-1",
      title: "End of Chapter I",
      layout: "cinematic",
      advanceMode: "auto",
      durationMs: 3800,
      bgmVolume: 0.55,
      transitionVariant: "paper",
    },
    ...BIRTHDAY_PHOTO_SCENES.slice(3, 7),
    {
      id: "map",
      title: "A Few Things I'll Always Remember",
      layout: "cinematic",
      advanceMode: "auto",
      durationMs: 4600,
      bgmVolume: 0.45,
      transitionVariant: "paper",
    },
    ...BIRTHDAY_PHOTO_SCENES.slice(7, 10),
    {
      id: "chapter-end-2",
      title: "End of Chapter II",
      layout: "cinematic",
      advanceMode: "auto",
      durationMs: 3800,
      bgmVolume: 0.50,
      transitionVariant: "paper",
    },
    ...BIRTHDAY_PHOTO_SCENES.slice(10),
    {
      id: "stats-timeline",
      title: "Our Love in Numbers",
      layout: "interactive",
      advanceMode: "manual",
      bgmVolume: 0.60,
      transitionVariant: "slide",
    },
    {
      id: "seal-close",
      title: "Sealed With Love",
      layout: "cinematic",
      advanceMode: "auto",
      durationMs: 4000,
      bgmVolume: 0.40,
      transitionVariant: "fade",
    },
    {
      id: "ending",
      title: "Yours, Always",
      layout: "closing",
      advanceMode: "manual",
      bgmVolume: 0.5,
      transitionVariant: "fade",
    },
  ] as PreOrderScene[]
).map((scene, idx) => ({ ...scene, order: idx + 1 }));

// ── P4 City-map pin positions (16) ────────────────────────────────
// Each entry is a {x, y} percentage on the 800×500 viewBox in
// CityMapScene. The arrangement is a fantasy-atlas layout: cluster
// photo-1..7 along the north-west coast, photo-8..12 sweep eastward,
// photo-13..16 arc back south-east. The dashed travel-arc in the
// scene's SVG reads naturally against this scatter.
export const BIRTHDAY_CITY_PIN_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 18, y: 32 }, // photo-1
  { x: 18, y: 32 }, // photo-2
  { x: 22, y: 28 }, // photo-3
  { x: 36, y: 42 }, // photo-4
  { x: 32, y: 54 }, // photo-5
  { x: 44, y: 34 }, // photo-6
  { x: 50, y: 46 }, // photo-7
  // (map splices between photo-7 and photo-8)
  { x: 56, y: 30 }, // photo-8
  { x: 62, y: 46 }, // photo-9
  { x: 70, y: 36 }, // photo-10
  { x: 76, y: 50 }, // photo-11
  { x: 82, y: 40 }, // photo-12
  { x: 56, y: 62 }, // photo-13
  { x: 66, y: 70 }, // photo-14
  { x: 76, y: 66 }, // photo-15
  { x: 84, y: 58 }, // photo-16
];

// ── Personal content ─────────────────────────────────────────────────
// [personalize] — refine where marked with [GER: refine].
export const BIRTHDAY_CONTENT: BirthdayContent = {
  recipientName: "Nicola",
  heroSubtitle: "A Postcard for You",
  heroText: "Nicola",
  scrapbookQuote: "If I could keep time somewhere, I'd probably keep it here.",
  letterLines: [
    "I spent a long time thinking about what kind of gift could truly match someone like you.",
    "Then I realized... Some gifts are opened once. But memories can be opened again and again.",
    "So I made this little book. A place where a few of my favorite moments could quietly live.",
    "I hope whenever life feels heavy, you can return here, turn these pages, and remember just how deeply you are loved.",
    "Happy Birthday. Thank you for becoming one of the most beautiful chapters of my life.",
  ],
  endingMessage: "From Jakarta, with a love that doesn't expire.",
};

// ── Photo captions (16) — automatically derived from SLIDES_CONFIG ──
export const BIRTHDAY_PHOTO_CAPTIONS: Record<number, string> = Object.fromEntries(
  SLIDES_CONFIG.map((s) => [s.slide, s.caption])
);

// ── Chapter II: Little Things I Love About You ───────────────────────
export interface LittleThingItem {
  id: number;
  title: string;
  subtitle: string;
  note: string;
  icon: string;
}

export const LITTLE_THINGS_ITEMS: LittleThingItem[] = [
  {
    id: 1,
    title: "Your Cozy Smile",
    subtitle: "Pure Warmth",
    note: "The way your smile brightens the whole room when you wrap up in a cozy sweater with hot cocoa.",
    icon: "☕",
  },
  {
    id: 2,
    title: "Home In Any City",
    subtitle: "Sanctuary",
    note: "Wherever we land across thousands of miles, your presence makes the place instantly feel like home.",
    icon: "🏡",
  },
  {
    id: 3,
    title: "Late Night Whispers",
    subtitle: "Deep Connection",
    note: "Our endless conversations under midnight lights, sharing wild dreams and quiet thoughts.",
    icon: "🌙",
  },
  {
    id: 4,
    title: "Quiet Reading Evenings",
    subtitle: "Peaceful Moments",
    note: "Sitting side by side with a good book, perfectly content without needing to say a single word.",
    icon: "📖",
  },
  {
    id: 5,
    title: "The Sparkle In Your Eyes",
    subtitle: "Pure Joy",
    note: "How your eyes light up with pure wonder whenever you discover something sweet or unexpected.",
    icon: "✨",
  },
  {
    id: 6,
    title: "Your Endless Kindness",
    subtitle: "Beautiful Heart",
    note: "The gentle, unconditional care and warmth you shower on everyone around you every single day.",
    icon: "🤍",
  },
];


