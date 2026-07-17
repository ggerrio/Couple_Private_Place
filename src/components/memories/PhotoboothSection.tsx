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
  Heart, Copy, Timer, Users, Smile, X, Upload, ChevronLeft, ChevronRight, Download,
  ZoomIn, ZoomOut, Maximize2, Calendar,
} from "lucide-react";
import { getDb, uploadToCloudinary } from "../../firebaseClient";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { cn } from "../../lib/utils";
import type { PhotoboothRoom, Memory } from "../../types";
import { toast } from "sonner";
import { StickerButton, ScrapbookPage } from "../scrapbook";
import { triggerHaptic } from "../../lib/haptics";

// ─── Constants ──────────────────────────────────────────────────────────

const STRIP_PRESETS = [
  { id: "classic-cream", label: "Classic Cream 🥛", swatch: "#faf6ee", frameColor: "#faf6ee", textColor: "#3e372e", accent: "#c8a27d", styleType: "classic" },
  { id: "blushing-sakura", label: "Blushing Sakura 🌸", swatch: "#fdf0f0", frameColor: "#fdf0f0", textColor: "#881337", accent: "#f472b6", styleType: "sakura" },
  { id: "retro-film", label: "Retro Film Reel 🎞️", swatch: "#18181b", frameColor: "#18181b", textColor: "#f4f4f5", accent: "#ef4444", styleType: "retro" },
  { id: "kraft-cardboard", label: "Cozy Kraft Tape 📦", swatch: "#e8d5b8", frameColor: "#e8d5b8", textColor: "#5c4033", accent: "#283618", styleType: "kraft" },
  { id: "y2k-cyber", label: "Cyber Neon Y2K 🌌", swatch: "#09090b", frameColor: "#09090b", textColor: "#38bdf8", accent: "#ec4899", styleType: "y2k" },
  { id: "crazy-scrapbook", label: "Crazy Scrapbook 🤪🎨", swatch: "#fffae6", frameColor: "#fffae6", textColor: "#1e293b", accent: "#f43f5e", styleType: "crazy-scrapbook" },
  { id: "scrapbook-cozy", label: "Scrapbook Cozy 📖✨", swatch: "#fdfaf2", frameColor: "#fdfaf2", textColor: "#544238", accent: "#c0a080", styleType: "scrapbook" },
];

const LAYOUTS: Record<string, { cols: number; rows: number; label: string; totalRounds: number }> = {
  "2-cut": { cols: 2, rows: 2, label: "2-Cut Strip", totalRounds: 2 },
  "4-cut": { cols: 2, rows: 4, label: "4-Cut Strip", totalRounds: 4 },
  "6-cut": { cols: 2, rows: 6, label: "6-Cut Strip", totalRounds: 6 },
  polaroid: { cols: 2, rows: 1, label: "Polaroid Duo", totalRounds: 1 },
};

const QUICK_PALETTES = [
  { name: "Vintage Cream 🪵", bg: "#fdfaf2", text: "#544238", border: "#c0a080", description: "Warm cozy notes & kraft borders" },
  { name: "Sakura Blossom 🌸", bg: "#fff0f5", text: "#7c1e3f", border: "#f472b6", description: "Soft blush pinks & cherry blossoms" },
  { name: "Cyberpunk Glow 🌌", bg: "#0f172a", text: "#38bdf8", border: "#ec4899", description: "Deep midnight & electric neon lasers" },
  { name: "Matcha Cream 🍵", bg: "#f0fdf4", text: "#14532d", border: "#86efac", description: "Gentle green tea & smooth cream" },
  { name: "Pumpkin Latte 🎃", bg: "#fff7ed", text: "#7c2d12", border: "#fb923c", description: "Warm autumn orange skies & espresso" },
  { name: "Velvet Gothic 🥀", bg: "#1e1b4b", text: "#e0e7ff", border: "#ef4444", description: "Royal purple & rich crimson velvet" },
];

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
  onSlideClick,
}: {
  images: { src: string; alt: string }[];
  className?: string;
  showPagination?: boolean;
  showNavigation?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  spaceBetween?: number;
  onSlideClick?: (index: number) => void;
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
    width: 220px;
    height: 330px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
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
          preventClicks={true}
          preventClicksPropagation={true}
          touchStartPreventDefault={false}
          coverflowEffect={{
            rotate: 35,
            stretch: 0,
            depth: 110,
            modifier: 1,
            slideShadows: true,
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
            <SwiperSlide
              key={index}
              className="drop-shadow-md select-none"
              onClick={() => {
                if (!onSlideClick) return;
                triggerHaptic("light");
                onSlideClick(index);
              }}
            >
              <img
                className="h-full w-full object-contain rounded-lg pointer-events-none"
                src={image.src}
                alt={image.alt}
                draggable={false}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
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

// ─── LiveCameraCanvas ──────────────────────────────────────────────────
const LiveCameraCanvas = ({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement | null> }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let active = true;
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      if (!active) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const size = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        
        if (canvas.width !== 300) {
          canvas.width = 300;
          canvas.height = 300;
        }
        
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);
      } else {
        if (canvas.width !== 300) {
          canvas.width = 300;
          canvas.height = 300;
        }
        ctx.clearRect(0, 0, 300, 300);
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(0, 0, 300, 300);
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameId);
    };
  }, [videoRef]);

  return <canvas ref={canvasRef} className="w-full h-full object-cover mirror" />;
};

// ─── PhotoboothSection ──────────────────────────────────────────────────

