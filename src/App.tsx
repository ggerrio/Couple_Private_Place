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
import LoginView from "./components/LoginView";
import OnboardingView from "./components/OnboardingView";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { motion, AnimatePresence } from "motion/react";
import { Home, Camera, Mail, Gamepad2, Sprout, Settings, Sparkles, X, Sun, Moon, Heart } from "lucide-react";
import { NightAmbient, ConfettiEffect, useConfetti, WeatherBadge, WeatherNotificationController } from "./components/emotional";
import { ScrapbookStickers } from "./components/scrapbook";

import gnLogo from "../logo/ger_n_nic_small.webp";

import { getDb } from "./firebaseClient";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

type TabId = "home" | "memories" | "together" | "play" | "adventure" | "settings";

const TAB_IDS: TabId[] = ["home", "memories", "together", "play", "adventure", "settings"];

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "The Foyer", icon: Home },
  { id: "memories", label: "Our Archive", icon: Camera },
  { id: "together", label: "The Heartbeat", icon: Mail },
  { id: "play", label: "Game Attic", icon: Gamepad2 },
  { id: "adventure", label: "Secret Garden", icon: Sprout },
  { id: "settings", label: "Workshop", icon: Settings },
];// Room identity metadata for arrival labels, spatial hierarchy, and hover tooltips
const ROOM_METADATA: Record<TabId, { name: string; subtitle: string }> = {
  home: { name: "The Foyer", subtitle: "Where you both belong" },
  memories: { name: "Our Archive", subtitle: "Photographs and keepsakes" },
  together: { name: "The Heartbeat", subtitle: "Words from the heart" },
  play: { name: "Game Attic", subtitle: "Play and laughter" },
  adventure: { name: "Secret Garden", subtitle: "Dreams and discoveries" },
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
    // Log other unhandled rejections for debugging (but don't suppress)
    console.warn("[App] Unhandled promise rejection:", event.reason?.name, event.reason?.message);
  };
  window.addEventListener("unhandledrejection", handler);
  return () => window.removeEventListener("unhandledrejection", handler);
}

