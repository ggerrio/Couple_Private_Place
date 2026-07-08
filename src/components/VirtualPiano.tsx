import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { rtdb, isFirebaseConfigured } from "../firebaseClient";
import { ref, push, child, update, onChildAdded, off, onValue, serverTimestamp, get } from "firebase/database";
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

function setVisualKeyState(note: string, active: boolean, isBlack: boolean) {
  const el = document.getElementById(`key-${note}`);
  if (!el) return;
  if (active) {
    el.classList.add("text-stone-900", "font-bold", "translate-y-1.5", "border-b-[2px]", "border-b-stone-300/50", "border-t-4", "border-t-[#CBB084]");
    el.style.backgroundColor = "#E6C594";
    if (isBlack) {
      el.style.backgroundImage = "radial-gradient(circle at center bottom, #F3DAB0 0%, #E6C594 65%, #AE9263 100%)";
      el.style.boxShadow = "inset 0 4px 10px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(230, 197, 148, 0.5)";
    } else {
      el.style.backgroundImage = "radial-gradient(circle at center bottom, #F5DFB8 0%, #E6C594 70%, #CBB084 100%)";
      el.style.boxShadow = "inset 0 6px 16px rgba(74, 58, 58, 0.35), 0 0 12px rgba(230, 197, 148, 0.4)";
    }
    const ripple = el.querySelector(".ripple-container");
    if (ripple) ripple.classList.remove("hidden");
  } else {
    el.classList.remove("text-stone-900", "font-bold", "translate-y-1.5", "border-b-[2px]", "border-b-stone-300/50", "border-t-4", "border-t-[#CBB084]");
    el.style.backgroundColor = "";
    el.style.backgroundImage = "";
    el.style.boxShadow = "";
    const ripple = el.querySelector(".ripple-container");
    if (ripple) ripple.classList.add("hidden");
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
}: {
  note: string;
  charKey: string;
  showKeys: boolean;
  showNotes: boolean;
  playNote: (note: string) => void;
  stopNote: (note: string) => void;
  isMaximized?: boolean;
}) => {
  return (
    <button
      id={`key-${note}`}
      onMouseDown={() => playNote(note)}
      onMouseUp={() => stopNote(note)}
      onMouseLeave={() => stopNote(note)}
      className={`relative select-none outline-none border-r border-stone-300/60 rounded-b-xl flex flex-col justify-end items-center pb-4 text-center transition-[transform,background-color,box-shadow] duration-77 ease-out cursor-pointer group bg-gradient-to-b from-stone-100 via-white to-stone-50 hover:to-stone-100 text-stone-400 hover:text-stone-700 shadow-[0_4px_4px_rgba(0,0,0,0.1),_inset_0_2px_0_rgba(255,255,255,0.8)] border-b-[6px] border-b-stone-200/80 ${isMaximized ? "h-[55vh] sm:h-[60vh]" : "h-52 md:h-72"
        }`}
      style={{ width: "calc(100% / 36)" }}
    >
      <span className="ripple-container hidden absolute inset-0 pointer-events-none overflow-hidden rounded-b-xl flex items-center justify-center">
        <span className="absolute w-32 h-32 bg-gradient-to-r from-amber-200/40 via-white/50 to-amber-100/40 rounded-full animate-key-ripple" />
      </span>

      {showKeys && (
        <span className="text-[10px] uppercase font-sans tracking-tighter select-none block font-bold transition-opacity duration-150 relative z-10 opacity-40 group-hover:opacity-80 text-stone-600">
          {charKey}
        </span>
      )}
      {showNotes && (
        <span className="text-[9px] font-bold mt-1 select-none block font-serif transition-opacity duration-150 relative z-10 opacity-30 group-hover:opacity-60 text-stone-500">
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
}) => {
  return (
    <button
      id={`key-${note}`}
      onMouseDown={() => playNote(note)}
      onMouseUp={() => stopNote(note)}
      onMouseLeave={() => stopNote(note)}
      className={`absolute top-0 select-none outline-none rounded-b-md flex flex-col justify-end items-center pb-3 text-center pointer-events-auto transition-[transform,background-color,box-shadow] duration-77 ease-out cursor-pointer group bg-gradient-to-b from-stone-900 via-stone-950 to-black hover:from-stone-800 text-stone-200 hover:text-white shadow-[0_6px_10px_rgba(0,0,0,0.55),_inset_0_1px_1px_rgba(255,255,255,0.15)] border-t border-t-stone-800 border-x border-x-stone-900 ${isMaximized ? "h-[33vh] sm:h-[36vh]" : "h-[120px] md:h-[170px]"
        }`}
      style={{
        width: `${blackKeyWidthPercent}%`,
        left: `calc(${leftOffset}% - ${blackKeyWidthPercent / 2}%)`,
      }}
    >
      <span className="ripple-container hidden absolute inset-0 pointer-events-none overflow-hidden rounded-b-md flex items-center justify-center">
        <span className="absolute w-16 h-16 bg-gradient-to-r from-amber-200/50 via-white/60 to-amber-100/50 rounded-full animate-key-ripple" />
      </span>

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
  const { session } = useCouple();
  const [engineStarted, setEngineStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClearingSync, setIsClearingSync] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);
  const [rtdbError, setRtdbError] = useState<string | null>(null);
  const pendingRemoteEventsRef = useRef<Array<() => void>>([]);
  const localUserIdRef = useRef<string>("");
  const pendingEventsRef = useRef<{ n: string; a: number; u: string; t: any }[]>([]);
  const throttleTimeoutRef = useRef<any | null>(null);
  const loadTimeRef = useRef<number>(Date.now());

  // Monitor status koneksi RTDB (membantu debugging sync issue)
  useEffect(() => {
    if (!isFirebaseConfigured || !rtdb) return;
    const connectedRef = ref(rtdb, ".info/connected");
    const unsub = onValue(connectedRef, (snap) => {
      const isConnected = snap.val() === true;
      console.log("[RTDB] Connection state:", isConnected ? "connected" : "disconnected");
      if (!isConnected) {
        setRtdbError("Real-time sync disconnected. Reconnecting...");
      } else if (rtdbError) {
        setRtdbError(null); // Clear error on reconnect
      }
    });
    return () => unsub();
  }, [rtdbError]);

  useEffect(() => {
    if (session?.uid) {
      localUserIdRef.current = session.uid;
    }
  }, [session]);

  const activeNotesRef = useRef<Record<string, boolean>>({});
  const lastNoteRef = useRef<string | null>(null);
  const activeVoicesRef = useRef<{ note: string; transposed: string }[]>([]);
  const transportEventIdRef = useRef<number | null>(null);

  const pushLocalEvent = React.useCallback((note: string, action: number) => {
    if (!isFirebaseConfigured || !rtdb) return;
    const userId = localUserIdRef.current;
    if (!userId) {
      console.warn("Cannot send piano event: user ID not available yet.");
      return;
    }

    pendingEventsRef.current.push({
      n: note,
      a: action,
      u: userId,
      t: serverTimestamp()
    });

    if (!throttleTimeoutRef.current) {
      throttleTimeoutRef.current = setTimeout(() => {
        throttleTimeoutRef.current = null;
        const events = [...pendingEventsRef.current];
        pendingEventsRef.current = [];

        if (events.length > 0 && rtdb) {
          const updates: Record<string, any> = {};
          events.forEach((evt) => {
            const newKey = push(child(ref(rtdb, "rooms/couple_piano_session/events"), "")).key;
            if (newKey) {
              updates[`rooms/couple_piano_session/events/${newKey}`] = evt;
            }
          });

          update(ref(rtdb), updates)
            .catch((err) => {
              setRtdbError("Sync write failed. Check security rules.");
              console.error("WRITE FAILED", err);
            });
        }
      }, 16);
    }
  }, []);

  const clearSyncDatabase = async () => {
    if (!rtdb) return;
    setIsClearingSync(true);
    try {
      const sessionRef = ref(rtdb, "rooms/couple_piano_session");
      const snapshot = await get(child(sessionRef, 'events'));
      if (snapshot.exists()) {
        await update(ref(rtdb), { "rooms/couple_piano_session/events": null });
        console.log("RTDB events cleared successfully.");
      }
      loadTimeRef.current = Date.now();
    } catch (err) {
      console.error("Failed to clear Firebase DB events:", err);
    } finally {
      setIsClearingSync(false);
    }
  };

  const [shiftPressed, setShiftPressed] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [volume, setVolume] = useState(80);

  const [transpose, setTranspose] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const [showKeys, setShowKeys] = useState(true);
  const [instrument, setInstrument] = useState<"piano" | "musicbox" | "pad">("piano");
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

  useEffect(() => {
    const gainNode = new Tone.Gain(volume / 100).toDestination();

    const reverb = new Tone.Reverb({
      decay: 3.0,
      wet: 0.35,
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
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.rampTo(volume / 100, 0.05);
    }
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

  const playNote = React.useCallback((note: string, time?: number, isRemote = false) => {
    if (!engineStartedRef.current) return;

    if (!isRemote) {
      physicallyPressedRef.current.add(note);
      if (isFirebaseConfigured && rtdb && localUserIdRef.current) {
        pushLocalEvent(note, 1);
      }
    }

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
    if (activeVoicesRef.current.length >= 32) {
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

    activeNotesRef.current[note] = true;
    const isBlack = note.includes("#");
    setVisualKeyState(note, true, isBlack);
  }, [pushLocalEvent]);

  const stopNote = React.useCallback((note: string, time?: number, isRemote = false) => {
    if (!engineStartedRef.current) return;

    if (!isRemote) {
      physicallyPressedRef.current.delete(note);
      if (isFirebaseConfigured && rtdb && localUserIdRef.current) {
        pushLocalEvent(note, 0);
      }
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
  }, [pushLocalEvent]);

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
        if (activeNotesRef.current[note] && !physicallyPressedRef.current.has(note) && !activeAutoplayNotesRef.current.includes(note)) {
          const isBlack = note.includes("#");
          setVisualKeyState(note, false, isBlack);
          activeNotesRef.current[note] = false;
          notesToRelease.push(note);
        }
      });

      if (notesToRelease.length > 0) {
        activeVoicesRef.current = activeVoicesRef.current.filter((v) => !notesToRelease.includes(v.note));

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
        setVolume((v) => Math.max(0, v - 5));
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault(); e.stopPropagation();
        setVolume((v) => Math.min(100, v + 5));
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

  // Firebase Realtime Stream setup
  useEffect(() => {
    if (!isFirebaseConfigured || !rtdb) return;

    loadTimeRef.current = Date.now();
    const eventsRef = ref(rtdb, "rooms/couple_piano_session/events");

    const listener = onChildAdded(
      eventsRef,
      (snapshot) => {
        const event = snapshot.val();
        if (!event || event.u === localUserIdRef.current) return;

        const eventTime = event.t || Date.now();
        if (eventTime < loadTimeRef.current - 2000) return;

        const applyEvent = () => {
          if (event.a === 1) playNote(event.n, undefined, true);
          else stopNote(event.n, undefined, true);
        };

        // Selalu coba aktifkan engine. Jika sudah aktif, tidak akan terjadi apa-apa.
        // Kemudian langsung mainkan event. Tidak perlu antrian atau banner.
        startPianoEngine().then(() => {
          if (engineStartedRef.current) applyEvent();
        });
      },
      (error) => {
        // Ini akan terpanggil kalau Security Rules menolak akses baca (permission_denied)
        console.error("[RTDB] onChildAdded DITOLAK / gagal:", error.message);
        setRtdbError(`Gagal membaca data piano: ${error.message}`);
      }
    );

    return () => {
      off(eventsRef, "child_added", listener);
    };
  }, [playNote, stopNote]);

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
    backgroundColor: "rgba(253, 242, 248, 0.65)",
    backdropFilter: "blur(12px) saturate(140%)",
    WebkitBackdropFilter: "blur(12px) saturate(140%)",
    border: "1px solid rgba(247, 227, 235, 0.5)",
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
              className="text-4xl md:text-5xl font-serif text-[#4a3a3a] font-semibold leading-tight tracking-tight flex items-center gap-3"
              id="piano-main-title"
            >
              <Music className="w-8 h-8 md:w-10 md:h-10 text-[#4a3a3a]" /> Grand Virtuoso
            </h1>
            <p
              className="font-sans text-sm text-[#7a6a6a] uppercase tracking-[0.2em] mt-2 font-semibold"
              id="piano-sub-title"
            >
              Professional Audio Sampler & Keyboard
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:gap-6" id="piano-indicators">
            <div className="flex flex-col items-end">
              <span className="font-sans text-[10px] text-[#8a7a7a] uppercase font-bold mb-1">Engine Status</span>
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
                    className="font-sans text-xs text-[#4a3a3a] hover:text-stone-800 font-bold uppercase underline tracking-wider cursor-pointer outline-none border-none bg-transparent select-none p-0"
                    title="Initialize Web Audio API Context"
                  >
                    Connect Engine
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end border-l border-pink-200/50 pl-4 md:pl-6">
              <span className="font-sans text-[10px] text-[#8a7a7a] uppercase font-bold mb-1">Acoustic Samples</span>
              <div className="flex items-center space-x-1.5 text-xs text-[#4a3a3a] font-semibold">
                {isLoaded ? (
                  <>
                    <span className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse" />
                    <span>Ready</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span className="text-[#8a7a7a]">Downloading...</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end border-l border-pink-200/50 pl-4 md:pl-6">
              <span className="font-sans text-[10px] text-[#8a7a7a] uppercase font-bold mb-1">Instrument Preset</span>
              <span className="font-sans text-xs text-[#4a3a3a] font-semibold capitalize flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#8a7a7a]" />
                {instrument === "piano" ? "Grand Piano" : instrument === "musicbox" ? "Celestial Music Box" : "Ambient Pad"}
              </span>
            </div>

            <div className="flex flex-col items-end border-l border-pink-200/50 pl-4 md:pl-6">
              <span className="font-sans text-[10px] text-[#8a7a7a] uppercase font-bold mb-1">Couple Duo Sync</span>
              <button
                onClick={() => setShowConfigModal(true)}
                className="flex items-center space-x-1.5 text-xs text-[#4a3a3a] font-semibold hover:opacity-80 active:scale-95 transition-all select-none cursor-pointer outline-none border-none bg-transparent"
                title="Duo Config"
              >
                {!isFirebaseConfigured ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-[#8a7a7a] hover:underline">Solo Mode</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                    <span className="text-emerald-700 font-bold hover:underline">Duo Connected</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- Session Recorder Module --- */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#fbf5f2]/85 p-4 md:p-5 rounded-3xl border border-orange-100/30 shadow-sm transition-all duration-300"
          id="piano-recorder-bar"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
              <Disc className={`w-5 h-5 ${isRecording ? "animate-pulse text-red-500" : ""}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#5a4a4a]">Performance Recorder</p>
              <p className="text-[10px] text-[#8a7a7a] uppercase tracking-wider font-semibold">
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
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-stone-100 hover:bg-red-50 hover:text-red-500 text-[#8a7a7a] transition-all cursor-pointer outline-none border-none select-none"
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
          <div className="lg:col-span-8 bg-white/50 rounded-3xl p-5 md:p-6 border border-stone-200/40 flex flex-col gap-6" id="piano-synth-bento">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <span className="text-sm font-bold text-[#5a4a4a] flex items-center gap-2">
                <Keyboard className="w-4 h-4" /> Keyboard Engine Controls
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer outline-none border ${showNotes
                    ? "bg-[#E6C594] text-stone-900 border-[#E6C594]"
                    : "bg-stone-50 text-[#8a7a7a] border-stone-200/50 hover:bg-stone-100"
                    }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer outline-none border ${showKeys
                    ? "bg-[#E6C594] text-stone-900 border-[#E6C594]"
                    : "bg-stone-50 text-[#8a7a7a] border-stone-200/50 hover:bg-stone-100"
                    }`}
                >
                  Keycap Caps
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex flex-col">
                <label className="text-[10px] text-[#8a7a7a] uppercase font-bold tracking-wider mb-2">Instrument Preset</label>
                <div className="flex flex-col gap-1.5">
                  {(["piano", "musicbox", "pad"] as const).map((inst) => (
                    <button
                      key={inst}
                      onClick={() => setInstrument(inst)}
                      className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-bold transition-all cursor-pointer select-none outline-none border ${instrument === inst
                        ? "bg-[#E6C594] text-stone-900 border-[#E6C594] shadow-inner"
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
                  <label className="text-[10px] text-[#8a7a7a] uppercase font-bold tracking-wider mb-2 block">Pitch Transposition</label>
                  <div className="flex items-center bg-white rounded-2xl border border-stone-200/50 p-1 w-full justify-between">
                    <button
                      onClick={() => setTranspose((t) => Math.max(-12, t - 1))}
                      className="w-10 h-10 rounded-xl bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-700 transition-all cursor-pointer select-none outline-none border-none"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-stone-800">
                        {transpose > 0 ? `+${transpose}` : transpose}
                      </span>
                      <span className="text-[8px] text-[#8a7a7a] font-bold uppercase tracking-widest">Semitones</span>
                    </div>
                    <button
                      onClick={() => setTranspose((t) => Math.min(12, t + 1))}
                      className="w-10 h-10 rounded-xl bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-700 transition-all cursor-pointer select-none outline-none border-none"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {transpose !== 0 && (
                    <button
                      onClick={() => setTranspose(0)}
                      className="mt-1.5 text-[9px] text-[#8a7a7a] hover:text-stone-800 flex items-center gap-1 font-bold underline select-none cursor-pointer outline-none border-none bg-transparent"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Reset transpose
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-[#8a7a7a] uppercase font-bold tracking-wider">Volume Level</label>
                    <span className="text-xs font-serif font-semibold text-stone-700">{volume}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-[#8a7a7a]" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full accent-[#E6C594] h-1.5 bg-stone-100 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] text-[#8a7a7a] uppercase font-bold tracking-wider mb-2">Damper Sustain Pedal</label>
                <div
                  className={`flex-1 rounded-2xl p-4 flex flex-col justify-between border transition-all ${sustainActive
                    ? "bg-amber-50/80 border-[#E6C594]/60 shadow-inner text-[#7c5e2e]"
                    : "bg-white border-stone-200/50 text-[#7a6a6a]"
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold leading-normal">
                      {sustainActive ? "Damper Open (Latching)" : "Pedal Inactive"}
                    </span>
                    <button
                      onClick={() => setSustainLocked(!sustainLocked)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer outline-none border border-none ${sustainLocked
                        ? "bg-[#E6C594] text-stone-900"
                        : "bg-stone-50 hover:bg-stone-100 text-stone-600"
                        }`}
                      title={sustainLocked ? "Unlock Sustain Pedal" : "Lock Sustain Pedal (Latching)"}
                    >
                      {sustainLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[9px] text-[#8a7a7a] leading-relaxed mt-2">
                    Press <span className="px-1.5 py-0.5 rounded bg-stone-100 border font-mono font-bold text-stone-600">Spacebar</span> to sustain notes dynamically.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white/50 rounded-3xl p-5 md:p-6 border border-stone-200/40 flex flex-col gap-4" id="piano-sheets-bento">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-sm font-bold text-[#5a4a4a] flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Song Sheets Preset
              </span>
              <button
                onClick={() => setSheetPanelExpanded(!sheetPanelExpanded)}
                className="text-stone-500 hover:text-stone-800 transition-all select-none cursor-pointer outline-none border-none bg-transparent"
              >
                {sheetPanelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {sheetPanelExpanded && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-[#8a7a7a] uppercase font-bold tracking-wider">Song Presets</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SHEET_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          stopSheetPlayback();
                          setSheetText(preset.notes);
                          setCurrentSheetIndex(-1);
                        }}
                        className="py-2 px-2.5 rounded-xl bg-white border border-stone-200/40 text-[10px] font-bold text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition-all text-left truncate cursor-pointer outline-none select-none"
                        title={preset.name}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-[#8a7a7a] uppercase font-bold tracking-wider">Interactive Feed</label>
                    <span className="text-[9px] font-bold text-stone-500 uppercase">Step index: {currentSheetIndex >= 0 ? currentSheetIndex + 1 : "-"}</span>
                  </div>
                  <textarea
                    value={sheetText}
                    onChange={(e) => {
                      stopSheetPlayback();
                      setSheetText(e.target.value);
                    }}
                    placeholder="Enter sheet code sequence..."
                    className="w-full h-16 rounded-xl border border-stone-200/40 p-2.5 text-xs font-mono bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#E6C594]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-[#8a7a7a] uppercase font-bold tracking-wider mb-1 block">Speed ({playSpeed}x)</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={playSpeed}
                      onChange={(e) => setPlaySpeed(Number(e.target.value))}
                      className="w-full accent-[#E6C594] h-1 bg-stone-100 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-1">
                    {!isPlayingSheet ? (
                      <button
                        onClick={startSheetPlayback}
                        className="px-4 py-2.5 bg-[#E6C594] text-stone-900 rounded-xl text-xs font-bold hover:bg-[#ebd2aa] transition-all cursor-pointer outline-none border-none select-none"
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
            <div className="absolute inset-0 z-40 bg-white/70 backdrop-blur-md rounded-3xl flex flex-col justify-center items-center p-6 border border-stone-200/30">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 text-[#CBB084] shadow-inner">
                <Music className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif text-[#4a3a3a] font-semibold">Unlock Audio Engine</h3>
              <p className="text-xs text-[#7a6a6a] mt-1 text-center max-w-sm">
                Interact with the Grand Virtuoso for acoustic samples and our melody sync.
              </p>
              <button
                onClick={startPianoEngine}
                className="mt-6 px-8 py-3 bg-[#E6C594] hover:bg-[#ebd2aa] text-stone-900 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer outline-none border-none select-none"
              >
                Connect Audio Engine
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] text-[#8a7a7a] uppercase font-bold tracking-wider">Interactive Ivory Keys (88 Standard)</span>
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 transition-all cursor-pointer outline-none border-none select-none"
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
            className={`w-full relative select-none flex items-stretch border border-stone-300 rounded-2xl overflow-x-auto overflow-y-hidden shadow-2xl p-1 bg-stone-100 ${isMaximized ? "fixed inset-x-0 bottom-0 z-50 h-[65vh] p-4 bg-white" : ""
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white rounded-[32px] p-6 max-w-md w-full border border-pink-100/50 shadow-2xl">
            <h3 className="text-xl font-serif text-[#4a3a3a] font-semibold flex items-center gap-2">
              <Wifi className="w-5 h-5 text-emerald-500 animate-pulse" /> Couple Session Configuration
            </h3>
            <p className="text-xs text-[#7a6a6a] mt-2 leading-relaxed">
              Connect with your partner in real time using Firebase Realtime Database. Realtime Database sockets transmit notes with minimal latency and minimal data footprint.
            </p>

            <div className="mt-5 space-y-4">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/50">
                <span className="text-[10px] text-[#8a7a7a] uppercase font-bold tracking-wider block mb-1">Session Socket Room Path</span>
                <span className="text-xs font-mono font-bold text-stone-800 select-all">/rooms/couple_piano_session/events</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/50">
                <span className="text-[10px] text-[#8a7a7a] uppercase font-bold tracking-wider block mb-1">Local User identifier</span>
                <span className="text-xs font-mono font-bold text-stone-800">{localUserIdRef.current || "Loading ID..."}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-end">
              {isFirebaseConfigured && (
                <button
                  disabled={isClearingSync}
                  onClick={clearSyncDatabase}
                  className="px-4 py-2 bg-stone-100 hover:bg-red-50 text-[#8a7a7a] hover:text-red-500 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer outline-none border-none select-none"
                >
                  {isClearingSync ? "Purging events..." : "Clear Room Feed"}
                </button>
              )}
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}