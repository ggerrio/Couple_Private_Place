/**
 * SettingsView.tsx — rebuilt from zero.
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
  RefreshCw, Trash2, UserMinus, Upload, AlertTriangle,
} from "lucide-react";
import type { ThemeType } from "../types";

type Section = "profile" | "themes" | "settings" | "admin";

// ─── Theme definitions ─────────────────────────────────────────────────────────
const THEMES: { id: ThemeType; label: string; emoji: string; preview: string[] }[] = [
  { id: "minimal-white", label: "Minimal White", emoji: "🤍", preview: ["#fafafa", "#18181b", "#71717a"] },
  { id: "korean-cafe", label: "Korean Café", emoji: "☕", preview: ["#fbf9f4", "#5c4033", "#c2a688"] },
  { id: "sakura", label: "Sakura", emoji: "🌸", preview: ["#fff5f5", "#d53f8c", "#f6ad55"] },
  { id: "studio-ghibli", label: "Studio Ghibli", emoji: "🌿", preview: ["#f0f7f4", "#2d6a4f", "#f4a261"] },
  { id: "pixel-retro", label: "Pixel Retro", emoji: "🕹️", preview: ["#18142c", "#c084fc", "#34d399"] },
  { id: "night", label: "Cosmic Night", emoji: "🌙", preview: ["#060919", "#818cf8", "#fbbf24"] },
  { id: "coffee", label: "Roasted Espresso", emoji: "🫘", preview: ["#20130b", "#e6b89c", "#faedcd"] },
  { id: "pastel", label: "Pastel Dream", emoji: "🎀", preview: ["#f7f9fc", "#9aa5ff", "#ffb7b2"] },
  { id: "valentine", label: "Valentine", emoji: "💝", preview: ["#fff0f3", "#ff4d6d", "#ff85a1"] },
  { id: "christmas", label: "Christmas", emoji: "🎄", preview: ["#0b1a13", "#ba0c2f", "#d4af37"] },
  { id: "artistic-flair", label: "Artistic Flair", emoji: "🎨", preview: ["#fbf7f0", "#bc6c25", "#dda15e"] },
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
  const isAdmin = session?.email === (import.meta.env.VITE_ADMIN_EMAIL || "");

  const sections: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "themes", label: "Themes", icon: Palette },
    { id: "settings", label: "Settings", icon: Settings },
    ...(isAdmin ? [{ id: "admin" as Section, label: "Admin", icon: Shield }] : []),
  ];

  return (
    <div className="space-y-4 py-2">
      <div className="glass-panel rounded-2xl p-1.5 flex gap-1">
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} id={`settings-tab-${id}`} onClick={() => setSection(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${section === id ? "bg-[var(--primary)] text-white shadow" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
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
    await updateProfile(currentUser, { name: name.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [name, currentUser, updateProfile]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      {/* Account overview — read-only; identity is locked to whichever slot your
          Google login claimed (see OnboardingView), it can't be switched here. */}
      <div className="glass-panel rounded-2xl p-4">
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Signed In As</p>
        <div className="flex gap-3">
          <div className="flex-1 p-3 rounded-xl flex flex-col items-center gap-2 border-2 border-[var(--primary)] bg-[var(--primary)]/10">
            <img src={activeProfile.avatar} alt={activeProfile.name} className="w-10 h-10 rounded-full object-cover border-2 border-white" referrerPolicy="no-referrer" />
            <p className="text-xs font-bold text-[var(--text-main)]">{activeProfile.name.split(" ")[0]}</p>
            <span className="text-[9px] bg-[var(--primary)] text-white px-2 py-0.5 rounded-full">You</span>
          </div>
          <div className="flex-1 p-3 rounded-xl flex flex-col items-center gap-2 border-2 border-transparent bg-white/20 opacity-70">
            <img src={partnerProfile.avatar} alt={partnerProfile.name} className="w-10 h-10 rounded-full object-cover border-2 border-white" referrerPolicy="no-referrer" />
            <p className="text-xs font-bold text-[var(--text-main)]">{partnerProfile.name.split(" ")[0]}</p>
            <span className="text-[9px] bg-black/10 text-[var(--text-muted)] px-2 py-0.5 rounded-full">Partner</span>
          </div>
        </div>
        <p className="text-[9px] text-[var(--text-muted)] mt-2.5 leading-relaxed">
          Your slot is tied to the Google account you signed in with — only you can edit your own name and photo below.
        </p>
      </div>

      {/* Edit */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img src={activeProfile.avatar} alt={activeProfile.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" referrerPolicy="no-referrer" />
            <button id="avatar-upload-btn" onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[var(--primary)] text-white rounded-full flex items-center justify-center border-2 border-white shadow hover:opacity-90">
              <Upload className="w-3 h-3" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[var(--text-main)]">{activeProfile.name}</p>
            <p className="text-[10px] text-[var(--text-muted)]">Level {activeProfile.level} • {activeProfile.xp} XP</p>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)]"
          />
        </div>

        <button id="save-profile-btn" onClick={handleSave} disabled={saving}
          className={`w-full py-2.5 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${saved ? "bg-green-500 text-white" : "bg-[var(--primary)] text-white hover:opacity-90"} disabled:opacity-60`}>
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Profile</>}
        </button>
      </div>

      {/* Logout */}
      <button id="logout-btn" onClick={logout}
        className="w-full py-2.5 bg-red-50 border border-red-100 text-red-500 font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>
    </motion.div>
  );
}

