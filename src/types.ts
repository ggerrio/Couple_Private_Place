/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  id: "user_a" | "user_b";
  name: string;
  avatar: string;
  mood: string;       // e.g. "happy" | "cozy" | "sleepy" | "excited" | "loved"
  status: string;     // e.g. "Drinking Coffee", "Coding", "Working"
  xp: number;
  level: number;
}

export interface Comment {
  id: string;
  authorId: "user_a" | "user_b";
  text: string;
  date: string;
}

export interface Memory {
  id: string;
  type: "photobooth" | "milestone";
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

export interface Mission {
  id: string;
  text: string;
  xpReward: number;
  completed: boolean;
  type: "daily" | "weekly";
}

export interface Song {
  title: string;
  artist: string;
  album: string;
  artwork: string;
  durationMs: number;
  progressMs: number;
  isPlaying: boolean;
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

export type ThemeType =
  | "korean-cafe"
  | "sakura"
  | "studio-ghibli"
  | "pixel-retro"
  | "night"
  | "coffee"
  | "pastel"
  | "valentine"
  | "christmas"
  | "minimal-white"
  | "artistic-flair";
