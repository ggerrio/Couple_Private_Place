/**
 * MemoryToday.tsx — "X years ago today..." feature
 * Shows memories and journal entries from the same date in previous years.
 */

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useCouple } from "../../context/CoupleContext";
import { Calendar, Heart, ArrowRight } from "lucide-react";

export function MemoryToday() {
  const { memories, journals } = useCouple();

  const todayMemories = useMemo(() => {
    const today = new Date();
    const m = today.getMonth();
    const d = today.getDate();
    const y = today.getFullYear();

    // Get memories/journals from the same month/day in previous years
    const items: Array<{
      type: "milestone" | "journal";
      title: string;
      description: string;
      imageUrl?: string;
      date: string;
      yearsAgo: number;
    }> = [];

    for (const mem of memories) {
      const memDate = new Date(mem.date);
      if (memDate.getMonth() === m && memDate.getDate() === d && memDate.getFullYear() < y) {
        items.push({
          type: "milestone",
          title: mem.title,
          description: mem.description || "",
          imageUrl: mem.imageUrl,
          date: mem.date,
          yearsAgo: y - memDate.getFullYear(),
        });
      }
    }

    for (const j of journals) {
      const jDate = new Date(j.date);
      if (jDate.getMonth() === m && jDate.getDate() === d && jDate.getFullYear() < y) {
        items.push({
          type: "journal",
          title: j.title,
          description: j.description || "",
          date: j.date,
          yearsAgo: y - jDate.getFullYear(),
        });
      }
    }

    // Sort by years ago (most recent first)
    items.sort((a, b) => a.yearsAgo - b.yearsAgo);
    return items;
  }, [memories, journals]);

  const handleNavigate = () => {
    window.dispatchEvent(new CustomEvent("changeTab", { detail: "memories" }));
  };

  if (todayMemories.length === 0) {
    return null; // Don't show anything if no matching memories
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="relative overflow-hidden rounded-2xl border border-rose-200/40 bg-gradient-to-br from-rose-50/60 to-amber-50/60 p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-rose-500" />
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">
          On This Day
        </span>
      </div>

      <div className="space-y-2.5">
        {todayMemories.slice(0, 2).map((item, idx) => (
          <div
            key={`${item.type}-${item.date}-${idx}`}
            className="flex items-start gap-3 bg-white/60 rounded-xl p-3 border border-rose-100/40"
          >
            {item.imageUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-rose-100">
                <img loading="lazy"
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 font-mono">
                  {item.yearsAgo} year{item.yearsAgo > 1 ? "s" : ""} ago
                </span>
                {item.type === "journal" && (
                  <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                    Diary
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-gray-800 truncate mt-0.5">{item.title}</p>
              <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}

        {todayMemories.length > 2 && (
          <button
            onClick={handleNavigate}
            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            See all {todayMemories.length} memories <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
