/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  id: "user_a" | "user_b";
  name: string;
  avatar: string;
  mood: string;       // e.g. "happy" | "cozy" | "sleepy" | "excited" | "loved"
  moodNote?: string;  // e.g. custom text entered alongside mood
  status: string;     // e.g. "Drinking Coffee", "Coding", "Working"
  latitude?: number;
  longitude?: number;
  weatherCity?: string;
  gender?: "pria" | "wanita";
  emoji?: string;
  timezoneOffset?: number;
  timezoneName?: string;
  lastActive?: number;
}

export interface Comment {
  id: string;
  authorId: "user_a" | "user_b";
  text: string;
  date: string;
}

export interface Memory {
  id: string;
  type: "photobooth" | "milestone" | "drawing";
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  creatorId: "user_a" | "user_b";
  reactions: Record<string, number>; // emoji -> count
  comments: Comment[];
  bgStyle?: string;
  filterClass?: string;
  layout?: "2-cut" | "4-cut" | "6-cut" | "polaroid";
  photosList?: string[];
  partnerPhotosList?: string[];
  colabMode?: "split" | "alternating" | "solo";
  stickersList?: { id: number; sticker: string; x: number; y: number }[];
  showOnTimeline?: boolean;
  polaroidNote?: string;
  // Photobooth customization — captured at session end so the saved Memory
  // carries the same design tokens the user picked in the editing step.
  stripPreset?: string;
  customFrameColor?: string;
  customTextColor?: string;
  customAccentColor?: string;
  caption?: string;
}

export interface Journal {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  weather: string;    // e.g. "sunny" | "rainy" | "cloudy" | "snowy"
  mood: string;       // e.g. "cozy" | "excited" | "peaceful" | "sleepy"
  imageUrl?: string;
  tags: string[];
  creatorId?: "user_a" | "user_b";
  editedAt?: string;
}

export interface Letter {
  id: string;
  senderId: "user_a" | "user_b";
  recipientId: "user_a" | "user_b";
  title: string;
  content: string; // Markdown supported
  scheduledFor?: string; // ISO date string (future lock)
  isOpened: boolean;
  reactions: string[]; // list of emojis
  createdAt: string;
}

export interface TimeCapsule {
  id: string;
  senderId: "user_a" | "user_b";
  openDate: string; // ISO date
  message: string;
  isOpened: boolean;
  createdAt: string;
}



export interface Song {
  title: string;
  artist: string;
  album: string;
  artwork: string;
  durationMs: number;
  progressMs: number;
  isPlaying: boolean;
  videoId?: string; // YouTube video ID — when set, iframe renders real audio
}

export interface ActivityLog {
  id: string;
  userId: "user_a" | "user_b";
  text: string;
  timestamp: string;
}

export interface MoodHistoryEntry {
  id: string;
  userId: "user_a" | "user_b";
  userName: string;
  mood: string;
  note?: string;
  timestamp: string;
}

export interface GratitudeEntry {
  id: string;
  userId: "user_a" | "user_b";
  text: string;
  date: string; // "YYYY-MM-DD"
  createdAt: string;
}

export interface CustomGreetings {
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
}

/* Default custom greetings */
export const DEFAULT_GREETINGS: CustomGreetings = {
  morning: "Good morning, sunshine",
  afternoon: "Good afternoon, love",
  evening: "Good evening, darling",
  night: "Good night, starlight",
};

export interface DrawPoint {
  x: number;
  y: number;
  color: string;
  brushSize: number;
  type: "start" | "draw" | "end";
}

export interface DrawCursor {
  userId: "user_a" | "user_b";
  x: number;
  y: number;
  isDrawing: boolean;
}

export interface PhotoboothRoom {
  code: string;
  hostId: "user_a" | "user_b";
  guestId: "user_a" | "user_b" | null;
  layout: string;
  bg: string;
  filter: string;
  caption?: string;
  stripPreset?: string;
  customFrameColor?: string;
  customTextColor?: string;
  customAccentColor?: string;
  state: "waiting" | "countdown" | "captured" | "editing" | "done";
  round: number;
  totalRounds: number;
  countdownStartAt: number | null;
  photosA: string[];
  photosB: string[];
  createdAt: string;
}

/**
 * Spin session for the Date Night Roulette feature.
 *
 * Lives at rooms/date_night_roulette as a singleton — only the *current*
 * (latest) spin is meaningful. When expiresAt passes, the UI treats the
 * slot as empty and shows the idle "Spin tonight!" state.
 *
 * `spinId` is the seed used to derive the lock-step result index on BOTH
 * clients via FNV-1a, so partner and local device land on the same item.
 */
export interface DateNightRoulette {
  spinId: string;
  spunBy: "user_a" | "user_b";
  selectedCategory: "movie" | "topic" | "chapter" | "recipe";
  startedAt: number;
  expiresAt: number;
}

