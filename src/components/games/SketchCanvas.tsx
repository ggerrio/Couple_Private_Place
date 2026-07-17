/**
 * SketchCanvas.tsx — Collaborative real-time drawing canvas
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pen, Eraser, Undo, Redo, Lock, Unlock, Heart } from "lucide-react";
import { useCouple } from "../../context/CoupleContext";
import { getDb } from "../../firebaseClient";
import { toast } from "sonner";
import { WashiTapeDivider } from "../scrapbook";
import { safeUpdateDoc, customArrayUnion, uploadToCloudinary } from "../../utils/gameUtils";
import {
  record as recordLatency,
  getTabId,
  tabWriteTs,
  isLatencyOverlayEnabled,
  type ListenerId,
} from "../../utils/latencyTracker";

// Two logical listeners instrumented in this component
const SKETCH_ROOM_LISTENER: ListenerId = "studio:sketch_room";
const SKETCH_CURSORS_LISTENER: ListenerId = "studio:sketch_cursors";

// ─── Types & Constants ────────────────────────────────────────────────────────

interface StrokePoint {
  x: number;
  y: number;
  color: string;
  size: number;
  type: "start" | "draw" | "end";
}

interface PartnerCursor {
  x: number;
  y: number;
  ts: number;
}

// 🖱️ Cursor sync constants
// Adaptive throttle: 50ms (= 20fps) for the first strokes, then 100ms (= 10fps)
// once sustained drawing passes 5s — halves Network writes without losing
// partner-cursor responsiveness on the initial / short strokes.
const CURSOR_WRITE_THROTTLE_MS_FAST = 50;
const CURSOR_WRITE_THROTTLE_MS_SLOW = 100;
const CURSOR_SUSTAINED_THRESHOLD_MS = 5000;
// Anything older than this is treated as "partner stopped drawing"
const CURSOR_STALE_MS = 3000;

const COLORS = [
  "#000000", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
  "#ffffff", "#6b7280",
];

const BRUSH_SIZES = [2, 4, 8, 14];

// ─── Sketch Canvas Component ──────────────────────────────────────────────────

function SketchCanvas({ onSave }: { onSave?: () => void }) {
  const {
    currentUser,
    cloudinaryCloudName,
    cloudinaryUploadPreset,
    addMemory,
    memories,
    userA,
    userB,
  } = useCouple();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const strokeBufferRef = useRef<StrokePoint[]>([]);

  const [activeSessionId, setActiveSessionId] = useState<string>("init");
  const [isEraser, setIsEraser] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scrollLocked, setScrollLocked] = useState(true);

  const [strokesDocs, setStrokesDocs] = useState<any[]>([]);
  const [undoneStrokes, setUndoneStrokes] = useState<any[]>([]);
  const [savedSketches, setSavedSketches] = useState<
    { id: string; url: string; createdAt: string; createdBy: string }[]
  >([]);
  const [partnerCursors, setPartnerCursors] = useState<Record<string, PartnerCursor>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Touch scroll-lock
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (scrollLocked && e.cancelable) {
        e.preventDefault();
      }
    };

    canvas.addEventListener("touchstart", preventDefaultTouch, {
      passive: false,
    });
    canvas.addEventListener("touchmove", preventDefaultTouch, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("touchstart", preventDefaultTouch);
      canvas.removeEventListener("touchmove", preventDefaultTouch);
    };
  }, [scrollLocked]);

  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const lastSessionIdRef = useRef<string | null>(null);
  const lastStrokesRef = useRef<any[]>([]);
  const lastCursorWriteRef = useRef(0);
  const lastPartnerCursorTsRef = useRef(0);
  // Tracks the start of a continuous-drawing session (pointerdown → pointerup).
  // null when the user is NOT mid-stroke; used to switch the cursor-write
  // throttle from 50ms → 100ms once we cross CURSOR_SUSTAINED_THRESHOLD_MS.
  const continuousDrawStartRef = useRef<number | null>(null);

  // ♻️ Stale-cursor sweeper — partner's dot fades away when they stop drawing
  useEffect(() => {
    const id = setInterval(() => {
      setPartnerCursors((prev) => {
        const cutoff = Date.now() - CURSOR_STALE_MS;
        const next: Record<string, PartnerCursor> = {};
        let changed = false;
        Object.entries(prev).forEach(([uid, c]) => {
          if (c.ts >= cutoff) next[uid] = c; else changed = true;
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Toggle navbar on preview
  useEffect(() => {
    if (previewUrl) {
      window.dispatchEvent(
        new CustomEvent("toggleNavbar", { detail: false })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("toggleNavbar", { detail: true })
      );
    }
    return () => {
      window.dispatchEvent(
        new CustomEvent("toggleNavbar", { detail: true })
      );
    };
  }, [previewUrl]);

  // Sync strokes live
  useEffect(() => {
    isInitialLoadRef.current = true;
    lastSessionIdRef.current = null;
    lastStrokesRef.current = [];
    let unsub: (() => void) | null = null;

    (async () => {
      const db = await getDb();
      const { doc, onSnapshot, setDoc } = await import("firebase/firestore");
      unsub = onSnapshot(
        doc(db, "rooms", "sketch_room"),
        (d: any) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          if (!d.exists()) {
            setDoc(doc(db, "rooms", "sketch_room"), {
              sessionId: "init",
              strokes: [],
              ...tabWriteTs(SKETCH_ROOM_LISTENER),
            }).catch(console.error);
            return;
          }

          const data = d.data();
          // ⏱️ Latency: record sample on every sketch_room echo when our own
          // listenerId stamp is present and our tab echoed back the write.
          if (import.meta.env.DEV && isLatencyOverlayEnabled()) {
            const writeTs = typeof data._clientWriteTs === "number" ? data._clientWriteTs : null;
            const lsId = data._clientListenerId;
            const myId = data._clientTabId;
            if (writeTs != null && lsId === SKETCH_ROOM_LISTENER) {
              recordLatency(SKETCH_ROOM_LISTENER, {
                ts: Date.now(),
                deltaMs: myId === getTabId() ? Date.now() - writeTs : null,
                partnerWrite: myId !== getTabId(),
                stale: false,
              });
            }
          }
          const currentSessionId = data.sessionId || "init";
          const remoteStrokes = data.strokes || [];

          const sortedStrokes = [...remoteStrokes].sort(
            (a: any, b: any) => (a.ts || 0) - (b.ts || 0)
          );

          if (lastSessionIdRef.current !== currentSessionId) {
            lastSessionIdRef.current = currentSessionId;
            setActiveSessionId(currentSessionId);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            sortedStrokes.forEach((stroke: any) => {
              drawPoints(ctx, stroke.points || [], stroke.color, stroke.size);
            });

            lastStrokesRef.current = sortedStrokes;
            setStrokesDocs(sortedStrokes);
            isInitialLoadRef.current = false;
            return;
          }

          const prevStrokes = lastStrokesRef.current;
          lastStrokesRef.current = sortedStrokes;
          setStrokesDocs(sortedStrokes);

          if (sortedStrokes.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (sortedStrokes.length < prevStrokes.length) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            sortedStrokes.forEach((stroke: any) => {
              drawPoints(ctx, stroke.points || [], stroke.color, stroke.size);
            });
          } else {
            const newStrokes = sortedStrokes.slice(prevStrokes.length);
            newStrokes.forEach((stroke: any) => {
              if (stroke.userId !== currentUser) {
                drawPoints(
                  ctx,
                  stroke.points || [],
                  stroke.color,
                  stroke.size
                );
              }
            });
          }
          isInitialLoadRef.current = false;
        },
        (err) => {
          console.error("[sketch room listener]", err);
          toast.error("Sketch canvas sync lost. Check your connection.");
        }
      );
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser]);

  // 🖱️ Realtime partner-cursor sync via cursors subcollection
  // Each user owns their own doc at rooms/sketch_room/cursors/{userId} —
  // last-write-wins on that doc (only one writer per user), race-free.
  useEffect(() => {
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      if ((db as any).isFallback) return; // no Firestore sync in fallback mode
      const { collection, onSnapshot } = await import("firebase/firestore");
      unsub = onSnapshot(
        collection(db, "rooms", "sketch_room", "cursors"),
        (snap: any) => {
          const next: Record<string, PartnerCursor> = {};
          const now = Date.now();
          snap.forEach((d: any) => {
            if (d.id === currentUser) return; // skip self
            const c = d.data();
            if (typeof c?.x === "number" && typeof c?.y === "number") {
              next[d.id] = { x: c.x, y: c.y, ts: c.ts || now };
            }
            // ⏱️ Latency: cursor writes are always partner-originated for THIS tab
            // (we wrote our own doc — it never echoes back). Track the partner's
            // written write→local-display round trip as a server→display sample.
            if (import.meta.env.DEV && isLatencyOverlayEnabled()) {
              const writeTs = typeof c?._clientWriteTs === "number" ? c._clientWriteTs : null;
              if (writeTs != null && c?._clientListenerId === SKETCH_CURSORS_LISTENER) {
                recordLatency(SKETCH_CURSORS_LISTENER, {
                  ts: now,
                  deltaMs: null, // partner originated, no write→display on this side
                  partnerWrite: true,
                  stale: false,
                });
              }
            }
          });
          lastPartnerCursorTsRef.current = now;
          setPartnerCursors(next);
        },
        (err) => { console.error("[sketch cursor listener]", err); }
      );
    })();
    return () => { if (unsub) unsub(); };
  }, [currentUser]);

  // 🧹 Cleanup own cursor doc on unmount + tab switch
  useEffect(() => {
    const cleanup = async () => {
      try {
        const db = await getDb();
        if ((db as any).isFallback) return;
        const { doc, deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "rooms", "sketch_room", "cursors", currentUser));
      } catch {}
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") void cleanup(); };
    window.addEventListener("pagehide", cleanup);
    window.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", cleanup);
      window.removeEventListener("visibilitychange", onVisibility);
      void cleanup();
    };
  }, [currentUser]);

  // Helper: throttled cursor write (adaptive)
  // While user is mid-stroke, switches from 50ms → 100ms after 5s of
  // continuous drawing. Sustained count resets on pointerup.
  const writeCursorThrottled = useCallback(async (x: number, y: number) => {
    const now = Date.now();
    const sustained =
      continuousDrawStartRef.current != null &&
      now - (continuousDrawStartRef.current as number) >= CURSOR_SUSTAINED_THRESHOLD_MS;
    const throttleMs = sustained
      ? CURSOR_WRITE_THROTTLE_MS_SLOW
      : CURSOR_WRITE_THROTTLE_MS_FAST;
    if (now - lastCursorWriteRef.current < throttleMs) return;
    lastCursorWriteRef.current = now;
    try {
      const db = await getDb();
      if ((db as any).isFallback) return;
      const { doc, setDoc } = await import("firebase/firestore");
      // ⏱️ Stamp the cursor doc so the partner's listener identifies it as a
      // cursor write (not a stroke). x/y/ts unchanged.
      await setDoc(
        doc(db, "rooms", "sketch_room", "cursors", currentUser),
        { x: Math.round(x), y: Math.round(y), ts: now, ...tabWriteTs(SKETCH_CURSORS_LISTENER) },
        { merge: true }
      );
    } catch (err) {
      console.error("[sketch cursor write]", err);
    }
  }, [currentUser]);

  // Saved drawings gallery

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      const db = await getDb();
      if (cancelled) return;

      if ((db as any).isFallback) {
        const syncSavedSketches = () => {
          const listStr =
            localStorage.getItem("fs_fallback_saved_sketches") || "[]";
          try {
            const list = JSON.parse(listStr);
            list.sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
            setSavedSketches(list);
          } catch (e) {
            setSavedSketches([]);
          }
        };

        syncSavedSketches();

        const handleStorage = (e: StorageEvent) => {
          if (e.key === "fs_fallback_saved_sketches") syncSavedSketches();
        };
        window.addEventListener("storage", handleStorage);
        window.addEventListener(
          "fs_fallback_saved_sketches_updated",
          syncSavedSketches
        );

        const cleanup = () => {
          window.removeEventListener("storage", handleStorage);
          window.removeEventListener(
            "fs_fallback_saved_sketches_updated",
            syncSavedSketches
          );
        };
        unsub = cleanup;
        return;
      }

      const { query: q, collection, orderBy: ob, onSnapshot: rawOnSnapshot } =
        await import("firebase/firestore");
      const queryRef = q(
        collection(db, "saved_sketches"),
        ob("createdAt", "desc")
      );
      unsub = rawOnSnapshot(
        queryRef,
        (snap: any) => {
          setSavedSketches(
            snap.docs.map((d: any) => ({
              id: d.id,
              url: d.data().url,
              createdAt: d.data().createdAt,
              createdBy: d.data().createdBy,
            }))
          );
        },
        (err) => {
          console.error("[saved sketches listener]", err);
          toast.error("Failed to sync sketch gallery.");
        }
      );
    })();

    return () => {
      cancelled = true;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const drawPoints = (
    ctx: CanvasRenderingContext2D,
    points: any[],
    strokeColor?: string,
    strokeSize?: number
  ) => {
    if (!points || points.length === 0) return;

    let lastX = 0;
    let lastY = 0;

    points.forEach((p) => {
      const type = p.t || p.type;
      const color = p.color || strokeColor || "#000000";
      const size = p.size || strokeSize || 4;

      if (type === "start" || type === "s") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        lastX = p.x;
        lastY = p.y;
      } else if (type === "draw" || type === "d") {
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        lastX = p.x;
        lastY = p.y;
      }
    });
  };

  const getPos = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement
  ): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      if (e.touches.length === 0)
        return { x: lastXRef.current, y: lastYRef.current };
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const MAX_POINTS = 30000;
  const totalPoints = strokesDocs.reduce(
    (acc, s) => acc + (s.points?.length || 0),
    0
  );
  const isLimitReached = totalPoints >= MAX_POINTS;

  const onPointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (isLimitReached) {
        toast.error(
          "Canvas points limit reached! Clear canvas or undo some strokes to draw more."
        );
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      isDrawingRef.current = true;
      // Start the "continuous drawing" clock so writeCursorThrottled can
      // shift to 100ms after 5s of sustained drawing.
      continuousDrawStartRef.current = Date.now();
      const { x, y } = getPos(e, canvas);
      lastXRef.current = x;
      lastYRef.current = y;

      setUndoneStrokes([]);

      const activeColor = isEraser ? "#ffffff" : color;

      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = activeColor;
      ctx.fill();

      strokeBufferRef.current.push({
        x: Math.round(x),
        y: Math.round(y),
        t: "s",
      } as any);
    },
    [color, brushSize, isEraser, isLimitReached]
  );

  const onPointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (!isDrawingRef.current || isLimitReached) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { x, y } = getPos(e, canvas);
      const ctx = canvas.getContext("2d")!;

      const activeColor = isEraser ? "#ffffff" : color;

      ctx.beginPath();
      ctx.moveTo(lastXRef.current, lastYRef.current);
      ctx.lineTo(x, y);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      lastXRef.current = x;
      lastYRef.current = y;

      strokeBufferRef.current.push({
        x: Math.round(x),
        y: Math.round(y),
        t: "d",
      } as any);

      // 🖱️ Push cursor position to partner via subcollection (throttled)
      void writeCursorThrottled(x, y);
    },
    [color, brushSize, isEraser, isLimitReached, writeCursorThrottled]
  );

  const onPointerUp = useCallback(async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    // End the continuous-drawing session — next pointerdown starts fresh
    // and cursor writes return to 50ms throttle.
    continuousDrawStartRef.current = null;
    const activeColor = isEraser ? "#ffffff" : color;
    strokeBufferRef.current.push({ x: 0, y: 0, t: "e" } as any);

    const points = strokeBufferRef.current.splice(0);
    if (points.length === 0) return;
    try {
      const db = await getDb();
      const { doc } = await import("firebase/firestore");
      // ⏱️ Sibling fields ride along with the strokes arrayUnion so the listener
      // can identify this write as a sketch_room change.
      await safeUpdateDoc(doc(db, "rooms", "sketch_room"), {
        strokes: customArrayUnion({
          userId: currentUser,
          color: activeColor,
          size: brushSize,
          points,
          ts: Date.now(),
        }),
        ...tabWriteTs(SKETCH_ROOM_LISTENER),
      });
    } catch (e) {
      console.error("[sketch save stroke]", e);
    }
  }, [color, brushSize, isEraser, currentUser]);

  const clearCanvas = useCallback(async () => {
    const newSessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "sketch_room"), {
        sessionId: newSessionId,
        strokes: [],
        ...tabWriteTs(SKETCH_ROOM_LISTENER),
      });
      setUndoneStrokes([]);
      setStrokesDocs([]);
    } catch (e) {
      console.error("[clear sketch]", e);
    }
  }, []);

  const handleUndo = useCallback(async () => {
    const myStrokes = strokesDocs.filter((s) => s.userId === currentUser);
    if (myStrokes.length === 0) return;
    const lastStroke = myStrokes[myStrokes.length - 1];

    setUndoneStrokes((prev) => [...prev, lastStroke]);

    const nextStrokes = strokesDocs.filter((s) => s !== lastStroke);
    setStrokesDocs(nextStrokes);
    try {
      const db = await getDb();
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "rooms", "sketch_room"), { strokes: nextStrokes, ...tabWriteTs(SKETCH_ROOM_LISTENER) }, { merge: true });
    } catch (e) {
      console.error("[undo error]", e);
    }
  }, [strokesDocs, currentUser]);

  const handleRedo = useCallback(async () => {
    if (undoneStrokes.length === 0) return;
    const toRestore = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes((prev) => prev.slice(0, -1));

    const nextStrokes = [...strokesDocs, toRestore];
    setStrokesDocs(nextStrokes);
    try {
      const db = await getDb();
      const { doc } = await import("firebase/firestore");
      await safeUpdateDoc(doc(db, "rooms", "sketch_room"), {
        strokes: customArrayUnion(toRestore),
        ...tabWriteTs(SKETCH_ROOM_LISTENER),
      });
    } catch (e) {
      console.error("[redo error]", e);
    }
  }, [undoneStrokes, strokesDocs]);

  const saveDrawing = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cloudName =
      cloudinaryCloudName ||
      (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME ||
      "";
    const uploadPreset =
      cloudinaryUploadPreset ||
      (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET ||
      "";

    setSaving(true);
    setSaveError("");

    const db = await getDb();

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setSaving(false);
        setSaveError("Failed to generate image.");
        return;
      }
      try {
        const url = await uploadToCloudinary(
          blob,
          `sketch-${Date.now()}.png`,
          cloudName,
          uploadPreset
        );

        const newDoc = {
          url,
          createdAt: new Date().toISOString(),
          createdBy: currentUser,
        };

        if ((db as any).isFallback) {
          const listStr =
            localStorage.getItem("fs_fallback_saved_sketches") || "[]";
          let list = [];
          try {
            list = JSON.parse(listStr);
          } catch (e) {}
          const item = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            ...newDoc,
          };
          list.push(item);
          localStorage.setItem(
            "fs_fallback_saved_sketches",
            JSON.stringify(list)
          );
          window.dispatchEvent(
            new CustomEvent("fs_fallback_saved_sketches_updated")
          );
        } else {
          const { collection, addDoc } = await import("firebase/firestore");
          await addDoc(collection(db, "saved_sketches"), newDoc);
        }

        setSaving(false);
        onSave?.();
      } catch (err: any) {
        console.error("Save sketch error:", err);
        setSaveError(err.message || "Failed to upload drawing.");
        setSaving(false);
      }
    }, "image/png");
  }, [cloudinaryCloudName, cloudinaryUploadPreset, currentUser, onSave]);

  const deleteSavedSketch = useCallback(async (id: string) => {
    try {
      const db = await getDb();
      if ((db as any).isFallback) {
        const listStr =
          localStorage.getItem("fs_fallback_saved_sketches") || "[]";
        let list = [];
        try {
          list = JSON.parse(listStr);
        } catch (e) {}
        list = list.filter((item: any) => item.id !== id);
        localStorage.setItem(
          "fs_fallback_saved_sketches",
          JSON.stringify(list)
        );
        window.dispatchEvent(
          new CustomEvent("fs_fallback_saved_sketches_updated")
        );
      } else {
        const { doc: rawDoc, deleteDoc: rawDeleteDoc } = await import(
          "firebase/firestore"
        );
        await rawDeleteDoc(rawDoc(db, "saved_sketches", id));
      }
    } catch (e) {
      console.error("[delete saved sketch]", e);
    }
  }, []);

  const saveToTimeline = useCallback(
    (url: string) => {
      const creatorName =
        currentUser === "user_a" ? userA.name : userB.name;
      const partnerName =
        currentUser === "user_a" ? userB.name : userA.name;

      addMemory({
        type: "drawing",
        title: "Our Sketch Masterpiece 🎨",
        description: `A beautiful drawing sketched together in the play room by ${creatorName} and ${partnerName}!`,
        imageUrl: url,
        date: new Date().toISOString(),
        creatorId: currentUser,
      });

      toast.success("Saved to Memories timeline! ✨");
    },
    [currentUser, userA, userB, addMemory]
  );

  const handleSelectColor = (c: string) => {
    setColor(c);
    setIsEraser(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <WashiTapeDivider color="coral" label="Sketch" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[var(--text-main)]">
          Collaborative Sketch Studio
        </h3>
        <div
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all ${
            isLimitReached
              ? "bg-red-50 text-red-500 border-red-200 animate-pulse"
              : "bg-white/40 text-[var(--text-muted)] border-[var(--border-color)]"
          }`}
        >
          Detail: {totalPoints.toLocaleString()} /{" "}
          {MAX_POINTS.toLocaleString()}{" "}
          {isLimitReached && "⚠️ Limit Reached"}
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="p-3 rounded-2xl flex flex-wrap items-center gap-3 border border-[var(--wood-oak)]/15"
        style={{ backgroundColor: "var(--fabric-cream)" }}
      >
        <div className="flex gap-1.5 border-r border-[var(--border-color)] pr-3">
          <button
            onClick={() => setIsEraser(false)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              !isEraser
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                : "bg-white/50 dark:bg-black/25 border-[var(--border-color)] text-[var(--text-main)] hover:bg-white dark:hover:bg-black/40"
            }`}
            title="Pen Tool"
          >
            <Pen className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsEraser(true)}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              isEraser
                ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                : "bg-white/50 dark:bg-black/25 border-[var(--border-color)] text-[var(--text-main)] hover:bg-white dark:hover:bg-black/40"
            }`}
            title="Eraser Tool"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              id={`sketch-color-${c.replace("#", "")}`}
              onClick={() => handleSelectColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${
                !isEraser && color === c
                  ? "border-[var(--primary)] scale-110 shadow-sm"
                  : "border-white/40"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-[9px] uppercase font-bold text-[var(--text-muted)]">
            Weight:
          </span>
          {BRUSH_SIZES.map((s) => (
            <button
              key={s}
              id={`sketch-size-${s}`}
              onClick={() => setBrushSize(s)}
              className={`rounded-full transition-all flex items-center justify-center cursor-pointer ${
                brushSize === s ? "bg-[var(--primary)]" : "bg-neutral-200 hover:bg-neutral-300"
              }`}
              style={{ width: `${s + 12}px`, height: `${s + 12}px` }}
            >
              <div
                className="rounded-full bg-current"
                style={{
                  width: `${s}px`,
                  height: `${s}px`,
                  backgroundColor:
                    brushSize === s ? "white" : "var(--text-main)",
                }}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center sm:ml-auto w-full sm:w-auto justify-end">
          <button
            id="sketch-scroll-lock-btn"
            onClick={() => {
              setScrollLocked(!scrollLocked);
              toast.success(
                !scrollLocked
                  ? "Scroll locked! 🔒 Drawing focus engaged."
                  : "Scroll unlocked! 🔓"
              );
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
              scrollLocked
                ? "border-amber-200 text-amber-800 bg-amber-50 dark:bg-amber-950/20"
                : "border-[var(--border-color)] text-[var(--text-muted)] bg-white/50"
            }`}
            title={
              scrollLocked
                ? "Disable Drawing Scroll-Lock"
                : "Enable Drawing Scroll-Lock"
            }
          >
            {scrollLocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
            <span className="hidden xs:inline">
              {scrollLocked ? "Scroll Locked" : "Lock Scroll"}
            </span>
          </button>
          <button
            id="sketch-undo-btn"
            onClick={handleUndo}
            disabled={
              strokesDocs.filter((s) => s.userId === currentUser).length === 0
            }
            className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-main)] bg-white/50 dark:bg-black/25 hover:bg-white dark:hover:bg-black/40 disabled:opacity-35 transition-all cursor-pointer"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            id="sketch-redo-btn"
            onClick={handleRedo}
            disabled={undoneStrokes.length === 0}
            className="p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-main)] bg-white/50 dark:bg-black/25 hover:bg-white dark:hover:bg-black/40 disabled:opacity-35 transition-all cursor-pointer"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
          <button
            id="sketch-clear-btn"
            onClick={clearCanvas}
            className="p-1.5 rounded-xl border border-red-200 text-red-500 bg-white/50 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
            title="Clear Canvas"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas with partner-cursor overlay */}
      <div
        className="relative rounded-2xl overflow-hidden border border-[var(--wood-oak)]/15 shadow-inner"
        style={{ backgroundColor: "var(--fabric-cream)" }}
      >
        <canvas
          ref={canvasRef}
          id="sketch-canvas"
          width={800}
          height={500}
          className="w-full h-auto touch-none cursor-crosshair select-none"
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
          onTouchCancel={onPointerUp}
        />

        {/* 🖱️ Partner cursor dots — positioned by canvas-internal coords via %, fade after 2s of inactivity */}
        <AnimatePresence>
          {Object.entries(partnerCursors).map(([uid, c]) => {
            const partnerName =
              uid === "user_a" ? userA?.name?.split(" ")[0] : userB?.name?.split(" ")[0];
            const partnerColor = uid === "user_a" ? "#ec4899" : "#8b5cf6";
            const ageMs = Date.now() - c.ts;
            const opacity = ageMs > 2000 ? Math.max(0, 1 - (ageMs - 2000) / 1000) : 1;
            return (
              <motion.div
                key={uid}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 250, damping: 20, mass: 0.4 }}
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${(c.x / 800) * 100}%`, top: `${(c.y / 500) * 100}%` }}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: partnerColor }}
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                <div
                  className="absolute left-1/2 -translate-x-1/2 mt-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-white whitespace-nowrap shadow-md"
                  style={{ backgroundColor: partnerColor }}
                >
                  {partnerName || "Partner"}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-lg w-full rounded-3xl overflow-hidden border border-[var(--wood-oak)]/20 shadow-2xl"
              style={{ backgroundColor: "var(--fabric-cream)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewUrl}
                alt="Sketch Preview"
                className="w-full object-contain max-h-[60vh]"
              />
              <div className="p-4 flex gap-2 justify-end">
                <button
                  onClick={() => {
                    saveToTimeline(previewUrl);
                    setPreviewUrl(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold text-xs hover:opacity-90 transition-all cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5" /> Save to Timeline
                </button>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] font-bold text-xs hover:bg-white/50 cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          id="sketch-save-btn"
          onClick={saveDrawing}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--primary)] text-white font-bold text-xs hover:opacity-90 disabled:opacity-60 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs"
        >
          {saving ? "Saving..." : "💾 Save Drawing"}
        </button>
        {saveError && (
          <p className="text-xs text-red-500 font-semibold">{saveError}</p>
        )}
      </div>

      {/* Saved Sketches Gallery */}
      {savedSketches.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-2">
            🖼️ Saved Sketches
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {savedSketches.map((sketch) => (
              <div
                key={sketch.id}
                className="group relative rounded-xl overflow-hidden border border-[var(--wood-oak)]/15"
              >
                <img
                  src={sketch.url}
                  alt={`Sketch by ${sketch.createdBy}`}
                  className="w-full h-24 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPreviewUrl(sketch.url)}
                    className="p-1.5 bg-white/90 rounded-lg cursor-pointer hover:bg-white transition-all"
                    title="Preview"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  {sketch.createdBy === currentUser && (
                    <button
                      onClick={() => deleteSavedSketch(sketch.id)}
                      className="p-1.5 bg-red-500/90 rounded-lg cursor-pointer hover:bg-red-500 transition-all"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default SketchCanvas;
