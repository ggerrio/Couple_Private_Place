import React, { useState, useEffect, useCallback } from "react";
import { useCouple } from "../../context/CoupleContext";
import { Memory } from "../../types";
import { motion } from "motion/react";
import { Heart, Calendar, Camera, Sparkles, ArrowRight } from "lucide-react";
import { PolaroidFrame } from "../scrapbook";
import { triggerHaptic } from "../../lib/haptics";

interface WelcomeHeroProps {
  activeProfile: { name: string; avatar: string; mood: string };
  partnerProfile: { name: string; status: string; avatar: string };
  daysCount: number;
  anniversaryDate: string;
  message: string;
}

export function WelcomeHero({
  activeProfile,
  partnerProfile,
  daysCount,
  anniversaryDate,
  message,
}: WelcomeHeroProps) {
  const formattedAnniversary = React.useMemo(() => {
    if (!anniversaryDate) return "SINCE DEC 15, 2025";
    try {
      const date = new Date(anniversaryDate);
      return `SINCE ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()}`;
    } catch {
      return "SINCE DEC 15, 2025";
    }
  }, [anniversaryDate]);

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start justify-between w-full">
      {/* ─── Left: Cover Text ─── */}
      <div className="flex-1 min-w-0 space-y-4 w-full text-left">
        {/* Decorative tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-accent-rose)]/10 border border-[var(--color-accent-rose)]/25 rounded-full text-[11px] font-bold tracking-wide">
          <Heart className="w-3.5 h-3.5 fill-current" style={{ color: "var(--color-accent-rose)" }} />
          <span style={{ color: "var(--color-accent-rose)" }}>Our Private Digital Sanctuary</span>
        </div>

        <div className="space-y-1.5">
          {/* Handwritten welcome title */}
          <h1 className="font-handwrite text-3xl sm:text-4xl md:text-5xl leading-tight" style={{ color: "var(--text-primary)" }}>
            Welcome home,{" "}
            <span className="font-sans font-extrabold not-italic" style={{ color: "var(--primary)" }}>
              {activeProfile.name.split(" ")[0]}
            </span>
          </h1>

          {/* Daily message */}
          <p className="font-handwrite text-lg md:text-xl leading-relaxed animate-fade-in" style={{ color: "var(--text-secondary)" }}>
            {message}
          </p>
        </div>

        {/* Together badge with partner status */}
        <div className="flex flex-wrap items-center gap-4 pt-1">
          {/* Partner avatars */}
          <div className="flex items-center -space-x-2">
            <img loading="lazy"
              src={activeProfile.avatar}
              alt={activeProfile.name}
              className="w-10 h-10 rounded-full border-[3px] border-white object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
            <img loading="lazy"
              src={partnerProfile.avatar}
              alt={partnerProfile.name}
              className="w-10 h-10 rounded-full border-[3px] border-white object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Partner status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-[var(--border-color)] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent-moss)] animate-pulse" />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {partnerProfile.name.split(" ")[0]} is currently{" "}
              <span className="font-bold" style={{ color: "var(--primary)" }}>
                {partnerProfile.status}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Right: Standalone "DAYS OF LOVE" Box ─── */}
      <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-end pt-4 md:pt-0">
        <div className="relative p-5 sm:p-6 bg-[#FEFAF4] dark:bg-[#1E1E38] border-2 border-dashed border-[#F3DEC9] dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-center shadow-xs min-w-[200px] md:min-w-[240px] max-w-xs transition-all duration-300">
          {/* Cute pink heart pins/stickers in corners */}
          <span className="absolute top-2 left-2 text-rose-400 text-sm animate-pulse">❤️</span>
          <span className="absolute bottom-2 right-2 text-rose-400 text-sm animate-pulse">❤️</span>

          <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-800/80 dark:text-amber-200/80 font-sans mb-2">
            DAYS OF LOVE
          </span>
          <span className="text-5xl md:text-6xl font-serif font-extrabold text-rose-500 dark:text-rose-400 my-1 tracking-tight">
            {daysCount}
          </span>
          <span className="mt-3 px-3 py-1 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900/80 dark:text-amber-100/80 border border-amber-100/60 dark:border-amber-900/40 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono">
            {formattedAnniversary}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Memory Spotlight ─────────────────────────────────────────────────────────

