/**
 * App.tsx — rebuilt from zero.
 *
 * Fixes:
 *  - backgroundImage + backgroundColor as separate props (no shorthand `background` clash with Tailwind class)
 *  - ambient color derived from song title+artist only (not full Song object) — progress ticks don't trigger recompute
 */

import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";

import { CoupleProvider, useCouple } from "./context/CoupleContext";

// Code-split each view — only the active room's bundle loads on first visit
const HomeView = React.lazy(() => import("./components/HomeView"));
const MemoriesView = React.lazy(() => import("./components/MemoriesView"));
const TogetherView = React.lazy(() => import("./components/TogetherView"));
const PlayView = React.lazy(() => import("./components/PlayView"));
const AdventureView = React.lazy(() => import("./components/AdventureView"));
const SettingsView = React.lazy(() => import("./components/SettingsView"));

import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import LoginView from "./components/LoginView";
import OnboardingView from "./components/OnboardingView";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { OptimizedImage } from "./components/common/OptimizedImage";
import { motion, AnimatePresence } from "motion/react";
import { Home, Camera, Mail, Gamepad2, Settings, Sparkles, X, Sun, Moon, Heart, Smile, Dice5 } from "lucide-react";
import { NightAmbient, ConfettiEffect, useConfetti, WeatherBadge, WeatherNotificationController } from "./components/emotional";
import { ScrapbookStickers } from "./components/scrapbook";

import gnLogo from "../logo/ger_n_nic_small.webp";
import { triggerHaptic } from "./lib/haptics";
import { formatLastSeen } from "./lib/utils";

import { getDb } from "./firebaseClient";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { LatencyOverlay } from "./components/dev/LatencyOverlay";
import { isLatencyOverlayEnabled, record as recordLatency } from "./utils/latencyTracker";
import { useBirthdayTrigger, BirthdayReplayButton } from "./experiences/birthday";
import { isDemoMode } from "./utils/demoMode";
import DemoBadge from "./components/DemoBadge";

// Lazy-load the full Birthday Experience — keeps HomeView + baseline
// bundle unchanged. Clicking the replay button pulls in this chunk.
const BirthdayExperienceLazy = React.lazy(() =>
  import("./experiences/birthday/BirthdayExperience").then((m) => ({
    default: m.BirthdayExperience,
  })),
);

// DEV-only sandbox shortcut — lets the test engineer open the
// birthday experience without any auth. Renders OUTSIDE the
// CoupleProvider tree so the existing LoginView + useAuthState
// flow remains untouched in every other code path. Tree-shaken
// completely in production builds because the only entry point
// is gated by `import.meta.env.DEV` below.
type SandboxMode = { recipientNameOverride?: string };
const SandboxPageLazy = React.lazy(() =>
  import("./experiences/birthday/SandboxPage").then((m) => {
    const Bound = ({
      recipientNameOverride,
    }: SandboxMode) => (
      <m.SandboxPage recipientNameOverride={recipientNameOverride} />
    );
    Bound.displayName = "SandboxPageLazy";
    return { default: Bound };
  }),
);

type TabId = "home" | "memories" | "together" | "play" | "adventure" | "settings";

const TAB_IDS: TabId[] = ["home", "memories", "together", "play", "adventure", "settings"];

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "The Foyer", icon: Home },
  { id: "memories", label: "Our Archive", icon: Camera },
  { id: "together", label: "The Heartbeat", icon: Mail },
  { id: "play", label: "Game Attic", icon: Gamepad2 },
  { id: "adventure", label: "Date Night", icon: Dice5 },
  { id: "settings", label: "Workshop", icon: Settings },
];// Room identity metadata for arrival labels, spatial hierarchy, and hover tooltips
const ROOM_METADATA: Record<TabId, { name: string; subtitle: string }> = {
  home: { name: "The Foyer", subtitle: "Where you both belong" },
  memories: { name: "Our Archive", subtitle: "Photographs and keepsakes" },
  together: { name: "The Heartbeat", subtitle: "Words from the heart" },
  play: { name: "Game Attic", subtitle: "Play and laughter" },
  adventure: { name: "Date Night", subtitle: "Tonight's pick, synced across screens" },
  settings: { name: "Workshop", subtitle: "Tinker and personalize" },
};

