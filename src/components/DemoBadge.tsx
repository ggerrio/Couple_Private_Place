/**
 * DemoBadge.tsx — Floating indicator shown when the app runs in demo mode.
 *
 * Displays a subtle-but-visible badge in the top-right corner so visitors
 * know they are exploring a sample version, not the real couple's data.
 * Includes an "Exit Demo" action to clear the flag and reload.
 */
import React from "react";
import { motion } from "motion/react";
import { disableDemoMode } from "../utils/demoMode";
import { FlaskConical, X } from "lucide-react";

export default function DemoBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
      className="fixed top-3 right-3 z-[9999] group"
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-100/90 dark:bg-amber-900/80 border border-amber-400/50 shadow-lg backdrop-blur-sm">
        <FlaskConical className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-200">
          Demo
        </span>

        {/* Tooltip on hover */}
        <div className="absolute right-0 top-full mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="px-2.5 py-1.5 rounded-lg bg-amber-900 text-amber-100 text-[9px] font-medium shadow-md whitespace-nowrap">
            Sample data · No sign-in needed · All local
          </div>
        </div>

        {/* Exit demo button (appears on hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            disableDemoMode();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-amber-200/50 dark:hover:bg-amber-800/50 cursor-pointer ml-1"
          aria-label="Exit demo mode"
          title="Exit demo mode"
        >
          <X className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        </button>
      </div>
    </motion.div>
  );
}
