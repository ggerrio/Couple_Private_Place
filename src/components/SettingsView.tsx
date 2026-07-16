/**
 * SettingsView.tsx — Intimate Woodworker's Workshop
 *
 * Preserves 100% of Cloudinary, slots, and kick handlers,
 * but dissolves the 4-tab SaaS structure into a single scrolling workbench,
 * and nests the admin reset panel behind a secure dual-tap button at the footer.
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings, User, Shield, Save, LogOut, X, Check,
  RefreshCw, Trash2, UserMinus, Upload, AlertTriangle, Info,
  Volume2, Music, Smartphone, Play, Pause, Disc
} from "lucide-react";
import { toast } from "sonner";
import { WashiTapeDivider } from "./scrapbook";
import { EmotionalAdminPanel, DatabaseHealthPanel } from "./emotional";
import { AdminCrudConsole } from "./admin/AdminCrudConsole";
import { cn } from "../lib/utils";
import { triggerHaptic } from "../lib/haptics";

// ─── Avatar compression ────────────────────────────────────────────────────────
async function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    reader.onerror = reject;
    img.onload = () => {
      const maxDim = 256;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      if (dataUrl.length > 150 * 1024 * 1.37) {
        dataUrl = canvas.toDataURL("image/jpeg", 0.4);
      }
      resolve(dataUrl);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const SettingsView = React.memo(function SettingsView() {
  const { currentUser, userA, userB, logout, isAdmin } = useCouple();

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  // Lathe lock state for resetting data
  const [latheState, setLatheState] = useState<"locked" | "confirm" | "unlocked">("locked");

  const handleLatheClick = () => {
    if (latheState === "locked") {
      setLatheState("confirm");
    } else if (latheState === "confirm") {
      setLatheState("unlocked");
    } else {
      setLatheState("locked");
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-left" id="settings-view-wrapper">
      <div className="text-center pb-4">
        <h2 className="text-2xl font-serif font-bold text-[var(--text-main)]">🔧 Workshop</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">Tune your experience and manage your couple space.</p>
      </div>

      <WashiTapeDivider color="gold" label="Slots" />

      {/* 1. Cozy Side-by-side Portrait Plaques */}
      <div className="bg-[var(--fabric-cream)] border-2 border-[var(--wood-oak)] rounded-3xl p-6 shadow-md text-center max-w-xl mx-auto relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-radial-gradient" />
        <h3 className="text-xs font-bold text-[var(--text-main)] font-serif mb-5 flex items-center justify-center gap-1.5 uppercase tracking-wider">
          🔨 The Workshop Slots 🪚
        </h3>
        
        <div className="flex justify-center items-center gap-6 sm:gap-12">
          {/* Active User Plaque */}
          <div className="flex flex-col items-center space-y-2 relative group">
            <div className="w-20 h-20 rounded-lg overflow-hidden border-4 border-[var(--wood-walnut)] shadow-lg relative" style={{ backgroundColor: 'color-mix(in srgb, var(--wood-oak) 30%, var(--fabric-cream))' }}>
              <img loading="lazy" src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-500 border border-amber-700 shadow-inner" />
            </div>
            <div className="px-3 py-1 bg-[var(--wood-walnut)] text-[var(--fabric-cream)] text-[10px] font-bold rounded-md shadow-xs border border-[var(--wood-oak)]/50 tracking-wider">
              {activeProfile.name.split(" ")[0]} (You)
            </div>
          </div>

          {/* Heart spacer link */}
          <div className="flex flex-col items-center">
            <span className="text-2xl text-[var(--primary)] animate-pulse-slow">❤️</span>
            <div className="w-8 h-1 bg-[var(--wood-oak)]/30 rounded-full" />
          </div>

          {/* Partner User Plaque */}
          <div className="flex flex-col items-center space-y-2 relative group">
            <div className="w-20 h-20 rounded-lg overflow-hidden border-4 border-[var(--wood-oak)] shadow-lg relative" style={{ backgroundColor: 'color-mix(in srgb, var(--wood-oak) 30%, var(--fabric-cream))' }}>
              <img loading="lazy" src={partnerProfile.avatar} alt={partnerProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-500 border border-amber-700 shadow-inner" />
            </div>
            <div className="px-3 py-1 bg-[var(--wood-oak)] text-[var(--fabric-cream)] text-[10px] font-bold rounded-md shadow-xs border border-[var(--wood-walnut)]/50 tracking-wider">
              {partnerProfile.name.split(" ")[0]}
            </div>
          </div>
        </div>
      </div>

      <WashiTapeDivider color="coral" label="Profile" />

      {/* PANEL A: Profile details */}
      <div className="p-6 sm:p-8 space-y-6 rounded-3xl border border-[var(--wood-oak)]/15 my-6"
        style={{ backgroundColor: "var(--fabric-cream)" }}>
        <div className="flex items-center gap-2.5 border-b border-[var(--wood-oak)]/20 pb-3">
          <User className="w-5 h-5 text-[var(--primary)]" />
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] font-serif">Modify Portrait Details</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Carve out your display name and choose a badge.</p>
          </div>
        </div>

        <ProfileSettingsPanel />
      </div>

      <WashiTapeDivider color="rose" label="Emotions" />

      {/* PANEL B.5: Emotional Experiences Admin */}
      <div className="content-visibility-auto p-4 sm:p-6 rounded-3xl border border-[var(--wood-oak)]/15 my-6"
        style={{ backgroundColor: "var(--fabric-cream)" }}>
        <EmotionalAdminPanel />
      </div>

      <WashiTapeDivider color="moss" label="Utilities" />

      {/* PANEL C: Platform settings (Cloudinary & Screen size) */}
      <div className="content-visibility-auto p-6 sm:p-8 space-y-6 rounded-3xl border border-[var(--wood-oak)]/15 my-6"
        style={{ backgroundColor: "var(--fabric-cream)" }}>
        <div className="flex items-center gap-2.5 border-b border-[var(--wood-oak)]/20 pb-3">
          <Settings className="w-5 h-5 text-[var(--primary)]" />
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] font-serif">Workshop Utilities</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Configure storage slots and customized workspace settings.</p>
          </div>
        </div>

        <WorkspaceUtilitiesPanel />
      </div>

      <WashiTapeDivider color="lavender" label="Sign Out" />

      {/* Sign out */}
        <button 
          id="logout-btn" 
          onClick={logout}
          className="content-visibility-auto--sm w-full max-w-sm mx-auto py-3 bg-red-50/80 border border-red-100/60 hover:bg-red-50 text-red-600 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer shadow-3xs active:scale-[0.99]"
        >
          <LogOut className="w-4 h-4" /> Sign Out Profile
        </button>

        {/* PANEL D: Catastrophic Reset Gated Panel */}
        {isAdmin && (
          <div className="border-t border-[var(--wood-oak)]/20 pt-6">
            <div className="flex flex-col items-center space-y-4">
              <button
                type="button"
                onClick={handleLatheClick}
                className={`px-6 py-3 rounded-2xl text-xs font-bold font-mono tracking-wider transition-all duration-300 cursor-pointer border flex items-center gap-2 ${
                  latheState === "unlocked"
                    ? "bg-red-500 border-red-600 text-white shadow-md"
                    : latheState === "confirm"
                    ? "bg-amber-500 border-amber-600 text-white animate-pulse"
                    : "bg-[var(--fabric-cream)] border-[var(--wood-oak)]/40 text-[var(--text-main)] hover:bg-[var(--fabric-cream)]/80"
                }`}
              >
                {latheState === "unlocked" ? "🔓 Close Catastrophic Reset Drawer" : latheState === "confirm" ? "⚠️ Tap Once More to Confirm Cabinet Access" : "🔐 Access Workshop Lathe & Reset Tools"}
              </button>

              <AnimatePresence>
                {latheState === "unlocked" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="content-visibility-auto w-full overflow-hidden space-y-6"
                  >
                    <DatabaseHealthPanel />
                    <AdminSection />
                    <AdminCrudConsole />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

    </div>
  );
});

