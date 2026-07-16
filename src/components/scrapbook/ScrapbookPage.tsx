import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { TornEdgeDivider } from "./TornEdgeDivider";

export type ScrapbookDecorationType =
  | "heart"
  | "smiley"
  | "stamp"
  | "tape-tl"
  | "tape-tr"
  | "paperclip"
  | "flower"
  | "star"
  | "sparkle-group"
  | "coffee-ring";

export interface ScrapbookPageProps {
  children: React.ReactNode;
  className?: string;
  /** Optional decorative page number in corner */
  pageNumber?: number;
  /** Reduce padding for compact layouts */
  compact?: boolean;
  /** Apply a subtle rotation for handcrafted feel */
  tilt?: "none" | "left" | "right";
  /** Add a vintage stitching border */
  showStitching?: boolean;
  /** Custom decorations. If not provided, a beautiful stable set will be auto-selected */
  decorations?: ScrapbookDecorationType[];
  /** Render a torn paper divider at the top of content */
  showTornDivider?: boolean;
}

export function ScrapbookPage({
  children,
  className,
  pageNumber,
  compact = false,
  tilt = "none",
  showStitching = true,
  decorations,
  showTornDivider = true,
}: ScrapbookPageProps) {
  const tiltClass =
    tilt === "left" ? "sm:-rotate-[0.5deg]" : tilt === "right" ? "sm:rotate-[0.5deg]" : "";

  // Auto-generate stable decorations if not provided, to ensure every page looks dressed up
  const activeDecorations = useMemo(() => {
    if (decorations) return decorations;
    // Stable choice based on pageNumber or simple default preset
    const num = pageNumber || Math.floor(Math.random() * 5) + 1;
    switch (num % 5) {
      case 0:
        return ["tape-tr", "heart", "sparkle-group"] as ScrapbookDecorationType[];
      case 1:
        return ["paperclip", "star"] as ScrapbookDecorationType[];
      case 2:
        return ["tape-tl", "smiley", "flower"] as ScrapbookDecorationType[];
      case 3:
        return ["paperclip", "sparkle-group"] as ScrapbookDecorationType[];
      case 4:
      default:
        return ["tape-tr", "coffee-ring", "heart"] as ScrapbookDecorationType[];
    }
  }, [decorations, pageNumber]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "scrapbook-page relative overflow-hidden rounded-2xl bg-[#FDFBF7] dark:bg-[#252542] border border-[#E8DDD0] dark:border-white/5 shadow-[0_10px_30px_rgba(45,42,38,0.06),0_1px_4px_rgba(45,42,38,0.04)] hover:shadow-[0_20px_45px_rgba(45,42,38,0.12),0_8px_16px_rgba(45,42,38,0.06)] transition-all duration-500 w-full",
        !compact && "p-6 md:p-8",
        compact && "p-4 sm:p-5",
        tiltClass,
        className
      )}
    >
      {/* High-quality Tactile Canvas/Paper Grain Texture Overlay (Base64 Canvas + Grain) */}
      <div 
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none z-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBoNjBNMCAyMGg2ME0wIDMwaDYwTTAgNDBoNjBNMCA1MGg2ME0xMCAwdjYwTTIwIDB2NjBNMzAgMHY2ME00MCAwdjYwTTUwIDB2NjAiIHN0cm9rZT0iIzhiNzM1NSIgc3Ryb2tlLXdpZHRoPSIwLjE1IiBvcGFjaXR5PSIwLjA4IiBmaWxsPSJub25lIi8+PC9zdmc+"), url("data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper-grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' result='noise' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23paper-grain)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Subtle Linen/Weave Fine Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.015] pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='%238b7355' stroke-width='0.5'/%3E%3C/svg%3E")`
        }}
      />

      {/* Real notebook paper wire spiral binding / holes texture on the side */}
      <div className="absolute left-2 top-0 bottom-0 w-2 flex flex-col justify-around py-6 pointer-events-none opacity-20 dark:opacity-10 z-20">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-amber-900/30 dark:bg-white/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
        ))}
      </div>

      {/* Optional stitching border */}
      {showStitching && (
        <div className="absolute inset-3 border border-dashed border-amber-900/10 dark:border-white/10 pointer-events-none rounded-xl" />
      )}

      {/* Page Number / Date Stamp */}
      {pageNumber !== undefined && (
        <span className="absolute bottom-3 right-6 text-[10px] font-mono tracking-widest uppercase select-none pointer-events-none text-amber-900/40 dark:text-white/30 border border-dashed border-amber-900/10 dark:border-white/10 px-2 py-0.5 rounded">
          PG. {pageNumber}
        </span>
      )}

      {/* RENDER SCRAPBOOK DECORATIONS */}
      <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
        {activeDecorations.map((dec, idx) => {
          switch (dec) {
            case "tape-tr":
              return (
                <div
                  key={idx}
                  className="absolute -top-1 -right-6 w-24 h-7 bg-[#E8B4B8]/40 dark:bg-rose-950/40 backdrop-blur-[0.5px] border-l border-r border-dashed border-rose-300/30 transform rotate-[32deg] shadow-[0_1px_3px_rgba(45,42,38,0.1)] flex items-center justify-center overflow-hidden"
                  style={{
                    clipPath: "polygon(0% 15%, 10% 0%, 90% 0%, 100% 20%, 95% 85%, 85% 100%, 15% 100%, 0% 80%)",
                  }}
                >
                  <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.25)_8px,rgba(255,255,255,0.25)_16px)] opacity-60" />
                </div>
              );

            case "tape-tl":
              return (
                <div
                  key={idx}
                  className="absolute -top-1 -left-6 w-24 h-7 bg-[#D4A574]/40 dark:bg-amber-950/40 backdrop-blur-[0.5px] border-l border-r border-dashed border-amber-300/30 transform -rotate-[32deg] shadow-[0_1px_3px_rgba(45,42,38,0.1)] flex items-center justify-center overflow-hidden"
                  style={{
                    clipPath: "polygon(10% 0%, 90% 0%, 100% 15%, 95% 80%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)",
                  }}
                >
                  <div className="w-full h-full bg-[repeating-linear-gradient(-45deg,transparent,transparent_6px,rgba(255,255,255,0.2)_6px,rgba(255,255,255,0.2)_12px)] opacity-60" />
                </div>
              );

            case "paperclip":
              return (
                <div key={idx} className="absolute top-2 left-16 w-6 h-12 transform -rotate-[5deg] drop-shadow-[0_2px_4px_rgba(45,42,38,0.15)]">
                  <svg viewBox="0 0 24 48" fill="none" className="w-full h-full stroke-zinc-400 dark:stroke-zinc-300" strokeWidth="2.5">
                    <path d="M12 40V12C12 8.686 14.686 6 18 6C21.314 6 24 8.686 24 12V32C24 36.418 20.418 40 16 40C11.582 40 8 36.418 8 32V12C8 5.373 13.373 0 20 0C26.627 0 32 5.373 32 12V24" transform="scale(0.6) translate(6, 6)" />
                  </svg>
                </div>
              );

            case "heart":
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  className="absolute bottom-10 left-4 w-10 h-10 bg-rose-100 dark:bg-rose-950 border-2 border-white dark:border-rose-900 rounded-[12px_4px_16px_8px] shadow-[2px_3px_6px_rgba(45,42,38,0.12)] flex items-center justify-center text-rose-500 text-sm transform -rotate-[15deg] pointer-events-auto cursor-pointer"
                >
                  ❤️
                </motion.div>
              );

            case "smiley":
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.15, rotate: -15 }}
                  className="absolute top-10 right-4 w-9 h-9 bg-amber-100 dark:bg-amber-950 border-2 border-white dark:border-amber-900 rounded-full shadow-[2px_3px_6px_rgba(45,42,38,0.12)] flex items-center justify-center text-amber-600 text-base transform rotate-[12deg] pointer-events-auto cursor-pointer"
                >
                  😊
                </motion.div>
              );

            case "flower":
              return (
                <div key={idx} className="absolute bottom-6 left-12 opacity-35 dark:opacity-25 transform -rotate-[20deg] text-amber-900 dark:text-amber-100">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12,2A10,10,0,0,0,2,12a9.89,9.89,0,0,0,2.26,6.33l-2,2a1,1,0,0,0,1.42,1.42l2-2A10,10,0,1,0,12,2Zm1.06,13.5a1.5,1.5,0,1,1,0-2.12A1.5,1.5,0,0,1,13.06,15.5Zm1.44-4.88-3,3a1,1,0,0,1-1.42,0l-1-1a1,1,0,0,1,1.42-1.42l.3.3,2.29-2.3a1,1,0,0,1,1.42,1.42Z" />
                  </svg>
                </div>
              );

            case "star":
              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.2 }}
                  className="absolute top-16 left-8 text-[#F4C542] text-lg filter drop-shadow-xs transform rotate-[8deg] pointer-events-auto cursor-pointer"
                >
                  ✨
                </motion.div>
              );

            case "sparkle-group":
              return (
                <div key={idx} className="absolute bottom-16 right-16 flex gap-1 opacity-40 dark:opacity-20">
                  <span className="text-xs text-amber-500 animate-ping">✨</span>
                  <span className="text-[10px] text-amber-400">✨</span>
                </div>
              );

            case "coffee-ring":
              return (
                <div
                  key={idx}
                  className="absolute -bottom-10 -left-10 w-28 h-28 border-[3px] border-dashed border-amber-900/10 dark:border-white/5 rounded-full pointer-events-none select-none transform rotate-[45deg]"
                />
              );

            default:
              return null;
          }
        })}
      </div>

      <div className="relative z-10 pl-6 pr-2 py-1">
        {showTornDivider && (
          <TornEdgeDivider variant="notebook" height={20} className="mt-0 mb-5 opacity-70" />
        )}
        {children}
      </div>
    </motion.div>
  );
}
