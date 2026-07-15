import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronDown, Save, Plus, Smile, HelpCircle, 
  RefreshCw, ZoomIn, ZoomOut, FileText, Trash2,
  ArrowUp, ArrowDown, Settings, Scissors
} from "lucide-react";
import { cn } from "../../lib/utils";
import { triggerHaptic } from "../../lib/haptics";

export interface BoardElement {
  id: string;
  memoryId?: string;
  type: "polaroid" | "sticky" | "sticker" | "washi";
  x: number;
  y: number;
  scale: number;
  rotate: number;
  text?: string;
  sticker?: string;
  washiType?: string;
  color?: "yellow" | "pink" | "blue" | "green" | "amber";
  zIndex?: number;
}

interface CreativeDrawerProps {
  onAddStickyNote: () => void;
  onAddWashiTape: (washiType: string) => void;
  onAddOrnament: (emoji: string) => void;
  onManualSave: () => void;
  isSavingLayout: boolean;
  onResetBoard: () => void;
  activeElement: BoardElement | undefined;
  onRotateDirect: (degrees: number) => void;
  onScaleSelected: (dir: "up" | "down") => void;
  onStartEditText: (el: BoardElement) => void;
  onRemoveElement: (id: string) => void;
  bringToFront: () => void;
  sendToBack: () => void;
}

const WASHI_PRESETS = [
  { id: "stripes", label: "Pastel Stripes", bg: "repeating-linear-gradient(45deg, #fbcfe8, #fbcfe8 10px, #fdf2f8 10px, #fdf2f8 20px)" },
  { id: "floral", label: "Rose Petal Floral", bg: "radial-gradient(circle, #fde047 10%, transparent 11%), radial-gradient(circle, #fbcfe8 20%, transparent 21%)" },
  { id: "polka-dots", label: "Sage Polka Dots", bg: "radial-gradient(#bbf7d0 15%, transparent 16%) 0 0 / 12px 12px, radial-gradient(#bbf7d0 15%, transparent 16%) 6px 6px / 12px 12px", bgColor: "#f0fdf4" },
  { id: "glitter", label: "Cosmic Sparkle", bg: "linear-gradient(135deg, #c084fc 0%, #818cf8 100%)" },
  { id: "vintage", label: "Craft Paper", bg: "#f5e0c3" },
];

const STICKER_PRESETS_WITH_LABELS = [
  { emoji: "❤️", label: "Sweet Heart" },
  { emoji: "💖", label: "Shiny Heart" },
  { emoji: "✨", label: "Fairy Sparkles" },
  { emoji: "🧸", label: "Warm Teddy" },
  { emoji: "🌸", label: "Cherry Blossom" },
  { emoji: "☕", label: "Cozy Coffee" },
  { emoji: "📷", label: "Retro Camera" },
  { emoji: "🌟", label: "Bright Star" },
  { emoji: "🩹", label: "Bandage Tape" },
  { emoji: "🎀", label: "Cute Ribbon" },
  { emoji: "🍃", label: "Scented Leaf" },
  { emoji: "🍀", label: "Lucky Clover" },
  { emoji: "🌻", label: "Sunflower" },
  { emoji: "💌", label: "Love Letter" },
  { emoji: "🕯️", label: "Warm Candle" },
  { emoji: "🍿", label: "Movie Popcorn" },
  { emoji: "🎈", label: "Rose Balloon" },
  { emoji: "🐱", label: "Playful Kitty" },
  { emoji: "🐾", label: "Puppy Paws" },
  { emoji: "🍕", label: "Yummy Pizza" },
];