// Stable map: song identity string → ambient hex — avoids re-deriving on every progress tick
function songAmbientColor(title: string, artist: string): string {
  const t = title.toLowerCase();
  if (t.includes("somethin' stupid")) return "#ef4444";
  if (t.includes("dream a little dream")) return "#8b5cf6";
  if (t.includes("rayuan perempuan gila")) return "#f59e0b";
  if (t.includes("good looking")) return "#06b6d4";
  if (t.includes("let the light in")) return "#ec4899";
  if (t.includes("shades of cool")) return "#10b981";
  if (t.includes("brooklyn baby")) return "#3b82f6";
  if (t.includes("say yes to heaven")) return "#f43f5e";
  const palette = ["#ef4444", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#10b981", "#3b82f6", "#f43f5e"];
  let hash = 0;
  for (let i = 0; i < (title + artist).length; i++) hash = (title + artist).charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ── Global unhandled promise rejection handler ──────────────────────────
// Prevents AbortErrors from motion animation interruptions and
// browser-extension-blocked fetch calls from bubbling up as "Uncaught"
// errors that can interfere with React's navigation/render cycle.
function setupGlobalErrorHandler() {
  const handler = (event: PromiseRejectionEvent) => {
    if (
      event.reason instanceof DOMException &&
      event.reason.name === "AbortError"
    ) {
      event.preventDefault();
      return;
    }
    // Also catch generic fetch failures caused by browser extensions
    if (
      event.reason instanceof TypeError &&
      event.reason.message === "Failed to fetch"
    ) {
      event.preventDefault();
      return;
    }
    // Also catch "message channel closed" errors from YouTube iframe postMessage
    if (
      event.reason instanceof Error &&
      typeof event.reason.message === "string" &&
      event.reason.message.includes("message channel closed")
    ) {
      event.preventDefault();
      return;
    }
    // Log other unhandled rejections for debugging (but don't suppress)
    console.warn("[App] Unhandled promise rejection:", event.reason?.name, event.reason?.message);
  };
  window.addEventListener("unhandledrejection", handler);
  return () => window.removeEventListener("unhandledrejection", handler);
}

function AppContent({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (tab: TabId) => void }) {
  // ── Global error handler for promise rejections ──────────────────────
  useEffect(setupGlobalErrorHandler, []);

  const { 
    session, currentUser, userA, userB, darkMode, toggleDarkMode, 
    activeSurprise, setActiveSurprise, isOnboarding, currentSong, 
    setSongPlayState, anniversaryDate, birthdayA, birthdayB, 
    fontTheme, colorTheme, updateProfile, addMoodHistoryEntry, addActivity 
  } = useCouple();

  const [now, setNow] = useState(Date.now());
  // ── Birthday Experience trigger — manual by default, no auto-launch ──
  // Set autoFireOnBirthday=true if you want a one-time popup on Nicola's day.
  const birthday = useBirthdayTrigger({
    birthdayMmDd: birthdayB,
    autoFireOnBirthday: false,
  });
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  const isOnlineA = useMemo(() => {
    if (!userA.lastActive) return false;
    return now - userA.lastActive < 45000;
  }, [userA.lastActive, now]);

  const isOnlineB = useMemo(() => {
    if (!userB.lastActive) return false;
    return now - userB.lastActive < 45000;
  }, [userB.lastActive, now]);

  // Periodic online presence heartbeat
  useEffect(() => {
    if (!session || !currentUser || (currentUser !== "user_a" && currentUser !== "user_b")) return;
    
    // Initial heartbeat
    updateProfile(currentUser, { lastActive: Date.now() });

    const interval = setInterval(() => {
      updateProfile(currentUser, { lastActive: Date.now() });
    }, 15000); // every 15 seconds

    return () => clearInterval(interval);
  }, [session, currentUser, updateProfile]);

  const setActiveTab = onTabChange;
  const activeTabRef = useRef(activeTab);
  // Sync the ref whenever activeTab state changes
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  const [moodPickerAnchor, setMoodPickerAnchor] = useState<"user_a" | "user_b" | null>(null);

  const MOOD_PRESETS = useMemo(() => [
    { emoji: "😊", text: "Happy", status: "Feeling happy & bright 😊" },
    { emoji: "🥰", text: "Loved", status: "Full of love 🥰" },
    { emoji: "🍵", text: "Cozy", status: "Sipping matcha & cozy 🍵" },
    { emoji: "🥱", text: "Sleepy", status: "Getting sleepy 🥱" },
    { emoji: "💻", text: "Focus", status: "Deep in focus coding 💻" },
    { emoji: "🥳", text: "Hyped", status: "Super excited! 🥳" },
    { emoji: "🥺", text: "Needy", status: "Needs warm hugs 🥺" },
    { emoji: "🍿", text: "Chill", status: "Watching a movie 🍿" },
    { emoji: "📚", text: "Studying", status: "Hitting the books 📚" },
    { emoji: "☕", text: "Coffee", status: "Coffee mode on ☕" },
  ], []);

  const mainContainerRef = useRef<HTMLDivElement>(null);

  // ── Emotional experiences ────────────────────────────────────────────
  const { isTodayAnniversary, isTodayBirthday, setHasFiredToday } = useConfetti(anniversaryDate, birthdayA, birthdayB);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // Fire confetti on special days when the app first mounts
  useEffect(() => {
    if (isTodayAnniversary || isTodayBirthday) {
      const timer = setTimeout(() => {
        setConfettiTrigger((prev) => prev + 1);
        setHasFiredToday(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isTodayAnniversary, isTodayBirthday, setHasFiredToday]);

  const [navDirection, setNavDirection] = useState<1 | -1>(1);
  const [showNavbar, setShowNavbar] = useState(true);
  const [arrivalRoom, setArrivalRoom] = useState<string | null>(null);

  // Native browser scrolling enabled for maximum FPS and smooth performance
  useEffect(() => {
    // Lenis JS scroll intercept removed — native scrolling runs on GPU thread
  }, []);

  // Reset scroll to top instantly on tab switch
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Show room arrival label briefly when entering a new tab
  useEffect(() => {
    const meta = ROOM_METADATA[activeTab];
    if (meta) {
      setArrivalRoom(meta.name);
      const timer = setTimeout(() => setArrivalRoom(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Navigate to a tab using ref for current tab to avoid stale closures
  const handleTabClick = useCallback((tab: TabId) => {
    const current = activeTabRef.current;
    const prevIdx = TAB_IDS.indexOf(current);
    const nextIdx = TAB_IDS.indexOf(tab);
    if (nextIdx !== prevIdx) {
      setNavDirection(nextIdx > prevIdx ? 1 : -1);
    }
    setActiveTab(tab);
  }, []);

  const handleToggleDarkMode = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const css = `
      ::view-transition-group(root) {
        animation-duration: 0.8s;
        animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
      }
      ::view-transition-new(root) {
        animation-name: reveal-theme-transition;
        filter: blur(2px);
      }
      ::view-transition-old(root) {
        animation: none;
        z-index: -1;
      }
      @keyframes reveal-theme-transition {
        from {
          clip-path: circle(0px at ${x}px ${y}px);
          filter: blur(12px);
        }
        50% {
          filter: blur(6px);
        }
        to {
          clip-path: circle(${endRadius}px at ${x}px ${y}px);
          filter: blur(0px);
        }
      }
    `;

    let styleElement = document.getElementById("theme-transition-styles") as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "theme-transition-styles";
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;

    const docWithTransition = document as any;
    if (!docWithTransition.startViewTransition) {
      toggleDarkMode();
      return;
    }

    docWithTransition.startViewTransition(() => {
      toggleDarkMode();
    });
  };

  const playerIframeRef = useRef<HTMLIFrameElement>(null);

  // Memoize iframe source purely based on videoId.
  // This prevents the iframe from reloading when isPlaying changes, keeping the playback position intact.
  const iframeSrc = useMemo(() => {
    if (!currentSong.videoId) return "";
    return `https://www.youtube.com/embed/${currentSong.videoId}?autoplay=${currentSong.isPlaying ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong.videoId]);

  // Helper: safely send postMessage to YouTube player, catch channel-closed errors
  const safePostMessage = useCallback((msg: string) => {
    try {
      playerIframeRef.current?.contentWindow?.postMessage(msg, "*");
    } catch {
      // Ignore — YouTube iframe channel may close during navigation
    }
  }, []);

  // Send real play/pause commands to the already-loaded player
  useEffect(() => {
    const frame = playerIframeRef.current;
    if (!frame || !currentSong.videoId) return;
    const cmd = currentSong.isPlaying ? "playVideo" : "pauseVideo";
    const t = setTimeout(() => {
      safePostMessage(JSON.stringify({ event: "command", func: cmd, args: [] }));
    }, 250);
    return () => clearTimeout(t);
  }, [currentSong.isPlaying, currentSong.videoId, safePostMessage]);

  // Sync and pause global audio when partner plays a video in the co-watching theater
  // Uses dynamic import so Firestore SDK is only loaded after login
  useEffect(() => {
    if (!session) return;
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot } = await import("firebase/firestore");
      unsub = onSnapshot(doc(db, "rooms", "watch_room"), (d: any) => {
        if (d.exists() && d.data()) {
          const data = d.data();
          if (data.videoId && data.isPlaying) {
            setSongPlayState(false);
          }
        }
      }, (err) => {
        console.error("[watch room cross-tab sync]", err);
      });
    })();
    return () => { if (unsub) unsub(); };
  }, [session, setSongPlayState]);

  // ── Latency sidecar observer for `settings/shared_song` ────────────────
  // Reads the doc independently of CoupleContext (which is the canonical
  // consumer) so that we can record write→display latency without coupling
  // the tracker into CoupleContext's render cycle.
  useEffect(() => {
    if (!session || !currentSong.videoId) return;
    if (!import.meta.env.DEV) return;
    let unsub: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      const { doc, onSnapshot } = await import("firebase/firestore");
      unsub = onSnapshot(doc(db, "settings", "shared_song"), (d: any) => {
        if (!d.exists()) return;
        const data = d.data() || {};
        const myId = data._clientTabId;
        const writeTs = data._clientWriteTs as number | undefined;
        const lsId = data._clientListenerId as string | undefined;
        // Only record when this tab is responsible for the round trip
        if (lsId !== "music:shared_song") return;
        if (typeof writeTs !== "number") return;
        // Sidecar: we don't know the tabId stamp, so we accept any echo — the
        // first observer sidecar starts covering once the gate is satisfied.
        recordLatency("music:shared_song", {
          ts: Date.now(),
          deltaMs: myId ? Date.now() - writeTs : null,
          partnerWrite: !myId,
          stale: false,
        });
      }, () => { /* ignore */ });
    })();
    return () => { if (unsub) unsub(); };
  }, [session, currentSong.videoId]);

  // Listen for toggleNavbar events to temporarily hide nav dock (e.g. for lightbox view)
  useEffect(() => {
    const handler = (e: Event) => {
      const show = (e as CustomEvent<boolean>).detail;
      setShowNavbar(show !== false);
    };
    window.addEventListener("toggleNavbar", handler);
    return () => window.removeEventListener("toggleNavbar", handler);
  }, []);

  // Listen for setMusicVolume events
  useEffect(() => {
    const handler = (e: Event) => {
      const vol = (e as CustomEvent<number>).detail;
      localStorage.setItem("music_volume", String(vol));
      safePostMessage(JSON.stringify({ event: "command", func: "setVolume", args: [vol] }));
    };
    window.addEventListener("setMusicVolume", handler);
    return () => window.removeEventListener("setMusicVolume", handler);
  }, [safePostMessage]);

  // Sync volume whenever the player/song loads
  useEffect(() => {
    const frame = playerIframeRef.current;
    if (!frame || !currentSong.videoId) return;
    const vol = Number(localStorage.getItem("music_volume") || "80");
    const t = setTimeout(() => {
      safePostMessage(JSON.stringify({ event: "command", func: "setVolume", args: [vol] }));
    }, 1200); // 1.2s delay to make sure player API is initialized
    return () => clearTimeout(t);
  }, [currentSong.isPlaying, currentSong.videoId, safePostMessage]);

  // Listen for remote seek events from CoupleContext (partner synced progress ahead)
  // Sends seekTo command to the YouTube iframe so both users hear the same position
  // Debounce 3s to prevent spamming seekTo when progress updates arrive rapidly
  const lastSeekTimeRef = useRef(0);
  useEffect(() => {
    const handler = (e: Event) => {
      const seekMs = (e as CustomEvent<number>).detail;
      if (seekMs == null || seekMs < 0 || !playerIframeRef.current || !currentSong.videoId) return;
      const now = Date.now();
      if (now - lastSeekTimeRef.current < 3000) return;
      lastSeekTimeRef.current = now;
      const seekSeconds = seekMs / 1000;
      safePostMessage(JSON.stringify({ event: "command", func: "seekTo", args: [seekSeconds, true] }));
    };
    window.addEventListener("musicRemoteSeek", handler);
    return () => window.removeEventListener("musicRemoteSeek", handler);
  }, [safePostMessage, currentSong.videoId]);

  // Listen for manual scrub (musicSeekTo) — fired when user drags the progress bar.
  // Seeks YouTube iframe immediately + writes new progress to Firestore for partner sync.
  useEffect(() => {
    const handler = async (e: Event) => {
      const seekMs = (e as CustomEvent<number>).detail;
      if (seekMs == null || seekMs < 0 || !currentSong.videoId) return;
      // Seek YouTube iframe
      const seekSeconds = seekMs / 1000;
      safePostMessage(JSON.stringify({ event: "command", func: "seekTo", args: [seekSeconds, true] }));
      // Immediately sync new position to Firestore so partner sees the scrub
      try {
        const db = await getDb();
        const { tabWriteTs } = await import("./utils/latencyTracker");
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "settings", "shared_song"), {
          progress_ms: seekMs,
          synced_at: new Date().toISOString(),
          ...tabWriteTs("music:shared_song"),
        }, { merge: true });
      } catch (err) {
        console.error("[musicSeekTo Firestore sync]", err);
      }
    };
    window.addEventListener("musicSeekTo", handler);
    return () => window.removeEventListener("musicSeekTo", handler);
  }, [safePostMessage, currentSong.videoId]);

  // Listen for cross-component tab-change events (e.g. from HomeView shortcuts)
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent<TabId>).detail;
      if (tab) {
        const current = activeTabRef.current;
        const prevIdx = TAB_IDS.indexOf(current);
        const nextIdx = TAB_IDS.indexOf(tab);
        if (nextIdx !== prevIdx) {
          setNavDirection(nextIdx > prevIdx ? 1 : -1);
        }
        setActiveTab(tab);
      }
    };
    window.addEventListener("changeTab", handler);
    return () => window.removeEventListener("changeTab", handler);
  }, []);

  // ── Keyboard Navigation ──────────────────────────────────────────────────────
  // Arrow Left/Right to cycle dock tabs, Escape to close surprise overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Close surprise overlay if open
        if (activeSurprise) {
          setActiveSurprise(null);
          e.preventDefault();
          return;
        }
      }

      // Only handle arrow keys when main content area is not in a text input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const currentIdx = TAB_IDS.indexOf(activeTab);
        const direction = e.key === "ArrowRight" ? 1 : -1;
        const nextIdx = ((currentIdx + direction) % TAB_IDS.length + TAB_IDS.length) % TAB_IDS.length;
        setNavDirection(direction);
        setActiveTab(TAB_IDS[nextIdx]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, activeSurprise, setActiveSurprise]);

  // Memoize profile objects to avoid re-rendering nav/header on unrelated state changes
  const activeProfile = useMemo(() => currentUser === "user_a" ? userA : userB, [currentUser, userA, userB]);
  const partnerProfile = useMemo(() => currentUser === "user_a" ? userB : userA, [currentUser, userA, userB]);

  if (!session) return <LoginView />;
  if (isOnboarding) return <OnboardingView />;

  return (
    <div
      className={`${darkMode ? " dark" : ""} font-theme-${fontTheme || "scrapbook"} color-theme-${colorTheme || "cozy-wood"} min-h-screen flex flex-col font-sans transition-all duration-500 text-[var(--text-main)] pb-28 overflow-x-hidden w-full relative`}
      style={{ background: 'var(--bg-texture), var(--bg-gradient)' }}
      id="app-root-wrapper"
    >

      {/* Emotional experiences */}
      <DemoBadge />
      <NightAmbient />
      <ConfettiEffect key={confettiTrigger} active={confettiTrigger > 0} count={50} duration={5000} />
      <WeatherBadge />
      <WeatherNotificationController />
      {/* ── Compact Couple Profile Header ── */}
      <header className="w-full max-w-6xl mx-auto px-4 py-4 md:py-5 flex items-center justify-between gap-x-4 z-40 relative">
        {/* Left side: Logo & Title next to it */}
        <div className="flex items-center gap-2">
          <OptimizedImage src={gnLogo} alt="Logo" className="w-16 h-16 md:w-24 md:h-24 flex-shrink-0 object-contain" resizeWidth={120} />
          <div>
            <h1 className="text-xs md:text-sm font-bold font-display tracking-wide text-[var(--text-main)] leading-none">
              Our Little Universe
            </h1>
            <p className="text-[9px] md:text-[10px] text-[var(--text-muted)] font-medium leading-tight mt-0.5">
              A private place where our memories live
            </p>
          </div>
        </div>

        {/* Right side: Both profiles side-by-side (even smaller) */}
        <div className="relative flex items-center gap-2 bg-white/50 dark:bg-stone-900/50 border border-white/60 dark:border-white/10 px-2.5 py-1 rounded-xl shadow-sm backdrop-blur-md transition-all duration-300">
          {/* User A Profile */}
          <div 
            className={`flex items-center gap-1 max-w-[100px] sm:max-w-none p-0.5 rounded-lg transition-all ${
              currentUser === "user_a" 
                ? "cursor-pointer hover:bg-white/60 active:scale-95" 
                : "cursor-not-allowed opacity-90"
            }`}
            onClick={() => {
              if (currentUser === "user_a") {
                triggerHaptic("light");
                setMoodPickerAnchor(moodPickerAnchor === "user_a" ? null : "user_a");
              } else {
                triggerHaptic("medium");
                toast.info(`This is ${userA.name.split(" ")[0]}'s slot. Only they can update their status! 💙`);
              }
            }}
          >
            <div className="relative group/avatar">
              <OptimizedImage
                src={userA.avatar}
                alt={userA.name}
                className={`w-7 h-7 rounded-full object-cover border-2 ${userA.gender === "pria" ? "border-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.12)]" : "border-rose-400 shadow-[0_0_4px_rgba(244,63,94,0.12)]"
                  }`}
                referrerPolicy="no-referrer"
                loading="lazy"
                resizeWidth={56}
                resizeHeight={56}
              />
              {/* Online/Offline status dot lamp */}
              <div className="absolute -top-1 -left-1 group/status cursor-pointer z-20" tabIndex={0}>
                <span 
                  className={`block w-2.5 h-2.5 rounded-full border border-white transition-all duration-300 ${
                    isOnlineA ? "bg-green-500 shadow-[0_0_4px_#22c55e] animate-pulse" : "bg-red-500 shadow-[0_0_4px_#ef4444]"
                  }`} 
                />
                
                {/* Subtle 'Last seen' timestamp popup */}
                <div className="absolute top-3.5 left-0 pointer-events-none opacity-0 group-hover/status:opacity-100 group-focus/status:opacity-100 group-active/status:opacity-100 transition-all duration-300 transform -translate-y-1 group-hover/status:translate-y-0 bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[9px] font-medium py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-50 border border-white/10 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnlineA ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="font-bold text-[9px]">{isOnlineA ? "Online" : "Offline"}</span>
                  </div>
                  <span className="text-zinc-300 font-mono text-[8.5px]">{formatLastSeen(userA.lastActive, isOnlineA, { prefix: "Last seen: ", offlineLabel: "offline" })}</span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 text-[8px] bg-white rounded-full p-0.5 shadow-xs leading-none">
                {userA.emoji || "💖"}
              </span>
              {currentUser === "user_a" && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Smile className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="text-left hidden sm:block pl-1">
              <p className="text-[10px] font-bold text-[var(--text-main)] leading-none truncate max-w-[60px] flex items-center gap-0.5">
                {userA.name.split(" ")[0]}
                {currentUser === "user_a" && <Smile className="w-2.5 h-2.5 text-[var(--primary)] opacity-60" />}
              </p>
              <p className="text-[8px] text-[var(--text-muted)] font-medium mt-0.5 truncate max-w-[70px]" title={userA.status}>
                {userA.status || "Offline"}
              </p>
            </div>
          </div>

          {/* Central Heart Link Divider */}
          <div className="flex items-center justify-center px-1">
            <Heart className="w-2.5 h-2.5 text-rose-500 fill-current animate-pulse" />
          </div>

          {/* User B Profile */}
          <div 
            className={`flex items-center gap-1 max-w-[100px] sm:max-w-none p-0.5 rounded-lg transition-all ${
              currentUser === "user_b" 
                ? "cursor-pointer hover:bg-white/60 active:scale-95" 
                : "cursor-not-allowed opacity-90"
            }`}
            onClick={() => {
              if (currentUser === "user_b") {
                triggerHaptic("light");
                setMoodPickerAnchor(moodPickerAnchor === "user_b" ? null : "user_b");
              } else {
                triggerHaptic("medium");
                toast.info(`This is ${userB.name.split(" ")[0]}'s slot. Only they can update their status! 🌸`);
              }
            }}
          >
            <div className="relative group/avatar">
              <OptimizedImage
                src={userB.avatar}
                alt={userB.name}
                className={`w-7 h-7 rounded-full object-cover border-2 ${userB.gender === "wanita" ? "border-rose-400 shadow-[0_0_4px_rgba(244,63,94,0.12)]" : "border-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.12)]"
                  }`}
                referrerPolicy="no-referrer"
                loading="lazy"
                resizeWidth={56}
                resizeHeight={56}
              />
              {/* Online/Offline status dot lamp */}
              <div className="absolute -top-1 -left-1 group/status cursor-pointer z-20" tabIndex={0}>
                <span 
                  className={`block w-2.5 h-2.5 rounded-full border border-white transition-all duration-300 ${
                    isOnlineB ? "bg-green-500 shadow-[0_0_4px_#22c55e] animate-pulse" : "bg-red-500 shadow-[0_0_4px_#ef4444]"
                  }`} 
                />
                
                {/* Subtle 'Last seen' timestamp popup */}
                <div className="absolute top-3.5 left-0 pointer-events-none opacity-0 group-hover/status:opacity-100 group-focus/status:opacity-100 group-active/status:opacity-100 transition-all duration-300 transform -translate-y-1 group-hover/status:translate-y-0 bg-zinc-900/95 dark:bg-zinc-800/95 text-white text-[9px] font-medium py-1 px-2 rounded-lg shadow-lg whitespace-nowrap z-50 border border-white/10 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnlineB ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="font-bold text-[9px]">{isOnlineB ? "Online" : "Offline"}</span>
                  </div>
                  <span className="text-zinc-300 font-mono text-[8.5px]">{formatLastSeen(userB.lastActive, isOnlineB, { prefix: "Last seen: ", offlineLabel: "offline" })}</span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 text-[8px] bg-white rounded-full p-0.5 shadow-xs leading-none">
                {userB.emoji || "✨"}
              </span>
              {currentUser === "user_b" && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Smile className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div className="text-left hidden sm:block pl-1">
              <p className="text-[10px] font-bold text-[var(--text-main)] leading-none truncate max-w-[60px] flex items-center gap-0.5">
                {userB.name.split(" ")[0]}
                {currentUser === "user_b" && <Smile className="w-2.5 h-2.5 text-[var(--primary)] opacity-60" />}
              </p>
              <p className="text-[8px] text-[var(--text-muted)] font-medium mt-0.5 truncate max-w-[70px]" title={userB.status}>
                {userB.status || "Offline"}
              </p>
            </div>
          </div>

          {/* Floating Mood Picker Popover */}
          <AnimatePresence>
            {moodPickerAnchor && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-11 z-50 w-72 bg-[var(--fabric-cream)] border-2 border-[var(--wood-oak)] rounded-3xl p-4 shadow-xl text-left"
              >
                <div className="flex items-center justify-between border-b border-[var(--wood-oak)]/15 pb-2 mb-3">
                  <span className="text-xs uppercase font-black tracking-wider text-[var(--primary)] flex items-center gap-1 font-serif">
                    <Smile className="w-3.5 h-3.5" /> Set Your Current Vibe
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMoodPickerAnchor(null);
                    }}
                    className="p-1 hover:bg-black/5 rounded-full transition-colors cursor-pointer text-[var(--text-muted)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {MOOD_PRESETS.map((p) => {
                    const activeProfile = currentUser === "user_a" ? userA : userB;
                    const isCurrent = activeProfile.emoji === p.emoji;
                    return (
                      <button
                        key={p.text}
                        title={p.status}
                        onClick={async (e) => {
                          e.stopPropagation();
                          triggerHaptic("success");
                          await updateProfile(currentUser, { emoji: p.emoji, status: p.status, mood: p.text.toLowerCase() });
                          addMoodHistoryEntry(p.text, p.status);
                          addActivity(`updated vibe to: ${p.emoji} ${p.text}`);
                          setMoodPickerAnchor(null);
                          toast.success(`Updated your vibe to ${p.emoji} ${p.text}!`);
                        }}
                        className={`h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-150 cursor-pointer ${
                          isCurrent 
                            ? "bg-[var(--primary)]/20 border-2 border-[var(--primary)] scale-105" 
                            : "bg-white/45 border border-[var(--wood-oak)]/10 hover:bg-white/90 hover:scale-102"
                        }`}
                      >
                        {p.emoji}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--wood-oak)]/10 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Or Write Custom Status:</span>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const input = (e.currentTarget.elements.namedItem("customStatus") as HTMLInputElement).value.trim();
                      if (!input) return;
                      triggerHaptic("success");
                      const activeProfile = currentUser === "user_a" ? userA : userB;
                      await updateProfile(currentUser, { status: input });
                      addMoodHistoryEntry(activeProfile.mood || "cozy", input);
                      addActivity(`updated status to: "${input}"`);
                      setMoodPickerAnchor(null);
                      toast.success("Custom status updated!");
                    }}
                    className="flex gap-1.5"
                  >
                    <input
                      name="customStatus"
                      placeholder="Doing homework, driving..."
                      maxLength={50}
                      className="flex-1 text-[11px] px-3 py-1.5 bg-white/50 border border-[var(--wood-oak)]/15 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-medium"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-[var(--primary)] hover:opacity-95 text-white font-bold text-[10px] rounded-xl transition-all cursor-pointer shadow-3xs"
                    >
                      Set
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Treehouse Rooms Canvas ── */}
      <ErrorBoundary viewName="Treehouse Rooms">
        <main ref={mainContainerRef} className="flex-1 w-full max-w-6xl mx-auto px-4 pb-36 z-10 relative mt-2" style={{ perspective: "1500px", transformStyle: "preserve-3d" }}>
          {/* Real Scrapbook interactive stickers layer */}
          <ScrapbookStickers activeTab={activeTab} containerRef={mainContainerRef} />

          {/* Room arrival doorplate — brief label that fades in and out when entering a room */}
          <AnimatePresence>
            {arrivalRoom && (
              <motion.div
                key={arrivalRoom}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
              >
                <div className="px-4 py-1.5 rounded-full backdrop-blur-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--wood-oak) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--wood-oak) 25%, transparent)' }}>
                  <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {arrivalRoom}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative w-full">
            <Suspense fallback={
              <div className="w-full flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)]/30 border-t-[var(--primary)] animate-spin" />
                <p className="text-xs text-[var(--text-muted)] font-handwrite animate-pulse-slow">Unfolding a new page...</p>
              </div>
            }>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="w-full"
              >
                {activeTab === "home" && <ErrorBoundary viewName="The Foyer"><HomeView /></ErrorBoundary>}
                {activeTab === "memories" && <ErrorBoundary viewName="Our Archive"><MemoriesView /></ErrorBoundary>}
                {activeTab === "together" && <ErrorBoundary viewName="The Heartbeat"><TogetherView /></ErrorBoundary>}
                {activeTab === "play" && <ErrorBoundary viewName="Game Attic"><PlayView /></ErrorBoundary>}
                {activeTab === "adventure" && <ErrorBoundary viewName="Date Night"><AdventureView /></ErrorBoundary>}
                {activeTab === "settings" && <ErrorBoundary viewName="Workshop"><SettingsView /></ErrorBoundary>}
              </motion.div>
            </Suspense>
          </div>
        </main>
      </ErrorBoundary>

      {/* Floating Wood Walkway Dock */}
      <AnimatePresence>
        {showNavbar && (
          <motion.div
            initial={{ y: 80, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 80, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed left-1/2 w-[calc(100%-24px)] max-w-md sm:max-w-lg md:max-w-xl z-50"
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            <div role="tablist" aria-label="Treehouse rooms" className="dock-runner backdrop-blur-xl bg-white/45 dark:bg-stone-900/55 px-4 sm:px-6 py-2.5 sm:py-3 pb-1 rounded-2xl flex items-center justify-between gap-0.5 sm:gap-1.5 w-full">
              {NAV_ITEMS.map(({ id, label, icon: Icon }, idx) => {
                const active = activeTab === id;
                const meta = ROOM_METADATA[id];
                return (
                  <button
                    key={id}
                    id={`dock-nav-btn-${id}`}
                    onClick={() => handleTabClick(id)}
                    role="tab"
                    aria-selected={active}
                    aria-label={`${meta.name} — ${label} section, ${active ? 'current room' : `room ${idx + 1} of ${TAB_IDS.length}`}`}
                    tabIndex={active ? 0 : -1}
                    className="relative min-h-[44px] sm:min-h-[50px] py-1 px-1 min-[350px]:px-1.5 sm:px-2 md:px-3 flex-1 min-w-0 flex flex-col items-center justify-center group transition-all duration-300 select-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-xl"
                  >
                    {active && (
                      <motion.div
                        layoutId="activeDockBubble"
                        className="absolute inset-0 rounded-xl sm:rounded-2xl -z-10 bg-stone-900/10 dark:bg-white/10"
                        transition={{ type: "spring", stiffness: 180, damping: 20 }}
                      />
                    )}
                    <Icon className={`w-4 h-4 min-[360px]:w-[18px] min-[360px]:h-[18px] sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-300 ${active ? "text-stone-950 dark:text-stone-100 font-extrabold drop-shadow-xs" : "text-stone-800 dark:text-stone-300 group-hover:text-stone-950 dark:group-hover:text-stone-100"}`} />
                    <span className={`text-[10px] sm:text-[11px] mt-0.5 tracking-wider font-bold truncate transition-all duration-300 ${active ? "text-stone-950 dark:text-stone-100 block" : "text-stone-800 dark:text-stone-300 hidden sm:block"}`}>
                      {label}
                    </span>
                    {active && (
                      <span className="absolute bottom-0.5 sm:bottom-1 w-1 h-1 rounded-full bg-[var(--primary)] shadow-[0_0_6px_var(--primary)] animate-pulse" />
                    )}
                    {/* Room subtitle hover tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 pointer-events-none z-50 hidden sm:block">
                      <div className="px-2 py-0.5 rounded-md shadow-xs whitespace-nowrap" style={{ backgroundColor: 'color-mix(in srgb, var(--wood-walnut) 85%, transparent)', color: 'var(--color-on-primary, #FFF8F0)' }}>
                        <span className="text-[9px] font-semibold tracking-wider">{meta.name}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surprise overlay */}
      <AnimatePresence>
        {activeSurprise && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={activeSurprise === "level-up" ? "Level Up surprise notification" : "Time capsule reveal notification"}
            className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              role="document"
              tabIndex={-1}
              className="bg-[var(--fabric-cream)] rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl border border-[var(--wood-oak)]"
            >
              <div className="absolute inset-0 pointer-events-none opacity-30" aria-hidden="true">
                <div className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-float top-10 left-10" />
                <div className="absolute w-1.5 h-1.5 bg-rose-400 rounded-full animate-float top-20 right-12" />
                <div className="absolute w-3 h-3 bg-blue-400 rounded-full animate-float bottom-10 left-20" />
              </div>
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float border border-rose-200">
                <Sparkles className="w-7 h-7 text-rose-500 fill-current animate-heartbeat" />
              </div>
              {activeSurprise === "level-up" && (
                <>
                  <h4 className="text-lg font-bold text-gray-800 font-display">Level Up!</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">Your couple bond has grown deeper. New botanical assets and sticker frames unlocked in Settings!</p>
                </>
              )}
              {activeSurprise === "time-capsule-reveal" && (
                <>
                  <h4 className="text-lg font-bold text-indigo-700 font-display">Future Unlocked!</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">A precious capsule has traveled through time to meet you. Open it in The Heartbeat tab to read your past dreams!</p>
                </>
              )}
              <button
                id="surprise-dismiss-btn"
                onClick={() => setActiveSurprise(null)}
                className="mt-6 w-full py-2 bg-[var(--wood-walnut)] hover:bg-[var(--wood-dark)] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5 border border-[var(--wood-oak)]"
              >
                <X className="w-4 h-4" /> Dismiss Moment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden audio-only iframe — persisted at root so switching tabs doesn't destroy playback state */}
      {currentSong.videoId && (
        <div className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
          <iframe
            key={currentSong.videoId}
            ref={playerIframeRef}
            src={iframeSrc}
            title={currentSong.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            width="300"
            height="172"
          />
        </div>
      )}

      {/* ── Floating Birthday Replay Trigger (left) ── */}
      <AnimatePresence>
        {!birthday.isOpen && (
          <BirthdayReplayButton
            onOpen={birthday.open}
            className="fixed bottom-20 left-4 sm:bottom-[160px] sm:left-10 z-50"
          />
        )}
      </AnimatePresence>

      {/* Birthday Experience overlay — lazy-mounted, only on demand */}
      <Suspense fallback={null}>
        {birthday.isOpen && (
          <BirthdayExperienceLazy
            isOpen={birthday.isOpen}
            onClose={birthday.close}
            onComplete={birthday.close}
          />
        )}
      </Suspense>

      {/* Floating Dark Mode Toggle (Circle Reveal + Blur transition) */}
      <button
        id="dark-mode-toggle-btn"
        onClick={handleToggleDarkMode}
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-md border"
        style={{
          backgroundColor: darkMode ? 'rgba(196, 149, 106, 0.25)' : 'rgba(92, 58, 30, 0.12)',
          borderColor: darkMode ? 'rgba(196, 149, 106, 0.4)' : 'rgba(92, 58, 30, 0.2)'
        }}
      >
        {darkMode
          ? <Sun className="w-5 h-5" style={{ color: "var(--text-main)" }} />
          : <Moon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
        }
      </button>

      <Toaster theme={darkMode ? "dark" : "light"} />

      {/* Dev-only latency overlay — opt-in via `?latencyOverlay=1`. */}
      {import.meta.env.DEV && isLatencyOverlayEnabled() && <LatencyOverlay />}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  // Dev-only sandbox mode — read URL once on mount so subsequent
  // re-renders don't churn based on user navigation. The `useState`
  // initializer runs exactly once per mount so the URL search happens
  // a single time. Production builds: `import.meta.env.DEV === false`
  // so this branch resolves to `null` and the lazy SandboxPageLazy
  // import is reachable only via a never-called code path
  // (tree-shaken by Vite/Rollup).
  const [sandboxMode] = useState<SandboxMode | null>(() => {
    if (!import.meta.env.DEV) return null;
    if (typeof window === "undefined") return null;
    const v = new URLSearchParams(window.location.search).get("sandbox");
    if (v === null) return null;
    // `?sandbox` → no recipient override (use BIRTHDAY_CONTENT default).
    // `?sandbox=` or `?sandbox=1` or `?sandbox=true` → also no override.
    // `?sandbox=<name>` → override recipientName end-to-end.
    const noOverride = v === "" || v === "1" || v === "true";
    return { recipientNameOverride: noOverride ? undefined : v.trim() };
  });

  if (sandboxMode) {
    return (
      <Suspense fallback={null}>
        <SandboxPageLazy
          recipientNameOverride={sandboxMode.recipientNameOverride}
        />
      </Suspense>
    );
  }

  return (
    <CoupleProvider activeTab={activeTab}>
      <AppContent activeTab={activeTab} onTabChange={setActiveTab} />
    </CoupleProvider>
  );
}
