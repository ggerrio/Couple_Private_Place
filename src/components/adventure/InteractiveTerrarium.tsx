/**
 * InteractiveTerrarium.tsx — 🌿 Interactive Terrarium
 *
 * A peaceful, living terrarium scene that changes with the time of day.
 * No XP, no levels, no missions — just pure aesthetic relaxation.
 *
 * Features:
 *  - Layered landscape scene (sky, mountains, trees, pond, flowers)
 *  - Time-of-day lighting (dawn, day, sunset, night)
 *  - Click interactions (pond ripples, flower sparkles, shooting stars)
 *  - Floating ambient particles (fireflies at night, petals during day)
 *  - Garden diary tab for daily thoughts
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import { Sun, Cloud, Droplets, Sparkles, Feather, BookHeart, User, Moon } from "lucide-react";
import { WashiTapeDivider } from "../scrapbook";
import { toast } from "sonner";
import { triggerHaptic } from "../../lib/haptics";

// ─── Time of day detection ───────────────────────────────────────────────────

type TimeOfDay = "dawn" | "day" | "sunset" | "night";

function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "sunset";
  return "night";
}

function getTimeLabel(tod: TimeOfDay): string {
  const labels: Record<TimeOfDay, string> = {
    dawn: "Dawn's First Light",
    day: "Golden Afternoon",
    sunset: "Twilight Glow",
    night: "Starlit Night",
  };
  return labels[tod];
}

function renderTimeIcon(tod: TimeOfDay, className = "w-3.5 h-3.5") {
  switch (tod) {
    case "dawn":
      return <Sun className={`${className} text-orange-400`} />;
    case "day":
      return <Sun className={`${className} text-amber-500`} />;
    case "sunset":
      return <Sun className={`${className} text-rose-500`} />;
    case "night":
    default:
      return <Moon className={`${className} text-indigo-300`} />;
  }
}

// ─── Custom Vector Flowers & Plants ──────────────────────────────────────────

function BlossomFlower({ color = "#fca5a5" }: { color?: string }) {
  return (
    <svg className="w-5 h-5 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none">
      <path d="M12 15v5" stroke="#3d5a3d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 17c2-1 3-3 3-3s-2 0-3 1" fill="#3d5a3d" opacity="0.8" />
      <g transform="translate(12, 11)">
        {Array.from({ length: 5 }).map((_, idx) => {
          const rotation = idx * 72;
          return (
            <path
              key={idx}
              d="M0 0 C -3 -6, 3 -6, 0 0"
              fill={color}
              stroke="color-mix(in srgb, #f43f5e 35%, transparent)"
              strokeWidth="0.5"
              transform={`rotate(${rotation})`}
            />
          );
        })}
        <circle cx="0" cy="0" r="1.5" fill="#fef08a" />
      </g>
    </svg>
  );
}

function DaisyFlower({ color = "#fbbf24" }: { color?: string }) {
  return (
    <svg className="w-5 h-5 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none">
      <path d="M12 14v6" stroke="#3d5a3d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 16c-2-0.5-3-2-3-2s2 0 3 1" fill="#3d5a3d" opacity="0.8" />
      <g transform="translate(12, 10)">
        {Array.from({ length: 8 }).map((_, idx) => {
          const rotation = idx * 45;
          return (
            <ellipse
              key={idx}
              cx="0"
              cy="-4"
              rx="1.5"
              ry="3.5"
              fill={color}
              transform={`rotate(${rotation})`}
            />
          );
        })}
        <circle cx="0" cy="0" r="2" fill="#d97706" />
      </g>
    </svg>
  );
}

function TulipFlower({ color = "#f472b6" }: { color?: string }) {
  return (
    <svg className="w-5 h-5 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none">
      <path d="M12 14v6" stroke="#3d5a3d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 18c-3-1-4-4-4-4s3 1 4 3" fill="#3d5a3d" opacity="0.8" />
      <g transform="translate(12, 9)">
        <path d="M-3.5 0 C-3.5 -5, 3.5 -5, 3.5 0 Z" fill="color-mix(in srgb, black 15%, #f472b6)" />
        <path d="M-3.5 0 C-4 -6, 0 -6, 0 0 Z" fill={color} />
        <path d="M0 0 C0 -6, 4 -6, 3.5 0 Z" fill={color} />
        <path d="M-1.5 0 C-1.5 -5, 1.5 -5, 1.5 0 Z" fill="#fbcfe8" />
      </g>
    </svg>
  );
}

function LavenderFlower({ color = "#c084fc" }: { color?: string }) {
  return (
    <svg className="w-4 h-6 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none">
      <path d="M12 14v10" stroke="#3d5a3d" strokeWidth="1.5" strokeLinecap="round" />
      <g transform="translate(12, 14)">
        {Array.from({ length: 5 }).map((_, idx) => {
          const yOffset = -idx * 3;
          return (
            <g key={idx} transform={`translate(0, ${yOffset})`}>
              <circle cx="-2" cy="0" r="1.8" fill={color} />
              <circle cx="2" cy="0" r="1.8" fill={color} />
              <circle cx="0" cy="-1.5" r="1.5" fill="color-mix(in srgb, white 20%, #c084fc)" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function FernPlant() {
  return (
    <svg className="w-5 h-5 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none">
      <path d="M12 20C12 14 10 8 16 4" stroke="#2d5a2d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 16c-2-1-3-3-3-3s2 .5 3 1.5" fill="#3d7a3d" />
      <path d="M13 14c2-1 3-3 3-3s-2 .5-3 1.5" fill="#3d7a3d" />
      <path d="M11 11c-2-1-2.5-3-2.5-3s1.5.5 2.5 1.5" fill="#3d7a3d" />
      <path d="M12.5 9c2-1 2.5-3 2.5-3s-1.5.5-2.5 1.5" fill="#3d7a3d" />
    </svg>
  );
}

function SeedlingSprout() {
  return (
    <svg className="w-8 h-8 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] animate-pulse" viewBox="0 0 24 24" fill="none">
      <path d="M12 20c0-4-1-6 2-8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14c-2-1-3-3-3-3s2 0 3 2" fill="#10b981" />
      <path d="M13.5 13c1.5-1 2.5-2.5 2.5-2.5s-0.5 1.5-1.5 2" fill="#059669" />
    </svg>
  );
}

function SmallSprout() {
  return (
    <svg className="w-8 h-8 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none">
      <path d="M12 21c0-6-1-9 3-11" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12.5 16c-3-1-4-4-4-4s3.5 .5 4 2.5" fill="#059669" />
      <path d="M13.5 13c3-1 3.5-3.5 3.5-3.5s-1 2.5-3 3" fill="#047857" />
      <path d="M15 10c0-2 1.5-3 1.5-3s0 1.5-1 2" fill="#34d399" />
    </svg>
  );
}

function BuddingPlant() {
  return (
    <svg className="w-9 h-9 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none">
      <path d="M12 21c0-7-1-10 2-12" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12.5 16c-3-1-4-3-4-3s3 1 4 2" fill="#059669" />
      <path d="M13.5 13c3-1 4-3 4-3s-1 2-3 2.5" fill="#047857" />
      <g transform="translate(14, 8)">
        <path d="M-2 0 C-3 -4, 3 -4, 2 0 Z" fill="#ec4899" />
        <path d="M-2.5 0 C-3 -5, 0 -5, 0 0 Z" fill="#f43f5e" />
        <path d="M0 0 C0 -5, 3 -5, 2.5 0 Z" fill="#f43f5e" />
      </g>
    </svg>
  );
}

function SakuraBonsaiTree() {
  return (
    <svg className="w-14 h-14 filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.18)]" viewBox="0 0 40 40" fill="none">
      {/* Blue porcelain pot */}
      <path d="M10 32 L30 32 L27 38 L13 38 Z" fill="#1e3a8a" />
      <rect x="8" y="30" width="24" height="2" rx="1" fill="#3b82f6" />
      
      {/* Bonsai gnarled trunk */}
      <path d="M19 30 C19 25, 14 24, 15 20 C16 16, 22 17, 21 12 C20 10, 18 10, 18 8" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
      <path d="M15 20 C16 18, 19 18, 20 16" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Sakura pink flower foliage clouds */}
      <circle cx="16" cy="11" r="5" fill="#f472b6" />
      <circle cx="21" cy="9" r="6" fill="#f472b6" />
      <circle cx="25" cy="13" r="5" fill="#fb7185" />
      <circle cx="18" cy="15" r="4.5" fill="#fda4af" />
      <circle cx="21" cy="10" r="3.5" fill="#ffffff" opacity="0.3" />
      
      {/* Fallen petals on soil */}
      <circle cx="14" cy="30" r="1" fill="#f472b6" />
      <circle cx="26" cy="30" r="1" fill="#fda4af" />
    </svg>
  );
}