export function CreativeDrawer({
  onAddStickyNote,
  onAddWashiTape,
  onAddOrnament,
  onManualSave,
  isSavingLayout,
  onResetBoard,
  activeElement,
  onRotateDirect,
  onScaleSelected,
  onStartEditText,
  onRemoveElement,
  bringToFront,
  sendToBack
}: CreativeDrawerProps) {
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [washiDropdownOpen, setWashiDropdownOpen] = useState(false);
  const [ornamentDropdownOpen, setOrnamentDropdownOpen] = useState(false);

  const washiRef = useRef<HTMLDivElement>(null);
  const ornamentRef = useRef<HTMLDivElement>(null);
  const washiTriggerRef = useRef<HTMLButtonElement>(null);
  const ornamentTriggerRef = useRef<HTMLButtonElement>(null);

  const [washiPos, setWashiPos] = useState<{ bottom: number; left: number } | null>(null);
  const [ornamentPos, setOrnamentPos] = useState<{ bottom: number; left: number } | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        washiRef.current && 
        !washiRef.current.contains(event.target as Node) &&
        !(event.target instanceof Element && event.target.closest(".washi-portal-dropdown"))
      ) {
        setWashiDropdownOpen(false);
      }
      if (
        ornamentRef.current && 
        !ornamentRef.current.contains(event.target as Node) &&
        !(event.target instanceof Element && event.target.closest(".ornament-portal-dropdown"))
      ) {
        setOrnamentDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync positions for React Portal dropdowns
  useEffect(() => {
    if (!washiDropdownOpen && !ornamentDropdownOpen) return;
    
    function updatePositions() {
      if (washiDropdownOpen && washiTriggerRef.current) {
        const rect = washiTriggerRef.current.getBoundingClientRect();
        const left = Math.max(16, Math.min(rect.left, window.innerWidth - 240));
        setWashiPos({
          bottom: window.innerHeight - rect.top + 8,
          left
        });
      }
      if (ornamentDropdownOpen && ornamentTriggerRef.current) {
        const rect = ornamentTriggerRef.current.getBoundingClientRect();
        const left = Math.max(16, Math.min(rect.left, window.innerWidth - 272));
        setOrnamentPos({
          bottom: window.innerHeight - rect.top + 8,
          left
        });
      }
    }
    
    updatePositions();
    window.addEventListener("resize", updatePositions);
    window.addEventListener("scroll", updatePositions, true);
    return () => {
      window.removeEventListener("resize", updatePositions);
      window.removeEventListener("scroll", updatePositions, true);
    };
  }, [washiDropdownOpen, ornamentDropdownOpen]);

  return (
    <div 
      id="creative-drawer"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-3xl w-[calc(100%-2rem)] z-[150] bg-white/95 dark:bg-stone-900/95 border border-[var(--border-color)] dark:border-white/5 shadow-2xl rounded-2xl p-4 transition-all duration-300 backdrop-blur-md"
    >
      {/* Drawer Header & Collapse trigger */}
      <div className="flex items-center justify-between border-b border-stone-200/50 dark:border-stone-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black tracking-wide text-stone-800 dark:text-neutral-100 uppercase">
              Creative Stationery Chest
            </h3>
            <p className="text-[10px] text-stone-500 font-medium">
              Decorate our desktop with pretty ribbons, craft notes, and lovely stickers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset button inside drawer */}
          <button
            onClick={() => {
              triggerHaptic("medium");
              onResetBoard();
            }}
            className="p-1.5 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-red-950/20 text-stone-400 rounded-lg transition-colors cursor-pointer"
            title="Reset Desk Elements"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setIsDrawerCollapsed(!isDrawerCollapsed);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-neutral-300 rounded-lg transition-all cursor-pointer select-none"
          >
            <span>{isDrawerCollapsed ? "Open Chest" : "Collapse"}</span>
            <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isDrawerCollapsed && "rotate-180")} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isDrawerCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-visible space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Creator Station Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Add Sticky Note */}
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    onAddStickyNote();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-200 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sticky Note</span>
                </button>

                {/* 2. Custom Washi Tape Dropdown Selector */}
                <div ref={washiRef} className="relative">
                  <button
                    ref={washiTriggerRef}
                    onClick={() => {
                      triggerHaptic("light");
                      setWashiDropdownOpen(!washiDropdownOpen);
                      setOrnamentDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200/50 dark:bg-pink-950/20 dark:border-pink-900/30 dark:text-pink-300 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
                  >
                    <span>🩹 Tape Ribbon</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 opacity-60 transition-transform", washiDropdownOpen && "rotate-180")} />
                  </button>

                  {typeof document !== "undefined" && createPortal(
                    <AnimatePresence>
                      {washiDropdownOpen && washiPos && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="fixed mb-2 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl p-2.5 z-[210] flex flex-col gap-1 text-left washi-portal-dropdown"
                          style={{
                            bottom: `${washiPos.bottom}px`,
                            left: `${washiPos.left}px`,
                          }}
                        >
                          <span className="text-[9px] font-mono font-extrabold text-stone-400 dark:text-stone-500 uppercase tracking-wider block px-1 pb-1.5 border-b border-stone-100 dark:border-stone-800">
                            Washi Ribbon Preview
                          </span>
                          <div className="space-y-1 mt-1.5 max-h-48 overflow-y-auto">
                            {WASHI_PRESETS.map((tape) => (
                              <button
                                key={tape.id}
                                onClick={() => {
                                  triggerHaptic("light");
                                  onAddWashiTape(tape.id);
                                  setWashiDropdownOpen(false);
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/80 transition-all border border-transparent hover:border-stone-100 dark:hover:border-stone-800 text-left cursor-pointer group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-12 h-4 rounded-xs border border-white/20 shadow-3xs transition-transform group-hover:scale-105"
                                    style={{
                                      backgroundImage: (tape.bg.startsWith("linear-gradient") || tape.bg.startsWith("radial-gradient") || tape.bg.startsWith("repeating-")) ? tape.bg : undefined,
                                      backgroundColor: (tape.bg.startsWith("linear-gradient") || tape.bg.startsWith("radial-gradient") || tape.bg.startsWith("repeating-")) ? (tape.bgColor || undefined) : tape.bg,
                                    }}
                                  />
                                  <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">
                                    {tape.label}
                                  </span>
                                </div>
                                <span className="text-[10px] text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity font-extrabold">
                                  + Add
                                </span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>,
                    document.body
                  )}
                </div>

                {/* 3. Custom Ornament Dropdown Selector */}
                <div ref={ornamentRef} className="relative">
                  <button
                    ref={ornamentTriggerRef}
                    onClick={() => {
                      triggerHaptic("light");
                      setOrnamentDropdownOpen(!ornamentDropdownOpen);
                      setWashiDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200/50 dark:bg-yellow-950/20 dark:border-yellow-900/30 dark:text-yellow-300 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
                  >
                    <span>✨ Ornaments</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 opacity-60 transition-transform", ornamentDropdownOpen && "rotate-180")} />
                  </button>

                  {typeof document !== "undefined" && createPortal(
                    <AnimatePresence>
                      {ornamentDropdownOpen && ornamentPos && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="fixed mb-2 w-64 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl p-3 z-[210] text-left ornament-portal-dropdown"
                          style={{
                            bottom: `${ornamentPos.bottom}px`,
                            left: `${ornamentPos.left}px`,
                          }}
                        >
                          <span className="text-[9px] font-mono font-extrabold text-stone-400 dark:text-stone-500 uppercase tracking-wider block pb-1.5 border-b border-stone-100 dark:border-stone-800">
                            Visual Ornament Sticker List
                          </span>
                          <div className="grid grid-cols-4 gap-2 mt-2 max-h-52 overflow-y-auto pr-0.5">
                            {STICKER_PRESETS_WITH_LABELS.map((item) => (
                              <button
                                key={item.emoji}
                                onClick={() => {
                                  triggerHaptic("light");
                                  onAddOrnament(item.emoji);
                                  setOrnamentDropdownOpen(false);
                                }}
                                className="group flex flex-col items-center justify-center p-1.5 rounded-lg border border-dashed border-stone-200/60 hover:border-yellow-300 dark:border-stone-800 dark:hover:border-stone-700 bg-stone-50/50 hover:bg-yellow-50/40 dark:bg-stone-900/60 dark:hover:bg-yellow-950/10 cursor-pointer transition-all active:scale-95"
                                title={item.label}
                              >
                                <span className="text-xl group-hover:scale-120 transition-transform filter drop-shadow-sm">
                                  {item.emoji}
                                </span>
                                <span className="text-[8px] font-bold text-stone-500 group-hover:text-yellow-700 dark:group-hover:text-yellow-400 text-center truncate w-full mt-1">
                                  {item.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>,
                    document.body
                  )}
                </div>
              </div>

              {/* Diskette Save Control */}
              <button
                onClick={onManualSave}
                disabled={isSavingLayout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/40 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Save className={cn("w-3.5 h-3.5", isSavingLayout && "animate-spin")} />
                <span>{isSavingLayout ? "Saving setores..." : "Save Layout"}</span>
              </button>
            </div>

            {/* Active Element Transformer Controls overlay */}
            <AnimatePresence>
              {activeElement && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-white/5 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs overflow-visible"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                      Selected Item:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-extrabold text-stone-700 dark:text-neutral-200 uppercase tracking-wide">
                      {activeElement.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 flex-wrap">
                    {/* Layer controls */}
                    <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-0.5 rounded-lg border border-stone-200 dark:border-stone-800">
                      <button
                        onClick={bringToFront}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-neutral-200 rounded cursor-pointer"
                        title="Bring to Front"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={sendToBack}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-neutral-200 rounded cursor-pointer"
                        title="Send to Back"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Angle Dial Slider */}
                    <div className="flex items-center gap-2 bg-white dark:bg-stone-800 px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] font-bold text-stone-400">Angle:</span>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={activeElement.rotate}
                        onChange={(e) => onRotateDirect(parseInt(e.target.value))}
                        className="w-20 accent-rose-500 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg cursor-pointer appearance-none"
                      />
                      <span className="text-[10px] font-mono font-bold text-stone-600 dark:text-stone-300 min-w-[28px] text-right">
                        {activeElement.rotate}°
                      </span>
                    </div>

                    {/* Zoom/Scale Buttons */}
                    <div className="flex items-center bg-white dark:bg-stone-800 rounded-lg p-0.5 border border-stone-200 dark:border-stone-800 shadow-3xs">
                      <button
                        onClick={() => onScaleSelected("down")}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-[10px] font-mono font-bold px-1.5 text-stone-700 dark:text-stone-300">
                        {Math.round(activeElement.scale * 100)}%
                      </div>
                      <button
                        onClick={() => onScaleSelected("up")}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Text Editor */}
                    {activeElement.type === "sticky" && (
                      <button
                        onClick={() => onStartEditText(activeElement)}
                        className="px-2.5 py-1 bg-white hover:bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-300 rounded-lg font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-stone-500" />
                        <span>Edit Message</span>
                      </button>
                    )}

                    {/* Delete Item */}
                    <button
                      onClick={() => onRemoveElement(activeElement.id)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/20 rounded-lg font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
