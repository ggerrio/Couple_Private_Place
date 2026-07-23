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
  // Touch devices don't track mouse-move the way desktop does, so the
  // 3D tilt fought scroll inertia. Gate to `hover: hover` so only
  // desktop / laptops with a real pointer ever run the spring track.
  const supportsHover =
    typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
      ? window.matchMedia("(hover: hover)").matches
      : false;

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
    if (reduced || !supportsHover) return;
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
      className="group relative w-full h-full flex flex-col items-center justify-center cursor-pointer outline-none px-2 sm:px-4 py-4 sm:py-8 md:py-10 select-none overflow-hidden"
      aria-label={`Page ${romanNum}: ${variant.postcardCity} — ${caption}`}
    >
      {/* Background Soft Glow — GPU-optimized radial gradient */}
      <div
        aria-hidden
        className="absolute w-[80vw] max-w-[900px] h-[55vh] rounded-full bg-[radial-gradient(circle_at_center,#FAF5EC_0%,transparent_70%)] opacity-80 pointer-events-none"
      />

      {/* Main Page Container */}
      <motion.div
        key={`${photoIdx}-${layoutType}`}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 150,
          damping: 18,
          mass: 0.8,
        }}
        style={reduced || !supportsHover ? {} : { rotateX, rotateY, transformStyle: "preserve-3d", willChange: "transform" }}
        className="relative w-[95vw] sm:w-[92vw] max-w-[840px] aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/10] max-h-[80vh] sm:max-h-[72vh] rounded-[4px] p-3 sm:p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-[0_24px_48px_rgba(44,38,35,0.12),0_4px_12px_rgba(44,38,35,0.06)]"
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
        <div className="relative z-10 flex items-center justify-between border-b border-[#E5DEC9] pb-1.5 sm:pb-2 mb-2 sm:mb-3">
          <span className="font-serif italic text-[9px] sm:text-xs md:text-sm uppercase tracking-[0.15em] sm:tracking-[0.25em] text-[#5c3a21] font-bold truncate mr-1">
            MEMORIES · {variant.postcardCity}
          </span>
          <span className="font-mono text-[9px] sm:text-xs tracking-widest text-[#5c3a21] font-bold shrink-0">
            {variant.postcardDate}
          </span>
        </div>

        {/* ── 16 DIVERSE EDITORIAL LAYOUT RENDERS ── */}
        <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden py-1 sm:py-2">
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
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f1712]/90 via-[#1f1712]/30 to-transparent" />
              <div className="relative p-3 sm:p-6 max-w-[95%] sm:max-w-[90%] text-left">
                <p className="font-serif italic text-white text-sm sm:text-base md:text-xl font-medium leading-relaxed drop-shadow-md">
                  "{caption}"
                </p>
                <span className="font-mono text-xs uppercase tracking-widest text-amber-200/90 font-bold mt-2 block">
                  {variant.postcardCity} · {variant.postcardCountry}
                </span>
              </div>
            </div>
          )}

          {/* LAYOUT 2: The Folded Letter Note */}
          {layoutType === "asymmetric-portrait" && (
            <div className="relative w-full h-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 h-full max-h-[95%] flex items-center justify-center relative">
                {photo && (
                  <img
                    src={photo.src}
                    alt={caption}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-[2px] border border-[#E5DEC9] shadow-md"
                  />
                )}
                <WashiTape color="rose" pattern="dots" width={80} height={18} rotate={-15} className="absolute -top-2 -left-2 opacity-80 z-10" />
              </div>
              <div className="md:col-span-7 flex items-center justify-center text-left pl-2 md:pl-4">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNoteUnfolded(!isNoteUnfolded);
                  }}
                  className="relative p-4 bg-[#FAF8F5] border border-[#E5DEC9] rounded-[3px] shadow-sm cursor-pointer hover:border-[#705646]/50 transition-all"
                >
                  {!isNoteUnfolded && !reduced && (
                    <motion.span
                      key={`dog-ear-note-${photoIdx}`}
                      aria-hidden
                      className="absolute top-0 right-0 z-30 pointer-events-none block"
                      style={{ transformOrigin: "top right" }}
                      initial={false}
                      animate={{ opacity: [0.65, 1, 0.65], rotate: [-2, 4, -2] }}
                      transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                        <path
                          d="M0 0 L24 0 L24 24 Q14 18 0 0 Z"
                          fill="#F4E8D2"
                          stroke="rgba(120,80,30,0.55)"
                          strokeWidth="0.6"
                        />
                      </svg>
                    </motion.span>
                  )}
                  <span className="font-serif italic text-xs md:text-sm uppercase tracking-widest text-[#705646] font-bold block mb-1">
                    ✉ Folded Letter Note {isNoteUnfolded ? "(Open)" : "(Tap to Unfold)"}
                  </span>
                  {isNoteUnfolded ? (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="font-handwrite text-lg md:text-xl text-[#2C2623] font-bold leading-relaxed mt-2 pt-2 border-t border-[#E5DEC9]"
                    >
                      "{caption}"
                    </motion.p>
                  ) : (
                    <>
                      <p className="font-handwrite text-[10px] md:text-[11px] text-[#7c2b22]/70 italic tracking-wide mb-1.5 leading-snug">
                        tucked in your pocket since that day ✉
                      </p>
                      <p className="font-serif italic text-base text-[#3a2511] font-semibold truncate">
                        "{caption.slice(0, 35)}..."
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LAYOUT 3: Editorial Two-Column (Slide 7 Fix) */}
          {layoutType === "editorial-two-column" && (
            <div className="relative w-full h-full flex flex-col sm:grid sm:grid-cols-2 gap-2 sm:gap-6 items-center">
              <div className="text-left pr-2 order-2 sm:order-1">
                <p className="font-serif text-sm sm:text-base md:text-xl text-[#2A1B0E] font-semibold leading-relaxed">
                  "{caption}"
                </p>
              </div>
              <div className="h-[45%] sm:h-full max-h-[92%] w-full rounded-[2px] overflow-hidden shadow-sm relative border border-[#E5DEC9] order-1 sm:order-2">
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
              <div className="relative max-w-[85%] sm:max-w-[70%] aspect-[4/3] w-full">
                {/* Secret Note underneath photo */}
                <div className="absolute inset-0 p-6 bg-[#FAF8F5] border border-[#E5DEC9] rounded-[2px] flex items-center justify-center text-center">
                  <p className="font-handwrite text-lg md:text-2xl text-[#3a2511] font-bold leading-relaxed">
                    "{caption}"
                  </p>
                </div>
                {/* Liftable Photo on top */}
                <motion.div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPhotoLifted(!isPhotoLifted);
                  }}
                  animate={isPhotoLifted ? { y: -85, rotate: 6, scale: 1.04 } : { y: 0, rotate: -3 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute inset-0 bg-stone-100 rounded-[2px] overflow-hidden shadow-md cursor-pointer border border-[#E5DEC9]"
                  title="Click to lift photograph"
                >
                  {!isPhotoLifted && !reduced && (
                    <motion.span
                      key={`dog-ear-photo-${photoIdx}`}
                      aria-hidden
                      className="absolute top-0 right-0 z-30 pointer-events-none block"
                      style={{ transformOrigin: "top right" }}
                      initial={false}
                      animate={{ opacity: [0.65, 1, 0.65], rotate: [-2, 4, -2] }}
                      transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
                    >
                      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
                        <path
                          d="M0 0 L24 0 L24 24 Q14 18 0 0 Z"
                          fill="#F4E8D2"
                          stroke="rgba(120,80,30,0.55)"
                          strokeWidth="0.6"
                        />
                      </svg>
                    </motion.span>
                  )}
                  {photo && (
                    <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                  )}
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-xs px-2.5 py-1 rounded font-bold">
                    {isPhotoLifted ? "Tap to lower" : "Tap to lift photo ⬆"}
                  </span>
                </motion.div>
              </div>
            </div>
          )}

          {/* LAYOUT 5: Magazine Gallery */}
          {layoutType === "magazine-gallery" && (
            <div className="relative w-full flex flex-col items-center">
              <div className="w-[88%] aspect-[16/9] max-h-[62vh] rounded-[2px] overflow-hidden shadow-sm">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="font-serif italic text-sm md:text-base text-[#3a2511] font-bold tracking-wider mt-3 uppercase text-center">
                — {caption} —
              </p>
            </div>
          )}

          {/* LAYOUT 6: Polaroid Stack Swap (Slide 10 Fix) */}
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
                animate={stackFlipped ? { x: -20, rotate: -6, zIndex: 20 } : { x: 15, rotate: 8, zIndex: 10 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="absolute p-2 sm:p-3 pb-5 sm:pb-7 bg-[#FCFAF7] border-2 border-[#E5DEC9] shadow-md rounded-[2px] w-[40%] sm:w-[210px] aspect-[3/4] max-w-[180px] sm:max-w-none"
              >
                <div className="w-full h-[72%] sm:h-[78%] overflow-hidden bg-stone-100 rounded-[1px]">
                  {nextPhoto && (
                    <img src={nextPhoto.src} alt="Memory Stack" className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="font-handwrite text-[7px] sm:text-[8px] text-[#705646]/70 italic uppercase tracking-widest block text-center mt-1 font-semibold">
                  sneak peek ✿
                </span>
                <span className="font-handwrite text-[10px] sm:text-xs font-bold text-[#3a2511] block text-center mt-1 truncate leading-snug">
                  "{(nextPhoto?.caption ?? "next moment").slice(0, 24)}…"
                </span>
              </motion.div>

              {/* Main Polaroid (Top) */}
              <motion.div
                animate={stackFlipped ? { x: 15, rotate: 8, zIndex: 10 } : { x: -10, rotate: -3, zIndex: 20 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="absolute p-2 sm:p-3 pb-5 sm:pb-7 bg-[#FCFAF7] border-2 border-[#E5DEC9] shadow-lg rounded-[2px] w-[44%] sm:w-[220px] aspect-[3/4] max-w-[200px] sm:max-w-none"
              >
                <div className="w-full h-[72%] sm:h-[78%] overflow-hidden bg-stone-100 rounded-[1px]">
                  {photo && (
                    <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="font-handwrite text-[10px] sm:text-xs md:text-sm font-extrabold text-[#3a2511] block text-center mt-1 sm:mt-1.5 truncate">
                  {caption}
                </span>
              </motion.div>
            </div>
          )}

          {/* LAYOUT 7: Centered Portrait */}
          {layoutType === "centered-portrait" && (
            <div className="relative w-full h-full flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
              <div className="h-[55%] sm:h-[80%] lg:h-[92%] aspect-[3/4] rounded-[2px] overflow-hidden shadow-sm border border-[#E5DEC9]">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="w-full sm:max-w-[40%] text-left border-t sm:border-t-0 sm:border-l-2 border-[#E5DEC9] pt-1.5 sm:pt-0 sm:pl-4 px-1">
                <span className="font-serif italic text-[9px] sm:text-xs text-[#705646] uppercase tracking-widest font-bold block mb-0.5 sm:mb-1">
                  Love Note
                </span>
                <p className="font-handwrite sm:font-serif text-xs sm:text-base md:text-lg font-bold sm:font-medium text-[#2A1B0E] leading-snug sm:leading-relaxed">
                  {caption}
                </p>
              </div>
            </div>
          )}

          {/* LAYOUT 8: Diagonal Pair */}
          {layoutType === "diagonal-pair" && (
            <div className="relative w-full h-full flex flex-row items-center justify-between gap-1.5 sm:gap-4 px-1 sm:px-4">
              <div className="w-[48%] sm:w-[52%] h-[80%] sm:h-[85%] rounded-[2px] overflow-hidden shadow-sm border border-[#E5DEC9]">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="w-[48%] sm:w-[44%] p-2 sm:p-4 bg-[#FAF8F5] border border-[#E5DEC9] rounded-[2px] shadow-sm text-left">
                <p className="font-handwrite sm:font-serif italic text-[11px] sm:text-sm md:text-lg text-[#2A1B0E] font-bold sm:font-medium leading-snug sm:leading-relaxed">
                  "{caption}"
                </p>
              </div>
              <HangingThread fromX="80%" length={120} />
            </div>
          )}

          {/* LAYOUT 9: Full-Width Landscape */}
          {layoutType === "full-width-landscape" && (
            <div className="relative w-full flex flex-col items-center">
              <div className="w-full aspect-[21/9] max-h-[58vh] rounded-[2px] overflow-hidden shadow-sm border border-[#E5DEC9]">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between w-full mt-3 px-2">
                <span className="font-serif italic text-sm md:text-base font-bold text-[#3a2511]">
                  {caption}
                </span>
                <PostmarkReal city={variant.postcardCity} date={variant.postcardDate} size={54} rotate={-6} />
              </div>
            </div>
          )}

          {/* LAYOUT 10: Upgraded Memory Photo Showcase (Slide 15 Redesign) */}
          {layoutType === "double-page-spread" && (
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <div className="relative w-[85%] max-w-[500px] h-[92%] bg-[#FAF8F5] border border-[#E5DEC9] shadow-lg rounded-[3px] p-4 flex flex-col justify-between items-center overflow-hidden">
                <WashiTape color="rose" pattern="dots" width={90} height={18} rotate={-3} className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-90 z-20" />
                <div className="relative w-full flex-1 rounded-[2px] overflow-hidden border border-[#E5DEC9] bg-stone-100">
                  {photo && (
                    <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="font-handwrite text-base md:text-xl font-bold text-[#3a2511] text-center mt-3 leading-relaxed">
                  "{caption}"
                </p>
              </div>
            </div>
          )}

          {/* LAYOUT 11: Square Focus */}
          {layoutType === "square-focus" && (
            <div className="relative flex flex-col items-center justify-center">
              <div className="w-[55%] aspect-[1/1] max-h-[55vh] rounded-[2px] overflow-hidden shadow-sm border border-[#E5DEC9]">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="font-serif italic text-sm md:text-base text-[#3a2511] font-bold mt-3">
                {caption}
              </p>
              <PaperClip tint="warm" size={28} className="absolute -top-2 left-1/4" />
            </div>
          )}

          {/* LAYOUT 12: Editorial Offset Story (Slide 17) */}
          {layoutType === "editorial-offset-story" && (
            <div className="relative w-full h-full flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-4 md:gap-6 items-center justify-center my-auto">
              <div className="sm:col-span-6 text-left pr-0 sm:pr-2 flex flex-col justify-center order-2 sm:order-1">
                <span className="font-serif italic text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-[#705646] font-bold block mb-1 sm:mb-2">
                  Words I Couldn't Say Out Loud
                </span>
                <p className="font-handwrite text-sm sm:text-lg md:text-xl text-[#2A1B0E] font-bold leading-relaxed">
                  {caption}
                </p>
              </div>
              <div className="sm:col-span-6 h-[40%] sm:h-full max-h-[40vh] sm:max-h-[85vh] flex items-center justify-center relative order-1 sm:order-2">
                {photo && (
                  <img
                    src={photo.src}
                    alt={caption}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-[2px] border border-[#E5DEC9] shadow-md"
                  />
                )}
              </div>
            </div>
          )}

          {/* LAYOUT 13: Framed Art Print (Slide 18) */}
          {layoutType === "framed-art-print" && (
            <div className="relative flex flex-col items-center justify-center w-full h-full py-2 gap-3">
              {/* Caption pill — moved above the image so it doesn't pin to bottom */}
              <div className="flex items-center gap-2 bg-[#FAF8F5]/80 px-3.5 py-1.5 rounded-full border border-amber-900/10 shadow-xs">
                <VintageStamp motif="rose" color="muted-red" size={26} />
                <span className="font-serif italic text-xs md:text-sm text-[#3a2511] font-bold">
                  {caption}
                </span>
                <Sparkle size={14} className="text-amber-500/80" />
              </div>
              <div className="relative p-3 bg-white/50 backdrop-blur-xs border border-amber-900/15 shadow-sm rounded-xl max-w-[85%] max-h-[68vh] flex items-center justify-center">
                <PaperClip tint="warm" size={32} className="absolute -top-3 left-4 z-20" />
                <WashiTape color="rose" pattern="dots" width={75} height={16} rotate={5} className="absolute -top-2 right-4 opacity-90 z-20" />
                {photo && (
                  <img
                    src={photo.src}
                    alt={caption}
                    className="max-w-full max-h-[60vh] w-auto h-auto object-contain rounded-lg shadow-xs"
                  />
                )}
              </div>
            </div>
          )}

          {/* LAYOUT 14: Overlapping Strip */}
          {layoutType === "overlapping-strip" && (
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-3">
              {/* Sticker-style mini-title above the photo — adds complementary text per slide */}
              <p className="font-serif italic text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#3a2511] font-bold text-center">
                No checkpoint could save a moment like this ✿
              </p>
              <div className="relative w-[78%] h-[80%]">
                <div className="w-full h-full rounded-[2px] overflow-hidden shadow-sm relative border border-[#E5DEC9]">
                  {photo && (
                    <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-4 left-4 p-3.5 bg-[#FAF8F5] border border-[#E5DEC9] max-w-[75%] shadow-md rounded-[2px]">
                    <p className="font-handwrite text-sm md:text-base text-[#2C2623] font-bold">
                      {caption}
                    </p>
                  </div>
                </div>
                <WashiTape color="gold" pattern="dots" width={80} height={18} rotate={6} className="absolute top-2 right-1/4 opacity-80" />
              </div>
            </div>
          )}

          {/* LAYOUT 15: Quiet Minimal */}
          {layoutType === "quiet-minimal" && (
            <div className="relative flex flex-col items-center justify-center">
              <div className="w-[48%] aspect-[3/4] max-h-[54vh] rounded-[2px] overflow-hidden shadow-sm border border-[#E5DEC9]">
                {photo && (
                  <img src={photo.src} alt={caption} className="w-full h-full object-cover" />
                )}
              </div>
              <p className="font-serif italic text-sm md:text-base text-[#3a2511] font-semibold tracking-wide mt-4">
                "{caption}"
              </p>
              <Sparkle size={14} className="text-[#705646]/60 mt-2" />
            </div>
          )}

          {/* LAYOUT 16: Finale Hero (Slide 21) */}
          {layoutType === "finale-hero" && (
            <div className="relative w-full h-full flex flex-col justify-end rounded-[2px] overflow-hidden shadow-md">
              {photo && (
                <img
                  src={photo.src}
                  alt={caption}
                  className="absolute inset-0 w-full h-full object-cover rounded-[2px]"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1f1712]/90 via-[#1f1712]/20 to-transparent pointer-events-none" />
              <div className="relative p-4 sm:p-6 md:p-8 max-w-[95%] sm:max-w-[90%] text-left z-10">
                <span className="font-serif italic text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] text-amber-200/90 font-bold block mb-1">
                  Grand Finale
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg md:text-2xl text-white leading-tight">
                  {caption}
                </h3>
                <p className="font-serif italic text-[11px] sm:text-xs md:text-sm text-white/90 font-medium mt-1">
                  Sixteen memories mapped · For you, always ✿
                </p>
              </div>
              <WaxSeal initial="N" size={48} className="absolute top-4 right-4 z-20" />
            </div>
          )}
        </div>

        {/* Page Footer Navigation Hint */}
        <div className="relative z-10 flex items-center justify-between border-t border-[#E5DEC9] pt-1.5 sm:pt-2 mt-1.5 sm:mt-2">
          <span className="font-serif italic text-[9px] sm:text-[10px] text-[#705646]/70">
            Page {photoIdx + 1} of 16
          </span>
          <motion.span
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
            className="font-serif italic text-[9px] sm:text-[10px] text-[#705646]/80 uppercase tracking-widest"
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
