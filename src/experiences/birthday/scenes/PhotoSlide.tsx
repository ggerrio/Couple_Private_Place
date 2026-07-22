/**
 * PhotoSlide.tsx
 *
 * "A Handcrafted Interactive Digital Book" — Award-Winning Monograph Edition.
 *
 * ABSOLUTE RULE:
 *   No two consecutive pages share the same layout composition!
 *   Each page is an interactive physical object (liftable photos,
 *   unfoldable paper notes, polaroid stack swaps, memory envelopes).
 */

import React, { useState } from "react";
import { motion, useReducedMotion, useMotionValue, useTransform, useSpring } from "motion/react";
import {
  WashiTape,
  Sparkle,
  Botany,
  WaxSeal,
  PaperClip,
  HangingThread,
  VintageStamp,
  PostmarkReal,
} from "../svg/Decorations";
import type {
  BirthdaySceneProps,
  BirthdayPhotoVariant,
} from "../birthday.types";
import { BIRTHDAY_PHOTO_CAPTIONS } from "../birthday.data";
import { useAudioAmplitude } from "../../core/audioAmplitude";
import { playPageTurnSound, playEnvelopeSound } from "../birthday.utils";

interface PhotoSlideMeta {
  variant: BirthdayPhotoVariant;
  photoIdx: number;
}

const ROMAN = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII",
  "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI",
];

