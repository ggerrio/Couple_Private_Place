import React from "react";
import { cn } from "@/lib/utils";

interface TornEdgeDividerProps {
  className?: string;
  variant?: "cream" | "white" | "kraft" | "notebook";
  height?: number; // custom height in pixels
}

export function TornEdgeDivider({
  className,
  variant = "cream",
  height = 24,
}: TornEdgeDividerProps) {
  // Real asymmetrically torn paper edge path
  const clipPath = "polygon(0% 15%, 2% 0%, 5% 18%, 9% 3%, 12% 14%, 16% 2%, 20% 16%, 25% 4%, 30% 19%, 34% 5%, 39% 17%, 43% 3%, 48% 15%, 52% 2%, 57% 18%, 62% 4%, 66% 16%, 70% 3%, 75% 19%, 79% 5%, 84% 17%, 88% 2%, 93% 15%, 97% 1%, 100% 12%, 100% 88%, 98% 100%, 94% 82%, 90% 97%, 86% 84%, 81% 99%, 76% 83%, 72% 96%, 67% 81%, 63% 98%, 58% 85%, 54% 97%, 49% 82%, 45% 99%, 40% 84%, 35% 97%, 31% 83%, 27% 99%, 22% 81%, 18% 96%, 13% 84%, 9% 100%, 5% 82%, 2% 95%, 0% 85%)";

  const colorClasses = {
    cream: "bg-[#FDFBF7] dark:bg-zinc-800 border-amber-900/5",
    white: "bg-white dark:bg-zinc-900 border-neutral-200/40 dark:border-white/5",
    kraft: "bg-[#D4A574]/80 dark:bg-amber-950/40 border-amber-800/10",
    notebook: "bg-[#F0E6D2] dark:bg-zinc-800 border-amber-900/10",
  };

  return (
    <div
      className={cn(
        "relative w-full my-6 select-none pointer-events-none drop-shadow-[0_2px_4px_rgba(45,42,38,0.06)]",
        className
      )}
      style={{ height: `${height}px` }}
    >
      {/* Background Shadow emulation layer for clipPath */}
      <div
        className="absolute inset-0 bg-neutral-900/10 dark:bg-black/25 translate-y-[1px] blur-[0.5px]"
        style={{ clipPath }}
      />
      
      {/* Main Torn Paper Layer */}
      <div
        className={cn(
          "absolute inset-0 border-t border-b overflow-hidden",
          colorClasses[variant]
        )}
        style={{ clipPath }}
      >
        {/* Paper texture grain inside the divider */}
        <div 
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBoNjBNMCAyMGg2ME0wIDMwaDYwTTAgNDBoNjBNMCA1MGg2ME0xMCAwdjYwTTIwIDB2NjBNMzAgMHY2ME00MCAwdjYwTTUwIDB2NjAiIHN0cm9rZT0iIzhiNzM1NSIgc3Ryb2tlLXdpZHRoPSIwLjE1IiBvcGFjaXR5PSIwLjA4IiBmaWxsPSJub25lIi8+PC9zdmc+")`
          }}
        />

        {/* Notebook line simulation for the notebook variant */}
        {variant === "notebook" && (
          <div className="absolute inset-0 flex flex-col justify-center gap-1.5 opacity-20">
            <div className="w-full h-[1px] bg-blue-400" />
            <div className="w-full h-[1px] bg-blue-400" />
          </div>
        )}
      </div>
    </div>
  );
}
