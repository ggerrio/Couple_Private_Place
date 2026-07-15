// ─── MusicPlayerPlaylist — Search + Shared Playlist ────────────────────

import React from "react";
import { motion } from "motion/react";
import { Search, ListMusic, Loader2 } from "lucide-react";
import { PlaylistTrack, SortMode, triggerHaptic } from "./MusicPlayerUtils";
import { Skeleton } from "../extras/Skeleton";

interface MusicPlayerPlaylistProps {
  searchQuery: string;
  searchError: string;
  searching: boolean;
  onSearchQueryChange: (val: string) => void;
  onSearch: () => void;
  sortMode: SortMode;
  onSortModeChange: (val: SortMode) => void;
  playlistLoading: boolean;
  playlistError: string;
  sortedTracks: PlaylistTrack[];
  currentTrackIndex: number;
  onPlayTrack: (track: PlaylistTrack) => void;
}

export function MusicPlayerPlaylist({
  searchQuery, searchError, searching, onSearchQueryChange, onSearch,
  sortMode, onSortModeChange,
  playlistLoading, playlistError, sortedTracks, currentTrackIndex, onPlayTrack,
}: MusicPlayerPlaylistProps) {
  return (
    <>
      {/* Search / Paste YouTube Link */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste YouTube link or search..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSearch(); } }}
            className="flex-1 px-3 py-2 text-xs bg-white/60 border border-white/70 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder-gray-400"
          />
          <button
            onClick={onSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {searching ? "Searching..." : "Play"}
          </button>
        </div>
        {searchError && <p className="text-[10px] text-red-500">{searchError}</p>}
      </div>

      {/* Playlist */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <ListMusic className="w-3.5 h-3.5" /> Shared Playlist
          </h4>
          <select
            value={sortMode}
            onChange={(e) => onSortModeChange(e.target.value as SortMode)}
            className="text-[10px] bg-white/40 border border-white/60 rounded-lg px-2 py-0.5 outline-none text-[var(--text-muted)] cursor-pointer"
          >
            <option value="recent">Recent</option>
            <option value="oldest">Oldest</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>
        </div>

        {playlistLoading ? (
          <div className="space-y-2 py-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2">
                <Skeleton width={32} height={32} rounded="8px" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton height={12} width="70%" rounded="4px" />
                  <Skeleton height={10} width="40%" rounded="4px" />
                </div>
              </div>
            ))}
          </div>
        ) : playlistError ? (
          <p className="text-[10px] text-amber-600 text-center py-4">{playlistError}</p>
        ) : sortedTracks.length === 0 ? (
          <p className="text-[10px] text-[var(--text-muted)] text-center py-4">No tracks loaded</p>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.035 } },
            }}
            className="max-h-48 overflow-y-auto space-y-1"
            data-lenis-prevent
          >
            {sortedTracks.map((track, idx) => {
              const isActive = idx === currentTrackIndex;
              return (
                <motion.div
                  key={track.videoId + idx}
                  variants={{
                    hidden: { opacity: 0, x: -12 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    onClick={() => { triggerHaptic("medium"); onPlayTrack(track); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold"
                        : "hover:bg-white/40 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <img src={track.thumbnail} alt={track.title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] truncate font-medium">{track.title}</p>
                      <p className="text-[9px] opacity-60 truncate">{track.artist}</p>
                    </div>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse flex-shrink-0" />}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </>
  );
}
