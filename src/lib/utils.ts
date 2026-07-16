import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formatLastSeen — Shared utility for formatting user presence timestamps.
 * Returns a human-readable relative time string.
 *
 * @param lastActive  - Timestamp in milliseconds (from Date.now())
 * @param isOnline    - Whether the user is currently online
 * @param options     - Optional: { offlineLabel, prefix }
 *
 * Examples:
 *   formatLastSeen(Date.now(), true)               → "Active now"
 *   formatLastSeen(undefined, false)                → "offline"
 *   formatLastSeen(Date.now() - 60000, false)       → "1m ago"
 *   formatLastSeen(Date.now() - 3600000, false)     → "1h ago"
 */
export function formatLastSeen(
  lastActive: number | undefined,
  isOnline: boolean,
  options?: { offlineLabel?: string; prefix?: string }
): string {
  const { offlineLabel = "offline", prefix = "" } = options || {};

  if (isOnline) return "Active now";
  if (!lastActive) return prefix + offlineLabel;

  const diff = Date.now() - lastActive;
  if (diff < 0) return "Active now";

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return prefix + "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return prefix + `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return prefix + `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return prefix + "yesterday";
  if (days < 7) return prefix + `${days}d ago`;

  return prefix + new Date(lastActive).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
