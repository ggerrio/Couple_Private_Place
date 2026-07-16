import React, { useRef } from "react";
import { cn } from "@/lib/utils";

export interface EmptyJournalPageProps {
  /** Emoji or small icon element displayed above message */
  icon?: string | React.ReactNode;
  /** Main message displayed in handwriting font */
  message?: string;
  /** Optional subtitle in smaller text */
  subtitle?: string;
  /** Optional action button rendered below */
  action?: React.ReactNode;
  className?: string;
}

const defaultMessages = [
  "Nothing written here yet…",
  "This page is waiting for your story.",
  "Blank pages are full of possibilities.",
  "A quiet page, waiting for words.",
  "Someday, this will be a memory.",
];

/** Pick a random message once per component mount */
function pickRandomMessage(message?: string): string {
  if (message) return message;
  return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
}

export function EmptyJournalPage({
  icon = "📖",
  message,
  subtitle,
  action,
  className,
}: EmptyJournalPageProps) {
  const displayMessage = useRef(pickRandomMessage(message)).current;

  return (
    <div 
      className={cn(
        "relative flex flex-col items-center justify-center min-height-[240px] p-8 text-center rounded-xl bg-gradient-to-br from-[#FDFBF7] to-[#F4E4C1] dark:from-[#252542] dark:to-[#1A1A2E] border border-[#E8DDD0] dark:border-white/5 shadow-sm", 
        className
      )}
    >
      {/* Realistic Paper Clip decoration in top-left */}
      <div className="absolute top-3 left-3 opacity-60 w-6 h-10 pointer-events-none select-none" aria-hidden="true">
        <svg viewBox="0 0 24 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#8B7355] dark:stroke-amber-100/50" strokeWidth="2.5">
          <path d="M12 40V12C12 8.686 14.686 6 18 6C21.314 6 24 8.686 24 12V32C24 36.418 20.418 40 16 40C11.582 40 8 36.418 8 32V12C8 5.373 13.373 0 20 0C26.627 0 32 5.373 32 12V24" transform="scale(0.6) translate(6, 6)"/>
        </svg>
      </div>

      {icon && (
        <div className="mb-4 opacity-40 text-4xl select-none">
          {icon}
        </div>
      )}

      <p className="font-handwrite text-2xl text-[#8B7355] dark:text-[#B8B0A4] max-w-[280px] leading-relaxed">
        {displayMessage}
      </p>

      {subtitle && (
        <p className="mt-2 text-xs font-sans text-gray-500 dark:text-gray-400 max-w-[260px] leading-relaxed">
          {subtitle}
        </p>
      )}

      {action && <div className="mt-5 relative z-10">{action}</div>}
    </div>
  );
}
