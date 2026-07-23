/**
 * ChapterDividerScene.tsx
 *
 * Breath-beat divider inserted between photo groups so the 16-photo
 * sequence reads as 3 distinct chapters instead of one continuous
 * carousel. Auto-advances after ~3.8s (1.5s for reduced-motion).
 *
 * Per-scene copy is keyed off `config.id`:
 *   - "chapter-end-1" → closes the first third after photo-3
 *   - "chapter-end-2" → closes the final third after photo-10
 */

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Sparkle,
  SparkleLarge,
  Botany,
} from "../svg/Decorations";
import type { BirthdaySceneProps } from "../birthday.types";

interface ChapterDividerCopy {
  romanChapter: string;
  closing: string;
  next: string;
  eyebrowHint: string;
}

const CHAPTER_DIVIDER_CONTENT: Record<string, ChapterDividerCopy> = {
  "chapter-end-1": {
    romanChapter: "I",
    closing: "Three memories from our first chapters.",
    next: "Chapter II · Cities & Light",
    eyebrowHint: "End of Chapter I",
  },
  "chapter-end-2": {
    romanChapter: "II",
    closing: "Three memories of our brightest days.",
    next: "Chapter III · Forever & Always",
    eyebrowHint: "End of Chapter II",
  },
};

const FALLBACK: ChapterDividerCopy = CHAPTER_DIVIDER_CONTENT["chapter-end-1"];

