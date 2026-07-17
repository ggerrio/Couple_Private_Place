/**
 * AdventureView.tsx — Date Night orchestrator
 * 🎲 Date Night Roulette — synced random pick across LDR partners.
 * Replaces the legacy Dream Board bucket-list feature.
 */
import React from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";

import { ScrapbookPage, WashiTapeDivider } from "./scrapbook";
import DateNightRoulette from "./adventure/DateNightRoulette";

const AdventureView = React.memo(function AdventureView() {
  return (
    <div>
      <ScrapbookPage className="max-w-none">
        <div className="text-center pb-4">
          <h2 className="text-2xl font-serif font-bold text-[var(--text-main)] flex items-center justify-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 dark:text-rose-400" />
            Date Night
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Tonight's pick, synced across screens. Spin together 🎲
          </p>
        </div>
      </ScrapbookPage>

      <WashiTapeDivider color="coral" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <DateNightRoulette />
      </motion.div>
    </div>
  );
});

export default AdventureView;
