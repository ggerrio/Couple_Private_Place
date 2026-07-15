import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, ChevronRight, Calendar, MapPin, 
  Sparkles, Heart, RefreshCw, Layers, Eye, Printer
} from "lucide-react";
import { triggerHaptic } from "../../lib/haptics";
import { cn } from "../../lib/utils";

interface OpenBookSpreadProps {
  items: any[];
  onClose?: () => void;
  onSelectItem?: (item: any) => void;
}

const WEATHER_ICONS: Record<string, string> = { sunny: "☀️", rainy: "🌧️", cloudy: "⛅", snowy: "❄️", windy: "💨" };
const MOOD_ICONS: Record<string, string> = { happy: "😊", cozy: "🧸", excited: "🌟", peaceful: "🍃", sleepy: "😴", loved: "💖" };

export default function OpenBookSpread({ items, onClose, onSelectItem }: OpenBookSpreadProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [ambientMode, setAmbientMode] = useState<"natural" | "goldenhour" | "candlelight">("natural");
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 bg-white/20 dark:bg-stone-900/20 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800">
        <p className="text-sm text-[var(--text-muted)] italic">Your story is waiting to be written. Add some journal entries or milestones first! 📖</p>
      </div>
    );
  }

  const activeItem = items[currentPage];

  const handleNext = () => {
    if (currentPage < items.length - 1 && !isFlipping) {
      triggerHaptic("medium");
      setFlipDirection("next");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setIsFlipping(false);
      }, 400);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0 && !isFlipping) {
      triggerHaptic("medium");
      setFlipDirection("prev");
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1);
        setIsFlipping(false);
      }, 400);
    }
  };

  // Helper to extract image
  const getItemImage = (item: any) => {
    if (item.raw.imageUrl) return item.raw.imageUrl;
    const mood = item.raw.mood;
    if (mood === "cozy") return "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop";
    if (mood === "happy") return "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop";
    if (mood === "excited") return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800&auto=format&fit=crop";
    if (mood === "peaceful") return "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800&auto=format&fit=crop";
    if (mood === "sleepy") return "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop";
    if (mood === "loved") return "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=800&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop";
  };

  const cleanTitle = (title: string, itemType: string) => {
    if (!title) return "A Quiet Moment 🌿";
    if (title.includes("${LAYOUTS[")) {
      return "Our Photobooth Strip 📸";
    }
    return title;
  };

  const itemImage = getItemImage(activeItem);
  const formattedDate = new Date(activeItem.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const spiralRingsCount = 9;

  return (
    <div className="space-y-6">
      {/* Atmosphere control bar & info */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--fabric-cream)]/80 dark:bg-stone-900/40 p-4 rounded-3xl border border-[var(--wood-oak)]/10 backdrop-blur-md no-print">
        <div className="text-left">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--primary)] block mb-0.5">Scrapbook Reader</span>
          <h4 className="text-sm font-serif font-bold text-[var(--text-main)] flex items-center gap-1.5">
            📖 Flipping page {currentPage + 1} of {items.length} keepsakes
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Ambient Overlay Selection Buttons */}
          <div className="flex items-center gap-1.5 bg-black/5 dark:bg-black/30 p-1 rounded-2xl border border-[var(--border-color)]">
            <button
              onClick={() => { triggerHaptic("light"); setAmbientMode("natural"); }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer",
                ambientMode === "natural"
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              )}
              title="Standard room light"
            >
              <span>🌿</span> Natural
            </button>
            <button
              onClick={() => { triggerHaptic("light"); setAmbientMode("goldenhour"); }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer",
                ambientMode === "goldenhour"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              )}
              title="Warm sunset aesthetic"
            >
              <span>🌅</span> Sunset
            </button>
            <button
              onClick={() => { triggerHaptic("light"); setAmbientMode("candlelight"); }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer",
                ambientMode === "candlelight"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
              )}
              title="Flickering candlelight at night"
            >
              <span>🕯️</span> Candle
            </button>
          </div>

          {/* Export / Print Button */}
          <button
            onClick={() => {
              triggerHaptic("medium");
              import("sonner").then(({ toast }) => {
                toast.info("Preparing your lovely scrapbook spread for printing... 🖨️💝");
              });
              setTimeout(() => {
                window.print();
              }, 600);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl transition-all cursor-pointer shadow-3xs"
            title="Download or Print physical open book spread"
          >
            <Printer className="w-3.5 h-3.5 animate-pulse" />
            <span>Export Spread</span>
          </button>
        </div>
      </div>

      {/* Main 3D Journal Spread Container */}
      <div 
        id="printable-scrapbook-spread"
        className={cn(
          "relative mx-auto w-full max-w-5xl rounded-[32px] border-4 border-[#3e2723] dark:border-stone-950 p-2.5 sm:p-4 bg-[#2f1f17] dark:bg-stone-900 shadow-2xl transition-all duration-300",
          ambientMode === "goldenhour" && "ambient-goldenhour",
          ambientMode === "candlelight" && "ambient-candlelight"
        )}
        style={{ perspective: "2000px" }}
      >
        {/* Soft realistic leather book jacket texture behind pages */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#1a100a] opacity-35 pointer-events-none rounded-[28px]" />

        {/* The open book body */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden rounded-2xl bg-[#EFECE6] dark:bg-[#201d1c] shadow-[0_15px_40px_rgba(0,0,0,0.5)] transform-style-3d">
          
          {/* 📖 LEFT PAGE: Creative Visual Polaroid Collage / Photo display */}
          <div className="relative p-6 sm:p-8 md:p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#cbd5e1]/30 dark:border-white/5 shadow-[inset_-20px_0_25px_rgba(0,0,0,0.04)] bg-[#FDFBF7] dark:bg-[#1f1e29] min-h-[350px] md:min-h-[500px]">
            {/* Paper Grain Overlay */}
            <div 
              className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBoNjBNMCAyMGg2ME0wIDMwaDYwTTAgNDBoNjBNMCA1MGg2ME0xMCAwdjYwTTIwIDB2NjBNMzAgMHY2ME00MCAwdjYwTTUwIDB2NjAiIHN0cm9rZT0iIzhiNzM1NSIgc3Ryb2tlLXdpZHRoPSIwLjE1IiBvcGFjaXR5PSIwLjA4IiBmaWxsPSJub25lIi8+PC9zdmc+"), url("data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper-grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' result='noise' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23paper-grain)'/%3E%3C/svg%3E")`
              }}
            />

            {/* Elegant stitching borders */}
            <div className="absolute inset-4 border border-dashed border-amber-900/10 dark:border-white/10 pointer-events-none rounded-xl" />

            {/* Hole punches for wire spiral */}
            <div className="absolute right-2 top-0 bottom-0 w-2 flex flex-col justify-between py-8 pointer-events-none z-10">
              {Array.from({ length: spiralRingsCount }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-stone-900/60 dark:bg-stone-950/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
              ))}
            </div>

            {/* Page shadow depth fold effect (left page inner curve) */}
            <div className="absolute top-0 right-0 bottom-0 w-12 pointer-events-none bg-gradient-to-l from-black/10 via-black/[0.02] to-transparent z-10" />

            {/* Rotating 3D interactive layout for page change */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ 
                  opacity: 0, 
                  x: flipDirection === "next" ? 20 : -20 
                }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ 
                  opacity: 0, 
                  x: flipDirection === "next" ? -20 : 20 
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="w-full flex flex-col items-center justify-center"
              >
                {/* Tactile Polaroid Photo Frame */}
                <div 
                  className="bg-white dark:bg-stone-50 p-4 pb-14 border border-neutral-200/60 rounded-sm shadow-[0_12px_32px_rgba(0,0,0,0.15)] relative max-w-[280px] w-full transform -rotate-2 hover:rotate-0 transition-transform duration-300"
                  onClick={() => onSelectItem?.(activeItem)}
                >
                  {/* Decorative Washi Tape */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#E8B4B8_4px,#E8B4B8_8px)] opacity-50 rounded-sm transform rotate-1 z-10 shadow-xs" />

                  {/* Polaroid Photo aspect-square */}
                  <div className="w-full aspect-square bg-stone-100 overflow-hidden border border-stone-200 relative group cursor-zoom-in">
                    <img 
                      src={itemImage} 
                      alt={activeItem.raw.title} 
                      className={cn(
                        "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
                        activeItem.raw.filterClass || ""
                      )}
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Retro Filter Leak overlay */}
                    {activeItem.raw.filterClass === "light-leak" && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-rose-500/20 to-transparent pointer-events-none mix-blend-screen" />
                    )}
                  </div>

                  {/* Polaroid handwritten caption/date */}
                  <div className="absolute bottom-3 left-4 right-4 text-center">
                    <p className="font-handwrite-curly text-gel-blue text-lg tracking-wide font-bold italic leading-none rotate-[0.5deg]">
                      {formattedDate}
                    </p>
                    <p className="font-sans text-[8px] uppercase tracking-wider text-stone-400 mt-1">
                      ✦ captured moment ✦
                    </p>
                  </div>
                </div>

                {/* Cute Sticker elements under polaroid */}
                <div className="mt-6 flex gap-4 pointer-events-none select-none">
                  <div className="w-10 h-10 bg-pink-100/70 border border-white dark:border-pink-900 rounded-full shadow-xs flex items-center justify-center text-sm transform -rotate-12">
                    💝
                  </div>
                  <div className="font-handwrite text-gel-blue text-sm rotate-3 tracking-wider bg-yellow-100/60 border border-yellow-200 px-2.5 py-0.5 rounded shadow-2xs">
                    "Forever yours"
                  </div>
                  <div className="w-9 h-9 bg-amber-100/70 border border-white rounded-full shadow-xs flex items-center justify-center text-sm transform rotate-12">
                    ✨
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 📖 RIGHT PAGE: Narrative text and journal logging */}
          <div className="relative p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-[#FCFAF5] dark:bg-[#1a1924] min-h-[400px] md:min-h-[500px]">
            {/* Paper Grain Overlay */}
            <div 
              className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMTBoNjBNMCAyMGg2ME0wIDMwaDYwTTAgNDBoNjBNMCA1MGg2ME0xMCAwdjYwTTIwIDB2NjBNMzAgMHY2ME00MCAwdjYwTTUwIDB2NjAiIHN0cm9rZT0iIzhiNzM1NSIgc3Ryb2tlLXdpZHRoPSIwLjE1IiBvcGFjaXR5PSIwLjA4IiBmaWxsPSJub25lIi8+PC9zdmc+"), url("data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper-grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='5' result='noise' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23paper-grain)'/%3E%3C/svg%3E")`
              }}
            />

            {/* Elegant stitching borders */}
            <div className="absolute inset-4 border border-dashed border-amber-900/10 dark:border-white/10 pointer-events-none rounded-xl" />

            {/* Hole punches for wire spiral */}
            <div className="absolute left-2 top-0 bottom-0 w-2 flex flex-col justify-between py-8 pointer-events-none z-10">
              {Array.from({ length: spiralRingsCount }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-stone-900/60 dark:bg-stone-950/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
              ))}
            </div>

            {/* Page shadow depth fold effect (right page inner curve) */}
            <div className="absolute top-0 left-0 bottom-0 w-12 pointer-events-none bg-gradient-to-r from-black/10 via-black/[0.02] to-transparent z-10" />

            {/* Changing content animates with a 3D leaf rotation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ 
                  opacity: 0, 
                  x: flipDirection === "next" ? -20 : 20 
                }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ 
                  opacity: 0, 
                  x: flipDirection === "next" ? 20 : -20 
                }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="w-full h-full flex flex-col justify-between text-left"
              >
                {/* Journal top bar: Badge, Weather, Location */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={cn(
                      "text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border shadow-2xs",
                      activeItem.type === "journal"
                        ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40"
                        : "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40"
                    )}>
                      {activeItem.type}
                    </span>

                    {/* Cute atmospheric stats */}
                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-stone-500">
                      {activeItem.raw.weather && (
                        <span className="flex items-center gap-0.5" title={`Weather: ${activeItem.raw.weather}`}>
                          {WEATHER_ICONS[activeItem.raw.weather] || "☀️"}
                          <span className="text-[10px] uppercase font-bold">{activeItem.raw.weather}</span>
                        </span>
                      )}
                      {activeItem.raw.weather && activeItem.raw.mood && <span>·</span>}
                      {activeItem.raw.mood && (
                        <span className="flex items-center gap-0.5" title={`Mood: ${activeItem.raw.mood}`}>
                          {MOOD_ICONS[activeItem.raw.mood] || "💖"}
                          <span className="text-[10px] uppercase font-bold">{activeItem.raw.mood}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title of the day */}
                  <h3 className="text-xl font-serif font-black text-stone-800 dark:text-stone-100 tracking-tight leading-snug">
                    {cleanTitle(activeItem.raw.title, activeItem.type)}
                  </h3>

                  {/* Interactive details (Location) */}
                  {activeItem.raw.location && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-stone-500">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{activeItem.raw.location}</span>
                    </div>
                  )}

                  {/* Horizontal torn paper line divider */}
                  <div className="h-2 w-full bg-[radial-gradient(ellipse_at_center,rgba(139,115,85,0.2)_0%,transparent_75%)]" />

                  {/* JOURNAL CONTENT: Hand-written / gel pen cursive styling */}
                  <div className="relative mt-2 p-3 bg-stone-50/40 dark:bg-stone-900/10 rounded-2xl border border-dashed border-stone-200/50">
                    <p className="font-gel-blue text-[19px] italic leading-relaxed whitespace-pre-wrap max-h-[220px] overflow-y-auto pr-2">
                      {activeItem.raw.description || "A beautiful memory with no words needed... Just love. ❤️"}
                    </p>
                  </div>
                </div>

                {/* Journal bottom bar: Tags & Sweet Reactions */}
                <div className="mt-6 pt-4 border-t border-dashed border-stone-200 dark:border-stone-800 space-y-3">
                  {/* Journal tags */}
                  {activeItem.raw.tags && activeItem.raw.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeItem.raw.tags.map((tag: string) => (
                        <span 
                          key={tag} 
                          className="text-[9px] font-mono font-bold text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Interactive Love Stamp Action */}
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => onSelectItem?.(activeItem)}
                      className="text-[10px] font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View full memory details ✦
                    </button>

                    {/* Cute wax seal / stamp */}
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      className="w-11 h-11 rounded-full bg-rose-600 border-2 border-dashed border-rose-100 flex flex-col items-center justify-center text-rose-100 text-[10px] font-bold tracking-widest cursor-pointer shadow-md select-none transform rotate-12"
                      title="Shared keepsake wax stamp"
                    >
                      <span className="leading-none text-xs">❤️</span>
                      <span className="text-[5px] scale-90 leading-none">SEAL</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ⛓️ CENTER WIRE RING BINDER COLLAR RINGS */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-8 pointer-events-none z-30 flex flex-col justify-between py-8">
            {Array.from({ length: spiralRingsCount }).map((_, i) => (
              <div key={i} className="relative w-12 -left-2 h-4 flex items-center justify-center">
                {/* 3D wire ring curves over the pages */}
                <div 
                  className="w-8 h-2.5 rounded-full border-t-[3px] border-b-[3px] border-r-[4.5px] border-l-[1px] border-stone-300 dark:border-stone-500 shadow-[2px_2px_4px_rgba(0,0,0,0.4)]"
                  style={{
                    background: "linear-gradient(to right, #94a3b8, #f1f5f9, #cbd5e1, #64748b, #475569)",
                    clipPath: "ellipse(100% 50% at 50% 50%)"
                  }}
                />
              </div>
            ))}
          </div>

        </div>

        {/* Floating flipping page transition preview (3D leaf flip) */}
        {isFlipping && (
          <div 
            className="absolute top-4 bottom-4 w-1/2 overflow-hidden bg-[#eae5dc] dark:bg-stone-800 shadow-[10px_0_30px_rgba(0,0,0,0.15)] rounded-r-xl border-r border-[#d2cab4]/60 pointer-events-none z-20 transform-style-3d transition-all duration-300"
            style={{
              left: flipDirection === "next" ? "50%" : "0%",
              transformOrigin: flipDirection === "next" ? "left center" : "right center",
              animation: flipDirection === "next" 
                ? "flip-page-next 0.4s ease-in-out forwards" 
                : "flip-page-prev 0.4s ease-in-out forwards"
            }}
          >
            {/* Paper texture for flipping element */}
            <div className="w-full h-full p-10 flex flex-col justify-center items-center opacity-60">
              <span className="text-3xl">📖</span>
              <span className="text-[10px] font-mono font-bold text-stone-400 mt-2 uppercase tracking-widest">
                Flipping Page...
              </span>
            </div>
          </div>
        )}

        {/* 📚 3D CSS Animation & Print definition */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes flip-page-next {
            0% { transform: rotateY(0deg); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
            50% { transform: rotateY(-90deg); box-shadow: 0 20px 40px rgba(0,0,0,0.25); }
            100% { transform: rotateY(-180deg); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
          }
          @keyframes flip-page-prev {
            0% { transform: rotateY(0deg); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
            50% { transform: rotateY(90deg); box-shadow: 0 20px 40px rgba(0,0,0,0.25); }
            100% { transform: rotateY(180deg); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
          }
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
            #printable-scrapbook-spread {
              position: relative !important;
              width: 100% !important;
              max-width: 100% !important;
              left: 0 !important;
              top: 0 !important;
              margin: 0 !important;
              padding: 4px !important;
              border: none !important;
              box-shadow: none !important;
              background: #fdfbf7 !important;
            }
          }
        ` }} />
      </div>

      {/* Navigation and interactive actions */}
      <div className="flex items-center justify-between max-w-sm mx-auto no-print">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0 || isFlipping}
          className="flex items-center gap-1 px-4.5 py-2 rounded-full border border-[var(--wood-oak)]/20 bg-[#FDFBF7] dark:bg-stone-800 text-[var(--primary)] text-xs font-bold shadow-sm hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <span className="text-xs font-mono font-bold text-stone-500">
          Page {currentPage + 1} / {items.length}
        </span>

        <button
          onClick={handleNext}
          disabled={currentPage === items.length - 1 || isFlipping}
          className="flex items-center gap-1 px-4.5 py-2 rounded-full border border-[var(--wood-oak)]/20 bg-[#FDFBF7] dark:bg-stone-800 text-[var(--primary)] text-xs font-bold shadow-sm hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