export default function PhotoboothSection() {
  const { currentUser, userA, userB, memories, addMemory, updateMemory, deleteMemory, cloudinaryCloudName, cloudinaryUploadPreset } = useCouple();
  const cam = useCamera();
  const persistentVideoRef = useRef<HTMLVideoElement | null>(null);
  const captureAreaRef = useRef<HTMLDivElement | null>(null);

  // Gallery popup (zoom + add-to-timeline + download)
  const [galleryPopupMemory, setGalleryPopupMemory] = useState<Memory | null>(null);
  const [galleryZoom, setGalleryZoom] = useState(1); // 1 = fit; 1.5 / 2 / 2.5 / 3 = zoomed
  const [galleryAddingToTimeline, setGalleryAddingToTimeline] = useState(false);

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
  const [exporting, setExporting] = useState(false);
  const [cloudinaryHighResUrl, setCloudinaryHighResUrl] = useState<string | null>(null);
  const capturedRoundRef = useRef(0);
  const transitionLockRef = useRef(0);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: !previewUrl && !galleryPopupMemory }));
    return () => { window.dispatchEvent(new CustomEvent("toggleNavbar", { detail: true })); };
  }, [previewUrl, galleryPopupMemory]);

  const isHost = room?.hostId === currentUser;
  const partnerName = currentUser === "user_a" ? userB.name : userA.name;

  // Sync camera stream to persistent video element
  useEffect(() => {
    const video = persistentVideoRef.current;
    if (video) {
      if (cam.stream) {
        video.srcObject = cam.stream;
        video.play().catch((err) => {
          console.warn("Persistent video play failed:", err);
        });
      } else {
        video.srcObject = null;
      }
    }
  }, [cam.stream]);

  // Robust camera reconnection observer
  const reconnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!cam.isActive || !cam.stream) {
      reconnectAttemptsRef.current = 0;
      return;
    }

    const handleTrackEnded = () => {
      if (reconnectingRef.current) return;
      
      console.warn("Camera video track ended unexpectedly. Attempting clean reconnection...");
      
      if (reconnectAttemptsRef.current >= 3) {
        toast.error("Camera connection lost repeatedly. Please check your camera device settings.", { id: "camera-reconnect" });
        cam.stopCamera();
        return;
      }

      reconnectingRef.current = true;
      reconnectAttemptsRef.current += 1;

      toast.warning(`Camera disconnected! Attempting to reconnect (Attempt ${reconnectAttemptsRef.current}/3)...`, {
        id: "camera-reconnect",
        duration: 4000
      });

      // Clean stop first
      cam.stopCamera();

      // Delay then attempt clean start
      setTimeout(async () => {
        try {
          await cam.startCamera();
          toast.success("Camera reconnected successfully! 📸", { id: "camera-reconnect" });
        } catch (err: any) {
          console.error("Camera reconnection failed:", err);
          toast.error("Automatic camera reconnection failed.", { id: "camera-reconnect" });
        } finally {
          reconnectingRef.current = false;
        }
      }, 1500);
    };

    const tracks = cam.stream.getVideoTracks();
    tracks.forEach((track) => {
      track.addEventListener("ended", handleTrackEnded);
    });

    // Periodically check if camera stream gets frozen or inactive (e.g., if camera fails but ended is not fired)
    const checkInterval = setInterval(() => {
      if (cam.isActive && cam.stream) {
        const activeTracks = cam.stream.getTracks().filter(t => t.readyState === "live");
        if (activeTracks.length === 0 && !reconnectingRef.current) {
          console.warn("No active camera tracks detected! Reconnecting...");
          handleTrackEnded();
        }
      }
    }, 2500);

    return () => {
      tracks.forEach((track) => {
        track.removeEventListener("ended", handleTrackEnded);
      });
      clearInterval(checkInterval);
    };
  }, [cam.isActive, cam.stream, cam.stopCamera, cam.startCamera]);

  useEffect(() => {
    return () => {
      cam.stopCamera();
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

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

  useEffect(() => {
    if (!roomCode || room?.state === "waiting" || (room?.state === "countdown" && room.round === 1)) {
      capturedRoundRef.current = 0;
      transitionLockRef.current = 0;
    }
  }, [roomCode, room?.state, room?.round]);

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

  // Update the room doc + sync the local `room` state synchronously so the
  // next composeAndSave() call (when the user clicks Save) reads the freshest
  // values, not whatever Firestore happens to have at the moment. Without this,
  // rapid edits followed by an immediate Save can race the listener and produce
  // a saved strip that doesn't match the editing preview.
  const updateRoom = useCallback(async (updates: Partial<PhotoboothRoom>) => {
    setRoom((prev) => (prev ? { ...prev, ...updates } : prev));
    try {
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "photobooth_rooms", roomCode), updates);
    } catch (err) {
      console.error("[updateRoom]", err);
    }
  }, [roomCode]);

  // Debounced editor helper for continuous `onChange` inputs (color pickers,
  // caption text). Mutates local React state IMMEDIATELY so the next Save
  // click reads fresh values via composeAndSave — defers the Firestore write
  // so a 60Hz color picker drag doesn't hammer the DB quota.
  //
  // Note on the 400ms race window: if Save is clicked within 400ms of the
  // last edit, the pending Firestore write is dropped (next call clears it,
  // or the cleanup useEffect cancels it on unmount/roomCode change). That's
  // safe because the saved Memory reads from local `room` in composeAndSave,
  // NOT from Firestore — so the strip design always matches the editing UI
  // regardless of whether the debounced network write has flushed.
  const writeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup pending debounced Firestore write on unmount or roomCode change.
  // Without this, a stale 400ms setTimeout can fire after navigating away
  // and attempt to write to an already-deleted room document.
  useEffect(() => {
    return () => {
      if (writeTimeoutRef.current) {
        clearTimeout(writeTimeoutRef.current);
        writeTimeoutRef.current = null;
      }
    };
  }, [roomCode]);

  const updateRoomDebounced = useCallback((updates: Partial<PhotoboothRoom>) => {
    setRoom((prev) => (prev ? { ...prev, ...updates } : prev));
    if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current);
    writeTimeoutRef.current = setTimeout(async () => {
      try {
        const db = await getDb();
        const { doc, updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "photobooth_rooms", roomCode), updates);
      } catch (err) {
        console.error("[updateRoomDebounced]", err);
      }
    }, 400);
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
    const video = persistentVideoRef.current;
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
  }, []);

  const roomState = room?.state;
  const roomRound = room?.round;
  const countdownStartAt = room?.countdownStartAt;
  const roomHostId = room?.hostId;

  useEffect(() => {
    if (roomState !== "countdown" || !countdownStartAt) { setCountdownVal(null); return; }
    if (capturedRoundRef.current === roomRound) return;
    
    const tick = () => {
      const remaining = countdownStartAt - Date.now();
      if (remaining <= 0) {
        setCountdownVal(0);
        if (capturedRoundRef.current !== roomRound) {
          capturedRoundRef.current = roomRound;
          const shot = captureFrame();
          if (shot) {
            (async () => {
              let uploadUrl = shot;
              if (cloudinaryCloudName && cloudinaryUploadPreset) {
                try { const res = await fetch(shot); const blob = await res.blob(); uploadUrl = await uploadToCloudinary(blob, `photobooth-${Date.now()}.jpg`, cloudinaryCloudName, cloudinaryUploadPreset); } catch {}
              }
              const field = currentUser === roomHostId ? "photosA" : "photosB";
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
  }, [roomState, roomRound, countdownStartAt, roomHostId, roomCode, currentUser, captureFrame, cloudinaryCloudName, cloudinaryUploadPreset]);

  // Handle host-side next round transitions
  useEffect(() => {
    if (!room || !isHost || room.state !== "countdown") {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
      return;
    }
    const gotA = room.photosA.length >= room.round;
    const gotB = room.photosB.length >= room.round;
    if (!gotA || !gotB) return;
    
    if (transitionLockRef.current === room.round) return;
    transitionLockRef.current = room.round;
    
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    
    transitionTimerRef.current = setTimeout(async () => {
      try {
        const db = await getDb();
        const { doc, updateDoc } = await import("firebase/firestore");
        if (room.round >= room.totalRounds) {
          await updateDoc(doc(db, "photobooth_rooms", roomCode), { state: "editing", countdownStartAt: null });
        } else {
          await updateDoc(doc(db, "photobooth_rooms", roomCode), { round: room.round + 1, countdownStartAt: Date.now() + COUNTDOWN_MS });
        }
      } catch (err) {
        console.error("Transition to next round failed:", err);
      }
    }, ROUND_GAP_MS);
  }, [room?.round, room?.state, room?.photosA?.length, room?.photosB?.length, isHost, roomCode, room?.totalRounds]);

  const composeAndSave = useCallback(async () => {
    if (!room) return;
    setSaving(true);
    try {
      const preset = STRIP_PRESETS.find((p) => p.id === room.stripPreset) || STRIP_PRESETS[0];
      const frameColor = room.customFrameColor || preset.frameColor;
      const textColor = room.customTextColor || preset.textColor;
      const accent = room.customAccentColor || preset.accent;

      const CELL = 300, MARGIN = 10, HEADER = 44, FOOTER = 64;
      const { cols: c, rows: r } = LAYOUTS[room.layout];
      const canvas = document.createElement("canvas");
      canvas.width = c * CELL + (c + 1) * MARGIN;
      canvas.height = r * CELL + (r + 1) * MARGIN + HEADER + FOOTER;
      const ctx = canvas.getContext("2d")!;
      
      // Draw background color
      ctx.fillStyle = frameColor; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw scrapbook grid if crazy-scrapbook theme
      if (preset.styleType === "crazy-scrapbook") {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.03)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 15) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 15) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
      }

      // Draw paper texture if scrapbook theme preset
      if (preset.styleType === "scrapbook") {
        // Speckled paper texture dots (underruled)
        ctx.fillStyle = "rgba(139, 115, 85, 0.06)";
        for (let j = 0; j < 1200; j++) {
          const px = Math.random() * canvas.width;
          const py = Math.random() * canvas.height;
          const pSize = Math.random() * 1.5 + 0.3;
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Subtle gridded / lined notepad pattern
        ctx.strokeStyle = "rgba(139, 92, 26, 0.07)";
        ctx.lineWidth = 1;
        // Draw horizontal faint rules
        for (let y = 40; y < canvas.height; y += 22) {
          ctx.beginPath();
          ctx.moveTo(10, y);
          ctx.lineTo(canvas.width - 10, y);
          ctx.stroke();
        }
        // Faint margin line on the left side
        ctx.strokeStyle = "rgba(220, 80, 80, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.lineTo(35, canvas.height);
        ctx.stroke();
      }

      // Draw spiral binder loops on the left edge if crazy-scrapbook theme
      if (preset.styleType === "crazy-scrapbook") {
        const count = 12;
        for (let i = 0; i < count; i++) {
          const y = 30 + (i * (canvas.height - 60)) / (count - 1);
          // Ring hole
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.arc(8, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Shiny reflex
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.beginPath();
          ctx.arc(6, y - 1, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Metal loop clip
          ctx.strokeStyle = "rgba(148, 163, 184, 0.95)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(3, y, 6, -Math.PI / 2, Math.PI / 2);
          ctx.stroke();
        }
      }

      // Draw header accent line
      ctx.fillStyle = accent; 
      ctx.fillRect(0, 0, canvas.width, 6);

      // Add a header label
      ctx.fillStyle = textColor; 
      ctx.font = "bold 17px sans-serif"; 
      ctx.textAlign = "center";
      ctx.fillText("📸 Our Photobooth", canvas.width / 2, HEADER - 14);

      const merged: string[] = [];
      if (room.layout === "polaroid") { 
        if (room.photosA[0]) merged.push(room.photosA[0]); 
      } else { 
        for (let i = 0; i < room.photosA.length; i++) { 
          merged.push(room.photosA[i]); 
          if (room.photosB[i]) merged.push(room.photosB[i]); 
        } 
      }

      // Render photo cells
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

          // Washi tape drawing overlay
          if (preset.styleType === "crazy-scrapbook") {
            ctx.save();
            ctx.translate(x, y);
            if (row % 2 === 0) {
              // Row 0/2 left: top-left yellow tape
              ctx.rotate(-15 * Math.PI / 180);
              ctx.fillStyle = "rgba(253, 224, 71, 0.65)";
              ctx.fillRect(-15, -10, 80, 24);
              ctx.strokeStyle = "rgba(234, 179, 8, 0.3)";
              ctx.strokeRect(-15, -10, 80, 24);
            } else {
              // Row 1/3 right: top-right pink tape
              ctx.translate(CELL, 0);
              ctx.rotate(12 * Math.PI / 180);
              ctx.fillStyle = "rgba(244, 114, 182, 0.65)";
              ctx.fillRect(-65, -10, 80, 24);
              ctx.strokeStyle = "rgba(219, 39, 119, 0.3)";
              ctx.strokeRect(-65, -10, 80, 24);
            }
            ctx.restore();

            ctx.save();
            ctx.translate(x, y);
            if (row % 2 === 0) {
              // Row 0/2 right: bottom-right teal tape
              ctx.translate(CELL, CELL);
              ctx.rotate(10 * Math.PI / 180);
              ctx.fillStyle = "rgba(45, 212, 191, 0.65)";
              ctx.fillRect(-65, -12, 75, 20);
            } else {
              // Row 1/3 left: bottom-left purple tape
              ctx.rotate(-8 * Math.PI / 180);
              ctx.fillStyle = "rgba(192, 132, 252, 0.65)";
              ctx.fillRect(-10, -10, 75, 22);
            }
            ctx.restore();
          } else if (preset.styleType === "kraft") {
            ctx.save();
            ctx.translate(x, y);
            if (row % 2 === 0) {
              ctx.rotate(-12 * Math.PI / 180);
              ctx.fillStyle = "rgba(203, 178, 139, 0.85)";
              ctx.fillRect(-10, -10, 65, 20);
            } else {
              ctx.translate(CELL, 0);
              ctx.rotate(10 * Math.PI / 180);
              ctx.fillStyle = "rgba(203, 178, 139, 0.85)";
              ctx.fillRect(-55, -10, 65, 20);
            }
            ctx.restore();
          } else if (preset.styleType === "scrapbook") {
            // Draw colorful washi tape strips at the corners of each photo cell
            // Top Left corner tape
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-18 * Math.PI / 180);
            ctx.fillStyle = "rgba(230, 200, 160, 0.75)"; // warm pastel beige tape
            ctx.fillRect(-15, -10, 55, 16);
            ctx.strokeStyle = "rgba(120, 90, 60, 0.2)";
            ctx.strokeRect(-15, -10, 55, 16);
            ctx.restore();

            // Top Right corner tape
            ctx.save();
            ctx.translate(x + CELL, y);
            ctx.rotate(22 * Math.PI / 180);
            ctx.fillStyle = "rgba(165, 195, 165, 0.75)"; // soft sage green tape
            ctx.fillRect(-40, -10, 55, 16);
            ctx.strokeStyle = "rgba(80, 110, 80, 0.2)";
            ctx.strokeRect(-40, -10, 55, 16);
            ctx.restore();

            // Bottom Left corner tape
            ctx.save();
            ctx.translate(x, y + CELL);
            ctx.rotate(15 * Math.PI / 180);
            ctx.fillStyle = "rgba(185, 165, 195, 0.7)"; // light lavender tape
            ctx.fillRect(-15, -6, 50, 14);
            ctx.restore();

            // Bottom Right corner tape
            ctx.save();
            ctx.translate(x + CELL, y + CELL);
            ctx.rotate(-12 * Math.PI / 180);
            ctx.fillStyle = "rgba(225, 160, 160, 0.75)"; // dusty rose tape
            ctx.fillRect(-40, -8, 50, 14);
            ctx.restore();
          }
        } catch (err) {
          console.warn("Failed to load and draw photo on canvas:", err);
        }
      }

      // Draw Theme Stickers on the outer strip backing
      ctx.save();
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (preset.styleType === "sakura") {
        ctx.fillText("🌸", canvas.width - 30, 45);
        ctx.fillText("🌸", 35, canvas.height * 0.35);
        ctx.fillText("🌸", canvas.width - 45, canvas.height - 110);
        ctx.fillText("💕", 40, canvas.height - 60);
      } else if (preset.styleType === "kraft") {
        ctx.fillText("🌿", canvas.width - 30, 60);
        ctx.fillText("🪵", 30, canvas.height - 90);
        
        ctx.save();
        ctx.translate(canvas.width - 50, canvas.height / 2);
        ctx.rotate(6 * Math.PI / 180);
        ctx.fillStyle = "#cfb590";
        ctx.fillRect(-45, -12, 90, 24);
        ctx.strokeStyle = "#5c4033";
        ctx.lineWidth = 1;
        ctx.strokeRect(-45, -12, 90, 24);
        ctx.fillStyle = "#5c4033";
        ctx.font = "bold 11px Courier New";
        ctx.fillText("MEMORIES", 0, 0);
        ctx.restore();
      } else if (preset.styleType === "y2k") {
        ctx.fillText("⚡", canvas.width - 25, 45);
        ctx.fillText("👾", 25, canvas.height * 0.5);
        ctx.fillText("✨", canvas.width - 30, canvas.height - 90);

        ctx.save();
        ctx.translate(35, canvas.height - 40);
        ctx.rotate(-8 * Math.PI / 180);
        ctx.fillStyle = "#ec4899";
        ctx.fillRect(-30, -10, 60, 20);
        ctx.fillStyle = "#000000";
        ctx.font = "bold 10px monospace";
        ctx.fillText("ONLINE", 0, 0);
        ctx.restore();
      } else if (preset.styleType === "crazy-scrapbook") {
        ctx.fillText("🧸", canvas.width - 30, 80);
        ctx.fillText("🍀", 30, canvas.height * 0.35);
        ctx.fillText("🎀", canvas.width - 25, canvas.height * 0.65);
        ctx.fillText("🍕", 25, canvas.height - 100);
        ctx.fillText("🌟", canvas.width - 35, canvas.height - 30);

        // Yellow BADGE
        ctx.save();
        ctx.translate(canvas.width - 45, canvas.height - 100);
        ctx.rotate(12 * Math.PI / 180);
        ctx.fillStyle = "#fde047";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-45, -12, 90, 24, 12);
        else ctx.rect(-45, -12, 90, 24);
        ctx.fill();
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("GILA SCRAP!", 0, 0);
        ctx.restore();

        // Red BADGE
        ctx.save();
        ctx.translate(40, 100);
        ctx.rotate(-8 * Math.PI / 180);
        ctx.fillStyle = "#f43f5e";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-30, -12, 60, 24, 12);
        else ctx.rect(-30, -12, 60, 24);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("US 💖", 0, 0);
        ctx.restore();
      } else if (preset.styleType === "scrapbook") {
        ctx.fillText("🌿", canvas.width - 25, 55);
        ctx.fillText("✨", 30, canvas.height * 0.4);
        ctx.fillText("📖", canvas.width - 30, canvas.height * 0.7);
        ctx.fillText("🤎", 30, canvas.height - 110);

        // Circular Vintage Hand-written date stamp!
        ctx.save();
        ctx.translate(canvas.width - 55, canvas.height - 50);
        ctx.rotate(-15 * Math.PI / 180);
        
        ctx.strokeStyle = "rgba(184, 50, 50, 0.75)";
        ctx.lineWidth = 1.5;
        
        // Double ring circular postmark stamp
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, 23, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(184, 50, 50, 0.75)";
        ctx.font = "bold 8px Courier New";
        ctx.fillText("LOVED", 0, -10);
        
        // Hand-written date inside the stamp
        ctx.font = "bold 10px 'Caveat', cursive";
        const dateStr = new Date(room.createdAt || Date.now()).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit"
        });
        ctx.fillText(dateStr, 0, 3);
        
        ctx.font = "6px Courier New";
        ctx.fillText("★ STUDIO ★", 0, 11);
        ctx.restore();

        // Rectangular vintage stamp on the left
        ctx.save();
        ctx.translate(45, 120);
        ctx.rotate(8 * Math.PI / 180);
        ctx.strokeStyle = "rgba(50, 100, 180, 0.75)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-28, -12, 56, 24);
        ctx.fillStyle = "rgba(50, 100, 180, 0.75)";
        ctx.font = "7px Courier New";
        ctx.fillText("SWEETEST", 0, -3);
        ctx.fillText("MEMORIES", 0, 5);
        ctx.restore();
      }
      ctx.restore();

      // Draw bottom caption
      const footerY = HEADER + r * (CELL + MARGIN) + MARGIN;
      
      let fontStr = "bold 14px sans-serif";
      if (preset.styleType === "crazy-scrapbook" || preset.styleType === "sakura" || preset.styleType === "scrapbook") {
        fontStr = "bold 20px 'Caveat', cursive";
      } else if (preset.styleType === "y2k") {
        fontStr = "bold 12px monospace";
      } else if (preset.styleType === "kraft") {
        fontStr = "bold 14px 'Courier New', monospace";
      }

      ctx.fillStyle = textColor; 
      ctx.font = fontStr; 
      ctx.textAlign = "center";
      ctx.fillText(room.caption || "Our Special Moment 💖", canvas.width / 2, footerY + 34);

      // Subtitle
      ctx.fillStyle = textColor + "99";
      ctx.font = preset.styleType === "y2k" ? "9px monospace" : "10px sans-serif";
      ctx.fillText(
        `${LAYOUTS[room.layout]?.label} • ${new Date(room.createdAt || Date.now()).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}`, 
        canvas.width / 2, 
        footerY + 50
      );

      const blob = await compressToWebP(canvas, 260);
      let imageUrl: string;
      if (cloudinaryCloudName && cloudinaryUploadPreset) {
        imageUrl = await uploadToCloudinary(blob, `photobooth-${Date.now()}.webp`, cloudinaryCloudName, cloudinaryUploadPreset);
      } else {
        imageUrl = await new Promise<string>((res) => { 
          const reader = new FileReader(); 
          reader.onload = (e) => res(e.target?.result as string); 
          reader.readAsDataURL(blob); 
        });
      }
      setSavedUrl(imageUrl);
      addMemory({
        type: "photobooth", title: `${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}, Live Photobooth`,
        description: room.caption || "Capturing our smiles 📸💕", imageUrl, date: new Date().toISOString(), creatorId: currentUser, layout: room.layout as any,
        photosList: merged, bgStyle: room.bg, filterClass: room.filter, showOnTimeline: false,
        stripPreset: room.stripPreset, customFrameColor: room.customFrameColor, customTextColor: room.customTextColor, customAccentColor: room.customAccentColor, caption: room.caption,
      });
      const db = await getDb();
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "photobooth_rooms", roomCode), { state: "done" });
    } catch (err) { 
      console.error(err);
      toast.error("Failed to save strip."); 
    } finally { 
      setSaving(false); 
    }
  }, [room, roomCode, cloudinaryCloudName, cloudinaryUploadPreset, currentUser, addMemory]);

  const renderStripMockup = () => {
    if (!room) return null;
    const { cols: c, rows: r } = LAYOUTS[room.layout] || LAYOUTS["4-cut"];
    const rowIndexes = Array.from({ length: r }, (_, i) => i);
    const preset = STRIP_PRESETS.find((p) => p.id === (room.stripPreset || "classic-cream")) || STRIP_PRESETS[0];
    const frameColor = room.customFrameColor || preset.frameColor;
    const textColor = room.customTextColor || preset.textColor;
    const accent = room.customAccentColor || preset.accent;
    const filterCss = FILTERS.find((f) => f.id === (room.filter || "natural"))?.css || "";

    // Decide fonts
    let fontClass = "font-sans font-black";
    if (preset.styleType === "crazy-scrapbook" || preset.styleType === "sakura" || preset.styleType === "scrapbook") {
      fontClass = "font-handwrite text-lg font-bold leading-none";
    } else if (preset.styleType === "kraft") {
      fontClass = "font-mono text-sm font-bold";
    } else if (preset.styleType === "y2k") {
      fontClass = "font-mono text-xs uppercase tracking-tighter";
    }

    return (
      <div 
        className="relative w-full max-w-xs mx-auto p-4 flex flex-col gap-3.5 shadow-2xl rounded-sm border border-black/5 transition-all duration-300 overflow-hidden" 
        style={{ 
          backgroundColor: frameColor,
          "--strip-bg": frameColor,
          "--strip-border": accent,
          "--strip-text": textColor,
          // Draw grid or line patterns based on theme using CSS custom properties
          backgroundImage: preset.styleType === "crazy-scrapbook" 
            ? "radial-gradient(circle, rgba(0,0,0,0.035) 1px, transparent 1px)" 
            : preset.styleType === "scrapbook"
            ? "linear-gradient(rgba(139, 92, 26, 0.05) 1px, transparent 1px)"
            : undefined,
          backgroundSize: preset.styleType === "crazy-scrapbook" 
            ? "14px 14px" 
            : preset.styleType === "scrapbook"
            ? "100% 22px"
            : undefined
        } as React.CSSProperties} 
        ref={captureAreaRef} 
        id="photobooth-strip-capture"
      >
        {/* Notebook paper vertical margin line for scrapbook */}
        {preset.styleType === "scrapbook" && (
          <div className="absolute left-8 top-0 bottom-0 w-[1.5px] bg-red-400/20 pointer-events-none z-10" />
        )}
        {/* Notebook spiral rings on the left for Crazy Scrapbook */}
        {preset.styleType === "crazy-scrapbook" && (
          <div className="absolute -left-1 top-6 bottom-6 flex flex-col justify-between py-4 pointer-events-none z-20">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/50 shadow-inner flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                </div>
                <div className="w-3.5 h-1.5 bg-gradient-to-r from-zinc-300 to-zinc-500 rounded-md -ml-1 border-t border-white/50 shadow-xs" style={{ transform: "rotate(-10deg)" }} />
              </div>
            ))}
          </div>
        )}

        {/* Floating stickers for each style */}
        {preset.styleType === "sakura" && (
          <>
            <div className="absolute right-2 top-4 text-sm animate-bounce opacity-80 pointer-events-none z-10">🌸</div>
            <div className="absolute left-3 top-1/3 text-xs rotate-12 opacity-70 pointer-events-none z-10">🌸</div>
            <div className="absolute right-4 bottom-16 text-sm rotate-45 opacity-80 pointer-events-none z-10">🌸</div>
            <div className="absolute left-4 bottom-8 text-xs rotate-[-15deg] opacity-70 pointer-events-none z-10">💕</div>
          </>
        )}

        {preset.styleType === "kraft" && (
          <>
            <div className="absolute -right-2 top-8 text-lg opacity-80 pointer-events-none z-10">🌿</div>
            <div className="absolute -left-2 bottom-12 text-lg opacity-80 pointer-events-none z-10">🪵</div>
            <div className="absolute right-3 top-1/2 text-[9px] opacity-75 font-mono pointer-events-none uppercase bg-[#cfb590] text-[#5c4033] px-1.5 py-0.5 rounded shadow-xs rotate-6 z-10 border border-[#5c4033]/20">MEMORIES</div>
          </>
        )}

        {preset.styleType === "y2k" && (
          <>
            <div className="absolute -right-1 top-6 text-sm opacity-90 animate-pulse pointer-events-none z-10">⚡</div>
            <div className="absolute -left-2 top-1/2 text-base opacity-90 pointer-events-none z-10">👾</div>
            <div className="absolute right-2 bottom-12 text-sm opacity-90 pointer-events-none z-10">✨</div>
            <div className="absolute left-2 bottom-4 text-[9px] font-mono bg-pink-500 text-black px-1.5 py-0.5 rounded-sm scale-95 rotate-[-8deg] uppercase tracking-tighter z-10 border border-black shadow-xs">ONLINE</div>
          </>
        )}

        {preset.styleType === "crazy-scrapbook" && (
          <>
            <div className="absolute -right-2 top-10 text-xl rotate-12 pointer-events-none shadow-xs z-10 animate-pulse">🧸</div>
            <div className="absolute -left-1 top-1/3 text-xl rotate-[-15deg] pointer-events-none shadow-xs z-10">🍀</div>
            <div className="absolute right-1 top-2/3 text-lg rotate-12 pointer-events-none shadow-xs z-10">🎀</div>
            <div className="absolute left-1 bottom-10 text-xl rotate-[-10deg] pointer-events-none shadow-xs z-10">🍕</div>
            <div className="absolute right-3 bottom-1 text-sm rotate-[15deg] pointer-events-none shadow-xs z-10">🌟</div>
            <div className="absolute -right-3 bottom-14 text-[9px] bg-yellow-300 text-slate-800 font-extrabold px-2 py-0.5 rounded-full border border-slate-800 shadow-md rotate-[12deg] pointer-events-none select-none uppercase tracking-wider z-10">
              GILA SCRAP!
            </div>
            <div className="absolute -left-3 top-20 text-[9px] bg-rose-500 text-white font-extrabold px-2 py-0.5 rounded-full border border-white shadow-md rotate-[-8deg] pointer-events-none select-none uppercase tracking-wider z-10">
              US 💖
            </div>
          </>
        )}

        {preset.styleType === "scrapbook" && (
          <>
            <div className="absolute right-2 top-10 text-sm opacity-95 pointer-events-none z-10">🌿</div>
            <div className="absolute left-2 top-1/3 text-xs rotate-12 opacity-80 pointer-events-none z-10">✨</div>
            <div className="absolute right-3 top-2/3 text-xs rotate-[-12deg] opacity-80 pointer-events-none z-10">📖</div>
            <div className="absolute left-2.5 bottom-24 text-sm rotate-6 opacity-95 pointer-events-none z-10">🤎</div>
            
            {/* Vintage Double-Ring Ink Stamp */}
            <div className="absolute right-3 bottom-14 flex flex-col items-center justify-center p-1 border border-red-500/50 rounded-full w-11 h-11 rotate-[-12deg] opacity-75 pointer-events-none select-none z-10" style={{ borderStyle: "double", borderWidth: "3px" }}>
              <span className="text-[4px] font-mono font-bold text-red-500 leading-none">LOVED</span>
              <span className="text-[7px] font-handwrite font-bold text-red-600 leading-none my-0.5">
                {new Date(room.createdAt || Date.now()).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" })}
              </span>
              <span className="text-[4px] font-mono text-red-500 leading-none">★ STUDIO ★</span>
            </div>

            {/* Vintage Rectangular Ink Stamp */}
            <div className="absolute left-4 top-24 flex flex-col items-center justify-center px-1 py-0.5 border border-blue-500/50 rounded-sm rotate-[8deg] opacity-70 pointer-events-none select-none z-10">
              <span className="text-[4px] font-mono font-bold text-blue-500 tracking-wider leading-none">SWEETEST</span>
              <span className="text-[4px] font-mono font-bold text-blue-500 tracking-wider leading-none mt-0.5">MEMORIES</span>
            </div>
          </>
        )}

        {/* Top Accent Strip Line */}
        <div className="w-full h-1 rounded-full shrink-0" style={{ backgroundColor: accent }} />
        
        {/* Photos Grid cells */}
        <div className="flex flex-col gap-3">
          {rowIndexes.map((rowIdx) => {
            const photoA = room.photosA[rowIdx]; const photoB = room.photosB[rowIdx];
            const isActiveRow = (room.state === "countdown" && rowIdx === room.round - 1) || (room.state === "waiting" && rowIdx === 0);
            return (
              <div key={rowIdx} className="grid grid-cols-2 gap-3 aspect-[8/3]">
                {/* Photo Cell A (Left Column) */}
                <div className="relative rounded-lg overflow-hidden aspect-square bg-black/10 shadow-inner border border-black/5 flex items-center justify-center transition-all duration-300">
                  {photoA ? <img src={photoA} alt={isHost ? "Your photobooth snapshot" : `${partnerName}'s photobooth snapshot`} className={`w-full h-full object-cover ${filterCss}`} referrerPolicy="no-referrer" crossOrigin="anonymous" loading="lazy" />
                    : isActiveRow && currentUser === room.hostId && cam.isActive ? <LiveCameraCanvas videoRef={persistentVideoRef} />
                    : isActiveRow ? <Sparkles className="w-4 h-4 animate-pulse text-white" />
                    : <Camera className="w-4 h-4 opacity-20 text-[var(--text-muted)]" />}

                  {/* Washi tape overlays */}
                  {preset.styleType === "crazy-scrapbook" && (
                    rowIdx % 2 === 0 ? (
                      <div className="absolute -top-1.5 -left-2 w-8 h-3 bg-yellow-300/80 border-x border-dashed border-yellow-500/20 rotate-[-15deg] pointer-events-none z-10 shadow-xs" />
                    ) : (
                      <div className="absolute -top-1.5 -right-2 w-8 h-3 bg-pink-300/80 border-x border-dashed border-pink-500/20 rotate-[12deg] pointer-events-none z-10 shadow-xs" />
                    )
                  )}
                  {preset.styleType === "kraft" && (
                    rowIdx % 2 === 0 ? (
                      <div className="absolute -top-1.5 -left-1 w-7 h-2.5 bg-[#cbb28b]/90 rotate-[-12deg] border-y border-dashed border-yellow-800/10 pointer-events-none z-10 shadow-xs" />
                    ) : (
                      <div className="absolute -top-1.5 -right-1.5 w-7 h-2.5 bg-[#cbb28b]/90 rotate-[10deg] border-y border-dashed border-yellow-800/10 pointer-events-none z-10 shadow-xs" />
                    )
                  )}
                  {preset.styleType === "scrapbook" && (
                    <>
                      <div className="absolute -top-1.5 -left-2 w-7 h-3 bg-amber-200/75 border-x border-dashed border-amber-500/20 rotate-[-18deg] pointer-events-none z-10 shadow-xs" />
                      <div className="absolute -top-1.5 -right-2 w-7 h-3 bg-green-200/75 border-x border-dashed border-green-500/20 rotate-[22deg] pointer-events-none z-10 shadow-xs" />
                    </>
                  )}
                </div>

                {/* Photo Cell B (Right Column) */}
                <div className="relative rounded-lg overflow-hidden aspect-square bg-black/10 shadow-inner border border-black/5 flex items-center justify-center transition-all duration-300">
                  {photoB ? <img src={photoB} alt={isHost ? `${partnerName}'s photobooth snapshot` : "Your photobooth snapshot"} className={`w-full h-full object-cover ${filterCss}`} referrerPolicy="no-referrer" crossOrigin="anonymous" loading="lazy" />
                    : isActiveRow && currentUser === room.guestId && cam.isActive ? <LiveCameraCanvas videoRef={persistentVideoRef} />
                    : isActiveRow ? <Sparkles className="w-4 h-4 animate-pulse text-white" />
                    : <Camera className="w-4 h-4 opacity-20 text-[var(--text-muted)]" />}

                  {/* Washi tape overlays */}
                  {preset.styleType === "crazy-scrapbook" && (
                    rowIdx % 2 === 0 ? (
                      <div className="absolute -bottom-1 -right-1 w-8 h-2.5 bg-teal-300/80 border-x border-dashed border-teal-500/20 rotate-[10deg] pointer-events-none z-10 shadow-xs" />
                    ) : (
                      <div className="absolute -top-1.5 -left-2 w-8 h-3 bg-purple-300/80 border-x border-dashed border-purple-500/20 rotate-[-8deg] pointer-events-none z-10 shadow-xs" />
                    )
                  )}
                  {preset.styleType === "scrapbook" && (
                    <>
                      <div className="absolute -bottom-1.5 -left-2 w-6 h-2.5 bg-indigo-200/70 rotate-[15deg] pointer-events-none z-10 shadow-xs" />
                      <div className="absolute -bottom-1.5 -right-2 w-6 h-2.5 bg-rose-200/80 rotate-[-12deg] pointer-events-none z-10 shadow-xs" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Area with Caption */}
        <div className="text-center pt-3 pb-1 border-t border-dashed transition-all duration-300" style={{ borderColor: accent + "40" }}>
          <p className={`${fontClass} tracking-wide`} style={{ color: textColor }}>
            {room.caption || "Our Special Moment 💖"}
          </p>
          <p className="text-[8px] mt-1 opacity-75 font-mono" style={{ color: textColor }}>
            {LAYOUTS[room.layout]?.label} • {new Date(room.createdAt || Date.now()).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
    );
  };

  // Detect mobile once so we can skip html2canvas (which taints on mobile
  // when Cloudinary CORS headers are incomplete) and fall back to a direct
  // download of the already-saved Cloudinary PNG.
  const isMobileUA = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const downloadPrintStrip = async () => {
    if (!room) return;
    setExporting(true);

    // ── Mobile fast-path: skip html2canvas, just download the saved Cloudinary PNG
    if (isMobileUA && savedUrl) {
      const toastId = toast.loading("Preparing your strip...");
      try {
        triggerHaptic("success");
        const link = document.createElement("a");
        link.href = savedUrl;
        link.download = `photobooth_scrapbook_strip_${Date.now()}.png`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Strip opened — long-press to save to Photos 🖼️", { id: toastId });
      } catch (err) {
        console.error("[downloadPrintStrip mobile]", err);
        toast.error("Couldn't open the strip.", { id: toastId });
      } finally {
        setExporting(false);
      }
      return;
    }

    // ── Desktop path: html2canvas for true 3x high-res export + Cloudinary backup
    const element = captureAreaRef.current;
    if (!element) {
      setExporting(false);
      toast.error("Strip not ready — try again in a moment.");
      return;
    }
    const toastId = toast.loading("Generating print-quality high-resolution PNG...");
    try {
      triggerHaptic("success");
      // Small timeout to allow styling variables and styles to fully flush
      await new Promise((res) => setTimeout(res, 120));

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false, // never taint; skip any image that lacks CORS headers
        backgroundColor: null,
        scale: 3.0,
        logging: false,
      });

      // canvas.toDataURL can still throw on some browsers if any image is tainted.
      // Fall back to opening the saved Cloudinary URL in a new tab if so.
      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL("image/png");
      } catch (canvasErr) {
        console.warn("[downloadPrintStrip] toDataURL failed; falling back to savedUrl", canvasErr);
        if (savedUrl) {
          window.open(savedUrl, "_blank", "noopener,noreferrer");
          toast.success("Opened Cloudinary backup — long-press to save 🖼️", { id: toastId });
          return;
        }
        throw canvasErr;
      }

      // Trigger user's browser download
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `photobooth_scrapbook_strip_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cloudinary integration
      if (cloudinaryCloudName && cloudinaryUploadPreset) {
        toast.loading("Backing up high-resolution PNG to Cloudinary...", { id: toastId });

        canvas.toBlob(async (blob) => {
          if (!blob) {
            toast.success("High-res PNG exported! (Cloudinary backup error: empty blob)", { id: toastId });
            return;
          }
          try {
            const uploadedUrl = await uploadToCloudinary(
              blob,
              `high-res-strip-${Date.now()}.png`,
              cloudinaryCloudName,
              cloudinaryUploadPreset
            );
            setCloudinaryHighResUrl(uploadedUrl);
            toast.success("Success! High-res PNG downloaded and backed up to Cloudinary!", { id: toastId });
          } catch (err) {
            console.error("Cloudinary high-res backup error:", err);
            toast.success("High-res PNG downloaded, but Cloudinary upload failed.", { id: toastId });
          }
        }, "image/png");
      } else {
        toast.success("High-res PNG exported successfully!", { id: toastId });
      }
    } catch (err) {
      console.error("[downloadPrintStrip desktop]", err);
      // Last-ditch fallback: open the saved Cloudinary URL in a new tab.
      if (savedUrl) {
        window.open(savedUrl, "_blank", "noopener,noreferrer");
        toast.success("Opened Cloudinary backup — long-press to save 🖼️", { id: toastId });
      } else {
        toast.error("Failed to render high-resolution strip.", { id: toastId });
      }
    } finally {
      setExporting(false);
    }
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
            <StickerButton onClick={startWebcam} color="primary" size="sm" disabled={cam.isLoading} icon={cam.isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}>
              {cam.isLoading ? "Starting..." : "Start Camera"}
            </StickerButton>
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
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Swipe through our strips · click any slide to zoom, add to timeline, or download.</p>
              </div>
              {memories.filter((m) => m.type === "photobooth" && m.imageUrl).length > 0 && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-muted)] bg-[var(--fabric-cream)]/40 px-2 py-1 rounded-full border border-[var(--border-color)]">
                  {memories.filter((m) => m.type === "photobooth" && m.imageUrl).length} keepsakes
                </span>
              )}
            </div>
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
                  showPagination
                  showNavigation
                  loop={history.length > 2}
                  onSlideClick={(index) => {
                    const mem = history[index];
                    if (!mem) return;
                    setGalleryPopupMemory(mem);
                    setGalleryZoom(1);
                  }}
                />
              );
            })()}
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
                    <button key={lay} onClick={async () => { setLayout(lay as any); await updateRoom({ layout: lay }); }}
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
                {/* Theme presets */}
                <div className="bg-[var(--fabric-cream)]/25 p-5 rounded-3xl border border-[var(--wood-oak)]/15 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" /> Frame Theme Preset
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {STRIP_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      updateRoom({
                        stripPreset: p.id,
                        customFrameColor: "",
                        customTextColor: "",
                        customAccentColor: "",
                      })
                    }
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${room.stripPreset === p.id ? "bg-[var(--primary)] text-white border-transparent shadow-sm" : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"}`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: p.swatch }} /> {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🎨 Quick Color Palettes Selector (Updates CSS theme variables) */}
                <div className="bg-[var(--fabric-cream)]/25 p-5 rounded-3xl border border-[var(--wood-oak)]/15 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Quick Color Palettes
                  </span>
                  <p className="text-[10px] text-[var(--text-muted)]">Coordinated designer themes that instantly set background, border, and text styles:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PALETTES.map((pal) => {
                      const isActive = room.customFrameColor === pal.bg && room.customAccentColor === pal.border;
                      return (
                    <button
                      key={pal.name}
                      onClick={() => {
                        updateRoom({
                          customFrameColor: pal.bg,
                          customTextColor: pal.text,
                          customAccentColor: pal.border,
                        });
                        triggerHaptic("light");
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col gap-1.5 hover:bg-white/55 hover:scale-[1.01] ${
                            isActive ? "bg-white border-rose-400 shadow-md ring-1 ring-rose-400/30" : "bg-white/10 border-white/45"
                          }`}
                        >
                          <span className="text-[10px] font-bold text-[var(--text-main)] truncate leading-none">{pal.name}</span>
                          <span className="text-[8px] text-[var(--text-muted)] line-clamp-1 leading-none">{pal.description}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: pal.bg }} title="Background" />
                            <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: pal.border }} title="Accent / Border" />
                            <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: pal.text }} title="Text color" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 🎨 Unlimited Color Customization (Colors can be changed) */}
                <div className="bg-[var(--fabric-cream)]/25 p-5 rounded-3xl border border-[var(--wood-oak)]/15 space-y-4">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Color Customizer (Real-time)
                  </span>

                  {/* 1. Frame Background Color */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">1. Background Frame</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">Custom:</span>
                        <input 
                          type="color" 
                          value={room.customFrameColor || STRIP_PRESETS.find(p => p.id === room.stripPreset)?.frameColor || "#fffae6"} 
                          onChange={(e) => updateRoomDebounced({ customFrameColor: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {["#faf6ee", "#fdf0f0", "#18181b", "#e8d5b8", "#09090b", "#fffae6", "#f3e8ff", "#ecfdf5"].map((color) => (
                        <button 
                          key={color}
                          onClick={() => updateRoom({ customFrameColor: color })}
                          style={{ backgroundColor: color }}
                          className={`w-6 h-6 rounded-full border border-black/10 hover:scale-110 active:scale-95 transition-transform duration-100 ${room.customFrameColor === color ? "ring-2 ring-offset-2 ring-rose-400" : ""}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 2. Text / Caption Color */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">2. Title & Caption Text</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">Custom:</span>
                        <input 
                          type="color" 
                          value={room.customTextColor || STRIP_PRESETS.find(p => p.id === room.stripPreset)?.textColor || "#1e293b"} 
                          onChange={(e) => updateRoomDebounced({ customTextColor: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {["#1e293b", "#ffffff", "#5c4033", "#ec4899", "#881337", "#14532d", "#3b82f6", "#ef4444"].map((color) => (
                        <button 
                          key={color}
                          onClick={() => updateRoom({ customTextColor: color })}
                          style={{ backgroundColor: color }}
                          className={`w-6 h-6 rounded-full border border-black/10 hover:scale-110 active:scale-95 transition-transform duration-100 ${room.customTextColor === color ? "ring-2 ring-offset-2 ring-rose-400" : ""}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 3. Accent Ribbon Color */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">3. Decorative Accent Line</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">Custom:</span>
                        <input 
                          type="color" 
                          value={room.customAccentColor || STRIP_PRESETS.find(p => p.id === room.stripPreset)?.accent || "#f43f5e"} 
                          onChange={(e) => updateRoomDebounced({ customAccentColor: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {["#f43f5e", "#38bdf8", "#eab308", "#10b981", "#059669", "#8b5cf6", "#ec4899", "#2563eb"].map((color) => (
                        <button 
                          key={color}
                          onClick={() => updateRoom({ customAccentColor: color })}
                          style={{ backgroundColor: color }}
                          className={`w-6 h-6 rounded-full border border-black/10 hover:scale-110 active:scale-95 transition-transform duration-100 ${room.customAccentColor === color ? "ring-2 ring-offset-2 ring-rose-400" : ""}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-[var(--fabric-cream)]/25 p-5 rounded-3xl border border-[var(--wood-oak)]/15 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Color Filter
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {FILTERS.map((f) => (
                      <button key={f.id} onClick={() => updateRoom({ filter: f.id })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${room.filter === f.id ? "bg-[var(--primary)] text-white border-transparent shadow-sm" : "bg-white/30 border-white/50 text-[var(--text-muted)] hover:bg-white/50"}`}>{f.label}</button>
                    ))}
                  </div>
                </div>

                {/* Caption Input */}
                <div className="bg-[var(--fabric-cream)]/25 p-5 rounded-3xl border border-[var(--wood-oak)]/15 space-y-3">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-500 flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5" /> Strip Caption
                  </span>
                  <input value={room.caption || ""} onChange={(e) => updateRoomDebounced({ caption: e.target.value })}
                    placeholder="Your caption..." maxLength={26}
                    className="w-full text-xs px-3.5 py-2.5 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder-gray-400" />
                </div>

                {/* Assemble button */}
                <button onClick={composeAndSave} disabled={saving}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-95 text-white font-bold rounded-2xl text-sm shadow-lg disabled:opacity-50 cursor-pointer transition-all duration-200 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{saving ? "Assembling & Syncing..." : "Save to Library"}</span>
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl z-30">
                    <motion.span key={countdownVal} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }}
                      className="text-8xl font-black text-white drop-shadow-2xl">{countdownVal}</motion.span>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {room.state === "done" && (
              <div className="flex flex-col items-center gap-2 mt-4">
                <button 
                  onClick={downloadPrintStrip}
                  disabled={exporting}
                  className={`py-3 px-6 bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-bold rounded-2xl text-xs shadow-md transition-all duration-200 cursor-pointer flex items-center gap-2 ${exporting ? "opacity-75 cursor-not-allowed scale-95" : "hover:scale-[1.02] active:scale-95"}`}
                >
                  {exporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{exporting ? "Exporting High-Res PNG..." : "Download High-Res PNG 🖼️"}</span>
                </button>
                {cloudinaryHighResUrl && (
                  <a 
                    href={cloudinaryHighResUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] text-blue-500 hover:underline font-mono"
                  >
                    ☁️ Cloudinary High-Res URL
                  </a>
                )}
              </div>
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
      <video
        ref={persistentVideoRef}
        autoPlay
        playsInline
        muted
        style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
      />

    {/* ── Photo Strip Gallery Popup ─────────────────────────────────────── */}
    {/* Opens when a user clicks a thumbnail in the "Photobooth Gallery      */}
    {/* History" section. Supports zoom in/out, add/remove from timeline     */}
    {/* (toggles Memory.showOnTimeline), and download the original image.   */}
    <AnimatePresence>
      {galleryPopupMemory && (
        <PhotoStripPopup
          memory={galleryPopupMemory}
          zoom={galleryZoom}
          setZoom={setGalleryZoom}
          busy={galleryAddingToTimeline}
          onClose={() => setGalleryPopupMemory(null)}
          onToggleTimeline={async () => {
            if (galleryAddingToTimeline) return;
            setGalleryAddingToTimeline(true);
            try {
              const current = galleryPopupMemory;
              const next = !(current.showOnTimeline !== false);
              await updateMemory(current.id, { showOnTimeline: next });
              // Mirror change locally so the action button re-renders instantly
              setGalleryPopupMemory({ ...current, showOnTimeline: next });
              toast.success(next ? "Added to timeline ✨" : "Removed from timeline.");
              triggerHaptic("success");
            } catch (e) {
              console.error("[gallery toggle timeline]", e);
              toast.error("Could not update timeline status.");
            } finally {
              setGalleryAddingToTimeline(false);
            }
          }}
          onDelete={async () => {
            if (!confirm("Delete this photo strip forever?")) return;
            try {
              await deleteMemory(galleryPopupMemory.id);
              setGalleryPopupMemory(null);
              triggerHaptic("success");
              toast.success("Photo strip removed 💔");
            } catch (e) {
              console.error("[gallery delete]", e);
              toast.error("Could not delete strip.");
            }
          }}
          onDownload={async () => {
            if (!galleryPopupMemory?.imageUrl) return;
            try {
              triggerHaptic("success");
              let downloadUrl = galleryPopupMemory.imageUrl;
              // Strip Cloudinary f_auto (so we get the true JPG/PNG)
              if (downloadUrl.includes("/upload/")) {
                downloadUrl = downloadUrl.replace(/f_auto,?/g, "");
              }
              const response = await fetch(downloadUrl);
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = blobUrl;
              link.download = `${(galleryPopupMemory.title || "photobooth_strip").replace(/\s+/g, "_")}.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(blobUrl);
              toast.success("Download started ⬇️");
            } catch (err) {
              console.warn("[gallery download]", err);
              window.open(galleryPopupMemory.imageUrl, "_blank");
            }
          }}
        />
      )}
    </AnimatePresence>
    </div>
  );
}

// ─── PhotoStripPopup component ──────────────────────────────────────────────
function PhotoStripPopup({
  memory,
  zoom,
  setZoom,
  busy,
  onClose,
  onToggleTimeline,
  onDelete,
  onDownload,
}: {
  memory: Memory;
  zoom: number;
  setZoom: (n: number) => void;
  busy: boolean;
  onClose: () => void;
  onToggleTimeline: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onDownload: () => Promise<void> | void;
}) {
  // ESC to close + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Wheel-to-zoom while popup is open (desktop convenience)
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!(e.target as HTMLElement)?.closest?.("[data-photo-strip-image]")) return;
      e.preventDefault();
      setZoom(Math.min(3, Math.max(1, zoom + (e.deltaY < 0 ? 0.25 : -0.25))));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [zoom, setZoom]);

  const onTimeline = memory.showOnTimeline !== false;
  const cleanTitle = (memory.title || "Photo Strip")
    .replace(/^\d+\s*/, "")
    .replace("Live Photobooth", "Photo Strip");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 md:p-8">
      {/* Backdrop */}
      <motion.button
        type="button"
        aria-label="Close photo strip"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-zoom-out"
      />
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 bg-[var(--fabric-cream)] rounded-3xl shadow-2xl border border-[var(--wood-oak)]/30 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-[var(--border-color)] flex items-start justify-between gap-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-serif font-bold text-[var(--text-main)] truncate leading-tight">
              📸 {cleanTitle}
            </h3>
            <p className="text-[9px] sm:text-[10px] font-mono text-[var(--text-muted)] mt-0.5 flex items-center gap-1 flex-wrap">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(memory.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
              {memory.description && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[160px] sm:max-w-xs">{memory.description}</span>
                </>
              )}
              <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full font-bold uppercase tracking-wider text-[8px]">
                {onTimeline ? "On Timeline" : "Archive"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full text-[var(--text-muted)] cursor-pointer transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image area */}
        <div className="relative flex-1 overflow-auto bg-[#2a2520] flex items-center justify-center min-h-[40vh] sm:min-h-[50vh] p-4">
          <motion.img
            key={memory.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            src={memory.imageUrl}
            alt={memory.title || "Photo strip"}
            referrerPolicy="no-referrer"
            data-photo-strip-image
            onClick={() =>
              setZoom(zoom >= 3 ? 1 : Math.min(3, +(zoom + 0.5).toFixed(2)))
            }
            className="select-none max-h-[68vh] cursor-zoom-in"
            style={{
              maxWidth: zoom === 1 ? "100%" : `${Math.round(zoom * 100)}%`,
              width: zoom > 1 ? `${Math.round(zoom * 100)}%` : undefined,
              transition: "max-width 240ms ease, width 240ms ease",
            }}
            draggable={false}
          />
          {/* Zoom level chip */}
          <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] font-mono px-2 py-1 rounded-full backdrop-blur-sm pointer-events-none">
            {zoom === 1 ? "Tap to zoom" : `Zoom ${zoom.toFixed(1)}×`}
          </div>
        </div>

        {/* Action bar */}
        <div className="px-4 py-3 border-t border-[var(--border-color)] flex flex-wrap items-center gap-2 flex-shrink-0 bg-[var(--fabric-cream)]">
          <div className="flex items-center gap-1 bg-black/5 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setZoom(Math.max(1, +(zoom - 0.5).toFixed(2)))}
              disabled={zoom <= 1}
              className="p-1.5 rounded-lg hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-[var(--text-main)]"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-[var(--text-main)] px-1.5 min-w-[2.75rem] text-center">
              {zoom === 1 ? "Fit" : `${zoom.toFixed(1)}×`}
            </span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(3, +(zoom + 0.5).toFixed(2)))}
              disabled={zoom >= 3}
              className="p-1.5 rounded-lg hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-[var(--text-main)]"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              disabled={zoom === 1}
              className="p-1.5 rounded-lg hover:bg-black/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors text-[var(--text-main)]"
              aria-label="Reset zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onDelete()}
            className="text-[10px] font-bold text-red-500/80 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1"
            aria-label="Delete strip"
          >
            🗑️ Delete
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onToggleTimeline}
            disabled={busy}
            className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm disabled:opacity-60 ${
              onTimeline
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300"
                : "bg-[var(--primary)] hover:opacity-90 text-white"
            }`}
            aria-label={onTimeline ? "Remove from timeline" : "Add to timeline"}
          >
            {busy ? (
              <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : onTimeline ? (
              <>
                <Check className="w-3.5 h-3.5" /> On Timeline
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5" /> Add to Timeline
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDownload}
            className="text-xs font-bold px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            aria-label="Download"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </motion.div>
    </div>
  );
}
