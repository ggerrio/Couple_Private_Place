/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  Trophy,
  BarChart3,
  Sparkles,
  Award,
  TrendingUp,
  Plus,
  Flame,
  Lock,
  Clock,
  X,
  Circle,
  CheckCircle2,
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
    awardXp,
    timeCapsules,
    addTimeCapsule,
    openTimeCapsule,
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

  let petStage: "seed" | "sprout" | "budding" | "bloom" = "seed";
  if (relationshipStreak >= 30 || completedMissionsCount >= 3) {
    petStage = "bloom";
  } else if (relationshipStreak >= 20 || completedMissionsCount === 2) {
    petStage = "budding";
  } else if (relationshipStreak >= 10 || completedMissionsCount === 1) {
    petStage = "sprout";
  }

  const [activeAdvTab, setActiveAdvTab] = useState<"garden" | "missions" | "capsules" | "stats">("garden");

  // PARTICLES & INTERACTION STATE
  const [petParticles, setPetParticles] = useState<{ id: number; x: number; y: number; type: "cookie" | "sparkle" | "heart" }[]>([]);
  const [isFeedingAnim, setIsFeedingAnim] = useState(false);
  const [isPlayingAnim, setIsPlayingAnim] = useState(false);

  // Time Capsule form state
  const [showCapsuleForm, setShowCapsuleForm] = useState(false);
  const [capsuleMessage, setCapsuleMessage] = useState("");
  const [capsuleOpenDate, setCapsuleOpenDate] = useState("");
  const [capsuleError, setCapsuleError] = useState("");

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

  const handleFeed = () => {
    if (waterLevel >= 100) return;
    triggerHaptic("success");
    setIsFeedingAnim(true);

    const treats = Array.from({ length: 15 }).map((_, idx) => ({
      id: Math.random() + idx,
      x: 20 + Math.random() * 60, // percentage
      y: -20 - Math.random() * 30, // drop starting height
      type: "cookie" as const,
    }));
    setPetParticles((prev) => [...prev, ...treats]);

    waterPlant(); // feeds the pet, adding level/moisture

    setTimeout(() => {
      setPetParticles((prev) => prev.filter((p) => p.type !== "cookie"));
      setIsFeedingAnim(false);
    }, 1500);
  };

  const handlePlayWithPet = () => {
    triggerHaptic("medium");
    setIsPlayingAnim(true);

    const sparks = Array.from({ length: 12 }).map((_, idx) => ({
      id: Math.random() + idx,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      type: "sparkle" as const,
    }));
    setPetParticles((prev) => [...prev, ...sparks]);

    awardXp(15, "happily playing, cuddling and tickling their virtual companion 🎮🧸❤️");

    setTimeout(() => {
      setPetParticles((prev) => prev.filter((p) => p.type !== "sparkle"));
      setIsPlayingAnim(false);
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
      type: "heart" as const,
    };
    setPetParticles((prev) => [...prev, spark]);

    setTimeout(() => {
      setPetParticles((prev) => prev.filter((p) => p.id !== spark.id));
    }, 1000);
  };

  const handleCreateCapsule = () => {
    setCapsuleError("");
    if (!capsuleMessage.trim()) { setCapsuleError("Message is required."); return; }
    if (!capsuleOpenDate) { setCapsuleError("Open date is required."); return; }
    if (new Date(capsuleOpenDate) <= new Date()) { setCapsuleError("Open date must be in the future."); return; }
    
    addTimeCapsule({
      message: capsuleMessage.trim(),
      openDate: new Date(capsuleOpenDate).toISOString()
    });
    setCapsuleMessage("");
    setCapsuleOpenDate("");
    setShowCapsuleForm(false);
    awardXp(30, "sealing a time capsule ⏳");
  };

  const canOpenCapsule = (capsule: typeof timeCapsules[0]) => {
    if (capsule.isOpened) return false;
    return new Date(capsule.openDate) <= new Date();
  };

  // Pet Config Mapping
  const petAesthetics = {
    sakura: {
      emoji: "🐱",
      title: "Nori the Kitty",
      color: "from-rose-100 to-pink-200/50",
      textCol: "text-rose-600",
      bgBadge: "bg-rose-50 border-rose-200/50 text-rose-600",
      desc: "A warm, sleepy peach-colored cat who loves soft cuddles and milk.",
    },
    bonsai: {
      emoji: "🐶",
      title: "Mochi the Puppy",
      color: "from-amber-100 to-orange-200/50",
      textCol: "text-amber-700",
      bgBadge: "bg-amber-50 border-amber-200/50 text-amber-700",
      desc: "A playful, loyal golden pup who always wags his tail when you arrive.",
    },
    tulip: {
      emoji: "🐰",
      title: "Pippin the Bunny",
      color: "from-sky-100 to-indigo-200/50",
      textCol: "text-sky-700",
      bgBadge: "bg-sky-50 border-sky-200/50 text-sky-700",
      desc: "A bubbly, marshmallow bunny with long ears who hops with pure joy.",
    },
    sunflower: {
      emoji: "🐼",
      title: "Bao the Panda",
      color: "from-teal-100 to-emerald-200/50",
      textCol: "text-emerald-700",
      bgBadge: "bg-emerald-50 border-emerald-200/50 text-emerald-700",
      desc: "A lazy, chubby panda who loves sweet bamboo shoots and warm naps.",
    },
  };

  // Animated vector pet drawers
  const renderVectorPet = () => {
    let scale = 1.0;
    if (petStage === "seed") scale = 0.72;
    else if (petStage === "sprout") scale = 0.86;
    else if (petStage === "budding") scale = 0.98;
    else if (petStage === "bloom") scale = 1.12;

    switch (gardenPlant) {
      case "sakura": // Kitty
        return (
          <motion.g
            animate={{
              y: [0, -3, 0],
              scale: [scale, scale * 1.015, scale],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "100px 180px" }}
          >
            {/* Tail */}
            <motion.path
              d="M 122 168 Q 138 152 132 136 T 142 118"
              fill="none"
              stroke="#fda4af"
              strokeWidth="6.5"
              strokeLinecap="round"
              animate={{ rotate: [0, 12, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              style={{ transformOrigin: "122px 168px" }}
            />
            {/* Body */}
            <ellipse cx="100" cy="165" rx="32" ry="23" fill="#fff1f2" stroke="#fecdd3" strokeWidth="2" />
            {/* Chest fluffy white heart */}
            <path d="M 100 156 Q 92 148 100 164 Q 108 148 100 156 Z" fill="#ffffff" />
            
            {/* Head */}
            <circle cx="100" cy="128" r="23" fill="#fff1f2" stroke="#fecdd3" strokeWidth="2" />
            
            {/* Ears */}
            <polygon points="81,116 68,100 90,110" fill="#fff1f2" stroke="#fecdd3" strokeWidth="2" />
            <polygon points="83,114 74,104 88,110" fill="#fecdd3" />
            <polygon points="119,116 132,100 110,110" fill="#fff1f2" stroke="#fecdd3" strokeWidth="2" />
            <polygon points="117,114 126,104 112,110" fill="#fecdd3" />
            
            {/* Eyes */}
            <circle cx="91" cy="125" r="3.2" fill="#312e81" />
            <circle cx="90" cy="123.5" r="0.8" fill="#ffffff" />
            <circle cx="109" cy="125" r="3.2" fill="#312e81" />
            <circle cx="108" cy="123.5" r="0.8" fill="#ffffff" />
            
            {/* Blushing cheeks */}
            <circle cx="85" cy="132" r="2.5" fill="#fecdd3" opacity="0.8" />
            <circle cx="115" cy="132" r="2.5" fill="#fecdd3" opacity="0.8" />
            
            {/* Nose and tiny mouth */}
            <polygon points="99,130 101,130 100,131.5" fill="#f43f5e" />
            <path d="M 97 134 Q 99 136 100 134.5 Q 101 136 103 134" fill="none" stroke="#e11d48" strokeWidth="1.2" strokeLinecap="round" />
            
            {/* Whiskers */}
            <line x1="80" y1="131" x2="68" y2="129" stroke="#fda4af" strokeWidth="1.2" />
            <line x1="80" y1="134" x2="66" y2="134" stroke="#fda4af" strokeWidth="1.2" />
            <line x1="120" y1="131" x2="132" y2="129" stroke="#fda4af" strokeWidth="1.2" />
            <line x1="120" y1="134" x2="134" y2="134" stroke="#fda4af" strokeWidth="1.2" />

            {/* Paws */}
            <ellipse cx="87" cy="183" rx="6.5" ry="5" fill="#ffffff" stroke="#fecdd3" strokeWidth="1.5" />
            <ellipse cx="113" cy="183" rx="6.5" ry="5" fill="#ffffff" stroke="#fecdd3" strokeWidth="1.5" />

            {/* Accessories based on Growth Stage */}
            {petStage === "seed" && (
              <g transform="translate(100, 138)">
                <path d="M -8 -4 C -8 4 8 4 8 -4 Z" fill="#fffbeb" stroke="#fef08a" strokeWidth="1.5" />
                <circle cx="0" cy="2" r="3.5" fill="#fef08a" />
                <text x="-12" y="8" className="text-[7px] font-bold">🍼</text>
              </g>
            )}
            {petStage === "budding" && (
              <path d="M 91 144 L 100 151 L 109 144 L 105 140 L 95 140 Z" fill="#ef4444" />
            )}
            {petStage === "bloom" && (
              <motion.polygon
                points="93,101 90,89 100,95 110,89 107,101"
                fill="#f59e0b"
                stroke="#d97706"
                strokeWidth="1"
                animate={{ y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </motion.g>
        );

      case "bonsai": // Puppy
        return (
          <motion.g
            animate={{
              y: [0, -2, 0],
              scale: [scale, scale * 1.012, scale],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.8,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "100px 180px" }}
          >
            {/* Tail */}
            <motion.path
              d="M 122 170 Q 138 168 144 156"
              fill="none"
              stroke="#d97706"
              strokeWidth="6.5"
              strokeLinecap="round"
              animate={{ rotate: [-8, 14, -8] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              style={{ transformOrigin: "122px 170px" }}
            />
            {/* Body */}
            <ellipse cx="100" cy="165" rx="33" ry="24" fill="#fef3c7" stroke="#fcd34d" strokeWidth="2" />
            {/* Belly Patch */}
            <ellipse cx="100" cy="168" rx="17" ry="13" fill="#ffffff" />
            
            {/* Head */}
            <circle cx="100" cy="128" r="24" fill="#fef3c7" stroke="#fcd34d" strokeWidth="2" />
            
            {/* Floppy Ears */}
            <motion.path
              d="M 79 114 C 67 114 64 137 71 144 C 77 144 83 134 83 119 Z"
              fill="#b45309"
              stroke="#78350f"
              strokeWidth="1"
              animate={{ rotate: [0, -6, 6, 0] }}
              transition={{ repeat: Infinity, duration: 3.5 }}
              style={{ transformOrigin: "79px 114px" }}
            />
            <motion.path
              d="M 121 114 C 133 114 136 137 129 144 C 123 144 117 134 117 119 Z"
              fill="#b45309"
              stroke="#78350f"
              strokeWidth="1"
              animate={{ rotate: [0, 6, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.5 }}
              style={{ transformOrigin: "121px 114px" }}
            />
            
            {/* Eyes */}
            <circle cx="90" cy="124" r="3.2" fill="#451a03" />
            <circle cx="89" cy="122.5" r="0.8" fill="#ffffff" />
            <circle cx="110" cy="124" r="3.2" fill="#451a03" />
            <circle cx="109" cy="122.5" r="0.8" fill="#ffffff" />
            
            {/* Cute patch over left eye */}
            <path d="M 83 121 Q 91 113 95 123 Q 92 132 84 127 Z" fill="#b45309" opacity="0.18" />

            {/* Cheeks */}
            <circle cx="84" cy="132" r="2.5" fill="#fecdd3" opacity="0.8" />
            <circle cx="116" cy="132" r="2.5" fill="#fecdd3" opacity="0.8" />
            
            {/* Dog Nose & snout */}
            <ellipse cx="100" cy="131" rx="4" ry="2.5" fill="#1e293b" />
            <path d="M 100 133.5 L 100 136.5 M 97 136.5 Q 100 138.5 103 136.5" fill="none" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" />

            {/* Paws */}
            <ellipse cx="87" cy="183" rx="6.5" ry="5.5" fill="#ffffff" stroke="#fcd34d" strokeWidth="1.5" />
            <ellipse cx="113" cy="183" rx="6.5" ry="5.5" fill="#ffffff" stroke="#fcd34d" strokeWidth="1.5" />

            {/* Accessories based on Growth Stage */}
            {petStage === "seed" && (
              <g transform="translate(100, 138)">
                <path d="M -8 -4 C -8 4 8 4 8 -4 Z" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1.5" />
                <circle cx="0" cy="2" r="3.5" fill="#a7f3d0" />
                <text x="-12" y="8" className="text-[7px] font-bold">🍼</text>
              </g>
            )}
            {petStage === "budding" && (
              <path d="M 91 144 L 100 151 L 109 144 L 105 140 L 95 140 Z" fill="#3b82f6" />
            )}
            {petStage === "bloom" && (
              <motion.g
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <ellipse cx="100" cy="93" rx="14" ry="4" fill="none" stroke="#fbbf24" strokeWidth="2" />
                <polygon points="100,86 101,89 104,89 102,91 103,94 100,92 97,94 98,91 96,89 99,89" fill="#fbbf24" />
              </motion.g>
            )}
          </motion.g>
        );

      case "tulip": // Bunny
        return (
          <motion.g
            animate={{
              y: [0, -4, 0],
              scale: [scale, scale * 1.02, scale],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "100px 180px" }}
          >
            {/* Tail */}
            <circle cx="70" cy="170" r="7" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
            
            {/* Body */}
            <ellipse cx="100" cy="165" rx="30" ry="23" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
            
            {/* Head */}
            <circle cx="100" cy="126" r="22" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
            
            {/* Bunny Ears */}
            <motion.g
              animate={{ rotate: [0, -6, 4, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              style={{ transformOrigin: "89px 106px" }}
            >
              <path d="M 85 108 C 74 78 82 60 90 60 C 96 60 96 78 92 108 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
              <path d="M 87 106 C 81 83 85 68 90 68 C 93 68 93 83 91 106 Z" fill="#fecdd3" />
            </motion.g>
            <motion.g
              animate={{ rotate: [0, 6, -4, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              style={{ transformOrigin: "111px 106px" }}
            >
              <path d="M 115 108 C 126 78 118 60 110 60 C 104 60 104 78 108 108 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
              <path d="M 113 106 C 119 83 115 68 110 68 C 107 68 107 83 109 106 Z" fill="#fecdd3" />
            </motion.g>
            
            {/* Eyes */}
            <circle cx="91" cy="123" r="3" fill="#ec4899" />
            <circle cx="90" cy="121.5" r="0.8" fill="#ffffff" />
            <circle cx="109" cy="123" r="3" fill="#ec4899" />
            <circle cx="108" cy="121.5" r="0.8" fill="#ffffff" />
            
            {/* Cheeks */}
            <circle cx="84" cy="129" r="2.5" fill="#fda4af" opacity="0.8" />
            <circle cx="116" cy="129" r="2.5" fill="#fda4af" opacity="0.8" />
            
            {/* Nose/Mouth */}
            <polygon points="98.5,126 101.5,126 100,127.5" fill="#f43f5e" />
            <path d="M 98 129.5 Q 100 131.5 102 129.5" fill="none" stroke="#e11d48" strokeWidth="1" strokeLinecap="round" />

            {/* Paws */}
            <ellipse cx="89" cy="182" rx="5.5" ry="4.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            <ellipse cx="111" cy="182" rx="5.5" ry="4.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* Accessories based on Growth Stage */}
            {petStage === "seed" && (
              <g transform="translate(100, 134)">
                <path d="M -8 -4 C -8 4 8 4 8 -4 Z" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
                <circle cx="0" cy="2" r="3.5" fill="#bbf7d0" />
                <text x="-12" y="8" className="text-[7px] font-bold">🍼</text>
              </g>
            )}
            {petStage === "budding" && (
              <path d="M 92 142 L 100 148 L 108 142 L 104 138 L 96 138 Z" fill="#8b5cf6" />
            )}
            {petStage === "bloom" && (
              <motion.polygon
                points="100,43 102,47 106,48 103,51 104,55 100,53 96,55 97,51 94,48 98,47"
                fill="#fbbf24"
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </motion.g>
        );

      case "sunflower": // Panda
        return (
          <motion.g
            animate={{
              y: [0, -1.5, 0],
              scale: [scale, scale * 1.008, scale],
            }}
            transition={{
              repeat: Infinity,
              duration: 3.5,
              ease: "easeInOut",
            }}
            style={{ transformOrigin: "100px 180px" }}
          >
            {/* Short tail */}
            <circle cx="73" cy="170" r="5.5" fill="#1e293b" />

            {/* Body */}
            <ellipse cx="100" cy="165" rx="34" ry="25" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
            {/* Chubby tummy patch */}
            <ellipse cx="100" cy="167" rx="19" ry="15" fill="#f1f5f9" />
            {/* Black shoulder band / arms */}
            <path d="M 70 151 C 63 156 66 176 72 176 C 78 176 80 156 70 151 Z" fill="#1e293b" />
            <path d="M 130 151 C 137 156 134 176 128 176 C 122 176 120 156 130 151 Z" fill="#1e293b" />

            {/* Head */}
            <circle cx="100" cy="126" r="23" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />

            {/* Black Panda Ears */}
            <circle cx="80" cy="107" r="6.5" fill="#1e293b" />
            <circle cx="80" cy="107" r="4" fill="#0f172a" />
            <circle cx="120" cy="107" r="6.5" fill="#1e293b" />
            <circle cx="120" cy="107" r="4" fill="#0f172a" />

            {/* Black patches around eyes */}
            <ellipse cx="90" cy="125" rx="5" ry="7" fill="#1e293b" transform="rotate(-15, 90, 125)" />
            <ellipse cx="110" cy="125" rx="5" ry="7" fill="#1e293b" transform="rotate(15, 110, 125)" />

            {/* Shiny eyes */}
            <circle cx="91" cy="124" r="2.5" fill="#ffffff" />
            <circle cx="92" cy="123" r="0.8" fill="#1e293b" />
            <circle cx="109" cy="124" r="2.5" fill="#ffffff" />
            <circle cx="108" cy="123" r="0.8" fill="#1e293b" />

            {/* Cheeks */}
            <circle cx="83" cy="132" r="2" fill="#fecdd3" opacity="0.8" />
            <circle cx="117" cy="132" r="2" fill="#fecdd3" opacity="0.8" />

            {/* Nose */}
            <ellipse cx="100" cy="129" rx="3.2" ry="1.9" fill="#0f172a" />
            <path d="M 98 132 Q 100 133.5 102 132" fill="none" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />

            {/* Paws */}
            <ellipse cx="85" cy="183" rx="7.5" ry="5.5" fill="#1e293b" />
            <ellipse cx="115" cy="183" rx="7.5" ry="5.5" fill="#1e293b" />

            {/* Accessories based on Growth Stage */}
            {petStage === "seed" && (
              <g transform="translate(100, 134)">
                <path d="M -8 -4 C -8 4 8 4 8 -4 Z" fill="#fef2f2" stroke="#fecdd3" strokeWidth="1.5" />
                <circle cx="0" cy="2" r="3.5" fill="#fecdd3" />
                <text x="-12" y="8" className="text-[7px] font-bold">🍼</text>
              </g>
            )}
            {petStage === "budding" && (
              <path d="M 100 102 Q 92 98 100 90 Q 108 98 100 102" fill="#22c55e" />
            )}
            {petStage === "bloom" && (
              <motion.g
                animate={{ y: [0, -4, 0], rotate: [0, 2, -2, 0] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
              >
                <line x1="124" y1="138" x2="135" y2="103" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1,1" />
                <path d="M 135 103 Q 128 95 135 89 Q 142 95 135 103 Z" fill="#ef4444" />
              </motion.g>
            )}
          </motion.g>
        );

      default:
        return null;
    }
  };

  const renderPetRug = () => {
    return (
      <g id="pet-rug">
        {/* Soft Shadow */}
        <ellipse cx="100" cy="198" rx="55" ry="11" fill="#000000" opacity="0.06" />
        {/* Cozy Rug */}
        <ellipse cx="100" cy="196" rx="48" ry="9" fill="#fff5f5" stroke="#fecdd3" strokeWidth="1.5" />
        {/* Fringe details */}
        <line x1="49" y1="196" x2="45" y2="198" stroke="#fca5a5" strokeWidth="1.5" />
        <line x1="151" y1="196" x2="155" y2="198" stroke="#fca5a5" strokeWidth="1.5" />
      </g>
    );
  };

  const currentPetConfig = petAesthetics[gardenPlant] || petAesthetics.sakura;

  return (
    <div className="space-y-6" id="adventure-hub">
      {/* 4-Tab Swapper */}
      <div className="flex justify-center border-b border-[var(--border-color)] pb-1">
        <div className="flex gap-6 overflow-x-auto pr-1">
          {[
            { value: "garden", label: "Virtual Pet", icon: Heart },
            { value: "missions", label: "Bond Missions", icon: Trophy },
            { value: "capsules", label: "Time Capsules", icon: Lock },
            { value: "stats", label: "Activity Stats", icon: BarChart3 },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isSel = activeAdvTab === tab.value;
            return (
              <button
                key={tab.value}
                id={`adventure-tab-${tab.value}`}
                onClick={() => setActiveAdvTab(tab.value as any)}
                className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer ${
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
        {/* SUBTAB 1: VIRTUAL PET */}
        {activeAdvTab === "garden" && (
          <motion.div
            key="garden"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left Pet interactive view */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="relative w-full max-w-md h-[400px] bg-white/40 border border-white rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.03)] flex flex-col justify-between p-6 overflow-hidden backdrop-blur-md">
                
                {/* Level Tag */}
                <div className="flex justify-between items-center z-10 w-full">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold bg-rose-50 border border-rose-100/50 text-rose-600 px-3 py-1 rounded-full font-mono uppercase flex items-center gap-1 shadow-xs w-fit">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400 animate-spin-slow" /> Level {gardenLevel} {currentPetConfig.title.toUpperCase()}
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-50 border border-emerald-100/50 text-emerald-700 px-3 py-1 rounded-full font-mono uppercase flex items-center gap-1 shadow-xs w-fit">
                      ❤️ {petStage === "seed" ? "BABY 🍼" : petStage === "sprout" ? "TODDLER 🧸" : petStage === "budding" ? "TEENAGER 🎒" : "COMPANION 👑"} STAGE
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono font-bold bg-white/60 px-2.5 py-1 rounded-full border border-white/40 self-start">
                    XP: {gardenXp} / {gardenLevel * 100}
                  </span>
                </div>

                {/* Animated Growing Pet Vector Canvas */}
                <div className="flex flex-col items-center justify-center relative flex-1">
                  {/* Sun glow backdrops */}
                  <div className="absolute w-44 h-44 bg-gradient-to-tr from-rose-200/20 to-amber-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                  
                  {/* Main SVG Pet canvas */}
                  <svg
                    viewBox="0 0 200 240"
                    className="w-56 h-64 z-10 cursor-pointer select-none"
                    onClick={triggerInteractiveSparkle}
                  >
                    {renderPetRug()}
                    {renderVectorPet()}
                  </svg>

                  {/* Render Particle animations */}
                  <AnimatePresence>
                    {petParticles.map((p) => {
                      if (p.type === "cookie") {
                        return (
                          <motion.div
                            key={p.id}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            initial={{ y: -20, opacity: 0, scale: 0.5 }}
                            animate={{ y: 240, opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.4] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2, ease: "easeIn" }}
                            className="absolute pointer-events-none text-amber-600 z-20 text-xs drop-shadow-sm select-none"
                          >
                            🍪
                          </motion.div>
                        );
                      } else if (p.type === "sparkle") {
                        return (
                          <motion.div
                            key={p.id}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            initial={{ scale: 0, rotate: 0, opacity: 0 }}
                            animate={{
                              scale: [0, 1.3, 0],
                              rotate: [0, 180, 360],
                              opacity: [0, 1, 0],
                              y: [0, -35, -5],
                              x: [0, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 90],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="absolute pointer-events-none text-yellow-400 font-mono text-base z-20"
                          >
                            ✨
                          </motion.div>
                        );
                      } else {
                        // Tapped heart sparkle
                        return (
                          <motion.div
                            key={p.id}
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            initial={{ scale: 0, opacity: 1, y: 0 }}
                            animate={{ scale: [0, 1.6, 0], opacity: [1, 1, 0], y: -30 }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            className="absolute pointer-events-none text-rose-500 font-bold text-sm z-30"
                          >
                            💖
                          </motion.div>
                        );
                      }
                    })}
                  </AnimatePresence>

                  {/* Floating click prompt helper */}
                  <span className="absolute bottom-1 text-[8.5px] text-rose-400 font-bold uppercase tracking-wider bg-rose-50/50 px-3 py-1 rounded-full border border-rose-100/30">
                    Tap pet to shower with 💖 love
                  </span>
                </div>

                {/* Energy/Happiness progress bar */}
                <div className="space-y-1.5 z-10">
                  <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                    <span>Pet Happiness & Energy</span>
                    <span>{waterLevel}%</span>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-700"
                      style={{ width: `${waterLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Pet action controllers */}
              <div className="flex gap-4 mt-4 w-full max-w-md">
                <button
                  id="water-plant-btn"
                  onClick={handleFeed}
                  disabled={waterLevel >= 100 || isFeedingAnim}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <span>🍪</span>
                  {waterLevel >= 100 ? "Fully Fed & Happy!" : "Feed Snack (+20 XP)"}
                </button>
                <button
                  onClick={handlePlayWithPet}
                  disabled={isPlayingAnim}
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                  Tickle & Play (+15 XP)
                </button>
              </div>
            </div>

            {/* Right Pet Nursery Selector Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white/40 border border-neutral-200/40 p-8 rounded-[32px] space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] border-b pb-2 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Pet Nursery & Playpen
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Your adorable virtual pet grows stronger and happier with every romantic milestone you share. Completing bond missions, writing letters, and updating status awards XP to mature your little companion!
                </p>

                {/* Growth Stage Metrics card */}
                <div className="p-4 bg-white/60 rounded-2xl border border-dashed border-rose-200 text-[10px] space-y-2.5">
                  <div className="flex justify-between font-bold text-gray-700">
                    <span>🔥 Relationship Streak:</span>
                    <span className="text-rose-600 font-mono">{relationshipStreak} Days</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-700 pb-2 border-b border-dashed border-gray-200">
                    <span>🎯 Completed Missions:</span>
                    <span className="text-rose-600 font-mono">{completedMissionsCount}</span>
                  </div>
                  <p className="font-bold text-gray-600 uppercase text-[9px] tracking-wider">Growth Milestones:</p>
                  <ul className="space-y-1.5 font-mono text-gray-500">
                    <li className={`flex justify-between items-center px-2 py-1 rounded-lg ${petStage === "seed" ? "bg-rose-50 text-rose-800 font-bold border border-rose-100" : ""}`}>
                      <span>👶 Baby Stage 🍼:</span>
                      <span>Default</span>
                    </li>
                    <li className={`flex justify-between items-center px-2 py-1 rounded-lg ${petStage === "sprout" ? "bg-rose-50 text-rose-800 font-bold border border-rose-100" : ""}`}>
                      <span>🧸 Toddler Stage 🎒:</span>
                      <span>10+ Days OR 1 Mission</span>
                    </li>
                    <li className={`flex justify-between items-center px-2 py-1 rounded-lg ${petStage === "budding" ? "bg-rose-50 text-rose-800 font-bold border border-rose-100" : ""}`}>
                      <span>🎒 Teenager Stage 🧢:</span>
                      <span>20+ Days OR 2 Missions</span>
                    </li>
                    <li className={`flex justify-between items-center px-2 py-1 rounded-lg ${petStage === "bloom" ? "bg-rose-50 text-rose-800 font-bold border border-rose-100" : ""}`}>
                      <span>👑 Companion Stage 🏆:</span>
                      <span>30+ Days OR 3+ Missions</span>
                    </li>
                  </ul>
                </div>

                {/* Pet Selectors list */}
                <div className="space-y-3 pt-2">
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">Select Pet Companion:</p>
                  {Object.entries(petAesthetics).map(([key, details]) => {
                    const isCurrent = gardenPlant === key;
                    return (
                      <button
                        key={key}
                        id={`plant-type-${key}`}
                        onClick={() => changePlantType(key as any)}
                        className={`w-full p-3 border rounded-2xl text-left transition-all cursor-pointer ${
                          isCurrent
                            ? "border-rose-300 bg-rose-50/50 font-bold shadow-xs"
                            : "border-gray-100 bg-white/40 hover:bg-white/70"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{details.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--text-main)]">{details.title}</p>
                            <p className="text-[9px] text-[var(--text-muted)] mt-0.5 truncate">{details.desc}</p>
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
              <div className="bg-white/40 border border-neutral-200/40 p-8 rounded-[32px] space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md">
                <h4 className="text-xs uppercase font-bold tracking-wider text-rose-500 border-b pb-2 flex items-center gap-1.5">
                  <span className="text-base">📅</span> Daily Sprout Quests
                </h4>
                <div className="space-y-3">
                  {missions
                    .filter((m) => m.type === "daily")
                    .map((m) => (
                      <div
                        key={m.id}
                        id={`mission-${m.id}`}
                        onClick={() => toggleMission(m.id)}
                        className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          m.completed
                            ? "border-emerald-200 bg-emerald-50/40 opacity-75"
                            : "border-gray-100 bg-white/60 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg">{m.completed ? "✅" : "📌"}</span>
                          <span className={`text-xs truncate ${m.completed ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
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
              <div className="bg-white/40 border border-neutral-200/40 p-8 rounded-[32px] space-y-4 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md">
                <h4 className="text-xs uppercase font-bold tracking-wider text-indigo-500 border-b pb-2 flex items-center gap-1.5">
                  <span className="text-base">🎯</span> Weekly Blossom Milestones
                </h4>
                <div className="space-y-3">
                  {missions
                    .filter((m) => m.type === "weekly")
                    .map((m) => (
                      <div
                        key={m.id}
                        id={`mission-${m.id}`}
                        onClick={() => toggleMission(m.id)}
                        className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          m.completed
                            ? "border-emerald-200 bg-emerald-50/40 opacity-75"
                            : "border-gray-100 bg-white/60 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg">{m.completed ? "✅" : "🎯"}</span>
                          <span className={`text-xs truncate ${m.completed ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
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

        {/* SUBTAB 3: TIME CAPSULES */}
        {activeAdvTab === "capsules" && (
          <motion.div
            key="capsules"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Time Capsule Vault</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  Seal secret letters, memories or promises to be opened on a specific date in the future.
                </p>
              </div>
              <button
                id="add-capsule-btn"
                onClick={() => setShowCapsuleForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-2xl hover:opacity-90 cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                <Plus className="w-3.5 h-3.5" /> Seal One
              </button>
            </div>

            {/* Form modal */}
            <AnimatePresence>
              {showCapsuleForm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9 }}
                    className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl border border-neutral-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--primary)]" />
                        <h4 className="font-bold text-gray-800 text-sm">Seal a Time Capsule</h4>
                      </div>
                      <button
                        onClick={() => setShowCapsuleForm(false)}
                        className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <textarea
                      value={capsuleMessage}
                      onChange={(e) => setCapsuleMessage(e.target.value)}
                      placeholder="Write a message to your future selves..."
                      rows={5}
                      className="w-full text-xs px-3.5 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[var(--primary)] transition-colors resize-none"
                    />
                    
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Reveal date (must be in the future)</p>
                      <input
                        type="datetime-local"
                        value={capsuleOpenDate}
                        onChange={(e) => setCapsuleOpenDate(e.target.value)}
                        min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                        className="w-full text-xs px-3.5 py-3 border border-gray-200 rounded-2xl outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
                      />
                    </div>
                    
                    {capsuleError && <p className="text-xs text-red-500">{capsuleError}</p>}
                    
                    <button
                      onClick={handleCreateCapsule}
                      className="w-full py-3 bg-[var(--primary)] text-white font-bold rounded-2xl text-xs hover:opacity-90 cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                    >
                      Seal Capsule
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {timeCapsules.length === 0 && (
              <div className="text-center py-16 bg-white/40 border border-neutral-200/40 rounded-[32px] backdrop-blur-md">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30 text-[var(--primary)]" />
                <p className="text-xs font-medium text-[var(--text-muted)]">No time capsules sealed yet. Leave a message for your future selves! ⏳</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {timeCapsules.map((capsule) => {
                const creator = capsule.senderId === "user_a" ? userA : userB;
                const unlockable = canOpenCapsule(capsule);
                const locked = !capsule.isOpened && !unlockable;
                const daysLeft = Math.ceil((new Date(capsule.openDate).getTime() - Date.now()) / 86400000);

                return (
                  <div
                    key={capsule.id}
                    className={`bg-white/40 border p-6 rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-200 hover:shadow-md ${
                      capsule.isOpened
                        ? "border-emerald-200 bg-emerald-50/10"
                        : locked
                        ? "border-neutral-200/40"
                        : "border-amber-300 bg-amber-50/20"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl shadow-xs ${
                          capsule.isOpened
                            ? "bg-emerald-100 text-emerald-700"
                            : locked
                            ? "bg-slate-100 text-slate-500"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {capsule.isOpened ? "📬" : locked ? <Lock className="w-5 h-5" /> : "🔓"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={creator.avatar}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover border border-white shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[10px] font-bold text-[var(--text-muted)]">From {creator.name.split(" ")[0]}</span>
                        </div>
                        {capsule.isOpened ? (
                          <p className="text-xs text-[var(--text-main)] leading-relaxed bg-white/50 p-3 rounded-2xl border border-emerald-100/50">{capsule.message}</p>
                        ) : locked ? (
                          <div className="space-y-1">
                            <p className="text-xs text-[var(--text-muted)] font-bold">Sealed until {new Date(capsule.openDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                            {daysLeft > 0 && <p className="text-[9px] text-[var(--text-muted)] font-mono uppercase bg-neutral-100 px-2.5 py-0.5 rounded-full w-fit">{daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</p>}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-amber-700 font-bold">This capsule is ready to be opened!</p>
                            <button
                              id={`open-capsule-${capsule.id}`}
                              onClick={() => openTimeCapsule(capsule.id)}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                            >
                              Open Capsule
                            </button>
                          </div>
                        )}
                        <p className="text-[8.5px] text-[var(--text-muted)] font-mono mt-3.5 block">Sealed on {new Date(capsule.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
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
              <div className="bg-white/40 border border-neutral-200/40 p-6 rounded-[28px] flex flex-col justify-between h-44 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md">
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
              <div className="bg-white/40 border border-neutral-200/40 p-6 rounded-[28px] flex flex-col justify-between h-44 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md">
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
              <div className="bg-white/40 border border-neutral-200/40 p-6 rounded-[28px] flex flex-col justify-between h-44 sm:col-span-2 lg:col-span-1 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md">
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