export default SettingsView;


// ─── Sub-Component Panels ───────────────────────────────────────────────────

function ProfileSettingsPanel() {
  const { currentUser, userA, userB, updateProfile } = useCouple();
  const activeProfile = currentUser === "user_a" ? userA : userB;
  const [name, setName] = useState(activeProfile.name);
  const [emoji, setEmoji] = useState(activeProfile.emoji || (activeProfile.gender === "pria" ? "💙" : "🌸"));
  const [weatherCity, setWeatherCity] = useState(activeProfile.weatherCity || "Seoul");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync profile details if changed externally or slots switch
  useEffect(() => {
    setName(activeProfile.name);
    setEmoji(activeProfile.emoji || (activeProfile.gender === "pria" ? "💙" : "🌸"));
    setWeatherCity(activeProfile.weatherCity || "Seoul");
  }, [activeProfile]);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatar(file);
      await updateProfile(currentUser, { avatar: compressed });
    } catch (err) {
      console.error("[avatar upload]", err);
      toast.error("Failed to compress avatar. Please try a smaller image.");
    }
    e.target.value = "";
  }, [currentUser, updateProfile]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    await updateProfile(currentUser, { 
      name: name.trim(), 
      emoji: emoji.trim() || undefined,
      weatherCity: weatherCity.trim() || undefined
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [name, emoji, weatherCity, currentUser, updateProfile]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      {/* Left side: upload */}
      <div className="md:col-span-4 flex flex-col items-center gap-3">
        <div className="relative group">
          <img loading="lazy" 
            src={activeProfile.avatar} 
            alt={activeProfile.name} 
            className="w-24 h-24 rounded-full object-cover border-4 border-[var(--wood-oak)] shadow-md group-hover:scale-102 transition-all duration-300" 
            referrerPolicy="no-referrer" 
          />
          <button 
            id="avatar-upload-btn" 
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--primary)] text-white rounded-full flex items-center justify-center border border-[var(--wood-oak)]/20 shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>
        <p className="text-[10px] text-[var(--text-muted)] font-mono font-bold uppercase tracking-wider">
          {activeProfile.name.split(" ")[0]}'s Space
        </p>
      </div>

      {/* Right side fields */}
      <div className="md:col-span-8 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 bg-white/50 border border-[var(--wood-oak)]/20 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">Profile Emoji Badge</label>
          <div className="flex gap-3 items-center">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              placeholder="💖"
              className="w-16 text-center text-lg px-2 py-2 bg-white/50 border border-[var(--wood-oak)]/20 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] transition-all"
            />
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
              Shown next to your name. Shared in real-time.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">Preferred Weather City</label>
          <input
            value={weatherCity}
            onChange={(e) => setWeatherCity(e.target.value)}
            placeholder="e.g. Jakarta, Seoul, Tokyo"
            className="w-full text-xs px-3.5 py-2.5 bg-white/50 border border-[var(--wood-oak)]/20 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
          />
          <p className="text-[9px] text-[var(--text-muted)] leading-relaxed">
            Specify your city for local weather and real-time ticking clock synchronization.
          </p>
        </div>



        <button 
          id="save-profile-btn" 
          onClick={handleSave} 
          disabled={saving}
          className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
            saved 
              ? "bg-green-500 text-white" 
              : "bg-[var(--primary)] text-white hover:opacity-95"
          } disabled:opacity-60`}
        >
          {saved ? (
            <><Check className="w-4 h-4" /> Saved Portrait Details!</>
          ) : saving ? (
            "Saving..."
          ) : (
            <><Save className="w-4 h-4" /> Save Portrait Details</>
          )}
        </button>
      </div>
    </div>
  );
}


function WorkspaceUtilitiesPanel() {
  const { 
    cloudinaryCloudName, cloudinaryUploadPreset, 
    updateCoupleSettings, anniversaryDate, birthdayA, birthdayB,
    fontTheme, updateFontTheme,
    colorTheme, updateColorTheme,
    washiTapeTheme, updateWashiTapeTheme,
    currentSong, setSongPlayState
  } = useCouple() as any;

  const [cloudName, setCloudName] = useState(cloudinaryCloudName);
  const [uploadPreset, setUploadPreset] = useState(cloudinaryUploadPreset);
  const [theaterSize, setTheaterSize] = useState<"compact" | "medium" | "expanded">(() => {
    return (localStorage.getItem("couple_theater_size") as any) || "medium";
  });
  const [selectedFont, setSelectedFont] = useState(fontTheme || "scrapbook");
  const [selectedColor, setSelectedColor] = useState(colorTheme || "emerald-sage");
  const [selectedWashi, setSelectedWashi] = useState(washiTapeTheme || "default");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [musicVolume, setMusicVolume] = useState<number>(() => {
    const saved = localStorage.getItem("couple_music_volume");
    return saved ? parseInt(saved, 10) : 50;
  });
  const [pianoVolume, setPianoVolume] = useState<number>(() => {
    const saved = localStorage.getItem("couple_piano_volume");
    return saved ? parseInt(saved, 10) : 80;
  });
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("couple_haptics_enabled") !== "false";
  });

  // Listen to external volume changes (e.g. from the music player or the piano)
  useEffect(() => {
    const handleMusicVol = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "number") {
        setMusicVolume(detail);
      }
    };
    const handlePianoVol = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "number") {
        setPianoVolume(detail);
      }
    };
    window.addEventListener("setMusicVolume", handleMusicVol);
    window.addEventListener("setPianoVolume", handlePianoVol);
    return () => {
      window.removeEventListener("setMusicVolume", handleMusicVol);
      window.removeEventListener("setPianoVolume", handlePianoVol);
    };
  }, []);

  const changeMusicVolume = (val: number) => {
    setMusicVolume(val);
    localStorage.setItem("couple_music_volume", String(val));
    window.dispatchEvent(new CustomEvent("setMusicVolume", { detail: val }));
  };

  const changePianoVolume = (val: number) => {
    setPianoVolume(val);
    localStorage.setItem("couple_piano_volume", String(val));
    window.dispatchEvent(new CustomEvent("setPianoVolume", { detail: val }));
  };

  const toggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    localStorage.setItem("couple_haptics_enabled", String(next));
    toast.success(next ? "Micro-haptics enabled! 📱" : "Micro-haptics muted!");
  };

  useEffect(() => {
    setCloudName(cloudinaryCloudName);
    setUploadPreset(cloudinaryUploadPreset);
  }, [cloudinaryCloudName, cloudinaryUploadPreset]);

  const handleFontChange = (theme: string) => {
    setSelectedFont(theme);
    updateFontTheme(theme);
  };

  const handleColorChange = (theme: string) => {
    setSelectedColor(theme);
    updateColorTheme(theme);
    toast.success(`Theme palette changed to ${theme.replace("-", " ")}! ✨`);
  };

  const handleWashiChange = (theme: string) => {
    setSelectedWashi(theme);
    updateWashiTapeTheme(theme);
    toast.success(`Washi Tape pattern changed to ${theme}! 🎀`);
  };

  const handleSave = async () => {
    setSaving(true);
    // Persist anniversary and birthdays from current context unmodified
    await updateCoupleSettings(anniversaryDate, birthdayA, birthdayB, cloudName, uploadPreset);
    localStorage.setItem("couple_theater_size", theaterSize);
    window.dispatchEvent(new CustomEvent("theaterSizeChanged", { detail: theaterSize }));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">Cloudinary Cloud Name</label>
          <input 
            value={cloudName} 
            onChange={(e) => setCloudName(e.target.value)} 
            placeholder="Enter Cloudinary Cloud Name" 
            className="w-full text-xs px-3.5 py-2.5 bg-white/50 border border-[var(--wood-oak)]/20 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">Cloudinary Upload Preset</label>
          <input 
            value={uploadPreset} 
            onChange={(e) => setUploadPreset(e.target.value)} 
            placeholder="Enter Cloudinary Upload Preset" 
            className="w-full text-xs px-3.5 py-2.5 bg-white/50 border border-[var(--wood-oak)]/20 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all" 
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">Watch Together Screen Size</label>
        <select
          value={theaterSize}
          onChange={(e) => setTheaterSize(e.target.value as any)}
          className="w-full text-xs px-3.5 py-2.5 bg-white/50 border border-[var(--wood-oak)]/20 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
        >
          <option value="compact">Compact (Half Screen)</option>
          <option value="medium">Medium (Standard Wide)</option>
          <option value="expanded">Expanded (Cinematic Full Wide)</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">Workspace Font Theme (Aesthetic)</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleFontChange("scrapbook")}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedFont === "scrapbook"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] font-serif">Scrapbook & Cozy</span>
            <span className="text-[9px] text-[var(--text-muted)] mt-1 font-sans italic">Vintage & Handwrite pairing</span>
          </button>

          <button
            type="button"
            onClick={() => handleFontChange("modern")}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedFont === "modern"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)]" style={{ fontFamily: 'sans-serif' }}>Modern & Minimalist</span>
            <span className="text-[9px] text-[var(--text-muted)] mt-1" style={{ fontFamily: 'sans-serif' }}>Clean, sharp, geometric lines</span>
          </button>

          <button
            type="button"
            onClick={() => handleFontChange("professional")}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedFont === "professional"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)]" style={{ fontFamily: '"Inter", sans-serif' }}>Normal / Professional</span>
            <span className="text-[9px] text-[var(--text-muted)] mt-1" style={{ fontFamily: '"Inter", sans-serif' }}>Inter Sans, formal legibility</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">Workspace Color Palette (Theme)</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleColorChange("emerald-sage")}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedColor === "emerald-sage"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
              <span>🌿</span> Emerald & Sage
            </span>
            <span className="text-[9px] text-[var(--text-muted)] mt-1 font-sans">
              Cozy Botanical Garden Sanctuary
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleColorChange("cosmic-charcoal")}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedColor === "cosmic-charcoal"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
              <span>✨</span> Cosmic Charcoal
            </span>
            <span className="text-[9px] text-[var(--text-muted)] mt-1 font-sans">
              Starry Night with Indigo Accents
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleColorChange("cozy-wood")}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedColor === "cozy-wood"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
              <span>🪵</span> Classic Cozy Wood
            </span>
            <span className="text-[9px] text-[var(--text-muted)] mt-1 font-sans">
              Warm Terracotta & Vintage Cream
            </span>
          </button>
        </div>
      </div>

      {/* ─── 🎀 WASHI TAPE MOTIF CUSTOMIZATION ─── */}
      <div className="space-y-2">
        <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">🎀 Washi Tape Motif (Dividers Style)</label>
        <p className="text-[9px] text-[var(--text-muted)] -mt-1 mb-2 font-sans">
          Select your favorite pattern to style all scrapbook separators and torn-tape labels across the platform.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleWashiChange("default")}
            className={`flex flex-col items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedWashi === "default"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
              <span>🎨</span> Original
            </span>
            <span className="text-[8px] text-[var(--text-muted)] mt-0.5 font-sans">
              Dynamic/Random per label
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleWashiChange("stripes")}
            className={`flex flex-col items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedWashi === "stripes"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
              <span>斜</span> Diagonal Stripes
            </span>
            <span className="text-[8px] text-[var(--text-muted)] mt-0.5 font-sans">
              Elegant slanted lines
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleWashiChange("dots")}
            className={`flex flex-col items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedWashi === "dots"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
              <span>●</span> Polka Dots
            </span>
            <span className="text-[8px] text-[var(--text-muted)] mt-0.5 font-sans">
              Retro dotted craft style
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleWashiChange("grid")}
            className={`flex flex-col items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedWashi === "grid"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
              <span>田</span> Cozy Grid
            </span>
            <span className="text-[8px] text-[var(--text-muted)] mt-0.5 font-sans">
              Fine layout grid mesh
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleWashiChange("plaid")}
            className={`flex flex-col items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedWashi === "plaid"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
              <span>🏁</span> Tartan Plaid
            </span>
            <span className="text-[8px] text-[var(--text-muted)] mt-0.5 font-sans">
              Warm checkered flannel
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleWashiChange("stars")}
            className={`flex flex-col items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedWashi === "stars"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
              <span>✨</span> Starry Sparkles
            </span>
            <span className="text-[8px] text-[var(--text-muted)] mt-0.5 font-sans">
              Magic constellation links
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleWashiChange("botanical")}
            className={`flex flex-col items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedWashi === "botanical"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
              <span>🍃</span> Botanical Leaves
            </span>
            <span className="text-[8px] text-[var(--text-muted)] mt-0.5 font-sans">
              Hand-painted plant motifs
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleWashiChange("lace")}
            className={`flex flex-col items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all active:scale-[0.98] ${
              selectedWashi === "lace"
                ? "border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/30"
                : "border-[var(--wood-oak)]/20 hover:bg-white/40"
            }`}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1">
              <span>🧵</span> Embroidered Lace
            </span>
            <span className="text-[8px] text-[var(--text-muted)] mt-0.5 font-sans">
              Lovely vintage scalloped lace
            </span>
          </button>
        </div>
      </div>

      {/* ─── 📻 HI-FI AUDIO CONTROL CENTER ─── */}
      <div className="p-5.5 rounded-3xl border border-[var(--wood-oak)]/20 bg-[var(--fabric-cream)] shadow-inner space-y-4">
        <h4 className="text-xs font-serif font-bold text-[var(--text-main)] flex items-center gap-2">
          <span>📻</span> Hi-Fi Audio Control Center
        </h4>
        <p className="text-[10px] text-[var(--text-muted)] -mt-2">
          Centralize your music playback, instruments, and physical feedback levels in one retro workshop console.
        </p>

        {/* Dynamic Now Playing Deck */}
        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-black/35 border border-[var(--wood-oak)]/10">
          {currentSong && currentSong.title ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Spinning Mini Vinyl or Artwork */}
              <div className="relative w-12 h-12 flex-shrink-0">
                {currentSong.artwork ? (
                  <img 
                    src={currentSong.artwork} 
                    alt={currentSong.title} 
                    className={cn(
                      "w-full h-full object-cover rounded-full border-2 border-[var(--wood-walnut)] shadow-md",
                      currentSong.isPlaying && "animate-spin-slow"
                    )} 
                    loading="lazy" 
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-stone-800 flex items-center justify-center border-2 border-[var(--wood-walnut)]">
                    <Disc className={cn("w-6 h-6 text-rose-500", currentSong.isPlaying && "animate-spin-slow")} />
                  </div>
                )}
                {/* Vinyl spindle pin */}
                <div className="absolute inset-0 m-auto w-2.5 h-2.5 rounded-full bg-yellow-500 border border-amber-800 shadow-inner" />
              </div>

              {/* Track Metadata */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-widest block mb-0.5 animate-pulse">Now Playing</span>
                <p className="text-xs font-serif font-bold text-[var(--text-main)] truncate">
                  {currentSong.title}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">
                  {currentSong.artist || "Shared Listener"}
                </p>
              </div>

              {/* Quick Deck Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("medium");
                    setSongPlayState(!currentSong.isPlaying);
                  }}
                  className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 transition-all cursor-pointer shadow-xs"
                  title={currentSong.isPlaying ? "Pause Track" : "Play Track"}
                >
                  {currentSong.isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-2 text-[11px] text-[var(--text-muted)] italic justify-center sm:justify-start">
              <span>🌲</span>
              <span>The Listening Treehouse is quiet. Spin a Daily Vibe Vinyl to play a song together.</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Background Music Volume */}
          <div className="space-y-1.5 p-3 rounded-xl bg-white/40 border border-[var(--wood-oak)]/5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-[var(--primary)]" /> Background Music Volume
              </span>
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">{musicVolume}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="100"
              value={musicVolume}
              onChange={(e) => changeMusicVolume(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
            />
          </div>

          {/* Piano Duo Volume */}
          <div className="space-y-1.5 p-3 rounded-xl bg-white/40 border border-[var(--wood-oak)]/5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[var(--primary)]" /> Piano Duo Synth Volume
              </span>
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)]">{pianoVolume}%</span>
            </div>
            <input 
              type="range"
              min="0"
              max="100"
              value={pianoVolume}
              onChange={(e) => changePianoVolume(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
            />
          </div>
        </div>

        {/* Micro-Haptics Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-[var(--wood-oak)]/5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-slate-500" />
            <div>
              <span className="text-[10px] font-bold text-[var(--text-main)] block">Interactive Haptic Clicks</span>
              <span className="text-[9px] text-[var(--text-muted)] block">Gentle mechanical feedback on buttons and keypresses</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={toggleHaptics} 
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all outline-none border-none cursor-pointer ${
              hapticsEnabled ? "bg-emerald-500 justify-end" : "bg-gray-300 justify-start"
            }`}
          >
            <span className="w-4 h-4 bg-white rounded-full shadow-md animate-none" />
          </button>
        </div>
      </div>



      <button 
        id="save-settings-btn" 
        onClick={handleSave} 
        disabled={saving}
        className={`w-full py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
          saved 
            ? "bg-green-500 text-white" 
            : "bg-[var(--primary)] text-white hover:opacity-95"
        } disabled:opacity-60`}
      >
        {saved ? (
          <><Check className="w-4 h-4" /> Settings Saved!</>
        ) : saving ? (
          "Saving..."
        ) : (
          <><Save className="w-4 h-4" /> Save Couple Settings</>
        )}
      </button>
    </div>
  );
}


function AdminSection() {
  const { 
    adminResetMissions, adminClearActivityLogs, adminDeleteAllMemories, 
    adminKickSlot, adminDeleteAllSketches, adminDeleteAllNotes, 
    adminResetTTTScore, resetAllData, userA, userB 
  } = useCouple();

  const [confirm, setConfirm] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const execute = async (key: string, fn: () => Promise<void> | void) => {
    setConfirm(null);
    await fn();
    setDone(key);
    setTimeout(() => setDone(null), 3000);
  };

  const actions = [
    {
      id: "reset-missions",
      label: "Reset All Missions",
      desc: "Mark all adventure missions as incomplete",
      icon: RefreshCw,
      color: "text-amber-600",
      bg: "bg-amber-50/60 border-amber-100",
      fn: adminResetMissions,
    },
    {
      id: "reset-ttt-score",
      label: "Reset Tic Tac Toe Scores",
      desc: "Reset arcade scoreboard count back to 0-0",
      icon: RefreshCw,
      color: "text-indigo-600",
      bg: "bg-indigo-50/60 border-indigo-100",
      fn: adminResetTTTScore,
    },
    {
      id: "reset-daily-vinyl",
      label: "Reset Daily Vibe Vinyl",
      desc: "Clear today's vibe and reset the vinyl record picker",
      icon: RefreshCw,
      color: "text-pink-600",
      bg: "bg-pink-50/60 border-pink-100",
      fn: () => {
        localStorage.removeItem("daily_vibe_today");
        localStorage.removeItem("daily_vibe_history");
        window.dispatchEvent(new CustomEvent("dailyVinylReset"));
        toast.success("Daily Vibe Vinyl has been reset!");
      },
    },
    {
      id: "reset-terrarium",
      label: "Reset Interactive Terrarium",
      desc: "Reset water level, plant stage, and clear all garden whispers",
      icon: RefreshCw,
      color: "text-emerald-600",
      bg: "bg-emerald-50/60 border-emerald-100",
      fn: () => {
        localStorage.removeItem("terrarium_water");
        localStorage.removeItem("terrarium_plant_stage");
        localStorage.removeItem("terrarium_last_visit");
        localStorage.removeItem("garden_diary");
        window.dispatchEvent(new CustomEvent("terrariumReset"));
        toast.success("Interactive Terrarium has been reset!");
      },
    },
    {
      id: "clear-logs",
      label: "Clear Activity Logs",
      desc: "Delete all logs from Firestore permanently",
      icon: Trash2,
      color: "text-red-500",
      bg: "bg-red-50/60 border-red-100",
      fn: adminClearActivityLogs,
    },
    {
      id: "delete-memories",
      label: "Purge All Memories",
      desc: "Permanently delete every memory on the timeline",
      icon: Trash2,
      color: "text-red-600",
      bg: "bg-red-50/60 border-red-200",
      fn: adminDeleteAllMemories,
    },
    {
      id: "delete-sketches",
      label: "Purge Sketch Gallery",
      desc: "Delete all saved canvas sketches",
      icon: Trash2,
      color: "text-rose-600",
      bg: "bg-rose-50/60 border-rose-100",
      fn: adminDeleteAllSketches,
    },
    {
      id: "delete-notes",
      label: "Purge Sticky Notes",
      desc: "Permanently delete all sticky notes on the wall",
      icon: Trash2,
      color: "text-purple-600",
      bg: "bg-purple-50/60 border-purple-100",
      fn: adminDeleteAllNotes,
    },
    {
      id: "kick-user-a",
      label: `Kick ${userA.name.split(" ")[0]} (Slot A)`,
      desc: "Reset slot A profile so another partner can join",
      icon: UserMinus,
      color: "text-orange-600",
      bg: "bg-orange-50/60 border-orange-100",
      fn: () => adminKickSlot("user_a"),
    },
    {
      id: "kick-user-b",
      label: `Kick ${userB.name.split(" ")[0]} (Slot B)`,
      desc: "Reset slot B profile so another partner can join",
      icon: UserMinus,
      color: "text-orange-600",
      bg: "bg-orange-50/60 border-orange-100",
      fn: () => adminKickSlot("user_b"),
    },
    {
      id: "full-reset",
      label: "Factory Reset (Local)",
      desc: "Wipe all client state back to defaults. DB unaffected.",
      icon: AlertTriangle,
      color: "text-red-700",
      bg: "bg-red-100/60 border-red-300",
      fn: resetAllData,
    },
  ];

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-start gap-2.5 p-4 bg-amber-50/80 border border-amber-200/50 rounded-2xl">
        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-amber-800 leading-none mb-1">Administrative Control Center</p>
          <p className="text-[10px] text-amber-600 leading-normal">
            Gated restricted actions. Executing these triggers real-time state resets instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action) => (
          <div key={action.id} className={`border border-[var(--wood-oak)]/20 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-[var(--fabric-cream)]/20 ${action.bg}`}>
            <div className="flex items-start gap-2.5">
              <action.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${action.color}`} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-main)] leading-tight mb-1">{action.label}</p>
                <p className="text-[10px] text-[var(--text-muted)] leading-snug">{action.desc}</p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              {confirm === action.id ? (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button 
                    id={`admin-confirm-${action.id}`} 
                    onClick={() => execute(action.id, action.fn as any)}
                    className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                  >
                    Confirm Action
                  </button>
                  <button 
                    onClick={() => setConfirm(null)} 
                    className="px-2.5 py-1.5 bg-[var(--wood-oak)]/10 text-[var(--text-muted)] text-[10px] font-bold rounded-lg cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : done === action.id ? (
                <span className="text-[10px] text-green-600 font-extrabold flex items-center gap-1 bg-[var(--fabric-cream)]/85 px-2.5 py-1 rounded-lg border border-green-200/50 shadow-3xs">
                  <Check className="w-3.5 h-3.5" /> Reset Completed
                </span>
              ) : (
                <button 
                  id={`admin-btn-${action.id}`} 
                  onClick={() => setConfirm(action.id)}
                  className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-lg border ${action.color} bg-[var(--fabric-cream)]/70 border-current hover:bg-[var(--fabric-cream)] transition-all cursor-pointer shadow-3xs duration-200 hover:-translate-y-0.5 active:scale-95`}
                >
                  Execute Reset
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
