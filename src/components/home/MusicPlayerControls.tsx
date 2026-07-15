// ─── MusicPlayerControls — Now Playing + Controls + Volume ──────────────

import React from "react";
import { motion } from "motion/react";
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Repeat1 as RepeatOne, Disc, Volume2, Volume1, VolumeX } from "lucide-react";
import { formatTime, triggerHaptic, RepeatMode } from "./MusicPlayerUtils";

interface MusicPlayerControlsProps {
  currentSong: {
    title: string;
    artist: string;
    artwork: string;
    isPlaying: boolean;
    progressMs: number;
    durationMs: number;
  };
  shuffleOn: boolean;
  repeatMode: RepeatMode;
  localVolume: number;
  onTogglePlay: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onVolumeChange: (val: number) => void;
}

export function MusicPlayerControls({
  currentSong, shuffleOn, repeatMode, localVolume,
  onTogglePlay, onShuffle, onRepeat, onSkipBack, onSkipForward, onVolumeChange,
}: MusicPlayerControlsProps) {
  return (
    <div className="bg-white/40 rounded-2xl p-4 border border-white/50 space-y-3">
      {/* Track Info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center flex-shrink-0">
          {currentSong.artwork ? (
            <img src={currentSong.artwork} alt={currentSong.title} className="w-full h-full object-cover rounded-xl" loading="lazy" />
          ) : (
            <Disc className="w-6 h-6 text-rose-500 animate-spin-slow" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[var(--text-main)] truncate">
            {currentSong.title || "No track selected"}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] truncate">
            {currentSong.artist || "Search or paste a YouTube link"}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => { triggerHaptic("medium"); onTogglePlay(); }}
          className="w-9 h-9 rounded-full bg-[var(--primary)] text-white flex items-center justify-center hover:opacity-90 transition-all cursor-pointer flex-shrink-0"
        >
          {currentSong.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </motion.button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-1000"
            style={{ width: `${currentSong.durationMs > 0 ? (currentSong.progressMs / currentSong.durationMs) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-mono">
          <span>{formatTime(currentSong.progressMs)}</span>
          <span>{formatTime(currentSong.durationMs)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { triggerHaptic("light"); onShuffle(); }}
          className={`p-2 rounded-full transition-colors cursor-pointer ${shuffleOn ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
        >
          <Shuffle className="w-4 h-4" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { triggerHaptic("medium"); onSkipBack(); }}
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
        >
          <SkipBack className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { triggerHaptic("light"); onRepeat(); }}
          className={`p-2 rounded-full transition-colors cursor-pointer ${repeatMode !== "off" ? "text-[var(--primary)] bg-[var(--primary)]/10" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
        >
          {repeatMode === "one" ? <RepeatOne className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => { triggerHaptic("medium"); onSkipForward(); }}
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
        >
          <SkipForward className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2">
        <button onClick={() => onVolumeChange(localVolume === 0 ? 80 : 0)} className="cursor-pointer">
          {localVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            : localVolume < 50 ? <Volume1 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            : <Volume2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
        </button>
        <input type="range" min={0} max={100} value={localVolume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="flex-1 h-1 accent-[var(--primary)] cursor-pointer" />
      </div>
    </div>
  );
}
