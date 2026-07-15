/**
 * useEngagementState.ts — Missions, garden, song, moods, gratitudes, activity state
 * Extracted from CoupleContext for modularity.
 */
import { useState, useRef } from "react";
import { lsGet, dedup, initialMissions, initialSong, initialMoodHistory, initialLogs } from "./defaults";
import type { Mission, Song, ActivityLog, MoodHistoryEntry, GratitudeEntry } from "../types";

export function useEngagementState() {
  const [missions, setMissions] = useState<Mission[]>(() => dedup(lsGet("couple_missions", initialMissions)));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => dedup(lsGet("couple_activity_logs", initialLogs)));
  const [moodHistory, setMoodHistory] = useState<MoodHistoryEntry[]>(() => dedup(lsGet("couple_mood_history", initialMoodHistory)));
  const [gratitudes, setGratitudes] = useState<GratitudeEntry[]>(() => dedup(lsGet("couple_gratitudes", [])));
  const missionSeededRef = useRef(false);

  const [gardenPlant, setGardenPlant] = useState<"tulip" | "bonsai" | "sakura" | "sunflower">(
    () => lsGet("couple_garden_plant", "sakura") as "tulip" | "bonsai" | "sakura" | "sunflower"
  );
  const [waterLevel, setWaterLevel] = useState(() => lsGet<number>("couple_water_level", 90));

  // Song state
  const [currentSong, setCurrentSong] = useState<Song>(initialSong);

  return {
    missions, setMissions,
    activityLogs, setActivityLogs,
    moodHistory, setMoodHistory,
    gratitudes, setGratitudes,
    missionSeededRef,
    gardenPlant, setGardenPlant,
    waterLevel, setWaterLevel,
    currentSong, setCurrentSong,
  };
}
