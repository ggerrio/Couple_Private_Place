/**
 * TogetherView.tsx — The Heartbeat orchestrator
 * Letters, Time Capsules, Activity Status & Co-Watching Theater
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Eye, Tv, Calendar } from "lucide-react";
import { triggerHaptic } from "../lib/haptics";
import LettersPanel from "./together/LettersPanel";
import StatusPanel from "./together/StatusPanel";
import WatchPanel from "./together/WatchPanel";
import SharedCalendar from "./home/SharedCalendar";
import { ScrapbookPage, WashiTapeDivider } from "./scrapbook";

const TogetherView = React.memo(function TogetherView() {
  const [activeTab, setActiveTab] = useState<"letters" | "status" | "watch" | "calendar">("letters");

  const tabConfig = [
    { value: "letters", label: "Letters & Capsules", icon: Mail },
    { value: "status", label: "Activity Status", icon: Eye },
    { value: "watch", label: "Theater Sync", icon: Tv },
    { value: "calendar", label: "Calendar", icon: Calendar },
  ] as const;

  return (
    <div id="together-hub-container">
      {/* Sticker-style Tab Switcher */}
      <div className="flex justify-center mb-6">
        <div role="tablist" aria-label="Heartbeat sections" className="flex gap-4 sm:gap-6 bg-[var(--fabric-cream)]/50 px-3 py-2 rounded-2xl border border-[var(--wood-oak)]/15 shadow-sm">
          {tabConfig.map((tab) => {
            const IconComp = tab.icon;
            const isSel = activeTab === tab.value;
            return (
              <button key={tab.value}
                role="tab"
                aria-selected={isSel}
                onClick={() => { setActiveTab(tab.value); triggerHaptic("light"); }}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold transition-all relative cursor-pointer select-none ${
                  isSel
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-[60px] sm:max-w-none">{tab.label}</span>
                {isSel && (
                  <motion.div layoutId="activeTogetherTab"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <WashiTapeDivider color="rose" />

      <AnimatePresence mode="popLayout">
        {activeTab === "letters" && <LettersPanel />}
        {activeTab === "status" && <StatusPanel />}
        {activeTab === "watch" && <WatchPanel />}
        {activeTab === "calendar" && (
          <ScrapbookPage className="max-w-none">
            <SharedCalendar />
          </ScrapbookPage>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TogetherView;
