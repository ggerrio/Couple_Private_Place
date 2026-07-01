/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Sprout,
  Compass,
  Trophy,
  Hourglass,
  BarChart3,
  Droplet,
  Plus,
  Send,
  Lock,
  Unlock,
  Sparkles,
  Award,
  TrendingUp,
  Scissors,
} from "lucide-react";

export default function AdventureView() {
  const {
    currentUser,
    userA,
    userB,
    missions,
    toggleMission,
    gardenXp,
    gardenLevel,
    gardenPlant,
    waterLevel,
    waterPlant,
    changePlantType,
    timeCapsules,
    addTimeCapsule,
    openTimeCapsule,
    awardXp,
  } = useCouple();

  const relationshipStreak = (() => {
    try {
      const stored = localStorage.getItem("couple_relationship_streak");
      return stored ? parseInt(stored, 10) : 18;
    } catch (e) {
      return 18;
    }
  })();
  const completedMissionsCount = missions.filter((m) => m.completed).length;

  let gardenStage: "seed" | "sprout" | "budding" | "bloom" = "seed";
  if (relationshipStreak >= 30 || completedMissionsCount >= 3) {
    gardenStage = "bloom";
  } else if (relationshipStreak >= 20 || completedMissionsCount === 2) {
    gardenStage = "budding";
  } else if (relationshipStreak >= 10 || completedMissionsCount === 1) {
    gardenStage = "sprout";
  }

  const [activeAdvTab, setActiveAdvTab] = useState<"garden" | "missions" | "capsule" | "stats">("garden");

  // TIME CAPSULE STATE
  const [capsuleMsg, setCapsuleMsg] = useState("");
  const [capsuleUnlockDate, setCapsuleUnlockDate] = useState("");
  const [showAddCapsule, setShowAddCapsule] = useState(false);

  // PARTICLES & INTERACTION STATE
  const [gardenParticles, setGardenParticles] = useState<{ id: number; x: number; y: number; type: "water" | "prune" | "sparkle" }[]>([]);
  const [isWateringAnim, setIsWateringAnim] = useState(false);
  const [isPruningAnim, setIsPruningAnim] = useState(false);

  const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" = "light") => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      try {
        if (type === "light") {
          window.navigator.vibrate(12);
        } else if (type === "medium") {
          window.navigator.vibrate(35);
        } else if (type === "heavy") {
          window.navigator.vibrate(70);
        } else if (type === "success") {
          window.navigator.vibrate([20, 40, 20]);
        }
      } catch (e) {}
    }
  };

  const handleWater = () => {
    if (waterLevel >= 100) return;
    triggerHaptic("success");
    setIsWateringAnim(true);

    const droplets = Array.from({ length: 16 }).map((_, idx) => ({
      id: Math.random() + idx,
      x: 15 + Math.random() * 70, // percentage
      y: -20 - Math.random() * 30, // drop starting height
      type: "water" as const,
    }));
    setGardenParticles((prev) => [...prev, ...droplets]);

    waterPlant();

    // Spawn green water bursts
    setTimeout(() => {
      setGardenParticles((prev) => prev.filter((p) => p.type !== "water"));
      setIsWateringAnim(false);
    }, 1500);
  };

  const handlePrune = () => {
    triggerHaptic("medium");
    setIsPruningAnim(true);

    const sparks = Array.from({ length: 14 }).map((_, idx) => ({
      id: Math.random() + idx,
      x: 30 + Math.random() * 40,
      y: 40 + Math.random() * 40,
      type: "prune" as const,
    }));
    setGardenParticles((prev) => [...prev, ...sparks]);

    awardXp(15, "beautifully pruning the centerpiece and pruning dead branches ✂️🌿");

    setTimeout(() => {
      setGardenParticles((prev) => prev.filter((p) => p.type !== "prune"));
      setIsPruningAnim(false);
    }, 1500);
  };

  const triggerInteractiveSparkle = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    triggerHaptic("light");
    const spark = {
      id: Date.now() + Math.random(),
      x,
      y,
      type: "sparkle" as const,
    };
    setGardenParticles((prev) => [...prev, spark]);

    setTimeout(() => {
      setGardenParticles((prev) => prev.filter((p) => p.id !== spark.id));
    }, 1000);
  };

  const handleCreateTimeCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capsuleMsg || !capsuleUnlockDate) return;

    addTimeCapsule({
      openDate: new Date(capsuleUnlockDate).toISOString(),
      message: capsuleMsg,
    });

    setCapsuleMsg("");
    setCapsuleUnlockDate("");
    setShowAddCapsule(false);
  };

  // Plant grow assets state
  const plantAesthetics = {
    tulip: {
      seed: "🌱", sprout: "🌿", bloom: "🌷", title: "Midnight Tulip",
      color: "from-rose-400 to-pink-500",
      desc: "Delicate and warm, symbolizing precious new beginnings.",
    },
    bonsai: {
      seed: "🌰", sprout: "🪴", bloom: "🌳", title: "Eternal Bonsai",
      color: "from-emerald-600 to-teal-800",
      desc: "Calm and quiet, reflecting a timeless, steady commitment.",
    },
    sakura: {
      seed: "🌸", sprout: "🌿", bloom: "🌸✨", title: "Blossoming Sakura",
      color: "from-pink-300 to-rose-400",
      desc: "Soft and whimsical, capturing the magic of romantic spring.",
    },
    sunflower: {
      seed: "🌻", sprout: "🌱", bloom: "🌻☀️", title: "Sunny Sunflower",
      color: "from-amber-400 to-yellow-500",
      desc: "Bright and joyful, bringing energy and warmth to your home.",
    },
  };

  // Custom vector plant drawers
  const renderVectorPlant = () => {
    const isSprout = gardenStage === "seed" || gardenStage === "sprout";
    const isBudding = gardenStage === "budding";
    const isBlooming = gardenStage === "bloom";

    switch (gardenPlant) {
      case "sakura":
        return (
          <motion.g
            key={`${gardenPlant}-${gardenStage}`}
            initial={{ scale: 0.8, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            style={{ transformOrigin: "100px 198px" }}
          >
            {/* Trunk */}
            <path
              d={isSprout 
                ? "M100,198 Q102,185 98,175" 
                : isBudding 
                ? "M100,198 Q103,175 96,150 Q92,140 102,130 M97,165 Q88,155 82,158"
                : "M100,198 Q104,170 95,140 Q90,120 105,100 M97,160 Q85,145 75,150 M102,130 Q118,120 125,125"
              }
              fill="none"
              stroke="#7c5346"
              strokeWidth={isSprout ? "4" : isBudding ? "6" : "8"}
              strokeLinecap="round"
            />
            {/* Crown elements */}
            {isSprout && (
              <>
                <circle cx="98" cy="175" r="4.5" fill="#ec4899" />
                <path d="M98,175 Q92,168 95,162 Q100,168 98,175 Z" fill="#4ade80" />
                <path d="M98,175 Q104,169 101,163 Q96,169 98,175 Z" fill="#4ade80" />
              </>
            )}
            {isBudding && (
              <>
                <path d="M82,158 Q76,152 79,147 Q84,152 82,158 Z" fill="#4ade80" />
                <path d="M102,130 Q108,124 105,118 Q100,124 102,130 Z" fill="#4ade80" />
                <circle cx="96" cy="150" r="5" fill="#f472b6" />
                <circle cx="82" cy="158" r="4" fill="#f472b6" />
                <circle cx="102" cy="130" r="4.5" fill="#fecdd3" />
              </>
            )}
            {isBlooming && (
              <>
                <motion.g animate={{ y: [0, -2, 0], rotate: [0, 1, -1, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
                  <circle cx="75" cy="150" r="14" fill="#f472b6" opacity="0.85" />
                  <circle cx="68" cy="144" r="11" fill="#fbcfe8" opacity="0.9" />
                  <circle cx="125" cy="125" r="12" fill="#f472b6" opacity="0.85" />
                  <circle cx="121" cy="118" r="10" fill="#fbcfe8" opacity="0.9" />
                  <circle cx="105" cy="100" r="19" fill="#ec4899" opacity="0.8" />
                  <circle cx="95" cy="90" r="23" fill="#f472b6" opacity="0.9" />
                  <circle cx="112" cy="85" r="16" fill="#fbcfe8" />
                  <path d="M100,85 Q102,80 100,75 Q98,80 100,85 Z" fill="#fbcfe8" />
                  <path d="M78,138 Q82,134 80,130 Q76,134 78,138 Z" fill="#fbcfe8" />
                </motion.g>
              </>
            )}
          </motion.g>
        );

      case "bonsai":
        return (
          <motion.g
            key={`${gardenPlant}-${gardenStage}`}
            initial={{ scale: 0.8, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            style={{ transformOrigin: "100px 198px" }}
          >
            <path
              d={isSprout
                ? "M100,198 Q98,188 102,176"
                : isBudding
                ? "M100,198 Q93,178 102,160 Q108,148 98,138 M95,170 Q82,165 76,168"
                : "M100,198 Q90,175 104,150 Q112,132 95,115 Q84,105 88,95 M93,165 Q75,155 65,160 M105,138 Q125,130 132,134"
              }
              fill="none"
              stroke="#5c4033"
              strokeWidth={isSprout ? "5" : isBudding ? "8" : "11"}
              strokeLinecap="round"
            />
            {isSprout && (
              <>
                <ellipse cx="102" cy="176" rx="6" ry="4" fill="#065f46" />
                <path d="M102,176 L108,172" stroke="#065f46" strokeWidth="2.5" />
              </>
            )}
            {isBudding && (
              <>
                <ellipse cx="76" cy="168" rx="14" ry="8" fill="#047857" opacity="0.9" />
                <ellipse cx="98" cy="138" rx="16" ry="10" fill="#065f46" />
                <ellipse cx="102" cy="160" rx="12" ry="7" fill="#0f766e" opacity="0.85" />
              </>
            )}
            {isBlooming && (
              <>
                <motion.g animate={{ scale: [1, 1.02, 1], rotate: [0, -0.5, 0.5, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}>
                  <ellipse cx="65" cy="160" rx="20" ry="10" fill="#064e3b" />
                  <ellipse cx="62" cy="156" rx="16" ry="8" fill="#047857" opacity="0.9" />
                  <ellipse cx="132" cy="134" rx="18" ry="9" fill="#0f766e" />
                  <ellipse cx="130" cy="130" rx="14" ry="7" fill="#14b8a6" opacity="0.85" />
                  <ellipse cx="88" cy="95" rx="26" ry="12" fill="#065f46" />
                  <ellipse cx="85" cy="90" rx="21" ry="10" fill="#059669" opacity="0.9" />
                  <ellipse cx="92" cy="86" rx="15" ry="8" fill="#34d399" opacity="0.75" />
                </motion.g>
                <rect x="135" y="190" width="8" height="4" fill="#9ca3af" rx="1" />
                <rect x="137" y="184" width="4" height="6" fill="#6b7280" rx="1" />
                <circle cx="139" cy="181" r="2" fill="#9ca3af" />
              </>
            )}
          </motion.g>
        );

      case "tulip":
        return (
          <motion.g
            key={`${gardenPlant}-${gardenStage}`}
            initial={{ scale: 0.8, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            style={{ transformOrigin: "100px 198px" }}
          >
            <path
              d={isSprout
                ? "M100,198 Q100,180 100,165"
                : isBudding
                ? "M100,198 L100,135"
                : "M100,198 L100,105"
              }
              fill="none"
              stroke="#22c55e"
              strokeWidth={isSprout ? "4" : isBudding ? "6" : "7"}
              strokeLinecap="round"
            />
            {isSprout && (
              <>
                <path d="M100,198 Q88,185 92,165 Q98,180 100,198 Z" fill="#15803d" />
                <path d="M100,198 Q112,184 108,164 Q102,179 100,198 Z" fill="#166534" />
              </>
            )}
            {isBudding && (
              <>
                <path d="M100,198 Q80,175 88,145 Q95,165 100,180 Z" fill="#15803d" />
                <path d="M100,198 Q120,174 112,144 Q105,164 100,180 Z" fill="#166534" />
                <path d="M100,135 C94,135 90,125 100,110 C110,125 106,135 100,135 Z" fill="#f43f5e" />
                <path d="M100,135 C97,135 95,128 100,115 C105,128 103,135 100,135 Z" fill="#e11d48" opacity="0.8" />
              </>
            )}
            {isBlooming && (
              <>
                <path d="M100,198 Q74,165 82,120 Q92,150 100,175 Z" fill="#15803d" />
                <path d="M100,198 Q126,164 118,119 Q108,149 100,175 Z" fill="#166534" />
                <motion.g animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}>
                  <path d="M100,105 C85,105 80,85 95,65 C105,80 105,95 100,105 Z" fill="#ec4899" />
                  <path d="M100,105 C115,105 120,85 105,65 C95,80 95,95 100,105 Z" fill="#ec4899" />
                  <path d="M100,105 C90,105 90,75 100,60 C110,75 110,105 100,105 Z" fill="#f43f5e" />
                  <path d="M100,105 C94,105 96,85 100,70 C104,85 106,105 100,105 Z" fill="#fbcfe8" opacity="0.6" />
                </motion.g>
              </>
            )}
          </motion.g>
        );

      case "sunflower":
        return (
          <motion.g
            key={`${gardenPlant}-${gardenStage}`}
            initial={{ scale: 0.8, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            style={{ transformOrigin: "100px 198px" }}
          >
            <path
              d={isSprout
                ? "M100,198 L100,165"
                : isBudding
                ? "M100,198 L100,130"
                : "M100,198 L100,95"
              }
              fill="none"
              stroke="#4ade80"
              strokeWidth={isSprout ? "5" : isBudding ? "7" : "9"}
              strokeLinecap="round"
            />
            {isSprout && (
              <>
                <ellipse cx="90" cy="175" rx="8" ry="5" fill="#16a34a" transform="rotate(-15, 90, 175)" />
                <ellipse cx="110" cy="175" rx="8" ry="5" fill="#15803d" transform="rotate(15, 110, 175)" />
              </>
            )}
            {isBudding && (
              <>
                <path d="M100,165 Q80,160 84,145 Q95,155 100,165 Z" fill="#16a34a" />
                <path d="M100,150 Q120,145 116,130 Q105,140 100,150 Z" fill="#15803d" />
                <circle cx="100" cy="130" r="10.5" fill="#fbbf24" />
                <circle cx="100" cy="130" r="7.5" fill="#78350f" />
              </>
            )}
            {isBlooming && (
              <>
                <path d="M100,160 Q70,150 75,130 Q90,145 100,160 Z" fill="#16a34a" />
                <path d="M100,140 Q130,130 125,110 Q110,125 100,140 Z" fill="#15803d" />
                <path d="M100,120 Q75,115 80,100 Q92,110 100,120 Z" fill="#166534" />
                <motion.g animate={{ rotate: [0, 2.5, -2.5, 0] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}>
                  <g fill="#fbbf24">
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <path
                        key={idx}
                        d="M100,95 C94,95 90,65 100,55 C110,65 106,95 100,95 Z"
                        transform={`rotate(${(idx * 360) / 12}, 100, 95)`}
                      />
                    ))}
                  </g>
                  <g fill="#f59e0b">
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <path
                        key={idx}
                        d="M100,95 C96,95 93,73 100,65 C107,73 104,95 100,95 Z"
                        transform={`rotate(${(idx * 360) / 12 + 15}, 100, 95)`}
                      />
                    ))}
                  </g>
                  <circle cx="100" cy="95" r="16.5" fill="#451a03" stroke="#b45309" strokeWidth="1" />
                  <circle cx="100" cy="95" r="12.5" fill="#1c1917" />
                  <circle cx="96" cy="91" r="2.5" fill="#fff" opacity="0.3" />
                </motion.g>
              </>
            )}
          </motion.g>
        );

      default:
        return null;
    }
  };

  const renderPot = () => {
    switch (gardenPlant) {
      case "sakura":
        return (
          <g id="sakura-pot">
            <rect x="70" y="194" width="60" height="9" rx="3" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1.5" />
            <polygon points="74,203 126,203 118,233 82,233" fill="#f1f5f9" stroke="#38bdf8" strokeWidth="1.5" />
            <path d="M85,210 Q100,218 115,210" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,2" />
            <ellipse cx="100" cy="197" rx="26" ry="5" fill="#451a03" />
          </g>
        );
      case "bonsai":
        return (
          <g id="bonsai-pot">
            <rect x="65" y="194" width="70" height="9" rx="2" fill="#374151" stroke="#1f2937" strokeWidth="2" />
            <polygon points="69,203 131,203 125,231 75,231" fill="#4b5563" stroke="#1f2937" strokeWidth="2" />
            <rect x="78" y="231" width="6" height="4" fill="#1f2937" />
            <rect x="116" y="231" width="6" height="4" fill="#1f2937" />
            <ellipse cx="100" cy="197" rx="29" ry="5" fill="#292524" />
          </g>
        );
      case "tulip":
        return (
          <g id="tulip-pot">
            <rect x="72" y="194" width="56" height="9" rx="2" fill="#c2410c" stroke="#7c2d12" strokeWidth="1.5" />
            <polygon points="75,203 125,203 117,233 83,233" fill="#ea580c" stroke="#7c2d12" strokeWidth="1.5" />
            <ellipse cx="100" cy="197" rx="25" ry="5" fill="#451a03" />
          </g>
        );
      case "sunflower":
        return (
          <g id="sunflower-pot">
            <rect x="70" y="194" width="60" height="9" rx="2" fill="#eab308" stroke="#854d0e" strokeWidth="1.5" />
            <polygon points="73,203 127,203 118,233 82,233" fill="#facc15" stroke="#854d0e" strokeWidth="1.5" />
            <line x1="82" y1="208" x2="118" y2="208" stroke="#854d0e" strokeWidth="1" />
            <ellipse cx="100" cy="197" rx="26" ry="5" fill="#451a03" />
          </g>
        );
      default:
        return null;
    }
  };

  const getActivePlantIcon = () => {
    const config = plantAesthetics[gardenPlant];
    if (gardenStage === "seed") return config.seed;
    if (gardenStage === "sprout" || gardenStage === "budding") return config.sprout;
    return config.bloom;
  };

  return (
    <div className="space-y-6" id="adventure-hub">
      {/* 4-Tab Swapper */}
      <div className="flex justify-center border-b border-[var(--border-color)] pb-1">
        <div className="flex gap-6 overflow-x-auto pr-1">
          {[
            { value: "garden", label: "Virtual Garden", icon: Sprout },
            { value: "missions", label: "Bond Missions", icon: Trophy },
            { value: "capsule", label: "Time Capsule", icon: Hourglass },
            { value: "stats", label: "Activity Stats", icon: BarChart3 },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isSel = activeAdvTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveAdvTab(tab.value as any)}
                className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all relative whitespace-nowrap ${
                  isSel ? "text-[var(--primary)]" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <IconComp className="w-4 h-4" />
                {tab.label}
                {isSel && (
                  <motion.div
                    layoutId="activeAdventureSubtab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* SUBTAB 1: VIRTUAL GARDEN */}
        {activeAdvTab === "garden" && (
          <motion.div
            key="garden"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
          >
            {/* Left Plant Stage view */}
            <div className="md:col-span-7 flex flex-col items-center">
              <div className="relative w-full max-w-sm h-[360px] bg-white/40 border border-white rounded-3xl shadow-xl flex flex-col justify-between p-6 overflow-hidden">
                
                {/* Level Tag */}
                <div className="flex justify-between items-center z-10 w-full">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full font-mono uppercase flex items-center gap-1 shadow-sm w-fit">
                      <Sparkles className="w-3 h-3 text-rose-500 animate-spin-slow" /> Level {gardenLevel} {gardenPlant.toUpperCase()}
                    </span>
                    <span className="text-[9px] font-bold bg-[var(--primary)]/15 text-[var(--primary)] px-2 py-0.5 rounded-full font-mono uppercase flex items-center gap-1 shadow-sm w-fit">
                      🌱 {gardenStage.toUpperCase()} STAGE
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono font-bold bg-white/60 px-2.5 py-0.5 rounded-full border border-white/40 self-start">
                    XP: {gardenXp} / {gardenLevel * 100}
                  </span>
                </div>

                {/* Animated Growing Plant Vector Canvas */}
                <div className="flex flex-col items-center justify-center relative flex-1">
                  {/* Sun glow backdrops */}
                  <div className="absolute w-44 h-44 bg-gradient-to-tr from-amber-200/20 to-rose-200/20 rounded-full blur-2xl animate-spin-slow" />
                  
                  {/* Main SVG Plant stage */}
                  <svg
                    viewBox="0 0 200 240"
                    className="w-52 h-60 z-10 cursor-pointer select-none"
                    onClick={triggerInteractiveSparkle}
                  >
                    {/* Render vectors */}
                    {renderVectorPlant()}
                    {renderPot()}
                  </svg>

                  {/* Render Particle animations (Water droplets, Pruning golden sparks, Tapping sparkles) */}
                  <AnimatePresence>
                    {gardenParticles.map((p) => {
                      if (p.type === "water") {
                        return (
                          <motion.div
                            key={p.id}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            initial={{ y: -20, opacity: 0, scale: 0.5 }}
                            animate={{ y: 220, opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.3] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.1, ease: "easeIn" }}
                            className="absolute pointer-events-none text-blue-400 z-20 text-xs drop-shadow-md"
                          >
                            💧
                          </motion.div>
                        );
                      } else if (p.type === "prune") {
                        return (
                          <motion.div
                            key={p.id}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            initial={{ scale: 0, rotate: 0, opacity: 0 }}
                            animate={{
                              scale: [0, 1.2, 0],
                              rotate: [0, 180, 360],
                              opacity: [0, 1, 0],
                              y: [0, -40, -10],
                              x: [0, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 80],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="absolute pointer-events-none text-yellow-400 font-mono text-base z-20"
                          >
                            ✨
                          </motion.div>
                        );
                      } else {
                        // Tapped sparkle
                        return (
                          <motion.div
                            key={p.id}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{ scale: [0, 1.5, 0], opacity: [1, 1, 0] }}
                            transition={{ duration: 0.8 }}
                            className="absolute pointer-events-none text-rose-400 font-bold text-sm z-30"
                          >
                            🌸
                          </motion.div>
                        );
                      }
                    })}
                  </AnimatePresence>

                  {/* Floating click prompt helper */}
                  <span className="absolute bottom-1 text-[8px] text-gray-400/80 font-bold uppercase tracking-wider bg-white/40 px-2 py-0.5 rounded-full border border-white/20">
                    Click centerpiece to spawn sparkles
                  </span>
                </div>

                {/* Watering progress bar */}
                <div className="space-y-1.5 z-10">
                  <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Moisture Level</span>
                    <span>{waterLevel}%</span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all duration-700"
                      style={{ width: `${waterLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Garden action dual controllers */}
              <div className="flex gap-3 mt-4 w-full max-w-sm">
                <button
                  onClick={handleWater}
                  disabled={waterLevel >= 100 || isWateringAnim}
                  className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <Droplet className="w-4 h-4 fill-current animate-bounce" />
                  {waterLevel >= 100 ? "Fully Watered 🌱" : "Water (+20 XP)"}
                </button>
                <button
                  onClick={handlePrune}
                  disabled={isPruningAnim}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <Scissors className="w-4 h-4 text-emerald-100" />
                  Prune Centerpiece (+15 XP)
                </button>
              </div>
            </div>

            {/* Right Centerpiece Selectors Column */}
            <div className="md:col-span-5 space-y-6">
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] border-b pb-2 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-500" />
                  Centerpiece Nursery
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  The virtual plant thrives on your actions inside the bubble. Completing daily goals, writing letters, and updating status grants nourishment XP to sprout your botanical centerpiece!
                </p>

                {/* Growth Stage Metrics card */}
                <div className="p-3 bg-white/60 rounded-xl border border-dashed border-emerald-200 text-[10px] space-y-2">
                  <div className="flex justify-between font-bold text-gray-700">
                    <span>🔥 Relationship Streak:</span>
                    <span className="text-[var(--primary)] font-mono">{relationshipStreak} Days</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-700 pb-1.5 border-b border-dashed border-gray-200">
                    <span>🎯 Completed Missions:</span>
                    <span className="text-[var(--primary)] font-mono">{completedMissionsCount}</span>
                  </div>
                  <p className="font-bold text-gray-600 uppercase text-[9px] tracking-wider">Growth Milestones:</p>
                  <ul className="space-y-1 font-mono text-gray-500">
                    <li className={`flex justify-between items-center px-1.5 py-0.5 rounded ${gardenStage === "seed" ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold border border-[var(--primary)]/25" : ""}`}>
                      <span>🌰 Seed Stage:</span>
                      <span>Default</span>
                    </li>
                    <li className={`flex justify-between items-center px-1.5 py-0.5 rounded ${gardenStage === "sprout" ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold border border-[var(--primary)]/25" : ""}`}>
                      <span>🌱 Sprout Stage:</span>
                      <span>10+ Days OR 1 Mission</span>
                    </li>
                    <li className={`flex justify-between items-center px-1.5 py-0.5 rounded ${gardenStage === "budding" ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold border border-[var(--primary)]/25" : ""}`}>
                      <span>🌿 Budding Stage:</span>
                      <span>20+ Days OR 2 Missions</span>
                    </li>
                    <li className={`flex justify-between items-center px-1.5 py-0.5 rounded ${gardenStage === "bloom" ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold border border-[var(--primary)]/25" : ""}`}>
                      <span>🌸 Blooming Stage:</span>
                      <span>30+ Days OR 3+ Missions</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-2.5 pt-2">
                  {Object.entries(plantAesthetics).map(([key, details]) => {
                    const isCurrent = gardenPlant === key;
                    return (
                      <button
                        key={key}
                        onClick={() => changePlantType(key as any)}
                        className={`w-full p-3 border rounded-xl text-left transition-all ${
                          isCurrent
                            ? "border-[var(--primary)] bg-[var(--primary)]/5 font-bold"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{details.bloom}</span>
                          <div>
                            <p className="text-xs font-bold text-[var(--text-main)]">{details.title}</p>
                            <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{details.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 2: COUPLE MISSIONS */}
        {activeAdvTab === "missions" && (
          <motion.div
            key="missions"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="text-center max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Daily & Weekly Bond Challenges</h3>
              <p className="text-[10px] text-[var(--text-muted)]">
                Cultivate your attachment and level up by ticking off sweet team missions together.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
              {/* Daily block */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <h4 className="text-xs uppercase font-bold tracking-wider text-rose-500 border-b pb-2">
                  Daily Sprout Quests
                </h4>
                <div className="space-y-3">
                  {missions
                    .filter((m) => m.type === "daily")
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => toggleMission(m.id)}
                        className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          m.completed
                            ? "border-emerald-300 bg-emerald-50/40 opacity-75"
                            : "border-gray-100 bg-white/60 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg">{m.completed ? "✅" : "📌"}</span>
                          <span className={`text-xs truncate ${m.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                            {m.text}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-[var(--primary)] px-2 py-0.5 rounded-full bg-[var(--primary)]/10 flex-shrink-0">
                          +{m.xpReward} XP
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Weekly block */}
              <div className="glass-panel p-5 rounded-2xl space-y-4">
                <h4 className="text-xs uppercase font-bold tracking-wider text-indigo-500 border-b pb-2">
                  Weekly Blossom Milestones
                </h4>
                <div className="space-y-3">
                  {missions
                    .filter((m) => m.type === "weekly")
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => toggleMission(m.id)}
                        className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          m.completed
                            ? "border-emerald-300 bg-emerald-50/40 opacity-75"
                            : "border-gray-100 bg-white/60 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg">{m.completed ? "✅" : "🎯"}</span>
                          <span className={`text-xs truncate ${m.completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                            {m.text}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-[var(--primary)] px-2 py-0.5 rounded-full bg-[var(--primary)]/10 flex-shrink-0">
                          +{m.xpReward} XP
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUBTAB 3: TIME CAPSULE */}
        {activeAdvTab === "capsule" && (
          <motion.div
            key="capsule"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Locked Time Capsules</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Seal special messages to be unlocked in future years.</p>
              </div>
              <button
                onClick={() => setShowAddCapsule(!showAddCapsule)}
                className="py-2 px-4 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1 shadow"
              >
                <Plus className="w-4 h-4" /> {showAddCapsule ? "Cancel" : "Seal Capsule"}
              </button>
            </div>

            {/* CREATE TIME CAPSULE FORM */}
            {showAddCapsule && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleCreateTimeCapsule}
                className="glass-panel p-6 rounded-2xl space-y-4 max-w-xl mx-auto border-dashed border-[var(--primary)]"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] uppercase">
                  <Hourglass className="w-4.5 h-4.5 animate-spin-slow text-amber-500" />
                  Seal Future Message
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
                      Time Capsule Message
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={capsuleMsg}
                      onChange={(e) => setCapsuleMsg(e.target.value)}
                      placeholder="Write your predictions, dreams, or secret declarations for the future..."
                      className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg outline-none border border-transparent focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
                      Unlocks on Specific Date
                    </label>
                    <input
                      type="date"
                      required
                      value={capsuleUnlockDate}
                      onChange={(e) => setCapsuleUnlockDate(e.target.value)}
                      className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg outline-none border border-transparent focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                >
                  Seal Message in Time
                </button>
              </motion.form>
            )}

            {/* CAPSULES LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {timeCapsules.map((capsule) => {
                const isLocked = new Date(capsule.openDate) > new Date();

                return (
                  <motion.div
                    key={capsule.id}
                    className="bg-white/80 hover:bg-white rounded-2xl p-5 border border-[var(--border-color)] flex flex-col justify-between space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isLocked ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600 animate-float"}`}>
                          {isLocked ? <Lock className="w-4.5 h-4.5" /> : <Unlock className="w-4.5 h-4.5" />}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold font-mono text-gray-400">
                            Locked on {new Date(capsule.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs font-bold text-gray-800 mt-0.5">
                            Unlocks on: {new Date(capsule.openDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                        isLocked ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                      }`}>
                        {isLocked ? "Lock Sealed" : "Ready!"}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-color)]">
                      {isLocked ? (
                        <div className="p-4 bg-black/5 rounded-xl flex items-center justify-center gap-1 text-[11px] text-gray-400 font-mono">
                          <Lock className="w-3.5 h-3.5" /> Encrypted Content Locked
                        </div>
                      ) : capsule.isOpened ? (
                        <div className="space-y-2">
                          <p className="text-xs font-serif italic text-gray-700">"{capsule.message}"</p>
                          <p className="text-[9px] text-gray-400 text-right">
                            Sealed by {(capsule.senderId === "user_a" ? userA : userB).name}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            openTimeCapsule(capsule.id);
                            alert("Magical capsule unlocked! 🎉🎁");
                          }}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Unlock className="w-4 h-4" /> Open Sealed Message
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* SUBTAB 4: COUPLE STATISTICS */}
        {activeAdvTab === "stats" && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="text-center max-w-md mx-auto space-y-1">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Couple Activity Analytics</h3>
              <p className="text-[10px] text-[var(--text-muted)]">
                A visual dashboard representing our sweet relationship history.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-3">
              {/* Stat Card 1: Numeric KPIs */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-44">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500">Missions Record</span>
                  <Trophy className="w-4 h-4 text-rose-500" />
                </div>
                <div className="my-2">
                  <span className="text-4xl font-black font-display text-[var(--text-main)]">84%</span>
                  <span className="text-[10px] text-gray-500 block mt-1">Quest Completion Ratio</span>
                </div>
                <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: "84%" }} />
                </div>
              </div>

              {/* Stat Card 2: Interactive SVG Chart */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-44">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">Letter Sent Trends</span>
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                </div>
                {/* SVG Mini Area chart representation */}
                <div className="flex-1 flex items-end justify-between pt-4 pb-2">
                  {[20, 45, 30, 60, 50, 85].map((val, idx) => (
                    <div key={idx} className="flex flex-col items-center w-8">
                      <div
                        style={{ height: `${val / 1.5}px` }}
                        className="w-4 bg-indigo-500 rounded-t-md transition-all duration-1000 hover:bg-rose-500 cursor-pointer"
                      />
                      <span className="text-[8px] font-mono text-gray-400 mt-1">M{idx + 1}</span>
                    </div>
                  ))}
                </div>
                <span className="text-[9px] text-gray-500">Monthly Letter Volume log</span>
              </div>

              {/* Stat Card 3: Mood distributions */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-44 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">Mood Frequency</span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] text-gray-600">Cozy (☕)</span>
                    <span className="font-bold">48%</span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: "48%" }} />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[10px] text-gray-600">Loved (💖)</span>
                    <span className="font-bold">36%</span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-400 rounded-full" style={{ width: "36%" }} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