// ─── Themes ───────────────────────────────────────────────────────────────────

function ThemesSection() {
  const { theme, setTheme } = useCouple();

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
      <h3 className="text-sm font-bold text-[var(--text-main)]">Choose a Theme</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            id={`theme-btn-${t.id}`}
            onClick={() => setTheme(t.id)}
            className={`glass-panel rounded-2xl p-3 flex flex-col gap-2 border-2 transition-all hover:scale-105 active:scale-95 text-left ${theme === t.id ? "border-[var(--primary)] shadow-lg" : "border-transparent hover:border-[var(--border-color)]"}`}
          >
            {/* Color preview chips */}
            <div className="flex gap-1">
              {t.preview.map((color, i) => (
                <div key={i} className="flex-1 h-5 rounded-md" style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">{t.emoji}</span>
              <div>
                <p className="text-[10px] font-bold text-[var(--text-main)] leading-tight">{t.label}</p>
                {theme === t.id && <p className="text-[9px] text-[var(--primary)] font-semibold">Active ✓</p>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Settings (couple config) ─────────────────────────────────────────────────

function SettingsSection() {
  const { anniversaryDate, birthdayA, birthdayB, cloudinaryCloudName, cloudinaryUploadPreset, updateCoupleSettings, userA, userB } = useCouple();
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-bold text-[var(--text-main)]">Couple Configuration</h3>

        <div>
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Anniversary Date</label>
          <input type="date" value={anniv} onChange={(e) => setAnniv(e.target.value)} className="w-full text-sm px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)]" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Birthday {userA.name.split(" ")[0]} (MM-DD-YY)</label>
            <input value={bdayA} onChange={(e) => setBdayA(e.target.value)} placeholder="11-18-97" className="w-full text-sm px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)]" />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Birthday {userB.name.split(" ")[0]} (MM-DD-YY)</label>
            <input value={bdayB} onChange={(e) => setBdayB(e.target.value)} placeholder="04-05-99" className="w-full text-sm px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)]" />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Cloudinary Cloud Name</label>
          <input value={cloudName} onChange={(e) => setCloudName(e.target.value)} placeholder="Enter Cloudinary Cloud Name" className="w-full text-sm px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)]" />
        </div>

        <div>
          <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">Cloudinary Upload Preset</label>
          <input value={uploadPreset} onChange={(e) => setUploadPreset(e.target.value)} placeholder="Enter Cloudinary Upload Preset" className="w-full text-sm px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)]" />
        </div>

        <button id="save-settings-btn" onClick={handleSave} disabled={saving}
          className={`w-full py-2.5 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${saved ? "bg-green-500 text-white" : "bg-[var(--primary)] text-white hover:opacity-90"} disabled:opacity-60`}>
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
// Strictly gated to session.email === VITE_ADMIN_EMAIL

function AdminSection() {
  const { adminResetMissions, adminClearActivityLogs, adminDeleteAllMemories, adminKickSlot, adminDeleteAllSketches, adminDeleteAllNotes, adminResetTTTScore, resetAllData, userA, userB } = useCouple();
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
      desc: "Mark all missions as incomplete",
      icon: RefreshCw,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
      fn: adminResetMissions,
    },
    {
      id: "reset-ttt-score",
      label: "Reset Tic Tac Toe Scores",
      desc: "Reset current score counter to 0-0",
      icon: RefreshCw,
      color: "text-indigo-600",
      bg: "bg-indigo-50 border-indigo-100",
      fn: adminResetTTTScore,
    },
    {
      id: "clear-logs",
      label: "Clear Activity Logs",
      desc: "Delete all activity log entries from Firestore",
      icon: Trash2,
      color: "text-red-500",
      bg: "bg-red-50 border-red-100",
      fn: adminClearActivityLogs,
    },
    {
      id: "delete-memories",
      label: "Purge All Memories",
      desc: "Permanently delete every timeline memory from Firestore",
      icon: Trash2,
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
      fn: adminDeleteAllMemories,
    },
    {
      id: "delete-sketches",
      label: "Purge Sketch Gallery",
      desc: "Permanently delete all saved sketches from Firestore",
      icon: Trash2,
      color: "text-rose-600",
      bg: "bg-rose-50 border-rose-100",
      fn: adminDeleteAllSketches,
    },
    {
      id: "delete-notes",
      label: "Purge Sweet Notes",
      desc: "Permanently delete all sticky notes from Firestore",
      icon: Trash2,
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-100",
      fn: adminDeleteAllNotes,
    },
    {
      id: "kick-user-a",
      label: `Kick ${userA.name.split(" ")[0]} (Slot A)`,
      desc: "Reset slot A so another person can claim it",
      icon: UserMinus,
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-100",
      fn: () => adminKickSlot("user_a"),
    },
    {
      id: "kick-user-b",
      label: `Kick ${userB.name.split(" ")[0]} (Slot B)`,
      desc: "Reset slot B so another person can claim it",
      icon: UserMinus,
      color: "text-orange-600",
      bg: "bg-orange-50 border-orange-100",
      fn: () => adminKickSlot("user_b"),
    },
    {
      id: "full-reset",
      label: "Factory Reset (Local)",
      desc: "Reset all localStorage state to defaults. Firestore unchanged.",
      icon: AlertTriangle,
      color: "text-red-700",
      bg: "bg-red-100 border-red-300",
      fn: resetAllData,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-amber-800">Admin Panel</p>
          <p className="text-[10px] text-amber-600">Restricted access. Actions are immediate and irreversible.</p>
        </div>
      </div>

      {actions.map((action) => (
        <div key={action.id} className={`border rounded-xl p-3 ${action.bg}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <action.icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${action.color}`} />
              <div>
                <p className="text-xs font-bold text-gray-800">{action.label}</p>
                <p className="text-[10px] text-gray-500">{action.desc}</p>
              </div>
            </div>
            {confirm === action.id ? (
              <div className="flex gap-1.5 flex-shrink-0">
                <button id={`admin-confirm-${action.id}`} onClick={() => execute(action.id, action.fn as any)}
                  className="px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600">
                  Confirm
                </button>
                <button onClick={() => setConfirm(null)} className="px-3 py-1 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-lg">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : done === action.id ? (
              <span className="text-[10px] text-green-600 font-bold flex-shrink-0 flex items-center gap-1">
                <Check className="w-3 h-3" /> Done
              </span>
            ) : (
              <button id={`admin-btn-${action.id}`} onClick={() => setConfirm(action.id)}
                className={`flex-shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-lg border ${action.color} bg-white/60 border-current hover:bg-white/90 transition-all`}>
                Execute
              </button>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}