/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
import {
  Heart,
  Home,
  Camera,
  Mail,
  Gamepad2,
  Sprout,
  Settings,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";

function AppContent() {
  const {
    session,
    currentUser,
    userA,
    userB,
    theme,
    activeSurprise,
    setActiveSurprise,
    isOnboarding,
    currentSong,
  } = useCouple();

  console.log("[DEBUG APP] Rendering AppContent:", {
    hasSession: !!session,
    userEmail: session?.email,
    isOnboarding,
    currentUser,
  });

  const [activeTab, setActiveTab] = useState<"home" | "memories" | "together" | "play" | "adventure" | "settings">("home");

  useEffect(() => {
    const handleChangeTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("changeTab", handleChangeTab);
    return () => {
      window.removeEventListener("changeTab", handleChangeTab);
    };
  }, []);

  const dynamicBackgroundStyle = React.useMemo(() => {
    if (!currentSong || !currentSong.isPlaying) {
      return { background: "var(--bg-gradient)", backgroundAttachment: "fixed" };
    }

    let baseColor = "#10b981"; // default green
    const title = currentSong.title.toLowerCase();

    if (title.includes("somethin' stupid")) baseColor = "#ef4444";
    else if (title.includes("dream a little dream")) baseColor = "#8b5cf6";
    else if (title.includes("rayuan perempuan gila")) baseColor = "#f59e0b";
    else if (title.includes("good looking")) baseColor = "#06b6d4";
    else if (title.includes("let the light in")) baseColor = "#ec4899";
    else if (title.includes("shades of cool")) baseColor = "#10b981";
    else if (title.includes("brooklyn baby")) baseColor = "#3b82f6";
    else if (title.includes("say yes to heaven")) baseColor = "#f43f5e";
    else {
      let hash = 0;
      const str = currentSong.title + currentSong.artist;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colors = ["#ef4444", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#10b981", "#3b82f6", "#f43f5e"];
      baseColor = colors[Math.abs(hash) % colors.length];
    }

    return {
      background: `radial-gradient(circle at 80% 20%, ${baseColor}18 0%, transparent 60%), radial-gradient(circle at 20% 80%, ${baseColor}0b 0%, transparent 60%), var(--bg-gradient)`,
      backgroundAttachment: "fixed"
    };
  }, [currentSong, theme]);

  if (!session) {
    return <LoginView />;
  }

  if (isOnboarding) {
    return <OnboardingView />;
  }

  const activeProfile = currentUser === "user_a" ? userA : userB;

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "memories", label: "Memories", icon: Camera },
    { id: "together", label: "Together", icon: Mail },
    { id: "play", label: "Play", icon: Gamepad2 },
    { id: "adventure", label: "Adventure", icon: Sprout },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div
      className={`theme-${theme} min-h-screen flex flex-col font-sans transition-all duration-500 bg-[var(--bg-app)] text-[var(--text-main)] pb-32 overflow-x-hidden w-full`}
      id="app-root-wrapper"
      style={dynamicBackgroundStyle}
    >
      {/* 1. Global Anniversary & Swapper Header */}
      <header className="w-full max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-40 relative">
        {/* Brand Logo & Milestone tag */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[var(--primary)] text-white rounded-xl flex items-center justify-center shadow-md border border-white/20 animate-float">
            <Heart className="w-5 h-5 fill-current animate-heartbeat text-rose-200" />
          </div>
          <div>
            <h1 className="text-sm font-black font-display tracking-widest uppercase text-[var(--text-main)] flex items-center gap-1.5">
              Private Bubble Space
            </h1>
            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono">
              Invitation-Only Couple Sanctum
            </p>
          </div>
        </div>

        {/* Active Profile Display */}
        <div className="flex items-center gap-3 bg-white/45 border border-white/80 rounded-2xl px-4 py-2 shadow-sm">
          <img
            src={activeProfile.avatar}
            alt={activeProfile.name}
            className="w-8 h-8 rounded-full border-2 border-rose-200 object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="text-left">
            <p className="text-[10px] font-bold text-gray-800">{activeProfile.name}</p>
            <p className="text-[9px] text-gray-400 font-mono">{activeProfile.status}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-gray-200">
            <img
              src={currentUser === "user_a" ? userB.avatar : userA.avatar}
              alt={currentUser === "user_a" ? userB.name : userA.name}
              className="w-6 h-6 rounded-full border border-blue-200 object-cover opacity-80"
              referrerPolicy="no-referrer"
            />
            <span className="text-[9px] text-gray-400 font-mono hidden sm:inline">
              + {currentUser === "user_a" ? userB.name.split(" ")[0] : userA.name.split(" ")[0]}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Primary Tab Canvas Stage */}
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

      {/* 3. Apple-Inspired Floating glass Navigation Dock */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-md sm:max-w-lg md:max-w-xl z-50">
        <div className="glass-panel py-1 sm:py-1.5 md:py-2 px-1 sm:px-2 md:px-3 rounded-[24px] sm:rounded-3xl flex items-center justify-between shadow-2xl relative border-white/60 gap-0.5 sm:gap-1.5">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className="relative min-h-[42px] sm:min-h-[48px] md:min-h-[50px] py-1 px-0.5 min-[350px]:px-1 sm:px-1.5 md:px-2.5 flex-1 min-w-0 flex flex-col items-center justify-center group transition-transform hover:-translate-y-1 duration-300 select-none cursor-pointer"
                id={`dock-nav-btn-${item.id}`}
              >
                {/* Active Indicator Backdrop Dot */}
                {isSelected && (
                  <motion.div
                    layoutId="activeDockBubble"
                    className="absolute inset-0 bg-black/5 rounded-xl sm:rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <IconComponent
                  className={`w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 flex-shrink-0 transition-colors ${
                    isSelected ? "text-[var(--primary)]" : "text-gray-400 group-hover:text-gray-700"
                  }`}
                />
                <span
                  className={`text-[7.5px] min-[360px]:text-[8px] sm:text-[9px] md:text-[9.5px] mt-0.5 tracking-normal sm:tracking-wider font-semibold uppercase truncate max-w-full text-center flex-shrink-0 ${
                    isSelected ? "text-[var(--primary)] font-bold block" : "text-gray-400 group-hover:text-gray-700 hidden sm:block"
                  }`}
                >
                  {item.label}
                </span>

                {/* Micro-dot Indicator */}
                {isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 bg-[var(--primary)] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Global Surprise Alerts Overlays */}
      <AnimatePresence>
        {activeSurprise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-white rounded-3xl p-8 max-w-sm text-center relative overflow-hidden shadow-2xl border border-white/10"
            >
              {/* Confetti Particle simulation backgrounds */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
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
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    Congratulations! Your couple bond has grown deeper. You have unlocked new botanical assets and decorative sticker frames in Settings!
                  </p>
                </>
              )}

              {activeSurprise === "time-capsule-reveal" && (
                <>
                  <h4 className="text-lg font-bold text-indigo-700 font-display">Future Unlocked! ⏳</h4>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    A precious capsule from yesterday has traveled through time to meet you. Open it inside the Adventure cabin to read your past dreams!
                  </p>
                </>
              )}

              <button
                onClick={() => setActiveSurprise(null)}
                className="mt-6 w-full py-2 bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" /> Dismiss Moment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