function AppContent() {
  // ── Global error handler for promise rejections ──────────────────────
  useEffect(setupGlobalErrorHandler, []);

  const { session, currentUser, userA, userB, darkMode, toggleDarkMode, activeSurprise, setActiveSurprise, isOnboarding, currentSong, setSongPlayState, anniversaryDate, birthdayA, birthdayB, fontTheme, colorTheme } = useCouple();
  const [activeTab, setActiveTab] = useState<TabId>("home");
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

  // Initialize Lenis smooth scrolling globally
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
    });

    return () => {
      lenis.destroy();
    };
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

  // Navigate to a tab with direction tracking for spatial transitions
  const handleTabClick = useCallback((tab: TabId) => {
    const prevIdx = TAB_IDS.indexOf(activeTab);
    const nextIdx = TAB_IDS.indexOf(tab);
    if (nextIdx !== prevIdx) {
      setNavDirection(nextIdx > prevIdx ? 1 : -1);
    }
    setActiveTab(tab);
  }, [activeTab]);

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

  // Send real play/pause commands to the already-loaded player
  useEffect(() => {
    const frame = playerIframeRef.current;
    if (!frame || !currentSong.videoId) return;
    const cmd = currentSong.isPlaying ? "playVideo" : "pauseVideo";
    const t = setTimeout(() => {
      frame.contentWindow?.postMessage(JSON.stringify({ event: "command", func: cmd, args: [] }), "*");
    }, 250);
    return () => clearTimeout(t);
  }, [currentSong.isPlaying, currentSong.videoId]);

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
      const frame = playerIframeRef.current;
      if (frame) {
        frame.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [vol] }), "*");
      }
    };
    window.addEventListener("setMusicVolume", handler);
    return () => window.removeEventListener("setMusicVolume", handler);
  }, []);

  // Sync volume whenever the player/song loads
  useEffect(() => {
    const frame = playerIframeRef.current;
    if (!frame || !currentSong.videoId) return;
    const vol = Number(localStorage.getItem("music_volume") || "80");
    const t = setTimeout(() => {
      frame.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [vol] }), "*");
    }, 1200); // 1.2s delay to make sure player API is initialized
    return () => clearTimeout(t);
  }, [currentSong.isPlaying, currentSong.videoId]);

  // Listen for cross-component tab-change events (e.g. from HomeView shortcuts)
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent<TabId>).detail;
      if (tab) {
        const prevIdx = TAB_IDS.indexOf(activeTab);
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
      <NightAmbient />
      <ConfettiEffect key={confettiTrigger} active={confettiTrigger > 0} count={50} duration={5000} />
      <WeatherBadge />
      <WeatherNotificationController />
      {/* ── Compact Couple Profile Header ── */}
      <header className="w-full max-w-6xl mx-auto px-4 py-4 md:py-5 flex items-center justify-between gap-x-4 z-40 relative">
        {/* Left side: Logo & Title next to it */}
        <div className="flex items-center gap-2">
          <img src={gnLogo} alt="Logo" className="w-16 h-16 md:w-24 md:h-24 flex-shrink-0 object-contain" />
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
        <div className="flex items-center gap-2 bg-white/40 border border-white/50 px-2 py-1 rounded-xl shadow-xs backdrop-blur-xs">
          {/* User A Profile */}
          <div className="flex items-center gap-1 max-w-[100px] sm:max-w-none">
            <div className="relative">
              <img
                src={userA.avatar}
                alt={userA.name}
                className={`w-7 h-7 rounded-full object-cover border-2 ${userA.gender === "pria" ? "border-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.12)]" : "border-rose-400 shadow-[0_0_4px_rgba(244,63,94,0.12)]"
                  }`}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <span className="absolute -bottom-1 -right-1 text-[8px] bg-white rounded-full p-0.5 shadow-xs leading-none">
                {userA.emoji || "💖"}
              </span>
            </div>
            <div className="text-left hidden sm:block pl-1">
              <p className="text-[10px] font-bold text-[var(--text-main)] leading-none truncate max-w-[60px]">
                {userA.name.split(" ")[0]}
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
          <div className="flex items-center gap-1 max-w-[100px] sm:max-w-none">
            <div className="relative">
              <img
                src={userB.avatar}
                alt={userB.name}
                className={`w-7 h-7 rounded-full object-cover border-2 ${userB.gender === "wanita" ? "border-rose-400 shadow-[0_0_4px_rgba(244,63,94,0.12)]" : "border-sky-400 shadow-[0_0_4px_rgba(56,189,248,0.12)]"
                  }`}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <span className="absolute -bottom-1 -right-1 text-[8px] bg-white rounded-full p-0.5 shadow-xs leading-none">
                {userB.emoji || "✨"}
              </span>
            </div>
            <div className="text-left hidden sm:block pl-1">
              <p className="text-[10px] font-bold text-[var(--text-main)] leading-none truncate max-w-[60px]">
                {userB.name.split(" ")[0]}
              </p>
              <p className="text-[8px] text-[var(--text-muted)] font-medium mt-0.5 truncate max-w-[70px]" title={userB.status}>
                {userB.status || "Offline"}
              </p>
            </div>
          </div>
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

          <Suspense fallback={
            <div className="w-full flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)]/30 border-t-[var(--primary)] animate-spin" />
              <p className="text-xs text-[var(--text-muted)] font-handwrite animate-pulse-slow">Unfolding a new page...</p>
            </div>
          }>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeTab}
                variants={{
                  enter: {
                    opacity: 0,
                    y: 10,
                  },
                  center: {
                    opacity: 1,
                    y: 0,
                  },
                  exit: {
                    opacity: 0,
                    y: -10,
                  },
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="w-full"
              >
                {activeTab === "home" && <ErrorBoundary viewName="The Foyer"><HomeView /></ErrorBoundary>}
                {activeTab === "memories" && <ErrorBoundary viewName="Our Archive"><MemoriesView /></ErrorBoundary>}
                {activeTab === "together" && <ErrorBoundary viewName="The Heartbeat"><TogetherView /></ErrorBoundary>}
                {activeTab === "play" && <ErrorBoundary viewName="Game Attic"><PlayView /></ErrorBoundary>}
                {activeTab === "adventure" && <ErrorBoundary viewName="Secret Garden"><AdventureView /></ErrorBoundary>}
                {activeTab === "settings" && <ErrorBoundary viewName="Workshop"><SettingsView /></ErrorBoundary>}
              </motion.div>
            </AnimatePresence>
          </Suspense>
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
            className="fixed bottom-6 sm:bottom-8 left-1/2 w-[calc(100%-24px)] max-w-md sm:max-w-lg md:max-w-xl z-50"
          >
            <div role="tablist" aria-label="Treehouse rooms" className="dock-runner px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl flex items-center justify-between gap-0.5 sm:gap-1.5 w-full">
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
    </div>
  );
}

export default function App() {
  return (
    <CoupleProvider>
      <AppContent />
      <Toaster />
    </CoupleProvider>
  );
}