export function PhotoSlide(props: BirthdaySceneProps) {
  const { meta, photos, onAdvance } = props;
  const m = (meta ?? null) as PhotoSlideMeta | null;
  const variant = m?.variant;
  const photoIdx = m?.photoIdx ?? 0;
  const photo = photos[photoIdx];
  const nextPhoto = photos[(photoIdx + 1) % photos.length];
  const reduced = useReducedMotion();
  const amp = useAudioAmplitude();

  // Physical Interactive States
  const [isPhotoLifted, setIsPhotoLifted] = useState(false);
  const [isNoteUnfolded, setIsNoteUnfolded] = useState(false);
  const [stackFlipped, setStackFlipped] = useState(false);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 20 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduced) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const xVal = e.clientX - rect.left - width / 2;
    const yVal = e.clientY - rect.top - height / 2;
    mouseX.set(xVal / width);
    mouseY.set(yVal / height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  if (!variant) {
    return (
      <button
        type="button"
        onClick={onAdvance}
        className="relative w-full h-full flex items-center justify-center cursor-pointer outline-none"
        aria-label="Continue"
      >
        <p className="font-serif italic text-[#705646]">
          Slide variant missing — check birthday.data.ts
        </p>
      </button>
    );
  }

  const caption =
    variant.captionOverride ??
    BIRTHDAY_PHOTO_CAPTIONS[photoIdx + 1] ??
    photo?.caption ??
    `Memory #${photoIdx + 1}`;

  const layoutType = variant.layoutType ?? "full-bleed-hero";
  const romanNum = ROMAN[photoIdx] ?? String(photoIdx + 1);

  const handleAdvanceWithSound = () => {
    playPageTurnSound();
    onAdvance();
  };

  return (
    <button
      type="button"
      onClick={handleAdvanceWithSound}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000 }}
      className="group relative w-full h-full flex flex-col items-center justify-center cursor-pointer outline-none px-4 py-8 md:py-10 select-none overflow-hidden"
      aria-label={`Page ${romanNum}: ${variant.postcardCity} — ${caption}`}
    >
      {/* Background Soft Glow */}
      <div
        aria-hidden
        className="absolute w-[80vw] max-w-[900px] h-[55vh] rounded-full bg-[#FAF5EC]/90 blur-3xl pointer-events-none"
      />

      {/* Main Page Container */}
      <motion.div
        key={`${photoIdx}-${layoutType}`}
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          opacity: { delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
          y: { delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
        }}
        style={reduced ? {} : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-[92vw] max-w-[840px] aspect-[4/3] md:aspect-[16/10] max-h-[72vh] rounded-[4px] p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-[0_24px_48px_rgba(44,38,35,0.12),0_4px_12px_rgba(44,38,35,0.06)]"
      >
        {/* Fine paper background */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, #FAF8F5 0%, #F4EFE6 60%, #EFE8DC 100%)",
          }}
        />

        {/* Page Top Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-[#E5DEC9] pb-2 mb-3">
          <span className="font-serif italic text-[10px] md:text-xs uppercase tracking-[0.25em] text-[#705646]">
            PLATE {romanNum} · {variant.postcardCity}
          </span>
          <span className="font-mono text-[9px] md:text-[10px] tracking-widest text-[#705646]/70">
            {variant.postcardDate}
          </span>
        </div>

        {/* ── 16 DIVERSE EDITORIAL LAYOUT RENDERS ── */}
        <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden py-2">
          {/* LAYOUT 1: Full-Bleed Hero */}
          {layoutType === "full-bleed-hero" && (
            <div className="relative w-full h-full flex flex-col justify-end rounded-[2px] overflow-hidden">
              {photo && (
                <img
                  src={photo.src}
                  alt={caption}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2C2623]/80 via-[#2C2623]/20 to-transparent" />
              <div className="relative p-6 max-w-[85%] text-left">
                <p className="font-serif italic text-white/90 text-sm md:text-lg leading-relaxed">
                  "{caption}"
                </p>
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/60 mt-1 block">
                  {variant.postcardCity}
                </span>
              </div>
            </div>
          )}

          {/* LAYOUT 2: The Folded Letter Note */}
          {layoutType === "asymmetric-portrait" && (
            <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 h-full max-h-[90%] rounded-[2px] overflow-hidden shadow-sm relative">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
                <WashiTape color="rose" pattern="dots" width={80} height={18} rotate={-15} className="absolute -top-2 -left-2 opacity-80" />
              </div>
              <div className="md:col-span-7 text-left pl-2 md:pl-4">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNoteUnfolded(!isNoteUnfolded);
                  }}
                  className="p-4 bg-[#FAF8F5] border border-[#E5DEC9] rounded-[3px] shadow-sm cursor-pointer hover:border-[#705646]/50 transition-all"
                >
                  <span className="font-serif italic text-xs uppercase tracking-widest text-[#705646] block mb-1">
                    ✉ Folded Letter Note {isNoteUnfolded ? "(Open)" : "(Tap to Unfold)"}
                  </span>
                  {isNoteUnfolded ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="font-handwrite text-base md:text-lg text-[#2C2623] leading-relaxed mt-2 pt-2 border-t border-[#E5DEC9]"
                    >
                      "{caption}"
                    </motion.p>
                  ) : (
                    <p className="font-serif italic text-sm text-[#705646]/70 truncate">
                      "{caption.slice(0, 35)}..."
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LAYOUT 3: Editorial Two-Column */}
          {layoutType === "editorial-two-column" && (
            <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="text-left pr-4">
                <p className="font-serif text-sm md:text-base text-[#2C2623] leading-relaxed">
                  <span className="float-left text-3xl md:text-4xl font-serif font-bold text-[#705646] mr-2 leading-none">
                    {caption.charAt(0)}
                  </span>
                  {caption.slice(1)}
                </p>
              </div>
              <div className="h-full max-h-[90%] rounded-[2px] overflow-hidden shadow-sm relative">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
                <PaperClip tint="warm" size={32} className="absolute -top-2 right-4 z-20" />
              </div>
            </div>
          )}

          {/* LAYOUT 4: The Liftable Photograph */}
          {layoutType === "floating-tilt" && (
            <div className="relative flex flex-col items-center justify-center w-full h-full">
              <div className="relative max-w-[65%] aspect-[4/3] w-full">
                {/* Secret Note underneath photo */}
                <div className="absolute inset-0 p-6 bg-[#FAF8F5] border border-[#E5DEC9] rounded-[2px] flex items-center justify-center text-center">
                  <p className="font-handwrite text-base md:text-xl text-[#705646] leading-relaxed">
                    "{caption}"
                  </p>
                </div>
                {/* Liftable Photo on top */}
                <motion.div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPhotoLifted(!isPhotoLifted);
                  }}
                  animate={isPhotoLifted ? { y: -80, rotate: 6, scale: 1.04 } : { y: 0, rotate: -3 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute inset-0 bg-stone-100 rounded-[2px] overflow-hidden shadow-md cursor-pointer border border-[#E5DEC9]"
                  title="Click to lift photograph"
                >
                  {photo && (
                    <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white font-mono text-[9px] px-2 py-0.5 rounded">
                    {isPhotoLifted ? "Tap to lower" : "Tap to lift photo ⬆"}
                  </span>
                </motion.div>
              </div>
            </div>
          )}

          {/* LAYOUT 5: Magazine Gallery */}
          {layoutType === "magazine-gallery" && (
            <div className="relative w-full flex flex-col items-center">
              <div className="w-[85%] aspect-[16/9] max-h-[60vh] rounded-[2px] overflow-hidden shadow-sm">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="font-serif italic text-xs md:text-sm text-[#705646] tracking-wider mt-3 uppercase text-center">
                — {caption} —
              </p>
            </div>
          )}

          {/* LAYOUT 6: Polaroid Stack Swap */}
          {layoutType === "polaroid-stack" && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setStackFlipped(!stackFlipped);
              }}
              className="relative flex items-center justify-center w-full h-full cursor-pointer"
              title="Click to swap polaroids"
            >
              {/* Secondary Polaroid (Bottom) */}
              <motion.div
                animate={stackFlipped ? { x: -40, rotate: -6, zIndex: 20 } : { x: 30, rotate: 8, zIndex: 10 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="absolute p-3 pb-7 bg-white border border-[#E5DEC9] shadow-md rounded-[2px] w-[200px] aspect-[3/4]"
              >
                <div className="w-full h-[80%] overflow-hidden bg-stone-100">
                  {nextPhoto && (
                    <img src={nextPhoto.src} alt="Memory Stack" className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="font-handwrite text-[10px] text-[#2C2623] block text-center mt-1">
                  Next Snap ✿
                </span>
              </motion.div>

              {/* Main Polaroid (Top) */}
              <motion.div
                animate={stackFlipped ? { x: 30, rotate: 8, zIndex: 10 } : { x: -20, rotate: -3, zIndex: 20 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="absolute p-3 pb-7 bg-white border border-[#E5DEC9] shadow-lg rounded-[2px] w-[210px] aspect-[3/4]"
              >
                <div className="w-full h-[80%] overflow-hidden bg-stone-100">
                  {photo && (
                    <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="font-handwrite text-xs text-[#2C2623] block text-center mt-1 truncate">
                  {caption}
                </span>
              </motion.div>
            </div>
          )}

          {/* LAYOUT 7: Centered Portrait */}
          {layoutType === "centered-portrait" && (
            <div className="relative w-full h-full flex items-center justify-center gap-6">
              <div className="h-[90%] aspect-[3/4] rounded-[2px] overflow-hidden shadow-sm border border-[#E5DEC9]">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="max-w-[35%] text-left hidden md:block border-l border-[#E5DEC9] pl-4">
                <span className="font-serif italic text-[10px] text-[#705646]/70 uppercase tracking-widest block mb-1">
                  Pencil Note
                </span>
                <p className="font-serif text-sm text-[#2C2623] leading-relaxed">
                  {caption}
                </p>
              </div>
            </div>
          )}

          {/* LAYOUT 8: Diagonal Pair */}
          {layoutType === "diagonal-pair" && (
            <div className="relative w-full h-full flex items-center justify-between px-4">
              <div className="w-[50%] h-[80%] rounded-[2px] overflow-hidden shadow-sm">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="w-[42%] p-4 bg-[#FAF8F5] border border-[#E5DEC9] rounded-[2px] shadow-sm text-left">
                <p className="font-serif italic text-xs md:text-sm text-[#2C2623] leading-relaxed">
                  "{caption}"
                </p>
              </div>
              <HangingThread fromX="80%" length={120} />
            </div>
          )}

          {/* LAYOUT 9: Full-Width Landscape */}
          {layoutType === "full-width-landscape" && (
            <div className="relative w-full flex flex-col items-center">
              <div className="w-full aspect-[21/9] max-h-[55vh] rounded-[2px] overflow-hidden shadow-sm">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between w-full mt-3 px-2">
                <span className="font-serif italic text-xs text-[#705646]">
                  {caption}
                </span>
                <PostmarkReal city={variant.postcardCity} date={variant.postcardDate} size={48} rotate={-6} />
              </div>
            </div>
          )}

          {/* LAYOUT 10: Memory Envelope Slide Out */}
          {layoutType === "double-page-spread" && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                playEnvelopeSound();
                setEnvelopeOpen(!envelopeOpen);
              }}
              className="relative w-full h-full flex items-center justify-center cursor-pointer"
            >
              {/* Envelope frame */}
              <div className="relative w-[300px] h-[200px] bg-[#EFE8DC] border border-[#E5DEC9] shadow-md rounded-[2px] flex items-center justify-center p-4">
                <span className="font-serif italic text-xs text-[#705646]">
                  {envelopeOpen ? "Tap to close envelope" : "✉ Tap envelope to open"}
                </span>

                {/* Photo sliding out */}
                <motion.div
                  animate={envelopeOpen ? { y: -70, scale: 1.05 } : { y: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 180, damping: 18 }}
                  className="absolute inset-x-4 top-2 bottom-2 bg-stone-100 rounded-[2px] overflow-hidden shadow-lg border border-[#E5DEC9] z-20"
                >
                  {photo && (
                    <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                  )}
                </motion.div>
              </div>
            </div>
          )}

          {/* LAYOUT 11: Square Focus */}
          {layoutType === "square-focus" && (
            <div className="relative flex flex-col items-center justify-center">
              <div className="w-[50%] aspect-[1/1] max-h-[55vh] rounded-[2px] overflow-hidden shadow-sm border border-[#E5DEC9]">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="font-serif italic text-xs md:text-sm text-[#705646] mt-3">
                {caption}
              </p>
              <PaperClip tint="warm" size={28} className="absolute -top-2 left-1/4" />
            </div>
          )}

          {/* LAYOUT 12: Editorial Offset Story */}
          {layoutType === "editorial-offset-story" && (
            <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-6 text-left pr-2">
                <span className="font-serif italic text-xs uppercase tracking-widest text-[#705646]/70 block mb-2">
                  Prologue Snippet
                </span>
                <p className="font-handwrite text-base md:text-lg text-[#2C2623] leading-relaxed">
                  {caption}
                </p>
              </div>
              <div className="md:col-span-6 h-full max-h-[90%] rounded-[2px] overflow-hidden shadow-sm">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          )}

          {/* LAYOUT 13: Framed Art Print */}
          {layoutType === "framed-art-print" && (
            <div className="relative flex flex-col items-center justify-center">
              <div className="p-4 bg-white border border-[#E5DEC9] shadow-md rounded-[2px] max-w-[60%] aspect-[3/4]">
                <div className="w-full h-full overflow-hidden">
                  {photo && (
                    <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <VintageStamp motif="rose" color="muted-red" size={32} />
                <span className="font-serif italic text-xs text-[#705646]">
                  {caption}
                </span>
              </div>
            </div>
          )}

          {/* LAYOUT 14: Overlapping Strip */}
          {layoutType === "overlapping-strip" && (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="w-[75%] h-[85%] rounded-[2px] overflow-hidden shadow-sm relative">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-4 left-4 p-3 bg-[#FAF8F5] border border-[#E5DEC9] max-w-[70%] shadow-md rounded-[2px]">
                  <p className="font-handwrite text-xs md:text-sm text-[#2C2623]">
                    {caption}
                  </p>
                </div>
              </div>
              <WashiTape color="gold" pattern="dots" width={80} height={18} rotate={6} className="absolute top-2 right-1/4 opacity-80" />
            </div>
          )}

          {/* LAYOUT 15: Quiet Minimal */}
          {layoutType === "quiet-minimal" && (
            <div className="relative flex flex-col items-center justify-center">
              <div className="w-[40%] aspect-[3/4] max-h-[50vh] rounded-[2px] overflow-hidden shadow-sm border border-[#E5DEC9]">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="font-serif italic text-xs text-[#705646] tracking-widest mt-4">
                "{caption}"
              </p>
              <Sparkle size={14} className="text-[#705646]/40 mt-2" />
            </div>
          )}

          {/* LAYOUT 16: Finale Hero */}
          {layoutType === "finale-hero" && (
            <div className="relative w-full h-full flex flex-col justify-end rounded-[2px] overflow-hidden shadow-md">
              {photo && (
                <img src={photo.src} alt={caption} className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2C2623]/85 via-[#2C2623]/30 to-transparent" />
              <div className="relative p-6 md:p-8 max-w-[85%] text-left">
                <span className="font-serif italic text-xs uppercase tracking-[0.3em] text-white/70 block mb-1">
                  Grand Finale
                </span>
                <h3 className="font-serif font-bold text-xl md:text-3xl text-white leading-tight">
                  {caption}
                </h3>
                <p className="font-serif italic text-xs md:text-sm text-white/80 mt-2">
                  Sixteen memories mapped · For you, always ✿
                </p>
              </div>
              <WaxSeal initial="N" size={48} className="absolute top-4 right-4" />
            </div>
          )}
        </div>

        {/* Page Footer Navigation Hint */}
        <div className="relative z-10 flex items-center justify-between border-t border-[#E5DEC9] pt-2 mt-2">
          <span className="font-serif italic text-[10px] text-[#705646]/70">
            Page {photoIdx + 1} of 16
          </span>
          <motion.span
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
            className="font-serif italic text-[10px] text-[#705646]/80 uppercase tracking-widest"
          >
            Tap to turn page ➔
          </motion.span>
        </div>
      </motion.div>
    </button>
  );
}

export function buildPhotoSlideMeta(
  photoIdx: number,
  variant: BirthdayPhotoVariant,
): PhotoSlideMeta {
  return { variant, photoIdx };
}