function ZenBonsaiTree() {
  return (
    <svg className="w-14 h-14 filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.18)]" viewBox="0 0 40 40" fill="none">
      {/* Dark grey slate pot */}
      <path d="M11 32 L29 32 L26 38 L14 38 Z" fill="#374151" />
      <rect x="9" y="30" width="22" height="2" rx="1" fill="#4b5563" />
      
      {/* Twisted Trunk */}
      <path d="M21 30 C21 26, 17 24, 18 20 C19 16, 25 15, 23 10 C22 7, 20 6, 21 5" stroke="#451a03" strokeWidth="3.2" strokeLinecap="round" />
      
      {/* Structured green pine/bonsai pads */}
      <ellipse cx="16" cy="13" rx="6" ry="3.5" fill="#065f46" />
      <ellipse cx="24" cy="9" rx="7" ry="4" fill="#064e3b" />
      <ellipse cx="21" cy="6" rx="5" ry="3" fill="#10b981" />
      <ellipse cx="15" cy="20" rx="5" ry="3" fill="#064e3b" />
    </svg>
  );
}

function ElegantTulipPot() {
  return (
    <svg className="w-12 h-14 filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.15)]" viewBox="0 0 40 40" fill="none">
      {/* Terracotta clay pot */}
      <path d="M13 30 L27 30 L25 38 L15 38 Z" fill="#b45309" />
      <rect x="11" y="28" width="18" height="2" rx="1" fill="#ca8a04" opacity="0.3" />
      <rect x="11" y="28" width="18" height="2" rx="1" fill="#ca8234" />
      
      {/* Curving green stems */}
      <path d="M17 28 Q15 20 16 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 28 Q22 18 19 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      <path d="M23 28 Q25 22 24 14" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      
      {/* Big tulip leaves */}
      <path d="M18 28 C13 25, 14 18, 16 18" fill="#047857" />
      <path d="M22 28 C27 24, 25 17, 23 17" fill="#047857" />
      
      {/* Tulip flower petals */}
      <g transform="translate(16, 11)">
        <path d="M-3 0 C-4 -5, 4 -5, 3 0 Z" fill="#f43f5e" />
        <path d="M-2.5 -1 C0 -6, 0 -6, 0 0 Z" fill="#ec4899" />
        <path d="M0 0 C0 -6, 3.5 -5, 2.5 -1 Z" fill="#db2777" />
      </g>
      <g transform="translate(19, 7)">
        <path d="M-3 0 C-4 -5, 4 -5, 3 0 Z" fill="#fb7185" />
        <path d="M-2.5 -1 C0 -6, 0 -6, 0 0 Z" fill="#fda4af" />
        <path d="M0 0 C0 -6, 3.5 -5, 2.5 -1 Z" fill="#f43f5e" />
      </g>
      <g transform="translate(24, 13)">
        <path d="M-2.5 0 C-3.5 -4, 3.5 -4, 2.5 0 Z" fill="#f43f5e" />
        <path d="M-2 -1 C0 -5, 0 -5, 0 0 Z" fill="#ff7096" />
        <path d="M0 0 C0 -5, 3 -4, 2 -1 Z" fill="#e11d48" />
      </g>
    </svg>
  );
}

