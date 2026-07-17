/**
 * useEngagementState.ts — Moods, gratitudes, activity, garden, song state
 * Extracted from CoupleContext for modularity.
 */
import { useState, useRef } from "react";
import { lsGet, dedup, initialSong, initialMoodHistory, initialLogs } from "./defaults";
import type { Song, ActivityLog, MoodHistoryEntry, GratitudeEntry } from "../types";

export function useEngagementState() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => dedup(lsGet("couple_activity_logs", initialLogs)));
  const [moodHistory, setMoodHistory] = useState<MoodHistoryEntry[]>(() => dedup(lsGet("couple_mood_history", initialMoodHistory)));
  const [gratitudes, setGratitudes] = useState<GratitudeEntry[]>(() => dedup(lsGet("couple_gratitudes", [])));

  const [gardenPlant, setGardenPlant] = useState<"tulip" | "bonsai" | "sakura" | "sunflower">(
    () => lsGet("couple_garden_plant", "sakura") as "tulip" | "bonsai" | "sakura" | "sunflower"
  );
  const [waterLevel, setWaterLevel] = useState(() => lsGet<number>("couple_water_level", 90));

  // Song state
  const [currentSong, setCurrentSong] = useState<Song>(initialSong);

  return {
    activityLogs, setActivityLogs,
    moodHistory, setMoodHistory,
    gratitudes, setGratitudes,
    gardenPlant, setGardenPlant,
    waterLevel, setWaterLevel,
    currentSong, setCurrentSong,
  };
}
