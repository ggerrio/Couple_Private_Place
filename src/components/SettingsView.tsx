/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useCouple } from "../context/CoupleContext";
import { uploadBase64Image } from "../firebaseClient";
import {
  Palette,
  ShieldAlert,
  UserCircle,
  Camera,
  LogOut,
  Heart,
  Shield,
  Trash2,
  RefreshCw,
  Activity,
  Database,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { ThemeType } from "../types";

export default function SettingsView() {
  const {
    session,
    logout,
    currentUser,
    userA,
    userB,
    memories,
    anniversaryDate,
    birthdayA,
    birthdayB,
    cloudinaryCloudName,
    cloudinaryUploadPreset,
    updateCoupleSettings,
    addMemory,
    updateMemory,
    deleteMemory,
    updateProfile,
    theme,
    setTheme,
    resetAllData,
    adminResetMissions,
    adminClearActivityLogs,
    adminDeleteAllMemories,
  } = useCouple();

  const ADMIN_EMAIL = "pratamagerrio@gmail.com";
  const isAdmin = session?.email === ADMIN_EMAIL;

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminActionResult, setAdminActionResult] = useState<string | null>(null);
  const [adminActionLoading, setAdminActionLoading] = useState<string | null>(null);

  // Admin Anniversary & Birthday States
  const [newAnniversary, setNewAnniversary] = useState(anniversaryDate);
  const [newBirthdayA, setNewBirthdayA] = useState(birthdayA);
  const [newBirthdayB, setNewBirthdayB] = useState(birthdayB);
  const [newCloudName, setNewCloudName] = useState(cloudinaryCloudName);
  const [newUploadPreset, setNewUploadPreset] = useState(cloudinaryUploadPreset);

  useEffect(() => {
    setNewAnniversary(anniversaryDate);
    setNewBirthdayA(birthdayA);
    setNewBirthdayB(birthdayB);
    setNewCloudName(cloudinaryCloudName);
    setNewUploadPreset(cloudinaryUploadPreset);
  }, [anniversaryDate, birthdayA, birthdayB, cloudinaryCloudName, cloudinaryUploadPreset]);

  const [memLoading, setMemLoading] = useState(false);

  const runAdminAction = async (label: string, fn: () => Promise<void>) => {
    if (!confirm(`Admin: Are you sure you want to ${label}?`)) return;
    setAdminActionLoading(label);
    setAdminActionResult(null);
    try {
      await fn();
      setAdminActionResult(`✅ ${label} completed.`);
    } catch (e: any) {
      setAdminActionResult(`❌ Failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setAdminActionLoading(null);
    }
  };

  const handleSaveCoupleSettings = async () => {
    if (!newAnniversary || !newBirthdayA || !newBirthdayB) {
      alert("All dates must be filled.");
      return;
    }
    setMemLoading(true);
    try {
      await updateCoupleSettings(newAnniversary, newBirthdayA, newBirthdayB, newCloudName, newUploadPreset);
      alert("Days of Love, Birthdays, and Media Storage configurations updated successfully! 🗓️🎉");
    } catch (e: any) {
      alert(`Failed to update settings: ${e.message}`);
    } finally {
      setMemLoading(false);
    }
  };

  const myProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  const [editName, setEditName] = useState(myProfile.name);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(myProfile.name);
  }, [myProfile.name]);

  // Client-side image resizing/compression helper to bypass Firestore document size limit (1 MB)
  const compressImage = (base64Str: string, maxWidth = 180, maxHeight = 180): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const themeList: { id: ThemeType; name: string; previewColors: string[]; desc: string }[] = [
    { id: "minimal-white", name: "Minimal White", previewColors: ["#fafafa", "#18181b", "#71717a"], desc: "Modern Swiss style, crisp and elegant." },
    { id: "korean-cafe", name: "Korean Cafe ☕", previewColors: ["#fbf9f4", "#5c4033", "#c2a688"], desc: "Beige espresso undertone, warm and cozy." },
    { id: "sakura", name: "Cherry Blossoms 🌸", previewColors: ["#fff5f5", "#d53f8c", "#f6ad55"], desc: "Soft blush pinks and cherry blossom rose." },
    { id: "studio-ghibli", name: "Ghibli Greenery 🌳", previewColors: ["#f0f7f4", "#2d6a4f", "#f4a261"], desc: "Calm green pastures and rustic ambers." },
    { id: "pixel-retro", name: "Retro Pixel 👾", previewColors: ["#0f172a", "#a78bfa", "#10b981"], desc: "Neon arcade cyber violet vibes." },
    { id: "night", name: "Cosmic Midnight 🌙", previewColors: ["#030712", "#6366f1", "#fbbf24"], desc: "Deep indigo sky with starlight gold accents." },
    { id: "coffee", name: "Roasted Espresso 🤎", previewColors: ["#2c1a11", "#d4a373", "#fcf6bd"], desc: "Chocolaty and warm hand-drip morning." },
    { id: "pastel", name: "Lilac Pastel 🎨", previewColors: ["#f7f9fc", "#9aa5ff", "#ffb7b2"], desc: "Buttery soft lilacs, sky blues, and corals." },
    { id: "valentine", name: "Hot Valentine 💖", previewColors: ["#fff0f3", "#ff4d6d", "#ff85a1"], desc: "Charming rich roses and sweet pink hearts." },
    { id: "christmas", name: "Warm Yule Log 🎄", previewColors: ["#0b1a13", "#ba0c2f", "#d4af37"], desc: "Pine greens, yule reds, and gold sparkles." },
    { id: "artistic-flair", name: "Artistic Flair 🖌️", previewColors: ["#fbf7f0", "#bc6c25", "#283618"], desc: "Earthy terracotta, warm sands, and forest ink." },
  ];

  const handleSaveProfile = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      alert("Name cannot be empty.");
      return;
    }
    setSaving(true);
    await updateProfile(currentUser, { name: trimmed });
    setSaving(false);
    alert("Profile updated!");
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5 MB.");
      return;
    }

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      const rawBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Compress and resize the avatar image before storage update
      const compressedBase64 = await compressImage(rawBase64);
      await updateProfile(currentUser, { avatar: compressedBase64 });
    } catch (err) {
      console.error(err);
      alert("Failed to save photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    if (confirm("Sign out of your sanctuary?")) {
      await logout();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="settings-view-wrapper">
      <div className="lg:col-span-8 space-y-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b pb-2">
            <Palette className="w-4.5 h-4.5 text-rose-500 animate-spin-slow" />
            Home Theme Palette
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Change the ambiance of your digital sanctuary instantly. The colors, borders, and gradients will sync completely.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {themeList.map((tm) => {
              const isSelected = theme === tm.id;
              return (
                <button
                  key={tm.id}
                  onClick={() => setTheme(tm.id)}
                  className={`p-4 border rounded-2xl text-left transition-all relative overflow-hidden group hover:shadow ${
                    isSelected
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 font-bold"
                      : "border-gray-200 bg-white/40 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-bold text-gray-800">{tm.name}</p>
                    <div className="flex gap-1">
                      {tm.previewColors.map((col, i) => (
                        <div
                          key={i}
                          style={{ backgroundColor: col }}
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                    {tm.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 border-b pb-2">
            <UserCircle className="w-4.5 h-4.5 text-rose-500" />
            My Profile
          </h3>

          <div className="flex flex-col items-center gap-3 pt-1">
            <div className="relative group">
              <img
                src={myProfile.avatar}
                alt={myProfile.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                <Camera className="w-6 h-6" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              {uploadingPhoto ? "Uploading..." : "Tap photo to change"}
            </p>

            <div className="w-full space-y-1">
              <label className="text-[10px] text-[var(--text-muted)] font-bold">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)]"
                placeholder="Your name"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-2 bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 text-xs font-bold rounded-lg transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Your Partner</p>
            <div className="flex items-center gap-3 p-3 bg-black/5 rounded-xl">
              <img
                src={partnerProfile.avatar}
                alt={partnerProfile.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs font-bold text-gray-800">{partnerProfile.name}</p>
                <p className="text-[10px] text-gray-400">{partnerProfile.status}</p>
              </div>
              <Heart className="w-4 h-4 text-rose-400 ml-auto" />
            </div>
          </div>

          {session?.email && (
            <p className="text-[10px] text-gray-400 font-mono truncate">
              Signed in as {session.email}
            </p>
          )}

          <button
            onClick={handleLogout}
            className="w-full py-2 bg-black/5 hover:bg-black/10 text-gray-700 border border-gray-200 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-4 border-red-200">
          <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 border-b border-red-100 pb-2">
            <ShieldAlert className="w-4.5 h-4.5 text-red-500 animate-pulse" />
            Sanctuary Danger Zone
          </h3>

          <p className="text-[10px] text-gray-500 leading-relaxed">
            Wiping the sanctuary completely deletes all letters, photobooth prints, levels, garden plant hydration, and logs. It will immediately rehydrate the default seed layout. This is irreversible.
          </p>

          <button
            onClick={() => {
              if (confirm("Are you absolutely sure you want to completely clear and reset our Private Sanctuary? This will wipe your letters and journals!")) {
                resetAllData();
                alert("Private Sanctuary rehydrated successfully!");
                window.location.reload();
              }
            }}
            className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-lg transition-all"
          >
            Reset Digital Sanctuary
          </button>
        </div>

        {/* ── ADMIN PANEL: Only for pratamagerrio@gmail.com ── */}
        {isAdmin && (
          <div className="glass-panel rounded-2xl overflow-hidden border-2 border-purple-300/50 shadow-lg">
            {/* Header toggle */}
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="w-full p-5 flex items-center justify-between bg-gradient-to-r from-purple-900/80 to-indigo-900/80 text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 border border-purple-400/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-4.5 h-4.5 text-purple-300" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-purple-100 flex items-center gap-2">
                    Admin Control Panel
                    <Lock className="w-3 h-3 text-purple-400" />
                  </p>
                  <p className="text-[9px] text-purple-400 font-mono uppercase tracking-widest">Restricted · {ADMIN_EMAIL}</p>
                </div>
              </div>
              {adminOpen ? <ChevronUp className="w-4 h-4 text-purple-300" /> : <ChevronDown className="w-4 h-4 text-purple-300" />}
            </button>

            {adminOpen && (
              <div className="p-5 space-y-5 bg-gradient-to-br from-purple-950/30 to-slate-950/50 border-t border-purple-500/20">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-purple-500/10 rounded-xl p-3 text-center">
                    <Database className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-200">{memories.length}</p>
                    <p className="text-[8px] text-purple-400 font-mono uppercase tracking-widest">Total Memories</p>
                  </div>
                  <div className="bg-white/5 border border-purple-500/10 rounded-xl p-3 text-center">
                    <Activity className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-200">2</p>
                    <p className="text-[8px] text-purple-400 font-mono uppercase tracking-widest">Active Users</p>
                  </div>
                </div>

                {/* Special Milestones Configuration (Days of Love & Birthdays) */}
                <div className="bg-white/5 border border-purple-500/15 rounded-xl p-4 space-y-4">
                  <p className="text-xs font-bold text-purple-100 flex items-center gap-2 border-b border-purple-500/10 pb-2">
                    <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
                    Special Milestones (HomeView Card)
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] text-purple-300 font-semibold mb-1 uppercase tracking-wider">Days of Love Anniversary Date</label>
                      <input
                        type="date"
                        value={newAnniversary}
                        onChange={(e) => setNewAnniversary(e.target.value)}
                        disabled={memLoading}
                        className="w-full bg-black/40 border border-purple-500/20 text-purple-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-purple-400 transition-all font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] text-purple-300 font-semibold mb-1 uppercase tracking-wider">Han-byul Birthday (MM-DD)</label>
                        <input
                          type="text"
                          placeholder="e.g. 11-18"
                          value={newBirthdayA}
                          onChange={(e) => setNewBirthdayA(e.target.value)}
                          disabled={memLoading}
                          className="w-full bg-black/40 border border-purple-500/20 text-purple-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-purple-400 transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-purple-300 font-semibold mb-1 uppercase tracking-wider">Nic-young Birthday (MM-DD)</label>
                        <input
                          type="text"
                          placeholder="e.g. 04-05"
                          value={newBirthdayB}
                          onChange={(e) => setNewBirthdayB(e.target.value)}
                          disabled={memLoading}
                          className="w-full bg-black/40 border border-purple-500/20 text-purple-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-purple-400 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[9px] text-purple-300 font-semibold mb-1 uppercase tracking-wider">Cloudinary Cloud Name</label>
                        <input
                          type="text"
                          placeholder="Cloud Name"
                          value={newCloudName}
                          onChange={(e) => setNewCloudName(e.target.value)}
                          disabled={memLoading}
                          className="w-full bg-black/40 border border-purple-500/20 text-purple-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-purple-400 transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-purple-300 font-semibold mb-1 uppercase tracking-wider">Cloudinary Upload Preset</label>
                        <input
                          type="text"
                          placeholder="Upload Preset"
                          value={newUploadPreset}
                          onChange={(e) => setNewUploadPreset(e.target.value)}
                          disabled={memLoading}
                          className="w-full bg-black/40 border border-purple-500/20 text-purple-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-purple-400 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleSaveCoupleSettings}
                      disabled={memLoading || (
                        newAnniversary === anniversaryDate &&
                        newBirthdayA === birthdayA &&
                        newBirthdayB === birthdayB &&
                        newCloudName === cloudinaryCloudName &&
                        newUploadPreset === cloudinaryUploadPreset
                      )}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center"
                    >
                      {memLoading ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </div>



                {/* Result banner */}
                {adminActionResult && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${
                    adminActionResult.startsWith("✅")
                      ? "bg-emerald-500/15 border border-emerald-500/20 text-emerald-300"
                      : "bg-red-500/15 border border-red-500/20 text-red-300"
                  }`}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {adminActionResult}
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2.5">
                  <p className="text-[8px] font-mono text-purple-400 uppercase tracking-widest">Admin Actions</p>

                  <button
                    onClick={() => runAdminAction("reset all daily missions", adminResetMissions)}
                    disabled={!!adminActionLoading}
                    className="w-full flex items-center gap-3 p-3.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-400/40 rounded-xl text-left transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-purple-300 flex-shrink-0 ${adminActionLoading === "reset all daily missions" ? "animate-spin" : ""}`} />
                    <div>
                      <p className="text-xs font-bold text-purple-100">Reset Daily Missions</p>
                      <p className="text-[9px] text-purple-400">Clears all completed mission states</p>
                    </div>
                  </button>

                  <button
                    onClick={() => runAdminAction("clear all activity logs", adminClearActivityLogs)}
                    disabled={!!adminActionLoading}
                    className="w-full flex items-center gap-3 p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-400/40 rounded-xl text-left transition-all disabled:opacity-50"
                  >
                    <Activity className={`w-4 h-4 text-amber-300 flex-shrink-0 ${adminActionLoading === "clear all activity logs" ? "animate-pulse" : ""}`} />
                    <div>
                      <p className="text-xs font-bold text-amber-100">Clear Activity Logs</p>
                      <p className="text-[9px] text-amber-400">Removes all activity history entries</p>
                    </div>
                  </button>

                  <button
                    onClick={() => runAdminAction("delete ALL memories permanently", adminDeleteAllMemories)}
                    disabled={!!adminActionLoading}
                    className="w-full flex items-center gap-3 p-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-400/40 rounded-xl text-left transition-all disabled:opacity-50"
                  >
                    <Trash2 className={`w-4 h-4 text-red-300 flex-shrink-0 ${adminActionLoading === "delete ALL memories permanently" ? "animate-bounce" : ""}`} />
                    <div>
                      <p className="text-xs font-bold text-red-100">Delete All Memories</p>
                      <p className="text-[9px] text-red-400">⚠️ Permanent — this cannot be undone</p>
                    </div>
                  </button>
                </div>

                <div className="pt-2 border-t border-purple-500/10">
                  <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-xl border border-white/5">
                    <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <p className="text-[8px] text-purple-400 leading-relaxed">
                      Admin actions are permanent and affect both users. Use with caution. This panel is only visible to <span className="text-purple-300 font-bold">{ADMIN_EMAIL}</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