function RadiantSunflowerPot() {
  return (
    <svg className="w-12 h-14 filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.15)]" viewBox="0 0 40 40" fill="none">
      {/* Wooden barrel pot */}
      <path d="M12 28 L28 28 L26 38 L14 38 Z" fill="#78350f" />
      <rect x="10" y="26" width="20" height="2" rx="1" fill="#92400e" />
      <rect x="12" y="32" width="16" height="1" fill="#451a03" />
      
      {/* Thick strong green stem */}
      <path d="M20 26 L20 10" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Big green leaves */}
      <path d="M20 21 Q14 18 15 15" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 16 Q26 14 24 11" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      
      {/* Sunflower Head */}
      <g transform="translate(20, 9)">
        {/* Yellow Petals circle */}
        {Array.from({ length: 12 }).map((_, idx) => {
          const rotation = idx * 30;
          return (
            <path
              key={idx}
              d="M0 0 C -2 -7, 2 -7, 0 0"
              fill="#eab308"
              stroke="#ca8a04"
              strokeWidth="0.3"
              transform={`rotate(${rotation})`}
            />
          );
        })}
        {/* Dark core */}
        <circle cx="0" cy="0" r="3" fill="#451a03" />
        <circle cx="0" cy="0" r="2.2" fill="#1c1917" />
        <circle cx="0" cy="0" r="1.5" fill="#451a03" stroke="#f59e0b" strokeWidth="0.3" strokeDasharray="1,1" />
      </g>
    </svg>
  );
}

function renderFlower(index: number) {
  switch (index % 5) {
    case 0:
      return <BlossomFlower color="#fca5a5" />;
    case 1:
      return <DaisyFlower color="#fbcfe8" />;
    case 2:
      return <TulipFlower color="#fda4af" />;
    case 3:
      return <LavenderFlower color="#c084fc" />;
    case 4:
    default:
      return <FernPlant />;
  }
}

function renderPlantStage(stage: number, type: "sakura" | "bonsai" | "tulip" | "sunflower") {
  if (stage <= 1) return <SeedlingSprout />;
  if (stage === 2) return <SmallSprout />;
  if (stage === 3) return <BuddingPlant />;
  
  switch (type) {
    case "sakura":
      return <SakuraBonsaiTree />;
    case "bonsai":
      return <ZenBonsaiTree />;
    case "tulip":
      return <ElegantTulipPot />;
    case "sunflower":
    default:
      return <RadiantSunflowerPot />;
  }
}

// ─── Sky colors per time ─────────────────────────────────────────────────────

interface SkyVariant {
  top: string;
  bottom: string;
  starColor: string;
}

const SKY_COLORS: Record<TimeOfDay, SkyVariant> = {
  dawn:  { top: "#f97316", bottom: "#fde68a", starColor: "transparent" },
  day:   { top: "#38bdf8", bottom: "#bae6fd", starColor: "transparent" },
  sunset:{ top: "#e11d48", bottom: "#fbbf24", starColor: "transparent" },
  night: { top: "#1e1b4b", bottom: "#312e81", starColor: "rgba(255,255,255,0.6)" },
};

// ─── Garden Diary ────────────────────────────────────────────────────────────

interface DiaryEntry {
  id: string;
  date: string;
  text: string;
  emoji: string;
  authorId: "user_a" | "user_b";
}

const DIARY_EMOJIS = ["\uD83C\uDF38", "\uD83C\uDF3C", "\uD83C\uDF3A", "\uD83C\uDF3B", "\uD83C\uDF3F", "\uD83C\uDF43", "\uD83C\uDF31", "\uD83C\uDF37", "\uD83D\uDC90", "\uD83C\uDF3E"];

function loadDiary(): DiaryEntry[] {
  try { return JSON.parse(localStorage.getItem("garden_diary") || "[]"); }
  catch { return []; }
}

