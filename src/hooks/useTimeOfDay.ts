/**
 * useTimeOfDay.ts — Time-of-day greeting hook
 * Returns greeting strings, emoji, and period detection based on current local hour.
 */
import type { CustomGreetings } from "../types";

type Period = "morning" | "afternoon" | "evening" | "night";

const DEFAULT_GREETINGS: CustomGreetings = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
  night: "Good night",
};

const EMOJIS: Record<Period, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌆",
  night: "🌙",
};

function getPeriod(hour: number): Period {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function useTimeOfDay(customGreetings?: CustomGreetings) {
  const now = new Date();
  const hour = now.getHours();
  const period = getPeriod(hour);

  const greeting = customGreetings?.[period] || DEFAULT_GREETINGS[period];
  const emoji = EMOJIS[period];
  const isLateNight = period === "night" && hour >= 23;
  const isEarlyMorning = period === "morning" && hour < 7;

  return { greeting, emoji, period, isLateNight, isEarlyMorning };
}
