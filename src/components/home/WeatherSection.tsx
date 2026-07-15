import React, { useState, useEffect } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Smile,
  MapPin,
  AlertCircle,
  Wind,
  Clock,
  Heart,
  Thermometer,
} from "lucide-react";
import { Skeleton } from "../extras/Skeleton";
import { triggerHaptic } from "../../lib/haptics";


// ─── Weather Types & Helpers ──────────────────────────────────────────────────

interface WeatherData {
  temp: number;
  desc: string;
  icon: string;
  city: string;
  code: number;
  utcOffset: number | null;
}

interface ArtisticWeatherIconProps {
  code: number;
  isDay?: boolean;
  className?: string;
}

function ArtisticWeatherIcon({
  code,
  isDay = true,
  className = "w-8 h-8",
}: ArtisticWeatherIconProps) {
  let state: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" = "sunny";
  if (code === 0) state = "sunny";
  else if (code === 1 || code === 2 || code === 3) state = "cloudy";
  else if (code === 45 || code === 48) state = "cloudy";
  else if (code === 51 || code === 53 || code === 55) state = "rainy";
  else if (code === 61 || code === 63 || code === 65) state = "rainy";
  else if (code === 71 || code === 73 || code === 75) state = "snowy";
  else if (code === 80 || code === 81 || code === 82) state = "rainy";
  else if (code === 95 || code === 96 || code === 99) state = "stormy";

  if (state === "sunny") {
    return (
      <svg className={`${className} hover:scale-110 transition-transform duration-300`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="20" fill="#dda15e" opacity="0.85" />
        <path d="M50 12 C52 22, 48 22, 50 12 Z M50 88 C48 78, 52 78, 50 88 Z" stroke="#bc6c25" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M12 50 C22 52, 22 48, 12 50 Z M88 50 C78 48, 78 52, 88 50 Z" stroke="#bc6c25" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M23 23 C31 29, 29 31, 23 23 Z M77 77 C69 71, 71 69, 77 77 Z" stroke="#bc6c25" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M77 23 C71 29, 69 31, 77 23 Z M23 77 C29 69, 31 71, 23 77 Z" stroke="#bc6c25" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="50" cy="50" r="12" stroke="#283618" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (state === "cloudy") {
    return (
      <svg className={`${className} hover:scale-110 transition-transform duration-300`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {isDay && <circle cx="62" cy="38" r="14" fill="#dda15e" opacity="0.6" />}
        <path d="M25 65 C20 65, 16 60, 16 54 C16 47, 22 43, 28 43 C30 32, 40 25, 52 25 C64 25, 73 34, 75 45 C82 45, 88 50, 88 57 C88 64, 82 65, 78 65 Z" fill="#fbf7f0" stroke="#283618" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M32 50 C38 48, 44 48, 48 51" stroke="#bc6c25" strokeWidth="2" strokeLinecap="round" />
        <path d="M54 58 C62 56, 68 58, 72 61" stroke="#bc6c25" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === "rainy") {
    return (
      <svg className={`${className} hover:scale-110 transition-transform duration-300`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 55 C20 55, 16 50, 16 44 C16 37, 22 33, 28 33 C30 22, 40 15, 52 15 C64 15, 73 24, 75 35 C82 35, 88 40, 88 47 C88 54, 82 55, 78 55 Z" fill="#f4eae1" stroke="#283618" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
        <g><path d="M32 65 L28 77" stroke="#bc6c25" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 68 L46 82" stroke="#dda15e" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M68 64 L64 76" stroke="#bc6c25" strokeWidth="3" strokeLinecap="round" /></g>
      </svg>
    );
  }
  if (state === "snowy") {
    return (
      <svg className={`${className} hover:scale-110 transition-transform duration-300`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 55 C20 55, 16 50, 16 44 C16 37, 22 33, 28 33 C30 22, 40 15, 52 15 C64 15, 73 24, 75 35 C82 35, 88 40, 88 47 C88 54, 82 55, 78 55 Z" fill="#ffffff" stroke="#283618" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
        <g><path d="M35 65 L35 73 M31 69 L39 69" stroke="#bc6c25" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 68 L50 78 M45 73 L55 73" stroke="#dda15e" strokeWidth="2" strokeLinecap="round" />
        <path d="M65 65 L65 73 M61 69 L69 69" stroke="#bc6c25" strokeWidth="2" strokeLinecap="round" /></g>
      </svg>
    );
  }
  return (
    <svg className={`${className} hover:scale-110 transition-transform duration-300`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M25 55 C20 55, 16 50, 16 44 C16 37, 22 33, 28 33 C30 22, 40 15, 52 15 C64 15, 73 24, 75 35 C82 35, 88 40, 88 47 C88 54, 82 55, 78 55 Z" fill="#eae0d5" stroke="#283618" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M52 52 L42 68 L54 68 L46 85" stroke="#bc6c25" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="#dda15e" />
    </svg>
  );
}

function mapWwoToWmo(wwoCode: string): number {
  const n = parseInt(wwoCode);
  if (n === 113) return 0;
  if (n <= 119) return 2;
  if (n <= 143) return 45;
  if (n <= 176) return 80;
  if (n <= 260) return 61;
  if (n <= 350) return 71;
  return 95;
}

async function fetchWeather(city: string, signal: AbortSignal): Promise<WeatherData | null> {
  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const json = await res.json();
    const cur = json.current_condition?.[0];
    if (!cur) return null;
    const tz = json.time_zone?.[0];
    const offsetStr = tz?.utcOffset;
    let utcOffset: number | null = null;
    if (offsetStr) {
      const match = offsetStr.match(/^([+-]?)(\d{1,2}):?(\d{2})?$/);
      if (match) {
        const sign = match[1] === "-" ? -1 : 1;
        const hours = parseInt(match[2], 10);
        const minutes = match[3] ? parseInt(match[3], 10) : 0;
        utcOffset = sign * (hours * 60 + minutes);
      }
    }
    const areaName = json.nearest_area?.[0]?.areaName?.[0]?.value || city;
    return {
      temp: parseInt(cur.temp_C),
      desc: cur.weatherDesc?.[0]?.value ?? "Unknown",
      icon: "",
      city: areaName,
      code: mapWwoToWmo(cur.weatherCode),
      utcOffset,
    };
  } catch {
    return null;
  }
}

// ─── WeatherPanel ─────────────────────────────────────────────────────────────

interface WeatherPanelProps {
  profile: {
    name: string;
    avatar: string;
    weatherCity?: string;
    latitude?: number;
    longitude?: number;
    timezoneOffset?: number;
    timezoneName?: string;
  };
  isPartner?: boolean;
}

function WeatherPanel({ profile, isPartner = false }: WeatherPanelProps) {
  const { currentUser, updateProfile, updateLiveWeather } = useCouple();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState<Date>(new Date());

  const accentVar = "var(--primary)";

  // Live ticking clock
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Request GPS coordinates on mount for the current user
  useEffect(() => {
    if (!isPartner && typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (
            !profile.latitude ||
            !profile.longitude ||
            Math.abs(profile.latitude - latitude) > 0.01 ||
            Math.abs(profile.longitude - longitude) > 0.01
          ) {
            updateProfile(currentUser, { latitude, longitude });
          }
        },
        (error) => {
          console.error("[GPS error]", error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [isPartner, currentUser, profile.latitude, profile.longitude, updateProfile]);

  // Auto-detect browser timezone and save to current user's profile
  useEffect(() => {
    if (!isPartner && currentUser) {
      const tzOffset = -new Date().getTimezoneOffset();
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (profile.timezoneOffset !== tzOffset || profile.timezoneName !== tzName) {
        updateProfile(currentUser, { timezoneOffset: tzOffset, timezoneName: tzName });
      }
    }
  }, [isPartner, currentUser, profile.timezoneOffset, profile.timezoneName, updateProfile]);

  const normalizeTzName = (tz: string) => {
    const clean = tz.replace(/[()]/g, "").toUpperCase();
    if (["GMT+7", "GMT+07:00", "UTC+7", "UTC+07:00", "WIB"].includes(clean)) return "WIB";
    if (["GMT+8", "GMT+08:00", "UTC+8", "UTC+08:00", "WITA"].includes(clean)) return "WITA";
    if (["GMT+9", "GMT+09:00", "UTC+9", "UTC+09:00", "WIT"].includes(clean)) return "WIT";
    return tz;
  };

  const getLocalTime = () => {
    const offset = weather?.utcOffset ?? profile.timezoneOffset;

    if (offset !== undefined && offset !== null) {
      const targetTime = new Date(time.getTime() + offset * 60000);
      const timeStr = targetTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      });

      let tzAbbr = "";
      if (weather?.utcOffset !== undefined && weather?.utcOffset !== null) {
        const offsetHours = weather.utcOffset / 60;
        if (offsetHours === 7) tzAbbr = "WIB";
        else if (offsetHours === 8) tzAbbr = "WITA";
        else if (offsetHours === 9) {
          tzAbbr = weather.city.toLowerCase().includes("seoul") ? "KST" : "WIT";
        } else {
          const sign = offsetHours >= 0 ? "+" : "";
          const formattedHours = Number.isInteger(offsetHours) ? offsetHours : offsetHours.toFixed(1);
          tzAbbr = `GMT${sign}${formattedHours}`;
        }
      } else if (profile.timezoneName) {
        try {
          const parts = time.toLocaleTimeString("en-US", {
            timeZone: profile.timezoneName,
            timeZoneName: "short",
          }).split(" ");
          const resolvedTz = parts[parts.length - 1];
          tzAbbr = normalizeTzName(resolvedTz);
        } catch (e) {
          tzAbbr = profile.timezoneName;
        }
      } else {
        const offsetHours = offset / 60;
        const sign = offsetHours >= 0 ? "+" : "";
        const formattedHours = Number.isInteger(offsetHours) ? offsetHours : offsetHours.toFixed(1);
        tzAbbr = `GMT${sign}${formattedHours}`;
      }

      return `${timeStr} (${tzAbbr})`;
    }

    const timeStr = time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const parts = time.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ");
    const tz = parts[parts.length - 1];
    return `${timeStr} (${normalizeTzName(tz)})`;
  };

  const weatherQuery = profile.latitude && profile.longitude
    ? `${profile.latitude},${profile.longitude}`
    : (profile.weatherCity || "Seoul");

  // Fetch weather on mount and re-check every 30 minutes (so RainEffect also stays in sync)
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);

    const doFetch = () => {
      fetchWeather(weatherQuery, ac.signal).then((d) => {
        if (d) {
          setWeather(d);
          // Share weather data via context so RainEffect doesn't need to fetch
          updateLiveWeather(weatherQuery, { code: d.code, desc: d.desc });

          // Update weatherCity if name differs from what we currently have
          if (!isPartner && d.city && d.city !== profile.weatherCity && !d.city.includes(",")) {
            updateProfile(currentUser, { weatherCity: d.city });
          }
        }
        setLoading(false);
      });
    };

    doFetch();

    // Re-check every 30 min so weather changes (sunny→rainy) are caught mid-session
    const interval = setInterval(doFetch, 30 * 60 * 1000);

    return () => {
      ac.abort();
      clearInterval(interval);
    };
  }, [weatherQuery, isPartner, currentUser, profile.weatherCity, updateProfile, updateLiveWeather]);

  const CITY_PRESETS = [
    { name: "Seoul", lat: 37.5665, lon: 126.9780 },
    { name: "Paris", lat: 48.8566, lon: 2.3522 },
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
  ];

  return (
    <div className="bg-white/30 border border-white/20 p-4 rounded-2xl flex items-center justify-between shadow-xs relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-100/10 to-transparent rounded-full pointer-events-none blur-md" />
      {loading ? (
        <div className="w-full space-y-2.5 p-1">
          <Skeleton height={14} width="35%" rounded="6px" />
          <Skeleton height={32} width="50%" rounded="8px" />
          <Skeleton height={14} width="45%" rounded="6px" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton height={28} width="80px" rounded="12px" />
            <Skeleton width={56} height={56} rounded="50%" />
          </div>
        </div>
      ) : weather ? (
        <div className="flex items-center justify-between w-full">
          <div className="space-y-1 text-left">
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--text-muted)] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" style={{ color: accentVar }} />
              {weather.city}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-display text-[var(--text-main)]">
                {weather.temp}°C
              </span>
            </div>
            <span className="text-xs font-bold block" style={{ color: accentVar }}>
              {weather.desc}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono pt-1">
              {isPartner ? (
                <Thermometer className="w-3.5 h-3.5" />
              ) : (
                <Wind className="w-3 h-3" />
              )}
              <span>{isPartner ? "Feels wonderful" : "12 km/h wind"}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div
              className="bg-white/40 border border-white/50 px-2.5 py-1 rounded-xl shadow-xs text-right backdrop-blur-xs flex items-center gap-1.5 font-mono text-[10px] font-bold text-[var(--text-main)]"
            >
              <Clock className="w-3 h-3" style={{ color: accentVar }} />
              <span>{getLocalTime()}</span>
            </div>
            <div className="flex items-center justify-center pr-1">
              <ArtisticWeatherIcon code={weather.code} isDay={true} className="w-14 h-14" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full py-4 flex flex-col items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
          <span className="text-xs text-red-500 font-bold">Skies hazy</span>
          <button
            type="button"
            onClick={() => {
              const p = CITY_PRESETS[0];
              updateProfile(currentUser, { weatherCity: p.name });
            }}
            className="text-[10px] underline text-[var(--primary)] mt-1 font-semibold cursor-pointer"
          >
            Load fallback
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MoodSelector → Mood Lantern ─────────────────────────────────────────

const MOODS_LIST = [
  { value: "happy", emoji: "😊", label: "Happy", lanternColor: "#FDE68A" },
  { value: "cozy", emoji: "🧸", label: "Cozy", lanternColor: "#FBBF24" },
  { value: "sleepy", emoji: "😴", label: "Sleepy", lanternColor: "#A78BFA" },
  { value: "excited", emoji: "🌟", label: "Excited", lanternColor: "#F472B6" },
  { value: "loved", emoji: "💖", label: "Loved", lanternColor: "#FB7185" },
  { value: "bored", emoji: "😐", label: "Bored", lanternColor: "#9CA3AF" },
  { value: "stressed", emoji: "😤", label: "Stressed", lanternColor: "#F87171" },
  { value: "peaceful", emoji: "🍃", label: "Peaceful", lanternColor: "#6EE7B7" },
];

export function MoodSelector() {
  const { currentUser, updateProfile, addMoodHistoryEntry, userA, userB } =
    useCouple();
  const activeProfile = currentUser === "user_a" ? userA : userB;
  const currentMoodValue = activeProfile.mood || "happy";
  const currentMood = MOODS_LIST.find((m) => m.value === currentMoodValue) || MOODS_LIST[0];
  const [moodNote, setMoodNote] = useState("");
  const [lanternOpen, setLanternOpen] = useState(false);

  return (
    <div className="mt-6">
      <div className="flex items-start gap-4">
        {/* ── Hanging Lantern ── */}
        <div className="flex flex-col items-center flex-shrink-0">
          {/* String */}
          <div className="w-px h-4 bg-gradient-to-b from-transparent to-gray-300" />
          {/* Lantern body */}
          <motion.button
            type="button"
            onClick={() => setLanternOpen(!lanternOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-14 h-20 rounded-3xl flex items-center justify-center cursor-pointer border shadow-inner transition-colors duration-700"
            style={{
              backgroundColor: `color-mix(in srgb, ${currentMood.lanternColor} 30%, transparent)`,
              borderColor: `color-mix(in srgb, ${currentMood.lanternColor} 50%, transparent)`,
            }}
          >
            {/* Inner glow */}
            <motion.div
              className="absolute inset-2 rounded-2xl"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: `radial-gradient(circle at 50% 40%, ${currentMood.lanternColor} 0%, transparent 70%)`,
              }}
            />
            {/* Emoji */}
            <span className="relative z-10 text-2xl select-none">
              {currentMood.emoji}
            </span>
            {/* Metal cap top */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-1.5 rounded-t bg-gradient-to-r from-amber-600 to-amber-700" />
            {/* Metal cap bottom */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b bg-gradient-to-r from-amber-600 to-amber-700" />
            {/* Tassel */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <div className="w-px h-2 bg-amber-500/40 mx-auto" />
              <div className="w-1.5 h-1.5 rounded-full mx-auto" style={{ backgroundColor: currentMood.lanternColor }} />
            </div>
          </motion.button>
          {/* Hanging glow below */}
          <motion.div
            className="w-16 h-6 rounded-full blur-xl pointer-events-none"
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ background: currentMood.lanternColor }}
          />
        </div>

        {/* ── Mood Info & Controls ── */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider font-bold">
              Mood Lantern
            </p>
            <p className="text-sm font-bold text-[var(--text-main)] capitalize">
              Feeling <span style={{ color: currentMood.lanternColor }}>{currentMood.label}</span>
            </p>
          </div>

          {/* Mood grid (collapsible) */}
          <AnimatePresence>
            {lanternOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-4 gap-1.5 pt-1 pb-2">
                  {MOODS_LIST.map((moodItem) => (
                    <button
                      key={moodItem.value}
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        updateProfile(currentUser, { mood: moodItem.value });
                        setLanternOpen(false);
                      }}
                      className={`py-2 px-1 text-center rounded-xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer ${
                        currentMoodValue === moodItem.value
                          ? "bg-white text-[var(--text-main)] shadow-md scale-105 font-extrabold border-2"
                          : "bg-white/30 border border-white/20 text-gray-400 hover:text-gray-600 hover:scale-105 hover:bg-white/60"
                      }`}
                      style={{
                        borderColor: currentMoodValue === moodItem.value
                          ? `color-mix(in srgb, ${moodItem.lanternColor} 40%, transparent)`
                          : "transparent",
                      }}
                      title={moodItem.label}
                    >
                      <span className="text-xl">{moodItem.emoji}</span>
                      <span className="text-[9px] block capitalize mt-0.5 font-semibold">
                        {moodItem.label}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Note + Save */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Add a cozy whisper..."
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-serif italic text-[var(--text-main)] bg-white/80 border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--primary)] placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => {
                triggerHaptic("success");
                addMoodHistoryEntry(currentMoodValue, moodNote);
                setMoodNote("");
              }}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow-sm transition-colors flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-current animate-heartbeat" />                    <span>Save Mood</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Rain check helper ────────────────────────────────────────────────────────

function isRainyWeather(desc: string): boolean {
  const low = desc.toLowerCase();
  return (
    low.includes("rain") ||
    low.includes("drizzle") ||
    low.includes("shower") ||
    low.includes("thunder") ||
    low.includes("storm")
  );
}

function isRainy(code: number, desc: string): boolean {
  const isCodeRainy =
    (code >= 51 && code <= 65) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99) ||
    (code >= 176 && code <= 395);
  return isCodeRainy || isRainyWeather(desc);
}

// ─── WeatherSection (Main Export) ─────────────────────────────────────────────

export function WeatherSection() {
  const { currentUser, userA, userB, liveWeather } = useCouple();
  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  const myQuery = activeProfile.latitude && activeProfile.longitude
    ? `${activeProfile.latitude},${activeProfile.longitude}`
    : (activeProfile.weatherCity || "Seoul");

  const partnerQuery = partnerProfile.latitude && partnerProfile.longitude
    ? `${partnerProfile.latitude},${partnerProfile.longitude}`
    : (partnerProfile.weatherCity || "Seoul");

  const myWeather = liveWeather[myQuery];
  const partnerWeather = partnerQuery !== myQuery ? liveWeather[partnerQuery] : null;

  const myRainy = myWeather != null && isRainy(myWeather.code, myWeather.desc);
  const partnerRainy = partnerWeather != null && isRainy(partnerWeather.code, partnerWeather.desc);
  const showRain = myRainy || partnerRainy;

  const moodsList = MOODS_LIST;

  const content = (
    <div className="p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-4 gap-3 mb-5">
        <div className="flex items-center gap-3">
          <Smile className="w-6 h-6 text-rose-500 animate-bounce-slow" />
          <div>
            <h3 className="text-lg md:text-xl font-bold text-[var(--text-main)] font-serif italic">
              Our Little Sky
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Weather, mood, and feelings — synced in real-time.
            </p>
          </div>
        </div>
        <span className="text-xs bg-accent-moss accent-moss border border-[var(--color-accent-moss)]/20 px-3.5 py-1 rounded-full font-bold flex items-center gap-1.5 self-start sm:self-auto shadow-xs accent-glow">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-moss)] animate-pulse" />
          Online
        </span>
      </div>

      {/* Two-Column Weather Grid */}
      <div className="section-breath grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)]">
        {/* Current User */}
        <div className="flex flex-col space-y-4 pb-6 md:pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img loading="lazy"
                src={activeProfile.avatar}
                alt={activeProfile.name}
                className="w-11 h-11 rounded-full border-2 border-[var(--primary)]/20 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider font-bold">
                  My State
                </p>
                <p className="text-base font-extrabold text-[var(--text-main)] truncate max-w-[150px]">
                  {activeProfile.name.split(" ")[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/50 border border-white/60 p-2 px-3 rounded-2xl shadow-xs">
              <span className="text-3xl">
                {moodsList.find((m) => m.value === activeProfile.mood)?.emoji || "🌸"}
              </span>
              <div className="text-left">
                <p className="text-[10px] text-[var(--text-muted)] font-bold">Current Mood</p>
                <p className="text-xs font-black text-[var(--primary)] capitalize">
                  {activeProfile.mood || "Happy"}
                </p>
                {activeProfile.moodNote && (
                  <p className="text-[9px] text-[var(--text-muted)] italic font-medium max-w-[120px] truncate leading-tight mt-0.5" title={activeProfile.moodNote}>
                    "{activeProfile.moodNote}"
                  </p>
                )}
              </div>
            </div>
          </div>
          <WeatherPanel profile={activeProfile} />
        </div>

        {/* Partner */}
        <div className="flex flex-col space-y-4 pt-6 md:pt-0 md:pl-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img loading="lazy"
                src={partnerProfile.avatar}
                alt={partnerProfile.name}
                className="w-11 h-11 rounded-full border-2 border-[var(--primary)]/20 object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider font-bold">
                  Partner's State
                </p>
                <p className="text-base font-extrabold text-[var(--text-main)] truncate max-w-[150px]">
                  {partnerProfile.name.split(" ")[0]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/50 border border-white/60 p-2 px-3 rounded-2xl shadow-xs">
              <span className="text-3xl">
                {moodsList.find((m) => m.value === partnerProfile.mood)?.emoji || "🌸"}
              </span>
              <div className="text-left">
                <p className="text-[10px] text-[var(--text-muted)] font-bold">Current Mood</p>
                <p className="text-xs font-black text-[var(--primary)] capitalize">
                  {partnerProfile.mood || "Happy"}
                </p>
                {partnerProfile.moodNote && (
                  <p className="text-[9px] text-[var(--text-muted)] italic font-medium max-w-[120px] truncate leading-tight mt-0.5" title={partnerProfile.moodNote}>
                    "{partnerProfile.moodNote}"
                  </p>
                )}
              </div>
            </div>
          </div>
          <WeatherPanel profile={partnerProfile} isPartner />
        </div>
      </div>

      {/* Mood Selector */}
      <MoodSelector />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.02 }}
      id="mood-skies-sync-card"
    >
      {content}
    </motion.div>
  );
}
