import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { getRTDB, isFirebaseConfigured, getDb } from "../firebaseClient";
import {
  Music,
  Volume2,
  VolumeX,
  Loader2,
  Keyboard,
  Plus,
  Minus,
  RotateCcw,
  Play,
  Square,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Layers,
  Maximize2,
  Minimize2,
  Download,
  Disc,
  Trash2,
  Wifi,
  WifiOff
} from "lucide-react";
import { useCouple } from "../context/CoupleContext";
import { toast } from "sonner";

interface PianoKey {
  note: string;
  key: string;
  isBlack: boolean;
  label: string;
  octave: number;
}

const keyMappings: PianoKey[] = [
  // --- Octave 2 ---
  { note: "C2", key: "1", isBlack: false, label: "C2", octave: 2 },
  { note: "C#2", key: "!", isBlack: true, label: "C#2", octave: 2 },
  { note: "D2", key: "2", isBlack: false, label: "D2", octave: 2 },
  { note: "D#2", key: "@", isBlack: true, label: "D#2", octave: 2 },
  { note: "E2", key: "3", isBlack: false, label: "E2", octave: 2 },
  { note: "F2", key: "4", isBlack: false, label: "F2", octave: 2 },
  { note: "F#2", key: "$", isBlack: true, label: "F#2", octave: 2 },
  { note: "G2", key: "5", isBlack: false, label: "G2", octave: 2 },
  { note: "G#2", key: "%", isBlack: true, label: "G#2", octave: 2 },
  { note: "A2", key: "6", isBlack: false, label: "A2", octave: 2 },
  { note: "A#2", key: "^", isBlack: true, label: "A#2", octave: 2 },
  { note: "B2", key: "7", isBlack: false, label: "B2", octave: 2 },

  // --- Octave 3 ---
  { note: "C3", key: "8", isBlack: false, label: "C3", octave: 3 },
  { note: "C#3", key: "*", isBlack: true, label: "C#3", octave: 3 },
  { note: "D3", key: "9", isBlack: false, label: "D3", octave: 3 },
  { note: "D#3", key: "(", isBlack: true, label: "D#3", octave: 3 },
  { note: "E3", key: "0", isBlack: false, label: "E3", octave: 3 },
  { note: "F3", key: "q", isBlack: false, label: "F3", octave: 3 },
  { note: "F#3", key: "Q", isBlack: true, label: "F#3", octave: 3 },
  { note: "G3", key: "w", isBlack: false, label: "G3", octave: 3 },
  { note: "G#3", key: "W", isBlack: true, label: "G#3", octave: 3 },
  { note: "A3", key: "e", isBlack: false, label: "A3", octave: 3 },
  { note: "A#3", key: "E", isBlack: true, label: "A#3", octave: 3 },
  { note: "B3", key: "r", isBlack: false, label: "B3", octave: 3 },

  // --- Octave 4 ---
  { note: "C4", key: "t", isBlack: false, label: "C4", octave: 4 },
  { note: "C#4", key: "T", isBlack: true, label: "C#4", octave: 4 },
  { note: "D4", key: "y", isBlack: false, label: "D4", octave: 4 },
  { note: "D#4", key: "Y", isBlack: true, label: "D#4", octave: 4 },
  { note: "E4", key: "u", isBlack: false, label: "E4", octave: 4 },
  { note: "F4", key: "i", isBlack: false, label: "F4", octave: 4 },
  { note: "F#4", key: "I", isBlack: true, label: "F#4", octave: 4 },
  { note: "G4", key: "o", isBlack: false, label: "G4", octave: 4 },
  { note: "G#4", key: "O", isBlack: true, label: "G#4", octave: 4 },
  { note: "A4", key: "p", isBlack: false, label: "A4", octave: 4 },
  { note: "A#4", key: "P", isBlack: true, label: "A#4", octave: 4 },
  { note: "B4", key: "a", isBlack: false, label: "B4", octave: 4 },

  // --- Octave 5 ---
  { note: "C5", key: "s", isBlack: false, label: "C5", octave: 5 },
  { note: "C#5", key: "S", isBlack: true, label: "C#5", octave: 5 },
  { note: "D5", key: "d", isBlack: false, label: "D5", octave: 5 },
  { note: "D#5", key: "D", isBlack: true, label: "D#5", octave: 5 },
  { note: "E5", key: "f", isBlack: false, label: "E5", octave: 5 },
  { note: "F5", key: "g", isBlack: false, label: "F5", octave: 5 },
  { note: "F#5", key: "G", isBlack: true, label: "F#5", octave: 5 },
  { note: "G5", key: "h", isBlack: false, label: "G5", octave: 5 },
  { note: "G#5", key: "H", isBlack: true, label: "G#5", octave: 5 },
  { note: "A5", key: "j", isBlack: false, label: "A5", octave: 5 },
  { note: "A#5", key: "J", isBlack: true, label: "A#5", octave: 5 },
  { note: "B5", key: "k", isBlack: false, label: "B5", octave: 5 },

  // --- Octave 6 ---
  { note: "C6", key: "l", isBlack: false, label: "C6", octave: 6 },
  { note: "C#6", key: "L", isBlack: true, label: "C#6", octave: 6 },
  { note: "D6", key: "z", isBlack: false, label: "D6", octave: 6 },
  { note: "D#6", key: "Z", isBlack: true, label: "D#6", octave: 6 },
  { note: "E6", key: "x", isBlack: false, label: "E6", octave: 6 },
  { note: "F6", key: "c", isBlack: false, label: "F6", octave: 6 },
  { note: "F#6", key: "C", isBlack: true, label: "F#6", octave: 6 },
  { note: "G6", key: "v", isBlack: false, label: "G6", octave: 6 },
  { note: "G#6", key: "V", isBlack: true, label: "G#6", octave: 6 },
  { note: "A6", key: "b", isBlack: false, label: "A6", octave: 6 },
  { note: "A#6", key: "B", isBlack: true, label: "A#6", octave: 6 },
  { note: "B6", key: "n", isBlack: false, label: "B6", octave: 6 },

  // --- Octave 7 ---
  { note: "C7", key: "m", isBlack: false, label: "C7", octave: 7 }
];

export const keyToPianoKeyMap: Record<string, PianoKey> = {};
export const noteToPianoKeyMap: Record<string, PianoKey> = {};
keyMappings.forEach((item) => {
  keyToPianoKeyMap[item.key] = item;
  noteToPianoKeyMap[item.note] = item;
});

// Peta konversi e.code fisik ke karakter utama piano (Bawaan White & Minor dasar)
const codeToNormalCharMap: Record<string, string> = {
  Digit1: "1", Digit2: "2", Digit3: "3", Digit4: "4", Digit5: "5", Digit6: "6", Digit7: "7", Digit8: "8", Digit9: "9", Digit0: "0",
  KeyQ: "q", KeyW: "w", KeyE: "e", KeyR: "r", KeyT: "t", KeyY: "y", KeyU: "u", KeyI: "i", KeyO: "o", KeyP: "p",
  KeyA: "a", KeyS: "s", KeyD: "d", KeyF: "f", KeyG: "g", KeyH: "h", KeyJ: "j", KeyK: "k", KeyL: "l",
  KeyZ: "z", KeyX: "x", KeyC: "c", KeyV: "v", KeyB: "b", KeyN: "n", KeyM: "m"
};

// Peta konversi e.code fisik khusus saat SHIFT aktif ke karakter simbol minor murni
const codeToShiftCharMap: Record<string, string> = {
  Digit1: "!", Digit2: "@", Digit4: "$", Digit5: "%", Digit6: "^", Digit8: "*", Digit9: "(",
  KeyQ: "Q", KeyW: "W", KeyE: "E", KeyR: "R", KeyT: "T", KeyY: "Y", KeyI: "I", KeyO: "O", KeyP: "P",
  KeyA: "A", KeyS: "S", KeyD: "D", KeyF: "G", KeyG: "G", KeyH: "H", KeyJ: "J", KeyL: "L",
  KeyZ: "Z", KeyC: "C", KeyV: "V", KeyB: "B"
};

