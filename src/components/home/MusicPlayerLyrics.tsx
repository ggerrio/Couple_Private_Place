// ─── MusicPlayerLyrics — Synced lyrics display ─────────────────────────

import React, { RefObject } from "react";
import { SkeletonText } from "../extras/Skeleton";
import { LyricLine } from "./MusicPlayerUtils";

interface MusicPlayerLyricsProps {
  lyricsLines: LyricLine[] | null;
  lyricsSynced: boolean;
  lyricsLoading: boolean;
  lyricsError: string;
  activeLineIndex: number;
  lyricsScrollRef: RefObject<HTMLDivElement | null>;
  lyricsLineRefs: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
}

export function MusicPlayerLyrics({
  lyricsLines, lyricsSynced, lyricsLoading, lyricsError,
  activeLineIndex, lyricsScrollRef, lyricsLineRefs,
}: MusicPlayerLyricsProps) {
  if (lyricsLoading) {
    return (
      <div className="bg-black/[0.02] rounded-2xl p-4 border border-black/5">
        <SkeletonText lines={4} className="py-2" />
      </div>
    );
  }

  if (lyricsError) {
    return (
      <div className="bg-black/[0.02] rounded-2xl p-4 border border-black/5">
        <p className="text-xs text-[var(--text-muted)] text-center italic py-4">{lyricsError}</p>
      </div>
    );
  }

  if (!lyricsLines || lyricsLines.length === 0) return null;

  return (
    <div className="relative bg-black/[0.02] rounded-2xl p-4 max-h-40 overflow-y-auto overflow-x-hidden border border-black/5" ref={lyricsScrollRef} data-lenis-prevent>
      <div className="space-y-1.5 w-full">
        {lyricsLines.map((line, i) => (
          <div
            key={i}
            ref={(el) => { lyricsLineRefs.current[i] = el; }}
            className={`text-sm transition-all duration-300 break-words whitespace-pre-wrap origin-left ${
              i === activeLineIndex
                ? "text-[var(--primary)] font-bold scale-[1.03]"
                : "text-[var(--text-muted)]/50"
            }`}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
