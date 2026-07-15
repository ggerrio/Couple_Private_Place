/**
 * PhotoboothSection.tsx — Real-time synchronized photobooth studio
 * Extracted from MemoriesView.tsx for modularity.
 * Preserves 100% of original Firestore sync, camera, strip assembly, etc.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useCouple } from "../../context/CoupleContext";
import { useCamera } from "../../hooks/useCamera";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import {
  Sparkles, Camera, Layers, Palette, Check, RefreshCw,
  Heart, Copy, Timer, Users, Smile, X, Upload, ChevronLeft, ChevronRight,
} from "lucide-react";
import { getDb, uploadToCloudinary } from "../../firebaseClient";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { cn } from "../../lib/utils";
import type { PhotoboothRoom } from "../../types";
import { toast } from "sonner";
import { StickerButton, ScrapbookPage } from "../scrapbook";
import { triggerHaptic } from "../../lib/haptics";

// ─── Constants ──────────────────────────────────────────────────────────

const STRIP_PRESETS = [
  { id: "classic-cream", label: "Classic Cream", swatch: "#faf6ee", frameColor: "#faf6ee", textColor: "#3e372e", accent: "#c8a27d" },
  { id: "blushing-sakura", label: "Blushing Sakura", swatch: "#fdf0f0", frameColor: "#fdf0f0", textColor: "#881337", accent: "#f472b6" },
  { id: "retro-film", label: "Retro Film", swatch: "#252525", frameColor: "#252525", textColor: "#faf6ee", accent: "#dc2626" },
  { id: "kraft-cardboard", label: "Kraft Cardboard", swatch: "#e8d5b8", frameColor: "#e8d5b8", textColor: "#5c4033", accent: "#283618" },
  { id: "sage-garden", label: "Sage Garden", swatch: "#e2e8df", frameColor: "#e2e8df", textColor: "#2d3722", accent: "#bc6c25" },
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

const ROUND_GAP_MS = 1600;
const COUNTDOWN_MS = 3000;

function genRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getCanvasFilter(filterId: string): string {
  switch (filterId) {
    case "vintage": return "sepia(0.35) contrast(0.95) saturate(1.1) brightness(1.02)";
    case "kodak": return "contrast(1.1) saturate(1.3) brightness(1.05) sepia(0.05)";
    case "disposable": return "contrast(1.05) saturate(1.05) brightness(0.98)";
    case "vhs": return "contrast(1.2) brightness(1.1) saturate(0.85) sepia(0.1)";
    case "soft-blur": return "blur(0.5px) saturate(0.95) contrast(0.95)";
    case "warm-tone": return "sepia(0.15) saturate(1.2) hue-rotate(5deg)";
    default: return "none";
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

const Carousel_003 = ({
  images,
  className,
  showPagination = false,
  showNavigation = false,
  loop = true,
  autoplay = false,
  spaceBetween = 0,
}: {
  images: { src: string; alt: string }[];
  className?: string;
  showPagination?: boolean;
  showNavigation?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  spaceBetween?: number;
}) => {
  const css = `
  .Carousal_003 {
    width: 100%;
    height: 380px;
    padding-bottom: 50px !important;
  }
  
  .Carousal_003 .swiper-slide {
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    width: 180px;
    height: 330px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .swiper-pagination-bullet-active {
    background-color: var(--primary) !important;
  }
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: 0.2,
      }}
      className={cn("relative w-full max-w-4xl px-2", className)}
    >
      <style>{css}</style>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <Swiper
          spaceBetween={spaceBetween}
          autoplay={
            autoplay
              ? {
                  delay: 2000,
                  disableOnInteraction: true,
                }
              : false
          }
          effect="coverflow"
          grabCursor={true}
          slidesPerView="auto"
          centeredSlides={true}
          loop={loop}
          coverflowEffect={{
            rotate: 25,
            stretch: 0,
            depth: 120,
            modifier: 1,
            slideShadows: false,
          }}
          pagination={
            showPagination
              ? {
                  clickable: true,
                }
              : false
          }
          navigation={
            showNavigation
              ? {
                  nextEl: ".swiper-button-next-custom",
                  prevEl: ".swiper-button-prev-custom",
                }
              : false
          }
          className="Carousal_003"
          modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
        >
          {images.map((image, index) => (
            <SwiperSlide key={index} className="drop-shadow-md">
              <img
                className="h-full w-full object-contain rounded-lg"
                src={image.src}
                alt={image.alt}
              />
            </SwiperSlide>
          ))}
          {showNavigation && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-20 pointer-events-none">
              <button className="swiper-button-prev-custom w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[var(--primary)] flex items-center justify-center shadow-md cursor-pointer pointer-events-auto active:scale-90 transition-all">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="swiper-button-next-custom w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[var(--primary)] flex items-center justify-center shadow-md cursor-pointer pointer-events-auto active:scale-90 transition-all">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </Swiper>
      </motion.div>
    </motion.div>
  );
};

// ─── PhotoboothSection ──────────────────────────────────────────────────

export default function PhotoboothSection() {
  const { currentUser, userA, userB, memories, addMemory, cloudinaryCloudName, cloudinaryUploadPreset } = useCouple();
  const cam = useCamera();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureAreaRef = useRef<HTMLDivElement | null>(null);

  const [layout, setLayout] = useState<"2-cut" | "4-cut" | "6-cut" | "polaroid">("4-cut");
  const [selectedBg, setSelectedBg] = useState("sakura");
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [selectedStamp, setSelectedStamp] = useState("Our Moment 🌸");
  const [copied, setCopied] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState<PhotoboothRoom | null>(null);
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [countdownVal, setCountdownVal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const capturedRoundRef = useRef(0);
  const transitionLockRef = useRef(0);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: !previewUrl }));
    return () => { window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: true })); };
  }, [previewUrl]);

  const isHost = room?.hostId === currentUser;
  const partnerName = currentUser === "user_a" ? userB.name : userA.name;

  const attachVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && cam.stream) { el.srcObject = cam.stream; el.play().catch(() => {}); }
  }, [cam.stream]);

  useEffect(() => { if (videoRef.current && cam.stream) { videoRef.current.srcObject = cam.stream; videoRef.current.play().catch(() => {}); } }, [cam.stream]);
  useEffect(() => { return () => { cam.stopCamera(); }; }, []);
  useEffect(() => {
    if (!roomCode) return;
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot } = await import("firebase/firestore");
      unsub = onSnapshot(doc(db, "photobooth_rooms", roomCode), (d) => {
        if (d.exists()) setRoom(d.data() as PhotoboothRoom);
        else setRoom(null);
      }, (err) => {
        console.error("[photobooth room listener]", err);
        toast.error("Photobooth sync lost. Check your connection.");
      });
    })();
    return () => { if (unsub) unsub(); };
  }, [roomCode]);
  useEffect(() => { if (!roomCode || room?.state === "waiting" || (room?.state === "countdown" && room.round === 1)) { capturedRoundRef.current = 0; transitionLockRef.current = 0; } }, [roomCode, room?.state, room?.round]);

  const totalRounds = LAYOUTS[layout]?.totalRounds || 4;

  const startWebcam = async () => {
    try { await cam.startCamera(); triggerHaptic("success"); }
    catch { toast.error("Please allow camera permissions or use simulated portraits!"); }
  };

  const stopWebcam = () => { cam.stopCamera(); triggerHaptic("light"); };

  const createRoom = useCallback(async () => {
    try {
      if (!cam.isActive) await cam.startCamera();
      const code = genRoomCode();
      const newRoom: PhotoboothRoom = {
        code, hostId: currentUser, guestId: null, layout, bg: selectedBg, filter: selectedFilter,
        stripPreset: "classic-cream", caption: selectedStamp, state: "waiting", round: 0, totalRounds,
        countdownStartAt: null, photosA: [], photosB: [], createdAt: new Date().toISOString(),
      };
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "photobooth_rooms", code), newRoom);
      setRoomCode(code);
      setSavedUrl(null);
      triggerHaptic("success");
    } catch { toast.error("Please enable camera before starting."); }
  }, [cam, currentUser, layout, selectedBg, selectedFilter, selectedStamp, totalRounds]);

  const joinRoom = useCallback(async () => {
    const code = joinInput.trim().toUpperCase();
    if (!code) return;
    setJoinError("");
    try {
      const db = await getDb();
      const { doc, getDoc, updateDoc } = await import("firebase/firestore");
      const snap = await getDoc(doc(db, "photobooth_rooms", code));
      if (!snap.exists()) { setJoinError("Room not found."); return; }
      const data = snap.data() as PhotoboothRoom;
      if (data.hostId !== currentUser && !data.guestId) await updateDoc(doc(db, "photobooth_rooms", code), { guestId: currentUser });
      else if (data.hostId !== currentUser && data.guestId !== currentUser) { setJoinError("Room is full."); return; }
      if (!cam.isActive) await cam.startCamera();
      setRoomCode(code);
      setSavedUrl(null);
      triggerHaptic("success");
    } catch { setJoinError("Couldn't join room."); }
  }, [joinInput, currentUser, cam]);

  const leaveRoom = useCallback(async () => {
    cam.stopCamera();
    if (room && isHost) {
      try {
        const db = await getDb();
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "photobooth_rooms", roomCode));
      } catch {}
    }
    setRoomCode(""); setRoom(null); setCountdownVal(null); setSavedUrl(null);
    capturedRoundRef.current = 0;
  }, [cam, room, isHost, roomCode]);

  const copyCode = useCallback(() => {
    navigator.clipboard?.writeText(roomCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }, [roomCode]);

  const startSession = useCallback(async () => {
    if (!room || !isHost || !room.guestId) return;
    capturedRoundRef.current = 0;
    const db = await getDb();
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "photobooth_rooms", roomCode), { state: "countdown", round: 1, countdownStartAt: Date.now() + COUNTDOWN_MS, photosA: [], photosB: [] });
    triggerHaptic("success");
  }, [room, isHost, roomCode]);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || video.readyState < 2) {
      const canvas = document.createElement("canvas");
      canvas.width = 360; canvas.height = 360;
      const ctx = canvas.getContext("2d")!;
      const grad = ctx.createLinearGradient(0, 0, 360, 360);
      grad.addColorStop(0, "#fda4af"); grad.addColorStop(1, "#f43f5e");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 360, 360);
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 18px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("📸 Pose Captured!", 180, 175);
      return canvas.toDataURL("image/jpeg", 0.65);
    }
    const canvas = document.createElement("canvas");
    canvas.width = 360; canvas.height = 360;
    const ctx = canvas.getContext("2d")!;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.65);
  }, [currentUser]);

  useEffect(() => {
    if (!room || room.state !== "countdown" || !room.countdownStartAt) { setCountdownVal(null); return; }
    if (capturedRoundRef.current === room.round) return;
    const tick = () => {
      const remaining = room.countdownStartAt! - Date.now();
      if (remaining <= 0) {
        setCountdownVal(0);
        if (capturedRoundRef.current !== room.round) {
          capturedRoundRef.current = room.round;
          const shot = captureFrame();
          if (shot) {
            (async () => {
              let uploadUrl = shot;
              if (cloudinaryCloudName && cloudinaryUploadPreset) {
                try { const res = await fetch(shot); const blob = await res.blob(); uploadUrl = await uploadToCloudinary(blob, `photobooth-${Date.now()}.jpg`, cloudinaryCloudName, cloudinaryUploadPreset); } catch {}
              }
              const field = currentUser === room.hostId ? "photosA" : "photosB";
              const db = await getDb();
              const { doc, updateDoc, arrayUnion } = await import("firebase/firestore");
              await updateDoc(doc(db, "photobooth_rooms", roomCode), { [field]: arrayUnion(uploadUrl) });
            })();
            triggerHaptic("heavy");
          }
        }
        return true;
      }
      setCountdownVal(Math.ceil(remaining / 1000));
      return false;
    };
    if (tick()) return;
    const id = setInterval(() => { if (tick()) clearInterval(id); }, 120);
    return () => clearInterval(id);
  }, [room, roomCode, currentUser, captureFrame, cloudinaryCloudName, cloudinaryUploadPreset]);

  useEffect(() => {
    if (!room || !isHost || room.state !== "countdown") return;
    const gotA = room.photosA.length >= room.round;
    const gotB = room.photosB.length >= room.round;
    if (!gotA || !gotB) return;
    if (transitionLockRef.current === room.round) return;
    transitionLockRef.current = room.round;
    const timer = setTimeout(async () => {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      if (room.round >= room.totalRounds) await updateDoc(doc(db, "photobooth_rooms", roomCode), { state: "editing", countdownStartAt: null });
      else await updateDoc(doc(db, "photobooth_rooms", roomCode), { round: room.round + 1, countdownStartAt: Date.now() + COUNTDOWN_MS });
    }, ROUND_GAP_MS);
    return () => clearTimeout(timer);
  }, [room, isHost, roomCode]);

  const composeAndSave = useCallback(async () => {
    if (!room) return;
    setSaving(true);
    try {
      const preset = STRIP_PRESETS.find((p) => p.id === room.stripPreset) || STRIP_PRESETS[0];
      const CELL = 300, MARGIN = 10, HEADER = 44, FOOTER = 64;
      const { cols: c, rows: r } = LAYOUTS[room.layout];
      const canvas = document.createElement("canvas");
      canvas.width = c * CELL + (c + 1) * MARGIN;
      canvas.height = r * CELL + (r + 1) * MARGIN + HEADER + FOOTER;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = preset.frameColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = preset.accent; ctx.fillRect(0, 0, canvas.width, 6);
      ctx.fillStyle = preset.textColor; ctx.font = "bold 17px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("📸 Our Photobooth", canvas.width / 2, HEADER - 14);
      const merged: string[] = [];
      if (room.layout === "polaroid") { if (room.photosA[0]) merged.push(room.photosA[0]); }
      else { for (let i = 0; i < room.photosA.length; i++) { merged.push(room.photosA[i]); if (room.photosB[i]) merged.push(room.photosB[i]); } }
      for (let i = 0; i < Math.min(merged.length, c * r); i++) {
        const col = i % c, row = Math.floor(i / c);
        const x = MARGIN + col * (CELL + MARGIN);
        const y = HEADER + MARGIN + row * (CELL + MARGIN);
        try { const img = await loadImage(merged[i]); ctx.save(); ctx.filter = getCanvasFilter(room.filter || "natural"); ctx.drawImage(img, x, y, CELL, CELL); ctx.restore(); } catch {}
      }
      const footerY = HEADER + r * (CELL + MARGIN) + MARGIN;
      ctx.fillStyle = preset.textColor; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(room.caption || "Our Special Moment 💖", canvas.width / 2, footerY + 34);
      const blob = await compressToWebP(canvas, 260);
      let imageUrl: string;
      if (cloudinaryCloudName && cloudinaryUploadPreset) imageUrl = await uploadToCloudinary(blob, `photobooth-${Date.now()}.webp`, cloudinaryCloudName, cloudinaryUploadPreset);
      else imageUrl = await new Promise<string>((res) => { const reader = new FileReader(); reader.onload = (e) => res(e.target?.result as string); reader.readAsDataURL(blob); });
      setSavedUrl(imageUrl);
      addMemory({
        type: "photobooth", title: `${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}, Live Photobooth`,
        description: "Capturing our smiles 📸💕", imageUrl, date: new Date().toISOString(), creatorId: currentUser, layout: room.layout as any,
        photosList: merged, bgStyle: room.bg, filterClass: room.filter, showOnTimeline: false,
      });
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "photobooth_rooms", roomCode), { state: "done" });
    } catch { toast.error("Failed to save strip."); }
    finally { setSaving(false); }
  }, [room, roomCode, cloudinaryCloudName, cloudinaryUploadPreset, currentUser, addMemory]);

  const renderStripMockup = () => {
    if (!room) return null;
    const { cols: c, rows: r } = LAYOUTS[room.layout] || LAYOUTS["4-cut"];
    const rowIndexes = Array.from({ length: r }, (_, i) => i);
    const preset = STRIP_PRESETS.find((p) => p.id === (room.stripPreset || "classic-white")) || STRIP_PRESETS[0];
    const filterCss = FILTERS.find((f) => f.id === (room.filter || "natural"))?.css || "";
    return (
      <div className="w-full max-w-xs mx-auto p-3 flex flex-col gap-3 shadow-2xl rounded-sm border border-black/5" style={{ backgroundColor: preset.frameColor }} ref={captureAreaRef} id="photobooth-strip-capture">
        <div className="w-full h-1" style={{ backgroundColor: preset.accent }} />
        <div className="flex flex-col gap-2.5">
          {rowIndexes.map((rowIdx) => {
            const photoA = room.photosA[rowIdx]; const photoB = room.photosB[rowIdx];
            const isActiveRow = (room.state === "countdown" && rowIdx === room.round - 1) || (room.state === "waiting" && rowIdx === 0);
            return (
              <div key={rowIdx} className="grid grid-cols-2 gap-2 aspect-[8/3]">
                <div className="rounded-md overflow-hidden aspect-square bg-black/10 shadow-inner border border-black/5 flex items-center justify-center">
                  {photoA ? <img src={photoA} alt={isHost ? "Your photobooth snapshot" : `${partnerName}'s photobooth snapshot`} className={`w-full h-full object-cover ${filterCss}`} referrerPolicy="no-referrer" loading="lazy" />
                    : isActiveRow && currentUser === room.hostId && cam.isActive ? <video ref={attachVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                    : isActiveRow ? <Sparkles className="w-4 h-4 animate-pulse text-white" />
                    : <Camera className="w-4 h-4 opacity-20 text-[var(--text-muted)]" />}
                </div>
                <div className="rounded-md overflow-hidden aspect-square bg-black/10 shadow-inner border border-black/5 flex items-center justify-center">
                  {photoB ? <img src={photoB} alt={isHost ? `${partnerName}'s photobooth snapshot` : "Your photobooth snapshot"} className={`w-full h-full object-cover ${filterCss}`} referrerPolicy="no-referrer" loading="lazy" />
                    : isActiveRow && currentUser === room.guestId && cam.isActive ? <video ref={attachVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                    : isActiveRow ? <Sparkles className="w-4 h-4 animate-pulse text-white" />
                    : <Camera className="w-4 h-4 opacity-20 text-[var(--text-muted)]" />}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center pt-2.5 pb-1 border-t border-dashed" style={{ borderColor: preset.accent + "50" }}>
          <p className="text-xs font-black tracking-wider" style={{ color: preset.textColor }}>{room.caption || "Our Special Moment 💖"}</p>
          <p className="text-[7px] mt-0.5" style={{ color: preset.textColor + "99" }}>{LAYOUTS[room.layout]?.label} • {new Date(room.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
        </div>
      </div>
    );
  };

  const downloadPrintStrip = async () => {
    const element = captureAreaRef.current;
    if (!element || !room) return;
    try {
      triggerHaptic("success");
      await new Promise((res) => setTimeout(res, 50));
      const canvas = await html2canvas(element, { useCORS: true, allowTaint: true, backgroundColor: null, scale: 3.0, logging: false });
      const link = document.createElement("a"); link.href = canvas.toDataURL("image/png"); link.download = `photobooth_strip_${Date.now()}.png`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch { toast.error("Failed to render strip."); }
  };

  const content = (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-[var(--border-color)]">
        <div>
          <h2 className="text-xl font-serif font-bold text-[var(--text-main)]">Photobooth Studio 📸</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Capture moments together in real-time.</p>
        </div>
        <div className="flex gap-2">
          {cam.isActive ? (
            <StickerButton onClick={stopWebcam} color="coral" size="sm" icon={<Camera className="w-3.5 h-3.5" />}>Close Camera</StickerButton>
          ) : (
            <StickerButton onClick={startWebcam} color="primary" size="sm" icon={<Camera className="w-3.5 h-3.5" />}>Start Camera</StickerButton>
          )}
        </div>
      </div>

      {!room && (
        <>
          <ScrapbookPage compact>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <h4 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5 uppercase tracking-wider"><Heart className="w-4 h-4 text-rose-500 animate-pulse" /> Live Studio</h4>
                <p className="text-[10px] text-[var(--text-muted)]">Create a private room, invite your partner, capture synchronized photobooth moments!</p>
              </div>
              <div className="flex flex-wrap gap-2.5 items-center">
                <StickerButton onClick={createRoom} color="gold" size="sm" icon={<Layers className="w-3.5 h-3.5" />}>Host Room</StickerButton>
                <div className="flex items-center gap-1.5 bg-black/5 p-1 rounded-xl">
                  <input type="text" placeholder="Room code..." value={joinInput} onChange={(e) => setJoinInput(e.target.value)}
                    className="bg-transparent text-xs px-2.5 outline-none font-mono text-[var(--text-main)] uppercase w-28" />
                  <button onClick={joinRoom} className="py-1.5 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer">Join</button>
                </div>
              </div>
            </div>
          </ScrapbookPage>

          {/* History Gallery */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-[var(--border-color)]">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-1.5">
                  🎞️ Photobooth Gallery History
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Flip through our captured photo strip memories.</p>
              </div>
            </div>
            <div className="w-full flex justify-center">
              {(() => {
                const history = memories.filter((m) => m.type === "photobooth" && m.imageUrl);
                if (history.length === 0) {
                  return (
                    <div className="w-full py-12 text-center bg-[var(--fabric-cream)]/20 border border-dashed border-[var(--border-color)] rounded-3xl">
                      <Camera className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto mb-2" />
                      <p className="text-xs text-[var(--text-muted)]">No printed photo strips yet. Start a Live Studio session above!</p>
                    </div>
                  );
                }
                return (
                  <Carousel_003
                    images={history.map((m) => ({ src: m.imageUrl, alt: m.title || "Memory Print" }))}
                    showPagination={true}
                    showNavigation={true}
                    loop={history.length > 2}
                  />
                );
              })()}
            </div>
          </div>
        </>
      )}
      {joinError && <p className="text-xs text-red-500 text-left">{joinError}</p>}
      {cam.error && <p className="text-xs text-red-500 text-left">{cam.error}</p>}

      {room && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[var(--fabric-cream)]/25 p-4 rounded-3xl border border-[var(--wood-oak)]/15 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-[var(--primary)]" />
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Room</p>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-bold font-mono text-[var(--text-main)] tracking-widest">{room.code}</span>
                    <button onClick={copyCode} className="text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer">{copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}</button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${room.guestId ? "bg-green-50 text-green-600 border border-green-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                  {room.guestId ? `${partnerName} Linked 💖` : "Waiting..."}
                </span>
                <button onClick={leaveRoom} className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer">Leave</button>
              </div>
            </div>

            {room.state === "waiting" && isHost && (
              <div className="bg-[var(--fabric-cream)]/25 p-5 rounded-2xl border border-[var(--wood-oak)]/15 space-y-3">
                <h4 className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5"><Layers className="w-4 h-4" /> Layout</h4>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(LAYOUTS).map((lay) => (
                    <button key={lay} onClick={async () => { setLayout(lay as any); const __db = await getDb(); const { doc: __doc, updateDoc: __upd } = await import("firebase/firestore"); await __upd(__doc(__db, "photobooth_rooms", roomCode), { layout: lay }); }}
                      className={`py-2 px-1 text-[10px] font-bold rounded-xl border cursor-pointer ${layout === lay ? "bg-rose-500 text-white border-transparent shadow-md" : "bg-white text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--color-muted)]"}`}>{LAYOUTS[lay].label}</button>
                  ))}
                </div>
              </div>
            )}

            {room.state === "waiting" && (isHost ? (
              <button onClick={startSession} disabled={!room.guestId}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-95 text-white font-bold rounded-2xl text-sm shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                <span>{room.guestId ? "Start Session 📸" : "Waiting for partner..."}</span>
              </button>
            ) : (
              <div className="bg-[var(--fabric-cream)] border border-[var(--wood-oak)]/15 p-6 rounded-2xl text-center space-y-2">
                <RefreshCw className="w-6 h-6 mx-auto text-[var(--primary)] animate-spin" />
                <p className="text-xs font-bold text-[var(--text-main)]">Linked & Ready!</p>
                <p className="text-[10px] text-[var(--text-muted)]">Wait for the host to start...</p>
              </div>
            ))}

            {room.state === "countdown" && (
              <div className="bg-[var(--fabric-cream)]/40 p-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold border border-[var(--wood-oak)]/15 text-[var(--text-main)]">
                <Timer className="w-4 h-4 text-[var(--primary)] animate-pulse" />
                <span>Round {room.round} of {room.totalRounds}!</span>
              </div>
            )}

            {room.state === "editing" && isHost && (
              <div className="space-y-4 pt-1">
                <div className="bg-[var(--fabric-cream)]/25 p-5 rounded-3xl border border-[var(--wood-oak)]/15 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-500"><Camera className="w-4 h-4 inline" /> Frame Preset</span>
                  <div className="flex gap-2 flex-wrap">
                    {STRIP_PRESETS.map((p) => (
                      <button key={p.id} onClick={async () => { const __db = await getDb(); const { doc: __doc, updateDoc: __upd } = await import("firebase/firestore"); await __upd(__doc(__db, "photobooth_rooms", roomCode), { stripPreset: p.id }); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${room.stripPreset === p.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"}`}>
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: p.swatch }} /> {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-[var(--fabric-cream)]/25 p-5 rounded-3xl border border-[var(--wood-oak)]/15 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-500"><Palette className="w-4 h-4 inline" /> Filter</span>
                  <div className="flex gap-2 flex-wrap">
                    {FILTERS.map((f) => (
                      <button key={f.id} onClick={async () => { const __db = await getDb(); const { doc: __doc, updateDoc: __upd } = await import("firebase/firestore"); await __upd(__doc(__db, "photobooth_rooms", roomCode), { filter: f.id }); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${room.filter === f.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"}`}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <div className="bg-[var(--fabric-cream)]/25 p-5 rounded-3xl border border-[var(--wood-oak)]/15 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-500"><Smile className="w-4 h-4 inline" /> Caption</span>                    <input value={room.caption || ""} onChange={async (e) => { const __db = await getDb(); const { doc: __doc, updateDoc: __upd } = await import("firebase/firestore"); await __upd(__doc(__db, "photobooth_rooms", roomCode), { caption: e.target.value }); }}
                    placeholder="Your caption..." maxLength={26}
                    className="w-full text-xs px-3.5 py-2.5 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)]" />
                </div>
                <button onClick={composeAndSave} disabled={saving}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-95 text-white font-bold rounded-2xl text-sm shadow-lg disabled:opacity-50 cursor-pointer">
                  {saving ? "Assembling..." : "Save to Library"}
                </button>
              </div>
            )}

            {room.state === "editing" && !isHost && (
              <div className="bg-[var(--fabric-cream)]/25 p-6 rounded-2xl text-center space-y-3 border border-[var(--wood-oak)]/15">
                <Sparkles className="w-6 h-6 mx-auto text-rose-500 animate-pulse" />
                <p className="text-xs font-bold text-[var(--text-main)]">{partnerName} is styling the strip!</p>
              </div>
            )}

            {room.state === "done" && (
              <div className="space-y-3">
                {savedUrl && <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center text-xs text-green-700 font-semibold">🎉 Saved to Memory Library!</div>}
                <button onClick={leaveRoom} className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--primary)] border border-dashed border-[var(--border-color)] rounded-2xl hover:bg-white/40 cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" /> New Session
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative overflow-hidden rounded-3xl p-4 bg-black/5 border border-[var(--border-color)] w-full flex justify-center">
              {renderStripMockup()}
              <AnimatePresence>
                {countdownVal !== null && countdownVal > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs rounded-3xl z-30">
                    <motion.span key={countdownVal} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }}
                      className="text-8xl font-black text-white drop-shadow-2xl">{countdownVal}</motion.span>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {room.state === "done" && savedUrl && (
              <button onClick={downloadPrintStrip}
                className="mt-4 py-2.5 px-5 bg-[var(--primary)] text-white font-bold rounded-xl text-xs cursor-pointer">
                Download Strip 🖼️
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`.mirror { transform: scaleX(-1); }`}</style>
    </div>
  );

  return (
    <div>
      {content}
    </div>
  );
}
