/**
 * StorySection.tsx — Unified chronological scrapbook diary
 * Extracted from MemoriesView.tsx for modularity (< 300 lines ideal).
 * Preserves 100% of original functionality.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import {
  Sparkles, Download, Calendar, Plus, X, Heart, BookOpen,
  MapPin, Trash2, Edit2, Search, Upload, Camera, Palette,
} from "lucide-react";
import { Button } from "../ui/button";
import { uploadToCloudinary } from "../../firebaseClient";
import { toast } from "sonner";
import type { Memory, Journal } from "../../types";
import { cn } from "../../lib/utils";
import { Skeleton, SkeletonImage } from "../extras/Skeleton";
import LazyImage from "../common/LazyImage";
import { WashiTapeDivider, EmptyJournalPage, StickerButton } from "../scrapbook";
import { triggerHaptic } from "../../lib/haptics";
import ScrapbookCanvas from "./ScrapbookCanvas";
import OpenBookSpread from "../scrapbook/OpenBookSpread";

// ─── Shared Constants ──────────────────────────────────────────────────

const REACTION_EMOJIS = ["💖", "✨", "☕", "🌴", "🍕", "🔥", "😭", "🌸"];

const availableFilters = [
  { value: "none", label: "Natural", class: "" },
  { value: "vintage", label: "Vintage Sepia", class: "filter-vintage" },
  { value: "kodak", label: "Kodak Film", class: "filter-kodak" },
  { value: "disposable", label: "Disposable Cam", class: "filter-disposable" },
  { value: "vhs", label: "VHS Glitch", class: "filter-vhs" },
  { value: "soft-blur", label: "Dreamy Blur", class: "filter-soft-blur" },
  { value: "warm-tone", label: "Warm Milk", class: "filter-warm-tone" },
  { value: "grainy-bw", label: "Grainy B&W", class: "filter-grainy-bw" },
  { value: "light-leak", label: "Sunset Leak", class: "filter-light-leak" },
];

const WEATHER_OPTIONS = ["sunny", "rainy", "cloudy", "snowy", "windy"];
const MOOD_OPTIONS = ["happy", "cozy", "excited", "peaceful", "sleepy", "loved"];
const WEATHER_ICONS: Record<string, string> = { sunny: "☀️", rainy: "🌧️", cloudy: "⛅", snowy: "❄️", windy: "💨" };
const MOOD_ICONS: Record<string, string> = { happy: "😊", cozy: "🧸", excited: "🌟", peaceful: "🍃", sleepy: "😴", loved: "💖" };

function cleanColors(cssText: string): string {
  let result = cssText;
  result = result.replace(/oklch\s*\([^)]+\)/gi, "rgba(244, 63, 94, 0.8)");
  result = result.replace(/oklab\s*\([^)]+\)/gi, "rgba(120, 120, 120, 0.5)");
  return result;
}

const handleDownloadImage = async (url: string, title: string) => {
  try {
    // Strip "f_auto" (automatic format delivery like WebP/AVIF) from the Cloudinary URL 
    // to ensure downloading the true JPG/PNG file as requested by the user,
    // while keeping Cloudinary's "q_auto" compression active.
    let downloadUrl = url;
    if (downloadUrl.includes("/upload/")) {
      downloadUrl = downloadUrl.replace(/f_auto,?/g, "");
    }
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${title.replace(/\s+/g, "_") || "keepsake"}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
};

const handlePrintImage = (url: string, title: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { toast.error("Please allow popups to print!"); return; }
  printWindow.document.write(`
    <html><head><title>Print - ${title}</title>
    <style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#fff}
    .container{text-align:center;padding:20px;max-width:400px}
    img{max-width:100%;height:auto;border-radius:4px}
    h1{font-size:18px;margin-top:15px;color:#333}
    p{font-size:12px;color:#999}</style></head>
    <body><div class="container"><img loading="lazy" src="${url}" />
    <h1>${title}</h1></div>
    <script>window.onload=function(){window.print();setTimeout(()=>window.close(),500)}</script>
    </body></html>
  `);
  printWindow.document.close();
};

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
  if (!title) return "";
  if (title.includes("${LAYOUTS[")) {
    return "Our Live Photobooth 📸";
  }
  return title;
};

const HoverExpandFeed = ({
  items,
  onSelectItem,
}: {
  items: any[];
  onSelectItem: (item: any) => void;
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const chunks = useMemo(() => {
    const res = [];
    const size = isMobile ? 3 : 6;
    for (let i = 0; i < items.length; i += size) {
      res.push(items.slice(i, i + size));
    }
    return res;
  }, [items, isMobile]);

  return (
    <div className="relative w-full max-w-5xl mx-auto px-1 md:px-4 py-6 text-left">
      {/* Central or Left vertical timeline main line */}
      <div className="absolute left-[16px] md:left-[24px] top-4 bottom-4 w-0.5 bg-[var(--wood-oak)]/20" />

      <div className="space-y-6 md:space-y-8">
        {chunks.map((chunk, chunkIdx) => {
          const dates = chunk.map(c => new Date(c.date));
          const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
          const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
          const formattedRange = minDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }) +
            (minDate.getMonth() !== maxDate.getMonth() || minDate.getFullYear() !== maxDate.getFullYear()
              ? " - " + maxDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : "");

          return (
            <div key={chunkIdx} className="relative pl-8 md:pl-12">
              {/* Row connector node */}
              <div className="absolute left-[12px] md:left-[20px] top-2.5 w-2.5 h-2.5 rounded-full bg-[var(--primary)] ring-4 ring-[var(--fabric-cream)] shadow-xs" />
              
              {/* Header */}
              <div className="mb-2 flex items-center justify-between pr-2">
                <span className="text-[10px] font-bold font-mono tracking-wider text-[var(--text-muted)] uppercase">
                  ✨ {formattedRange}
                </span>
                <span className="text-[9px] font-mono text-[var(--text-muted)] opacity-60">
                  {chunk.length} keepsakes
                </span>
              </div>

              {/* HoverExpand Row */}
              <HoverExpandRow chunk={chunk} onSelectItem={onSelectItem} isMobile={isMobile} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HoverExpandRow = ({
  chunk,
  onSelectItem,
  isMobile,
}: {
  chunk: any[];
  onSelectItem: (item: any) => void;
  isMobile: boolean;
}) => {
  const [activeImage, setActiveImage] = useState<number | null>(0);

  const inactiveWidth = isMobile ? "3rem" : "5.5rem";
  const activeWidth = isMobile ? "12rem" : "20rem";
  const rowHeight = isMobile ? "12rem" : "17rem";

  return (
    <div className="flex w-full items-center gap-1.5 md:gap-2">
      {chunk.map((item, index) => {
        const isActive = activeImage === index;
        const imgSrc = getItemImage(item);
        const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        return (
          <motion.div
            key={item.id}
            className="relative cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl border border-[var(--wood-oak)]/10 shadow-xs"
            initial={{ width: inactiveWidth, height: rowHeight }}
            animate={{
              width: isActive ? activeWidth : inactiveWidth,
              height: rowHeight,
            }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            onClick={() => {
              if (isActive) {
                onSelectItem(item);
              } else {
                setActiveImage(index);
                triggerHaptic("light");
              }
            }}
            onHoverStart={() => setActiveImage(index)}
          >
            {/* Background Image — Lazy loaded via IntersectionObserver */}
            <LazyImage
              src={imgSrc}
              className="absolute inset-0 w-full h-full object-cover select-none"
              alt={item.raw.title}
              referrerPolicy="no-referrer"
              rootMargin={150}
              showSkeleton
            />

            {/* Gradient Overlay for active item */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent flex flex-col justify-between p-2.5 md:p-3 text-white z-10"
                >
                  {/* Top row: badge */}
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-white/20",
                      item.type === "journal"
                        ? "bg-amber-500/30 text-amber-100"
                        : item.type === "drawing"
                        ? "bg-emerald-500/30 text-emerald-100"
                        : "bg-indigo-500/30 text-indigo-100"
                    )}>
                      {item.type}
                    </span>
                    <span className="text-[8px] opacity-75 font-mono">
                      {formattedDate}
                    </span>
                  </div>

                  {/* Bottom row: title & details */}
                  <div className="text-left space-y-0.5 mt-auto">
                    <h4 className="text-[10px] md:text-[11px] font-serif font-bold text-amber-50 truncate">
                      {cleanTitle(item.raw.title, item.type)}
                    </h4>
                    <p className="text-[8px] md:text-[9px] text-white/70 line-clamp-2 leading-tight">
                      {item.raw.description || "No description."}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inactive state vertical text date display */}
            <AnimatePresence>
              {!isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center p-1 text-white/80"
                >
                  <div className="rotate-90 origin-center whitespace-nowrap text-[8px] md:text-[9px] font-bold font-mono tracking-wider">
                    {formattedDate}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── StorySection ──────────────────────────────────────────────────────

export default function StorySection() {
  const {
    currentUser, memories, journals, userReactions,
    addMemory, deleteMemory, updateMemory,
    addReactionToMemory, addCommentToMemory, deleteCommentFromMemory,
    addJournal, updateJournal, deleteJournal,
    memoriesLimit, loadMoreMemories, journalsLimit, loadMoreJournals,
    userA, userB, cloudinaryCloudName, cloudinaryUploadPreset,
  } = useCouple();

  // ─── Initial loading state ──────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (memories.length > 0 || journals.length > 0) {
      setInitialLoading(false);
    }
  }, [memories.length, journals.length]);

  const visibleMemories = useMemo(() =>
    memories.filter((m) => m.type !== "photobooth" || m.showOnTimeline !== false),
  [memories]);

  const mergedList = useMemo(() => {
    const items: { type: string; date: string; id: string; raw: any }[] = [];
    for (const mem of visibleMemories) items.push({ type: mem.type, date: mem.date, id: mem.id, raw: mem });
    for (const j of journals) items.push({ type: "journal", date: j.date, id: j.id, raw: j });
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visibleMemories, journals]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    journals.forEach((j) => j.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [journals]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<string | null>(null);
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "book" | "desk">("timeline");

  const [dateFilterType, setDateFilterType] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filteredMergedList = useMemo(() => {
    let list = mergedList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => {
        const t = item.raw.title?.toLowerCase() || "";
        const d = item.raw.description?.toLowerCase() || "";
        const tags = item.type === "journal" ? item.raw.tags.join(" ").toLowerCase() : "";
        return t.includes(q) || d.includes(q) || tags.includes(q);
      });
    }
    if (selectedTag) list = list.filter((item) => item.type === "journal" && item.raw.tags.includes(selectedTag));
    if (selectedWeather) list = list.filter((item) => item.type === "journal" && item.raw.weather === selectedWeather);
    if (selectedMoodFilter) list = list.filter((item) => item.type === "journal" && item.raw.mood === selectedMoodFilter);

    // Date-based filter
    if (dateFilterType !== "all") {
      const now = new Date();
      list = list.filter((item) => {
        const itemDate = new Date(item.date);
        if (isNaN(itemDate.getTime())) return true;

        if (dateFilterType === "7days") {
          const diff = now.getTime() - itemDate.getTime();
          return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
        }
        if (dateFilterType === "30days") {
          const diff = now.getTime() - itemDate.getTime();
          return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
        }
        if (dateFilterType === "thismonth") {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
        }
        if (dateFilterType === "thisyear") {
          return itemDate.getFullYear() === now.getFullYear();
        }
        if (dateFilterType === "custom") {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }
        return true;
      });
    }
    return list;
  }, [mergedList, searchQuery, selectedTag, selectedWeather, selectedMoodFilter, dateFilterType, startDate, endDate]);

  const thisDayItem = useMemo(() => {
    const today = new Date();
    const m = today.getMonth(), d = today.getDate(), y = today.getFullYear();
    const matches = mergedList.filter((item) => {
      const id = new Date(item.date);
      return id.getMonth() === m && id.getDate() === d && id.getFullYear() < y;
    });
    return matches[0] || null;
  }, [mergedList]);

  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mDescription, setMDescription] = useState("");
  const [mDate, setMDate] = useState(new Date().toISOString().split("T")[0]);
  const [mImageUrl, setMImageUrl] = useState("");
  const [mImageFile, setMImageFile] = useState<File | null>(null);
  const [mImagePreview, setMImagePreview] = useState("");
  const [mImageUploading, setMImageUploading] = useState(false);
  const milestoneFileRef = useRef<HTMLInputElement>(null);

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [editJTitle, setEditJTitle] = useState("");
  const [editJDesc, setEditJDesc] = useState("");
  const [editJLoc, setEditJLoc] = useState("");
  const [editJWeath, setEditJWeath] = useState("sunny");
  const [editJMood, setEditJMood] = useState("cozy");
  const [editJTags, setEditJTags] = useState("");

  const [selectedMemoryForModal, setSelectedMemoryForModal] = useState<Memory | null>(null);
  const [modalCommentText, setModalCommentText] = useState("");
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);

  const processingReactions = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const isOpen = !!(selectedMemoryForModal || selectedJournal || editingJournal);
    window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: !isOpen }));
    return () => { window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: true })); };
  }, [selectedMemoryForModal, selectedJournal, editingJournal]);

  const handleReactionClick = useCallback((memoryId: string, emoji: string) => {
    if (!currentUser || (currentUser !== "user_a" && currentUser !== "user_b")) return;
    const key = `${currentUser}_${memoryId}_${emoji}`;
    if (processingReactions.current[key]) return;
    processingReactions.current[key] = true;
    try { addReactionToMemory(memoryId, emoji); triggerHaptic("light"); }
    catch (err) { console.error(err); }
    finally { setTimeout(() => { processingReactions.current[key] = false; }, 350); }
  }, [currentUser, addReactionToMemory]);

  const handleFileUpload = async (file: File, prefix: string): Promise<string> => {
    const reader = new FileReader();
    const raw = await new Promise<string>((resolve) => {
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
    if (cloudinaryCloudName && cloudinaryUploadPreset) {
      try {
        const res = await fetch(raw);
        const blob = await res.blob();
        return await uploadToCloudinary(blob, `${prefix}-${Date.now()}.jpg`, cloudinaryCloudName, cloudinaryUploadPreset);
      } catch (err) { console.error("Cloudinary failed:", err); }
    }
    return raw;
  };

  const handleMilestoneFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB."); return; }
    setMImageFile(file);
    setMImageUploading(true);
    try {
      const url = await handleFileUpload(file, "milestone");
      setMImagePreview(url);
      setMImageUrl(url);
    } catch { toast.error("Could not read image file."); }
    finally { setMImageUploading(false); e.target.value = ""; }
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle || !mDescription) return;
    addMemory({
      type: "milestone", title: mTitle, description: mDescription,
      imageUrl: mImageUrl || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800&auto=format&fit=crop",
      date: new Date(mDate).toISOString(), creatorId: currentUser,
    });
    setMTitle(""); setMDescription(""); setMImageUrl(""); setMImageFile(null); setMImagePreview("");
    setShowAddMilestone(false);
  };

  const handleJournalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJImageFile(file);
    setJImageUploading(true);
    try { const url = await handleFileUpload(file, "journal"); setJImagePreview(url); setJImageUrl(url); }
    catch { console.error("Journal file upload failed"); }
    finally { setJImageUploading(false); e.target.value = ""; }
  };

  const handleCreateJournal = () => {
    if (!jTitle || !jDescription) return;
    addJournal({
      title: jTitle, description: jDescription, date: new Date(jDate).toISOString(),
      location: jLocation || "Our World", weather: jWeather, mood: jMood,
      tags: jTags.split(",").map((t) => t.trim()).filter(Boolean),
      imageUrl: jImageUrl || undefined,
    });
    setJTitle(""); setJDescription(""); setJImageUrl(""); setJImagePreview(""); setJImageFile(null);
    setJTags(""); setJLocation(""); setShowAddJournal(false);
  };

  const startEditJournal = (entry: Journal) => {
    setEditingJournal(entry);
    setEditJTitle(entry.title || ""); setEditJDesc(entry.description || "");
    setEditJLoc(entry.location || ""); setEditJWeath(entry.weather || "sunny");
    setEditJMood(entry.mood || "cozy"); setEditJTags(entry.tags?.join(", ") || "");
  };

  const handleSaveEditJournal = async () => {
    if (!editingJournal) return;
    await updateJournal(editingJournal.id, {
      title: editJTitle, description: editJDesc, location: editJLoc,
      weather: editJWeath, mood: editJMood, tags: editJTags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setEditingJournal(null);
    triggerHaptic("success");
  };

  const prepareStylesheets = async () => {
    const disabled = new Set<CSSStyleSheet | HTMLStyleElement | HTMLLinkElement>();
    const temps: HTMLStyleElement[] = [];
    for (const style of Array.from(document.querySelectorAll("style"))) {
      const text = style.textContent || "";
      if (text.includes("oklch") || text.includes("oklab")) {
        const ts = document.createElement("style");
        ts.textContent = cleanColors(text);
        document.head.appendChild(ts);
        temps.push(ts);
        style.disabled = true;
        disabled.add(style);
      }
    }
    return { disabledSheets: disabled, tempStyles: temps };
  };

  const restoreStylesheets = (disabledSheets: Set<any>, tempStyles: HTMLStyleElement[]) => {
    disabledSheets.forEach((s: any) => { try { s.disabled = false; } catch {} });
    tempStyles.forEach((ts) => ts.parentNode?.removeChild(ts));
  };

  const handleDownloadMemoryStrip = async (currentMem: Memory) => {
    const el = document.getElementById(`photobooth-strip-modal-${currentMem.id}`);
    if (!el) { handleDownloadImage(currentMem.imageUrl, currentMem.title); return; }
    let disabledSheets = new Set<any>();
    let tempStyles: HTMLStyleElement[] = [];
    try {
      triggerHaptic("success");
      const prepared = await prepareStylesheets();
      disabledSheets = prepared.disabledSheets;
      tempStyles = prepared.tempStyles;
      const canvas = await html2canvas(el, { useCORS: true, allowTaint: true, backgroundColor: null, scale: 3.0, logging: false });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${currentMem.title.replace(/\s+/g, "_") || "keepsake"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      handleDownloadImage(currentMem.imageUrl, currentMem.title);
    } finally {
      restoreStylesheets(disabledSheets, tempStyles);
    }
  };

  const milestonePresets = [
    { label: "Cozy Cafe ☕", url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=600&auto=format&fit=crop" },
    { label: "Ocean Sunset 🌅", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop" },
    { label: "Cherry Blossom 🌸", url: "https://images.unsplash.com/photo-1522441815192-d9f04eb0615c?q=80&w=600&auto=format&fit=crop" },
    { label: "Cozy Cabin 🌲", url: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?q=80&w=600&auto=format&fit=crop" },
  ];

  const storyContent = (
    <div className="text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-[var(--border-color)]">
        <div>
          <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Our Scrapbook Story</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">A beautiful, flowing chronicle of milestones, daily notes, and sweet moments.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <StickerButton
            onClick={() => { setShowAddMilestone(!showAddMilestone); setShowAddJournal(false); }}
            color={showAddMilestone ? "tan" : "rose"}
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            {showAddMilestone ? "Cancel" : "Add Milestone"}
          </StickerButton>
          <StickerButton
            onClick={() => { setShowAddJournal(!showAddJournal); setShowAddMilestone(false); }}
            color={showAddJournal ? "tan" : "gold"}
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            {showAddJournal ? "Cancel" : "New Diary Entry"}
          </StickerButton>
        </div>
      </div>

      {/* Visual Desk / Book / Timeline Toggle switcher */}
      <div className="my-5 flex justify-center">
        <div className="inline-flex bg-black/5 dark:bg-black/20 p-1 rounded-2xl border border-[var(--border-color)] dark:border-white/5">
          <button
            onClick={() => { setViewMode("timeline"); triggerHaptic("light"); }}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewMode === "timeline"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Timeline Diary Grid
          </button>

          <button
            onClick={() => { setViewMode("book"); triggerHaptic("light"); }}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewMode === "book"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
            }`}
          >
            <span>📖</span> Open 3D Journal Book
            <span className="text-[8px] bg-amber-500 text-white font-mono font-bold px-1.5 py-0.5 rounded-full scale-90">HOT</span>
          </button>

          <button
            onClick={() => { setViewMode("desk"); triggerHaptic("light"); }}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewMode === "desk"
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
            }`}
          >
            <Sparkles className="w-4 h-4" /> Interactive Desk Canvas
            <span className="text-[8px] bg-emerald-500 text-white font-mono font-bold px-1.5 py-0.5 rounded-full scale-90">NEW</span>
          </button>
        </div>
      </div>

      {/* Add Milestone Form */}
      {showAddMilestone && (
        <div className="mt-6"><form onSubmit={handleCreateMilestone}
          className="p-6 space-y-4 max-w-2xl mx-auto rounded-3xl border border-[var(--border-color)]" style={{ backgroundColor: "var(--fabric-cream)" }}
        >
          <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--primary)] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Create Shared Milestone
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={mTitle} onChange={(e) => setMTitle(e.target.value)} required placeholder="e.g. Our first snowfall ❄️"
              className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg focus:border-[var(--primary)] text-[var(--text-main)]" />
            <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} required
              className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg focus:border-[var(--primary)] text-[var(--text-main)] cursor-pointer" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Cover Image</label>
            <input type="file" ref={milestoneFileRef} accept="image/*" className="hidden" onChange={handleMilestoneFileChange} />
            <button type="button" onClick={() => milestoneFileRef.current?.click()}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] cursor-pointer">
              <Upload className="w-3 h-3" /> {mImageUploading ? "Processing…" : "Upload Photo"}
            </button>
            {mImagePreview && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-[var(--primary)]/20">
                <img loading="lazy" src={mImagePreview} alt="Milestone image preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setMImagePreview(""); setMImageUrl(""); }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer"><X className="w-3 h-3" /></button>
              </div>
            )}
            {!mImagePreview && (
              <>
                <input type="text" value={mImageUrl} onChange={(e) => setMImageUrl(e.target.value)} placeholder="…or paste an image URL"
                  className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg focus:border-[var(--primary)] text-[var(--text-main)]" />
                <div className="flex flex-wrap gap-1.5">
                  {milestonePresets.map((pr) => (
                    <button type="button" key={pr.label} onClick={() => setMImageUrl(pr.url)}
                      className={`text-[9px] px-2.5 py-1 rounded-full border cursor-pointer ${mImageUrl === pr.url ? "bg-[var(--primary)] text-white border-transparent font-bold" : "text-[var(--text-muted)] hover:opacity-80"}`}>{pr.label}</button>
                  ))}
                </div>
              </>
            )}
          </div>
          <textarea value={mDescription} onChange={(e) => setMDescription(e.target.value)} required rows={3}
            placeholder="Describe how magical it was…"
            className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg focus:border-[var(--primary)] text-[var(--text-main)] resize-none" />
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] cursor-pointer"
          >
            Log Milestone to Our Library
          </button>
        </form></div>
      )}

      {/* Add Journal Form */}
      {showAddJournal && (
        <div className="mt-6"><div
          className="p-6 space-y-4 max-w-2xl mx-auto rounded-3xl border border-[var(--border-color)]" style={{ backgroundColor: "var(--fabric-cream)" }}>
          <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--primary)] flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> New Diary Entry</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={jTitle} onChange={(e) => setJTitle(e.target.value)} placeholder="Title of this moment..."
              className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg focus:border-[var(--primary)] text-[var(--text-main)]" />
            <input type="date" value={jDate} onChange={(e) => setJDate(e.target.value)}
              className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg focus:border-[var(--primary)] text-[var(--text-main)] cursor-pointer" />
          </div>
          <textarea value={jDescription} onChange={(e) => setJDescription(e.target.value)} rows={5}
            placeholder="Write your thoughts, feelings, and memories of this day..."
            className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg focus:border-[var(--primary)] text-[var(--text-main)] resize-none" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={jWeather} onChange={(e) => setJWeather(e.target.value)}
              className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg outline-none text-[var(--text-main)]">
              {WEATHER_OPTIONS.map((w) => <option key={w} value={w}>{WEATHER_ICONS[w]} {w}</option>)}
            </select>
            <select value={jMood} onChange={(e) => setJMood(e.target.value)}
              className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg outline-none text-[var(--text-main)]">
              {MOOD_OPTIONS.map((m) => <option key={m} value={m}>{MOOD_ICONS[m]} {m}</option>)}
            </select>
            <input type="text" value={jLocation} onChange={(e) => setJLocation(e.target.value)} placeholder="Where were we?"
              className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg outline-none focus:border-[var(--primary)] text-[var(--text-main)]" />
          </div>
          <input type="text" value={jTags} onChange={(e) => setJTags(e.target.value)} placeholder="e.g. date-night, cafe, anniversary"
            className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg focus:border-[var(--primary)] text-[var(--text-main)]" />
          <div>
            <input type="file" ref={journalFileRef} accept="image/*" className="hidden" onChange={handleJournalFileChange} />
            <button type="button" onClick={() => journalFileRef.current?.click()}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] cursor-pointer">
              <Upload className="w-3 h-3" /> {jImageUploading ? "Uploading..." : "Upload Photo"}
            </button>
            {jImagePreview && (
              <div className="relative w-32 h-32 mt-2 rounded-xl overflow-hidden border border-[var(--primary)]/20">
                <img loading="lazy" src={jImagePreview} alt="Journal image preview" className="w-full h-full object-cover" />
                <button onClick={() => { setJImagePreview(""); setJImageUrl(""); }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer"><X className="w-2.5 h-2.5" /></button>
              </div>
            )}
          </div>
          <button
            onClick={handleCreateJournal}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] cursor-pointer"
          >
            Save to Our Diary
          </button>
        </div></div>
      )}

      {viewMode === "desk" ? (
        <div className="mt-6">
          <ScrapbookCanvas onSelectMemory={(mem) => setSelectedMemoryForModal(mem)} />
        </div>
      ) : viewMode === "book" ? (
        <div className="mt-6">
          <OpenBookSpread 
            items={filteredMergedList}
            onSelectItem={(item) => {
              if (item.type === "journal") setSelectedJournal(item.raw);
              else setSelectedMemoryForModal(item.raw);
            }}
          />
        </div>
      ) : (
        <>
          <WashiTapeDivider color="rose" label="Browse" />

          {/* Search & Filters */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search scrapbook memories..."
                  className="w-full pl-8 pr-3 py-2 bg-black/5 dark:bg-stone-900/50 border border-transparent dark:border-white/10 text-xs rounded-xl outline-none focus:bg-white dark:focus:bg-stone-800 focus:border-[var(--primary)] text-[var(--text-main)]" />
              </div>
              <select value={dateFilterType} onChange={(e) => setDateFilterType(e.target.value)}
                className="bg-black/5 dark:bg-stone-900/50 border border-transparent dark:border-white/10 text-xs px-3 py-2 rounded-xl outline-none cursor-pointer text-[var(--text-main)] font-medium">
                <option value="all" className="dark:bg-stone-900">📅 All Dates</option>
                <option value="7days" className="dark:bg-stone-900">📅 Last 7 Days</option>
                <option value="30days" className="dark:bg-stone-900">📅 Last 30 Days</option>
                <option value="thismonth" className="dark:bg-stone-900">📅 This Month</option>
                <option value="thisyear" className="dark:bg-stone-900">📅 This Year</option>
                <option value="custom" className="dark:bg-stone-900">📅 Custom Range</option>
              </select>
              <select value={selectedTag || ""} onChange={(e) => setSelectedTag(e.target.value || null)}
                className="bg-black/5 dark:bg-stone-900/50 border border-transparent dark:border-white/10 text-xs px-3 py-2 rounded-xl outline-none cursor-pointer text-[var(--text-main)]">
                <option value="" className="dark:bg-stone-900">All Tags</option>
                {allTags.map((t) => <option key={t} value={t} className="dark:bg-stone-900">#{t}</option>)}
              </select>
              <select value={selectedWeather || ""} onChange={(e) => setSelectedWeather(e.target.value || null)}
                className="bg-black/5 dark:bg-stone-900/50 border border-transparent dark:border-white/10 text-xs px-3 py-2 rounded-xl outline-none cursor-pointer text-[var(--text-main)]">
                <option value="" className="dark:bg-stone-900">All Weather</option>
                {WEATHER_OPTIONS.map((w) => <option key={w} value={w} className="dark:bg-stone-900">{WEATHER_ICONS[w]} {w}</option>)}
              </select>
              <select value={selectedMoodFilter || ""} onChange={(e) => setSelectedMoodFilter(e.target.value || null)}
                className="bg-black/5 dark:bg-stone-900/50 border border-transparent dark:border-white/10 text-xs px-3 py-2 rounded-xl outline-none cursor-pointer text-[var(--text-main)]">
                <option value="" className="dark:bg-stone-900">All Moods</option>
                {MOOD_OPTIONS.map((m) => <option key={m} value={m} className="dark:bg-stone-900">{MOOD_ICONS[m]} {m}</option>)}
              </select>
            </div>

            {dateFilterType === "custom" && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-black/5 dark:bg-stone-900/50 rounded-2xl border border-[var(--border-color)]/30 dark:border-white/10 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">From:</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white dark:bg-zinc-800 text-xs px-2.5 py-1.5 rounded-xl border border-black/5 dark:border-white/10 outline-none text-[var(--text-main)] cursor-pointer shadow-3xs" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">To:</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white dark:bg-zinc-800 text-xs px-2.5 py-1.5 rounded-xl border border-black/5 dark:border-white/10 outline-none text-[var(--text-main)] cursor-pointer shadow-3xs" />
                </div>
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    className="text-[10px] text-red-500 hover:text-red-600 hover:underline font-bold ml-auto cursor-pointer"
                  >
                    Clear range
                  </button>
                )}
              </div>
            )}
          </div>

          <WashiTapeDivider color="gold" label="This Day in Our Story" />

          {/* This Day in Our Story */}
          <div className="bg-gradient-to-br from-amber-500/5 to-rose-500/5 border border-[var(--primary)]/20 p-5 space-y-3 rounded-3xl">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-[var(--primary)] flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> This Day in Our Story
            </h4>
            {thisDayItem ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono">
                  <span className="font-bold text-[var(--primary)]">{new Date(thisDayItem.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</span>
                  <span>{new Date(thisDayItem.date).getFullYear()} ({new Date().getFullYear() - new Date(thisDayItem.date).getFullYear()} years ago)</span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)] font-serif leading-tight">{thisDayItem.raw.title}</h3>
                {thisDayItem.raw.imageUrl && (
                  <div className="w-full aspect-[2/1] rounded-xl overflow-hidden border border-[var(--wood-oak)]/10">
                    <LazyImage src={thisDayItem.raw.imageUrl} alt={thisDayItem.raw.title} className="w-full h-full object-cover" showSkeleton rootMargin={100} />
                  </div>
                )}
                <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">{thisDayItem.raw.description}</p>
                <button onClick={() => { if (thisDayItem.type === "journal") setSelectedJournal(thisDayItem.raw); else setSelectedMemoryForModal(thisDayItem.raw); }}
                  className="text-[10px] font-bold text-[var(--primary)] hover:underline cursor-pointer">Relive this keepsake ✦</button>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No matching memories on this day in previous years. Let's record a new diary entry or milestone today to look back on next year! 🌸📖</p>
            )}
          </div>

          <WashiTapeDivider color="coral" label="Timeline" />

          {/* Memory Feed */}
          {initialLoading ? (
            <div className="space-y-4" role="status" aria-label="Loading memories">
              <div className="flex items-center gap-3 p-4 rounded-3xl border border-[var(--wood-oak)]/15" style={{ backgroundColor: "var(--fabric-cream)" }}>
                <Skeleton width={40} height={40} rounded="50%" />
                <div className="flex-1 space-y-2">
                  <Skeleton height={14} width="45%" rounded="6px" />
                  <Skeleton height={10} width="30%" rounded="6px" />
                </div>
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl border border-[var(--wood-oak)]/15 overflow-hidden" style={{ backgroundColor: "var(--fabric-cream)" }}>
                  <SkeletonImage aspectRatio="21/9" className="w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton height={16} width="60%" rounded="6px" />
                    <Skeleton height={12} width="80%" rounded="6px" />
                    <Skeleton height={12} width="40%" rounded="6px" />
                  </div>
                </div>
              ))}
              <span className="sr-only">Loading your scrapbook memories...</span>
            </div>
          ) : filteredMergedList.length === 0 ? (
            <EmptyJournalPage
              icon="📖"
              message="No memories found matching the filters."
            />
          ) : (
            <HoverExpandFeed
              items={filteredMergedList}
              onSelectItem={(item) => {
                if (item.type === "journal") setSelectedJournal(item.raw);
                else setSelectedMemoryForModal(item.raw);
              }}
            />
          )}

          {/* Load More */}
          <div className="flex justify-center gap-3 pt-6 border-t border-[var(--wood-oak)]/10 mt-6">
            {memories.length >= memoriesLimit && (
              <button onClick={loadMoreMemories}
                className="py-2 px-5 rounded-full border border-[var(--wood-oak)]/20 bg-[var(--fabric-cream)]/60 hover:bg-[var(--fabric-cream)] text-[var(--primary)] text-xs font-bold shadow-sm cursor-pointer active:scale-95">
                Load More Scrapbooks 🖼️
              </button>
            )}
            {journals.length >= journalsLimit && (
              <button onClick={loadMoreJournals}
                className="py-2 px-5 rounded-full border border-[var(--wood-oak)]/20 bg-[var(--fabric-cream)]/60 hover:bg-[var(--fabric-cream)] text-[var(--primary)] text-xs font-bold shadow-sm cursor-pointer active:scale-95">
                Load More Entries 📖
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Memory Detail Modal ── */}
      <AnimatePresence>
        {selectedMemoryForModal && (() => {
          const currentMem = memories.find((m) => m.id === selectedMemoryForModal.id) || selectedMemoryForModal;
          const filterObj = availableFilters.find((f) => f.value === currentMem.filterClass);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedMemoryForModal(null)} className="absolute inset-0 glass-modal-backdrop z-0" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className={cn(
                  "bg-[var(--fabric-cream)] rounded-3xl shadow-2xl border border-[var(--wood-oak)]/30 w-full z-10 flex flex-col max-h-[95vh] md:max-h-[92vh] relative text-left transition-all duration-300 overflow-y-auto md:overflow-hidden",
                  currentMem.imageUrl ? "max-w-5xl md:max-w-6xl md:flex-row" : "max-w-2xl md:max-w-3xl"
                )}>
                
                {/* Header/Close actions absolutely positioned on container */}
                <button onClick={async () => { if (confirm("Delete this memory forever?")) { await deleteMemory(currentMem.id); setSelectedMemoryForModal(null); } }}
                  className="absolute top-4 left-4 p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 rounded-full text-red-500 z-30 cursor-pointer transition-all shadow-xs">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedMemoryForModal(null)}
                  className="absolute top-4 right-4 p-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-[var(--text-muted)] z-30 cursor-pointer transition-all shadow-xs">
                  <X className="w-4 h-4" />
                </button>

                {currentMem.imageUrl ? (
                  <>
                    {/* LEFT COLUMN: The Visual Polaroid & Local download actions */}
                    <div className="w-full md:w-[45%] bg-[#F2EDE4] dark:bg-[#1A1512] flex flex-col justify-between items-center p-6 border-b md:border-b-0 md:border-r border-[var(--wood-oak)]/20 relative flex-shrink-0 md:max-h-[92vh] md:overflow-y-auto scrapbook-scrollbar">
                      <div className="w-full flex-1 flex flex-col justify-center items-center py-4">
                        <div id={`photobooth-strip-modal-${currentMem.id}`} className="p-4 pb-14 bg-white dark:bg-stone-50 border border-neutral-200/60 rounded-xs shadow-xl relative transition-all duration-300 max-w-[280px] w-full flex flex-col items-center">
                          {/* Washi tape on top of Polaroid */}
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#E8B4B8_4px,#E8B4B8_8px)] opacity-40 rounded-sm transform rotate-1 z-10" />
                          
                          <div className="w-full aspect-square bg-black/5 overflow-hidden border border-neutral-900/10 relative">
                            <LazyImage src={currentMem.imageUrl} alt={currentMem.title} className={`w-full h-full object-cover transition-all duration-500 ${filterObj?.class || ""}`} referrerPolicy="no-referrer" showSkeleton rootMargin={100} />
                            {currentMem.filterClass === "light-leak" && (
                              <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-rose-500/20 to-transparent pointer-events-none mix-blend-screen" />
                            )}
                          </div>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] text-center">
                            <span className="font-handwrite text-lg text-amber-950 tracking-wide rotate-[-1deg] block truncate max-w-full leading-tight font-bold">
                              {currentMem.polaroidNote || cleanTitle(currentMem.title, currentMem.type) || "A Sweet Day ✨"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Download/Print controls under the Polaroid image */}
                      <div className="w-full flex gap-2.5 pt-3 border-t border-[var(--wood-oak)]/10">
                        <button onClick={() => { handleDownloadImage(currentMem.imageUrl!, currentMem.title); }}
                          className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95">
                          <Download className="w-3.5 h-3.5" /> Download Image
                        </button>
                        <button onClick={() => { handlePrintImage(currentMem.imageUrl!, currentMem.title); }}
                          className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95">
                          🖨️ Print Photo
                        </button>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Metadata, controls, comments */}
                    <div className="w-full md:w-[55%] flex flex-col md:max-h-[92vh] md:overflow-hidden">
                      {/* Fixed Header */}
                      <div className="p-5 pb-3 border-b border-[var(--wood-oak)]/10 flex-shrink-0 pr-12">
                        <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-[var(--text-muted)] font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>{new Date(currentMem.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                          <span>·</span>
                          <span>By {currentMem.creatorId === "user_a" ? userA.name.split(" ")[0] : userB.name.split(" ")[0]}</span>
                        </div>
                        <h3 className="text-base font-serif font-bold text-[var(--text-main)] mt-1 leading-tight">{cleanTitle(currentMem.title, currentMem.type)}</h3>
                      </div>

                      {/* Scrollable details */}
                      <div className="flex-1 md:overflow-y-auto overflow-visible p-5 space-y-4 scrapbook-scrollbar">
                        {/* Polaroid Lab Controls */}
                        <div className="p-4 bg-white/40 dark:bg-stone-900/20 rounded-2xl border border-[var(--wood-oak)]/10 space-y-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wider text-[var(--primary)] font-bold flex items-center gap-1">🎨 Retro Filter Studio</span>
                              {currentMem.filterClass && currentMem.filterClass !== "none" && (
                                <span className="text-[8px] font-mono text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded-full font-bold">
                                  {filterObj?.label}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-1 p-1 bg-black/5 dark:bg-black/25 rounded-xl">
                              {availableFilters.map((f) => (
                                <button
                                  key={f.value}
                                  onClick={async () => {
                                    await updateMemory(currentMem.id, { filterClass: f.value });
                                    triggerHaptic("light");
                                    toast.success(`Applied ${f.label}!`);
                                  }}
                                  className={`py-1 px-1 text-[9px] font-bold rounded-lg border transition-all truncate cursor-pointer ${
                                    currentMem.filterClass === f.value || (!currentMem.filterClass && f.value === "none")
                                      ? "bg-[var(--primary)] text-white border-transparent shadow-xs"
                                      : "bg-white dark:bg-stone-800 text-[var(--text-secondary)] border-[var(--border-color)] dark:border-white/5 hover:bg-neutral-50 dark:hover:bg-stone-700"
                                  }`}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider text-[var(--primary)] font-bold flex items-center gap-1">✍️ Handwriting Bottom Note</span>
                            <input
                              type="text"
                              maxLength={32}
                              placeholder="Write a cute handwriting note here..."
                              value={currentMem.polaroidNote || ""}
                              onChange={async (e) => {
                                await updateMemory(currentMem.id, { polaroidNote: e.target.value });
                              }}
                              className="w-full text-[11px] px-3 py-1.5 bg-black/5 dark:bg-black/20 focus:bg-white dark:focus:bg-stone-800 border border-[var(--border-color)] dark:border-white/10 focus:border-[var(--primary)] outline-none text-[var(--text-main)] rounded-xl"
                            />
                            <p className="text-[8px] text-[var(--text-muted)] italic">Typing updates the bottom of the Polaroid instantly!</p>
                          </div>
                        </div>

                        {editingId === currentMem.id ? (
                          <div className="space-y-3 p-3 bg-white/40 dark:bg-stone-900/20 rounded-2xl border border-[var(--wood-oak)]/10">
                            <input type="text" value={editTitleText} onChange={(e) => setEditTitleText(e.target.value)}
                              className="w-full text-xs p-2 border border-[var(--wood-oak)]/20 rounded-lg outline-none bg-[var(--fabric-cream)] text-[var(--text-main)]" />
                            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3}
                              className="w-full text-xs p-2 border border-[var(--wood-oak)]/20 rounded-lg outline-none resize-none bg-[var(--fabric-cream)] text-[var(--text-main)]" />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-black/5 text-[var(--text-muted)] text-xs font-bold rounded-lg cursor-pointer">Cancel</button>
                              <button onClick={async () => { await updateMemory(currentMem.id, { title: editTitleText, description: editDesc }); setEditingId(null); }}
                                className="px-3 py-1 bg-[var(--primary)] text-white text-xs font-bold rounded-lg cursor-pointer">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-[var(--fabric-cream)]/50 p-3.5 rounded-xl border border-[var(--wood-oak)]/10 flex gap-2 items-start">
                            <p className="text-xs text-[var(--text-main)] leading-relaxed flex-1">{currentMem.description || <span className="italic opacity-50">No caption added.</span>}</p>
                            <button onClick={() => { setEditingId(currentMem.id); setEditTitleText(currentMem.title || ""); setEditDesc(currentMem.description || ""); }}
                              className="text-[10px] text-[var(--primary)] hover:underline font-bold flex-shrink-0 cursor-pointer">Edit</button>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <h4 className="text-[10px] uppercase tracking-wider text-[var(--primary)] font-bold">Tap to React ❤️</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {REACTION_EMOJIS.map((emoji) => {
                              const hasReacted = !!userReactions?.[`${currentUser}_${currentMem.id}`]?.[emoji];
                              return (
                                <button key={emoji} onClick={() => handleReactionClick(currentMem.id, emoji)}
                                  className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border cursor-pointer transition-all hover:scale-105 active:scale-95 ${hasReacted ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20" : "bg-[var(--fabric-cream)]/30 hover:bg-[var(--primary)]/5 text-[var(--text-main)] border-[var(--wood-oak)]/15"}`}>
                                  <span>{emoji}</span>
                                  <span className={`text-[9px] font-mono ${hasReacted ? "text-[var(--primary)] font-bold" : "text-[var(--text-muted)]"}`}>{currentMem.reactions[emoji] || 0}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[var(--wood-oak)]/15">
                          <h4 className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Comments ({currentMem.comments.length})</h4>
                          {currentMem.comments.length === 0 ? (
                            <div className="text-center py-4 bg-[var(--fabric-cream)]/20 rounded-xl border border-[var(--wood-oak)]/15 text-[10px] text-[var(--text-muted)]">No whispers yet.</div>
                          ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrapbook-scrollbar">
                              {currentMem.comments.map((comm: any) => (
                                <div key={comm.id} className="bg-[var(--fabric-cream)]/30 rounded-xl p-2.5 text-[10px] border border-[var(--wood-oak)]/15">
                                  <div className="flex justify-between items-center text-[8px] text-[var(--text-muted)] font-mono">
                                    <span className="font-bold text-[var(--text-main)]">{comm.authorId === "user_a" ? `${userA.name.split(" ")[0]} 🌸` : `${userB.name.split(" ")[0]} ☕`}</span>
                                    <div className="flex items-center gap-1">
                                      <span>{new Date(comm.date).toLocaleDateString()}</span>
                                      {comm.authorId === currentUser && (
                                        <button onClick={() => { if (confirm("Delete comment?")) deleteCommentFromMemory(currentMem.id, comm.id); }}
                                          className="text-red-400 hover:text-red-600 ml-1.5 cursor-pointer">Delete</button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-[var(--text-main)] mt-1 font-serif leading-relaxed whitespace-pre-wrap">{comm.text}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-1.5 pt-1.5">
                            <input type="text" placeholder="Add a sweet whisper..." value={modalCommentText}
                              onChange={(e) => setModalCommentText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && modalCommentText.trim()) { addCommentToMemory(currentMem.id, modalCommentText.trim()); setModalCommentText(""); } }}
                              className="flex-1 text-[11px] px-3 py-1.5 bg-black/5 rounded-lg focus:bg-white focus:border-[var(--primary)] outline-none text-[var(--text-main)] border border-[var(--wood-oak)]/10" />
                            <button onClick={() => { if (modalCommentText.trim()) { addCommentToMemory(currentMem.id, modalCommentText.trim()); setModalCommentText(""); } }}
                              className="px-3 bg-[var(--primary)] text-white font-bold rounded-lg text-xs cursor-pointer">Send</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* SINGLE-COLUMN LAYOUT: When there is no image */
                  <div className="flex flex-col flex-1 md:max-h-[92vh] md:overflow-hidden p-6">
                    <div className="pb-3 border-b border-[var(--wood-oak)]/10 flex-shrink-0 pr-12">
                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-[var(--text-muted)] font-mono">
                        <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span>{new Date(currentMem.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                        <span>·</span>
                        <span>By {currentMem.creatorId === "user_a" ? userA.name.split(" ")[0] : userB.name.split(" ")[0]}</span>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-[var(--text-main)] mt-1.5 leading-tight">{cleanTitle(currentMem.title, currentMem.type)}</h3>
                    </div>

                    <div className="flex-1 md:overflow-y-auto overflow-visible space-y-4 pt-4 scrapbook-scrollbar">
                      {editingId === currentMem.id ? (
                        <div className="space-y-3">
                          <input type="text" value={editTitleText} onChange={(e) => setEditTitleText(e.target.value)}
                            className="w-full text-xs p-2 border border-[var(--wood-oak)]/20 rounded-lg outline-none bg-[var(--fabric-cream)] text-[var(--text-main)]" />
                          <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3}
                            className="w-full text-xs p-2 border border-[var(--wood-oak)]/20 rounded-lg outline-none resize-none bg-[var(--fabric-cream)] text-[var(--text-main)]" />
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-black/5 text-[var(--text-muted)] text-xs font-bold rounded-lg cursor-pointer">Cancel</button>
                            <button onClick={async () => { await updateMemory(currentMem.id, { title: editTitleText, description: editDesc }); setEditingId(null); }}
                              className="px-3 py-1 bg-[var(--primary)] text-white text-xs font-bold rounded-lg cursor-pointer">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[var(--fabric-cream)]/50 p-3.5 rounded-xl border border-[var(--wood-oak)]/10 flex gap-2 items-start">
                          <p className="text-xs text-[var(--text-main)] leading-relaxed flex-1">{currentMem.description || <span className="italic opacity-50">No caption added.</span>}</p>
                          <button onClick={() => { setEditingId(currentMem.id); setEditTitleText(currentMem.title || ""); setEditDesc(currentMem.description || ""); }}
                            className="text-[10px] text-[var(--primary)] hover:underline font-bold flex-shrink-0 cursor-pointer">Edit</button>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <h4 className="text-[10px] uppercase tracking-wider text-[var(--primary)] font-bold">Tap to React ❤️</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {REACTION_EMOJIS.map((emoji) => {
                            const hasReacted = !!userReactions?.[`${currentUser}_${currentMem.id}`]?.[emoji];
                            return (
                              <button key={emoji} onClick={() => handleReactionClick(currentMem.id, emoji)}
                                className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 border cursor-pointer ${hasReacted ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20" : "bg-[var(--fabric-cream)]/30 hover:bg-[var(--primary)]/5 text-[var(--text-main)] border-[var(--wood-oak)]/15"}`}>
                                <span>{emoji}</span>
                                <span className={`text-[9px] font-mono ${hasReacted ? "text-[var(--primary)] font-bold" : "text-[var(--text-muted)]"}`}>{currentMem.reactions[emoji] || 0}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[var(--wood-oak)]/15">
                        <h4 className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Comments ({currentMem.comments.length})</h4>
                        {currentMem.comments.length === 0 ? (
                          <div className="text-center py-4 bg-[var(--fabric-cream)]/20 rounded-xl border border-[var(--wood-oak)]/15 text-[10px] text-[var(--text-muted)]">No whispers yet.</div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrapbook-scrollbar">
                            {currentMem.comments.map((comm: any) => (
                              <div key={comm.id} className="bg-[var(--fabric-cream)]/30 rounded-xl p-2.5 text-[10px] border border-[var(--wood-oak)]/15">
                                <div className="flex justify-between items-center text-[8px] text-[var(--text-muted)] font-mono">
                                  <span className="font-bold text-[var(--text-main)]">{comm.authorId === "user_a" ? `${userA.name.split(" ")[0]} 🌸` : `${userB.name.split(" ")[0]} ☕`}</span>
                                  <div className="flex items-center gap-1">
                                    <span>{new Date(comm.date).toLocaleDateString()}</span>
                                    {comm.authorId === currentUser && (
                                      <button onClick={() => { if (confirm("Delete comment?")) deleteCommentFromMemory(currentMem.id, comm.id); }}
                                        className="text-red-400 hover:text-red-600 ml-1.5 cursor-pointer">Delete</button>
                                    )}
                                  </div>
                                </div>
                                <p className="text-[10px] text-[var(--text-main)] mt-1 font-serif leading-relaxed whitespace-pre-wrap">{comm.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-1.5 pt-1.5">
                          <input type="text" placeholder="Add a sweet whisper..." value={modalCommentText}
                            onChange={(e) => setModalCommentText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && modalCommentText.trim()) { addCommentToMemory(currentMem.id, modalCommentText.trim()); setModalCommentText(""); } }}
                            className="flex-1 text-[11px] px-3 py-1.5 bg-black/5 rounded-lg focus:bg-white focus:border-[var(--primary)] outline-none text-[var(--text-main)] border border-[var(--wood-oak)]/10" />
                          <button onClick={() => { if (modalCommentText.trim()) { addCommentToMemory(currentMem.id, modalCommentText.trim()); setModalCommentText(""); } }}
                            className="px-3 bg-[var(--primary)] text-white font-bold rounded-lg text-xs cursor-pointer">Send</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Journal Detail Modal */}
      <AnimatePresence>
        {selectedJournal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedJournal(null)} className="absolute inset-0 glass-modal-backdrop z-0" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "bg-[var(--fabric-cream)] rounded-3xl shadow-2xl border border-[var(--wood-oak)]/30 w-full z-10 flex flex-col max-h-[95vh] md:max-h-[92vh] relative text-left transition-all duration-300 overflow-y-auto md:overflow-hidden",
                selectedJournal.imageUrl ? "max-w-5xl md:max-w-6xl md:flex-row" : "max-w-2xl md:max-w-3xl"
              )}>
              
              {/* Header/Close actions absolutely positioned on container */}
              <div className="absolute top-4 right-4 flex gap-1.5 z-30">
                <button onClick={() => startEditJournal(selectedJournal)}
                  className="p-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-[var(--text-muted)] cursor-pointer transition-all"><Edit2 className="w-4 h-4" /></button>
                <button onClick={async () => { if (confirm("Delete this entry?")) { await deleteJournal(selectedJournal.id); setSelectedJournal(null); } }}
                  className="p-1.5 bg-red-50 hover:bg-red-100 rounded-full text-red-500 cursor-pointer transition-all"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setSelectedJournal(null)}
                  className="p-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full text-[var(--text-muted)] cursor-pointer transition-all"><X className="w-4 h-4" /></button>
              </div>

              {selectedJournal.imageUrl ? (
                <>
                  {/* LEFT COLUMN: Visual Media & Download Actions */}
                  <div className="w-full md:w-[45%] bg-[#F2EDE4] dark:bg-[#1A1512] flex flex-col justify-between items-center p-6 border-b md:border-b-0 md:border-r border-[var(--wood-oak)]/20 relative flex-shrink-0 md:max-h-[92vh] md:overflow-y-auto scrapbook-scrollbar">
                    <div className="w-full flex-1 flex flex-col justify-center items-center py-4">
                      <div className="p-3 bg-white dark:bg-stone-50 border border-neutral-200/60 rounded-xl shadow-xl max-w-[280px] w-full transform rotate-[-1deg]">
                        <div className="w-full aspect-square bg-black/5 overflow-hidden border border-neutral-950/10 rounded-lg">
                          <img loading="lazy" src={selectedJournal.imageUrl} alt={selectedJournal.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    </div>

                    <div className="w-full flex gap-2.5 pt-3 border-t border-[var(--wood-oak)]/10">
                      <button onClick={() => { handleDownloadImage(selectedJournal.imageUrl!, selectedJournal.title); }}
                        className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95">
                        <Download className="w-3.5 h-3.5" /> Download Image
                      </button>
                      <button onClick={() => { handlePrintImage(selectedJournal.imageUrl!, selectedJournal.title); }}
                        className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95">
                        🖨️ Print Photo
                      </button>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Spreading Notebook Page */}
                  <div className="w-full md:w-[55%] flex flex-col md:max-h-[92vh] md:overflow-hidden">
                    {/* Fixed Header */}
                    <div className="p-6 pb-4 border-b border-[var(--wood-oak)]/10 flex-shrink-0 pr-24">
                      <h3 className="text-xl font-serif font-bold text-[var(--text-main)] leading-tight">{cleanTitle(selectedJournal.title, "journal")}</h3>
                      
                      {/* Decorative Post-it Stamps */}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span className="text-[10px] px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-[var(--text-secondary)] font-mono flex items-center gap-1 border border-stone-200/50 dark:border-stone-700/50 shadow-3xs">
                          <Calendar className="w-3.5 h-3.5 text-rose-400" />
                          {new Date(selectedJournal.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                        <span className="text-[10px] px-2.5 py-1 rounded-md bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1 border border-amber-200/40 dark:border-amber-900/30 shadow-3xs">
                          <span>{WEATHER_ICONS[selectedJournal.weather] || "☀️"}</span>
                          {selectedJournal.weather}
                        </span>
                        <span className="text-[10px] px-2.5 py-1 rounded-md bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 font-bold flex items-center gap-1 border border-rose-200/40 dark:border-rose-900/30 shadow-3xs">
                          <span>{MOOD_ICONS[selectedJournal.mood] || "💖"}</span>
                          {selectedJournal.mood}
                        </span>
                        {selectedJournal.location && (
                          <span className="text-[10px] px-2.5 py-1 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 border border-emerald-200/40 dark:border-emerald-900/30 shadow-3xs">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            {selectedJournal.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Scrollable parchment paper */}
                    <div className="flex-1 md:overflow-y-auto overflow-visible p-6 space-y-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#2d2d2d_1px,transparent_1px)] [background-size:16px_16px] scrapbook-scrollbar">
                      <p className="text-base text-[var(--text-main)] font-handwrite text-xl md:text-2xl italic leading-relaxed whitespace-pre-wrap">
                        {selectedJournal.description}
                      </p>
                      
                      {selectedJournal.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--wood-oak)]/10">
                          {selectedJournal.tags.map((tag) => (
                            <span key={tag} className="text-[9px] px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold border border-[var(--primary)]/20">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* SINGLE COLUMN: Notebook page when no image exists */
                <div className="flex flex-col flex-1 md:max-h-[92vh] md:overflow-hidden">
                  <div className="p-6 pb-4 border-b border-[var(--wood-oak)]/10 flex-shrink-0 pr-24">
                    <h3 className="text-xl font-serif font-bold text-[var(--text-main)] leading-tight">{cleanTitle(selectedJournal.title, "journal")}</h3>
                    
                    {/* Decorative Post-it Stamps */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className="text-[10px] px-2.5 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-[var(--text-secondary)] font-mono flex items-center gap-1 border border-stone-200/50 dark:border-stone-700/50 shadow-3xs">
                        <Calendar className="w-3.5 h-3.5 text-rose-400" />
                        {new Date(selectedJournal.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                      <span className="text-[10px] px-2.5 py-1 rounded-md bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1 border border-amber-200/40 dark:border-amber-900/30 shadow-3xs">
                        <span>{WEATHER_ICONS[selectedJournal.weather] || "☀️"}</span>
                        {selectedJournal.weather}
                      </span>
                      <span className="text-[10px] px-2.5 py-1 rounded-md bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 font-bold flex items-center gap-1 border border-rose-200/40 dark:border-rose-900/30 shadow-3xs">
                        <span>{MOOD_ICONS[selectedJournal.mood] || "💖"}</span>
                        {selectedJournal.mood}
                      </span>
                      {selectedJournal.location && (
                        <span className="text-[10px] px-2.5 py-1 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1 border border-emerald-200/40 dark:border-emerald-900/30 shadow-3xs">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          {selectedJournal.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scrollable parchment paper */}
                  <div className="flex-1 md:overflow-y-auto overflow-visible p-6 space-y-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#2d2d2d_1px,transparent_1px)] [background-size:16px_16px] scrapbook-scrollbar">
                    <p className="text-base text-[var(--text-main)] font-handwrite text-xl md:text-2xl italic leading-relaxed whitespace-pre-wrap">
                      {selectedJournal.description}
                    </p>
                    
                    {selectedJournal.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--wood-oak)]/10">
                        {selectedJournal.tags.map((tag) => (
                          <span key={tag} className="text-[9px] px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold border border-[var(--primary)]/20">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Journal Edit Modal */}
      <AnimatePresence>
        {editingJournal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingJournal(null)} className="absolute inset-0 glass-modal-backdrop z-0" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--fabric-cream)] rounded-3xl shadow-2xl border border-[var(--wood-oak)]/30 w-full max-w-lg z-10 p-6 space-y-4 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--wood-oak)]/15">
                <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5"><Edit2 className="w-4 h-4" /> Edit Diary Entry</h3>
                <button onClick={() => setEditingJournal(null)} className="p-1 hover:bg-gray-150 rounded-full cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <input type="text" value={editJTitle} onChange={(e) => setEditJTitle(e.target.value)} required                    className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-[var(--wood-oak)]/10 text-[var(--text-main)]" />
                <textarea value={editJDesc} onChange={(e) => setEditJDesc(e.target.value)} required rows={4}
                  className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-[var(--wood-oak)]/10 text-[var(--text-main)] resize-none" />
                <div className="grid grid-cols-3 gap-2.5">
                  <select value={editJWeath} onChange={(e) => setEditJWeath(e.target.value)}
                    className="w-full bg-black/5 text-xs px-2 py-1.5 rounded-lg outline-none text-[var(--text-main)]">
                    {WEATHER_OPTIONS.map((w) => <option key={w} value={w}>{WEATHER_ICONS[w]} {w}</option>)}
                  </select>
                  <select value={editJMood} onChange={(e) => setEditJMood(e.target.value)}
                    className="w-full bg-black/5 text-xs px-2 py-1.5 rounded-lg outline-none text-[var(--text-main)]">
                    {MOOD_OPTIONS.map((m) => <option key={m} value={m}>{MOOD_ICONS[m]} {m}</option>)}
                  </select>
                  <input type="text" value={editJLoc} onChange={(e) => setEditJLoc(e.target.value)}
                    className="w-full bg-black/5 text-xs px-2 py-1.5 rounded-lg border border-[var(--wood-oak)]/10 text-[var(--text-main)]" />
                </div>
                <input type="text" value={editJTags} onChange={(e) => setEditJTags(e.target.value)}                    className="w-full bg-black/5 text-xs px-3 py-2 outline-none rounded-lg border border-[var(--wood-oak)]/10 text-[var(--text-main)]" />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-[var(--wood-oak)]/15">
                <button onClick={() => setEditingJournal(null)} className="px-4 py-2 bg-black/5 text-[var(--text-muted)] text-xs font-bold rounded-lg cursor-pointer">Cancel</button>
                <button onClick={handleSaveEditJournal} className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg cursor-pointer">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div>
      {storyContent}
    </div>
  );
}