export function ChapterDividerScene({ config }: BirthdaySceneProps) {
  const copy = CHAPTER_DIVIDER_CONTENT[config.id] ?? FALLBACK;
  const reduced = useReducedMotion();

  // Animasi berurutan (stagger) untuk kesan premium dan bersih
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const lineVariants: any = {
    hidden: { scaleY: 0 },
    visible: {
      scaleY: 1,
      transition: { duration: 1.0, ease: "easeOut" },
    },
  };

  if (config.id === "map") {
    const rememberItems = [
      "Your laugh.",
      "Your sleepy voice.",
      "The way you look when you're genuinely happy.",
      "The way you make distance feel smaller.",
      "The way you've quietly become my favorite person."
    ];

    return (
      <div
        role="region"
        aria-label="A Few Things I'll Always Remember"
        className="relative w-full h-full flex flex-col items-center justify-center px-6 py-10 select-none overflow-hidden"
      >
        {/* Background radial gradient yang halus & premium */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(250, 247, 242, 0.98) 0%, rgba(245, 239, 228, 0.95) 70%, rgba(235, 227, 208, 0.9) 100%)",
          }}
        />

        {/* Frame halaman buku kuno yang tipis dan rapi */}
        <div className="absolute inset-4 md:inset-6 border border-[#E5DEC9]/60 rounded-lg pointer-events-none p-1">
          <div className="w-full h-full border border-dashed border-[#E5DEC9]/40 rounded-md" />
        </div>

        {/* Aksen botani vintage di sudut */}
        <Botany className="absolute top-8 left-8 w-12 md:w-16 opacity-35 text-[#5c3a21]" />
        <Botany
          className="absolute bottom-8 right-8 w-14 md:w-18 opacity-35 text-[#5c3a21]"
          flip
        />

        {/* Kontainer Utama dengan Animasi Sequential */}
        <motion.div
          variants={reduced ? undefined : containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex flex-col items-center justify-center text-center max-w-md px-4 gap-4"
        >
          {/* Eyebrow Label */}
          <motion.p
            variants={reduced ? undefined : itemVariants}
            className="font-serif italic text-xs tracking-[0.3em] uppercase text-[#705646] font-extrabold mb-1"
            style={{ color: "#705646" }}
          >
            A Few Things I'll Always Remember
          </motion.p>

          <motion.div
            variants={reduced ? undefined : itemVariants}
            className="text-[#7c2b22] text-xl my-1"
          >
            🌷
          </motion.div>

          {/* Staggered list items */}
          <div className="flex flex-col items-center gap-3.5 my-2">
            {rememberItems.map((item, idx) => (
              <motion.p
                key={idx}
                variants={reduced ? undefined : itemVariants}
                className="font-handwrite text-xl md:text-2xl text-[#2a1b0e] font-bold italic leading-tight"
                style={{ color: "#2a1b0e" }}
              >
                {item}
              </motion.p>
            ))}
          </div>

          <motion.div
            variants={reduced ? undefined : itemVariants}
            className="w-16 h-px bg-[#705646]/30 my-1"
          />

          <motion.p
            variants={reduced ? undefined : itemVariants}
            className="font-serif italic text-[10px] tracking-[0.3em] uppercase text-[#705646]/80 font-bold"
          >
            next · photo gallery
          </motion.p>
        </motion.div>

        {/* Sparkles dekoratif halus */}
        <SparkleLarge
          className="absolute top-[22%] left-[18%] text-amber-500/25 pointer-events-none"
          size={24}
        />
        <Sparkle
          className="absolute bottom-[24%] right-[20%] text-rose-500/20 pointer-events-none"
          size={16}
        />
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label={`End of Chapter ${copy.romanChapter}`}
      className="relative w-full h-full flex flex-col items-center justify-center px-6 py-10 select-none overflow-hidden"
    >
      {/* Background radial gradient yang halus & premium */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(250, 247, 242, 0.98) 0%, rgba(245, 239, 228, 0.95) 70%, rgba(235, 227, 208, 0.9) 100%)",
        }}
      />

      {/* Frame halaman buku kuno yang tipis dan rapi */}
      <div className="absolute inset-4 md:inset-6 border border-[#E5DEC9]/60 rounded-lg pointer-events-none p-1">
        <div className="w-full h-full border border-dashed border-[#E5DEC9]/40 rounded-md" />
      </div>

      {/* Aksen botani vintage di sudut */}
      <Botany className="absolute top-8 left-8 w-12 md:w-16 opacity-35 text-[#5c3a21]" />
      <Botany
        className="absolute bottom-8 right-8 w-14 md:w-18 opacity-35 text-[#5c3a21]"
        flip
      />

      {/* Kontainer Utama dengan Animasi Sequential */}
      <motion.div
        variants={reduced ? undefined : containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center justify-center text-center max-w-md px-4"
      >
        {/* Eyebrow Label */}
        <motion.p
          variants={reduced ? undefined : itemVariants}
          className="font-serif italic text-xs tracking-[0.35em] uppercase text-[#705646] font-semibold mb-2"
          style={{ color: "#705646" }}
        >
          {copy.eyebrowHint}
        </motion.p>

        {/* Garis Vertikal Gambar Sendiri */}
        <motion.div
          variants={reduced ? undefined : lineVariants}
          className="w-[1px] h-10 bg-[#705646]/30 my-2 origin-top"
          style={{ transformOrigin: "top" }}
        />

        {/* Angka Romawi Utama */}
        <motion.div
          variants={reduced ? undefined : itemVariants}
          className="font-serif italic font-extrabold text-6xl md:text-7xl text-[#3a2511] leading-none my-1 select-none drop-shadow-[0_1px_2px_rgba(112,86,70,0.15)]"
          style={{ color: "#3a2511" }}
        >
          {copy.romanChapter}
        </motion.div>

        {/* Garis Vertikal Bawah */}
        <motion.div
          variants={reduced ? undefined : lineVariants}
          className="w-[1px] h-10 bg-[#705646]/30 my-2 origin-bottom"
          style={{ transformOrigin: "bottom" }}
        />

        {/* Teks Kutipan Bab */}
        <motion.p
          variants={reduced ? undefined : itemVariants}
          className="font-handwrite text-2xl md:text-3xl text-[#2a1b0e] font-medium leading-relaxed my-3 max-w-xs"
          style={{ color: "#2a1b0e" }}
        >
          &ldquo;{copy.closing}&rdquo;
        </motion.p>

        {/* Label Bab Berikutnya */}
        <motion.div
          variants={reduced ? undefined : itemVariants}
          className="mt-6 flex flex-col items-center gap-1"
        >
          <span className="font-serif italic text-[9px] uppercase tracking-[0.4em] text-[#705646]/70">
            next destination
          </span>
          <span
            className="font-serif italic text-xs md:text-sm tracking-widest text-[#7a5a44] font-bold"
            style={{ color: "#7a5a44" }}
          >
            {copy.next} ➔
          </span>
        </motion.div>
      </motion.div>

      {/* Sparkles dekoratif halus */}
      <SparkleLarge
        className="absolute top-[22%] left-[18%] text-amber-500/25 pointer-events-none"
        size={24}
      />
      <Sparkle
        className="absolute bottom-[24%] right-[20%] text-rose-500/20 pointer-events-none"
        size={16}
      />
    </div>
  );
}

export default ChapterDividerScene;
