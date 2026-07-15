/**
 * LoveWheel.tsx — The Love Wheel (Anti-Dilemma Decision Spinner)
 * Interactive wooden-styled physical spinning wheel for couples to solve daily decisions.
 * Features customizable options, fluid spin physics, synthesizer sound tick alerts, and Firestore sync.
 */
import React, { useState, useEffect, useRef } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, Play, Settings2, Plus, Trash2, CheckCircle2, RotateCcw, X } from "lucide-react";
import { getDb } from "../../firebaseClient";
import { toast } from "sonner";
import { triggerHaptic } from "../../lib/haptics";

interface Category {
  id: string;
  name: string;
  emoji: string;
  defaultOptions: string[];
}

const CATEGORIES: Category[] = [
  {
    id: "makan",
    name: "Eat What?",
    emoji: "🍔",
    defaultOptions: ["Seafood 🍤", "Burgers 🍔", "Pizza Night 🍕", "Cook Together 🍳", "Sushi 🍣", "Partner's Choice 👑", "Ramen 🍜", "Fried Rice 🍚"]
  },
  {
    id: "nonton",
    name: "Watch What?",
    emoji: "🍿",
    defaultOptions: ["Scary Movie 👻", "Romantic Drama 🌸", "Action Movie 💥", "Sci-Fi / Anime 🌌", "Partner's Choice 👑", "Your Choice ✨", "Comedy 🎭", "Documentary 🎥"]
  },
  {
    id: "game",
    name: "What Game?",
    emoji: "🎮",
    defaultOptions: ["Minecraft 🧱", "Overcooked! 🍳", "It Takes Two 🧸", "Shooter Game 🔫", "Mobile Legends ⚔️", "Stardew Valley 🌾", "Board Games 🎲", "Quiz Time 🧠"]
  }
];

// Synth audio helpers for physical simulation feedback
const playTickSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(550, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {
    // Silent fail if audio context is blocked
  }
};

const playWinnerSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const playTone = (freq: number, delay: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur);
    };
    
    // Play sweet arpeggio
    playTone(523.25, 0, 0.25);   // C5
    playTone(659.25, 0.08, 0.25); // E5
    playTone(783.99, 0.16, 0.3);  // G5
    playTone(1046.50, 0.24, 0.45); // C6
  } catch (e) {
    // Silent fail
  }
};

