/**
 * useSettingsState.ts — Dark mode, dates, cloudinary, greetings, weather, surprises state
 * Extracted from CoupleContext for modularity.
 */
import { useState, useCallback } from "react";
import { lsGet, DEFAULT_GREETINGS } from "./defaults";
import type { CustomGreetings } from "../types";

export function useSettingsState() {
  const [darkMode, setDarkMode] = useState<boolean>(() => lsGet("couple_dark_mode", false));
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      localStorage.setItem("couple_dark_mode", JSON.stringify(!prev));
      return !prev;
    });
  }, []);

  const [anniversaryDate, setAnniversaryDate] = useState(() => lsGet("couple_anniversary_date", "2025-12-14"));
  const [birthdayA, setBirthdayA] = useState("06-16");
  const [birthdayB, setBirthdayB] = useState("12-25");
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryUploadPreset, setCloudinaryUploadPreset] = useState("");
  const [activeSurprise, setActiveSurprise] = useState<string | null>(null);
  const [customGreetings, setCustomGreetings] = useState<CustomGreetings>(() => lsGet("couple_custom_greetings", DEFAULT_GREETINGS));
  const [liveWeather, setLiveWeather] = useState<Record<string, { code: number; desc: string } | null>>({});
  const [fontTheme, setFontTheme] = useState<string>(() => {
    return localStorage.getItem("couple_font_theme") || "scrapbook";
  });
  const updateFontTheme = useCallback((theme: string) => {
    localStorage.setItem("couple_font_theme", theme);
    setFontTheme(theme);
  }, []);

  const [colorTheme, setColorTheme] = useState<string>(() => {
    return localStorage.getItem("couple_color_theme") || "emerald-sage";
  });
  const updateColorTheme = useCallback((theme: string) => {
    localStorage.setItem("couple_color_theme", theme);
    setColorTheme(theme);
  }, []);

  const [washiTapeTheme, setWashiTapeTheme] = useState<string>(() => {
    return localStorage.getItem("couple_washitape_theme") || "default";
  });
  const updateWashiTapeTheme = useCallback((theme: string) => {
    localStorage.setItem("couple_washitape_theme", theme);
    setWashiTapeTheme(theme);
  }, []);

  return {
    darkMode, setDarkMode, toggleDarkMode,
    anniversaryDate, setAnniversaryDate,
    birthdayA, setBirthdayA,
    birthdayB, setBirthdayB,
    cloudinaryCloudName, setCloudinaryCloudName,
    cloudinaryUploadPreset, setCloudinaryUploadPreset,
    activeSurprise, setActiveSurprise,
    customGreetings, setCustomGreetings,
    liveWeather, setLiveWeather,
    fontTheme, updateFontTheme,
    colorTheme, updateColorTheme,
    washiTapeTheme, updateWashiTapeTheme,
  };
}