const whiteKeys = keyMappings.filter((k) => !k.isBlack);
const blackKeys = keyMappings.filter((k) => k.isBlack);
const notesArray = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function noteToMidi(note: string): number {
  const match = note.match(/^([A-G]#?)(\d+)$/);
  if (!match) return 60;
  const noteName = match[1];
  const octave = parseInt(match[2], 10);
  const index = notesArray.indexOf(noteName);
  return (octave + 1) * 12 + index;
}

function midiToNote(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const index = midi % 12;
  return `${notesArray[index]}${octave}`;
}

function transposeNote(note: string, semitones: number): string {
  if (semitones === 0) return note;
  const midi = noteToMidi(note);
  const shiftedMidi = Math.max(21, Math.min(108, midi + semitones));
  return midiToNote(shiftedMidi);
}

interface SheetPreset {
  name: string;
  notes: string;
}

const SHEET_PRESETS: SheetPreset[] = [
  {
    name: "Twinkle Twinkle Little Star",
    notes: "t t o o p p o | i i u u y y t | o o i i u u y | o o i i u u y | t t o o p p o | i i u u y y t"
  },
  {
    name: "Fur Elise (Intro Hook)",
    notes: "f D f D f a d s p | [8e] u o a | [ep] t u o | [pa]"
  },
  {
    name: "Interstellar (Simple Theme)",
    notes: "f h f h f h f h | g h g h g h g h | f h f h f h f h | d h d h d h d h"
  },
  {
    name: "Canon in D (Intro Chords)",
    notes: "[tu] [ry] [et] [wr] [qt] [0w] [qt] [wr]"
  }
];

// rAF-batched visual state buffer — ganti setVisualKeyState langsung
const visualBufferRef = { current: new Map<string, boolean>() };
let visualRAFScheduled: number | null = null;

function setVisualKeyState(note: string, active: boolean, _isBlack?: boolean) {
  visualBufferRef.current.set(note, active);
  if (visualRAFScheduled === null) {
    visualRAFScheduled = requestAnimationFrame(() => {
      visualRAFScheduled = null;
      const buffer = visualBufferRef.current;
      visualBufferRef.current = new Map();
      buffer.forEach((isActive, n) => {
        const el = document.getElementById(`key-${n}`);
        if (!el) return;
        if (isActive) {
          el.classList.add(n.includes("#") ? "key-pressed-black" : "key-pressed");
        } else {
          el.classList.remove("key-pressed", "key-pressed-black");
        }
      });
    });
  }
}

export const WhitePianoKey = React.memo(({
  note,
  charKey,
  showKeys,
  showNotes,
  playNote,
  stopNote,
  isMaximized = false,
  darkMode = false,
}: {
  note: string;
  charKey: string;
  showKeys: boolean;
  showNotes: boolean;
  playNote: (note: string) => void;
  stopNote: (note: string) => void;
  isMaximized?: boolean;
  darkMode?: boolean;
}) => {
  return (
    <button
      id={`key-${note}`}
      onMouseDown={() => playNote(note)}
      onMouseUp={() => stopNote(note)}
      onMouseLeave={() => stopNote(note)}
      className={`key-ripple relative select-none outline-none rounded-b-xl flex flex-col justify-end items-center pb-4 text-center transition-transform duration-77 ease-out cursor-pointer group shadow-[0_4px_4px_rgba(0,0,0,0.1)] ${
        darkMode
          ? "bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-800 hover:to-neutral-750 text-neutral-400 hover:text-neutral-250 border-r border-r-neutral-800/40 border-b-[6px] border-b-neutral-950/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "bg-gradient-to-b from-stone-100 via-white to-stone-50 hover:to-stone-100 text-stone-400 hover:text-stone-700 border-r border-r-stone-300/60 border-b-[6px] border-b-stone-200/80 shadow-[_inset_0_2px_0_rgba(255,255,255,0.8)]"
      } ${isMaximized ? "h-[55vh] sm:h-[60vh]" : "h-52 md:h-72"}`}
      style={{ width: "calc(100% / 36)" }}
    >
      {showKeys && (
        <span className={`text-[10px] uppercase font-sans tracking-tighter select-none block font-bold transition-opacity duration-150 relative z-10 opacity-40 group-hover:opacity-80 ${
          darkMode ? "text-neutral-300" : "text-stone-600"
        }`}>
          {charKey}
        </span>
      )}
      {showNotes && (
        <span className={`text-[9px] font-bold mt-1 select-none block font-serif transition-opacity duration-150 relative z-10 opacity-30 group-hover:opacity-60 ${
          darkMode ? "text-neutral-400" : "text-stone-500"
        }`}>
          {note}
        </span>
      )}
    </button>
  );
});
WhitePianoKey.displayName = "WhitePianoKey";

export const BlackPianoKey = React.memo(({
  note,
  charKey,
  showKeys,
  showNotes,
  playNote,
  stopNote,
  leftOffset,
  blackKeyWidthPercent,
  isMaximized = false,
  darkMode = false,
}: {
  note: string;
  charKey: string;
  showKeys: boolean;
  showNotes: boolean;
  playNote: (note: string) => void;
  stopNote: (note: string) => void;
  leftOffset: number;
  blackKeyWidthPercent: number;
  isMaximized?: boolean;
  darkMode?: boolean;
}) => {
  return (
    <button
      id={`key-${note}`}
      onMouseDown={() => playNote(note)}
      onMouseUp={() => stopNote(note)}
      onMouseLeave={() => stopNote(note)}
      className={`key-ripple absolute top-0 select-none outline-none rounded-b-md flex flex-col justify-end items-center pb-3 text-center pointer-events-auto transition-transform duration-77 ease-out cursor-pointer group shadow-[0_6px_10px_rgba(0,0,0,0.55)] border-t border-x ${
        darkMode
          ? "bg-gradient-to-b from-neutral-900 via-neutral-950 to-black hover:from-neutral-800 text-neutral-400 hover:text-white border-t-neutral-800 border-x-neutral-900"
          : "bg-gradient-to-b from-stone-900 via-stone-950 to-black hover:from-stone-800 text-stone-200 hover:text-white border-t-stone-800 border-x-stone-900"
      } ${isMaximized ? "h-[33vh] sm:h-[36vh]" : "h-[120px] md:h-[170px]"}`}
      style={{
        width: `${blackKeyWidthPercent}%`,
        left: `calc(${leftOffset}% - ${blackKeyWidthPercent / 2}%)`,
      }}
    >
      {showKeys && (
        <span className="text-[9px] uppercase font-sans tracking-tighter select-none block font-bold transition-opacity duration-150 relative z-10 opacity-90 text-stone-200 group-hover:opacity-100 group-hover:text-white">
          {charKey}
        </span>
      )}
      {showNotes && (
        <span className="text-[8px] font-bold select-none block font-serif transition-opacity duration-150 relative z-10 opacity-80 text-stone-300 group-hover:opacity-100 group-hover:text-white">
          {note}
        </span>
      )}
    </button>
  );
});
BlackPianoKey.displayName = "BlackPianoKey";

export default function VirtualPiano() {
  const { session, darkMode } = useCouple();
  const [engineStarted, setEngineStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClearingSync, setIsClearingSync] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [rtdbError, setRtdbError] = useState<string | null>(null);
  const [rtdbReady, setRtdbReady] = useState(false);
  const pendingRemoteEventsRef = useRef<Array<() => void>>([]);
  const localUserIdRef = useRef<string>("");
  const rtdbRef = useRef<any>(null);
  const dbFuncsRef = useRef<any>(null);
  const pendingEventsRef = useRef<{ n: string; a: number; u: string; t: any }[]>([]);
  const throttleTimeoutRef = useRef<any | null>(null);
  const loadTimeRef = useRef<number>(Date.now());

  const noteBatchRef = useRef<{ note: string; time?: number }[]>([]);
  const rAFScheduledRef = useRef<number | null>(null);
  const lastPlayTimesRef = useRef<Record<string, number>>({});
  const firestoreDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const autoClearRef = useRef<(() => Promise<void>) | null>(null);

  // ── Remote event handling (throttled + batched via rAF) ──
  const remoteBatchRef = useRef<{ n: string; a: number }[]>([]);
  const remoteRAFScheduledRef = useRef<number | null>(null);
  const remoteLastProcessRef = useRef<number>(0);
  const REMOTE_THROTTLE_MS = 30;

  // Ref untuk clearSyncDatabase agar bisa dipanggil dari useEffect tanpa dependency cycle
  autoClearRef.current = async () => {
    if (!rtdbRef.current || !dbFuncsRef.current) return;
    const { ref: r, update } = dbFuncsRef.current;
    try {
      await update(r(rtdbRef.current), { "rooms/couple_piano_session/events": null });
      loadTimeRef.current = Date.now();
      console.log("🔄 Piano auto-clear: RTDB events purged (30-min cycle)");
    } catch (err) {
      // Silent fail — no data to clear is not an error
      if (err instanceof Error && !err.message.includes("PERMISSION_DENIED")) {
        console.warn("Auto-clear RTDB non-permission issue:", err);
      }
    }
  };

  // Auto-clear RTDB events setiap 30 menit
  useEffect(() => {
    const THIRTY_MIN_MS = 30 * 60 * 1000;
    const lastClear = localStorage.getItem("piano_last_clear");
    const now = Date.now();

    const doClear = () => {
      if (autoClearRef.current) {
        autoClearRef.current();
        localStorage.setItem("piano_last_clear", String(Date.now()));
      }
    };

    // Jika belum pernah clear atau sudah lewat 30 menit sejak clear terakhir
    if (!lastClear || now - parseInt(lastClear, 10) > THIRTY_MIN_MS) {
      // Tunggu 3 detik setelah mount agar RTDB sempat terkoneksi
      const timer = setTimeout(doClear, 3000);
      return () => clearTimeout(timer);
    }

    // Schedule auto-clear periodik setiap 30 menit
    const interval = setInterval(doClear, THIRTY_MIN_MS);
    return () => clearInterval(interval);
  }, [rtdbReady]);

  // Initialize lazy RTDB
  useEffect(() => {
    (async () => {
      try {
        rtdbRef.current = await getRTDB();
        dbFuncsRef.current = await import("firebase/database");
        setRtdbReady(true);
      } catch (err) {
        console.error("Failed to load Realtime Database:", err);
        setRtdbError("Failed to connect to Realtime Database.");
      }
    })();
  }, []);

  // Monitor status koneksi RTDB (membantu debugging sync issue)
  useEffect(() => {
    if (!isFirebaseConfigured || !rtdbReady || !rtdbRef.current || !dbFuncsRef.current) return;
    const { ref, onValue } = dbFuncsRef.current;
    const connectedRef = ref(rtdbRef.current, ".info/connected");
    const unsub = onValue(connectedRef, (snap: any) => {
      const isConnected = snap.val() === true;
      if (!isConnected) {
        // If they just opened the app, allow some seconds to establish connection
        const timer = setTimeout(() => {
          setRtdbError("Real-time sync disconnected. Pastikan Realtime Database sudah diaktifkan di Firebase Console Anda dan Rules-nya mengizinkan Read/Write.");
        }, 6000);
        return () => clearTimeout(timer);
      } else {
        setRtdbError(null); // Clear error on reconnect
      }
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [rtdbReady]);

  // ── RTDB listener for remote events (partner's keystrokes) with throttle + rAF batch ──
  useEffect(() => {
    if (!isFirebaseConfigured || !rtdbReady || !rtdbRef.current || !dbFuncsRef.current) return;
    if (!localUserIdRef.current) return;

    const { ref, onChildAdded } = dbFuncsRef.current;
    const eventsRef = ref(rtdbRef.current, "rooms/couple_piano_session/events");

    // Process a batch of remote events — called inside rAF callback
    const processRemoteBatch = (batch: { n: string; a: number }[]) => {
      for (const event of batch) {
        if (event.a === 1) {
          // Remote key down
          remotelyPressedRef.current.add(event.n);
          triggerLocalNotePlay(event.n);
          triggerHarmonyGlow(event.n);
        } else if (event.a === 0) {
          // Remote key up
          remotelyPressedRef.current.delete(event.n);
          // 🔧 Suppress echo: prevent stopNote from re-sending the event back
          suppressRemoteEchoRef.current = true;
          stopNote(event.n);
          suppressRemoteEchoRef.current = false;
        }
      }
    };

    const unsub = onChildAdded(eventsRef, (snapshot: any) => {
      const val = snapshot.val();
      if (!val) return;

      // Only process events from other users (skip own keystrokes)
      if (val.u === localUserIdRef.current) return;

      // Ignore events from before current session load (e.g. before last clearSyncDatabase)
      if (typeof val.t === 'number' && val.t < loadTimeRef.current) return;

      // Add to remote batch for throttled + batched processing
      remoteBatchRef.current.push({ n: val.n, a: val.a });

      // Schedule rAF batch processing with throttle
      if (remoteRAFScheduledRef.current === null) {
        remoteRAFScheduledRef.current = requestAnimationFrame(() => {
          remoteRAFScheduledRef.current = null;

          // Throttle: ensure minimum interval between remote batch processes
          const elapsed = performance.now() - remoteLastProcessRef.current;
          if (elapsed < REMOTE_THROTTLE_MS) {
            // Re-schedule for later if too soon (max 1 batch per ~30ms)
            remoteRAFScheduledRef.current = requestAnimationFrame(() => {
              remoteRAFScheduledRef.current = null;
              remoteLastProcessRef.current = performance.now();
              const batch = remoteBatchRef.current.splice(0);
              processRemoteBatch(batch);
            });
            return;
          }

          remoteLastProcessRef.current = performance.now();
          const batch = remoteBatchRef.current.splice(0);
          processRemoteBatch(batch);
        });
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
      // Cleanup any pending rAF
      if (remoteRAFScheduledRef.current !== null) {
        cancelAnimationFrame(remoteRAFScheduledRef.current);
        remoteRAFScheduledRef.current = null;
      }
    };
  }, [rtdbReady]);

  useEffect(() => {
    if (session?.uid) {
      localUserIdRef.current = session.uid;
    } else {
      // Fallback user ID to allow instant local playing and sync even when session is lagging
      let tempId = localStorage.getItem("temp_piano_user_id");
      if (!tempId) {
        tempId = `anon_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem("temp_piano_user_id", tempId);
      }
      localUserIdRef.current = tempId;
    }
  }, [session]);

  const activeNotesRef = useRef<Record<string, boolean>>({});
  const lastNoteRef = useRef<string | null>(null);
  const activeVoicesRef = useRef<{ note: string; transposed: string }[]>([]);
  const transportEventIdRef = useRef<number | null>(null);

  const pushLocalEvent = React.useCallback((note: string, action: number) => {
    if (!isFirebaseConfigured || !rtdbRef.current || !dbFuncsRef.current) return;
    const { ref, push, update, serverTimestamp } = dbFuncsRef.current;
    const userId = localUserIdRef.current;
    if (!userId) {
      console.warn("Cannot send piano event: user ID not available yet.");
      return;
    }

    pendingEventsRef.current.push({
      n: note,
      a: action,
      u: userId,
      t: serverTimestamp ? serverTimestamp() : Date.now()
    });

    if (!throttleTimeoutRef.current) {
      throttleTimeoutRef.current = setTimeout(() => {
        throttleTimeoutRef.current = null;
        const events = [...pendingEventsRef.current];
        pendingEventsRef.current = [];

        if (events.length > 0 && rtdbRef.current) {
          const updates: Record<string, any> = {};
          events.forEach((evt) => {
            const newKey = push(ref(rtdbRef.current, "rooms/couple_piano_session/events")).key;
            if (newKey) {
              updates[`rooms/couple_piano_session/events/${newKey}`] = evt;
            }
          });

          update(ref(rtdbRef.current), updates)
            .catch((err: any) => {
              setRtdbError("Sync write failed. Check your Firebase RTDB Security Rules.");
              console.error("RTDB WRITE FAILED", err);
            });
        }
      }, 16);
    }
  }, []);

  const clearSyncDatabase = async () => {
    if (!rtdbRef.current || !dbFuncsRef.current) return;
    const { ref, update } = dbFuncsRef.current;
    setIsClearingSync(true);
    try {
      await update(ref(rtdbRef.current), { "rooms/couple_piano_session/events": null });
      loadTimeRef.current = Date.now();
      toast.success("Piano sync session cleared successfully! ✨");
    } catch (err) {
      console.error("Failed to clear Firebase RTDB events:", err);
      toast.error("Gagal menghapus sesi piano. Pastikan aturan keamanan RTDB Anda mengizinkan hapus.");
    } finally {
      setIsClearingSync(false);
    }
  };

  const [shiftPressed, setShiftPressed] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("couple_piano_volume");
    return saved ? parseInt(saved, 10) : 80;
  });

  const volumeRef = useRef(80);
  const volumeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const syncSettingsToFirestore = async (newInst: string, newVol: number, debounce = false) => {
    if (!isFirebaseConfigured) return;
    const updateFunc = async () => {
      try {
        const db = await getDb();
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "settings", "audio_settings"), {
          instrument: newInst,
          volume: newVol,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Failed to sync settings to Firestore:", err);
      }
    };

    if (debounce) {
      if (firestoreDebounceRef.current) clearTimeout(firestoreDebounceRef.current);
      firestoreDebounceRef.current = setTimeout(updateFunc, 200);
    } else {
      await updateFunc();
    }
  };

  const handleSetVolume = (vol: number) => {
    setVolume(vol);
    syncSettingsToFirestore(instrumentRef.current, vol, true);
  };

  useEffect(() => {
    const handleSetPianoVolume = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === "number") {
        handleSetVolume(detail);
      }
    };
    window.addEventListener("setPianoVolume", handleSetPianoVolume);
    return () => {
      window.removeEventListener("setPianoVolume", handleSetPianoVolume);
    };
  }, []);

  const [transpose, setTranspose] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [showKeys, setShowKeys] = useState(true);
  const [instrument, setInstrument] = useState<"piano" | "musicbox" | "pad">("piano");

  const handleSetInstrument = (inst: "piano" | "musicbox" | "pad") => {
    setInstrument(inst);
    syncSettingsToFirestore(inst, volumeRef.current, false);
  };
  const [sustainPressedFromSpacebar, setSustainPressedFromSpacebar] = useState(false);
  const [sustainLocked, setSustainLocked] = useState(false);
  const [sustainActive, setSustainActive] = useState(false);

  const [sheetText, setSheetText] = useState("t t o o p p o | i i u u y y t");
  const [isPlayingSheet, setIsPlayingSheet] = useState(false);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(-1);
  const [playSpeed, setPlaySpeed] = useState(1.0);
  const [sheetPanelExpanded, setSheetPanelExpanded] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedEvents, setRecordedEvents] = useState<{ note: string; type: "down" | "up"; timestamp: number }[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const playbackTimeoutsRef = useRef<number[]>([]);

  const activeTouchesRef = useRef<Record<number, string>>({});

  const [isMaximized, setIsMaximized] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMaximized(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const element = document.getElementById("piano-app-root");
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch((err) => {
        console.error("Gagal masuk mode Fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMaximized]);

  const samplerRef = useRef<Tone.Sampler | null>(null);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const gainNodeRef = useRef<Tone.Gain | null>(null);

  const physicallyPressedRef = useRef<Set<string>>(new Set());
  const remotelyPressedRef = useRef<Set<string>>(new Set());
  const lastHarmonyToastRef = useRef<number>(0);
  const suppressRemoteEchoRef = useRef(false);

  const triggerHarmonyGlow = (note: string) => {
    const now = Date.now();
    if (now - lastHarmonyToastRef.current > 4000) {
      lastHarmonyToastRef.current = now;
      toast("💞 Soulmate Duet Harmony! Playing notes together. 💖🎵", {
        description: "Your keystrokes are in perfect sync!",
        duration: 3000,
      });
    }

    const el = document.getElementById(`key-${note}`);
    if (el) {
      el.classList.add("harmony-glow-key");
      createFloatingHeartsOnKey(el);
      setTimeout(() => {
        el.classList.remove("harmony-glow-key");
      }, 1000);
    }
  };

  const createFloatingHeartsOnKey = (el: HTMLElement) => {
    const container = document.createElement("div");
    container.className = "absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50";
    el.appendChild(container);

    for (let i = 0; i < 4; i++) {
      const heart = document.createElement("span");
      heart.innerHTML = "💖";
      heart.className = "absolute text-xs animate-float-heart";
      heart.style.left = `${20 + Math.random() * 60}%`;
      heart.style.bottom = "10%";
      heart.style.transform = `scale(${0.6 + Math.random() * 0.8})`;
      heart.style.setProperty("--travel-x", `${(Math.random() - 0.5) * 60}px`);
      heart.style.setProperty("--travel-y", `-${100 + Math.random() * 80}px`);
      heart.style.setProperty("--rotate", `${(Math.random() - 0.5) * 45}deg`);
      container.appendChild(heart);
    }

    setTimeout(() => {
      container.remove();
    }, 1500);
  };

  const engineStartedRef = useRef(false);
  const isLoadedRef = useRef(false);

  const transposeRef = useRef(0);
  const instrumentRef = useRef<"piano" | "musicbox" | "pad">("piano");
  const sustainActiveRef = useRef(false);
  const triggeredTranspositionsRef = useRef<Record<string, string>>({});
  const activeAutoplayNotesRef = useRef<string[]>([]);

  useEffect(() => {
    transposeRef.current = transpose;
  }, [transpose]);

  useEffect(() => {
    instrumentRef.current = instrument;
  }, [instrument]);

  // Adaptive reverb: reduce quality when many voices active
  const activeVoiceCountRef = useRef(0);

  useEffect(() => {
    // Configure Tone.js global context for ultra-low interactive latency
    try {
      Tone.context.latencyHint = "interactive";
      if (Tone.context.lookAhead !== undefined) {
        (Tone.context as any).lookAhead = 0.015;
      }
    } catch (err) {
      console.warn("Could not set interactive latency hint on Tone.js context", err);
    }

    const limiter = new Tone.Limiter(-1.5).toDestination();
    const gainNode = new Tone.Gain(volume / 100).connect(limiter);

    const reverb = new Tone.Reverb({
      decay: 2.0,
      wet: 0.25,
    }).connect(gainNode);

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 1.5,
      },
    }).connect(reverb);

    const sampler = new Tone.Sampler({
      urls: {
        "A0": "A0.mp3", "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
        "A1": "A1.mp3", "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
        "A2": "A2.mp3", "C3": "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
        "A3": "A3.mp3", "C4": "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
        "A4": "A4.mp3", "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
        "A5": "A5.mp3", "C6": "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
        "A6": "A6.mp3", "C7": "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3",
        "A7": "A7.mp3", "C8": "C8.mp3"
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => {
        setIsLoaded(true);
        isLoadedRef.current = true;
      },
      onerror: (err) => {
        console.warn("Could not load premium Salamander samples, using synthesizer fallback.", err);
      },
    }).connect(reverb);

    samplerRef.current = sampler;
    synthRef.current = synth;
    reverbRef.current = reverb;
    gainNodeRef.current = gainNode;

    // Coba aktifkan audio engine saat komponen pertama kali dimuat.
    startPianoEngine();

    return () => {
      sampler.dispose();
      synth.dispose();
      reverb.dispose();
      gainNode.dispose();
      limiter.dispose();
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.rampTo(volume / 100, 0.05);
    }
    localStorage.setItem("couple_piano_volume", String(volume));
  }, [volume]);

  useEffect(() => {
    if (!synthRef.current) return;
    if (instrument === "musicbox") {
      synthRef.current.set({
        oscillator: { type: "sine" },
        envelope: { attack: 0.002, decay: 0.1, sustain: 0.05, release: 0.4 },
      });
    } else if (instrument === "pad") {
      synthRef.current.set({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.8, decay: 0.5, sustain: 0.8, release: 3.0 },
      });
    } else {
      synthRef.current.set({
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 1.5 },
      });
    }
  }, [instrument]);

  const triggerLocalNotePlay = (note: string, time?: number) => {
    const oldTransposed = triggeredTranspositionsRef.current[note];
    if (oldTransposed) {
      if (instrumentRef.current === "piano" && samplerRef.current && isLoadedRef.current) {
        samplerRef.current.triggerRelease(oldTransposed, time);
      } else if (synthRef.current) {
        synthRef.current.triggerRelease(oldTransposed, time);
      }
    }

    const transposed = transposeNote(note, transposeRef.current);
    triggeredTranspositionsRef.current[note] = transposed;

    activeVoicesRef.current = activeVoicesRef.current.filter((v) => v.note !== note);
    // Adaptive voice limit: dynamically reduce when overloaded
    const VOICE_LIMIT = activeVoicesRef.current.length > 12 ? 10 : 14;
    if (activeVoicesRef.current.length >= VOICE_LIMIT) {
      const oldestVoice = activeVoicesRef.current.shift();
      if (oldestVoice) {
        if (instrumentRef.current === "piano" && samplerRef.current && isLoadedRef.current) {
          samplerRef.current.triggerRelease(oldestVoice.transposed, time);
        } else if (synthRef.current) {
          synthRef.current.triggerRelease(oldestVoice.transposed, time);
        }
        const matchingKey = keyMappings.find(k => k.note === oldestVoice.note);
        if (matchingKey) {
          setVisualKeyState(oldestVoice.note, false, matchingKey.isBlack);
        }
        activeNotesRef.current[oldestVoice.note] = false;
      }
    }

    if (instrumentRef.current === "piano" && samplerRef.current && isLoadedRef.current) {
      samplerRef.current.triggerAttack(transposed, time);
    } else if (synthRef.current) {
      synthRef.current.triggerAttack(transposed, time);
    }

    if (recordingStartTimeRef.current !== null) {
      const timestamp = performance.now() - recordingStartTimeRef.current;
      setRecordedEvents((prev) => [...prev, { note, type: "down", timestamp }]);
    }

    activeVoicesRef.current.push({ note, transposed });
    lastNoteRef.current = transposed;

    // Adaptive reverb: reduce wetness when many voices active
    activeVoiceCountRef.current = activeVoicesRef.current.length;
    if (reverbRef.current && activeVoiceCountRef.current > 8) {
      const targetWet = activeVoiceCountRef.current > 12 ? 0.10 : 0.15;
      if (reverbRef.current.wet && reverbRef.current.wet.value !== targetWet) {
        reverbRef.current.wet.rampTo(targetWet, 0.1);
      }
    } else if (reverbRef.current && reverbRef.current.wet) {
      reverbRef.current.wet.rampTo(0.25, 0.3);
    }

    activeNotesRef.current[note] = true;
    const isBlack = note.includes("#");
    setVisualKeyState(note, true, isBlack);
  };

  const playNote = React.useCallback((note: string, time?: number) => {
    if (!engineStartedRef.current) return;

    // Minimal throttle (8ms) only for keyboard auto-repeat, not for actual multi-key chords
    const now = performance.now();
    const lastTime = lastPlayTimesRef.current[note] || 0;
    if (now - lastTime < 8) return;
    lastPlayTimesRef.current[note] = now;

    physicallyPressedRef.current.add(note);

    // Batch multiple notes via requestAnimationFrame — proses SEMUA note dalam 1 frame
    noteBatchRef.current.push({ note, time });

    if (rAFScheduledRef.current === null) {
      rAFScheduledRef.current = requestAnimationFrame(() => {
        rAFScheduledRef.current = null;
        const batch = noteBatchRef.current.splice(0);
        // Process all notes in batch immediately (no 20ms queue!)
        for (const item of batch) {
          triggerLocalNotePlay(item.note, item.time);
          // 🔧 FIX: Send note-down event to partner via RTDB
          pushLocalEvent(item.note, 1);
        }
      });
    }
  }, [pushLocalEvent]);

  const stopNote = React.useCallback((note: string, time?: number) => {
    if (!engineStartedRef.current) return;

    physicallyPressedRef.current.delete(note);

    // 🔧 FIX: Send note-up event to partner (skip if triggered by remote event to avoid echo loop)
    if (!suppressRemoteEchoRef.current) {
      pushLocalEvent(note, 0);
    }

    if (recordingStartTimeRef.current !== null) {
      const timestamp = performance.now() - recordingStartTimeRef.current;
      setRecordedEvents((prev) => [...prev, { note, type: "up", timestamp }]);
    }

    activeNotesRef.current[note] = false;
    const isBlack = note.includes("#");
    setVisualKeyState(note, false, isBlack);

    if (sustainActiveRef.current) {
      return;
    }

    const transposed = triggeredTranspositionsRef.current[note] || transposeNote(note, transposeRef.current);
    delete triggeredTranspositionsRef.current[note];

    if (instrumentRef.current === "piano" && samplerRef.current && isLoadedRef.current) {
      samplerRef.current.triggerRelease(transposed, time);
    } else if (synthRef.current) {
      synthRef.current.triggerRelease(transposed, time);
    }

    activeVoicesRef.current = activeVoicesRef.current.filter((v) => v.note !== note);

    // Restore reverb when voices drop
    activeVoiceCountRef.current = activeVoicesRef.current.length;
    if (reverbRef.current?.wet && activeVoiceCountRef.current <= 6) {
      reverbRef.current.wet.rampTo(0.25, 0.3);
    }
  }, []);

  const playRecording = React.useCallback(() => {
    if (recordedEvents.length === 0) return;
    if (!engineStartedRef.current) startPianoEngine();

    stopRecordingPlayback();
    stopSheetPlayback();
    setIsPlayingRecording(true);

    const timeouts: number[] = [];
    recordedEvents.forEach((event) => {
      const t = window.setTimeout(() => {
        if (event.type === "down") {
          playNote(event.note);
        } else {
          stopNote(event.note);
        }
      }, event.timestamp);
      timeouts.push(t);
    });

    const lastEvent = recordedEvents[recordedEvents.length - 1];
    const endT = window.setTimeout(() => {
      setIsPlayingRecording(false);
    }, lastEvent.timestamp + 800);
    timeouts.push(endT);

    playbackTimeoutsRef.current = timeouts;
  }, [recordedEvents, playNote, stopNote]);

  const stopRecordingPlayback = React.useCallback(() => {
    playbackTimeoutsRef.current.forEach((t) => clearTimeout(t));
    playbackTimeoutsRef.current = [];
    setIsPlayingRecording(false);
    whiteKeys.forEach((k) => stopNote(k.note));
    blackKeys.forEach((k) => stopNote(k.note));
  }, [stopNote]);

  const handleExportMidi = React.useCallback(() => {
    if (recordedEvents.length === 0) return;

    const encodeVLQ = (num: number): number[] => {
      const bytes = [];
      bytes.push(num & 0x7F);
      while (num >> 7 > 0) {
        num = num >> 7;
        bytes.push((num & 0x7F) | 0x80);
      }
      return bytes.reverse();
    };

    const header = [
      0x4D, 0x54, 0x68, 0x64,
      0x00, 0x00, 0x00, 0x06,
      0x00, 0x00,
      0x00, 0x01,
      0x00, 0x80
    ];

    const trackData: number[] = [];
    trackData.push(0x00);
    trackData.push(0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20);

    let lastTick = 0;
    const sorted = [...recordedEvents].sort((a, b) => a.timestamp - b.timestamp);

    sorted.forEach((event) => {
      const absTick = Math.round(event.timestamp / 3.90625);
      const delta = Math.max(0, absTick - lastTick);
      lastTick = absTick;

      trackData.push(...encodeVLQ(delta));

      const midiNote = noteToMidi(event.note);
      if (event.type === "down") {
        trackData.push(0x90, midiNote, 0x5F);
      } else {
        trackData.push(0x80, midiNote, 0x40);
      }
    });

    trackData.push(0x00);
    trackData.push(0xFF, 0x2F, 0x00);

    const trackHeader = [0x4D, 0x54, 0x72, 0x6B];
    const len = trackData.length;
    trackHeader.push(
      (len >> 24) & 0xFF,
      (len >> 16) & 0xFF,
      (len >> 8) & 0xFF,
      len & 0xFF
    );

    const fullMidi = new Uint8Array([...header, ...trackHeader, ...trackData]);
    const blob = new Blob([fullMidi], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `grand_virtuoso_performance_${Date.now()}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordedEvents]);

  const handleTouchTrack = React.useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!engineStartedRef.current) startPianoEngine();

    const currentTouches: Record<number, string> = {};

    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i] as React.Touch;
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element) {
        const button = element.closest("[id^='key-']");
        if (button) {
          const noteName = button.id.replace("key-", "");
          currentTouches[touch.identifier] = noteName;
        }
      }
    }

    Object.keys(activeTouchesRef.current).forEach((idStr) => {
      const id = Number(idStr);
      const oldNote = activeTouchesRef.current[id];
      if (currentTouches[id] !== oldNote) {
        if (oldNote) stopNote(oldNote);
      }
    });

    Object.keys(currentTouches).forEach((idStr) => {
      const id = Number(idStr);
      const newNote = currentTouches[id];
      const oldNote = activeTouchesRef.current[id];
      if (newNote !== oldNote) {
        if (newNote) playNote(newNote);
      }
    });

    activeTouchesRef.current = currentTouches;
  }, [playNote, stopNote]);

  const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const currentTouchIds = Array.from(e.touches).map((t: React.Touch) => t.identifier);

    Object.keys(activeTouchesRef.current).forEach((idStr) => {
      const id = Number(idStr);
      if (!currentTouchIds.includes(id)) {
        const note = activeTouchesRef.current[id];
        if (note) stopNote(note);
        delete activeTouchesRef.current[id];
      }
    });
  }, [stopNote]);

  useEffect(() => {
    const isSustainActive = sustainLocked || sustainPressedFromSpacebar;
    sustainActiveRef.current = isSustainActive;
    setSustainActive(isSustainActive);

    if (isSustainActive) {
      if (samplerRef.current) samplerRef.current.release = 12;
      if (synthRef.current) synthRef.current.set({ envelope: { release: 12 } });
    } else {
      if (samplerRef.current) samplerRef.current.release = 1;
      if (synthRef.current) {
        const releaseVal = instrument === "pad" ? 3.0 : (instrument === "musicbox" ? 0.6 : 1.5);
        synthRef.current.set({ envelope: { release: releaseVal } });
      }

      const notesToRelease: string[] = [];
      Object.keys(activeNotesRef.current).forEach((note) => {
        if (activeNotesRef.current[note] && !physicallyPressedRef.current.has(note) && !remotelyPressedRef.current.has(note) && !activeAutoplayNotesRef.current.includes(note)) {
          const isBlack = note.includes("#");
          setVisualKeyState(note, false, isBlack);
          activeNotesRef.current[note] = false;
          notesToRelease.push(note);
        }
      });

      if (notesToRelease.length > 0) {
        activeVoicesRef.current = activeVoicesRef.current.filter((v) => !notesToRelease.includes(v.note));
        activeVoiceCountRef.current = activeVoicesRef.current.length;

        // Restore reverb after sustain release
        if (reverbRef.current?.wet && activeVoiceCountRef.current <= 6) {
          reverbRef.current.wet.rampTo(0.25, 0.3);
        }

        const transposedReleases = notesToRelease.map((note) => {
          const trans = triggeredTranspositionsRef.current[note] || transposeNote(note, transposeRef.current);
          delete triggeredTranspositionsRef.current[note];
          return trans;
        });

        if (instrument === "piano" && samplerRef.current && isLoadedRef.current) {
          samplerRef.current.triggerRelease(transposedReleases);
        } else if (synthRef.current) {
          synthRef.current.triggerRelease(transposedReleases);
        }
      }
    }
  }, [sustainLocked, sustainPressedFromSpacebar, instrument]);

  // --- REFORMASI ENGINE HANDLER EVENT: ANTI-SHIFT OVERWRITE INTEGRAL ENGINE ---
  useEffect(() => {
    const BLOCKABLE_CTRL_KEYS = new Set([
      "f", "g", "s", "p", "d", "h", "j", "u", "k", "l", "r", "e", "b", "m"
    ]);

    const isBrowserShortcutToBlock = (e: KeyboardEvent) => {
      if (!engineStartedRef.current) return false;

      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      const isCtrlCombo = ctrlOrCmd && BLOCKABLE_CTRL_KEYS.has(key);
      const isFKey = /^F[1-9][0-2]?$/.test(e.key);
      const isSlashSearch = e.key === "/";

      return isCtrlCombo || isFKey || isSlashSearch;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") return;

      if (engineStartedRef.current && (e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "t" || e.key.toLowerCase() === "w")) {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
          event.preventDefault();
          event.returnValue = "Sesi piano duet sedang aktif. Apakah Anda yakin ingin keluar?";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        setTimeout(() => window.removeEventListener("beforeunload", handleBeforeUnload), 1000);
      }

      if (isBrowserShortcutToBlock(e)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault(); e.stopPropagation();
        if (e.repeat) return;
        setTranspose((t) => Math.min(12, t + 1));
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault(); e.stopPropagation();
        if (e.repeat) return;
        setTranspose((t) => Math.max(-12, t - 1));
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault(); e.stopPropagation();
        const nextVol = Math.max(0, volumeRef.current - 5);
        handleSetVolume(nextVol);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault(); e.stopPropagation();
        const nextVol = Math.min(100, volumeRef.current + 5);
        handleSetVolume(nextVol);
        return;
      }

      let targetChar = e.key;
      const isShiftPressed = e.shiftKey;

      if ((e.ctrlKey || e.metaKey) && targetChar.length === 1) {
        const testChar = targetChar.toLowerCase();
        if (keyToPianoKeyMap[testChar]) {
          targetChar = testChar;
        } else {
          return;
        }
      } else if (e.ctrlKey || e.metaKey) {
        return;
      }

      if (!isShiftPressed && !e.ctrlKey && !e.metaKey) {
        targetChar = targetChar.toLowerCase();
      }

      const mapping = keyToPianoKeyMap[targetChar];
      const isMappedKey = !!mapping;
      const isSpaceKey = e.key === " " || e.code === "Space";

      if (!isMappedKey && !isSpaceKey) {
        e.preventDefault(); e.stopPropagation();
      } else if (isSpaceKey) {
        e.preventDefault(); e.stopPropagation();
      }

      setShiftPressed(e.shiftKey);
      if (e.getModifierState) setCapsLockActive(e.getModifierState("CapsLock"));
      if (e.repeat) return;

      if (isSpaceKey) {
        setSustainPressedFromSpacebar(true);
        return;
      }

      if (mapping) playNote(mapping.note);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") return;

      if (isBrowserShortcutToBlock(e)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault(); e.stopPropagation(); return;
      }

      const isSpaceKey = e.key === " " || e.code === "Space";
      setShiftPressed(e.shiftKey);
      if (e.getModifierState) setCapsLockActive(e.getModifierState("CapsLock"));

      if (isSpaceKey) {
        setSustainPressedFromSpacebar(false);
        return;
      }

      // --- STRATEGI DUPLEX SEARCH (MAJOR & MINOR MUTUAL DESTRUCTION) ---
      // Ambil kemungkinan karakter White Key dan Minor Key secara paralel berdasarkan kode fisik keyboard
      const normalChar = codeToNormalCharMap[e.code];
      const shiftChar = codeToShiftCharMap[e.code];

      const notesToStop: string[] = [];

      // Periksa apakah karakter normal (White/Minor Dasar) miliknya sedang menyala di layar
      if (normalChar && keyToPianoKeyMap[normalChar]) {
        notesToStop.push(keyToPianoKeyMap[normalChar].note);
      }
      // Periksa apakah karakter Shift (Minor Simbol) miliknya juga sedang menyala di layar
      if (shiftChar && keyToPianoKeyMap[shiftChar]) {
        notesToStop.push(keyToPianoKeyMap[shiftChar].note);
      }
      // Peta pengaman cadangan: jika dilepas acak di luar kamus e.code
      if (keyToPianoKeyMap[e.key]) {
        notesToStop.push(keyToPianoKeyMap[e.key].note);
      }

      // Eksekusi pelepasan suara untuk semua kandidat yang cocok secara bersih!
      const uniqueNotes = Array.from(new Set(notesToStop));
      uniqueNotes.forEach((noteName) => {
        stopNote(noteName);
      });
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [playNote, stopNote]);

  // Cleanup note buffering on unmount
  useEffect(() => {
    return () => {
      if (rAFScheduledRef.current !== null) {
        cancelAnimationFrame(rAFScheduledRef.current);
      }
    };
  }, []);

  // Real-time Firestore audio settings observer
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let unsub: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const db = await getDb();
        const { doc, onSnapshot } = await import("firebase/firestore");

        if (cancelled) return;

        unsub = onSnapshot(doc(db, "settings", "audio_settings"), (d) => {
          if (d.exists()) {
            const data = d.data();
            // Sync settings immediately to local piano component
            if (data.instrument && data.instrument !== instrumentRef.current) {
              setInstrument(data.instrument);
            }
            if (typeof data.volume === "number" && data.volume !== volumeRef.current) {
              setVolume(data.volume);
            }
          }
        }, (err) => {
          console.error("Firestore settings observer error:", err);
        });
      } catch (err) {
        console.error("Failed to initialize Firestore audio settings observer:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  const startPianoEngine = async () => {
    try {
      await Tone.start();
      if (Tone.context.state !== "running") await Tone.context.resume();
      setEngineStarted(true);
      engineStartedRef.current = true;
    } catch (err) {
      console.error("[Audio] Gagal mengaktifkan AudioContext (kemungkinan diblokir autoplay policy browser):", err);
    }
  };

  const stopPianoEngine = async () => {
    whiteKeys.forEach((k) => stopNote(k.note));
    blackKeys.forEach((k) => stopNote(k.note));
    setEngineStarted(false);
    engineStartedRef.current = false;
  };

  const getNoteFromChar = (char: string): string | null => {
    const mapping = keyToPianoKeyMap[char];
    return mapping ? mapping.note : null;
  };

  const parseSheet = (text: string): string[][] => {
    const steps: string[][] = [];
    let i = 0;
    while (i < text.length) {
      const char = text[i];
      if (char === " " || char === "\n" || char === "\r" || char === "\t" || char === "|") {
        if (steps.length > 0 && steps[steps.length - 1].length > 0) steps.push([]);
        i++; continue;
      }
      if (char === "[") {
        const chordKeys: string[] = []; i++;
        while (i < text.length && text[i] !== "]") {
          const chordChar = text[i];
          if (chordChar !== " " && chordChar !== "\n" && chordChar !== "\r" && chordChar !== "\t") chordKeys.push(chordChar);
          i++;
        }
        if (chordKeys.length > 0) steps.push(chordKeys);
        i++;
      } else {
        steps.push([char]); i++;
      }
    }
    return steps;
  };

  const startSheetPlayback = () => {
    if (!engineStartedRef.current) startPianoEngine();
    stopSheetPlayback();
    const parsedSteps = parseSheet(sheetText);
    if (parsedSteps.length === 0) return;

    setIsPlayingSheet(true);
    setCurrentSheetIndex(0);

    const baseStepTime = 0.25;
    const stepTimeSeconds = baseStepTime / playSpeed;

    let index = 0;
    const eventId = Tone.Transport.scheduleRepeat((time) => {
      if (index >= parsedSteps.length) {
        Tone.Draw.schedule(() => {
          stopSheetPlayback();
        }, time);
        return;
      }

      const currentIndex = index;
      Tone.Draw.schedule(() => {
        setCurrentSheetIndex(currentIndex);
      }, time);

      activeAutoplayNotesRef.current.forEach((note) => {
        stopNote(note, time);
      });
      activeAutoplayNotesRef.current = [];

      const currentKeys = parsedSteps[index];
      const notesToPlay: string[] = [];
      currentKeys.forEach((char) => {
        const note = getNoteFromChar(char);
        if (note) {
          notesToPlay.push(note);
          playNote(note, time);
        }
      });
      activeAutoplayNotesRef.current = notesToPlay;
      index++;
    }, stepTimeSeconds);

    transportEventIdRef.current = eventId;
    Tone.Transport.start();
  };

  const stopSheetPlayback = () => {
    if (transportEventIdRef.current !== null) {
      Tone.Transport.clear(transportEventIdRef.current);
      transportEventIdRef.current = null;
    }
    Tone.Transport.stop();

    activeAutoplayNotesRef.current.forEach((note) => stopNote(note));
    activeAutoplayNotesRef.current = [];
    setIsPlayingSheet(false);
    setCurrentSheetIndex(-1);
  };

  const getPrecedingWhiteKeyIndex = (blackNote: string): number => {
    const octave = blackNote.slice(-1);
    const noteName = blackNote.slice(0, -1);
    let precedingNoteName = "";
    if (noteName === "C#") precedingNoteName = "C";
    else if (noteName === "D#") precedingNoteName = "D";
    else if (noteName === "F#") precedingNoteName = "F";
    else if (noteName === "G#") precedingNoteName = "G";
    else if (noteName === "A#") precedingNoteName = "A";
    const precedingWhiteNote = precedingNoteName + octave;
    const whiteIndex = whiteKeys.findIndex((w) => w.note === precedingWhiteNote);
    return whiteIndex >= 0 ? whiteIndex : 0;
  };

  const bentoCardStyle: React.CSSProperties = {
    backgroundColor: darkMode ? "rgba(24, 24, 27, 0.65)" : "rgba(253, 242, 248, 0.65)",
    backdropFilter: "blur(12px) saturate(140%)",
    WebkitBackdropFilter: "blur(12px) saturate(140%)",
    border: darkMode ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(247, 227, 235, 0.5)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
  };

  const blackKeyWidthPercent = 1.6;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-10" id="piano-app-root">
      <div
        style={bentoCardStyle}
        className="relative rounded-[40px] p-6 md:p-10 overflow-hidden transition-all duration-300 flex flex-col gap-6 md:gap-8"
        id="piano-bento-container"
      >
        {/* --- Header & Status Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6" id="piano-header">
          <div>
            <h1
              className={`text-4xl md:text-5xl font-serif font-semibold leading-tight tracking-tight flex items-center gap-3 ${
                darkMode ? "text-amber-100/90" : "text-[#4a3a3a]"
              }`}
              id="piano-main-title"
            >
              <Music className={`w-8 h-8 md:w-10 md:h-10 ${darkMode ? "text-amber-100/90" : "text-[#4a3a3a]"}`} /> Grand Virtuoso
            </h1>
            <p
              className={`font-sans text-sm uppercase tracking-[0.2em] mt-2 font-semibold ${
                darkMode ? "text-neutral-400" : "text-[#7a6a6a]"
              }`}
              id="piano-sub-title"
            >
              Professional Audio Sampler & Keyboard
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:gap-6" id="piano-indicators">
            <div className="flex flex-col items-end">
              <span className={`font-sans text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Engine Status</span>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${engineStarted ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"}`}></span>
                {engineStarted ? (
                  <button
                    onClick={stopPianoEngine}
                    className="font-sans text-xs text-red-500 hover:text-red-600 font-bold uppercase underline tracking-wider cursor-pointer outline-none border-none bg-transparent select-none p-0"
                    title="Shut down audio synthesis threads"
                  >
                    Disconnect Engine
                  </button>
                ) : (
                  <button
                    onClick={startPianoEngine}
                    className={`font-sans text-xs font-bold uppercase underline tracking-wider cursor-pointer outline-none border-none bg-transparent select-none p-0 ${
                      darkMode ? "text-amber-200 hover:text-amber-100" : "text-[#4a3a3a] hover:text-stone-800"
                    }`}
                    title="Initialize Web Audio API Context"
                  >
                    Connect Engine
                  </button>
                )}
              </div>
            </div>

            <div className={`flex flex-col items-end border-l pl-4 md:pl-6 ${darkMode ? "border-neutral-800" : "border-pink-200/50"}`}>
              <span className={`font-sans text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Acoustic Samples</span>
              <div className={`flex items-center space-x-1.5 text-xs font-semibold ${darkMode ? "text-neutral-200" : "text-[#4a3a3a]"}`}>
                {isLoaded ? (
                  <>
                    <span className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse" />
                    <span>Ready</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span className={darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}>Downloading...</span>
                  </>
                )}
              </div>
            </div>

            <div className={`flex flex-col items-end border-l pl-4 md:pl-6 ${darkMode ? "border-neutral-800" : "border-pink-200/50"}`}>
              <span className={`font-sans text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Instrument Preset</span>
              <span className={`font-sans text-xs font-semibold capitalize flex items-center gap-1 ${darkMode ? "text-neutral-200" : "text-[#4a3a3a]"}`}>
                <Layers className={`w-3.5 h-3.5 ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`} />
                {instrument === "piano" ? "Grand Piano" : instrument === "musicbox" ? "Celestial Music Box" : "Ambient Pad"}
              </span>
            </div>

            <div className={`flex flex-col items-end border-l pl-4 md:pl-6 ${darkMode ? "border-neutral-800" : "border-pink-200/50"}`}>
              <span className={`font-sans text-[10px] uppercase font-bold mb-1 ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Couple Duo Sync</span>
              <button
                onClick={() => setShowConfigModal(true)}
                className={`flex items-center space-x-1.5 text-xs font-semibold hover:opacity-80 active:scale-95 transition-all select-none cursor-pointer outline-none border-none bg-transparent ${
                  darkMode ? "text-neutral-200" : "text-[#4a3a3a]"
                }`}
                title="Duo Config"
              >
                {!isFirebaseConfigured ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-stone-400" />
                    <span className={`${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"} hover:underline`}>Solo Mode</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span className={`${darkMode ? "text-emerald-400" : "text-emerald-700"} font-bold hover:underline`}>Duo Connected</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- Session Recorder Module --- */}
        <div
          className={`flex flex-col sm:flex-row justify-between items-center gap-4 p-4 md:p-5 rounded-3xl border shadow-sm transition-all duration-300 ${
            darkMode
              ? "bg-neutral-900/40 border-neutral-800"
              : "bg-[#fbf5f2]/85 border-orange-100/30"
          }`}
          id="piano-recorder-bar"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
              darkMode ? "bg-neutral-800 text-rose-400" : "bg-rose-50 text-rose-500"
            }`}>
              <Disc className={`w-5 h-5 ${isRecording ? "animate-pulse text-red-500" : ""}`} />
            </div>
            <div>
              <p className={`text-xs font-bold ${darkMode ? "text-neutral-200" : "text-[#5a4a4a]"}`}>Performance Recorder</p>
              <p className={`text-[10px] uppercase tracking-wider font-semibold ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>
                {isRecording
                  ? "Recording audio feed..."
                  : isPlayingRecording
                    ? "Playing back recorded tape..."
                    : recordedEvents.length > 0
                      ? `${recordedEvents.length} events inside buffer`
                      : "Tap record to start recording"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {!isRecording ? (
              <button
                onClick={() => {
                  stopRecordingPlayback();
                  setRecordedEvents([]);
                  recordingStartTimeRef.current = performance.now();
                  setIsRecording(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer outline-none border-none select-none"
              >
                <Disc className="w-3.5 h-3.5" /> Record
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsRecording(false);
                  recordingStartTimeRef.current = null;
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer outline-none border-none select-none animate-pulse"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            )}

            {recordedEvents.length > 0 && !isRecording && (
              <>
                {!isPlayingRecording ? (
                  <button
                    onClick={playRecording}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#E6C594] hover:bg-[#ebd2aa] text-stone-900 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer outline-none border-none select-none"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Playback
                  </button>
                ) : (
                  <button
                    onClick={stopRecordingPlayback}
                    className="flex items-center gap-1.5 px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer outline-none border-none select-none"
                  >
                    <Square className="w-3.5 h-3.5" /> Stop Tape
                  </button>
                )}

                <button
                  onClick={handleExportMidi}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer outline-none border-none select-none"
                  title="Export MIDI binary file"
                >
                  <Download className="w-3.5 h-3.5" /> Export MIDI
                </button>

                <button
                  onClick={() => {
                    stopRecordingPlayback();
                    setRecordedEvents([]);
                  }}
                  className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all cursor-pointer outline-none border-none select-none ${
                    darkMode ? "bg-neutral-800 hover:bg-red-950/40 text-red-400" : "bg-stone-100 hover:bg-red-50 hover:text-red-500 text-[#8a7a7a]"
                  }`}
                  title="Delete Recording"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* --- Settings Panel --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="piano-settings-grid">
          <div className={`lg:col-span-8 rounded-3xl p-5 md:p-6 border flex flex-col gap-6 ${
            darkMode ? "bg-neutral-900/40 border-neutral-800" : "bg-white/50 border-stone-200/40"
          }`} id="piano-synth-bento">
            <div className={`flex flex-wrap items-center justify-between gap-4 border-b pb-4 ${
              darkMode ? "border-neutral-800" : "border-stone-100"
            }`}>
              <span className={`text-sm font-bold flex items-center gap-2 ${darkMode ? "text-amber-100/90" : "text-[#5a4a4a]"}`}>
                <Keyboard className="w-4 h-4" /> Keyboard Engine Controls
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer outline-none border ${showNotes
                    ? "bg-[#E6C594] text-stone-900 !text-stone-900 border-[#E6C594]"
                    : darkMode
                      ? "bg-neutral-800 text-neutral-300 border-neutral-750 hover:bg-neutral-750"
                      : "bg-stone-50 text-[#8a7a7a] border-stone-200/50 hover:bg-stone-100"
                    }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer outline-none border ${showKeys
                    ? "bg-[#E6C594] text-stone-900 !text-stone-900 border-[#E6C594]"
                    : darkMode
                      ? "bg-neutral-800 text-neutral-300 border-neutral-750 hover:bg-neutral-750"
                      : "bg-stone-50 text-[#8a7a7a] border-stone-200/50 hover:bg-stone-100"
                    }`}
                >
                  Keycap Caps
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Instrument Preset</label>
                <div className="flex flex-col gap-1.5">
                  {(["piano", "musicbox", "pad"] as const).map((inst) => (
                    <button
                      key={inst}
                      onClick={() => handleSetInstrument(inst)}
                      className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all cursor-pointer select-none outline-none border ${instrument === inst
                        ? "bg-[#E6C594] text-stone-900 !text-stone-900 border-[#E6C594] shadow-inner"
                        : darkMode
                          ? "bg-neutral-800/40 text-neutral-300 border-neutral-750 hover:bg-neutral-800 hover:text-neutral-100"
                          : "bg-white text-[#7a6a6a] border-stone-200/50 hover:bg-stone-50 hover:text-stone-800"
                        }`}
                    >
                      {inst === "piano" ? "🎹 Grand Acoustic Piano" : inst === "musicbox" ? "✨ Celestial Music Box" : "🌫️ Ambient String Pad"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className={`text-[10px] uppercase font-bold tracking-wider mb-2 block ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Pitch Transposition</label>
                  <div className={`flex items-center rounded-2xl border p-1 w-full justify-between ${
                    darkMode ? "bg-neutral-800/60 border-neutral-750" : "bg-white border-stone-200/50"
                  }`}>
                    <button
                      onClick={() => setTranspose((t) => Math.max(-12, t - 1))}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer select-none outline-none border-none ${
                        darkMode ? "bg-neutral-750 hover:bg-neutral-700 text-neutral-200" : "bg-stone-50 hover:bg-stone-100 text-stone-700"
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-black ${darkMode ? "text-neutral-200" : "text-stone-800"}`}>
                        {transpose > 0 ? `+${transpose}` : transpose}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Semitones</span>
                    </div>
                    <button
                      onClick={() => setTranspose((t) => Math.min(12, t + 1))}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer select-none outline-none border-none ${
                        darkMode ? "bg-neutral-750 hover:bg-neutral-700 text-neutral-200" : "bg-stone-50 hover:bg-stone-100 text-stone-700"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {transpose !== 0 && (
                    <button
                      onClick={() => setTranspose(0)}
                      className={`mt-1.5 text-[9px] flex items-center gap-1 font-bold underline select-none cursor-pointer outline-none border-none bg-transparent ${
                        darkMode ? "text-neutral-400 hover:text-neutral-200" : "text-[#8a7a7a] hover:text-stone-800"
                      }`}
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Reset transpose
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Volume Level</label>
                    <span className={`text-xs font-serif font-semibold ${darkMode ? "text-neutral-300" : "text-stone-700"}`}>{volume}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Volume2 className={`w-4 h-4 ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`} />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => handleSetVolume(Number(e.target.value))}
                      className={`w-full accent-[#E6C594] h-1.5 rounded-lg cursor-pointer ${
                        darkMode ? "bg-neutral-800" : "bg-stone-100"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <label className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Damper Sustain Pedal</label>
                <div
                  className={`flex-1 rounded-2xl p-4 flex flex-col justify-between border transition-all ${
                    sustainActive
                      ? darkMode
                        ? "bg-amber-950/20 border-[#E6C594]/40 shadow-inner text-amber-200/90"
                        : "bg-amber-50/80 border-[#E6C594]/60 shadow-inner text-[#7c5e2e]"
                      : darkMode
                        ? "bg-neutral-800/40 border-neutral-700 text-neutral-400"
                        : "bg-white border-stone-200/50 text-[#7a6a6a]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold leading-normal">
                      {sustainActive ? "Damper Open (Latching)" : "Pedal Inactive"}
                    </span>
                    <button
                      onClick={() => setSustainLocked(!sustainLocked)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer outline-none border border-none ${
                        sustainLocked
                          ? "bg-[#E6C594] text-stone-900 !text-stone-900"
                          : darkMode
                            ? "bg-neutral-700 hover:bg-neutral-650 text-neutral-300"
                            : "bg-stone-50 hover:bg-stone-100 text-stone-600"
                      }`}
                      title={sustainLocked ? "Unlock Sustain Pedal" : "Lock Sustain Pedal (Latching)"}
                    >
                      {sustainLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className={`text-[9px] leading-relaxed mt-2 ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>
                    Press <span className={`px-1.5 py-0.5 rounded border font-mono font-bold ${
                      darkMode ? "bg-neutral-800 border-neutral-700 text-neutral-300" : "bg-stone-100 border-stone-200 text-stone-600"
                    }`}>Spacebar</span> to sustain notes dynamically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`lg:col-span-4 rounded-3xl p-5 md:p-6 border flex flex-col gap-4 ${
            darkMode ? "bg-neutral-900/40 border-neutral-800" : "bg-white/50 border-stone-200/40"
          }`} id="piano-sheets-bento">
            <div className={`flex items-center justify-between border-b pb-3 ${
              darkMode ? "border-neutral-800" : "border-stone-100"
            }`}>
              <span className={`text-sm font-bold flex items-center gap-2 ${darkMode ? "text-amber-100/90" : "text-[#5a4a4a]"}`}>
                <BookOpen className="w-4 h-4" /> Song Sheets Preset
              </span>
              <button
                onClick={() => setSheetPanelExpanded(!sheetPanelExpanded)}
                className={`transition-all select-none cursor-pointer outline-none border-none bg-transparent ${
                  darkMode ? "text-neutral-400 hover:text-neutral-250" : "text-stone-50 hover:text-stone-800"
                }`}
              >
                {sheetPanelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {sheetPanelExpanded && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Song Presets</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SHEET_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          stopSheetPlayback();
                          setSheetText(preset.notes);
                          setCurrentSheetIndex(-1);
                        }}
                        className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold transition-all text-left truncate cursor-pointer outline-none select-none ${
                          darkMode
                            ? "bg-neutral-800/40 border-neutral-750 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                            : "bg-white border-stone-200/40 text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                        }`}
                        title={preset.name}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Interactive Feed</label>
                    <span className={`text-[9px] font-bold uppercase ${darkMode ? "text-neutral-400" : "text-stone-500"}`}>Step index: {currentSheetIndex >= 0 ? currentSheetIndex + 1 : "-"}</span>
                  </div>
                  <textarea
                    value={sheetText}
                    onChange={(e) => {
                      stopSheetPlayback();
                      setSheetText(e.target.value);
                    }}
                    placeholder="Enter sheet code sequence..."
                    className={`w-full h-16 rounded-xl border p-2.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#E6C594] ${
                      darkMode ? "bg-neutral-800/60 border-neutral-750 text-neutral-200" : "bg-white border-stone-200/40 text-stone-800"
                    }`}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className={`text-[10px] uppercase font-bold tracking-wider mb-1 block ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Speed ({playSpeed}x)</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={playSpeed}
                      onChange={(e) => setPlaySpeed(Number(e.target.value))}
                      className={`w-full accent-[#E6C594] h-1 rounded-lg cursor-pointer ${
                        darkMode ? "bg-neutral-800" : "bg-stone-100"
                      }`}
                    />
                  </div>
                  <div className="flex gap-1">
                    {!isPlayingSheet ? (
                      <button
                        onClick={startSheetPlayback}
                        className="px-4 py-2.5 bg-[#E6C594] text-stone-900 !text-stone-900 rounded-xl text-xs font-bold hover:bg-[#ebd2aa] transition-all cursor-pointer outline-none border-none select-none"
                      >
                        Autoplay
                      </button>
                    ) : (
                      <button
                        onClick={stopSheetPlayback}
                        className="px-4 py-2.5 bg-stone-700 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer outline-none border-none select-none"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Keyboard Virtual Surface --- */}
        <div className="flex flex-col relative" id="piano-interactive-keyboard-surface">
          {!engineStarted && (
            <div className={`absolute inset-0 z-40 backdrop-blur-md rounded-3xl flex flex-col justify-center items-center p-6 border ${
              darkMode ? "bg-black/70 border-neutral-800" : "bg-white/70 border-stone-200/30"
            }`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-[#CBB084] shadow-inner ${
                darkMode ? "bg-neutral-800" : "bg-amber-50"
              }`}>
                <Music className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-serif font-semibold ${darkMode ? "text-amber-100" : "text-[#4a3a3a]"}`}>Unlock Audio Engine</h3>
              <p className={`text-xs mt-1 text-center max-w-sm ${darkMode ? "text-neutral-400" : "text-[#7a6a6a]"}`}>
                Interact with the Grand Virtuoso for acoustic samples and our melody sync.
              </p>
              
              <div className="mt-4 flex items-center gap-2 text-xs font-medium">
                {isLoaded ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Premium Acoustic Samples Pre-loaded & Ready! ✨
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    Pre-loading Premium Salamander Samples... (Synth fallback ready)
                  </span>
                )}
              </div>

              <button
                onClick={startPianoEngine}
                className="mt-6 px-8 py-3 bg-[#E6C594] hover:bg-[#ebd2aa] text-stone-900 !text-stone-900 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer outline-none border-none select-none"
              >
                Connect Audio Engine
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <span className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? "text-neutral-400" : "text-[#8a7a7a]"}`}>Interactive Ivory Keys (88 Standard)</span>
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className={`p-1.5 rounded-lg transition-all cursor-pointer outline-none border-none select-none ${
                  darkMode ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-300" : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                }`}
                title={isMaximized ? "Minimize Keyboard Layout" : "Maximize & Lock Browser Shortcuts"}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div
            ref={viewportRef}
            onTouchStart={handleTouchTrack}
            onTouchMove={handleTouchTrack}
            onTouchEnd={handleTouchEnd}
            className={`w-full relative select-none flex items-stretch border rounded-2xl overflow-x-auto overflow-y-hidden shadow-2xl p-1 ${
              isMaximized
                ? darkMode ? "fixed inset-x-0 bottom-0 z-50 h-[65vh] p-4 bg-neutral-900" : "fixed inset-x-0 bottom-0 z-50 h-[65vh] p-4 bg-white"
                : darkMode ? "bg-neutral-950/40 border-neutral-800" : "bg-stone-100 border-stone-300"
            }`}
            style={{ touchAction: "none" }}
            id="piano-keys-scroller"
          >
            <div className="flex-1 flex min-w-[700px] h-full relative" style={{ touchAction: "none" }}>
              {whiteKeys.map((k) => (
                <WhitePianoKey
                  key={k.note}
                  note={k.note}
                  charKey={k.key}
                  showKeys={showKeys}
                  showNotes={showNotes}
                  playNote={playNote}
                  stopNote={stopNote}
                  isMaximized={isMaximized}
                  darkMode={darkMode}
                />
              ))}

              {blackKeys.map((k) => {
                const precedingWhiteIdx = getPrecedingWhiteKeyIndex(k.note);
                const precedingWhitePercent = (precedingWhiteIdx / whiteKeys.length) * 100;
                const leftOffset = precedingWhitePercent + (100 / whiteKeys.length);
                return (
                  <BlackPianoKey
                    key={k.note}
                    note={k.note}
                    charKey={k.key}
                    showKeys={showKeys}
                    showNotes={showNotes}
                    playNote={playNote}
                    stopNote={stopNote}
                    leftOffset={leftOffset}
                    blackKeyWidthPercent={blackKeyWidthPercent}
                    isMaximized={isMaximized}
                    darkMode={darkMode}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- RTDB Error Banner: menampilkan kegagalan read/write yang biasanya disebabkan Security Rules atau databaseURL salah --- */}
      {rtdbError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-red-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md">
          <span>⚠️ {rtdbError}</span>
          <button onClick={() => setRtdbError(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* --- Couple Duo Configuration Modal --- */}
      {showConfigModal && (
        <div className="fixed inset-0 glass-modal-backdrop flex items-center justify-center p-4 z-50 select-none">
          <div className="glass-modal-content rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-[var(--text-main)]">
               <Wifi className="w-5 h-5 text-emerald-500 animate-pulse" /> Couple Session Configuration
             </h3>
             <p className="text-xs mt-2 leading-relaxed text-[var(--text-secondary)]">
               Connect with your partner in real time using Firebase Realtime Database. Realtime Database sockets transmit notes with minimal latency and minimal data footprint.
             </p>
 
             <div className="mt-5 space-y-4">
               <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent dark:border-white/5">
                 <span className="text-[10px] uppercase font-bold tracking-wider block mb-1 text-[var(--text-muted)]">Session Socket Room Path</span>
                 <span className={`text-xs font-mono font-bold select-all ${darkMode ? "text-neutral-200" : "text-stone-800"}`}>/rooms/couple_piano_session/events</span>
               </div>
               <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-transparent dark:border-white/5">
                 <span className="text-[10px] uppercase font-bold tracking-wider block mb-1 text-[var(--text-muted)]">Local User identifier</span>
                 <span className="text-xs font-mono font-bold text-[var(--text-main)]">{localUserIdRef.current || "Loading ID..."}</span>
               </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-end">
              {isFirebaseConfigured && (
                <button
                  disabled={isClearingSync}
                  onClick={clearSyncDatabase}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer outline-none border-none select-none ${
                    darkMode ? "bg-neutral-800 hover:bg-red-950/40 text-neutral-400 hover:text-red-400" : "bg-stone-100 hover:bg-red-50 text-[#8a7a7a] hover:text-red-500"
                  }`}
                >
                  {isClearingSync ? "Purging events..." : "Clear Room Feed"}
                </button>
              )}
              <button
                onClick={() => setShowConfigModal(false)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  darkMode ? "bg-amber-100 hover:bg-amber-50 text-neutral-900" : "bg-stone-900 hover:bg-stone-800 text-white"
                }`}
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes key-ripple {
          0% {
            transform: scale(0.4);
            opacity: 0.95;
            filter: blur(1px);
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
            filter: blur(6px);
          }
        }
        .animate-key-ripple {
          animation: key-ripple 0.35s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }

        @keyframes float-heart {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--travel-x), var(--travel-y)) scale(1.2) rotate(var(--rotate));
            opacity: 0;
          }
        }
        .animate-float-heart {
          animation: float-heart 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes key-glow {
          0%, 100% {
            box-shadow: inset 0 6px 16px rgba(74, 58, 58, 0.35), 0 0 12px rgba(230, 197, 148, 0.4);
          }
          50% {
            box-shadow: 0 0 24px #FBBF24, 0 0 40px #EF4444;
            background-color: #FBBF24 !important;
          }
        }
        .harmony-glow-key {
          animation: key-glow 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}