/**
 * AdventureView.tsx — rebuilt from zero.
 *
 * Fixes:
 *  - Garden SVG plant stages rendered declaratively from React state (no DOM imperative mutations)
 *    stage = Math.min(Math.floor(gardenLevel / 2), 3) → 0=seed, 1=sprout, 2=budding, 3=bloom
 *  - Time capsule openDate strictly validated > now() before save
 */

import React, { useState } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Sprout, Target, Lock, Clock, Plus, X, CheckCircle, Circle,
  Droplets, Flower2, TreePine,
} from "lucide-react";

type Section = "garden" | "missions" | "capsules";

export default function AdventureView() {
  const [section, setSection] = useState<Section>("garden");

  return (
    <div className="space-y-4 py-2">
      <div className="glass-panel rounded-2xl p-1.5 flex gap-1">
        {([["garden", "Garden", Sprout], ["missions", "Missions", Target], ["capsules", "Capsules", Lock]] as const).map(([id, label, Icon]) => (
          <button key={id} id={`adventure-tab-${id}`} onClick={() => setSection(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${section === id ? "bg-[var(--primary)] text-white shadow" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {section === "garden" && <GardenSection key="garden" />}
        {section === "missions" && <MissionsSection key="missions" />}
        {section === "capsules" && <CapsulesSection key="capsules" />}
      </AnimatePresence>
    </div>
  );
}

// ─── Plant SVG stages ─────────────────────────────────────────────────────────
// Purely declarative — stage derived from gardenLevel; no DOM mutations

function PlantSvg({ stage, plant }: { stage: number; plant: string }) {
  const colors: Record<string, { stem: string; flower: string; leaf: string }> = {
    sakura: { stem: "#5d4037", flower: "#f9a8d4", leaf: "#86efac" },
    tulip: { stem: "#4caf50", flower: "#ef4444", leaf: "#22c55e" },
    bonsai: { stem: "#6d4c41", flower: "#fbbf24", leaf: "#16a34a" },
    sunflower: { stem: "#65a30d", flower: "#fde047", leaf: "#4ade80" },
  };
  const c = colors[plant] || colors.sakura;

  return (
    <svg viewBox="0 0 200 220" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Pot */}
      <path d="M70 200 Q100 215 130 200 L125 180 Q100 190 75 180 Z" fill="#8d6e63" />
      <rect x="65" y="175" width="70" height="10" rx="5" fill="#a1887f" />

      {/* Stem — grows by stage */}
      {stage >= 1 && <line x1="100" y1="175" x2="100" y2={175 - stage * 30} stroke={c.stem} strokeWidth={stage >= 2 ? 5 : 3} strokeLinecap="round" />}

      {/* Seed stage */}
      {stage === 0 && (
        <ellipse cx="100" cy="170" rx="10" ry="6" fill="#a1887f" />
      )}

      {/* Sprout stage — small leaves */}
      {stage >= 1 && (
        <>
          <ellipse cx="88" cy="145" rx="12" ry="6" fill={c.leaf} transform="rotate(-30 88 145)" />
          <ellipse cx="112" cy="145" rx="12" ry="6" fill={c.leaf} transform="rotate(30 112 145)" />
        </>
      )}

      {/* Budding stage — more leaves + bud */}
      {stage >= 2 && (
        <>
          <ellipse cx="82" cy="120" rx="14" ry="7" fill={c.leaf} transform="rotate(-40 82 120)" />
          <ellipse cx="118" cy="120" rx="14" ry="7" fill={c.leaf} transform="rotate(40 118 120)" />
          <circle cx="100" cy={175 - stage * 30} r="8" fill={c.flower} opacity="0.7" />
        </>
      )}

      {/* Bloom stage — full flower */}
      {stage >= 3 && (
        <>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <ellipse
              key={angle}
              cx={100 + 16 * Math.cos((angle * Math.PI) / 180)}
              cy={(175 - stage * 30) + 16 * Math.sin((angle * Math.PI) / 180)}
              rx="9" ry="5"
              fill={c.flower}
              transform={`rotate(${angle} ${100 + 16 * Math.cos((angle * Math.PI) / 180)} ${(175 - stage * 30) + 16 * Math.sin((angle * Math.PI) / 180)})`}
            />
          ))}
          <circle cx="100" cy={175 - stage * 30} r="12" fill={c.flower} />
          <circle cx="100" cy={175 - stage * 30} r="6" fill="#fde047" />
          {/* Sparkles */}
          <text x="78" y="75" fontSize="16" className="animate-float">✨</text>
          <text x="112" y="70" fontSize="12" className="animate-float">🌟</text>
        </>
      )}
    </svg>
  );
}

// ─── Garden ───────────────────────────────────────────────────────────────────

const PLANT_TYPES: ("tulip" | "bonsai" | "sakura" | "sunflower")[] = ["sakura", "tulip", "bonsai", "sunflower"];
const STAGE_LABELS = ["🌱 Seed", "🌿 Sprout", "🌸 Budding", "💐 Bloom"];

function GardenSection() {
  const { gardenXp, gardenLevel, gardenPlant, waterLevel, waterPlant, changePlantType } = useCouple();

  // Derive stage mathematically from level — no imperative DOM mutations
  const stage = Math.min(Math.floor(gardenLevel / 2), 3);
  const xpToNext = gardenLevel * 100;
  const xpPct = Math.min(Math.round((gardenXp / xpToNext) * 100), 100);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      {/* Garden display */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-200 to-transparent" />
        </div>
        <div className="relative flex flex-col items-center gap-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-center">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Stage</p>
              <p className="text-sm font-bold text-[var(--primary)]">{STAGE_LABELS[stage]}</p>
            </div>
            <div className="w-36 h-36">
              <PlantSvg stage={stage} plant={gardenPlant} />
            </div>
            <div className="text-center">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Level</p>
              <p className="text-2xl font-black text-[var(--primary)]">{gardenLevel}</p>
            </div>
          </div>

          {/* XP bar */}
          <div className="w-full">
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
              <span>{gardenXp} XP</span>
              <span>Next: {xpToNext} XP</span>
            </div>
            <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--primary)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Water level */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] text-[var(--text-muted)]">Water Level</span>
              </div>
              <span className="text-[10px] font-mono text-blue-500">{waterLevel}%</span>
            </div>
            <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${waterLevel}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>

          <button id="water-plant-btn" onClick={waterPlant} className="flex items-center gap-2 px-6 py-2.5 bg-blue-400 text-white font-bold rounded-2xl text-sm hover:bg-blue-500 transition-colors hover:scale-105 active:scale-95">
            <Droplets className="w-4 h-4" /> Water Plant (+20% • +20XP)
          </button>
        </div>
      </div>

      {/* Plant selector */}
      <div className="glass-panel rounded-2xl p-4">
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Choose Your Plant</p>
        <div className="grid grid-cols-4 gap-2">
          {PLANT_TYPES.map((p) => (
            <button key={p} id={`plant-type-${p}`} onClick={() => changePlantType(p)}
              className={`p-3 rounded-xl text-center border-2 transition-all hover:scale-105 ${gardenPlant === p ? "border-[var(--primary)] bg-[var(--primary)]/10" : "border-transparent bg-white/30"}`}>
              <span className="text-2xl block">{p === "sakura" ? "🌸" : p === "tulip" ? "🌷" : p === "bonsai" ? "🌳" : "🌻"}</span>
              <span className="text-[9px] font-semibold capitalize text-[var(--text-muted)] mt-1 block">{p}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Growth guide */}
      <div className="glass-panel rounded-2xl p-4">
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">Growth Guide</p>
        <div className="grid grid-cols-2 gap-2">
          {STAGE_LABELS.map((label, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-xl ${stage === i ? "bg-[var(--primary)]/10 border border-[var(--primary)]/20" : ""}`}>
              <span className="text-base">{label.split(" ")[0]}</span>
              <div>
                <p className="text-[10px] font-bold text-[var(--text-main)]">{label.split(" ").slice(1).join(" ")}</p>
                <p className="text-[9px] text-[var(--text-muted)]">Level {i * 2}–{i * 2 + 1}</p>
              </div>
              {stage > i && <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Missions ─────────────────────────────────────────────────────────────────

function MissionsSection() {
  const { missions, toggleMission } = useCouple();
  const daily = missions.filter((m) => m.type === "daily");
  const weekly = missions.filter((m) => m.type === "weekly");

  const completedDaily = daily.filter((m) => m.completed).length;
  const completedWeekly = weekly.filter((m) => m.completed).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      {/* Progress overview */}
      <div className="glass-panel rounded-2xl p-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-2xl font-black text-[var(--primary)]">{completedDaily}/{daily.length}</p>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Daily Done</p>
          <div className="w-full h-1.5 bg-black/5 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: daily.length > 0 ? `${(completedDaily / daily.length) * 100}%` : "0%" }} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-[var(--primary)]">{completedWeekly}/{weekly.length}</p>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Weekly Done</p>
          <div className="w-full h-1.5 bg-black/5 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: weekly.length > 0 ? `${(completedWeekly / weekly.length) * 100}%` : "0%" }} />
          </div>
        </div>
      </div>

      {/* Daily missions */}
      {daily.length > 0 && (
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Daily Missions</p>
          <div className="space-y-2">
            {daily.map((m) => (
              <motion.button
                key={m.id}
                id={`mission-${m.id}`}
                onClick={() => toggleMission(m.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full glass-panel rounded-xl p-3 flex items-center gap-3 transition-all text-left ${m.completed ? "opacity-60" : "hover:shadow-md"}`}
              >
                {m.completed
                  ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  : <Circle className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${m.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-main)]"}`}>{m.text}</p>
                </div>
                <span className="text-[10px] font-bold text-[var(--primary)] flex-shrink-0">+{m.xpReward} XP</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Weekly missions */}
      {weekly.length > 0 && (
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Weekly Challenges</p>
          <div className="space-y-2">
            {weekly.map((m) => (
              <motion.button
                key={m.id}
                id={`mission-${m.id}`}
                onClick={() => toggleMission(m.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full glass-panel rounded-xl p-3 flex items-center gap-3 transition-all text-left border-l-4 border-purple-400 ${m.completed ? "opacity-60" : "hover:shadow-md"}`}
              >
                {m.completed
                  ? <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  : <Circle className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${m.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-main)]"}`}>{m.text}</p>
                </div>
                <span className="text-[10px] font-bold text-purple-600 flex-shrink-0">+{m.xpReward} XP</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Time Capsules ────────────────────────────────────────────────────────────

function CapsulesSection() {
  const { timeCapsules, addTimeCapsule, openTimeCapsule, currentUser, userA, userB } = useCouple();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    setError("");
    if (!message.trim()) { setError("Message is required."); return; }
    if (!openDate) { setError("Open date is required."); return; }
    if (new Date(openDate) <= new Date()) { setError("Open date must be in the future."); return; }
    addTimeCapsule({ message: message.trim(), openDate: new Date(openDate).toISOString() });
    setMessage("");
    setOpenDate("");
    setShowForm(false);
  };

  const canOpen = (capsule: typeof timeCapsules[0]) => {
    if (capsule.isOpened) return false;
    return new Date(capsule.openDate) <= new Date();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-main)]">Time Capsule Vault</h3>
        <button id="add-capsule-btn" onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:opacity-90">
          <Plus className="w-3.5 h-3.5" /> Seal One
        </button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-3 shadow-2xl">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-800">⏳ Seal a Time Capsule</h4>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
              </div>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message to your future selves..." rows={5} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none resize-none" />
              <div>
                <p className="text-[10px] text-gray-400 mb-1">Reveal date (must be in the future)</p>
                <input type="datetime-local" value={openDate} onChange={(e) => setOpenDate(e.target.value)} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} className="w-full text-sm px-3 py-2 border border-gray-200 rounded-xl outline-none" />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={handleCreate} className="w-full py-2.5 bg-[var(--primary)] text-white font-bold rounded-xl text-sm hover:opacity-90">
                Seal Capsule 🔒
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {timeCapsules.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No time capsules sealed yet. Leave a message for your future selves! ⏳</p>
        </div>
      )}

      {timeCapsules.map((capsule) => {
        const creator = capsule.senderId === "user_a" ? userA : userB;
        const unlockable = canOpen(capsule);
        const locked = !capsule.isOpened && !unlockable;
        const daysLeft = Math.ceil((new Date(capsule.openDate).getTime() - Date.now()) / 86400000);

        return (
          <div key={capsule.id} className={`glass-panel rounded-2xl p-4 border-2 ${capsule.isOpened ? "border-green-200 bg-green-50/30" : locked ? "border-[var(--border-color)]" : "border-amber-300 bg-amber-50/30"}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${capsule.isOpened ? "bg-green-100" : locked ? "bg-gray-100" : "bg-amber-100"}`}>
                {capsule.isOpened ? "📬" : locked ? <Lock className="w-4 h-4 text-gray-400" /> : "🔓"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <img src={creator.avatar} alt="" className="w-4 h-4 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <span className="text-[10px] text-[var(--text-muted)]">From {creator.name.split(" ")[0]}</span>
                </div>
                {capsule.isOpened ? (
                  <p className="text-xs text-[var(--text-main)] leading-relaxed">{capsule.message}</p>
                ) : locked ? (
                  <div>
                    <p className="text-xs text-[var(--text-muted)] font-semibold">Sealed until {new Date(capsule.openDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                    {daysLeft > 0 && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</p>}
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-amber-700 font-semibold mb-2">🎁 This capsule is ready to be opened!</p>
                    <button id={`open-capsule-${capsule.id}`} onClick={() => openTimeCapsule(capsule.id)} className="px-4 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors">
                      Open Capsule ✨
                    </button>
                  </div>
                )}
                <p className="text-[9px] text-[var(--text-muted)] font-mono mt-1.5">Created {new Date(capsule.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
