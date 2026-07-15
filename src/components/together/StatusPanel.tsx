/**
 * StatusPanel.tsx — Activity Status tab
 * Scrapbook redesign: removed tree-card, uses StickerButton for custom status
 */
import React, { useState, useCallback } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion } from "motion/react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "../extras/SectionHeader";
import { triggerHaptic } from "../../lib/haptics";
import { StickerButton, WashiTapeDivider } from "../scrapbook";

const STATUS_PRESETS = [
  { emoji: "📚", label: "Studying" }, { emoji: "💻", label: "Coding" }, { emoji: "☕", label: "Drinking Coffee" },
  { emoji: "😴", label: "Sleeping" }, { emoji: "🎮", label: "Gaming" }, { emoji: "🎵", label: "Listening to Music" },
  { emoji: "🍳", label: "Cooking" }, { emoji: "📱", label: "On Phone" }, { emoji: "🏃", label: "Working Out" },
  { emoji: "🌸", label: "Relaxing" }, { emoji: "✈️", label: "Traveling" }, { emoji: "💖", label: "Thinking of You" },
];

export default function StatusPanel() {
  const { currentUser, userA, userB, updateProfile } = useCouple();
  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;
  const [customStatusInput, setCustomStatusInput] = useState("");

  const isPartnerOnline = !partnerProfile.status?.toLowerCase().includes("waiting for connection");

  const handleUpdateStatusPreset = useCallback((preset: typeof STATUS_PRESETS[0]) => {
    updateProfile(currentUser, { status: `${preset.emoji} ${preset.label}` });
    triggerHaptic("light");
    toast.success(`Status set to ${preset.label} ${preset.emoji}`);
  }, [currentUser, updateProfile]);

  const handleUpdateStatusCustom = useCallback(() => {
    if (!customStatusInput.trim()) return;
    updateProfile(currentUser, { status: customStatusInput.trim() });
    setCustomStatusInput("");
    triggerHaptic("light");
    toast.success("Custom status updated! ✨");
  }, [customStatusInput, currentUser, updateProfile]);

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left">
      <SectionHeader
        chapter="The Heartbeat"
        title="Live Activity Status"
        subtitle="Let your partner know what you're up to."
      />

      <WashiTapeDivider color="moss" label="Now" />

      {/* Status Card */}
      <div className="p-6 md:p-8 rounded-3xl space-y-6 shadow-sm border border-[var(--wood-oak)]/15"
        style={{ backgroundColor: "var(--fabric-cream)" }}>
        {/* Partner comparison grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { profile: activeProfile, label: "You", isOnline: true },
            { profile: partnerProfile, label: "Partner", isOnline: isPartnerOnline },
          ].map(({ profile, label, isOnline }) => (
            <div key={profile.id} className="bg-[var(--fabric-cream)]/50 border border-[var(--wood-oak)]/15 rounded-2xl p-4 text-center shadow-xs">
              <img src={profile.avatar} alt={profile.name}
                className={`w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-[var(--fabric-cream)] shadow-xs transition-all ${isOnline ? "animate-pulse ring-2 ring-[var(--primary)]/20" : ""}`}
                style={isOnline ? { boxShadow: "0 0 15px var(--wood-oak)" } : {}}
                referrerPolicy="no-referrer" loading="lazy" />
              <p className="text-xs font-bold text-[var(--text-main)]">{label}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{profile.name.split(" ")[0]}</p>
              <p className="text-xs text-[var(--primary)] mt-2 font-semibold leading-tight min-h-[1.5rem] flex items-center justify-center">
                {profile.status || "🌸 Floating in space"}
              </p>
            </div>
          ))}
        </div>

        {/* Presets */}
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Set your status</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {STATUS_PRESETS.map((preset) => {
              const isSelected = activeProfile.status === `${preset.emoji} ${preset.label}`;
              return (
                <button key={preset.label} id={`status-preset-${preset.label.replace(/\s/g, "-").toLowerCase()}`}
                  onClick={() => handleUpdateStatusPreset(preset)}
                  className={`p-2.5 rounded-xl text-center border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex flex-col items-center justify-center ${isSelected ? "bg-[var(--primary)] text-white border-transparent font-bold shadow-xs" : "bg-[var(--fabric-cream)]/30 border border-[var(--wood-oak)]/15 hover:bg-[var(--fabric-cream)]/60 text-[var(--text-main)]"}`}
                >
                  <span className="text-xl block">{preset.emoji}</span>
                  <span className="text-[9px] font-semibold block mt-0.5 truncate w-full">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom input */}
        <div className="flex gap-2">
          <input value={customStatusInput} onChange={(e) => setCustomStatusInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUpdateStatusCustom()}
            placeholder="Set a custom status..." maxLength={60}
            className="flex-1 text-xs px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] transition-colors text-gray-850 font-semibold"
          />
          <StickerButton id="custom-status-set-btn" onClick={handleUpdateStatusCustom} color="primary" size="sm"
            icon={<Send className="w-3.5 h-3.5" />}>
            Set
          </StickerButton>
        </div>
      </div>
    </div>
  );
}
