/**
 * MemoriesView.tsx — Rebuilt with Premium Design & Synced Real-Time Logic.
 *
 * Preserves 100% of existing functionality, Firestore room sync, camera streams,
 * caption edits, comment deletion, reactions, canvas rendering, WebP compression,
 * and Cloudinary uploads.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useCouple } from "../context/CoupleContext";
import { useCamera } from "../hooks/useCamera";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import {
  Sparkles,
  Download,
  Calendar,
  Smile,
  Plus,
  Send,
  X,
  Camera,
  Layers,
  Palette,
  Check,
  RefreshCw,
  Tv,
  Heart,
  BookOpen,
  MapPin,
  Tag,
  Trash2,
  Edit2,
  Search,
  CloudSun,
  Clock,
  Users,
  Copy,
  VideoOff,
  LogOut,
  Timer,
  ChevronLeft,
  ChevronRight,
  Image,
  MessageCircle,
  Upload,
} from "lucide-react";
import { db, uploadToCloudinary } from "../firebaseClient";
import { doc, getDoc, onSnapshot, setDoc, updateDoc, deleteDoc, arrayUnion } from "firebase/firestore";
import type { Memory, Journal, PhotoboothRoom } from "../types";

// ============================================================================
// SHARED CONSTANTS & HELPERS
// ============================================================================

const availableFilters = [
  { value: "none", label: "Natural", class: "" },
  { value: "vintage", label: "Vintage Sepia", class: "filter-vintage" },
  { value: "kodak", label: "Kodak Film", class: "filter-kodak" },
  { value: "disposable", label: "Disposable Cam", class: "filter-disposable" },
  { value: "vhs", label: "VHS Glitch", class: "filter-vhs" },
  { value: "soft-blur", label: "Dreamy Blur", class: "filter-soft-blur" },
  { value: "warm-tone", label: "Warm Milk", class: "filter-warm-tone" },
];

const bgStylesMap: Record<string, React.CSSProperties> = {
  white: { backgroundColor: "#ffffff", color: "#1f2937" },
  pink: { backgroundColor: "#fdf2f8", color: "#be185d" },
  beige: { backgroundColor: "#fffbeb", color: "#78350f" },
  sakura: { backgroundImage: "radial-gradient(circle, #fff5f5 20%, #fbb6b6 80%)", color: "#9f1239" },
  retro: { backgroundImage: "linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", color: "#9d174d" },
  pixel: { backgroundImage: "conic-gradient(from 180deg at 50% 50%, #4f46e5 0deg, #ec4899 120deg, #3b82f6 240deg, #4f46e5 360deg)", color: "#ffffff" },
  cafe: { backgroundImage: "linear-gradient(to right, #eeddbb 0%, #cca980 100%)", color: "#451a03" },
  night: { backgroundImage: "radial-gradient(circle, #1e3a8a 0%, #030712 100%)", color: "#e0e7ff" }
};

const photoboothSamplePhotos = [
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
];

const availableBackgrounds = [
  { value: "white", label: "Pure White", class: "bg-white text-gray-800" },
  { value: "pink", label: "Sakura Pink", class: "bg-pink-100 text-pink-700" },
  { value: "beige", label: "Warm Beige", class: "bg-amber-50 text-amber-900" },
  { value: "sakura", label: "Cherry Petals", class: "bg-sakura-photo text-rose-800" },
  { value: "retro", label: "Sunset Retro", class: "bg-retro-photo text-pink-800" },
  { value: "pixel", label: "Cosmic Neon", class: "bg-pixel-photo text-white" },
  { value: "cafe", label: "Brew Cafe", class: "bg-cafe-photo text-amber-950" },
  { value: "night", label: "Midnight", class: "bg-night-photo text-indigo-100" },
];

const STRIP_PRESETS = [
  { id: "classic-white", label: "Classic White", swatch: "#ffffff", frameColor: "#ffffff", textColor: "#27272a", accent: "#f43f5e" },
  { id: "pastel-pink", label: "Pastel Pink", swatch: "#ffe4ec", frameColor: "#fff0f5", textColor: "#9d174d", accent: "#f472b6" },
  { id: "mono-black", label: "Mono Black", swatch: "#111111", frameColor: "#111111", textColor: "#ffffff", accent: "#facc15" },
  { id: "kraft-paper", label: "Kraft Paper", swatch: "#e7d3b1", frameColor: "#efdfc4", textColor: "#4b3621", accent: "#a97142" },
  { id: "sky-blue", label: "Sky Blue", swatch: "#e0f2fe", frameColor: "#eaf7ff", textColor: "#075985", accent: "#38bdf8" },
];

const LAYOUTS: Record<string, { cols: number; rows: number; label: string; totalRounds: number }> = {
  "2-cut": { cols: 2, rows: 2, label: "2-Cut Strip", totalRounds: 2 },
  "4-cut": { cols: 2, rows: 4, label: "4-Cut Strip", totalRounds: 4 },
  "6-cut": { cols: 2, rows: 6, label: "6-Cut Strip", totalRounds: 6 },
  polaroid: { cols: 2, rows: 1, label: "Polaroid Duo", totalRounds: 1 },
};

const FILTERS = [
  { id: "natural", label: "Natural", css: "" },
  { id: "vintage", label: "Vintage", css: "filter-vintage" },
  { id: "kodak", label: "Kodak", css: "filter-kodak" },
  { id: "disposable", label: "Disposable", css: "filter-disposable" },
  { id: "vhs", label: "VHS", css: "filter-vhs" },
  { id: "warm-tone", label: "Warm Tone", css: "filter-warm-tone" },
];

const WEATHER_OPTIONS = ["sunny", "rainy", "cloudy", "snowy", "windy"];
const MOOD_OPTIONS = ["happy", "cozy", "excited", "peaceful", "sleepy", "loved"];
const REACTION_EMOJIS = ["💖", "✨", "☕", "🌴", "🍕", "🔥", "😭", "🌸"];
const WEATHER_ICONS: Record<string, string> = { sunny: "☀️", rainy: "🌧️", cloudy: "⛅", snowy: "❄️", windy: "💨" };
const MOOD_ICONS: Record<string, string> = { happy: "😊", cozy: "🧸", excited: "🌟", peaceful: "🍃", sleepy: "😴", loved: "💖" };

function getCanvasFilter(filterId: string): string {
  switch (filterId) {
    case "vintage":
      return "sepia(0.35) contrast(0.95) saturate(1.1) brightness(1.02)";
    case "kodak":
      return "contrast(1.1) saturate(1.3) brightness(1.05) sepia(0.05)";
    case "disposable":
      return "contrast(1.05) saturate(1.05) brightness(0.98) hover-rotate(-5deg)";
    case "vhs":
      return "contrast(1.2) brightness(1.1) saturate(0.85) sepia(0.1)";
    case "soft-blur":
      return "blur(0.5px) saturate(0.95) contrast(0.95)";
    case "warm-tone":
      return "sepia(0.15) saturate(1.2) hue-rotate(5deg)";
    default:
      return "none";
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function compressToWebP(canvas: HTMLCanvasElement, maxKB = 200): Promise<Blob> {
  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob>((res, rej) =>
      canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/webp", quality)
    );
    if (blob.size <= maxKB * 1024) return blob;
  }
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
  );
}

const cleanColors = (cssText: string): string => {
  let result = cssText;
  const oklchRegex = /oklch\(\s*([\d.%+-]+)\s+([\d.%+-]+)\s+([\d.%+-]+)(?:\s*\/\s*([\d.%+-]+))?\s*\)/gi;
  result = result.replace(oklchRegex, () => `rgba(244, 63, 94, 0.8)`);

  const oklchBalancedRegex = /oklch\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi;
  const oklabBalancedRegex = /oklab\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi;
  result = result.replace(oklchBalancedRegex, "rgba(120, 120, 120, 0.5)");
  result = result.replace(oklabBalancedRegex, "rgba(120, 120, 120, 0.5)");
  return result;
};

const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" = "light") => {
  if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
    try {
      if (type === "light") window.navigator.vibrate(12);
      else if (type === "medium") window.navigator.vibrate(35);
      else if (type === "heavy") window.navigator.vibrate(70);
      else if (type === "success") window.navigator.vibrate([20, 40, 20]);
    } catch (err) {
      console.warn("Haptics vibrate failed:", err);
    }
  }
};

const handleDownloadImage = async (url: string, title: string, awardXp: any) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${title.replace(/\s+/g, "_") || "keepsake"}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    awardXp(10, "downloaded customized keepsake 💌");
  } catch {
    window.open(url, "_blank");
  }
};

const handlePrintImage = (url: string, title: string, awardXp: any) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print this photo!");
    return;
  }
  printWindow.document.write(`
    <html>
      <head>
        <title>Print - ${title}</title>
        <style>
          body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #ffffff; font-family: sans-serif; }
          .container { text-align: center; padding: 20px; border: 1px solid #eaeaea; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 400px; }
          img { max-width: 100%; height: auto; border-radius: 4px; }
          h1 { font-size: 18px; margin-top: 15px; color: #333; }
          p { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="${url}" id="print-image" />
          <h1>✨ ${title} ✨</h1>
          <p>Our Little Universe</p>
        </div>
        <script>
          const img = document.getElementById("print-image");
          if (img.complete) {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          } else {
            img.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
  awardXp(10, "printed custom polaroid print 📸");
};

// ============================================================================
// MAIN VIEW COMPONENT
// ============================================================================

export default function MemoriesView() {
  const [activeSubTab, setActiveSubTab] = useState<"timeline" | "photobooth" | "journal">("timeline");

  return (
    <div className="space-y-6 py-2" id="memories-section">
      {/* Subtab Switcher */}
      <div className="flex justify-center border-b border-neutral-200/40 pb-1 mb-6">
        <div className="flex gap-6 sm:gap-10">
          {[
            { value: "timeline", label: "Memory Timeline", icon: Heart },
            { value: "photobooth", label: "Photobooth Studio", icon: Camera },
            { value: "journal", label: "Shared Diary", icon: BookOpen },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isSel = activeSubTab === tab.value;
            return (
              <button
                key={tab.value}
                id={`mem-tab-${tab.value}`}
                onClick={() => setActiveSubTab(tab.value as any)}
                className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all relative cursor-pointer select-none ${isSel ? "text-[var(--primary)]" : "text-gray-400 hover:text-gray-700"
                  }`}
              >
                <IconComp className="w-4 h-4" />
                {tab.label}
                {isSel && (
                  <motion.div
                    layoutId="activeMemoriesSubtab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB CONTENT PORTAL */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {activeSubTab === "timeline" && <TimelineSection key="timeline" />}
          {activeSubTab === "photobooth" && <PhotoboothSection key="photobooth" />}
          {activeSubTab === "journal" && <JournalSection key="journal" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// TIMELINE SECTION COMPONENT
// ============================================================================

function TimelineSection() {
  const {
    currentUser,
    memories,
    userReactions,
    addMemory,
    deleteMemory,
    updateMemory,
    addReactionToMemory,
    addCommentToMemory,
    deleteCommentFromMemory,
    awardXp,
    userA,
    userB,
    // ponytail: Limit pagination props
    memoriesLimit,
    loadMoreMemories,
  } = useCouple();

  const visibleMemories = memories.filter((m) => m.type !== "photobooth" || m.showOnTimeline !== false);

  // Custom milestone state
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mDescription, setMDescription] = useState("");
  const [mDate, setMDate] = useState(new Date().toISOString().split("T")[0]);
  const [mImageUrl, setMImageUrl] = useState("");
  const [mImageFile, setMImageFile] = useState<File | null>(null);
  const [mImagePreview, setMImagePreview] = useState("");
  const [mImageUploading, setMImageUploading] = useState(false);
  const milestoneFileRef = useRef<HTMLInputElement>(null);

  // Caption inline edit in modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");

  // Modal and comments state
  const [selectedMemoryForModal, setSelectedMemoryForModal] = useState<Memory | null>(null);
  const [modalCommentText, setModalCommentText] = useState("");

  // Hide bottom navbar when the memory popup modal is open
  useEffect(() => {
    if (selectedMemoryForModal) {
      window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: false }));
    } else {
      window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: true }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: true }));
    };
  }, [selectedMemoryForModal]);

  const processingReactions = useRef<Record<string, boolean>>({});

  const handleReactionClick = useCallback((memoryId: string, emoji: string) => {
    if (!currentUser || (currentUser !== "user_a" && currentUser !== "user_b")) {
      return;
    }
    const lockKey = `\${currentUser}_\${memoryId}_\${emoji}`;
    if (processingReactions.current[lockKey]) return;
    processingReactions.current[lockKey] = true;

    try {
      addReactionToMemory(memoryId, emoji);
      triggerHaptic("light");
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        processingReactions.current[lockKey] = false;
      }, 350);
    }
  }, [currentUser, addReactionToMemory]);

  const prepareStylesheetsForCapture = async () => {
    const disabledSheets = new Set<CSSStyleSheet | HTMLStyleElement | HTMLLinkElement>();
    const tempStyles: HTMLStyleElement[] = [];
    const styleElements = Array.from(document.querySelectorAll("style"));
    for (const style of styleElements) {
      const text = style.textContent || "";
      if (text.includes("oklch") || text.includes("oklab")) {
        const tempStyle = document.createElement("style");
        tempStyle.textContent = cleanColors(text);
        document.head.appendChild(tempStyle);
        tempStyles.push(tempStyle);
        style.disabled = true;
        disabledSheets.add(style);
      }
    }
    const linkElements = Array.from(document.querySelectorAll("link[rel='stylesheet']")) as HTMLLinkElement[];
    for (const link of linkElements) {
      try {
        let cssText = "";
        try {
          const sheet = link.sheet;
          if (sheet && sheet.cssRules) {
            for (let i = 0; i < sheet.cssRules.length; i++) {
              cssText += sheet.cssRules[i].cssText + "\n";
            }
          }
        } catch { /* skip */ }
        if (!cssText) {
          const response = await fetch(link.href);
          if (response.ok) cssText = await response.text();
        }
        if (cssText && (cssText.includes("oklch") || cssText.includes("oklab"))) {
          const tempStyle = document.createElement("style");
          tempStyle.textContent = cleanColors(cssText);
          document.head.appendChild(tempStyle);
          tempStyles.push(tempStyle);
          link.disabled = true;
          disabledSheets.add(link);
        }
      } catch {
        link.disabled = true;
        disabledSheets.add(link);
      }
    }
    return { disabledSheets, tempStyles };
  };

  const restoreStylesheetsAfterCapture = (disabledSheets: Set<any>, tempStyles: HTMLStyleElement[]) => {
    disabledSheets.forEach((sheetOrNode) => {
      try { sheetOrNode.disabled = false; } catch { /* ignore */ }
    });
    for (const tempStyle of tempStyles) {
      if (tempStyle.parentNode) tempStyle.parentNode.removeChild(tempStyle);
    }
  };

  const handleDownloadMemoryStrip = async (currentMem: Memory) => {
    const element = document.getElementById(`photobooth-strip-modal-\${currentMem.id}`);
    if (!element) {
      handleDownloadImage(currentMem.imageUrl, currentMem.title, awardXp);
      return;
    }
    let disabledSheets = new Set<any>();
    let tempStyles: HTMLStyleElement[] = [];
    try {
      triggerHaptic("success");
      const prepared = await prepareStylesheetsForCapture();
      disabledSheets = prepared.disabledSheets;
      tempStyles = prepared.tempStyles;

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 3.0,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
        logging: false,
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const styleAttr = el.getAttribute("style");
            if (styleAttr && (styleAttr.includes("oklch") || styleAttr.includes("oklab"))) {
              el.setAttribute("style", cleanColors(styleAttr));
            }
          });
          const clonedElement = clonedDoc.getElementById(`photobooth-strip-modal-\${currentMem.id}`);
          if (clonedElement) {
            const filterStyles: Record<string, string> = {
              "filter-vintage": "sepia(0.35) contrast(0.95) saturate(1.1) brightness(1.02)",
              "filter-kodak": "contrast(1.1) saturate(1.3) brightness(1.05) sepia(0.05)",
              "filter-disposable": "contrast(1.05) saturate(1.05) brightness(0.98) hue-rotate(-5deg)",
              "filter-vhs": "contrast(1.2) brightness(1.1) saturate(0.85) sepia(0.1)",
              "filter-soft-blur": "blur(0.5px) saturate(0.95) contrast(0.95)",
              "filter-warm-tone": "sepia(0.15) saturate(1.2) hue-rotate(5deg)",
            };
            const imgs = clonedElement.querySelectorAll("img");
            imgs.forEach((img) => {
              let filterString = "";
              for (const [cls, style] of Object.entries(filterStyles)) {
                if (img.classList.contains(cls)) {
                  filterString = style;
                  break;
                }
              }
              if (filterString) {
                const canvasEl = document.createElement("canvas");
                canvasEl.width = (img as HTMLImageElement).naturalWidth || img.width || 400;
                canvasEl.height = (img as HTMLImageElement).naturalHeight || img.height || 300;
                const ctx = canvasEl.getContext("2d");
                if (ctx) {
                  ctx.filter = filterString;
                  try {
                    ctx.drawImage(img as HTMLImageElement, 0, 0, canvasEl.width, canvasEl.height);
                    (img as HTMLImageElement).src = canvasEl.toDataURL("image/png");
                    (img as HTMLImageElement).style.filter = "none";
                    img.className = img.className.replace(/filter-\S+/g, "");
                  } catch (e) {
                    console.warn(e);
                  }
                }
              }
            });
          }
        }
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `\${currentMem.title.replace(/\s+/g, "_") || "photobooth_strip"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      awardXp(25, "downloaded fully styled memory photobooth strip! 🎨📸");
    } catch (error) {
      console.error(error);
      handleDownloadImage(currentMem.imageUrl, currentMem.title, awardXp);
    } finally {
      restoreStylesheetsAfterCapture(disabledSheets, tempStyles);
    }
  };

  const handleMilestoneFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2 MB.");
      e.target.value = "";
      return;
    }
    setMImageFile(file);
    setMImageUploading(true);

    // Helper: read file as data-url
    const readAsDataUrl = (f: File): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string | undefined;
          if (result) resolve(result);
          else reject(new Error("Empty FileReader result"));
        };
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(f);
      });

    // Helper: compress a data-url via canvas
    const compressDataUrl = (src: string): Promise<string> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Image decode failed"));
        img.onload = () => {
          try {
            const maxDim = 800;
            const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("Canvas 2D unavailable")); return; }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            let url = canvas.toDataURL("image/jpeg", 0.7);
            if (url.length > 150 * 1024 * 1.37) url = canvas.toDataURL("image/jpeg", 0.45);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        };
        img.src = src;
      });

    try {
      const raw = await readAsDataUrl(file);
      let dataUrl = raw;
      try {
        dataUrl = await compressDataUrl(raw);
      } catch (compressErr) {
        // Compression failed – use raw data-url as fallback (still valid)
        console.warn("[milestone] Canvas compression failed, using raw:", compressErr);
      }
      setMImagePreview(dataUrl);
      setMImageUrl(dataUrl);
    } catch (err) {
      console.error("[milestone image upload]", err);
      alert("Could not read the image file. Please try a different one.");
    } finally {
      setMImageUploading(false);
      e.target.value = "";
    }
  };

  const clearMilestoneFile = () => {
    setMImageFile(null);
    setMImagePreview("");
    setMImageUrl("");
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle || !mDescription) return;

    addMemory({
      type: "milestone",
      title: mTitle,
      description: mDescription,
      imageUrl: mImageUrl || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop",
      date: new Date(mDate).toISOString(),
      creatorId: currentUser,
    });

    setMTitle("");
    setMDescription("");
    setMImageUrl("");
    setMImageFile(null);
    setMImagePreview("");
    setShowAddMilestone(false);
    awardXp(30, "logging a sweet life milestone on our timeline! 💖");
  };

  const milestonePresets = [
    { label: "Cozy Cafe ☕", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=600&auto=format&fit=crop" },
    { label: "Ocean Sunset 🌅", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop" },
    { label: "Cherry Blossom 🌸", url: "https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?q=80&w=600&auto=format&fit=crop" },
    { label: "Cozy Cabin 🌲", url: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?q=80&w=600&auto=format&fit=crop" },
    { label: "Sweet Desserts 🍰", url: "https://images.unsplash.com/photo-1511018556340-d16986a1c194?q=80&w=600&auto=format&fit=crop" }
  ];

  return (
    <motion.div
      key="timeline"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-[var(--border-color)]">
        <div className="text-left">
          <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Our Shared Milestones</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            A chronological walk through our beautiful days and adventures together.
          </p>
        </div>
        <button
          onClick={() => setShowAddMilestone(!showAddMilestone)}
          className="py-2.5 px-5 self-start rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1.5 shadow hover:shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {showAddMilestone ? "Cancel" : "Add Milestone"}
        </button>
      </div>

      {/* EXPANDABLE ADD MILESTONE DRAWER */}
      {showAddMilestone && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleCreateMilestone}
          className="bg-white/45 border border-dashed border-[var(--primary)]/60 p-8 rounded-[32px] space-y-4 max-w-2xl mx-auto shadow-sm backdrop-blur-md text-left"
        >
          <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--primary)] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 animate-pulse" /> Create Shared Milestone
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Milestone Title</label>
              <input
                type="text"
                value={mTitle}
                onChange={(e) => setMTitle(e.target.value)}
                required
                placeholder="e.g. Watched the first winter snow ❄️"
                className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)] text-gray-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={mDate}
                onChange={(e) => setMDate(e.target.value)}
                required
                className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)] text-gray-800 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Cover Image (Optional)</label>

            {/* Upload from device */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => milestoneFileRef.current?.click()}
                disabled={mImageUploading}
                className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 border border-[var(--primary)]/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3 h-3" />
                {mImageUploading ? "Processing…" : "Upload Photo"}
              </button>
              <span className="text-[9px] text-[var(--text-muted)]">max 2 MB · auto-compressed</span>
              <input
                ref={milestoneFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMilestoneFileChange}
              />
            </div>

            {/* Preview of uploaded file */}
            {mImagePreview && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[var(--primary)]/20 shadow-sm">
                <img src={mImagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearMilestoneFile}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
                  title="Remove uploaded photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* URL fallback — only shown when no file uploaded */}
            {!mImagePreview && (
              <>
                <input
                  type="text"
                  value={mImageUrl}
                  onChange={(e) => setMImageUrl(e.target.value)}
                  placeholder="…or paste an image / Unsplash URL"
                  className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)] text-gray-800"
                />
                <div className="flex flex-wrap gap-1.5">
                  {milestonePresets.map((pr) => (
                    <button
                      type="button"
                      key={pr.label}
                      onClick={() => setMImageUrl(pr.url)}
                      className={`text-[9px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${mImageUrl === pr.url
                        ? "bg-[var(--primary)] text-white border-transparent font-bold"
                        : "bg-white/60 text-gray-600 hover:bg-white border-gray-200"
                        }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Story / Memory Details</label>
            <textarea
              value={mDescription}
              onChange={(e) => setMDescription(e.target.value)}
              required
              rows={3}
              placeholder="Describe how magical the afternoon was, who suggested it, and what made it unforgettable..."
              className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-[var(--primary)] text-gray-800 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Log Milestone to Our Sacred Timeline
          </button>
        </motion.form>
      )}

      {visibleMemories.length === 0 ? (
        <div className="text-center p-12 bg-white/40 border border-white rounded-2xl group">
          <Smile className="w-10 h-10 text-rose-300 mx-auto mb-2 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6" />
          <p className="text-sm font-semibold text-[var(--text-main)]">No milestones logged yet.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Snap a photobooth strip or post a journal to populate our timeline!
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 pr-2 py-4 max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200 scrollbar-track-transparent">
          <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-rose-200 via-rose-300 to-rose-200 rounded-full" />

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            initial="hidden"
            animate="show"
            className="space-y-6 sm:space-y-8"
          >
            {visibleMemories.map((mem) => {
              const filterObj = availableFilters.find((f) => f.value === mem.filterClass);
              const formattedDate = new Date(mem.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <motion.div
                  key={mem.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { type: "spring", stiffness: 110, damping: 15 }
                    }
                  }}
                  className="relative group cursor-pointer pl-4 sm:pl-6 text-left"
                  onClick={() => {
                    setSelectedMemoryForModal(mem);
                    setModalCommentText("");
                  }}
                >
                  {/* Perfect Dot Aligned exactly on the timeline line */}
                  <div className="absolute left-[-15px] sm:left-[-20px] top-4 z-10 flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-white border-2 border-rose-400 shadow-xs group-hover:scale-125 transition-transform duration-300">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-rose-400 group-hover:bg-rose-500 transition-colors" />
                  </div>

                  {/* Clean Responsive Card */}
                  <div className="bg-white/45 hover:bg-white/75 border border-neutral-200/20 p-4 sm:p-5 rounded-2xl md:rounded-[24px] shadow-[0_4px_25px_rgba(0,0,0,0.01)] backdrop-blur-md transition-all duration-300 hover:shadow-md hover:border-rose-200/50 flex flex-col sm:flex-row gap-4 sm:gap-5">
                    {mem.imageUrl && (
                      <div className="w-full sm:w-24 md:w-32 aspect-[16/9] sm:aspect-square rounded-xl sm:rounded-2xl overflow-hidden relative shadow-xs bg-black/5 flex-shrink-0">
                        <img
                          src={mem.imageUrl}
                          alt={mem.title}
                          className={`w-full h-full object-cover transition-transform group-hover:scale-105 duration-500 \${
                            filterObj ? filterObj.class : ""
                          }`}
                          referrerPolicy="no-referrer"
                        />
                        {mem.type === "photobooth" && (
                          <div className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center">
                            <span className="text-[7.5px] text-white font-mono uppercase tracking-widest">
                              Photobooth
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        {/* Meta header tag including beautifully formatted Date Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-mono mb-1.5">
                          <span className="bg-rose-50/90 border border-rose-100/40 text-rose-600 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide shadow-2xs">
                            {formattedDate}
                          </span>
                          <span>•</span>
                          <span className="truncate">By {mem.creatorId === "user_a" ? userA.name.split(" ")[0] : userB.name.split(" ")[0]}</span>
                          {mem.type === "photobooth" && (
                            <>
                              <span>•</span>
                              <span className="text-rose-500 font-semibold uppercase tracking-wider text-[8px] sm:text-[8.5px]">Photobooth</span>
                            </>
                          )}
                          {mem.type === "milestone" && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-500 font-semibold uppercase tracking-wider text-[8px] sm:text-[8.5px]">Milestone</span>
                            </>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] group-hover:text-rose-500 transition-colors font-serif break-words leading-tight">
                          {mem.title}
                        </h3>

                        <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1 line-clamp-3 break-words">
                          {mem.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-neutral-100/50">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">💖</span>
                          <span className="text-[10px] font-mono font-bold text-neutral-500">
                            {(Object.values(mem.reactions || {}) as number[]).reduce((a: number, b: number) => a + b, 0)}
                          </span>
                        </div>
                        {mem.comments.length > 0 && (
                          <div className="text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                            <span>💬</span>
                            <span>{mem.comments.length} comment{mem.comments.length > 1 ? "s" : ""}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-rose-500 font-bold ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          React & Comment <Sparkles className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
          {visibleMemories.length >= memoriesLimit && (
            <div className="flex justify-center pt-6">
              <button
                onClick={loadMoreMemories}
                className="py-2 px-5 rounded-full border border-rose-200 bg-white/60 hover:bg-white text-rose-600 text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Load More Memories 🗓️
              </button>
            </div>
          )}
        </div>
      )}

      {/* QUICK REACTION & COMMENT MODAL */}
      <AnimatePresence>
        {selectedMemoryForModal && (() => {
          const currentMem = memories.find((m) => m.id === selectedMemoryForModal.id) || selectedMemoryForModal;
          const filterObj = availableFilters.find((f) => f.value === currentMem.filterClass);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedMemoryForModal(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs z-0"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 w-full max-w-md z-10 flex flex-col max-h-[85vh] relative text-left"
              >
                {/* Trash/Delete — both users can delete in this private app */}
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete this memory forever?")) {
                      await deleteMemory(currentMem.id);
                      setSelectedMemoryForModal(null);
                      triggerHaptic("heavy");
                    }
                  }}
                  className="absolute top-4 left-4 p-1.5 bg-red-50 hover:bg-red-100 rounded-full text-red-500 transition-colors z-20 cursor-pointer"
                  title="Delete Memory"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setSelectedMemoryForModal(null)}
                  className="absolute top-4 right-4 p-1.5 bg-black/5 hover:bg-black/10 rounded-full text-gray-500 hover:text-gray-800 transition-colors z-20 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                {currentMem.imageUrl && (
                  currentMem.type === "photobooth" ? (
                    <div className="w-full bg-slate-900 p-6 flex flex-col items-center justify-center relative overflow-hidden flex-shrink-0 border-b border-gray-100 min-h-[340px]">
                      <div
                        className="absolute inset-0 bg-cover bg-center blur-md opacity-25 scale-110 pointer-events-none"
                        style={{ backgroundImage: `url(\${currentMem.imageUrl})` }}
                      />
                      <div
                        id={`photobooth-strip-modal-\${currentMem.id}`}
                        style={bgStylesMap[currentMem.bgStyle || "sakura"] || { backgroundColor: "#ffffff" }}
                        className="relative p-4 shadow-2xl rounded-sm w-48 flex flex-col items-center gap-3 transition-all duration-300 z-10 border border-white/5"
                      >
                        <div className="text-[7px] font-mono opacity-80 tracking-widest uppercase select-none font-bold">
                          ★ PHOTOBOOTH ★
                        </div>
                        <div className="w-full space-y-2 flex-1 flex flex-col">
                          {(() => {
                            const pList = currentMem.photosList || [currentMem.imageUrl];
                            const itemLayout = currentMem.layout || (pList.length === 1 ? "polaroid" : "4-cut");
                            return pList.map((ph, idx) => (
                              <div
                                key={idx}
                                className={`w-full overflow-hidden rounded relative border border-black/5 bg-gray-100 \${
                                  itemLayout === "polaroid" ? "h-40" : itemLayout === "2-cut" ? "h-28" : itemLayout === "6-cut" ? "h-12" : "h-20"
                                }`}
                              >
                                <img
                                  src={ph}
                                  alt={`Snap \${idx + 1}`}
                                  className={`w-full h-full object-cover select-none pointer-events-none \${
                                    currentMem.filterClass && currentMem.filterClass !== "none"
                                      ? FILTERS.find((f) => f.id === currentMem.filterClass)?.css || ""
                                      : ""
                                  }`}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ));
                          })()}
                        </div>
                        <div className="text-center w-full mt-1 flex flex-col gap-0.5 relative select-none">
                          <p className="font-serif italic text-[10px] font-bold tracking-tight">
                            {currentMem.title}
                          </p>
                          <p className="text-[6px] font-mono opacity-60">
                            {new Date(currentMem.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        {currentMem.stickersList && currentMem.stickersList.map((st: any) => (
                          <div
                            key={st.id}
                            style={{
                              position: "absolute",
                              left: `\${st.x}%`,
                              top: `\${st.y}%`,
                              transform: "translate(-50%, -50%)",
                              zIndex: 40,
                            }}
                            className="text-xl select-none pointer-events-none"
                          >
                            {st.sticker}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-44 relative bg-black/5 flex-shrink-0">
                      <img
                        src={currentMem.imageUrl}
                        alt={currentMem.title}
                        className={`w-full h-full object-cover \${filterObj ? filterObj.class : ""}`}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-5 right-12 text-white">
                        <div className="flex items-center gap-1 text-[9px] text-white/85 font-mono">
                          <Calendar className="w-3 h-3" />
                          {new Date(currentMem.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <h3 className="text-base font-serif font-bold tracking-tight mt-0.5 text-white drop-shadow-sm">
                          {currentMem.title}
                        </h3>
                      </div>
                    </div>
                  )
                )}

                {!currentMem.imageUrl && (
                  <div className="p-6 pb-2 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(currentMem.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <h3 className="text-lg font-serif font-bold tracking-tight text-[var(--text-main)] mt-1">
                      {currentMem.title}
                    </h3>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                  {/* Caption Editor Logic */}
                  {editingId === currentMem.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={3}
                        className="w-full text-xs p-2 border border-gray-200 rounded-xl outline-none resize-none bg-white text-gray-800"
                        placeholder="Edit caption..."
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            await updateMemory(currentMem.id, { description: editDesc });
                            setEditingId(null);
                            triggerHaptic("success");
                          }}
                          className="px-3 py-1 bg-[var(--primary)] text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-50/45 p-3.5 rounded-xl border border-rose-100/20 flex gap-2 items-start">
                      <p className="text-xs text-gray-600 leading-relaxed flex-1">
                        {currentMem.description || <span className="italic opacity-50">No caption added.</span>}
                      </p>
                      {currentMem.creatorId === currentUser && (
                        <button
                          onClick={() => {
                            setEditingId(currentMem.id);
                            setEditDesc(currentMem.description || "");
                            triggerHaptic("light");
                          }}
                          className="text-[10px] text-[var(--primary)] hover:underline font-bold flex-shrink-0 cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}

                  {currentMem.imageUrl && (
                    <div className="flex gap-2.5 pt-1">
                      <button
                        onClick={() => {
                          triggerHaptic("success");
                          if (currentMem.type === "photobooth") {
                            handleDownloadMemoryStrip(currentMem);
                          } else {
                            handleDownloadImage(currentMem.imageUrl, currentMem.title, awardXp);
                          }
                        }}
                        className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Photo</span>
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic("medium");
                          handlePrintImage(currentMem.imageUrl, currentMem.title, awardXp);
                        }}
                        className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-gray-200 transition-all active:scale-95 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4" />
                        </svg>
                        <span>Print Layout</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <h4 className="text-[10px] uppercase tracking-wider text-rose-500 font-bold">
                      Tap to React ❤️
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {REACTION_EMOJIS.map((emoji) => {
                        const hasReacted = !!userReactions?.[`\${currentUser}_\${currentMem.id}`]?.[emoji];
                        return (
                          <button
                            key={emoji}
                            onClick={() => handleReactionClick(currentMem.id, emoji)}
                            className={`text-xs px-2.5 py-1 rounded-full transition-all flex items-center gap-1 font-semibold active:scale-95 border cursor-pointer \${
                              hasReacted
                                ? "bg-rose-100 text-rose-600 border-rose-200 shadow-sm"
                                : "bg-gray-50 hover:bg-rose-50 hover:scale-105 text-gray-800 border-gray-100"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className={`text-[9px] font-mono \${hasReacted ? "text-rose-500 font-bold" : "text-gray-400"}`}>
                              {currentMem.reactions[emoji] || 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                      Discussions (\${currentMem.comments.length})
                    </h4>

                    {currentMem.comments.length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-100 text-[10px] text-gray-400 font-medium">
                        No whispers yet. Write a beautiful comment below!
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5">
                        {currentMem.comments.map((comm) => (
                          <div
                            key={comm.id}
                            className="bg-gray-50/70 rounded-xl p-2.5 text-[10px] space-y-0.5 border border-gray-100/50"
                          >
                            <div className="flex justify-between items-center text-[8px] text-gray-400 font-mono">
                              <span className="font-bold text-gray-600">
                                {comm.authorId === "user_a" ? `${userA.name.split(" ")[0]} 🌸` : `${userB.name.split(" ")[0]} ☕`}
                              </span>
                              <div className="flex items-center gap-1">
                                <span>{new Date(comm.date).toLocaleDateString()}</span>
                                {comm.authorId === currentUser && (
                                  <button
                                    onClick={async () => {
                                      await deleteCommentFromMemory(currentMem.id, comm.id);
                                      triggerHaptic("light");
                                    }}
                                    className="text-gray-400 hover:text-red-500 cursor-pointer"
                                    title="Delete comment"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-600 leading-normal">{comm.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-100 flex-shrink-0 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a whisper..."
                    value={modalCommentText}
                    onChange={(e) => setModalCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && modalCommentText.trim()) {
                        addCommentToMemory(currentMem.id, modalCommentText);
                        setModalCommentText("");
                      }
                    }}
                    className="flex-1 bg-white focus:ring-1 focus:ring-rose-300 border border-gray-200 text-xs rounded-xl px-3 py-1.5 outline-none transition-all text-gray-800"
                  />
                  <button
                    onClick={() => {
                      if (modalCommentText.trim()) {
                        addCommentToMemory(currentMem.id, modalCommentText);
                        setModalCommentText("");
                      }
                    }}
                    className="px-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  >
                    Send
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// PHOTOBOOTH SECTION COMPONENT (FIRESTORE SYNCED)
// ============================================================================

const ROUND_GAP_MS = 1600;
const COUNTDOWN_MS = 3000;

function genRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function PhotoboothSection() {
  const {
    currentUser,
    userA,
    userB,
    memories,
    addMemory,
    deleteMemory,
    updateMemory,
    awardXp,
    cloudinaryCloudName,
    cloudinaryUploadPreset,
  } = useCouple();

  const cam = useCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureAreaRef = useRef<HTMLDivElement | null>(null);

  // Layout format states
  const [layout, setLayout] = useState<"2-cut" | "4-cut" | "6-cut" | "polaroid">("4-cut");
  const [selectedBg, setSelectedBg] = useState("sakura");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [selectedStamp, setSelectedStamp] = useState("Han & Min 🌸");
  const [copied, setCopied] = useState(false);

  // Room synchronization
  const [roomCode, setRoomCode] = useState<string>("");
  const [room, setRoom] = useState<PhotoboothRoom | null>(null);
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [countdownVal, setCountdownVal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const capturedRoundRef = useRef(0);
  const transitionLockRef = useRef(0);

  const isHost = room?.hostId === currentUser;
  const partnerName = currentUser === "user_a" ? userB.name : userA.name;
  const photoboothMemories = memories.filter((m) => m.type === "photobooth");

  // Camera integration helper
  const attachVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && cam.stream) {
      el.srcObject = cam.stream;
      el.play().catch((e) => console.error("[attachVideoRef] play error:", e));
    }
  }, [cam.stream]);

  useEffect(() => {
    if (videoRef.current && cam.stream) {
      videoRef.current.srcObject = cam.stream;
      videoRef.current.play().catch((e) => console.error("[videoEffect] play error:", e));
    }
  }, [cam.stream]);

  useEffect(() => {
    return () => {
      cam.stopCamera();
    };
  }, []);

  // Room Listener
  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(doc(db, "photobooth_rooms", roomCode), (d) => {
      if (d.exists()) {
        setRoom(d.data() as PhotoboothRoom);
      } else {
        setRoom(null);
      }
    });
    return () => unsub();
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode || room?.state === "waiting" || (room?.state === "countdown" && room.round === 1)) {
      capturedRoundRef.current = 0;
      transitionLockRef.current = 0;
    }
  }, [roomCode, room?.state, room?.round]);

  const totalRounds = LAYOUTS[layout]?.totalRounds || 4;

  const startWebcam = async () => {
    try {
      await cam.startCamera();
      triggerHaptic("success");
      awardXp(15, "authorized camera access for our photobooth! 📹🌸");
    } catch (err) {
      triggerHaptic("heavy");
      alert("Please allow camera permissions or click Capture to use simulated portrait snaps!");
    }
  };

  const stopWebcam = () => {
    cam.stopCamera();
    triggerHaptic("light");
  };

  const createRoom = useCallback(async () => {
    try {
      if (!cam.isActive) {
        await cam.startCamera();
      }
      const code = genRoomCode();
      const newRoom: PhotoboothRoom = {
        code,
        hostId: currentUser,
        guestId: null,
        layout,
        bg: selectedBg,
        filter: selectedFilter,
        stripPreset: "classic-white",
        caption: selectedStamp,
        state: "waiting",
        round: 0,
        totalRounds,
        countdownStartAt: null,
        photosA: [],
        photosB: [],
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "photobooth_rooms", code), newRoom);
      setRoomCode(code);
      setSavedUrl(null);
      triggerHaptic("success");
    } catch {
      alert("Please enable camera before starting a photobooth room.");
    }
  }, [cam, currentUser, layout, selectedBg, selectedFilter, selectedStamp, totalRounds]);

  const joinRoom = useCallback(async () => {
    const code = joinInput.trim().toUpperCase();
    if (!code) return;
    setJoinError("");
    try {
      const snap = await getDoc(doc(db, "photobooth_rooms", code));
      if (!snap.exists()) {
        setJoinError("Room not found. Check the code.");
        return;
      }
      const data = snap.data() as PhotoboothRoom;
      if (data.hostId !== currentUser && !data.guestId) {
        await updateDoc(doc(db, "photobooth_rooms", code), { guestId: currentUser });
      } else if (data.hostId !== currentUser && data.guestId !== currentUser) {
        setJoinError("This room is already full.");
        return;
      }
      if (!cam.isActive) {
        await cam.startCamera();
      }
      setRoomCode(code);
      setSavedUrl(null);
      triggerHaptic("success");
      awardXp(15, "joined live collaborative photobooth session!");
    } catch (e) {
      console.error("[joinRoom]", e);
      setJoinError("Couldn't join that room. Try again.");
    }
  }, [joinInput, currentUser, cam, awardXp]);

  const leaveRoom = useCallback(async () => {
    cam.stopCamera();
    if (room && isHost) {
      try { await deleteDoc(doc(db, "photobooth_rooms", roomCode)); } catch { /* ignore */ }
    }
    setRoomCode("");
    setRoom(null);
    setCountdownVal(null);
    setSavedUrl(null);
    capturedRoundRef.current = 0;
  }, [cam, room, isHost, roomCode]);

  const copyCode = useCallback(() => {
    navigator.clipboard?.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      triggerHaptic("light");
    });
  }, [roomCode]);

  const startSession = useCallback(async () => {
    if (!room || !isHost || !room.guestId) return;
    capturedRoundRef.current = 0;
    await updateDoc(doc(db, "photobooth_rooms", roomCode), {
      state: "countdown",
      round: 1,
      countdownStartAt: Date.now() + COUNTDOWN_MS,
      photosA: [],
      photosB: [],
    });
    triggerHaptic("success");
  }, [room, isHost, roomCode]);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || video.readyState < 2) {
      console.warn("Video not ready, using simulated portrait fallback");
      const canvas = document.createElement("canvas");
      canvas.width = 360;
      canvas.height = 360;
      const ctx = canvas.getContext("2d")!;
      // Soft rose gradient matching layout
      const grad = ctx.createLinearGradient(0, 0, 360, 360);
      grad.addColorStop(0, "#fda4af");
      grad.addColorStop(1, "#f43f5e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 360, 360);

      ctx.strokeStyle = "#ffffff80";
      ctx.lineWidth = 4;
      ctx.strokeRect(100, 120, 160, 120);
      ctx.strokeRect(150, 95, 60, 25);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📸 Pose Captured!", 180, 175);
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#ffffffdd";
      ctx.fillText(currentUser === "user_a" ? "User A" : "User B", 180, 210);
      return canvas.toDataURL("image/jpeg", 0.65);
    }
    const canvas = document.createElement("canvas");
    canvas.width = 360;
    canvas.height = 360;
    const ctx = canvas.getContext("2d")!;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.65);
  }, [currentUser]);

  // Synchronized countdown ticks
  useEffect(() => {
    if (!room || room.state !== "countdown" || !room.countdownStartAt) {
      setCountdownVal(null);
      return;
    }
    if (capturedRoundRef.current === room.round) return;

    const tick = () => {
      const remaining = room.countdownStartAt! - Date.now();
      if (remaining <= 0) {
        setCountdownVal(0);
        if (capturedRoundRef.current !== room.round) {
          capturedRoundRef.current = room.round;
          const shot = captureFrame();
          if (shot) {
            const field = currentUser === room.hostId ? "photosA" : "photosB";
            updateDoc(doc(db, "photobooth_rooms", roomCode), {
              [field]: arrayUnion(shot),
            }).catch((e) => console.error("[capture upload]", e));
            triggerHaptic("heavy");
          }
        }
        return true;
      }
      setCountdownVal(Math.ceil(remaining / 1000));
      return false;
    };

    if (tick()) return;
    const id = setInterval(() => {
      if (tick()) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [room, roomCode, currentUser, captureFrame]);

  // HostAdvances
  useEffect(() => {
    if (!room || !isHost || room.state !== "countdown") return;
    const gotA = room.photosA.length >= room.round;
    const gotB = room.photosB.length >= room.round;
    if (!gotA || !gotB) return;
    if (transitionLockRef.current === room.round) return;
    transitionLockRef.current = room.round;

    const timer = setTimeout(async () => {
      if (room.round >= room.totalRounds) {
        await updateDoc(doc(db, "photobooth_rooms", roomCode), { state: "editing", countdownStartAt: null });
      } else {
        await updateDoc(doc(db, "photobooth_rooms", roomCode), {
          round: room.round + 1,
          countdownStartAt: Date.now() + COUNTDOWN_MS,
        });
      }
    }, ROUND_GAP_MS);
    return () => clearTimeout(timer);
  }, [room, isHost, roomCode]);

  const composeAndSave = useCallback(async () => {
    if (!room) return;
    setSaving(true);
    setSavedUrl(null);
    try {
      const preset = STRIP_PRESETS.find((p) => p.id === room.stripPreset) || STRIP_PRESETS[0];
      const CELL = 300, MARGIN = 10;
      const HEADER = 44;
      const FOOTER = 64;
      const { cols: c, rows: r } = LAYOUTS[room.layout];
      const canvasW = c * CELL + (c + 1) * MARGIN;
      const canvasH = r * CELL + (r + 1) * MARGIN + HEADER + FOOTER;
      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = preset.frameColor;
      ctx.fillRect(0, 0, canvasW, canvasH);

      ctx.fillStyle = preset.accent;
      ctx.fillRect(0, 0, canvasW, 6);

      ctx.fillStyle = preset.textColor;
      ctx.font = "bold 17px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📸 Our Photobooth", canvasW / 2, HEADER - 14);

      const merged: string[] = [];
      if (room.layout === "polaroid") {
        if (room.photosA[0]) merged.push(room.photosA[0]);
      } else {
        for (let i = 0; i < room.photosA.length; i++) {
          merged.push(room.photosA[i]);
          if (room.photosB[i]) merged.push(room.photosB[i]);
        }
      }

      for (let i = 0; i < Math.min(merged.length, c * r); i++) {
        const col = i % c, row = Math.floor(i / c);
        const x = MARGIN + col * (CELL + MARGIN);
        const y = HEADER + MARGIN + row * (CELL + MARGIN);
        try {
          const img = await loadImage(merged[i]);
          ctx.save();
          ctx.filter = getCanvasFilter(room.filter || "natural");
          ctx.drawImage(img, x, y, CELL, CELL);
          ctx.restore();
        } catch (e) {
          console.warn("Failed to load photo:", e);
        }
      }

      if (room.layout === "polaroid" && room.photosB[0]) {
        try {
          const inset = await loadImage(room.photosB[0]);
          const insetSize = CELL * 0.36;
          const ix = MARGIN + CELL - insetSize - 6;
          const iy = HEADER + MARGIN + CELL - insetSize - 6;
          ctx.save();
          ctx.strokeStyle = preset.frameColor;
          ctx.lineWidth = 4;
          ctx.strokeRect(ix, iy, insetSize, insetSize);
          ctx.filter = getCanvasFilter(room.filter || "natural");
          ctx.drawImage(inset, ix, iy, insetSize, insetSize);
          ctx.restore();
        } catch { /* ignore */ }
      }

      const footerY = HEADER + r * (CELL + MARGIN) + MARGIN;
      ctx.strokeStyle = preset.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(MARGIN * 2, footerY + 14);
      ctx.lineTo(canvasW - MARGIN * 2, footerY + 14);
      ctx.stroke();

      ctx.fillStyle = preset.textColor;
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      ctx.fillText(room.caption || "Our Special Moment 💖", canvasW / 2, footerY + 34);

      ctx.font = "10px sans-serif";
      ctx.fillStyle = preset.textColor + "99";
      ctx.fillText(`\${LAYOUTS[room.layout]?.label || room.layout} • \${dateStr}`, canvasW / 2, footerY + 50);

      const blob = await compressToWebP(canvas, 260);
      let imageUrl: string;
      if (cloudinaryCloudName && cloudinaryUploadPreset) {
        imageUrl = await uploadToCloudinary(blob, `photobooth-\${Date.now()}.webp`, cloudinaryCloudName, cloudinaryUploadPreset);
      } else {
        imageUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target?.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(blob);
        });
      }

      setSavedUrl(imageUrl);
      addMemory({
        type: "photobooth",
        title: `\${LAYOUTS[room.layout].label} Live Photobooth`,
        description: `Captured live together in room \${room.code} 💌`,
        imageUrl,
        date: new Date().toISOString(),
        creatorId: currentUser,
        layout: room.layout as any,
        photosList: merged,
        bgStyle: room.bg,
        filterClass: room.filter,
        showOnTimeline: false,
      });
      await updateDoc(doc(db, "photobooth_rooms", roomCode), { state: "done" });
    } catch (e) {
      console.error(e);
      alert("Failed to save the strip. Check your Cloudinary configuration.");
    } finally {
      setSaving(false);
    }
  }, [room, roomCode, cloudinaryCloudName, cloudinaryUploadPreset, currentUser, addMemory]);

  const renderStripMockup = useCallback(() => {
    if (!room) return null;
    const { cols: c, rows: r } = LAYOUTS[room.layout] || LAYOUTS["4-cut"];
    const rowIndexes = Array.from({ length: r }, (_, i) => i);
    const preset = STRIP_PRESETS.find((p) => p.id === (room.stripPreset || "classic-white")) || STRIP_PRESETS[0];
    const filterCss = FILTERS.find((f) => f.id === (room.filter || "natural"))?.css || "";

    return (
      <div
        className="w-full max-w-xs mx-auto p-3 flex flex-col gap-3 transition-all duration-300 relative shadow-2xl rounded-sm border border-black/5"
        style={{ backgroundColor: preset.frameColor }}
        ref={captureAreaRef}
        id="photobooth-strip-capture"
      >
        <div className="w-full h-1" style={{ backgroundColor: preset.accent }} />

        <div className="flex flex-col gap-2.5">
          {rowIndexes.map((rowIdx) => {
            const photoA = room.photosA[rowIdx];
            const photoB = room.photosB[rowIdx];
            const isActiveRow = (room.state === "countdown" && rowIdx === room.round - 1) || (room.state === "waiting" && rowIdx === 0);

            return (
              <div key={rowIdx} className="grid grid-cols-2 gap-2 aspect-[8/3]">
                {/* User A Slot */}
                <div className="rounded-md overflow-hidden aspect-square bg-black/10 relative shadow-inner border border-black/5 flex items-center justify-center">
                  {photoA ? (
                    <img src={photoA} alt={`Round \${rowIdx + 1} A`} className={`w-full h-full object-cover \${filterCss}`} referrerPolicy="no-referrer" />
                  ) : isActiveRow && currentUser === "user_a" && cam.isActive ? (
                    <video ref={attachVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                  ) : isActiveRow && room.guestId ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/35 text-white text-center p-1">
                      <Sparkles className="w-4 h-4 animate-pulse mb-1 text-[var(--primary)]" />
                      <span className="text-[8px] font-semibold text-gray-200">Posing...</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera className="w-4 h-4 opacity-20" />
                    </div>
                  )}
                </div>

                {/* User B Slot */}
                <div className="rounded-md overflow-hidden aspect-square bg-black/10 relative shadow-inner border border-black/5 flex items-center justify-center">
                  {photoB ? (
                    <img src={photoB} alt={`Round \${rowIdx + 1} B`} className={`w-full h-full object-cover \${filterCss}`} referrerPolicy="no-referrer" />
                  ) : isActiveRow && currentUser === "user_b" && cam.isActive ? (
                    <video ref={attachVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                  ) : isActiveRow && room.guestId ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-black/35 text-white text-center p-1">
                      <Sparkles className="w-4 h-4 animate-pulse mb-1 text-[var(--primary)]" />
                      <span className="text-[8px] font-semibold text-gray-200">Posing...</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera className="w-4 h-4 opacity-20" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2.5 pb-1 border-t border-dashed" style={{ borderColor: preset.accent + "50" }}>
          <p className="text-xs font-black tracking-wider" style={{ color: preset.textColor }}>
            {room.caption || "Our Special Moment 💖"}
          </p>
          <p className="text-[7px] mt-0.5" style={{ color: preset.textColor + "99" }}>
            {LAYOUTS[room.layout]?.label || room.layout} • {new Date(room.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
    );
  }, [room, currentUser, cam.isActive, attachVideoRef]);

  const downloadPrintStrip = async () => {
    const element = captureAreaRef.current;
    if (!element || !room) return;

    try {
      triggerHaptic("success");
      // ponytail: Yield thread before html2canvas rendering
      await new Promise((res) => setTimeout(res, 50));
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 3.0,
        width: element.scrollWidth,
        height: element.scrollHeight,
        logging: false,
        onclone: (clonedDoc) => {
          const allElements = clonedDoc.querySelectorAll("*");
          allElements.forEach((el) => {
            const styleAttr = el.getAttribute("style");
            if (styleAttr && (styleAttr.includes("oklch") || styleAttr.includes("oklab"))) {
              el.setAttribute("style", cleanColors(styleAttr));
            }
          });
        }
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `photobooth_strip_\${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      awardXp(20, "downloaded beautiful photobooth strip!");
    } catch (e) {
      console.error(e);
      alert("Failed to render beautiful canvas strip. Downloaded fallback image.");
      if (room.photosA[0]) {
        const link = document.createElement("a");
        link.href = room.photosA[0];
        link.download = `photobooth_fallback.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  return (
    <motion.div
      key="photobooth"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-[var(--border-color)]">
        <div className="text-left">
          <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Selfie Photobooth 📸</h2>
          <p className="text-xs text-[var(--text-muted)] font-sans mt-0.5">
            Snap synced couple photo booth prints live in real-time, customize templates, and save to timeline!
          </p>
        </div>
        <div className="flex gap-2">
          {cam.isActive ? (
            <button
              onClick={stopWebcam}
              className="py-2 px-4 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Close Camera
            </button>
          ) : (
            <button
              onClick={startWebcam}
              className="py-2.5 px-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Camera className="w-4 h-4" /> Start Real Camera
            </button>
          )}
        </div>
      </div>

      {/* Firestore Synced Room configuration panels */}
      {!room && (
        <div className="bg-white/45 p-5 rounded-3xl border border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
          <div className="text-left space-y-1">
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
              <Heart className="w-4 h-4 text-rose-500 animate-pulse" /> Live Couple Collaborative Studio
            </h4>
            <p className="text-[10px] text-gray-500">
              Create a custom private studio room so you can take synced photo booth poses with your partner live!
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            <button
              onClick={createRoom}
              className="py-2 px-4 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer"
            >
              Host Private Studio
            </button>
            <div className="flex items-center gap-1.5 bg-black/5 p-1 rounded-xl">
              <input
                type="text"
                placeholder="Join room code..."
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                className="bg-transparent text-xs px-2.5 outline-none font-mono text-gray-700 uppercase w-32"
              />
              <button
                onClick={joinRoom}
                className="py-1.5 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {joinError && <p className="text-xs text-red-500 text-left">{joinError}</p>}
      {cam.error && <p className="text-xs text-red-500 text-left">{cam.error}</p>}

      {/* ── Active Studio room ── */}
      {room && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* LEFT COLUMN: LIVE STUDIO CONTROLS */}
          <div className="lg:col-span-5 space-y-5">
            {/* Room header details */}
            <div className="bg-white/45 p-4 rounded-3xl border border-neutral-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-[var(--primary)]" />
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Room Code</p>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold font-mono text-[var(--text-main)] tracking-widest">{room.code}</span>
                    <button onClick={copyCode} className="text-gray-400 hover:text-[var(--primary)] cursor-pointer">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full \${room.guestId ? "bg-green-50 text-green-600 border border-green-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                  {room.guestId ? `${partnerName} Linked 💖` : "Waiting for partner..."}
                </span>
                <button onClick={leaveRoom} className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer">
                  Leave
                </button>
              </div>
            </div>

            {/* Layout Picker */}
            {room.state === "waiting" && isHost && (
              <div className="bg-white/45 p-5 rounded-[24px] border border-neutral-100 space-y-3 backdrop-blur-md">
                <h4 className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Layout Format
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(LAYOUTS).map((lay) => (
                    <button
                      key={lay}
                      onClick={() => {
                        setLayout(lay as any);
                        updateDoc(doc(db, "photobooth_rooms", roomCode), { layout: lay });
                        triggerHaptic("light");
                      }}
                      className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all cursor-pointer \${
                        layout === lay
                          ? "bg-rose-500 text-white border-transparent shadow-md"
                          : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      {LAYOUTS[lay].label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STAGES INFO / BUTTONS */}
            {room.state === "waiting" && (
              isHost ? (
                <button
                  onClick={startSession}
                  disabled={!room.guestId}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-95 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>{room.guestId ? "Start Synchronized Poses 📸" : "Waiting for partner..."}</span>
                </button>
              ) : (
                <div className="bg-white/45 border border-dashed border-rose-200 p-6 rounded-2xl text-center space-y-2">
                  <RefreshCw className="w-6 h-6 mx-auto text-rose-400 animate-spin" />
                  <p className="text-xs font-bold text-gray-800">Linked & Ready!</p>
                  <p className="text-[10px] text-gray-500">Wait for the Host to start the photoshoot countdown...</p>
                </div>
              )
            )}

            {room.state === "countdown" && (
              <div className="bg-white/45 p-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold border border-rose-100 text-gray-800 shadow-inner">
                <Timer className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Photoshoot active: Pose for Round {room.round} of {room.totalRounds}!</span>
              </div>
            )}

            {room.state === "editing" && (
              isHost ? (
                <div className="space-y-4 pt-1">
                  <div className="bg-white/45 p-5 rounded-3xl border border-neutral-100 text-left space-y-3 backdrop-blur-md">
                    <span className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5">
                      <Camera className="w-4 h-4" /> Choose Frame Preset
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {STRIP_PRESETS.map((p) => (
                        <button key={p.id} onClick={() => updateDoc(doc(db, "photobooth_rooms", roomCode), { stripPreset: p.id })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer \${room.stripPreset === p.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"}`}>
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: p.swatch }} />
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/45 p-5 rounded-3xl border border-neutral-100 text-left space-y-3 backdrop-blur-md">
                    <span className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5">
                      <Palette className="w-4 h-4" /> Apply Retro Filter
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      {FILTERS.map((f) => (
                        <button key={f.id} onClick={() => updateDoc(doc(db, "photobooth_rooms", roomCode), { filter: f.id })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer \${room.filter === f.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/45 p-5 rounded-3xl border border-neutral-100 text-left space-y-3 backdrop-blur-md">
                    <span className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5">
                      <Smile className="w-4 h-4" /> Custom Caption Signature
                    </span>
                    <input
                      value={room.caption || ""}
                      onChange={(e) => updateDoc(doc(db, "photobooth_rooms", roomCode), { caption: e.target.value })}
                      placeholder="Write caption here..."
                      maxLength={26}
                      className="w-full text-xs px-3.5 py-2.5 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] font-medium shadow-inner"
                    />
                  </div>

                  <button
                    onClick={composeAndSave}
                    disabled={saving}
                    className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-95 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? "Assembling Strip..." : "Save to Timeline & Close Room"}
                  </button>
                </div>
              ) : (
                <div className="bg-white/45 p-6 rounded-2xl text-center space-y-3 border border-rose-100">
                  <Sparkles className="w-6 h-6 mx-auto text-rose-500 animate-pulse" />
                  <p className="text-xs font-bold text-gray-800">{partnerName} is styling your photobooth strip!</p>
                  <p className="text-[10px] text-gray-500">The preview on the right will update in real-time as they adjust filters, frames, and captions.</p>
                </div>
              )
            )}

            {room.state === "done" && (
              <div className="space-y-3">
                {savedUrl && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center text-xs text-green-700 font-semibold shadow-xs">
                    🎉 Successfully saved to the Memory Timeline!
                  </div>
                )}
                <button onClick={leaveRoom} className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] border border-dashed border-gray-200 rounded-2xl hover:bg-white/40 transition-all cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" /> Close Room & Start New Session
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: PREVIEW STRIP PREVIEW */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative overflow-hidden rounded-[32px] p-4 bg-black/5 border border-gray-200 w-full flex justify-center">
              {renderStripMockup()}

              {/* Countdown overlay */}
              <AnimatePresence>
                {countdownVal !== null && countdownVal > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs rounded-[32px] z-30">
                    <motion.span
                      key={countdownVal}
                      initial={{ opacity: 0, scale: 0.3 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.5 }}
                      transition={{ type: "spring", damping: 11 }}
                      className="text-8xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-serif italic"
                    >
                      {countdownVal}
                    </motion.span>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest mt-3 bg-rose-500 px-3.5 py-1 rounded-full animate-pulse shadow-md">
                      Round {room.round}/{room.totalRounds} • Pose!
                    </span>
                  </div>
                )}
                {countdownVal === 0 && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-white rounded-[32px] z-40"
                  />
                )}
              </AnimatePresence>
            </div>

            {room.state === "editing" && (
              <button
                onClick={downloadPrintStrip}
                className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download Strip (PNG)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Strip History / Gallery */}
      {(!room || room.state === "done") && (
        <div className="border-t border-[var(--border-color)] pt-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 pl-1">
            <span>Photobooth Gallery 📸</span>
            <span className="text-[10px] font-normal text-gray-400 font-sans tracking-normal">({photoboothMemories.length} saved)</span>
          </h4>

          {photoboothMemories.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic py-2 pl-1">No strips saved yet. Finish a room session to build your gallery history.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photoboothMemories.map((mem) => (
                <div key={mem.id} className="group relative rounded-2xl overflow-hidden border border-white/60 bg-white/30 p-2 shadow hover:shadow-md transition-all text-left">
                  <div
                    onClick={() => setPreviewUrl(mem.imageUrl)}
                    className="aspect-[3/4] rounded-xl overflow-hidden bg-white border border-gray-100 relative cursor-zoom-in group-hover:opacity-95 transition-opacity"
                  >
                    <img src={mem.imageUrl} alt={mem.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <span className="text-[9px] text-[var(--text-muted)] font-mono truncate">{new Date(mem.date).toLocaleDateString()}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={async () => {
                          const nextVal = mem.showOnTimeline === false ? true : false;
                          await updateMemory(mem.id, { showOnTimeline: nextVal });
                          triggerHaptic("light");
                        }}
                        className={`p-1 rounded-lg border transition-colors cursor-pointer \${
                          mem.showOnTimeline !== false
                            ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                            : "bg-white/65 text-gray-400 hover:text-gray-700 border-gray-200 hover:bg-white"
                        }`}
                        title={mem.showOnTimeline !== false ? "Remove from Timeline" : "Add to Timeline"}
                      >
                        <Heart className={`w-3.5 h-3.5 \${mem.showOnTimeline !== false ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic("light");
                          handleDownloadImage(mem.imageUrl, mem.title, awardXp);
                        }}
                        className="p-1 bg-white/65 hover:bg-white rounded-lg text-gray-700 transition-colors border border-gray-200 cursor-pointer"
                        title="Download strip"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Delete this photobooth strip?")) {
                            await deleteMemory(mem.id);
                            triggerHaptic("heavy");
                          }
                        }}
                        className="p-1 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors border border-transparent cursor-pointer"
                        title="Delete strip"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Preview */}
      <AnimatePresence>
        {previewUrl && (
          <div
            onClick={() => setPreviewUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden p-3 shadow-2xl flex flex-col items-center cursor-default text-left"
            >
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center transition-all font-bold text-sm z-10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-full bg-[var(--color-muted)] p-4 pb-12 shadow-2xl border border-[var(--color-border)] rounded-sm mt-8 relative">
                <div className="absolute bottom-3 left-0 right-0 text-center font-serif italic text-xs text-rose-500/80 font-bold tracking-wider select-none">
                  Our Sweet Memories 📸
                </div>
                <div className="w-full overflow-hidden flex items-center justify-center border border-[var(--color-border)] bg-white">
                  <img src={previewUrl} alt="Photobooth strip preview" className="max-w-full max-h-[55vh] object-contain" />
                </div>
              </div>
              <button
                onClick={() => handleDownloadImage(previewUrl, "photobooth_strip", awardXp)}
                className="mt-6 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-xl transition-all hover:opacity-90 cursor-pointer w-full shadow-md"
              >
                <Download className="w-3.5 h-3.5" /> Download Strip
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// JOURNAL SECTION COMPONENT
// ============================================================================

function JournalSection() {
  const {
    currentUser,
    userA,
    userB,
    journals,
    addJournal,
    deleteJournal,
    updateJournal,
    awardXp,
    cloudinaryCloudName,
    cloudinaryUploadPreset,
    journalsLimit,
    loadMoreJournals,
  } = useCouple();

  // Pencarian dan Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedWeatherFilter, setSelectedWeatherFilter] = useState<string | null>(null);
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);

  // Self-contained journal popup
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

  const openJournalPopup = (jr: Journal) => {
    setSelectedJournal(jr);
    window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: false }));
  };

  const closeJournalPopup = () => {
    setSelectedJournal(null);
    window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: true }));
  };

  // Form states untuk membuat Diary BARU
  const [showAddJournal, setShowAddJournal] = useState(false);
  const [jTitle, setJTitle] = useState("");
  const [jDescription, setJDescription] = useState("");
  const [jDate, setJDate] = useState(new Date().toISOString().split("T")[0]);
  const [jLocation, setJLocation] = useState("");
  const [jWeather, setJWeather] = useState("sunny");
  const [jMood, setJMood] = useState("cozy");
  const [jTags, setJTags] = useState("");
  const [jImageUrl, setJImageUrl] = useState("");

  const [jImageFile, setJImageFile] = useState<File | null>(null);
  const [jImagePreview, setJImagePreview] = useState("");
  const [jImageUploading, setJImageUploading] = useState(false);
  const journalFileRef = useRef<HTMLInputElement>(null);

  // Form states untuk Edit
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWeather, setEditWeather] = useState("sunny");
  const [editMood, setEditMood] = useState("cozy");
  const [editTags, setEditTags] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editImageUploading, setEditImageUploading] = useState(false);
  const editJournalFileRef = useRef<HTMLInputElement>(null);

  // Preset Cover Gambar Aesthetic sesuai mood/cuaca
  const coverPresets = [
    { label: "Cozy Cafe ☕", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800&auto=format&fit=crop" },
    { label: "Picnic Sunny ☀️", url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop" },
    { label: "Rainy Window 🌧️", url: "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?q=80&w=800&auto=format&fit=crop" },
    { label: "Winter Snowy ❄️", url: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=800&auto=format&fit=crop" },
    { label: "Night Stroll 🌙", url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop" }
  ];

  // Helper compression
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target?.result as string; };
      reader.onerror = reject;
      img.onload = () => {
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context failed")); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression blob failed"));
        }, "image/jpeg", 0.7);
      };
    });
  };

  const handleJournalFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2 MB.");
      e.target.value = "";
      return;
    }

    if (isEdit) {
      setEditImageFile(file);
      setEditImageUploading(true);
    } else {
      setJImageFile(file);
      setJImageUploading(true);
    }

    try {
      const compressedBlob = await compressImage(file);
      let finalUrl = "";
      if (cloudinaryCloudName && cloudinaryUploadPreset) {
        finalUrl = await uploadToCloudinary(compressedBlob, `journal-${Date.now()}.jpg`, cloudinaryCloudName, cloudinaryUploadPreset);
      } else {
        finalUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = (ev) => res(ev.target?.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(compressedBlob);
        });
      }

      if (isEdit) {
        setEditImagePreview(finalUrl);
        setEditImageUrl(finalUrl);
      } else {
        setJImagePreview(finalUrl);
        setJImageUrl(finalUrl);
      }
    } catch (err) {
      console.error("[journal image upload]", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      if (isEdit) {
        setEditImageUploading(false);
      } else {
        setJImageUploading(false);
      }
      e.target.value = "";
    }
  };

  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jTitle || !jDescription) return;

    const fallbackImageMap: Record<string, string> = {
      sunny: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
      rainy: "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=800&auto=format&fit=crop",
      cloudy: "https://images.unsplash.com/photo-1483706600674-e0c87d3fe85b?q=80&w=800&auto=format&fit=crop",
      snowy: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?q=80&w=800&auto=format&fit=crop",
    };

    addJournal({
      title: jTitle,
      description: jDescription,
      date: jDate,
      location: jLocation || "Our Secret Hideout",
      weather: jWeather,
      mood: jMood,
      imageUrl: jImageUrl || fallbackImageMap[jWeather] || fallbackImageMap.sunny,
      tags: jTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
    });

    setJTitle("");
    setJDescription("");
    setJLocation("");
    setJTags("");
    setJImageUrl("");
    setJImageFile(null);
    setJImagePreview("");
    setShowAddJournal(false);
    awardXp(50, "wrote a beautiful new journal entry 🌸");
  };
  const startEditing = (jr: Journal) => {
    setEditingJournal(jr);
    setEditTitle(jr.title);
    setEditDescription(jr.description || "");
    setEditDate(jr.date);
    setEditLocation(jr.location || "");
    setEditWeather(jr.weather || "sunny");
    setEditMood(jr.mood || "cozy");
    setEditTags((jr.tags || []).join(", "));
    setEditImageUrl(jr.imageUrl || "");
  };

  const handleUpdateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJournal) return;

    updateJournal(editingJournal.id, {
      title: editTitle,
      description: editDescription,
      date: editDate,
      location: editLocation,
      weather: editWeather,
      mood: editMood,
      imageUrl: editImageUrl,
      tags: editTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
    });

    setEditingJournal(null);
    awardXp(15, "updated a journal story");
  };

  const allTags = React.useMemo(() => Array.from(
    new Set(journals.flatMap((j) => j.tags || []))
  ), [journals]);

  const filteredJournals = React.useMemo(() => journals.filter((jr) => {
    const matchesSearch =
      (jr.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (jr.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (jr.location || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag || (jr.tags || []).includes(selectedTag);
    const matchesWeather = !selectedWeatherFilter || jr.weather === selectedWeatherFilter;
    const matchesMood = !selectedMoodFilter || jr.mood === selectedMoodFilter;

    return matchesSearch && matchesTag && matchesWeather && matchesMood;
  }), [journals, searchQuery, selectedTag, selectedWeatherFilter, selectedMoodFilter]);

  const sortedJournals = React.useMemo(() => {
    return [...filteredJournals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredJournals]);

  return (
    <motion.div
      key="journal"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-[var(--border-color)]">
        <div>
          <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Our Private Notion Diary</h2>
          <p className="text-xs text-[var(--text-muted)] font-sans">
            Co-write beautiful chapters of our daily lives, emotions, and private conversations.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddJournal(!showAddJournal);
            setEditingJournal(null);
          }}
          className="py-2.5 px-5 self-start rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1.5 shadow hover:shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {showAddJournal ? "Cancel" : "New Entry"}
        </button>
      </div>

      {/* FILTER AND SEARCH BAR */}
      <div className="bg-white/45 p-4 rounded-2xl border border-neutral-100 flex flex-col md:flex-row gap-3 items-center justify-between backdrop-blur-md">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search diary memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/5 text-xs pl-9 pr-4 py-2.5 outline-none rounded-xl border border-transparent focus:bg-white focus:border-rose-200/50 transition-all text-gray-800"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <select
            value={selectedWeatherFilter || ""}
            onChange={(e) => setSelectedWeatherFilter(e.target.value || null)}
            className="bg-black/5 text-xs px-3 py-2 rounded-xl border border-transparent outline-none cursor-pointer focus:bg-white text-gray-700"
          >
            <option value="">All Weathers ⛅</option>
            <option value="sunny">☀️ Sunny</option>
            <option value="rainy">🌧️ Rainy</option>
            <option value="cloudy">☁️ Cloudy</option>
            <option value="snowy">❄️ Snowy</option>
          </select>

          <select
            value={selectedMoodFilter || ""}
            onChange={(e) => setSelectedMoodFilter(e.target.value || null)}
            className="bg-black/5 text-xs px-3 py-2 rounded-xl border border-transparent outline-none cursor-pointer focus:bg-white text-gray-700"
          >
            <option value="">All Moods ☕</option>
            <option value="cozy">☕ Cozy</option>
            <option value="excited">🎉 Excited</option>
            <option value="peaceful">🌿 Peaceful</option>
            <option value="sleepy">🌙 Sleepy</option>
          </select>

          {(selectedTag || selectedWeatherFilter || selectedMoodFilter || searchQuery) && (
            <button
              onClick={() => {
                setSelectedTag(null);
                setSelectedWeatherFilter(null);
                setSelectedMoodFilter(null);
                setSearchQuery("");
              }}
              className="text-[10px] px-3 py-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100/60 font-semibold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* QUICK TAG FILTER PILLS */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1">Filter Tags:</span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`text-[9.5px] px-3 py-1 rounded-full border transition-all cursor-pointer ${!selectedTag
              ? "bg-rose-500 text-white border-transparent font-bold shadow-xs"
              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`text-[9.5px] px-3 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${selectedTag === tag
                ? "bg-rose-500 text-white border-transparent font-bold shadow-xs"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
            >
              <Tag className="w-2.5 h-2.5" /> {tag}
            </button>
          ))}
        </div>
      )}

      {/* EXPANDABLE NEW JOURNAL PANEL */}
      {showAddJournal && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleCreateJournal}
          className="bg-white/45 border border-dashed border-emerald-500/50 p-8 rounded-[32px] space-y-4 max-w-2xl mx-auto shadow-sm backdrop-blur-md"
        >
          <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-600 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" /> Co-write a beautiful Chapter
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Title of Chapter</label>
              <input
                type="text"
                value={jTitle}
                onChange={(e) => setJTitle(e.target.value)}
                required
                placeholder="e.g. Picnic by the river 🧺🌸"
                className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Date of Chapter</label>
              <input
                type="date"
                value={jDate}
                onChange={(e) => setJDate(e.target.value)}
                required
                className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-emerald-500 focus:bg-white transition-all text-gray-800 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Location / Spot</label>
              <input
                type="text"
                value={jLocation}
                onChange={(e) => setJLocation(e.target.value)}
                placeholder="e.g. Starbucks Gangnam"
                className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Weather Vibe</label>
              <select
                value={jWeather}
                onChange={(e) => setJWeather(e.target.value)}
                className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-emerald-500 focus:bg-white transition-all text-gray-700 cursor-pointer"
              >
                <option value="sunny">☀️ Sunny</option>
                <option value="rainy">🌧️ Rainy</option>
                <option value="cloudy">☁️ Cloudy</option>
                <option value="snowy">❄️ Snowy</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mood Energy</label>
              <select
                value={jMood}
                onChange={(e) => setJMood(e.target.value)}
                className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-emerald-500 focus:bg-white transition-all text-gray-700 cursor-pointer"
              >
                <option value="cozy">☕ Cozy</option>
                <option value="excited">🎉 Excited</option>
                <option value="peaceful">🌿 Peaceful</option>
                <option value="sleepy">🌙 Sleepy</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">The Story / Shared Dialogue</label>
            <textarea
              value={jDescription}
              onChange={(e) => setJDescription(e.target.value)}
              required
              rows={4}
              placeholder="Start co-authoring what we did, said, and felt today..."
              className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-emerald-500 focus:bg-white transition-all text-gray-800 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Cover Photo</label>

            {/* Upload from device */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => journalFileRef.current?.click()}
                disabled={jImageUploading}
                className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 border border-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3 h-3" />
                {jImageUploading ? "Processing..." : "Upload Photo"}
              </button>
              <span className="text-[9px] text-[var(--text-muted)]">max 2 MB · auto-compressed</span>
              <input
                ref={journalFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleJournalFileChange(e, false)}
              />
            </div>

            {/* Preview of uploaded file */}
            {jImagePreview && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-emerald-600/20 shadow-xs">
                <img src={jImagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setJImageFile(null); setJImagePreview(""); setJImageUrl(""); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
                  title="Remove uploaded photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Preview for URL link */}
            {!jImagePreview && jImageUrl && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-emerald-600/20 shadow-xs">
                <img src={jImageUrl} alt="URL Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <button
                  type="button"
                  onClick={() => setJImageUrl("")}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
                  title="Remove URL photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* URL fallback — only shown when no file or URL preview */}
            {!jImagePreview && !jImageUrl && (
              <>
                <input
                  type="text"
                  value={jImageUrl}
                  onChange={(e) => setJImageUrl(e.target.value)}
                  placeholder="…or paste an image link"
                  className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {coverPresets.map((pr) => (
                    <button
                      type="button"
                      key={pr.label}
                      onClick={() => setJImageUrl(pr.url)}
                      className={`text-[9px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${jImageUrl === pr.url
                        ? "bg-emerald-600 text-white border-transparent font-bold"
                        : "bg-white/60 text-gray-600 hover:bg-white border-gray-200"
                        }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tags (Comma separated)</label>
            <input
              type="text"
              value={jTags}
              onChange={(e) => setJTags(e.target.value)}
              placeholder="e.g. coffee, autumn, cute"
              className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-transparent focus:border-emerald-500 focus:bg-white transition-all text-gray-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Log to Shared Notion Diary
          </button>
        </motion.form>
      )}

      {/* EDIT MODAL DIALOG */}
      <AnimatePresence>
        {editingJournal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingJournal(null)}
              className="absolute inset-0 cursor-pointer"
            />

            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleUpdateJournal}
              className="bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg z-10 space-y-4 max-h-[85vh] overflow-y-auto relative text-left"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-serif font-bold text-gray-800 flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-rose-500" /> Edit Diary Entry
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingJournal(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full bg-gray-50 text-xs px-3 py-2 outline-none rounded-lg border border-gray-200 focus:border-rose-500 text-gray-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full bg-gray-50 text-xs px-3 py-2 outline-none rounded-lg border border-gray-200 focus:border-rose-500 text-gray-800 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-gray-50 text-xs px-3 py-2 outline-none rounded-lg border border-gray-200 focus:border-rose-500 text-gray-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Weather</label>
                  <select
                    value={editWeather}
                    onChange={(e) => setEditWeather(e.target.value)}
                    className="w-full bg-gray-50 text-xs px-3 py-2 outline-none rounded-lg border border-gray-200 focus:border-rose-500 text-gray-700 cursor-pointer"
                  >
                    <option value="sunny">☀️ Sunny</option>
                    <option value="rainy">🌧️ Rainy</option>
                    <option value="cloudy">☁️ Cloudy</option>
                    <option value="snowy">❄️ Snowy</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mood</label>
                  <select
                    value={editMood}
                    onChange={(e) => setEditMood(e.target.value)}
                    className="w-full bg-gray-50 text-xs px-3 py-2 outline-none rounded-lg border border-gray-200 focus:border-rose-500 text-gray-700 cursor-pointer"
                  >
                    <option value="cozy">☕ Cozy</option>
                    <option value="excited">🎉 Excited</option>
                    <option value="peaceful">🌿 Peaceful</option>
                    <option value="sleepy">🌙 Sleepy</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Story Details</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full bg-gray-50 text-xs px-3 py-2 outline-none rounded-lg border border-gray-200 focus:border-rose-500 text-gray-800 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Cover Photo</label>

                {/* Upload from device */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editJournalFileRef.current?.click()}
                    disabled={editImageUploading}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3" />
                    {editImageUploading ? "Processing..." : "Upload Photo"}
                  </button>
                  <span className="text-[9px] text-[var(--text-muted)]">max 2 MB · auto-compressed</span>
                  <input
                    ref={editJournalFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleJournalFileChange(e, true)}
                  />
                </div>

                {/* Preview of uploaded file */}
                {editImageUrl && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-rose-500/20 shadow-xs">
                    <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setEditImageFile(null); setEditImagePreview(""); setEditImageUrl(""); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all cursor-pointer"
                      title="Remove uploaded photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tags</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full bg-gray-50 text-xs px-3 py-2 outline-none rounded-lg border border-gray-200 focus:border-rose-500 text-gray-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Save Changes
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* JOURNALS GRID LAYOUT */}
      {sortedJournals.length === 0 ? (
        <div className="text-center p-12 bg-white/40 border border-white rounded-[24px]">
          <CloudSun className="w-8 h-8 text-rose-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-[var(--text-main)]">No diary entries found.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Try adjusting your search query, mood filter, or click "New Entry" to co-write your first chapter!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedJournals.map((jr) => {
            const creator = jr.creatorId === "user_b" ? userB : userA;
            const isOwner = jr.creatorId === currentUser;

            return (
              <motion.div
                key={jr.id}
                layoutId={`jr-card-${jr.id}`}
                onClick={() => openJournalPopup(jr)}
                className="bg-white/45 hover:bg-white rounded-[24px] overflow-hidden border border-neutral-200/10 hover:border-rose-100 hover:shadow-lg backdrop-blur-md flex flex-col justify-between transition-all duration-300 group cursor-pointer"
              >
                {jr.imageUrl && (
                  <div className="h-44 overflow-hidden relative bg-black/5">
                    <img
                      src={jr.imageUrl}
                      alt={jr.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-bold text-gray-700 flex items-center gap-1 shadow-sm">
                      <MapPin className="w-2.5 h-2.5 text-rose-500" /> {jr.location}
                    </div>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                      <span className="flex items-center gap-1.5">
                        <img src={creator.avatar} alt="" className="w-5 h-5 rounded-full object-cover border border-gray-200" referrerPolicy="no-referrer" />
                        <span className="font-bold text-rose-500 uppercase">{creator.name.split(" ")[0]}</span>
                        <span>•</span>
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        {new Date(jr.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="flex gap-2">
                        <span className="bg-rose-50 px-2 py-0.5 rounded-full text-[9.5px] font-bold text-rose-600">
                          {jr.weather === "sunny" ? "☀️ Sunny" : jr.weather === "rainy" ? "🌧️ Rainy" : jr.weather === "snowy" ? "❄️ Snowy" : "☁️ Cloudy"}
                        </span>
                        <span className="bg-indigo-50 px-2 py-0.5 rounded-full text-[9.5px] font-bold text-indigo-600">
                          {jr.mood === "cozy" ? "☕ Cozy" : jr.mood === "excited" ? "🎉 Excited" : jr.mood === "sleepy" ? "🌙 Sleepy" : "🌿 Peaceful"}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-[var(--text-main)] group-hover:text-rose-500 transition-colors font-serif leading-tight">
                      {jr.title}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                      {jr.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100/50">
                    <div className="flex flex-wrap gap-1">
                      {(jr.tags || []).map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(tag);
                          }}
                          className="text-[8.5px] px-2 py-0.5 bg-neutral-100 hover:bg-rose-50 hover:text-rose-500 text-gray-500 rounded-full font-mono font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                        >
                          <Tag className="w-1.5 h-1.5" /> {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {isOwner && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(jr);
                            }}
                            className="p-1.5 bg-neutral-100 hover:bg-rose-100/60 text-gray-500 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="Edit Entry"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to archive this memory chapter?")) {
                                deleteJournal(jr.id);
                              }
                            }}
                            className="p-1.5 bg-neutral-100 hover:bg-rose-100/60 text-gray-500 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                            title="Archive Entry"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      {sortedJournals.length >= journalsLimit && (
        <div className="flex justify-center pt-6">
          <button
            onClick={loadMoreJournals}
            className="py-2 px-5 rounded-full border border-emerald-200 bg-white/60 hover:bg-white text-emerald-600 text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Load More Stories 📖
          </button>
        </div>
      )}

      {/* ── Self-contained Journal Detail Popup ── */}
      <AnimatePresence>
        {selectedJournal && (
          <motion.div
            key="journal-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={closeJournalPopup}
          >
            <motion.div
              layoutId={`jr-card-${selectedJournal.id}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[var(--card-bg)] rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            >
              {/* Close button */}
              <button
                onClick={closeJournalPopup}
                className="absolute top-4 right-4 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Cover image */}
              {selectedJournal.imageUrl && (
                <div className="h-56 sm:h-72 overflow-hidden shrink-0 relative">
                  <img
                    src={selectedJournal.imageUrl}
                    alt={selectedJournal.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {selectedJournal.location && (
                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white text-xs font-semibold drop-shadow">
                      <MapPin className="w-3.5 h-3.5 text-rose-300" />
                      {selectedJournal.location}
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                  <span className="bg-rose-100 text-rose-600 px-2.5 py-1 rounded-full">
                    {selectedJournal.weather === "sunny" ? "☀️ Sunny" : selectedJournal.weather === "rainy" ? "🌧️ Rainy" : selectedJournal.weather === "snowy" ? "❄️ Snowy" : "☁️ Cloudy"}
                  </span>
                  <span className="bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full">
                    {selectedJournal.mood === "cozy" ? "☕ Cozy" : selectedJournal.mood === "excited" ? "🎉 Excited" : selectedJournal.mood === "sleepy" ? "🌙 Sleepy" : "🌿 Peaceful"}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[var(--text-muted)] font-mono font-normal">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedJournal.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--text-main)] leading-snug">
                  {selectedJournal.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                  {selectedJournal.description}
                </p>

                {/* Tags */}
                {(selectedJournal.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--border-color)]">
                    {(selectedJournal.tags || []).map((tag) => (
                      <span key={tag} className="text-[9px] px-2.5 py-1 bg-neutral-100 text-gray-500 rounded-full font-mono font-bold flex items-center gap-1">
                        <Tag className="w-2 h-2" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}