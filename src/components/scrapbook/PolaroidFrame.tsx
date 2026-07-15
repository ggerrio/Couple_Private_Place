import React from "react";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";

export interface PolaroidFrameProps {
  children: React.ReactNode;
  className?: string;
  /** Caption text at bottom of polaroid */
  caption?: string;
  /** Manual rotation override in degrees */
  rotation?: number;
  /** Show a developing animation on mount */
  developing?: boolean;
  /** Click handler for opening photo viewer */
  onClick?: () => void;
  /** Show vintage corner photo holders */
  showCorners?: boolean;
}

export function PolaroidFrame({
  children,
  className,
  caption,
  rotation,
  developing = false,
  onClick,
  showCorners = true,
}: PolaroidFrameProps) {
  // Rotate default to -1.5deg if not provided
  const defaultRotation = rotation !== undefined ? rotation : -1.5;

  return (
    <motion.div
      whileHover={{ 
        rotate: defaultRotation * 0.4, 
        scale: 1.03, 
        y: -3,
        boxShadow: "0 12px 24px rgba(45, 42, 38, 0.15), 0 4px 8px rgba(45, 42, 38, 0.08)"
      }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={cn(
        "polaroid-frame group relative bg-white dark:bg-zinc-800 p-3 pb-12 rounded-[2px] border border-gray-100/10 transition-shadow duration-300 select-none",
        developing && "polaroid-developing",
        onClick && "cursor-pointer",
        className
      )}
      style={{ 
        "--polaroid-rotation": `${defaultRotation}deg`,
        transform: `rotate(${defaultRotation}deg)`,
        boxShadow: "0 6px 14px rgba(45, 42, 38, 0.08), 0 2px 4px rgba(45, 42, 38, 0.04)"
      } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Top Washi Tape Sticker (Transparent Polkadot Pattern) */}
      <div 
        className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-rose-400/40 dark:bg-rose-500/30 backdrop-blur-[0.5px] border-l border-r border-dashed border-rose-300/40 transform -rotate-2 shadow-[0_1px_2px_rgba(0,0,0,0.1)] z-20 pointer-events-none"
        style={{
          clipPath: "polygon(0% 15%, 12% 0%, 88% 0%, 100% 15%, 96% 85%, 84% 100%, 16% 100%, 0% 80%)",
        }}
      >
        {/* Polkadot texture inside the washi tape */}
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_1.5px,transparent_1.5px)] bg-[size:6px_6px] opacity-80" />
      </div>

      {/* Main Image Area with Retro Protective Mounting Photo Corners */}
      <div className="relative overflow-hidden rounded-[1px] aspect-square bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        {children}

        {/* Vintage Photo Corners Overlapping Image Bounds */}
        {showCorners && (
          <>
            {/* Top-Left Corner */}
            <div 
              className="absolute top-0 left-0 w-6 h-6 bg-gradient-to-br from-neutral-800 to-neutral-900 dark:from-zinc-700 dark:to-zinc-800 shadow-[1px_1px_3px_rgba(0,0,0,0.4)] pointer-events-none z-10"
              style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            >
              <div className="absolute top-[2px] left-[2px] w-4 h-4 border-t border-l border-amber-200/30" />
              <div className="absolute top-[4px] left-[4px] w-2.5 h-2.5 border-t border-l border-white/10" />
            </div>

            {/* Top-Right Corner */}
            <div 
              className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-bl from-neutral-800 to-neutral-900 dark:from-zinc-700 dark:to-zinc-800 shadow-[-1px_1px_3px_rgba(0,0,0,0.4)] pointer-events-none z-10"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
            >
              <div className="absolute top-[2px] right-[2px] w-4 h-4 border-t border-r border-amber-200/30" />
              <div className="absolute top-[4px] right-[4px] w-2.5 h-2.5 border-t border-r border-white/10" />
            </div>

            {/* Bottom-Left Corner */}
            <div 
              className="absolute bottom-0 left-0 w-6 h-6 bg-gradient-to-tr from-neutral-800 to-neutral-900 dark:from-zinc-700 dark:to-zinc-800 shadow-[1px_-1px_3px_rgba(0,0,0,0.4)] pointer-events-none z-10"
              style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }}
            >
              <div className="absolute bottom-[2px] left-[2px] w-4 h-4 border-b border-l border-amber-200/30" />
              <div className="absolute bottom-[4px] left-[4px] w-2.5 h-2.5 border-b border-l border-white/10" />
            </div>

            {/* Bottom-Right Corner */}
            <div 
              className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-tl from-neutral-800 to-neutral-900 dark:from-zinc-700 dark:to-zinc-800 shadow-[-1px_-1px_3px_rgba(0,0,0,0.4)] pointer-events-none z-10"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
            >
              <div className="absolute bottom-[2px] right-[2px] w-4 h-4 border-b border-r border-amber-200/30" />
              <div className="absolute bottom-[4px] right-[4px] w-2.5 h-2.5 border-b border-r border-white/10" />
            </div>
          </>
        )}
      </div>
      
      {caption && (
        <p
          className="absolute bottom-2 left-0 right-0 text-center font-handwrite text-lg md:text-xl font-medium tracking-wide truncate px-3 select-none text-[#2D2A26] dark:text-[#F5F0EB]"
        >
          {caption}
        </p>
      )}
    </motion.div>
  );
}