export function MemorySpotlight() {
  const { memories } = useCouple();
  const [spotlightMemory, setSpotlightMemory] = useState<Memory | null>(null);
  const [rotationCountdown, setRotationCountdown] = useState("24h");

  useEffect(() => {
    if (!memories || memories.length === 0) {
      setSpotlightMemory(null);
      return;
    }

    const memoriesWithImages = memories.filter(
      (m) => m.imageUrl && m.imageUrl.trim() !== ""
    );
    if (memoriesWithImages.length === 0) {
      setSpotlightMemory(null);
      return;
    }

    const selectSpotlight = () => {
      const storedId = localStorage.getItem("couple_spotlight_memory_id");
      const storedTime = localStorage.getItem("couple_spotlight_selected_at");
      const now = Date.now();
      let selected: Memory | undefined;

      if (storedId && storedTime) {
        const selectedAt = parseInt(storedTime, 10);
        if (now - selectedAt < 24 * 60 * 60 * 1000) {
          selected = memoriesWithImages.find((m) => m.id === storedId);
        }
      }

      if (!selected) {
        const randomIndex = Math.floor(Math.random() * memoriesWithImages.length);
        selected = memoriesWithImages[randomIndex];
        localStorage.setItem("couple_spotlight_memory_id", selected.id);
        localStorage.setItem("couple_spotlight_selected_at", now.toString());
      }

      setSpotlightMemory(selected || null);
    };

    selectSpotlight();

    const updateCountdown = () => {
      const storedTime = localStorage.getItem("couple_spotlight_selected_at");
      if (storedTime) {
        const elapsed = Date.now() - parseInt(storedTime, 10);
        const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);
        if (remainingMs <= 0) {
          selectSpotlight();
        } else {
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const minutes = Math.floor(
            (remainingMs % (1000 * 60 * 60)) / (1000 * 60)
          );
          setRotationCountdown(`${hours}h ${minutes}m`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 15000);
    return () => clearInterval(interval);
  }, [memories]);

  const triggerLoveEffect = useCallback(() => {
    triggerHaptic("success");
    const count = 14;
    const rect = document
      .getElementById("spotlight-frame")
      ?.getBoundingClientRect();
    const xBase = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const yBase = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const emojis = ["💖", "🌸", "✨", "🥰", "🎀", "🧸"];
    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      star.innerText = emojis[Math.floor(Math.random() * emojis.length)];
      star.style.position = "fixed";
      star.style.left = `${xBase + (Math.random() - 0.5) * 120}px`;
      star.style.top = `${yBase + (Math.random() - 0.5) * 120}px`;
      star.style.fontSize = `${24 + Math.random() * 24}px`;
      star.style.pointerEvents = "none";
      star.style.zIndex = "9999";
      star.style.transition = "all 1s cubic-bezier(0.1, 0.8, 0.3, 1)";
      document.body.appendChild(star);
      setTimeout(() => {
        star.style.transform = `translateY(-140px) scale(0.2) rotate(${
          (Math.random() - 0.5) * 200
        }deg)`;
        star.style.opacity = "0";
      }, 50);
      setTimeout(() => star.remove(), 1050);
    }
  }, []);

  if (!spotlightMemory) {
    return (
      <div className="border-t border-[var(--border-color)] mt-5 pt-5">
        <div className="flex items-center justify-center gap-3 py-3">
          <Camera className="w-6 h-6 text-gray-300 animate-pulse" />
          <div>
            <p className="text-xs font-semibold text-gray-500 font-serif italic">
              No memories spotlighted yet
            </p>
            <button
              onClick={() => {
                triggerHaptic("medium");
                window.dispatchEvent(
                  new CustomEvent("changeTab", { detail: "memories" })
                );
              }}
              className="text-xs text-[var(--primary)] font-bold mt-0.5 hover:underline cursor-pointer"
            >
              Open Photobooth & Save Memories →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-8 w-full text-center md:text-left" id="spotlight-memory-widget">
      {/* Polaroid Frame */}
      <div className="flex-shrink-0 w-full max-w-[190px] sm:max-w-[210px] transform hover:rotate-1 transition-transform duration-300 mx-auto md:mx-0">
        <PolaroidFrame
          rotation={-1}
          caption={`✨ ${spotlightMemory.title} ✨`}
          onClick={triggerLoveEffect}
        >
          <motion.div
            id="spotlight-frame"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="w-full aspect-square overflow-hidden bg-gray-50"
          >
            <img loading="lazy"
              src={spotlightMemory.imageUrl}
              alt={spotlightMemory.title}
              className="w-full h-full object-cover pointer-events-none select-none hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </PolaroidFrame>
      </div>

      {/* Memory Info */}
      <div className="space-y-3 w-full flex-1 flex flex-col items-center md:items-start text-center md:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-50 to-rose-50 border border-rose-100/60 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-rose-600 shadow-xs">
          <Sparkles className="w-3 h-3 text-amber-500 fill-current animate-spin-slow" />
          <span>Memory Spotlight</span>
        </div>
        <h3 className="text-base sm:text-lg font-serif text-[var(--text-main)] font-bold italic tracking-tight leading-tight max-w-xs">
          {spotlightMemory.title}
        </h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-xs md:max-w-md">
          {spotlightMemory.description || "A beautiful moment frozen in time."}
        </p>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-[10px] sm:text-xs pt-0.5">
          <span className="flex items-center gap-1 text-[var(--text-muted)] font-mono">
            <Calendar className="w-3.5 h-3.5 text-rose-400" />
            {new Date(spotlightMemory.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="bg-rose-50/80 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider flex items-center gap-0.5">
            <span className="animate-pulse">●</span> Rotates: {rotationCountdown}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1.5 w-full">
          <button
            onClick={triggerLoveEffect}
            className="flex-1 max-w-[120px] py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
          >
            🥰 Love This! 💖
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              window.dispatchEvent(
                new CustomEvent("changeTab", { detail: "memories" })
              );
            }}
            className="flex-1 max-w-[120px] py-1.5 bg-white/75 hover:bg-white text-gray-700 hover:text-rose-600 border border-gray-200/80 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-0.5 cursor-pointer shadow-xs"
          >
            View Timeline <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
