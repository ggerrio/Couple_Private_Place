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

// ── Photo collection ─────────────────────────────────────────────────
const photoModules = import.meta.glob<{ default: string }>(
  "../../assets/birthday/photos/*.jpeg",
  { eager: true },
);

const sortedPhotoEntries = Object.entries(photoModules).sort(([a], [b]) => {
  const numA = parseInt(a.match(/\((\d+)\)/)?.[1] ?? "0", 10);
  const numB = parseInt(b.match(/\((\d+)\)/)?.[1] ?? "0", 10);
  return numA - numB;
});

export const BIRTHDAY_PHOTOS: BirthdayPhoto[] = sortedPhotoEntries.map(
  ([path, mod], idx) => ({
    id: `sweet-heart-${idx + 1}`,
    src: (mod as { default: string }).default,
    caption: "",
  }),
);

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
export const BIRTHDAY_PHOTO_VARIANTS: BirthdayPhotoVariant[] = [
  // 1. F — Jakarta — sage washi
  {
    layoutType: "full-bleed-hero",
    postcardSide: "front",
    postcardCity: "Jakarta",
    postcardDate: "27 · VII",
    postcardCountry: "Indonesia",
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
  // 2. F — Bandung — rose washi
  {
    layoutType: "asymmetric-portrait",
    postcardSide: "front",
    postcardCity: "Bandung",
    postcardDate: "27 · VII",
    postcardCountry: "Indonesia",
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
  // 3. B — Yogyakarta — paperclip
  {
    layoutType: "editorial-two-column",
    postcardSide: "back",
    postcardCity: "Yogyakarta",
    postcardDate: "27 · VII",
    postcardCountry: "Indonesia",
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
  // 4. F — Bali — heavy tilt, lavender corner
  {
    layoutType: "floating-tilt",
    postcardSide: "front",
    postcardCity: "Bali",
    postcardDate: "27 · VII",
    postcardCountry: "Indonesia",
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
  // 5. B — Semarang — wax seal
  {
    layoutType: "magazine-gallery",
    postcardSide: "back",
    postcardCity: "Semarang",
    postcardDate: "27 · VII",
    postcardCountry: "Indonesia",
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
  // 6. F — Malang — center polaroid, tan top washi
  {
    layoutType: "polaroid-stack",
    postcardSide: "front",
    postcardCity: "Malang",
    postcardDate: "27 · VII",
    postcardCountry: "Indonesia",
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
  // 7. F — Bogor — sage corners
  {
    layoutType: "centered-portrait",
    postcardSide: "front",
    postcardCity: "Bogor",
    postcardDate: "27 · VII",
    postcardCountry: "Indonesia",
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
  // 8. B — Surabaya — hanging thread
  {
    layoutType: "diagonal-pair",
    postcardSide: "back",
    postcardCity: "Surabaya",
    postcardDate: "27 · VII",
    postcardCountry: "Indonesia",
    rotation: -0.2,
    decoration: "thread-hang",
    decorationColor: "gold",
    captionPosition: "overleaf",
    captionStyle: "handwrite",
    captionRotation: -0.6,
    aspect: "square",
    cropMode: "square",
    kenBurns: "static",
    hueTint: "cream",
    borderStyle: "polaroid",
    pageNumberStyle: "roman",
    ephemera: "none",
    stampMotif: "star",
    stampColor: "ochre",
    dateStamp: "VIII",
  },
  // 9. F — Manila — heavy gold corner
  {
    layoutType: "full-width-landscape",
    postcardSide: "front",
    postcardCity: "Manila",
    postcardDate: "27 · VII",
    postcardCountry: "Pilipinas",
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
  // 10. F — Singapore — center thin-frame
  {
    layoutType: "double-page-spread",
    postcardSide: "front",
    postcardCity: "Singapore",
    postcardDate: "27 · VII",
    postcardCountry: "Singapura",
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
  // 11. B — Kuala Lumpur — paperclip, typewriter
  {
    layoutType: "square-focus",
    postcardSide: "back",
    postcardCity: "Kuala Lumpur",
    postcardDate: "27 · VII",
    postcardCountry: "Malaysia",
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
  // 12. B — Bangkok — heavy tilt, torn edge
  {
    layoutType: "editorial-offset-story",
    postcardSide: "back",
    postcardCity: "Bangkok",
    postcardDate: "27 · VII",
    postcardCountry: "Thailand",
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
  // 13. F — Tokyo — center polaroid, sage top washi + wax combo
  {
    layoutType: "framed-art-print",
    postcardSide: "front",
    postcardCity: "Tokyo",
    postcardDate: "27 · VII",
    postcardCountry: "Japan",
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
  // 14. F — Osaka — heavy tilt, gold corner
  {
    layoutType: "overlapping-strip",
    postcardSide: "front",
    postcardCity: "Osaka",
    postcardDate: "27 · VII",
    postcardCountry: "Japan",
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
  // 15. B — Kyoto — letter, paperclip
  {
    layoutType: "quiet-minimal",
    postcardSide: "back",
    postcardCity: "Kyoto",
    postcardDate: "27 · VII",
    postcardCountry: "Japan",
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
  // 16. F — FINALE: kembali ke Jakarta — biggest, most colorful
  {
    layoutType: "finale-hero",
    postcardSide: "front",
    postcardCity: "Jakarta",
    postcardDate: "27 · VII · MMXXVI",
    postcardCountry: "for you, always",
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

// ── Scene order & per-scene configuration ────────────────────────────
const ROMAN: string[] = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII",
  "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI",
];

export const BIRTHDAY_SCENE_ORDER: BirthdaySceneId[] = [
  "gift-open",
  "hero",
  "scrapbook",
  "photo-1", "photo-2", "photo-3", "photo-4",
  "photo-5", "photo-6", "photo-7", "photo-8",
  "photo-9", "photo-10", "photo-11", "photo-12",
  "photo-13", "photo-14", "photo-15", "photo-16",
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
    title: `${ROMAN[i] ?? i + 1} ${
      variant.postcardSide === "front" ? "Front" : "Back"
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
    ...BIRTHDAY_PHOTO_SCENES.slice(0, 7),
    {
      id: "map",
      title: "Atlas of Memories",
      layout: "interactive",
      advanceMode: "auto",
      durationMs: 8000,
      bgmVolume: 0.45,
      transitionVariant: "cinematic",
    },
    ...BIRTHDAY_PHOTO_SCENES.slice(7),
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
      durationMs: 7500,
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
  { x: 26, y: 46 }, // photo-2
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
  scrapbookQuote: "The shortest distance between two hearts is a single stamp.",
  letterLines: [
    "Nicola — di hari kamu bertambah satu tahun ini, ada satu hal yang jarang aku ucapkan keras-keras.",
    "kamu bukan cuma seseorang yang aku cintai — kamu adalah orang yang membuat dunia ini terasa begitu hangat, bahkan di hari-hari yang paling dingin sekalipun.",
    "Terima kasih sudah berjalan bersamaku melewati ribuan kilometer, kota-kota baru, dan setiap percakapan larut malam kita.",
    "As you blow out these candles, please remember that my heart is celebrating you from afar. Every mile between us is just a small chapter in our beautiful story.",
    "Make a wish, my love. I’ll be there to help you catch it.",
  ],
  endingMessage: "From Jakarta, with a love that doesn't expire.",
};

// ── Photo captions (16) — handwritten memory notes ──────────────────
// Each caption is anchored to the city on its matching slide. Marked
// `[GER: refine]` where only your actual inside-joke will land.
export const BIRTHDAY_PHOTO_CAPTIONS: Record<number, string> = {
  1: "Where our story first found its rhythm, under the quiet city lights.",
  2: "The mist was cold, but your hand in mine was the warmest shelter.",
  3: "Golden sunrises and sweet smiles; Yogyakarta felt like a dream painted just for us.",
  4: "Watching the waves crash at sunset, thinking how lucky I am to be lost in you.",
  5: "Walking through history, knowing you are my favorite era.",
  6: "Laughter in the apple orchards. You made even the simplest day feel like a movie.",
  7: "Under the canopy of green, I whispered a wish that came true: more days with you.",
  8: "My nervous heartbeat next to your calm, reassuring smile. We conquered it together.",
  9: "Through the busy streets and unfamiliar turns, I’d still choose to get lost with you.",
  10: "Lit up like the supertrees, my whole world glows whenever you look at me.",
  11: "Midnight skylines and quiet whispers. You shine brighter than any city light.",
  12: "Sweet, spicy, and full of laughter—just like every adventure we embark on.",
  13: "Lost in the neon crowds, yet my eyes could only ever focus on you.",
  14: "Sharing warm bites and cold breezes, holding you close was all I needed.",
  15: "Quiet bamboo paths, a gentle dusk, and a love that stands completely still in time.",
  16: "Sixteen cities mapped, but my home will always be wherever you are.",
};

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


