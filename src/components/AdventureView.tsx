/**
 * AdventureView.tsx — Secret Garden orchestrator
 * Interactive Terrarium — pure aesthetic, no XP/levels/missions
 */
import React from "react";
import { motion } from "motion/react";
import { Leaf } from "lucide-react";

import { ScrapbookPage, WashiTapeDivider } from "./scrapbook";
import InteractiveTerrarium from "./adventure/InteractiveTerrarium";

const AdventureView = React.memo(function AdventureView() {
  return (
    <div>
      <ScrapbookPage className="max-w-none">
        <div className="text-center pb-4">
          <h2 className="text-2xl font-serif font-bold text-[var(--text-main)] flex items-center justify-center gap-2">
            <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Secret Garden
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            A little world that grows with you — no numbers, just nature.
          </p>
        </div>
      </ScrapbookPage>

      <WashiTapeDivider color="moss" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <InteractiveTerrarium />
      </motion.div>
    </div>
  );
});

export default AdventureView;
