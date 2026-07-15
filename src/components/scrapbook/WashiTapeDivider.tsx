import React, { useMemo } from "react";
import { cn } from "@/src/lib/utils";
import { motion } from "motion/react";
import { useCouple } from "../../context/CoupleContext";

export interface WashiTapeDividerProps {
  /** Tape color variant */
  color?: "rose" | "tan" | "sage" | "primary" | "gold" | "moss" | "lavender" | "coral";
  /** Pattern variant */
  pattern?: "solid" | "dots" | "stripes" | "grid" | "plaid" | "stars" | "botanical" | "lace";
  className?: string;
  /** Optional label displayed in the center of the tape */
  label?: string;
}

const tailwindColors: Record<string, { bg: string; text: string; border: string }> = {
  rose: {
    bg: "bg-[#E8B4B8]/75 dark:bg-rose-950/80",
    text: "text-rose-950 dark:text-rose-200",
    border: "border-rose-400/30"
  },
  tan: {
    bg: "bg-[#D4A574]/75 dark:bg-amber-950/80",
    text: "text-amber-950 dark:text-amber-200",
    border: "border-amber-400/30"
  },
  sage: {
    bg: "bg-emerald-100/75 dark:bg-emerald-950/80",
    text: "text-emerald-950 dark:text-emerald-200",
    border: "border-emerald-400/30"
  },
  gold: {
    bg: "bg-[#F4C542]/75 dark:bg-amber-950/80",
    text: "text-amber-950 dark:text-amber-200",
    border: "border-amber-500/30"
  },
  moss: {
    bg: "bg-emerald-200/75 dark:bg-emerald-950/80",
    text: "text-emerald-950 dark:text-emerald-200",
    border: "border-emerald-300/30"
  },
  lavender: {
    bg: "bg-purple-200/75 dark:bg-purple-950/80",
    text: "text-purple-950 dark:text-purple-200",
    border: "border-purple-300/30"
  },
  coral: {
    bg: "bg-red-200/75 dark:bg-red-950/80",
    text: "text-red-950 dark:text-red-200",
    border: "border-red-300/30"
  },
  primary: {
    bg: "bg-[#E8B4B8]/75 dark:bg-rose-950/80",
    text: "text-rose-950 dark:text-rose-200",
    border: "border-rose-400/30"
  }
};

export function WashiTapeDivider({
  color = "rose",
  pattern,
  label,
  className,
}: WashiTapeDividerProps) {
  let themePattern = "default";
  try {
    const couple = useCouple();
    themePattern = couple.washiTapeTheme || "default";
  } catch (e) {
    // Context might not be available, e.g. on LoginView or during initialization
  }

  // Stable random rotation and pattern for the specific label to prevent SSR flickering
  const config = useMemo(() => {
    const hash = label ? label.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.floor(Math.random() * 100);
    const rotation = (hash % 4) - 1.5; // Rotate between -1.5deg and +1.5deg
    
    // Choose selected pattern
    let selectedPattern = pattern;
    if (!selectedPattern) {
      if (themePattern !== "default") {
        selectedPattern = themePattern as any;
      } else {
        selectedPattern = (hash % 3 === 0 ? "solid" : hash % 3 === 1 ? "dots" : "stripes");
      }
    }
    return { rotation, selectedPattern };
  }, [label, pattern, themePattern]);

  const activeColor = tailwindColors[color] || tailwindColors.rose;

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.9 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "my-10 h-8 flex items-center justify-center relative select-none pointer-events-none w-full",
        className
      )}
      aria-hidden="true"
    >
      {/* Torn Washi Tape Strip */}
      <div
        className={cn(
          "absolute left-1 right-1 h-8 opacity-90 backdrop-blur-[0.5px] shadow-[0_2px_4px_rgba(45,42,38,0.1)] border-t border-b flex items-center justify-center overflow-hidden",
          activeColor.bg,
          activeColor.border
        )}
        style={{
          transform: `rotate(${config.rotation}deg)`,
          // Advanced torn-edge paper hand-cut clipping path
          clipPath: "polygon(0% 20%, 1.2% 5%, 2.5% 22%, 4% 3%, 5.5% 18%, 94.5% 4%, 96% 22%, 97.2% 2%, 98.5% 18%, 100% 10%, 99.2% 82%, 98% 95%, 96.5% 78%, 95% 98%, 93.5% 82%, 6.5% 95%, 5% 78%, 3.8% 97%, 2.5% 80%, 0% 90%)",
        }}
      >
        {/* Pattern Overlays */}
        {config.selectedPattern === "dots" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.45)_1.5px,transparent_1.5px)] bg-[size:10px_10px] opacity-80" />
        )}
        {config.selectedPattern === "stripes" && (
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,0.22)_6px,rgba(255,255,255,0.22)_12px)] opacity-80" />
        )}
        {config.selectedPattern === "grid" && (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:8px_8px] opacity-85" />
        )}
        {config.selectedPattern === "plaid" && (
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.18)_4px,rgba(255,255,255,0.18)_8px),repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(255,255,255,0.18)_4px,rgba(255,255,255,0.18)_8px)] opacity-80" />
        )}
        {config.selectedPattern === "stars" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.75)_1px,transparent_1.5px)] bg-[size:16px_16px] opacity-90" />
        )}
        {config.selectedPattern === "botanical" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_2px,transparent_4px),radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15)_1.5px,transparent_3px)] bg-[size:18px_18px] opacity-85" />
        )}
        {config.selectedPattern === "lace" && (
          <div className="absolute inset-x-0 top-1 bottom-1 border-t border-b border-dashed border-white/50 opacity-90" />
        )}
        {/* Subtle fibrous paper grain overlay */}
        <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:4px_4px] mix-blend-overlay" />
      </div>

      {/* Handwriting label strip stuck on top of the tape */}
      {label && (
        <span
          className={cn(
            "relative z-10 px-5 py-0.5 rounded-sm bg-white/95 dark:bg-zinc-900/95 font-handwrite text-sm font-bold tracking-wider shadow-xs transform -rotate-1 border border-amber-900/10 dark:border-white/10 uppercase",
            activeColor.text
          )}
        >
          {label}
        </span>
      )}
    </motion.div>
  );
}
