import React from "react";
import { cn } from "@/lib/utils";

export interface StickerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Sticker color variant */
  color?: "rose" | "gold" | "moss" | "lavender" | "coral" | "primary" | "gradient" | "tan" | "sage";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional icon element to display before text */
  icon?: React.ReactNode;
}

const colorMap: Record<string, string> = {
  rose: "bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  tan: "bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  sage: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  gold: "bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  moss: "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  lavender: "bg-purple-50 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-200",
  coral: "bg-red-50 hover:bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200",
  primary: "bg-[#E8B4B8] hover:bg-[#E09CA1] text-amber-950 dark:bg-rose-900/50 dark:text-rose-200",
  gradient: "bg-gradient-to-r from-[#E8B4B8] to-[#D4A574] text-amber-950 font-bold dark:from-rose-900 dark:to-amber-800 dark:text-white",
};

const sizeMap: Record<string, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-5 py-2 text-sm",
  lg: "px-7 py-3 text-base font-bold uppercase tracking-wider",
};

export function StickerButton({
  color = "primary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: StickerButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-2 cursor-pointer select-none transition-all duration-300 active:scale-95 active:translate-y-0.5 font-sans font-semibold hover:-translate-y-1 hover:rotate-[1deg] hover:scale-102",
        colorMap[color] || colorMap.primary,
        sizeMap[size] || sizeMap.md,
        // Thick white contour border like a physical die-cut vinyl sticker
        "border-[3px] border-white dark:border-white/10",
        // Distinctive hand-cut sticker shape
        "rounded-[10px_20px_8px_16px]",
        // Flat paper-like drop shadow that elevates on hover
        "shadow-[4px_4px_0_rgba(45,42,38,0.12)] hover:shadow-[6px_8px_0_rgba(45,42,38,0.16)] dark:shadow-[4px_4px_0_rgba(0,0,0,0.3)]",
        className
      )}
      {...props}
    >
      {/* Glossy Diagonal Reflection overlay */}
      <div className="absolute inset-0 rounded-inherit bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none z-10" />

      {/* Crease fold lines indicating a peelable sticker */}
      <div className="absolute bottom-1 right-1 w-2 h-2 border-r border-b border-black/10 dark:border-white/10 rounded-br-sm" />

      {icon && <span className="flex-shrink-0 z-10">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
