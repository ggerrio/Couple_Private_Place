/**
 * App.tsx — rebuilt from zero.
 *
 * Fixes:
 *  - backgroundImage + backgroundColor as separate props (no shorthand `background` clash with Tailwind class)
 *  - ambient color derived from song title+artist only (not full Song object) — progress ticks don't trigger recompute
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { CoupleProvider, useCouple } from "./context/CoupleContext";
import HomeView from "./components/HomeView";
import MemoriesView from "./components/MemoriesView";
import TogetherView from "./components/TogetherView";
import PlayView from "./components/PlayView";
import AdventureView from "./components/AdventureView";
import SettingsView from "./components/SettingsView";
import LoginView from "./components/LoginView";
import OnboardingView from "./components/OnboardingView";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Home, Camera, Mail, Gamepad2, Sprout, Settings, Sparkles, X } from "lucide-react";

type TabId = "home" | "memories" | "together" | "play" | "adventure" | "settings";

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "memories", label: "Memories", icon: Camera },
  { id: "together", label: "Together", icon: Mail },
  { id: "play", label: "Play", icon: Gamepad2 },
  { id: "adventure", label: "Adventure", icon: Sprout },
  { id: "settings", label: "Settings", icon: Settings },
];

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
  const palette = ["#ef4444","#8b5cf6","#f59e0b","#06b6d4","#ec4899","#10b981","#3b82f6","#f43f5e"];
  let hash = 0;
  for (let i = 0; i < (title + artist).length; i++) hash = (title + artist).charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function AppContent() {
  const { session, currentUser, userA, userB, theme, activeSurprise, setActiveSurprise, isOnboarding, currentSong, setSongPlayState } = useCouple();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [showNavbar, setShowNavbar] = useState(true);

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

  // When switching tabs, if the song is playing, pause it.
  // The minutes and seconds (currentSong.progressMs) will be preserved in the context state,
  // and the iframe in App.tsx remains loaded/mounted, so it retains its exact playback state.
  useEffect(() => {
    if (currentSong.isPlaying && currentSong.videoId) {
      setSongPlayState(false);
    }
  }, [activeTab]);

  // Listen for toggleNavbar events to temporarily hide nav dock (e.g. for lightbox view)
  useEffect(() => {
    const handler = (e: Event) => {
      const show = (e as CustomEvent<boolean>).detail;
      setShowNavbar(show !== false);
    };
    window.addEventListener("toggleNavbar", handler);
    return () => window.removeEventListener("toggleNavbar", handler);
  }, []);

  // Listen for cross-component tab-change events (e.g. from HomeView shortcuts)
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent<TabId>).detail;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener("changeTab", handler);
    return () => window.removeEventListener("changeTab", handler);
  }, []);

  // Ambient glow: derived from song identity only, not progress — prevents re-render on every tick
  const ambientStyle = useMemo(() => {
    if (!currentSong.isPlaying) return {};
    const c = songAmbientColor(currentSong.title, currentSong.artist);
    return {
      backgroundImage: `radial-gradient(circle at 80% 20%, ${c}18 0%, transparent 60%), radial-gradient(circle at 20% 80%, ${c}0b 0%, transparent 60%), var(--bg-gradient)`,
    };
  }, [currentSong.isPlaying, currentSong.title, currentSong.artist]);
  // ponytail: separate backgroundImage only; backgroundColor stays on the class attribute

  if (!session) return <LoginView />;
  if (isOnboarding) return <OnboardingView />;

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  return (
    <div
      className={`theme-${theme} min-h-screen flex flex-col font-sans transition-all duration-500 text-[var(--text-main)] pb-32 overflow-x-hidden w-full`}
      style={{ backgroundColor: "var(--bg-app)", ...ambientStyle }}
      id="app-root-wrapper"
    >
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-40 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center shadow-md border border-white/20 animate-float">
            <Heart className="w-5 h-5 fill-current animate-heartbeat text-rose-200" />
          </div>
          <div>
            <h1 className="text-sm font-black font-display tracking-widest uppercase text-[var(--text-main)]">
              Private Bubble Space
            </h1>
            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono">
              Invitation-Only Couple Sanctum
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/45 border border-white/80 rounded-2xl p-2.5 shadow-sm">
          {/* User A / Active Profile */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <img src={activeProfile.avatar} alt={activeProfile.name} className="w-8 h-8 rounded-full border-2 border-rose-300 object-cover shadow-sm" referrerPolicy="no-referrer" />
              <span className="absolute -bottom-0.5 -right-0.5 text-[9px] bg-white rounded-full leading-none p-0.5 shadow">💖</span>
            </div>
            <div className="text-left min-w-0 max-w-[120px]">
              <p className="text-[10px] font-bold text-gray-800 truncate">{activeProfile.name}</p>
              <p className="text-[9px] text-gray-500 font-medium truncate font-mono" title={activeProfile.status}>{activeProfile.status || "Offline"}</p>
            </div>
          </div>

          {/* Connection Divider */}
          <div className="h-6 w-px bg-gray-200/80 flex-shrink-0" />

          {/* User B / Partner Profile */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <img src={partnerProfile.avatar} alt={partnerProfile.name} className="w-8 h-8 rounded-full border-2 border-blue-300 object-cover shadow-sm" referrerPolicy="no-referrer" />
              <span className="absolute -bottom-0.5 -right-0.5 text-[9px] bg-white rounded-full leading-none p-0.5 shadow">✨</span>
            </div>
            <div className="text-left min-w-0 max-w-[120px]">
              <p className="text-[10px] font-bold text-gray-800 truncate">{partnerProfile.name}</p>
              <p className="text-[9px] text-gray-500 font-medium truncate font-mono" title={partnerProfile.status}>{partnerProfile.status || "Offline"}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-32 z-10 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            {activeTab === "home" && <HomeView />}
            {activeTab === "memories" && <MemoriesView />}
            {activeTab === "together" && <TogetherView />}
            {activeTab === "play" && <PlayView />}
            {activeTab === "adventure" && <AdventureView />}
            {activeTab === "settings" && <SettingsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating glass dock */}
      <AnimatePresence>
        {showNavbar && (
          <motion.div
            initial={{ y: 80, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 80, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 w-[calc(100%-24px)] max-w-md sm:max-w-lg md:max-w-xl z-50"
          >
            <div className="glass-panel py-1 sm:py-1.5 md:py-2 px-1 sm:px-2 md:px-3 rounded-[24px] sm:rounded-3xl flex items-center justify-between shadow-2xl border-white/60 gap-0.5 sm:gap-1.5">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    id={`dock-nav-btn-${id}`}
                    onClick={() => setActiveTab(id)}
                    className="relative min-h-[42px] sm:min-h-[48px] py-1 px-0.5 min-[350px]:px-1 sm:px-1.5 md:px-2.5 flex-1 min-w-0 flex flex-col items-center justify-center group transition-transform hover:-translate-y-1 duration-300 select-none cursor-pointer"
                  >
                    {active && (
                      <motion.div
                        layoutId="activeDockBubble"
                        className="absolute inset-0 bg-black/5 rounded-xl sm:rounded-2xl -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-colors ${active ? "text-[var(--primary)]" : "text-gray-400 group-hover:text-gray-700"}`} />
                    <span className={`text-[7.5px] min-[360px]:text-[8px] sm:text-[9px] mt-0.5 tracking-wider font-semibold uppercase truncate ${active ? "text-[var(--primary)] font-bold block" : "text-gray-400 group-hover:text-gray-700 hidden sm:block"}`}>
                      {label}
                    </span>
                    {active && <span className="absolute bottom-1 w-1 h-1 bg-[var(--primary)] rounded-full" />}
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
            className="fixed inset-0 bg-black/85 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-float top-10 left-10" />
                <div className="absolute w-1.5 h-1.5 bg-rose-400 rounded-full animate-float top-20 right-12" />
                <div className="absolute w-3 h-3 bg-blue-400 rounded-full animate-float bottom-10 left-20" />
              </div>
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float border border-rose-200">
                <Sparkles className="w-7 h-7 text-rose-500 fill-current animate-heartbeat" />
              </div>
              {activeSurprise === "level-up" && (
                <>
                  <h4 className="text-lg font-bold text-gray-800 font-display">Level Up! 🎉</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">Your couple bond has grown deeper. New botanical assets and sticker frames unlocked in Settings!</p>
                </>
              )}
              {activeSurprise === "time-capsule-reveal" && (
                <>
                  <h4 className="text-lg font-bold text-indigo-700 font-display">Future Unlocked! ⏳</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">A precious capsule has traveled through time to meet you. Open it in Adventure to read your past dreams!</p>
                </>
              )}
              <button
                id="surprise-dismiss-btn"
                onClick={() => setActiveSurprise(null)}
                className="mt-6 w-full py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
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
    </div>
  );
}

export default function App() {
  return (
    <CoupleProvider>
      <AppContent />
    </CoupleProvider>
  );
}
