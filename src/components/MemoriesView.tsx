/**
 * MemoriesView.tsx — Our Archive
 * Routes between StorySection (scrapbook diary) and PhotoboothSection (live studio).
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Camera } from "lucide-react";
import StorySection from "./memories/StorySection";
import PhotoboothSection from "./memories/PhotoboothSection";
import { WashiTapeDivider, TornEdgeDivider } from "./scrapbook";

const MemoriesView = React.memo(function MemoriesView() {
  const [activeSubTab, setActiveSubTab] = useState<"story" | "photobooth">("story");

  return (
    <div id="memories-section">
      {/* Subtab Switcher */}
      <div className="flex justify-center mb-6">
        <div role="tablist" aria-label="Memories sections" className="flex gap-4 sm:gap-8 border-b border-[var(--border-color)] pb-1">
          {[
            { value: "story", label: "Our Story", icon: BookOpen },
            { value: "photobooth", label: "The Photobooth", icon: Camera },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isSel = activeSubTab === tab.value;
            return (
              <button
                key={tab.value}
                id={`mem-tab-${tab.value}`}
                role="tab"
                aria-selected={isSel}
                onClick={() => setActiveSubTab(tab.value as any)}
                className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all relative cursor-pointer select-none ${
                  isSel
                    ? "text-[var(--primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                <IconComp className="w-4 h-4" />
                {tab.label}
                {isSel && (
                  <motion.div
                    layoutId="activeMemoriesSubtab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <TornEdgeDivider variant="notebook" height={28} className="my-2" />
      <WashiTapeDivider color="rose" />

      {/* Subtab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <AnimatePresence mode="popLayout">
          {activeSubTab === "story" && <StorySection key="story" />}
          {activeSubTab === "photobooth" && <PhotoboothSection key="photobooth" />}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default MemoriesView;
