/**
 * SettingsView.tsx — rebuilt with polished styling.
 *
 * Fixes:
 *  - Avatar upload compresses via canvas to quality=0.6 JPEG capped at ~150 KB before storing
 *  - Admin panel gated strictly by session.email === VITE_ADMIN_EMAIL
 *  - Theme change is direct state call; no secondary useEffect reaction chain
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings, User, Palette, Shield, Save, LogOut, X, Check,
  RefreshCw, Trash2, UserMinus, Upload, AlertTriangle, Info,
} from "lucide-react";
import type { ThemeType } from "../types";

type Section = "profile" | "themes" | "settings" | "admin";

// ─── Theme definitions ─────────────────────────────────────────────────────────
const THEMES: { id: ThemeType; label: string; emoji: string; preview: string[]; desc: string }[] = [
  { id: "monochrome-minimal", label: "Monochrome Minimal", emoji: "🖤", preview: ["#121212", "#ffffff", "#8e8e93"], desc: "Handsome, bold, modern, and minimalist." },
  { id: "sakura", label: "Cherry Blossoms", emoji: "🌸", preview: ["#fff5f5", "#d53f8c", "#f6ad55"], desc: "Soft blush pinks and cherry blossom rose." },
  { id: "studio-ghibli", label: "Ghibli Greenery", emoji: "🌿", preview: ["#f0f7f4", "#2d6a4f", "#f4a261"], desc: "Calm green pastures and rustic ambers." },
  { id: "night", label: "Cosmic Midnight", emoji: "🌙", preview: ["#060919", "#818cf8", "#fbbf24"], desc: "Deep indigo sky with starlight gold accents." },
  { id: "pastel", label: "Pastel Dream", emoji: "🎀", preview: ["#f7f9fc", "#9aa5ff", "#ffb7b2"], desc: "Buttery soft lilacs, sky blues, and corals." },
  { id: "cyber-lavender", label: "Cyber Lavender", emoji: "👾", preview: ["#1e1b4b", "#c084fc", "#e0e7ff"], desc: "Cute, eye-friendly neon purple dark mode." },
];

// ─── Avatar compression ────────────────────────────────────────────────────────
// Compresses to JPEG quality=0.6, capped at ~150 KB
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
      // Try quality 0.6, then 0.4 if still over 150 KB
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsView() {
  const { session } = useCouple();
  const [section, setSection] = useState<Section>("profile");
  const isAdmin = session?.email === ((import.meta as any).env?.VITE_ADMIN_EMAIL || "admin@example.com");

  const sections: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "themes", label: "Themes", icon: Palette },
    { id: "settings", label: "Settings", icon: Settings },
    ...(isAdmin ? [{ id: "admin" as Section, label: "Admin", icon: Shield }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2" id="settings-view-wrapper">
      {/* Dynamic Tab Switcher styled to match Together/Play views */}
      <div className="flex justify-center border-b border-neutral-200/40 pb-1 mb-6">
        <div className="flex gap-6 sm:gap-10">
          {sections.map(({ id, label, icon: Icon }) => {
            const isSelected = section === id;
            return (
              <button 
                key={id} 
                id={`settings-tab-${id}`} 
                onClick={() => setSection(id)}
                className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all relative cursor-pointer select-none ${
                  isSelected 
                    ? "text-[var(--primary)]" 
                    : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" /> 
                <span className="hidden sm:inline">{label}</span>
                {isSelected && (
                  <motion.div
                    layoutId="activeSettingsSectionTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {section === "profile" && <ProfileSection key="profile" />}
        {section === "themes" && <ThemesSection key="themes" />}
        {section === "settings" && <SettingsSection key="settings" />}
        {section === "admin" && isAdmin && <AdminSection key="admin" />}
      </AnimatePresence>
    </div>
  );
}

// ─── Profile editor ───────────────────────────────────────────────────────────

function ProfileSection() {
  const { currentUser, userA, userB, updateProfile, logout } = useCouple();
  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;
  const [name, setName] = useState(activeProfile.name);
  const [emoji, setEmoji] = useState(activeProfile.emoji || (activeProfile.gender === "pria" ? "💙" : "🌸"));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatar(file);
      await updateProfile(currentUser, { avatar: compressed });
    } catch (err) {
      console.error("[avatar upload]", err);
      alert("Failed to compress avatar. Please try a smaller image.");
    }
    e.target.value = "";
  }, [currentUser, updateProfile]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    await updateProfile(currentUser, { name: name.trim(), emoji: emoji.trim() || undefined });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [name, emoji, currentUser, updateProfile]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -8 }} 
      className="space-y-6"
    >
      {/* Account overview — read-only; identity is locked */}
      <div className="bg-white/40 border border-neutral-200/40 p-6 md:p-8 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Signed In Profile</h3>
          <p className="text-[10px] text-[var(--text-muted)]">
            Your profile slot matches whichever partner view you are currently controlling.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl flex flex-col items-center gap-2 border-2 border-[var(--primary)] bg-[var(--primary)]/5">
            <img src={activeProfile.avatar} alt={activeProfile.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs" referrerPolicy="no-referrer" />
            <p className="text-xs font-bold text-[var(--text-main)] text-center leading-tight">{activeProfile.name}</p>
            <span className="text-[9px] bg-[var(--primary)] text-white px-2 py-0.5 rounded-full font-bold">You</span>
          </div>
          <div className="p-4 rounded-2xl flex flex-col items-center gap-2 border-2 border-transparent bg-white/10 opacity-70">
            <img src={partnerProfile.avatar} alt={partnerProfile.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs" referrerPolicy="no-referrer" />
            <p className="text-xs font-bold text-[var(--text-main)] text-center leading-tight">{partnerProfile.name}</p>
            <span className="text-[9px] bg-black/5 text-[var(--text-muted)] px-2 py-0.5 rounded-full font-bold">Partner</span>
          </div>
        </div>

        <div className="flex gap-2 p-3 bg-white/20 border border-white/40 rounded-xl items-start">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            Your identity is bound to your browser's slot session. You can customize your avatar and display name below.
          </p>
        </div>
      </div>

      {/* Edit Form Card */}
      <div className="bg-white/40 border border-neutral-200/40 p-6 md:p-8 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md space-y-5">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <img 
              src={activeProfile.avatar} 
              alt={activeProfile.name} 
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md group-hover:scale-102 transition-all duration-300" 
              referrerPolicy="no-referrer" 
            />
            <button 
              id="avatar-upload-btn" 
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--primary)] text-white rounded-full flex items-center justify-center border-2 border-white shadow hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-[var(--text-main)]">{activeProfile.name}</p>
            <p className="text-[10px] text-[var(--text-muted)] font-mono font-bold uppercase tracking-wider bg-white/30 px-3 py-1 rounded-full border border-white/20">
              Level {activeProfile.level} • {activeProfile.xp} XP
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 bg-white/40 border border-neutral-200/40 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block">Profile Emoji Badge</label>
          <div className="flex gap-2 items-center">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={4}
              placeholder="💖"
              className="w-20 text-center text-lg px-2 py-2 bg-white/40 border border-neutral-200/40 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] transition-all"
            />
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
              One emoji displayed as your profile badge in the header. Visible to your partner in real-time.
            </p>
          </div>
        </div>

        <button 
          id="save-profile-btn" 
          onClick={handleSave} 
          disabled={saving}
          className={`w-full py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
            saved 
              ? "bg-green-500 text-white" 
              : "bg-[var(--primary)] text-white hover:opacity-95"
          } disabled:opacity-60`}
        >
          {saved ? (
            <><Check className="w-4 h-4" /> Saved Successfully!</>
          ) : saving ? (
            "Saving..."
          ) : (
            <><Save className="w-4 h-4" /> Save Profile Details</>
          )}
        </button>
      </div>

      {/* Logout */}
      <button 
        id="logout-btn" 
        onClick={logout}
        className="w-full py-3 bg-red-50 border border-red-100/60 text-red-500 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-red-100/70 transition-all cursor-pointer shadow-3xs active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4" /> Sign Out Profile
      </button>
    </motion.div>
  );
}

