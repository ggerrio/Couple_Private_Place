/**
 * WeatherBadge.tsx — Persistent weather indicator badge
 * Shows a small badge in the top-right corner when it's raining.
 * Reads weather data from CoupleContext (shared by WeatherSection).
 * Stays visible across all tabs — integrated in App.tsx.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCouple } from "../../context/CoupleContext";
import { MapPin, X } from "lucide-react";

/** Check if a weather code or description indicates rain (mirrors RainEffect logic) */
function isRainy(code: number, desc: string): boolean {
  const low = desc.toLowerCase();
  const descRainy =
    low.includes("rain") ||
    low.includes("drizzle") ||
    low.includes("shower") ||
    low.includes("thunder") ||
    low.includes("storm");
  const codeRainy =
    (code >= 51 && code <= 65) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99) ||
    (code >= 176 && code <= 395);
  return codeRainy || descRainy;
}

const WEATHER_ICON_MAP: Record<string, string> = {
  sunny: "☀️",
  cloudy: "⛅",
  rainy: "🌧️",
  snowy: "❄️",
  stormy: "🌩️",
};

/** Weather icon by code */
function WeatherIcon({ code }: { code: number }) {
  let state = "sunny";
  if (code >= 1 && code <= 3) state = "cloudy";
  else if (code === 45 || code === 48) state = "cloudy";
  else if (code === 51 || code === 53 || code === 55) state = "rainy";
  else if (code >= 61 && code <= 65) state = "rainy";
  else if (code >= 71 && code <= 75) state = "snowy";
  else if (code >= 80 && code <= 82) state = "rainy";
  else if (code >= 95 && code <= 99) state = "stormy";
  else if (code >= 176 && code <= 395) state = "rainy";
  return <span className="text-sm">{WEATHER_ICON_MAP[state]}</span>;
}

export function WeatherBadge() {
  const { currentUser, userA, userB, liveWeather } = useCouple();
  const [dismissed, setDismissed] = useState(false);

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  const myCity = activeProfile.weatherCity || "Seoul";
  const partnerCity = partnerProfile.weatherCity || activeProfile.weatherCity || "Seoul";

  const myWeather = liveWeather[myCity];
  const partnerWeather = partnerCity !== myCity ? liveWeather[partnerCity] : null;

  const myRainy = myWeather != null && isRainy(myWeather.code, myWeather.desc);
  const partnerRainy = partnerWeather != null && isRainy(partnerWeather.code, partnerWeather.desc);

  const show = (myRainy || partnerRainy) && !dismissed;
  const partnerName = partnerProfile.name.split(" ")[0];

  // Reset dismissed when neither city has rain
  React.useEffect(() => {
    if (!myRainy && !partnerRainy) setDismissed(false);
  }, [myRainy, partnerRainy]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.9 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[55] space-y-1.5"
        >
          {/* Your city badge */}
          {myRainy && myWeather && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-2xl shadow-md border backdrop-blur-md group"
              style={{
                backgroundColor: "color-mix(in srgb, var(--fabric-cream) 85%, transparent)",
                borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
              }}
            >
              <div className="flex-shrink-0">
                <WeatherIcon code={myWeather.code} />
              </div>
              <div className="min-w-0 flex flex-col leading-tight">
                <span className="text-[10px] font-bold text-[var(--text-main)] flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                  <span className="truncate max-w-[80px]">{myCity}</span>
                </span>
                <span className="text-[8px] text-indigo-500 font-bold font-mono uppercase tracking-wider">
                  {myWeather.desc || "Rainy"}
                </span>
              </div>
            </div>
          )}

          {/* Partner city badge */}
          {partnerRainy && partnerWeather && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-2xl shadow-md border backdrop-blur-md group"
              style={{
                backgroundColor: "color-mix(in srgb, var(--fabric-cream) 85%, transparent)",
                borderColor: "color-mix(in srgb, var(--color-accent-lavender) 30%, transparent)",
              }}
            >
              <div className="flex-shrink-0">
                <WeatherIcon code={partnerWeather.code} />
              </div>
              <div className="min-w-0 flex flex-col leading-tight">
                <span className="text-[10px] font-bold text-[var(--text-main)] flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                  <span className="truncate max-w-[80px]">{partnerCity}</span>
                  <span className="text-[7px] text-[var(--color-accent-lavender)] font-bold font-mono">{partnerName}</span>
                </span>
                <span className="text-[8px] text-indigo-500 font-bold font-mono uppercase tracking-wider">
                  {partnerWeather.desc || "Rainy"}
                </span>
              </div>
            </div>
          )}

          {/* Dismiss (only shown once for the whole group) */}
          <div className="flex justify-end">
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 px-2 py-1 rounded-full hover:bg-black/5 text-[8px] font-bold text-[var(--text-muted)] transition-colors cursor-pointer"
              aria-label="Dismiss weather badges"
            >
              Dismiss ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
