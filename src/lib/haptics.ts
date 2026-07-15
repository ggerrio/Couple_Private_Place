/**
 * haptics.ts — Shared haptic feedback utility
 *
 * Provides a single source of truth for vibration/haptic patterns.
 * Import this instead of duplicating the function across components.
 */

export type HapticType = "light" | "medium" | "heavy" | "success";

export function triggerHaptic(type: HapticType = "light"): void {
  if (typeof window !== "undefined" && window.navigator?.vibrate) {
    try {
      if (type === "light") window.navigator.vibrate(12);
      else if (type === "medium") window.navigator.vibrate(35);
      else if (type === "heavy") window.navigator.vibrate(70);
      else if (type === "success") window.navigator.vibrate([20, 40, 20]);
    } catch {
      // Silent — haptics are a progressive enhancement
    }
  }
}