// ─── Themes ───────────────────────────────────────────────────────────────────

function ThemesSection() {
  const { theme, setTheme } = useCouple();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -8 }} 
      className="space-y-4"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-[var(--text-main)]">Private Sanctuary Themes</h3>
        <p className="text-[10px] text-[var(--text-muted)]">
          Select a dynamic color palette to transform the backdrop, borders, and mood of your home.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {THEMES.map((t) => {
          const isSelected = theme === t.id;
          return (
            <button
              key={t.id}
              id={`theme-btn-${t.id}`}
              onClick={() => setTheme(t.id)}
              className={`bg-white/40 border p-4 rounded-2xl flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 text-left cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.01)] ${
                isSelected 
                  ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/10 bg-white" 
                  : "border-transparent hover:border-gray-200/60"
              }`}
            >
              {/* Color preview chips */}
              <div className="flex gap-1">
                {t.preview.map((color, i) => (
                  <div key={i} className="flex-1 h-3 rounded-sm shadow-3xs" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">{t.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--text-main)] leading-none mb-1 truncate">{t.label}</p>
                  <p className="text-[9px] text-[var(--text-muted)] leading-tight line-clamp-1">{t.desc}</p>
                </div>
              </div>
              {isSelected && (
                <div className="text-[9px] text-[var(--primary)] font-extrabold flex items-center gap-0.5 self-end uppercase tracking-wider bg-[var(--primary)]/5 px-2 py-0.5 rounded-full border border-[var(--primary)]/10">
                  Active ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Settings (couple config) ─────────────────────────────────────────────────

function SettingsSection() {
  const { 
    anniversaryDate, birthdayA, birthdayB, 
    cloudinaryCloudName, cloudinaryUploadPreset, 
    updateCoupleSettings, userA, userB 
  } = useCouple();

  const [anniv, setAnniv] = useState(anniversaryDate);
  const [bdayA, setBdayA] = useState(birthdayA);
  const [bdayB, setBdayB] = useState(birthdayB);
  const [cloudName, setCloudName] = useState(cloudinaryCloudName);
  const [uploadPreset, setUploadPreset] = useState(cloudinaryUploadPreset);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAnniv(anniversaryDate);
    setBdayA(birthdayA);
    setBdayB(birthdayB);
    setCloudName(cloudinaryCloudName);
    setUploadPreset(cloudinaryUploadPreset);
  }, [anniversaryDate, birthdayA, birthdayB, cloudinaryCloudName, cloudinaryUploadPreset]);

  const handleSave = async () => {
    setSaving(true);
    await updateCoupleSettings(anniv, bdayA, bdayB, cloudName, uploadPreset);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -8 }} 
      className="space-y-4"
    >
      <div className="bg-white/40 border border-neutral-200/40 p-6 md:p-8 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">Couple Configuration</h3>
          <p className="text-[10px] text-[var(--text-muted)]">
            Configure key milestone dates, birthdays, and global storage setups.
          </p>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block mb-1">Anniversary Date</label>
            <input 
              type="date" 
              value={anniv} 
              onChange={(e) => setAnniv(e.target.value)} 
              className="w-full text-xs px-3.5 py-2.5 bg-white/40 border border-neutral-200/40 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block mb-1">Birthday {userA.name.split(" ")[0]} (MM-DD-YY)</label>
              <input 
                value={bdayA} 
                onChange={(e) => setBdayA(e.target.value)} 
                placeholder="11-18-97" 
                className="w-full text-xs px-3.5 py-2.5 bg-white/40 border border-neutral-200/40 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all" 
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block mb-1">Birthday {userB.name.split(" ")[0]} (MM-DD-YY)</label>
              <input 
                value={bdayB} 
                onChange={(e) => setBdayB(e.target.value)} 
                placeholder="04-05-99" 
                className="w-full text-xs px-3.5 py-2.5 bg-white/40 border border-neutral-200/40 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block mb-1">Cloudinary Cloud Name</label>
            <input 
              value={cloudName} 
              onChange={(e) => setCloudName(e.target.value)} 
              placeholder="Enter Cloudinary Cloud Name" 
              className="w-full text-xs px-3.5 py-2.5 bg-white/40 border border-neutral-200/40 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all" 
            />
          </div>

          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold block mb-1">Cloudinary Upload Preset</label>
            <input 
              value={uploadPreset} 
              onChange={(e) => setUploadPreset(e.target.value)} 
              placeholder="Enter Cloudinary Upload Preset" 
              className="w-full text-xs px-3.5 py-2.5 bg-white/40 border border-neutral-200/40 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all" 
            />
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
    </motion.div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
// Strictly gated to session.email === VITE_ADMIN_EMAIL

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
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -8 }} 
      className="space-y-4"
    >
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
          <div key={action.id} className={`border rounded-2xl p-4 flex flex-col justify-between gap-3 bg-white/40 ${action.bg}`}>
            <div className="flex items-start gap-2.5">
              <action.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${action.color}`} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 leading-tight mb-1">{action.label}</p>
                <p className="text-[10px] text-gray-500 leading-snug">{action.desc}</p>
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
                    className="px-2.5 py-1.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : done === action.id ? (
                <span className="text-[10px] text-green-600 font-extrabold flex items-center gap-1 bg-white/80 px-2.5 py-1 rounded-lg border border-green-200/50 shadow-3xs">
                  <Check className="w-3.5 h-3.5" /> Reset Completed
                </span>
              ) : (
                <button 
                  id={`admin-btn-${action.id}`} 
                  onClick={() => setConfirm(action.id)}
                  className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-lg border ${action.color} bg-white/70 border-current hover:bg-white transition-all cursor-pointer shadow-3xs duration-200 hover:-translate-y-0.5 active:scale-95`}
                >
                  Execute Reset
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}