export function LoveWheel({ compact = false }: { compact?: boolean }) {
  const { currentUser, userA, userB } = useCouple() as any;
  const [activeCat, setActiveCat] = useState<string>("makan");
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [newOption, setNewOption] = useState<string>("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRotationRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Sync / Load Options
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      try {
        const db = await getDb();
        if ((db as any).isFallback) {
          const cached = localStorage.getItem("love_wheel_options");
          if (cached) {
            setOptions(JSON.parse(cached));
          } else {
            const initial: Record<string, string[]> = {};
            CATEGORIES.forEach(c => {
              initial[c.id] = c.defaultOptions;
            });
            setOptions(initial);
            localStorage.setItem("love_wheel_options", JSON.stringify(initial));
          }
          setLoading(false);

          const handleStorage = (e: StorageEvent) => {
            if (e.key === "love_wheel_options" && e.newValue) {
              setOptions(JSON.parse(e.newValue));
            }
          };
          window.addEventListener("storage", handleStorage);
          unsub = () => window.removeEventListener("storage", handleStorage);
          return;
        }

        const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
        const docRef = doc(db, "rooms", "love_wheel");

        unsub = onSnapshot(docRef, (docSnap: any) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && data.options) {
              setOptions(data.options);
            }
          } else {
            const initial: Record<string, string[]> = {};
            CATEGORIES.forEach(c => {
              initial[c.id] = c.defaultOptions;
            });
            setOptions(initial);
            setDoc(docRef, { options: initial }).catch(console.error);
          }
          setLoading(false);
        }, (err) => {
          console.error("Firestore love_wheel error, falling back", err);
          const cached = localStorage.getItem("love_wheel_options");
          if (cached) {
            setOptions(JSON.parse(cached));
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Failed to initialize love wheel sync", error);
        setLoading(false);
      }
    })();

    return () => {
      if (unsub) unsub();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const saveOptions = async (updated: Record<string, string[]>) => {
    setOptions(updated);
    const db = await getDb();
    if ((db as any).isFallback) {
      localStorage.setItem("love_wheel_options", JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent("storage", {
        key: "love_wheel_options",
        newValue: JSON.stringify(updated)
      }));
    } else {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "rooms", "love_wheel"), { options: updated });
      } catch (err) {
        console.error("Failed to sync wheel options to Firestore", err);
        localStorage.setItem("love_wheel_options", JSON.stringify(updated));
      }
    }
  };

  const currentList = options[activeCat] || CATEGORIES.find(c => c.id === activeCat)?.defaultOptions || [];

  // Canvas drawing logic
  const drawWheel = (rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = compact ? center - 12 : center - 16;

    ctx.clearRect(0, 0, size, size);

    const items = currentList;
    const totalSlices = items.length;
    if (totalSlices === 0) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = "#EAEAEA";
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#8C6A5C";
      ctx.stroke();
      return;
    }

    const anglePerSlice = (2 * Math.PI) / totalSlices;

    // Outer wood-like frame shadow/ring
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#F3EAD3";
    ctx.shadowColor = "rgba(40, 30, 20, 0.12)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Outer elegant wood-like brown border ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#A4745E";
    ctx.stroke();

    // Secondary inner gold accent ring
    ctx.beginPath();
    ctx.arc(center, center, radius - 4, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#D4AF37";
    ctx.stroke();

    // Warm pastel aesthetic colors
    const pastelColors = [
      "#FFECEC", // Soft Rose
      "#FFF3E3", // Warm Cream
      "#EDF7F6", // Mint/Sky Soft
      "#F3EFFF", // Lavender Soft
      "#FFFDF0", // Golden Cream
      "#EBF8FF", // Pastel blue
    ];

    // Draw the slices
    for (let i = 0; i < totalSlices; i++) {
      const startAngle = i * anglePerSlice + rotation;
      const endAngle = startAngle + anglePerSlice;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius - 5, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = pastelColors[i % pastelColors.length];
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#E8DDD0";
      ctx.stroke();

      // Draw the text
      ctx.save();
      ctx.translate(center, center);
      const textAngle = startAngle + anglePerSlice / 2;
      ctx.rotate(textAngle);

      ctx.fillStyle = "#5c4033";
      ctx.font = compact ? "bold 8px font-sans, system-ui" : "bold 10px font-sans, system-ui";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      const text = items[i].length > 14 ? items[i].slice(0, 12) + ".." : items[i];
      ctx.fillText(text, radius - 20, 0);
      ctx.restore();
    }

    // Classic central golden brass pivot
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#A4745E";
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.beginPath();
    ctx.arc(center, center, 14, 0, 2 * Math.PI);
    ctx.fillStyle = "#D4AF37";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center, center, 14, 0, 2 * Math.PI);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#FFF";
    ctx.stroke();

    ctx.fillStyle = "#FFF";
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❤️", center, center);
  };

  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [currentList, activeCat]);

  // Handle addition of options
  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOption.trim()) return;
    if (currentList.length >= 12) {
      toast.warning("Maximum 12 options for clear reading!");
      return;
    }

    const updated = {
      ...options,
      [activeCat]: [...currentList, newOption.trim()]
    };
    setNewOption("");
    await saveOptions(updated);
    toast.success("New option added successfully!");
  };

  // Remove options
  const handleRemoveOption = async (idx: number) => {
    if (currentList.length <= 2) {
      toast.warning("You must keep at least 2 options on the wheel!");
      return;
    }
    const updatedList = [...currentList];
    updatedList.splice(idx, 1);

    const updated = {
      ...options,
      [activeCat]: updatedList
    };
    await saveOptions(updated);
  };

  // Reset to default
  const handleResetToDefault = async () => {
    const defaultList = CATEGORIES.find(c => c.id === activeCat)?.defaultOptions || [];
    const updated = {
      ...options,
      [activeCat]: defaultList
    };
    await saveOptions(updated);
    toast.info("Options reset to default.");
  };

  // Realistic Spin Physics & Animation loop
  const handleSpin = () => {
    if (isSpinning || currentList.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
    triggerHaptic("heavy");
    playTickSound();

    const duration = 4000 + Math.random() * 2000; // 4 to 6 seconds duration
    const startTime = performance.now();
    const startRotation = currentRotationRef.current % (2 * Math.PI);

    // Dynamic ending rotation: spin multiple full circles plus random offset
    const fullSpins = 6 + Math.floor(Math.random() * 4);
    const targetAdditionalRotation = fullSpins * 2 * Math.PI + Math.random() * 2 * Math.PI;
    const finalRotation = startRotation + targetAdditionalRotation;

    const anglePerSlice = (2 * Math.PI) / currentList.length;
    let lastTickSliceIdx = -1;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic formula for realistic slow down decay
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easeProgress = easeOutCubic(progress);

      const currentRotation = startRotation + easeProgress * (finalRotation - startRotation);
      currentRotationRef.current = currentRotation;

      drawWheel(currentRotation);

      // Unified, mathematically perfect selection calculation
      const wheelPosition = (1.5 * Math.PI - (currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const activeIdx = Math.floor(wheelPosition / anglePerSlice) % currentList.length;

      // Play light physical tactile haptic tick and audio synthesizer pop when boundaries cross the pointer
      if (activeIdx !== lastTickSliceIdx) {
        triggerHaptic("light");
        playTickSound();
        lastTickSliceIdx = activeIdx;
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished
        setIsSpinning(false);

        // Final winner
        const selectedOption = currentList[activeIdx];
        setWinner(selectedOption);
        triggerHaptic("heavy");
        playWinnerSound();
        toast.success(`🎉 Result: ${selectedOption}`);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className={compact ? "w-full" : "mt-6 border-t border-[var(--border-color)]/60 pt-5 w-full"}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs md:text-sm font-bold font-display text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
            <span>🎡</span> The Love Wheel
          </h3>
          <span className="text-[10px] bg-rose-50/80 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
            Decision Maker
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin text-rose-500 text-lg">⏳</div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          {/* Category Tabs */}
          <div className={`flex items-center p-1 bg-gray-150/60 dark:bg-zinc-800/60 border border-gray-200/50 dark:border-zinc-700/50 rounded-xl w-full max-w-sm ${compact ? "gap-1" : "gap-1.5"}`}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  if (isSpinning) return;
                  triggerHaptic("light");
                  setActiveCat(cat.id);
                  setWinner(null);
                }}
                disabled={isSpinning}
                className={`flex-1 flex items-center justify-center gap-1 rounded-lg font-bold transition-all ${
                  compact ? "py-0.5 px-1 text-[9px]" : "py-1 px-1.5 text-[10px] sm:text-xs"
                } ${
                  activeCat === cat.id
                    ? "bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-3xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <span>{cat.emoji}</span>
                <span className={compact ? "hidden min-[380px]:inline" : ""}>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Canvas Spinner Area */}
          <div className={`relative flex flex-col items-center select-none ${compact ? "pt-2 pb-1" : "pt-4 pb-2"}`}>
            {/* Top Selector Pointer (The brass arrow indicating the selection) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20 flex flex-col items-center">
              {/* Little triangle needle */}
              <div className={`${compact ? "border-l-[8px] border-r-[8px] border-t-[10px]" : "border-l-[10px] border-r-[10px] border-t-[14px]"} w-0 h-0 border-l-transparent border-r-transparent border-t-rose-600 drop-shadow-md animate-bounce`} />
              {/* Little pivot rivet */}
              <div className={`${compact ? "w-2.5 h-2.5 -mt-3.5" : "w-3 h-3 -mt-5"} rounded-full bg-rose-700 border-2 border-white`} />
            </div>

            {/* Canvas Wheel Element */}
            <motion.div
              whileHover={isSpinning ? {} : { scale: 1.015 }}
              onClick={handleSpin}
              className={`cursor-pointer ${isSpinning ? "pointer-events-none" : ""}`}
            >
              <canvas
                ref={canvasRef}
                width={compact ? 150 : 210}
                height={compact ? 150 : 210}
                className={compact ? "w-[150px] h-[150px]" : "w-[210px] h-[210px]"}
              />
            </motion.div>

            {/* Spin / Status Floating Center Trigger Button */}
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`${compact ? "mt-2 px-3.5 py-1.5 text-[10px]" : "mt-4 px-5 py-2.5 text-xs"} bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-extrabold tracking-wider transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer`}
            >
              <Play className={compact ? "w-3 h-3 fill-current" : "w-3.5 h-3.5 fill-current"} />
              {isSpinning ? "SPINNING..." : "SPIN NOW"}
            </button>
          </div>

          {/* Winner announcement overlay / alert card */}
          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="w-full max-w-xs bg-rose-50/80 dark:bg-rose-500/5 border border-rose-100/80 dark:border-rose-500/10 rounded-2xl p-3 text-center flex flex-col items-center space-y-1"
              >
                <div className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">🌟 Perfect Decision 🌟</div>
                <div className="text-sm font-extrabold font-serif italic text-rose-800 dark:text-rose-300">
                  {winner}
                </div>
                <button
                  onClick={() => setWinner(null)}
                  className="text-[9px] text-gray-400 hover:text-gray-600 transition-colors pt-1 underline"
                >
                  Close Result
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit / Config Trigger Button */}
          <button
            onClick={() => {
              triggerHaptic("light");
              setShowConfig(!showConfig);
            }}
            className="text-[10px] text-gray-500 dark:text-gray-400 hover:text-rose-500 hover:underline flex items-center gap-1 cursor-pointer transition-colors pt-1"
          >
            <Settings2 className="w-3 h-3" /> Edit Wheel Options
          </button>

          {/* Config sliding-down form */}
          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full overflow-hidden border-t border-gray-100 dark:border-zinc-800 pt-3 mt-1"
              >
                <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-3 border border-gray-100 dark:border-zinc-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Current Options ({currentList.length})</span>
                    <button
                      onClick={handleResetToDefault}
                      className="text-[9px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Reset to Default
                    </button>
                  </div>

                  {/* Options List */}
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {currentList.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-750 rounded-lg px-2 py-1 text-xs"
                      >
                        <span className="text-gray-700 dark:text-gray-300 truncate font-medium">{opt}</span>
                        <button
                          onClick={() => handleRemoveOption(idx)}
                          disabled={currentList.length <= 2}
                          className="text-gray-400 hover:text-rose-500 disabled:opacity-30 p-0.5 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Input */}
                  <form onSubmit={handleAddOption} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add new option..."
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      maxLength={20}
                      className="flex-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      type="submit"
                      className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer flex items-center gap-0.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
