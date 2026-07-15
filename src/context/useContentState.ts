/**
 * useContentState.ts — Memories, journals, letters, time capsules state
 * Extracted from CoupleContext for modularity.
 */
import { useState, useCallback, useRef } from "react";
import { lsGet, dedup, initialMemories, initialJournals, initialLetters, initialTimeCapsules } from "./defaults";
import type { Memory, Journal, Letter, TimeCapsule } from "../types";

export function useContentState() {
  const [memories, setMemories] = useState<Memory[]>(() => dedup(lsGet("couple_memories", initialMemories)));
  const [journals, setJournals] = useState<Journal[]>(() => dedup(lsGet("couple_journals", initialJournals)));
  const [letters, setLetters] = useState<Letter[]>([]);
  const [timeCapsules, setTimeCapsules] = useState<TimeCapsule[]>([]);
  const [userReactions, setUserReactions] = useState<Record<string, Record<string, boolean>>>(() => lsGet("couple_user_reactions", {}));
  const [memoriesLimit, setMemoriesLimit] = useState(15);
  const [journalsLimit, setJournalsLimit] = useState(15);
  const reactionLockRef = useRef(new Set<string>());

  const loadMoreMemories = useCallback(() => {
    setMemoriesLimit(prev => prev + 15);
  }, []);

  const loadMoreJournals = useCallback(() => {
    setJournalsLimit(prev => prev + 15);
  }, []);

  return {
    memories, setMemories,
    journals, setJournals,
    letters, setLetters,
    timeCapsules, setTimeCapsules,
    userReactions, setUserReactions,
    memoriesLimit, setMemoriesLimit,
    journalsLimit, setJournalsLimit,
    reactionLockRef,
    loadMoreMemories, loadMoreJournals,
  };
}
