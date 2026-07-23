/**
 * CityMapScene.tsx
 *
 * Redesigned Chapter II: "Little Things I Love About You"
 * Replaces the old fantasy city map with an intimate, personal
 * editorial chapter. Celebrates 6 special qualities & memories
 * of Nicola in a clean, elegant book spread.
 *
 * Exported component name `CityMapScene` preserved for backward-compat
 * with existing scene-config key "map" and BASE_COMPONENT_MAP.
 */

import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { WashiTape } from "../svg/Decorations";
import type { BirthdaySceneProps } from "../birthday.types";
import { BIRTHDAY_CONTENT, LITTLE_THINGS_ITEMS } from "../birthday.data";
import { useAudioAmplitude } from "../../core/audioAmplitude";

export interface CityMapSceneProps extends BirthdaySceneProps { }

export function CityMapScene(props: CityMapSceneProps) {
  const { content, onJumpTo, onAdvance } = props;
  const amp = useAudioAmplitude();
  const reduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Touch devices don't have hover — `whileHover` would otherwise
  // get stuck in the lifted state once a tap lifts, then never
  // settle. Gate hover-only affordances to (hover: hover) query so
  // phones / tablets never enter the hover branch.
  const supportsHover =
    typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
      ? window.matchMedia("(hover: hover)").matches
      : false;

  const recipientName = content?.recipientName ?? BIRTHDAY_CONTENT.recipientName;

  return (
    <button
      type="button"
      onClick={onAdvance}
      aria-label="Chapter II: Little Things I Love About You"
      className="relative w-full h-full flex flex-col items-center justify-center px-3 sm:px-4 py-4 sm:py-8 md:py-10 select-none overflow-hidden cursor-pointer text-left outline-none"
    >
      {/* Soft warm ambient halo */}
      <div
        aria-hidden
        className="absolute w-[80vw] max-w-[900px] h-[55vh] rounded-full bg-[radial-gradient(circle_at_center,#FAF5EC_0%,transparent_70%)] opacity-80 pointer-events-none"
      />

      {/* Chapter Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center z-10 mb-4"
      >
        <span className="font-serif italic text-xs md:text-sm uppercase tracking-[0.35em] text-[#705646]">
          Chapter II
        </span>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2C2623] tracking-tight mt-1">
          Little Things I Love About You
        </h2>
        <div className="w-12 h-px bg-[#705646]/30 mt-2" />
      </motion.div>

      {/* Main Book Page Frame */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1 + amp * 0.005,
        }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[96vw] sm:w-[92vw] max-w-[840px] aspect-[4/3] md:aspect-[16/10] max-h-[75vh] sm:max-h-[68vh] p-2 sm:p-4 md:p-8 flex flex-col justify-between z-10"
      >
        {/* Book page background */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[4px] pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, #FAF8F5 0%, #F4EFE6 60%, #EFE8DC 100%)",
            boxShadow:
              "0 24px 48px rgba(44,38,35,0.12), 0 4px 12px rgba(44,38,35,0.06), inset 0 0 40px rgba(112,86,70,0.06)",
          }}
        />

        {/* Single Washi Tape Accent at Top Right */}
        <WashiTape
          color="sage"
          pattern="dots"
          width={100}
          height={20}
          rotate={12}
          className="absolute -top-2 right-8 opacity-80 z-20"
        />

        {/* 6-Card Editorial Grid */}
        <div className="relative flex-1 grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-3 md:gap-4 items-center justify-center p-1 sm:p-2 z-10 overflow-y-auto max-h-full">
          {LITTLE_THINGS_ITEMS.map((item, idx) => {
            const isSelected = selectedId === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: reduced ? 0 : 0.35 + idx * 0.08,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={reduced || !supportsHover ? {} : { y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(isSelected ? null : item.id);
                  if (isSelected && onJumpTo) {
                    onJumpTo(`photo-${(idx % 16) + 1}`);
                  }
                }}
                className={`relative flex flex-col justify-between p-2 sm:p-3 md:p-4 rounded-[3px] border text-left transition-all duration-300 cursor-pointer outline-none focus:ring-2 focus:ring-[#705646]/40 ${isSelected
                  ? "bg-[#FAF8F5] border-[#705646] shadow-md ring-1 ring-[#705646]/30"
                  : "bg-[#FAF8F5]/80 border-[#E5DEC9] hover:border-[#705646]/50 shadow-sm"
                  }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-base md:text-lg">{item.icon}</span>
                  <span className="font-serif italic text-[9px] md:text-[10px] uppercase tracking-wider text-[#705646]/70">
                    0{item.id}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-xs md:text-sm text-[#2C2623] leading-snug">
                    {item.title}
                  </h3>
                  <p className="font-serif italic text-[10px] md:text-[11px] text-[#705646] mt-0.5">
                    {item.subtitle}
                  </p>
                </div>

                {isSelected ? (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="font-handwrite text-xs text-[#2C2623] mt-2 pt-2 border-t border-[#E5DEC9] leading-relaxed"
                  >
                    "{item.note}"
                  </motion.p>
                ) : (
                  <span className="font-serif italic text-[9px] text-[#705646]/50 mt-2 block">
                    Tap to read note ✿
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between border-t border-[#E5DEC9] pt-2 mt-2 px-2 text-[#705646]/70">
          <span className="font-serif italic text-[10px] tracking-wider">
            dedicated to my Sweetheart
          </span>
          <span className="font-serif italic text-[10px] tracking-wider">
            6 of endless reasons
          </span>
        </div>
      </motion.div>

      {/* Bottom hint */}
      <motion.p
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [1, 1 + amp * 0.08, 1],
        }}
        transition={{ repeat: Infinity, duration: 2.4 }}
        className="text-[9px] uppercase tracking-[0.35em] text-[#705646] font-bold mt-4 z-10"
      >
        Tap any card to reveal • Tap screen to advance
      </motion.p>
    </button>
  );
}