function saveDiary(entries: DiaryEntry[]) {
  localStorage.setItem("garden_diary", JSON.stringify(entries));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function skyGrad(top: string, bottom: string): string {
  return "linear-gradient(180deg, " + top + " 0%, " + bottom + " 100%)";
}

function groundColor(tod: TimeOfDay): string {
  if (tod === "night") return "#2d4a2d";
  if (tod === "dawn") return "#7a9a5a";
  if (tod === "sunset") return "#8a7a4a";
  return "#5a8a4a";
}

function groundColorBottom(tod: TimeOfDay): string {
  if (tod === "night") return "#1a3a1a";
  if (tod === "dawn") return "#6a8a4a";
  if (tod === "sunset") return "#7a6a3a";
  return "#4a7a3a";
}

function pondColor(tod: TimeOfDay): string {
  if (tod === "night") return "#1a3a5a";
  if (tod === "dawn") return "#7ab8d4";
  if (tod === "sunset") return "#d4a878";
  return "#6ab8e8";
}

function treeCanopy(tod: TimeOfDay): string {
  if (tod === "night") return "#2a4a2a";
  return "#5a9a4a";
}

function treeCanopyInner(tod: TimeOfDay): string {
  if (tod === "night") return "#1a3a1a";
  return "#3a7a3a";
}

function trunkColor(tod: TimeOfDay): string {
  if (tod === "night") return "#3a2a1a";
  return "#5a4a3a";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function InteractiveTerrarium() {
  const { currentUser, userA, userB, gardenPlant, changePlantType } = useCouple();
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const [activeTab, setActiveTab] = useState<"view" | "diary">("view");

  // Terrarium state
  const [ripplePoints, setRipplePoints] = useState<{ id: number; x: number; y: number }[]>([]);
  const [sparklePoints, setSparklePoints] = useState<{ id: number; x: number; y: number }[]>([]);
  const [shootingStars, setShootingStars] = useState<{ id: number; x: number; y: number }[]>([]);
  const [waterLevel, setWaterLevel] = useState(() => Number(localStorage.getItem("terrarium_water") || "70"));
  const [lastVisitDate, setLastVisitDate] = useState(() => localStorage.getItem("terrarium_last_visit") || "");
  const [plantStage, setPlantStage] = useState(() => Number(localStorage.getItem("terrarium_plant_stage") || "2"));

  // Diary state
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>(loadDiary);
  const [diaryInput, setDiaryInput] = useState("");
  const rippleIdRef = useRef(0);
  const sparkleIdRef = useRef(0);
  const starIdRef = useRef(0);

  // ── Listen for admin reset event ──
  useEffect(function () {
    function handleReset() {
      setWaterLevel(70);
      setPlantStage(2);
      setLastVisitDate("");
      setDiaryEntries([]);
      localStorage.setItem("terrarium_water", "70");
      localStorage.setItem("terrarium_plant_stage", "2");
      localStorage.removeItem("terrarium_last_visit");
      localStorage.removeItem("garden_diary");
    }
    window.addEventListener("terrariumReset", handleReset);
    return function () { window.removeEventListener("terrariumReset", handleReset); };
  }, []);

  // ── Update time of day every 5 minutes ──
  useEffect(() => {
    const id = setInterval(function () { setTimeOfDay(getTimeOfDay()); }, 300000);
    return function () { clearInterval(id); };
  }, []);

  // ── Plant growth over time (based on days since last visit) ──
  useEffect(function () {
    var today = new Date().toISOString().split("T")[0];
    if (lastVisitDate && lastVisitDate !== today) {
      var last = new Date(lastVisitDate);
      var now = new Date();
      var diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000);
      if (diffDays > 0) {
        setPlantStage(function (prev) {
          var next = Math.min(prev + 1, 5);
          localStorage.setItem("terrarium_plant_stage", String(next));
          return next;
        });
      } else {
        localStorage.setItem("terrarium_plant_stage", String(plantStage));
      }
    } else {
      localStorage.setItem("terrarium_plant_stage", String(plantStage));
    }
    setLastVisitDate(today);
    localStorage.setItem("terrarium_last_visit", today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save water level ──
  useEffect(function () {
    localStorage.setItem("terrarium_water", String(waterLevel));
  }, [waterLevel]);

  // ── Water the garden ──
  var handleWater = useCallback(function () {
    setWaterLevel(function (prev) { return Math.min(prev + 15, 100); });
    for (var i = 0; i < 3; i++) {
      (function (id) {
        setRipplePoints(function (prev) {
          return prev.concat([{ id: id, x: 25 + Math.random() * 50, y: 55 + Math.random() * 15 }]);
        });
        setTimeout(function () {
          setRipplePoints(function (prev) { return prev.filter(function (r) { return r.id !== id; }); });
        }, 1500);
      })(++rippleIdRef.current);
    }
  }, []);

  // ── Click handlers ──
  var handleTerrariumClick = useCallback(function (e: React.MouseEvent<HTMLDivElement>) {
    var rect = e.currentTarget.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width) * 100;
    var y = ((e.clientY - rect.top) / rect.height) * 100;

    if (y > 50 && y < 75 && x > 20 && x < 80) {
      // Pond area -> ripple
      var id = ++rippleIdRef.current;
      setRipplePoints(function (prev) { return prev.concat([{ id: id, x: x, y: y }]); });
      setTimeout(function () {
        setRipplePoints(function (prev) { return prev.filter(function (r) { return r.id !== id; }); });
      }, 1500);
    } else if (y > 65) {
      // Ground area -> flower sparkle
      id = ++sparkleIdRef.current;
      setSparklePoints(function (prev) { return prev.concat([{ id: id, x: x, y: y }]); });
      setTimeout(function () {
        setSparklePoints(function (prev) { return prev.filter(function (s) { return s.id !== id; }); });
      }, 1200);
    } else if (y < 30 && timeOfDay === "night") {
      // Sky at night -> shooting star
      id = ++starIdRef.current;
      setShootingStars(function (prev) { return prev.concat([{ id: id, x: x, y: y }]); });
      setTimeout(function () {
        setShootingStars(function (prev) { return prev.filter(function (s) { return s.id !== id; }); });
      }, 2000);
    }
  }, [timeOfDay]);

  // ── Diary handler ──
  var addDiaryEntry = useCallback(function () {
    var text = diaryInput.trim();
    if (!text) return;
    var emoji = DIARY_EMOJIS[Math.floor(Math.random() * DIARY_EMOJIS.length)];
    var entry: DiaryEntry = {
      id: "de-" + Date.now(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      text: text,
      emoji: emoji,
      authorId: currentUser,
    };
    var updated = [entry].concat(diaryEntries).slice(0, 30);
    setDiaryEntries(updated);
    saveDiary(updated);
    setDiaryInput("");
  }, [diaryInput, diaryEntries]);

  // ── Ambient particles ──
  var particles = useMemo(function () {
    var count = timeOfDay === "night" ? 18 : 10;
    var result = [];
    for (var i = 0; i < count; i++) {
      var isFirefly = timeOfDay === "night";
      result.push({
        id: i,
        x: Math.random() * 100,
        y: 30 + Math.random() * 55,
        size: isFirefly ? 2 + Math.random() * 3 : 3 + Math.random() * 4,
        duration: 4 + Math.random() * 6,
        delay: Math.random() * 8,
        type: isFirefly ? ("firefly" as const) : ("petal" as const),
      });
    }
    return result;
  }, [timeOfDay]);

  // ── Stars (only at night) ──
  var stars = useMemo(function () {
    if (timeOfDay !== "night") return [];
    var result = [];
    for (var i = 0; i < 30; i++) {
      result.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 35,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 3,
        duration: 1 + Math.random() * 3,
      });
    }
    return result;
  }, [timeOfDay]);

  var sky = SKY_COLORS[timeOfDay];

  // Flower positions
  var flowers = [
    { x: 12, y: 80, emoji: "\uD83C\uDF38" },
    { x: 20, y: 86, emoji: "\uD83C\uDF3C" },
    { x: 72, y: 82, emoji: "\uD83C\uDF3A" },
    { x: 82, y: 88, emoji: "\uD83C\uDF3B" },
    { x: 8,  y: 90, emoji: "\uD83C\uDF37" },
    { x: 90, y: 78, emoji: "\uD83D\uDC90" },
    { x: 65, y: 88, emoji: "\uD83C\uDF3F" },
    { x: 28, y: 90, emoji: "\uD83C\uDF43" },
  ];

  // Sparkle colors
  var sparkleColors = ["#fef08a", "#f9a8d4", "#a7f3d0", "#fde68a", "#c4b5fd"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
          Interactive Terrarium
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          A little world that grows with you &mdash; no numbers, just nature.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div
          role="tablist"
          aria-label="Terrarium sections"
          className="flex gap-4 sm:gap-6 bg-[var(--fabric-cream)]/50 px-3 py-2 rounded-2xl border border-[var(--wood-oak)]/15 shadow-sm"
        >
          <button
            role="tab"
            aria-selected={activeTab === "view"}
            onClick={function () { setActiveTab("view"); }}
            className={"flex items-center gap-1.5 px-2 py-1 text-xs font-bold transition-all relative cursor-pointer select-none " + (activeTab === "view" ? "text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]")}
          >
            <Sun className="w-4 h-4" />
            The View
            {activeTab === "view" && (
              <motion.div
                layoutId="activeTerrariumTab"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "diary"}
            onClick={function () { setActiveTab("diary"); }}
            className={"flex items-center gap-1.5 px-2 py-1 text-xs font-bold transition-all relative cursor-pointer select-none " + (activeTab === "diary" ? "text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-main)]")}
          >
            <BookHeart className="w-4 h-4" />
            Garden Whispers
            {activeTab === "diary" && (
              <motion.div
                layoutId="activeTerrariumTab"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "view" && (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Terrarium Scene */}
            <div className="relative max-w-3xl mx-auto">
              {/* Time badge */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-sm border"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--fabric-cream) 80%, transparent)",
                    borderColor: "color-mix(in srgb, var(--wood-oak) 20%, transparent)",
                    color: "var(--text-muted)",
                  }}
                >
                  {renderTimeIcon(timeOfDay)}
                  <span>{getTimeLabel(timeOfDay)}</span>
                </div>
              </div>

              {/* Scene container */}
              <div
                className="relative w-full aspect-[16/9] rounded-t-[120px] rounded-b-[32px] overflow-hidden border-4 border-[var(--wood-oak)]/25 dark:border-white/5 shadow-2xl cursor-pointer"
                style={{ backgroundColor: sky.top }}
                onClick={handleTerrariumClick}
              >
                {/* Sky */}
                <div
                  className="absolute inset-0 transition-all duration-1000"
                  style={{ background: skyGrad(sky.top, sky.bottom) }}
                />

                {/* Glass Dome Highlight & Reflection overlay */}
                <div className="absolute inset-0 rounded-t-[120px] rounded-b-[32px] bg-gradient-to-tr from-white/10 via-transparent to-white/15 pointer-events-none z-30 shadow-[inset_0_4px_12px_rgba(255,255,255,0.3),_inset_0_-8px_20px_rgba(0,0,0,0.2)]" />
                <div className="absolute top-3 left-10 right-10 h-6 bg-white/20 rounded-full blur-[2px] pointer-events-none z-30" />
                
                {/* Wooden base cloche stand at the bottom */}
                <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 border-t border-amber-950 rounded-b-3xl z-30 pointer-events-none shadow-md" />

                {/* Stars (night only) */}
                {stars.map(function (star) {
                  return (
                    <motion.div
                      key={star.id}
                      className="absolute rounded-full z-[1]"
                      style={{
                        left: star.x + "%",
                        top: star.y + "%",
                        width: star.size,
                        height: star.size,
                        backgroundColor: sky.starColor,
                      }}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: star.duration, delay: star.delay, ease: "easeInOut" }}
                    />
                  );
                })}

                {/* Shooting Star */}
                {shootingStars.map(function (star) {
                  return (
                    <motion.div
                      key={star.id}
                      className="absolute z-[2]"
                      style={{ left: star.x + "%", top: star.y + "%", width: 4, height: 4 }}
                      initial={{ opacity: 0, x: 0, y: 0 }}
                      animate={{ opacity: [0, 1, 0], x: [0, 120], y: [0, 60], scale: [1, 0.3] }}
                      transition={{ duration: 1.8, ease: "easeOut" }}
                    >
                      <div
                        className="w-full h-full rounded-full"
                        style={{ backgroundColor: "white", boxShadow: "0 0 6px 2px rgba(255,255,255,0.6)" }}
                      />
                      <div
                        className="absolute top-1/2 right-full h-px"
                        style={{ width: 60, background: "linear-gradient(to left, rgba(255,255,255,0.6), transparent)" }}
                      />
                    </motion.div>
                  );
                })}

                {/* Moon (night only) */}
                {timeOfDay === "night" && (
                  <motion.div
                    className="absolute z-[2]"
                    style={{ left: "78%", top: "8%" }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  >
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{
                        background: "radial-gradient(circle at 35% 35%, #fff 0%, #f0e68c 60%, #daa520 100%)",
                        boxShadow: "0 0 20px rgba(255,255,200,0.3), 0 0 60px rgba(255,255,200,0.1)",
                      }}
                    />
                    <div className="absolute top-[20%] left-[25%] w-2 h-2 rounded-full bg-[#daa520]/20" />
                    <div className="absolute top-[50%] left-[55%] w-1.5 h-1.5 rounded-full bg-[#daa520]/15" />
                  </motion.div>
                )}

                {/* Sun */}
                {(timeOfDay === "day" || timeOfDay === "dawn" || timeOfDay === "sunset") && (
                  <motion.div
                    className="absolute z-[2]"
                    style={{
                      left: timeOfDay === "dawn" ? "15%" : timeOfDay === "sunset" ? "82%" : "50%",
                      top: timeOfDay === "day" ? "5%" : "18%",
                    }}
                    animate={{ y: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                  >
                    <div
                      className="w-12 h-12 rounded-full"
                      style={{
                        background: timeOfDay === "day"
                          ? "radial-gradient(circle, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%)"
                          : timeOfDay === "dawn"
                          ? "radial-gradient(circle, #fde68a 0%, #fb923c 50%, #f97316 100%)"
                          : "radial-gradient(circle, #fef3c7 0%, #f97316 50%, #e11d48 100%)",
                        boxShadow: timeOfDay === "day"
                          ? "0 0 30px rgba(251,191,36,0.4), 0 0 80px rgba(251,191,36,0.15)"
                          : "0 0 30px rgba(249,115,22,0.4), 0 0 80px rgba(249,115,22,0.15)",
                      }}
                    />
                  </motion.div>
                )}

                {/* Clouds */}
                {Array.from({ length: 3 }).map(function (_, i) {
                  return (
                    <motion.div
                      key={"cloud-" + i}
                      className="absolute z-[3] flex items-center"
                      style={{
                        left: (10 + i * 30) + "%",
                        top: (10 + (i % 2) * 8) + "%",
                        opacity: timeOfDay === "night" ? 0.2 : 0.6,
                      }}
                      animate={{ x: [0, 20 + i * 10, 0] }}
                      transition={{ repeat: Infinity, duration: 20 + i * 8, ease: "easeInOut" }}
                    >
                      <Cloud className="w-10 h-10 sm:w-14 sm:h-14" style={{ color: "white", fill: "white" }} />
                    </motion.div>
                  );
                })}

                {/* Mountains */}
                <div className="absolute bottom-[32%] left-0 right-0 z-[4]">
                  <div
                    className="absolute bottom-0 left-[-5%] w-[50%] h-[80%]"
                    style={{
                      background: "linear-gradient(135deg, " + (
                        timeOfDay === "night" ? "#1a1a3e" : timeOfDay === "dawn" ? "#a78b6a" : timeOfDay === "sunset" ? "#7c3a50" : "#6b8f6b"
                      ) + ", transparent)",
                      clipPath: "polygon(0% 100%, 25% 5%, 55% 100%)",
                      opacity: 0.5,
                    }}
                  />
                  <div
                    className="absolute bottom-0 right-[-5%] w-[55%] h-[70%]"
                    style={{
                      background: "linear-gradient(225deg, " + (
                        timeOfDay === "night" ? "#2a2a4e" : timeOfDay === "dawn" ? "#8b7355" : timeOfDay === "sunset" ? "#6b3040" : "#5a7d5a"
                      ) + ", transparent)",
                      clipPath: "polygon(40% 5%, 100% 100%, 0% 100%)",
                      opacity: 0.6,
                    }}
                  />
                </div>

                {/* Ground */}
                <div
                  className="absolute bottom-0 left-0 right-0 z-[6]"
                  style={{
                    height: "35%",
                    background: "linear-gradient(180deg, " + groundColor(timeOfDay) + " 0%, " + groundColorBottom(timeOfDay) + " 100%)",
                  }}
                >
                  {/* Grass texture lines */}
                  {Array.from({ length: 8 }).map(function (_, i) {
                    return (
                      <div
                        key={"grass-" + i}
                        className="absolute bottom-0"
                        style={{
                          left: (5 + i * 12) + "%",
                          width: "2px",
                          height: (8 + Math.random() * 12) + "%",
                          backgroundColor: timeOfDay === "night" ? "rgba(60,120,60,0.3)" : "rgba(100,180,80,0.3)",
                          transform: "rotate(" + (-5 + Math.random() * 10) + "deg)",
                          transformOrigin: "bottom center",
                          borderRadius: "1px",
                        }}
                      />
                    );
                  })}

                  {/* Organic Dirt Soil Layer with Pebble details */}
                  <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-gradient-to-b from-[#3E251D] to-[#20100A] border-t border-[#4D322A]/45 flex flex-wrap items-center justify-around gap-1 px-2 overflow-hidden z-10 pointer-events-none">
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <div 
                        key={idx} 
                        className="w-1.5 h-1 bg-amber-950/40 rounded-full" 
                        style={{ transform: `rotate(${Math.random() * 360}deg)` }} 
                      />
                    ))}
                  </div>
                </div>

                {/* Pond */}
                <div
                  className="absolute z-[7] rounded-[50%]"
                  style={{
                    left: "32%",
                    bottom: "22%",
                    width: "36%",
                    height: "18%",
                    background: "radial-gradient(ellipse at 40% 35%, " + pondColor(timeOfDay) + " 0%, " + (timeOfDay === "night" ? "#0a2a3a" : "#3a88b8") + " 100%)",
                    boxShadow: timeOfDay !== "night" ? "inset 0 2px 10px rgba(255,255,255,0.2)" : "inset 0 -2px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Water reflection */}
                  <div
                    className="absolute top-[15%] left-[15%] w-[25%] h-[20%] rounded-full"
                    style={{
                      background: "radial-gradient(ellipse, " + (timeOfDay === "night" ? "rgba(100,150,200,0.15)" : "rgba(255,255,255,0.25)") + ", transparent)",
                    }}
                  />
                </div>

                {/* Lily pads */}
                <div className="absolute z-[8]" style={{ left: "40%", bottom: "30%" }}>
                  <div className="w-4 h-2 rounded-full bg-emerald-700/40 rotate-[-10deg]" />
                </div>
                <div className="absolute z-[8]" style={{ left: "52%", bottom: "33%" }}>
                  <div className="w-3 h-1.5 rounded-full bg-emerald-700/30 rotate-[15deg]" />
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
                    <svg className="w-3.5 h-3.5 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3c-1.5 5-4.5 7-4.5 10a4.5 4.5 0 0 0 9 0c0-3-3-5-4.5-10z" fill="#ffffff" />
                      <path d="M12 6c-1 3-3 5-3 8a3 3 0 1 0 6 0c0-3-2-5-3-8z" fill="#fbcfe8" />
                      <circle cx="12" cy="14" r="1.5" fill="#f59e0b" />
                    </svg>
                  </div>
                </div>

                {/* Pond ripples (on click) */}
                {ripplePoints.map(function (rp) {
                  return (
                    <React.Fragment key={rp.id}>
                      {[0, 1, 2].map(function (ring) {
                        return (
                          <motion.div
                            key={rp.id + "-ring-" + ring}
                            className="absolute z-[9] rounded-full pointer-events-none"
                            style={{
                              left: rp.x + "%",
                              top: rp.y + "%",
                              width: 1,
                              height: 1,
                              border: "1px solid rgba(255,255,255,0.4)",
                              transform: "translate(-50%, -50%)",
                            }}
                            initial={{ width: 0, height: 0, opacity: 0.6 }}
                            animate={{ width: 20 + ring * 15, height: 20 + ring * 15, opacity: 0 }}
                            transition={{ duration: 1.2, delay: ring * 0.15, ease: "easeOut" }}
                          />
                        );
                      })}
                    </React.Fragment>
                  );
                })}

                {/* Flowers */}
                {flowers.map(function (flower, i) {
                  return (
                    <motion.div
                      key={"flower-" + i}
                      className="absolute z-[8] select-none pointer-events-none"
                      style={{ left: flower.x + "%", top: flower.y + "%" }}
                      animate={{ y: [0, -2, 0], rotate: [0, 3, 0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 3 + (i % 3), delay: i * 0.4, ease: "easeInOut" }}
                    >
                      {renderFlower(i)}
                    </motion.div>
                  );
                })}

                {/* Central plant (grows over time) */}
                <motion.div
                  className="absolute z-[8] select-none cursor-pointer pointer-events-auto"
                  style={{ left: "48%", bottom: "28%" }}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic("medium");
                    var id = ++sparkleIdRef.current;
                    setSparklePoints(function (prev) { return prev.concat([{ id: id, x: 50, y: 65 }]); });
                    setTimeout(function () {
                      setSparklePoints(function (prev) { return prev.filter(function (s) { return s.id !== id; }); });
                    }, 1200);
                    toast.success("Our Love Plant is blooming beautifully!");
                  }}
                  animate={{ y: [0, -1, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                  <div className="flex flex-col items-center">
                    {renderPlantStage(plantStage, gardenPlant || "sakura")}
                    {/* Growth indicator */}
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(function (stage) {
                        return (
                          <div
                            key={stage}
                            className={"w-1 h-1 rounded-full " + (stage <= plantStage ? "bg-emerald-400 animate-pulse" : "bg-black/10")}
                          />
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

                {/* Cute Interactive Red Forest Mushroom */}
                <motion.div
                  className="absolute z-[8] left-[25%] bottom-[20%] cursor-pointer pointer-events-auto"
                  whileHover={{ scale: 1.25, y: -2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic("light");
                    toast.success("🍄 A little starlight mushroom popped up!");
                  }}
                >
                  <svg className="w-5 h-5 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C7 2 5 6 5 10C5 11 6 12 8 12C9.5 12 10 14 10 17V21H14V17C14 14 14.5 12 16 12C18 12 19 11 19 10C19 6 17 2 12 2Z" fill="#E8B4B8" />
                    <circle cx="10" cy="5" r="1" fill="white" />
                    <circle cx="14" cy="7" r="1" fill="white" />
                    <circle cx="11" cy="9" r="0.8" fill="white" />
                  </svg>
                </motion.div>

                {/* Cute Golden Star Sprouts */}
                <motion.div
                  className="absolute z-[8] left-[70%] bottom-[22%] cursor-pointer pointer-events-auto"
                  whileHover={{ scale: 1.3, y: -2, rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic("light");
                    toast.success("✨ Plant stardust to see it grow!");
                  }}
                >
                  <svg className="w-5 h-5 animate-pulse filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15 9L22 10L17 15L18 22L12 18L6 22L7 15L2 10L9 9L12 2Z" fill="#F4C542" />
                  </svg>
                </motion.div>

                {/* Stones */}
                <div className="absolute z-[8]" style={{ left: "18%", bottom: "26%" }}>
                  <div className="w-3 h-2 rounded-full bg-gray-400/30 rotate-[20deg]" />
                </div>
                <div className="absolute z-[8]" style={{ left: "75%", bottom: "28%" }}>
                  <div className="w-4 h-2.5 rounded-full bg-gray-500/20 rotate-[-15deg]" />
                </div>
                <div className="absolute z-[8]" style={{ left: "58%", bottom: "25%" }}>
                  <div className="w-2 h-1.5 rounded-full bg-gray-400/25 rotate-[10deg]" />
                </div>

                {/* Left tree */}
                <div className="absolute bottom-[30%] left-[2%] z-[5] pointer-events-none">
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div
                        className="w-14 h-14 sm:w-20 sm:h-20 rounded-full"
                        style={{
                          background: "radial-gradient(circle at 40% 35%, " + treeCanopy(timeOfDay) + ", " + treeCanopyInner(timeOfDay) + ")",
                        }}
                      />
                      <div className="absolute top-[15%] left-[20%] w-[30%] h-[25%] rounded-full bg-white/10" />
                    </div>
                    <div className="w-2.5 h-6 sm:h-8 rounded-sm -mt-0.5" style={{ backgroundColor: trunkColor(timeOfDay) }} />
                  </div>
                </div>

                {/* Right tree */}
                <div className="absolute bottom-[28%] right-[3%] z-[5] pointer-events-none">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full"
                      style={{
                        background: "radial-gradient(circle at 45% 30%, " + treeCanopy(timeOfDay) + ", " + treeCanopyInner(timeOfDay) + ")",
                      }}
                    />
                    <div className="w-2 h-5 sm:h-6 rounded-sm -mt-0.5" style={{ backgroundColor: trunkColor(timeOfDay) }} />
                  </div>
                </div>

                {/* Small bush */}
                <div className="absolute bottom-[30%] left-[85%] z-[5] pointer-events-none">
                  <div className="w-6 h-4 rounded-full" style={{ backgroundColor: treeCanopy(timeOfDay) }} />
                </div>

                {/* Ambient Particles (fireflies / petals) */}
                {particles.map(function (p) {
                  return (
                    <motion.div
                      key={p.id}
                      className="absolute z-[10] pointer-events-none"
                      style={{ left: p.x + "%", top: p.y + "%", width: p.size, height: p.size }}
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, p.type === "firefly" ? 0.8 : 0.5, 0],
                        y: [0, -20 - Math.random() * 30, -(40 + Math.random() * 30)],
                        x: [0, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 30],
                        scale: [0.5, 1.2, 0.3],
                      }}
                      transition={{ repeat: Infinity, duration: p.duration, delay: p.delay, ease: "easeInOut" }}
                    >
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          backgroundColor: p.type === "firefly" ? "#fef08a" : "#f9a8d4",
                          boxShadow: p.type === "firefly" ? "0 0 6px 2px rgba(254,240,138,0.4)" : "none",
                        }}
                      />
                    </motion.div>
                  );
                })}

                {/* Flower sparkles (on click) */}
                {sparklePoints.map(function (sp) {
                  return (
                    <React.Fragment key={sp.id}>
                      {Array.from({ length: 5 }).map(function (_, i) {
                        return (
                          <motion.div
                            key={sp.id + "-sparkle-" + i}
                            className="absolute z-[11] pointer-events-none"
                            style={{
                              left: sp.x + "%",
                              top: sp.y + "%",
                              width: 3,
                              height: 3,
                              borderRadius: "50%",
                              backgroundColor: sparkleColors[i],
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0, 1.5, 0],
                              x: [0, (Math.random() - 0.5) * 30],
                              y: [0, (Math.random() - 0.5) * 30 - 10],
                            }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                          />
                        );
                      })}
                    </React.Fragment>
                  );
                })}

                {/* Hover hint */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                  <div className="text-[8px] text-white/50 font-medium tracking-wider flex items-center gap-1.5 bg-black/10 px-2.5 py-1 rounded-full backdrop-blur-[2px]">
                    <Sparkles className="w-2.5 h-2.5" />
                    Tap the pond, flowers, or sky...
                  </div>
                </div>
              </div>

              {/* Watering Controls */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={handleWater}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/60 hover:bg-white/80 border border-[var(--wood-oak)]/15 rounded-xl text-xs font-bold text-[var(--text-main)] transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-xs"
                >
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  Water the Garden
                </button>

                {/* Water level */}
                <div className="flex items-center gap-1.5">
                  <div className="w-20 h-2.5 bg-black/5 rounded-full overflow-hidden border border-black/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
                      animate={{ width: waterLevel + "%" }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold">
                    {waterLevel}%
                  </span>
                </div>
              </div>

              {/* Centerpiece Plant Switcher */}
              <div className="mt-5 p-4 bg-[var(--fabric-cream)]/50 dark:bg-stone-900/40 rounded-2xl border border-[var(--wood-oak)]/10 text-center max-w-sm mx-auto shadow-xs">
                <p className="text-[10px] uppercase tracking-wider text-[var(--primary)] font-bold mb-2.5 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  Select Centerpiece Plant
                </p>
                <div className="flex justify-center gap-2.5">
                  {[
                    { value: "sakura", label: "Sakura Bonsai", icon: "🌸", color: "hover:bg-pink-50 text-pink-600 dark:hover:bg-pink-950/20" },
                    { value: "bonsai", label: "Zen Bonsai", icon: "🌳", color: "hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950/20" },
                    { value: "tulip", label: "Tulip Pot", icon: "🌷", color: "hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/20" },
                    { value: "sunflower", label: "Sunflower Pot", icon: "🌻", color: "hover:bg-amber-50 text-amber-600 dark:hover:bg-amber-950/20" },
                  ].map((plant) => {
                    const isSelected = (gardenPlant || "sakura") === plant.value;
                    return (
                      <button
                        key={plant.value}
                        onClick={() => {
                          triggerHaptic("light");
                          changePlantType(plant.value as any);
                          toast.success(`Centerpiece changed to ${plant.label}! ✨`);
                        }}
                        className={`flex flex-col items-center justify-center p-2 w-16 h-16 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white dark:bg-stone-800 border-[var(--primary)] shadow-sm scale-105"
                            : "bg-white/30 border-transparent hover:border-[var(--wood-oak)]/20"
                        } ${plant.color}`}
                        title={plant.label}
                      >
                        <span className="text-xl leading-none">{plant.icon}</span>
                        <span className="text-[9px] font-bold mt-1.5 truncate max-w-full leading-none">
                          {plant.value}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "diary" && (
          <motion.div
            key="diary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto"
          >
            <WashiTapeDivider color="moss" label="Garden Thoughts" />

            {/* Diary Input */}
            <div
              className="p-4 rounded-2xl border space-y-3"
              style={{ backgroundColor: "var(--fabric-cream)", borderColor: "color-mix(in srgb, var(--wood-oak) 15%, transparent)" }}
            >
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                <Feather className="w-3.5 h-3.5" />
                What's on your mind today, love?
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write something warm..."
                  value={diaryInput}
                  onChange={function (e) { setDiaryInput(e.target.value); }}
                  onKeyDown={function (e) {
                    if (e.key === "Enter") { e.preventDefault(); addDiaryEntry(); }
                  }}
                  className="flex-1 px-3 py-2 text-xs bg-white/60 border border-white/70 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder-gray-400"
                />
                <button
                  onClick={addDiaryEntry}
                  disabled={!diaryInput.trim()}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-95"
                >
                  Plant Thought
                </button>
              </div>
            </div>

            {/* Diary Entries */}
            <div className="mt-4 space-y-2">
              {diaryEntries.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="flex justify-center">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-full">
                      <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] italic">
                    No whispers yet... plant your first thought above!
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]/50">
                    Every garden starts with a single seed.
                  </p>
                </div>
              ) : (
                diaryEntries.map(function (entry, idx) {
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.3 }}
                      className="flex items-start gap-2.5 p-3 bg-white/50 border border-[var(--wood-oak)]/10 rounded-xl"
                    >
                      <div className="flex-shrink-0 mt-0.5">{renderFlower(idx)}</div>
                      <div className="flex-1 min-w-0">
                        {entry.authorId && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <User className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                            <span className="text-[8px] font-bold text-[var(--primary)] font-mono uppercase tracking-wider">
                              {entry.authorId === "user_a" ? userA.name.split(" ")[0] : userB.name.split(" ")[0]}
                            </span>
                          </div>
                        )}
                        <p className="text-[11px] text-[var(--text-main)] leading-relaxed break-words">
                          {entry.text}
                        </p>
                        <p className="text-[8px] font-mono text-[var(--text-muted)] mt-1">
                          {entry.date}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Diary note */}
            {diaryEntries.length > 0 && (
              <p className="text-[8px] text-[var(--text-muted)]/50 text-center mt-3 flex items-center justify-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                <span>{diaryEntries.length} whisper{diaryEntries.length !== 1 ? "s" : ""} planted in the garden</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
