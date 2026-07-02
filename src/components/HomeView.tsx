/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { useCouple } from "../context/CoupleContext";
import { Memory } from "../types";
import { db, auth } from "../firebaseClient";
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, setDoc } from "firebase/firestore";
import { motion } from "motion/react";
import {
  Heart,
  Calendar,
  CloudSun,
  Smile,
  Music,
  Compass,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Gift,
  CloudLightning,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudDrizzle,
  Thermometer,
  Wind,
  MapPin,
  AlertCircle,
  Trophy,
  CheckCircle2,
  Plus,
  Play,
  Pause,
  ExternalLink,
  Disc,
  Target,
  Flame,
  Sprout,
  Droplets,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Wifi,
  WifiOff,
  Camera,
  Volume2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

// Curated romantic tracks representing Heidi's Spotify playlist
const CURATED_ROMANTIC_VIBES = [
  {
    title: "Somethin' Stupid",
    artist: "Robbie Williams, Nicole Kidman",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851a1fec51b4d321f10723fa14a",
    durationMs: 200000,
    spotifyId: "4kSKacywUJHdhyst4PL6pl",
    glowColor: "rgba(239, 68, 68, 0.2)"
  },
  {
    title: "Dream a Little Dream",
    artist: "Nicole Kidman",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851ff86a2044a57d3d1c3665a55",
    durationMs: 215000,
    spotifyId: "6pJOaeH9nEMA1hAExxWiRP",
    glowColor: "rgba(139, 92, 246, 0.22)"
  },
  {
    title: "Rayuan Perempuan Gila",
    artist: "Nadin Amizah",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048519bbf0358fb086f43ffde5148",
    durationMs: 230000,
    spotifyId: "1nYdkPCbHdYi4w7s2L6SHA",
    glowColor: "rgba(245, 158, 11, 0.18)"
  },
  {
    title: "Good Looking",
    artist: "Suki Waterhouse",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d0000485110542e1524cbfe41bdb82ad3",
    durationMs: 245000,
    spotifyId: "026wpXkLAjImiWOzzcJBHj",
    glowColor: "rgba(6, 182, 212, 0.2)"
  },
  {
    title: "Let The Light In (feat. Father John Misty)",
    artist: "Lana Del Rey, Father John Misty",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d0000485159ae8cf65d498afdd5585634",
    durationMs: 260000,
    spotifyId: "4qG7hWhljsqqENL5PaLA2z",
    glowColor: "rgba(236, 72, 153, 0.2)"
  },
  {
    title: "Shades Of Cool",
    artist: "Lana Del Rey",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048511624590458126fc8b8c64c2f",
    durationMs: 275000,
    spotifyId: "4VSg5K1hnbmIg4PwRdY6wV",
    glowColor: "rgba(16, 185, 129, 0.2)"
  },
  {
    title: "Brooklyn Baby",
    artist: "Lana Del Rey",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048511624590458126fc8b8c64c2f",
    durationMs: 290000,
    spotifyId: "1NZs6n6hl8UuMaX0UC0YTz",
    glowColor: "rgba(59, 130, 246, 0.2)"
  },
  {
    title: "Say Yes To Heaven",
    artist: "Lana Del Rey",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851aa27708d07f49c82ff0d0dae",
    durationMs: 205000,
    spotifyId: "6GGtHZgBycCgGBUhZo81xe",
    glowColor: "rgba(239, 68, 68, 0.2)"
  },
  {
    title: "intro (end of the world)",
    artist: "Ariana Grande",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048518b58d20f1b77295730db15b4",
    durationMs: 220000,
    spotifyId: "2o1pb13quMReXZqE7jWsgq",
    glowColor: "rgba(139, 92, 246, 0.22)"
  },
  {
    title: "Someday",
    artist: "The Strokes",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851a388a3f20d1bf2123249cc79",
    durationMs: 235000,
    spotifyId: "56NkIxSZZiMpFP5ZNSxtnT",
    glowColor: "rgba(245, 158, 11, 0.18)"
  },
  {
    title: "Selfless",
    artist: "The Strokes",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851e3f1ba3de4659708c25d0f39",
    durationMs: 250000,
    spotifyId: "2t0wwvR15fc3K1ey8OiOaN",
    glowColor: "rgba(6, 182, 212, 0.2)"
  },
  {
    title: "Saturday Night",
    artist: "Misfits",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048519a2665c5a1c7963d66d303f1",
    durationMs: 265000,
    spotifyId: "3jXptpf8Z3aU9O1Bj6YCl0",
    glowColor: "rgba(236, 72, 153, 0.2)"
  },
  {
    title: "Anything You Want",
    artist: "Reality Club",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048515b7cbf4c2e0c4607dd56b137",
    durationMs: 280000,
    spotifyId: "2QB8FwOszur18Ai7t2XnNi",
    glowColor: "rgba(16, 185, 129, 0.2)"
  },
  {
    title: "Just like Heaven",
    artist: "The Cure",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048517f22337546d61faca55e0f4f",
    durationMs: 295000,
    spotifyId: "76GlO5H5RT6g7y0gev86Nk",
    glowColor: "rgba(59, 130, 246, 0.2)"
  },
  {
    title: "Till There Was You - Remastered 2009",
    artist: "The Beatles",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851608a63ad5b18e99da94a3f73",
    durationMs: 210000,
    spotifyId: "0ESIjVxnDnCDaTPo6sStHm",
    glowColor: "rgba(239, 68, 68, 0.2)"
  },
  {
    title: "In My Life - Remastered 2009",
    artist: "The Beatles",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851ed801e58a9ababdea6ac7ce4",
    durationMs: 225000,
    spotifyId: "3KfbEIOC7YIv90FIfNSZpo",
    glowColor: "rgba(139, 92, 246, 0.22)"
  },
  {
    title: "I Will - Remastered 2009",
    artist: "The Beatles",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048514ce8b4e42588bf18182a1ad2",
    durationMs: 240000,
    spotifyId: "09x9v1o51dbqi5H0u7UGfp",
    glowColor: "rgba(245, 158, 11, 0.18)"
  },
  {
    title: "Another Life",
    artist: "Motionless In White",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851944e11093f0e01c60be5be8f",
    durationMs: 255000,
    spotifyId: "0YZEYxd1oiqZRFhnnmTKKi",
    glowColor: "rgba(6, 182, 212, 0.2)"
  },
  {
    title: "Helena",
    artist: "My Chemical Romance",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851cab7ae4868e9f9ce6bdfdf43",
    durationMs: 270000,
    spotifyId: "5dTHtzHFPyi8TlTtzoz1J9",
    glowColor: "rgba(236, 72, 153, 0.2)"
  },
  {
    title: "Under You",
    artist: "Foo Fighters",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048516fc1b2193f39c1eac7ad253d",
    durationMs: 285000,
    spotifyId: "6vWu5uWlox5TVDPl3LvoG3",
    glowColor: "rgba(16, 185, 129, 0.2)"
  },
  {
    title: "I Thought I Saw Your Face Today",
    artist: "She & Him",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851a47c6d8a934b4833c0916cc9",
    durationMs: 200000,
    spotifyId: "0myRViRgmQ3J8izICXEAVO",
    glowColor: "rgba(59, 130, 246, 0.2)"
  },
  {
    title: "Pretty Boy",
    artist: "The Neighbourhood",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048515aa30ba7fff59083baccc773",
    durationMs: 215000,
    spotifyId: "7IL8PSVwLOJxqYne6azxQv",
    glowColor: "rgba(239, 68, 68, 0.2)"
  },
  {
    title: "Sunshine",
    artist: "The Panturas",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048513d3e53004945125cfeeeadc5",
    durationMs: 230000,
    spotifyId: "5j7HESfa8OXs3hTqQ1ZvnR",
    glowColor: "rgba(139, 92, 246, 0.22)"
  },
  {
    title: "Stand by Me",
    artist: "Oasis",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851ecaed060a7fd28be92069778",
    durationMs: 245000,
    spotifyId: "2gANywSFYF58YFMPdDSAjC",
    glowColor: "rgba(245, 158, 11, 0.18)"
  },
  {
    title: "Moonlight",
    artist: "Ariana Grande",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048512e651648db439a9b5995e065",
    durationMs: 260000,
    spotifyId: "1qcJdr8TYuGjFhjRoYNC3e",
    glowColor: "rgba(6, 182, 212, 0.2)"
  },
  {
    title: "The Girl Is Mine (with Paul McCartney)",
    artist: "Michael Jackson, Paul McCartney",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d0000485132a7d87248d1b75463483df5",
    durationMs: 275000,
    spotifyId: "4IT6vDuKprKl6jyVndlY8V",
    glowColor: "rgba(236, 72, 153, 0.2)"
  },
  {
    title: "Patience",
    artist: "Guns N' Roses",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851d2c9d673548c12ad1c32e38d",
    durationMs: 290000,
    spotifyId: "7D5n2kpYH2WSqIyEO9MeXf",
    glowColor: "rgba(16, 185, 129, 0.2)"
  },
  {
    title: "Kingston",
    artist: "Faye Webster",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d00004851ac4ebd092fa2cf210e4c8023",
    durationMs: 205000,
    spotifyId: "5WbfFTuIldjL9x7W6y5l7R",
    glowColor: "rgba(59, 130, 246, 0.2)"
  },
  {
    title: "Love Like You (feat. Rebecca Sugar) - End Credits",
    artist: "Steven Universe, Rebecca Sugar",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d0000485134f2d9844b4114bd781d5bc4",
    durationMs: 220000,
    spotifyId: "3z9OnsnvM6SFN2dzrSDdVO",
    glowColor: "rgba(239, 68, 68, 0.2)"
  },
  {
    title: "Prisoner",
    artist: "The Weeknd, Lana Del Rey",
    album: "Romantic Vibe",
    artwork: "https://i.scdn.co/image/ab67616d000048517fcead687e99583072cc217b",
    durationMs: 235000,
    spotifyId: "1gZADNt16Oh23jWyMYRk4p",
    glowColor: "rgba(139, 92, 246, 0.22)"
  }
];

const TRACK_LYRICS: Record<string, { ranges: [number, number | null][]; lines: string[] }> = {
  "Sempurna": {
    ranges: [[0, 60000], [60000, 120000], [120000, null]],
    lines: ["\"Kau begitu sempurna...\"", "\"Di mataku kau begitu indah...\"", "\"Kau membuat diriku terlahir kembali...\""]
  },
  "About You": {
    ranges: [[0, 60000], [60000, 120000], [120000, null]],
    lines: ["\"Do you think I have forgotten...\"", "\"About you?...\"", "\"There was something about you that I can't quite remember...\""]
  },
  "Komang": {
    ranges: [[0, 60000], [60000, 120000], [120000, null]],
    lines: ["\"Dari kejauhan tergambar cerita tentang kita...\"", "\"Sebab kau terlalu indah dari sekedar kata...\"", "\"Dunia kala hari itu, kau senyum...\""]
  },
  "Double Take": {
    ranges: [[0, 60000], [60000, 120000], [120000, null]],
    lines: ["\"I could say I never drag my feet...\"", "\"And you do a double take when I walk by...\"", "\"Boy, you make my heart skip a beat...\""]
  },
  "Kemesraan": {
    ranges: [[0, 60000], [60000, 120000], [120000, null]],
    lines: ["\"Suatu hari dikala kita duduk ditepi pantai...\"", "\"Kemesraan ini jangan pernah berlalu...\"", "\"Ingin ku lukiskan dalam lubuk hatiku...\""]
  },
  "Hati-Hati di Jalan": {
    ranges: [[0, 60000], [60000, 120000], [120000, null]],
    lines: ["\"Perjalanan membawamu bertemu denganku...\"", "\"Kini kita harus melangkah masing-masing...\"", "\"Hati-hati di jalan...\""]
  }
};

const quotes = [
  "In your smile, I see something more beautiful than the stars. ✨",
  "No matter how grey the day is, thinking of you makes my heart blossom. 🌸",
  "If I had a flower for every time I thought of you, I could walk through my garden forever. 🌿",
  "We are made of different stars, but we shine brightest when we are together. ☕",
  "My favorite coffee place is wherever you are sitting across from me. ☕",
  "You make the ordinary moments feel like Studio Ghibli magic. 🏰",
  "With you, life feels like a warm yellow sweater on a chilly autumn afternoon.",
  "You are my favorite notification. 📱💖",
  "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine. 💕",
  "You are my today and all of my tomorrows. 🌅",
  "Whatever our souls are made of, yours and mine are the same. ✨",
  "To love and be loved is to feel the sun from both sides. ☀",
  "I look at you and see the rest of my life in front of my eyes. 💖",
  "The best thing to hold onto in life is each other. 🤝",
  "If I know what love is, it is because of you. 🌸",
  "You are the piece of me I didn't know was missing. 🧩",
  "My heart is and always will be yours. 🔐",
  "To the world you may be one person, but to me you are the world. 🌍",
  "Grow old with me! The best is yet to be. 🪴",
  "Loving you is both my biggest adventure and my safest sanctuary. 🏰",
  "Our love story is my absolute favorite. 📖"
];

// Helper for formatting relative times
const formatRelativeTime = (isoString: string) => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  } catch (e) {
    return "Recently";
  }
};

interface ArtisticWeatherIconProps {
  code: number;
  isDay?: boolean;
  className?: string;
}

const ArtisticWeatherIcon: React.FC<ArtisticWeatherIconProps> = ({ code, isDay = true, className = "w-8 h-8" }) => {
  // Map weather code to general states: sunny, cloudy, rainy, snowy, stormy
  let state: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" = "sunny";
  if (code === 0) state = "sunny";
  else if (code === 1 || code === 2 || code === 3) state = "cloudy";
  else if (code === 45 || code === 48) state = "cloudy";
  else if (code === 51 || code === 53 || code === 55) state = "rainy";
  else if (code === 61 || code === 63 || code === 65) state = "rainy";
  else if (code === 71 || code === 73 || code === 75) state = "snowy";
  else if (code === 80 || code === 81 || code === 82) state = "rainy";
  else if (code === 95 || code === 96 || code === 99) state = "stormy";

  if (state === "sunny") {
    return (
      <svg
        className={`${className} hover:scale-110 transition-transform duration-300`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="artistic-icon-sunny"
      >
        <circle cx="50" cy="50" r="20" fill="#dda15e" opacity="0.85" />
        <path
          d="M50 12 C52 22, 48 22, 50 12 Z M50 88 C48 78, 52 78, 50 88 Z"
          stroke="#bc6c25"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M12 50 C22 52, 22 48, 12 50 Z M88 50 C78 48, 78 52, 88 50 Z"
          stroke="#bc6c25"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M23 23 C31 29, 29 31, 23 23 Z M77 77 C69 71, 71 69, 77 77 Z"
          stroke="#bc6c25"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M77 23 C71 29, 69 31, 77 23 Z M23 77 C29 69, 31 71, 23 77 Z"
          stroke="#bc6c25"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="50" cy="50" r="12" stroke="#283618" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    );
  }

  if (state === "cloudy") {
    return (
      <svg
        className={`${className} hover:scale-110 transition-transform duration-300`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="artistic-icon-cloudy"
      >
        {isDay && (
          <circle cx="62" cy="38" r="14" fill="#dda15e" opacity="0.6" />
        )}
        <path
          d="M25 65 C20 65, 16 60, 16 54 C16 47, 22 43, 28 43 C30 32, 40 25, 52 25 C64 25, 73 34, 75 45 C82 45, 88 50, 88 57 C88 64, 82 65, 78 65 Z"
          fill="#fbf7f0"
          stroke="#283618"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M32 50 C38 48, 44 48, 48 51"
          stroke="#bc6c25"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M54 58 C62 56, 68 58, 72 61"
          stroke="#bc6c25"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (state === "rainy") {
    return (
      <svg
        className={`${className} hover:scale-110 transition-transform duration-300`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="artistic-icon-rainy"
      >
        <path
          d="M25 55 C20 55, 16 50, 16 44 C16 37, 22 33, 28 33 C30 22, 40 15, 52 15 C64 15, 73 24, 75 35 C82 35, 88 40, 88 47 C88 54, 82 55, 78 55 Z"
          fill="#f4eae1"
          stroke="#283618"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <g>
          <path
            d="M32 65 L28 77"
            stroke="#bc6c25"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M50 68 L46 82"
            stroke="#dda15e"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M68 64 L64 76"
            stroke="#bc6c25"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
        <path
          d="M24 84 C28 84, 30 82, 30 82"
          stroke="#283618"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M44 87 C48 87, 50 85, 50 85"
          stroke="#283618"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (state === "snowy") {
    return (
      <svg
        className={`${className} hover:scale-110 transition-transform duration-300`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        id="artistic-icon-snowy"
      >
        <path
          d="M25 55 C20 55, 16 50, 16 44 C16 37, 22 33, 28 33 C30 22, 40 15, 52 15 C64 15, 73 24, 75 35 C82 35, 88 40, 88 47 C88 54, 82 55, 78 55 Z"
          fill="#ffffff"
          stroke="#283618"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <g>
          <path d="M35 65 L35 73 M31 69 L39 69" stroke="#bc6c25" strokeWidth="2" strokeLinecap="round" />
          <path d="M50 68 L50 78 M45 73 L55 73" stroke="#dda15e" strokeWidth="2" strokeLinecap="round" />
          <path d="M65 65 L65 73 M61 69 L69 69" stroke="#bc6c25" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      className={`${className} hover:scale-110 transition-transform duration-300`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      id="artistic-icon-stormy"
    >
      <path
        d="M25 55 C20 55, 16 50, 16 44 C16 37, 22 33, 28 33 C30 22, 40 15, 52 15 C64 15, 73 24, 75 35 C82 35, 88 40, 88 47 C88 54, 82 55, 78 55 Z"
        fill="#eae0d5"
        stroke="#283618"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M52 52 L42 68 L54 68 L46 85"
        stroke="#bc6c25"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="#dda15e"
      />
    </svg>
  );
};

// Define global window types for Spotify Playback SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

export default function HomeView() {
  const {
    currentUser,
    userA,
    userB,
    updateProfile,
    currentSong,
    setSongPlayState,
    updateSongProgress,
    activityLogs,
    anniversaryDate,
    birthdayA,
    birthdayB,
    awardXp,
    moodHistory,
    addMoodHistoryEntry,
    missions,
    toggleMission,
    syncSongToPartner: contextSyncSongToPartner,
    memories,
  } = useCouple();

  // STATE FOR SPOTLIGHT MEMORY OF THE DAY
  const [spotlightMemory, setSpotlightMemory] = useState<Memory | null>(null);
  const [rotationCountdown, setRotationCountdown] = useState<string>("24h");

  useEffect(() => {
    if (!memories || memories.length === 0) {
      setSpotlightMemory(null);
      return;
    }

    const memoriesWithImages = memories.filter(
      (m) => m.imageUrl && m.imageUrl.trim() !== ""
    );
    if (memoriesWithImages.length === 0) {
      setSpotlightMemory(null);
      return;
    }

    const selectSpotlight = () => {
      const storedId = localStorage.getItem("couple_spotlight_memory_id");
      const storedTime = localStorage.getItem("couple_spotlight_selected_at");
      const now = Date.now();
      let selected: Memory | undefined;

      if (storedId && storedTime) {
        const selectedAt = parseInt(storedTime, 10);
        // Check if less than 24 hours (86,400,000 ms)
        if (now - selectedAt < 24 * 60 * 60 * 1000) {
          selected = memoriesWithImages.find((m) => m.id === storedId);
        }
      }

      if (!selected) {
        const randomIndex = Math.floor(Math.random() * memoriesWithImages.length);
        selected = memoriesWithImages[randomIndex];
        localStorage.setItem("couple_spotlight_memory_id", selected.id);
        localStorage.setItem("couple_spotlight_selected_at", now.toString());
      }

      setSpotlightMemory(selected || null);
    };

    selectSpotlight();

    const updateCountdown = () => {
      const storedTime = localStorage.getItem("couple_spotlight_selected_at");
      if (storedTime) {
        const elapsed = Date.now() - parseInt(storedTime, 10);
        const remainingMs = Math.max(0, 24 * 60 * 60 * 1000 - elapsed);

        if (remainingMs <= 0) {
          selectSpotlight();
        } else {
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setRotationCountdown(`${hours}h ${minutes}m`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 15000); // update every 15s

    return () => clearInterval(interval);
  }, [memories]);

  // Haptic feedback trigger for tactile mobile confirmation
  const triggerHaptic = (type: "light" | "medium" | "heavy" | "success" = "light") => {
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      try {
        if (type === "light") {
          window.navigator.vibrate(12);
        } else if (type === "medium") {
          window.navigator.vibrate(35);
        } else if (type === "heavy") {
          window.navigator.vibrate(70);
        } else if (type === "success") {
          window.navigator.vibrate([20, 40, 20]);
        }
      } catch (err) {
        console.warn("Haptics check failed:", err);
      }
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  // Relationship Streak & Growing Plant State
  const [streakCount, setStreakCount] = useState<number>(() => {
    const stored = localStorage.getItem("couple_relationship_streak");
    return stored ? parseInt(stored, 10) : 18;
  });
  const [lastCheckInDate, setLastCheckInDate] = useState<string>(() => {
    return localStorage.getItem("couple_last_streak_date") || "";
  });
  const [plantParticles, setPlantParticles] = useState<{ id: number; x: number; y: number; type: "water" | "heart" | "sparkle" }[]>([]);

  const isCheckedInToday = lastCheckInDate === todayStr;

  const handleCheckIn = () => {
    if (isCheckedInToday) {
      triggerHaptic("success");
      triggerWaterAnimation();
      awardXp(5, "sprinkling extra water on your growing bond");
      return;
    }

    const nextStreak = streakCount + 1;
    setStreakCount(nextStreak);
    setLastCheckInDate(todayStr);
    localStorage.setItem("couple_relationship_streak", nextStreak.toString());
    localStorage.setItem("couple_last_streak_date", todayStr);

    triggerHaptic("success");
    triggerWaterAnimation();
    awardXp(25, "checking in daily and growing your relationship streak! 🌱🔥");
  };

  const triggerWaterAnimation = () => {
    const newParticles: { id: number; x: number; y: number; type: "water" | "heart" | "sparkle" }[] = [];
    // Falling rain drops
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: Math.random(),
        x: 15 + Math.random() * 70,
        y: -10 - Math.random() * 20,
        type: "water"
      });
    }
    // Rising elements
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: Math.random(),
        x: 25 + Math.random() * 50,
        y: 45 + Math.random() * 15,
        type: Math.random() > 0.4 ? "heart" : "sparkle"
      });
    }
    setPlantParticles(prev => [...prev, ...newParticles]);

    setTimeout(() => {
      setPlantParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, 1500);
  };

  // ════════════════════════════════════════════════════════════
  // 1. YOUTUBE WEB IFRAME API STATES & SEARCH UTILITY
  // ════════════════════════════════════════════════════════════
  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [isYtReady, setIsYtReady] = useState(false);
  const [ytPlaybackState, setYtPlaybackState] = useState<number>(-1);
  const [spotifyErrorState, setSpotifyErrorState] = useState<string | null>(null);
  const [isSdkConnected, setIsSdkConnected] = useState(true);
  const [spotifyDeviceId, setSpotifyDeviceId] = useState<string | null>("YouTube Stealth Audio");
  const [spotifyToken, setSpotifyToken] = useState("youtube-active");
  const [isSdkMode, setIsSdkMode] = useState(true);
  const [spotifyPlaybackState, setSpotifyPlaybackState] = useState<any>(null);

  const searchYouTubeVideo = async (artist: string, title: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error("VITE_YOUTUBE_API_KEY is not defined");
      return "";
    }
    const query = encodeURIComponent(`${artist} - ${title} (Audio)`);
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&maxResults=1&type=video&key=${apiKey}`);
      const data = await res.json();
      return data?.items?.[0]?.id?.videoId || "";
    } catch (error) {
      console.error("Error searching YouTube video:", error);
      return "";
    }
  };

  // ════════════════════════════════════════════════════════════
  // 2. ISOLATED FIRESTORE PRODUCER (YouTube-driven)
  // ════════════════════════════════════════════════════════════
  const broadcastLocalAction = async (trackData: any, isPlayingAction: boolean) => {
    try {
      const roomRef = doc(db, "rooms", "spotify_room");
      await setDoc(roomRef, {
        title: trackData.title,
        artist: trackData.artist,
        album: trackData.album || "",
        artwork: trackData.artwork,
        durationMs: trackData.durationMs,
        progressMs: trackData.progressMs || 0,
        isPlaying: isPlayingAction,
        spotifyId: trackData.spotifyId, // YouTube videoId
        commandTriggeredBy: currentUser,
        lastUpdated: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Gagal mengirim aksi lokal ke Firestore:", error);
    }
  };

  // Compatibility wrapper for click and URL submit handlers
  const syncSongToPartner = async (trackData: any) => {
    await broadcastLocalAction(trackData, trackData.isPlaying !== false);
  };

  // ════════════════════════════════════════════════════════════
  // 3. STRICT LISTEN ALONG SYNC ENGINE (CONSUMER)
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!ytPlayer || !isYtReady) return;

    const unsubPlayback = onSnapshot(doc(db, "rooms", "spotify_room"), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();

      if (!data || !data.spotifyId || data.spotifyId === "5lYlS8n8nZ9Lh6p3O6Y2y2") return;

      // UPDATE METADATA TAMPILAN KANVAS UI TANPA MEMICU RE-BROADCAST
      contextSyncSongToPartner({
        title: data.title,
        artist: data.artist,
        album: data.album,
        artwork: data.artwork,
        durationMs: data.durationMs,
        progressMs: data.progressMs,
        isPlaying: data.isPlaying,
        spotifyId: data.spotifyId,
      });

      // EKSEKUSI PERINTAH FLIGHT HANYA JIKA DIPICU OLEH PASANGAN (ANTI-PINGPONG)
      if (data.commandTriggeredBy !== currentUser) {
        if (data.isPlaying) {
          const drift = Date.now() - (data.lastUpdated || Date.now());
          const targetPositionMs = data.progressMs + drift;
          const targetPositionSeconds = Math.floor(targetPositionMs / 1000);

          const currentVideoUrl = ytPlayer.getVideoUrl ? ytPlayer.getVideoUrl() : "";
          const loadedVideoId = currentVideoUrl.includes("v=") ? currentVideoUrl.split("v=")[1].substring(0, 11) : "";

          const isCurrentPlaying = ytPlaybackState === 1;
          const currentPosition = ytPlayer.getCurrentTime ? ytPlayer.getCurrentTime() : 0;
          const timeDiff = Math.abs(currentPosition - targetPositionSeconds);

          // DEBOUNCER: Jika video ID sudah cocok, sedang berputar, dan selisih waktu tipis, amankan buffer!
          if (loadedVideoId === data.spotifyId && isCurrentPlaying && timeDiff < 4) {
            return;
          }

          ytPlayer.loadVideoById(data.spotifyId, targetPositionSeconds);
          ytPlayer.playVideo();

        } else {
          const isCurrentPlaying = ytPlaybackState === 1;
          if (isCurrentPlaying) {
            ytPlayer.pauseVideo();
          }
        }
      }
    });

    return () => unsubPlayback();
  }, [ytPlayer, isYtReady, currentUser, ytPlaybackState]);

  // ════════════════════════════════════════════════════════════
  // 4. DAUR HIDUP INSTANCE YOUTUBE WEB IFRAME API (INITIALIZER)
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    // Amankan agar script tidak di-inject berkali-kali ke dokumen DOM
    let script = document.getElementById("youtube-player-script") as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = "youtube-player-script";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.body.appendChild(script);
    }

    const initYoutubePlayer = () => {
      const ytWindow = window as any;
      if (!ytWindow.YT || !ytWindow.YT.Player) return;

      new ytWindow.YT.Player("youtube-audio-engine", {
        height: "1",
        width: "1",
        videoId: currentSong.spotifyId || "5lYlS8n8nZ9Lh6p3O6Y2y2",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event: any) => {
            setYtPlayer(event.target);
            setIsYtReady(true);
            setIsSdkConnected(true);
          },
          onStateChange: (event: any) => {
            setYtPlaybackState(event.data);
            const ytWindow = window as any;
            if (event.data === ytWindow.YT.PlayerState.ENDED) {
              window.dispatchEvent(new CustomEvent("spotifyTrackFinished"));
            } else if (event.data === ytWindow.YT.PlayerState.PLAYING) {
              setSongPlayState(true);
            } else if (event.data === ytWindow.YT.PlayerState.PAUSED) {
              setSongPlayState(false);
            }
          },
          onError: (event: any) => {
            console.error("YouTube Player Error:", event.data);
            setSpotifyErrorState(`YouTube Player Error: Code ${event.data}`);
          }
        }
      });
    };

    const ytWindow = window as any;
    if (ytWindow.YT && ytWindow.YT.Player) {
      initYoutubePlayer();
    } else {
      ytWindow.onYouTubeIframeAPIReady = () => {
        initYoutubePlayer();
      };
    }

    return () => {};
  }, []);

const [fetchedQuote, setFetchedQuote] = useState<{ content: string; author: string } | null>(() => {
  try {
    const cached = localStorage.getItem("romantic_daily_quote");
    if (cached) return JSON.parse(cached);
  } catch (e) { }
  return null;
});
const [quoteLoading, setQuoteLoading] = useState(false);

const fetchRomanticQuote = async (force = false) => {
  setQuoteLoading(true);
  try {
    const cachedTime = localStorage.getItem("romantic_daily_quote_time");
    const now = Date.now();

    if (!force && cachedTime && fetchedQuote && (now - parseInt(cachedTime, 10)) < 24 * 60 * 60 * 1000) {
      setQuoteLoading(false);
      return;
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("https://api.quotable.io/random?tags=love", { signal: controller.signal });
    clearTimeout(id);

    if (res.ok) {
      const data = await res.json();
      if (data && data.content) {
        const newQuote = { content: data.content, author: data.author || "Unknown" };
        setFetchedQuote(newQuote);
        localStorage.setItem("romantic_daily_quote", JSON.stringify(newQuote));
        localStorage.setItem("romantic_daily_quote_time", now.toString());
        setQuoteLoading(false);
        return;
      }
    }
    throw new Error("Failed api response");
  } catch (err) {
    console.warn("Public quote API fell back to curation", err);
    const curatedPool = [
      { content: "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.", author: "Maya Angelou" },
      { content: "I would rather share one lifetime with you than face all the ages of this world alone.", author: "J.R.R. Tolkien" },
      { content: "If I know what love is, it is because of you.", author: "Hermann Hesse" },
      { content: "My heart is and always will be yours.", author: "Jane Austen" },
      { content: "Grow old with me! The best is yet to be.", author: "Robert Browning" },
      { content: "With you, life feels like a warm yellow sweater on a chilly autumn afternoon.", author: "Aesthetic Whisper" },
      { content: "You make the ordinary moments feel like Studio Ghibli magic.", author: "Sanctuary" }
    ];
    const randomIndex = Math.floor(Math.random() * curatedPool.length);
    const chosen = curatedPool[randomIndex];
    setFetchedQuote(chosen);
    localStorage.setItem("romantic_daily_quote", JSON.stringify(chosen));
    localStorage.setItem("romantic_daily_quote_time", Date.now().toString());
  } finally {
    setQuoteLoading(false);
  }
};

useEffect(() => {
  fetchRomanticQuote();
}, []);

const [daysCount, setDaysCount] = useState(0);
const [nextAnniversaryDays, setNextAnniversaryDays] = useState(0);
const [birthdayDays, setBirthdayDays] = useState({ userA: 0, userB: 0 });

const [spotifyUrlInput, setSpotifyUrlInput] = useState("");
const [spotifyError, setSpotifyError] = useState<string | null>(null);

// Immersive player extra state
const [likedSongs, setLikedSongs] = useState<Record<string, boolean>>({});
const [showLyrics, setShowLyrics] = useState(true);
const [isLinkMode, setIsLinkMode] = useState(false);
const [playlistUrl, setPlaylistUrl] = useState("https://open.spotify.com/playlist/1ZGxVEsURt38tN5gEr6LCJ");
const [playlistTracks, setPlaylistTracks] = useState<any[]>(CURATED_ROMANTIC_VIBES);
const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);

const [isShuffleActive, setIsShuffleActive] = useState<boolean>(() => {
  return localStorage.getItem("spotify_shuffle_active") === "true";
});
const [isRepeatActive, setIsRepeatActive] = useState<boolean>(() => {
  return localStorage.getItem("spotify_repeat_active") === "true";
});

const toggleShuffle = () => {
  triggerHaptic("light");
  setIsShuffleActive(prev => {
    const next = !prev;
    localStorage.setItem("spotify_shuffle_active", next.toString());
    return next;
  });
};

const toggleRepeat = () => {
  triggerHaptic("light");
  setIsRepeatActive(prev => {
    const next = !prev;
    localStorage.setItem("spotify_repeat_active", next.toString());
    return next;
  });
};

const activeGlowColor = useMemo(() => {
  const matched = playlistTracks.find(t => t.title.toLowerCase() === currentSong.title.toLowerCase());
  return matched?.glowColor || "rgba(16, 185, 129, 0.16)";
}, [currentSong.title, playlistTracks]);

const activeHighlightColor = useMemo(() => {
  const matched = playlistTracks.find(t => t.title.toLowerCase() === currentSong.title.toLowerCase());
  if (matched) {
    if (matched.title === "Sempurna") return "#ef4444";
    if (matched.title === "About You") return "#8b5cf6";
    if (matched.title === "Komang") return "#f59e0b";
    if (matched.title === "Double Take") return "#06b6d4";
    if (matched.title === "Kemesraan") return "#ec4899";
    if (matched.title === "Hati-Hati di Jalan") return "#10b981";
  }

  // Hash-based dynamic color for custom URL or dynamic search tracks
  let hash = 0;
  const str = currentSong.title + currentSong.artist;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["#ef4444", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#10b981", "#3b82f6", "#f43f5e"];
  return colors[Math.abs(hash) % colors.length];
}, [currentSong.title, currentSong.artist, playlistTracks]);

const formatPlayerTime = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  const newProg = Math.floor(pct * currentSong.durationMs);

  const updatedSong = { ...currentSong, progressMs: newProg };
  broadcastLocalAction(updatedSong, currentSong.isPlaying);

  if (isYtReady && ytPlayer && currentSong.spotifyId) {
    ytPlayer.seekTo(Math.floor(newProg / 1000), true);
  } else {
    updateSongProgress(newProg);
  }
};

const toggleLike = (title: string) => {
  setLikedSongs(prev => ({ ...prev, [title]: !prev[title] }));
};
const [customMissionText, setCustomMissionText] = useState("");

const SUGGESTED_VIBES = CURATED_ROMANTIC_VIBES;

const handleCustomMissionAdd = (e: React.FormEvent) => {
  e.preventDefault();
  if (!customMissionText.trim()) return;

  // Create custom local mission or trigger XP
  awardXp(10, `setting a custom daily task: "${customMissionText}"`);
  // Note: We can also add it to a local extra task list or trigger custom logic
  setCustomMissionText("");
};

const handleSpotifyUrlSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setSpotifyError(null);
  if (!spotifyUrlInput.trim()) return;

  // Extract YouTube Video ID
  // e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ
  const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/i;
  const match = spotifyUrlInput.match(ytRegex);

  // Or match Spotify Track ID fallback
  const spotifyRegex = /(?:open\.spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]+)/i;
  const spotifyMatch = spotifyUrlInput.match(spotifyRegex);

  if (match && match[1]) {
    const videoId = match[1];
    const newSong = {
      title: "Pasted YouTube Video",
      artist: "Synchronized Video Player",
      album: "Playing from YouTube Link",
      artwork: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=150&auto=format&fit=crop",
      durationMs: 240000,
      progressMs: 0,
      isPlaying: true,
      spotifyId: videoId
    };

    broadcastLocalAction(newSong, true);

    if (isYtReady && ytPlayer) {
      ytPlayer.loadVideoById(videoId, 0);
      ytPlayer.playVideo();
    } else {
      setSongPlayState(true);
    }
    setSpotifyUrlInput("");
  } else if (spotifyMatch && spotifyMatch[1]) {
    // If it's a Spotify link, search on YouTube Data API automatically!
    searchYouTubeVideo("Spotify Pasted Track", spotifyMatch[1]).then((videoId) => {
      const finalId = videoId || "5lYlS8n8nZ9Lh6p3O6Y2y2";
      const newSong = {
        title: "Pasted Spotify Track",
        artist: "Synchronized Track Player",
        album: "Playing from Spotify Link",
        artwork: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=150&auto=format&fit=crop",
        durationMs: 240000,
        progressMs: 0,
        isPlaying: true,
        spotifyId: finalId
      };

      broadcastLocalAction(newSong, true);

      if (isYtReady && ytPlayer) {
        ytPlayer.loadVideoById(finalId, 0);
        ytPlayer.playVideo();
      } else {
        setSongPlayState(true);
      }
    });
    setSpotifyUrlInput("");
  } else {
    // Treat as raw search query
    searchYouTubeVideo("", spotifyUrlInput).then((videoId) => {
      if (videoId) {
        const newSong = {
          title: spotifyUrlInput,
          artist: "YouTube Search",
          album: "YouTube Audio Sync",
          artwork: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?q=80&w=150&auto=format&fit=crop",
          durationMs: 240000,
          progressMs: 0,
          isPlaying: true,
          spotifyId: videoId
        };

        broadcastLocalAction(newSong, true);

        if (isYtReady && ytPlayer) {
          ytPlayer.loadVideoById(videoId, 0);
          ytPlayer.playVideo();
        } else {
          setSongPlayState(true);
        }
      } else {
        setSpotifyError("Could not find matching video on YouTube. Try a different query or link.");
      }
    });
    setSpotifyUrlInput("");
  }
};

const handleTrackSkip = async (direction: "next" | "prev") => {
  triggerHaptic("medium");

  const currentIndex = playlistTracks.findIndex(
    v => v.title.toLowerCase() === currentSong.title.toLowerCase()
  );
  let nextIndex = 0;
  if (isShuffleActive && direction === "next" && playlistTracks.length > 1) {
    let rand = currentIndex;
    while (rand === currentIndex) {
      rand = Math.floor(Math.random() * playlistTracks.length);
    }
    nextIndex = rand;
  } else {
    if (direction === "next") {
      nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % playlistTracks.length;
    } else {
      nextIndex = currentIndex === -1 ? playlistTracks.length - 1 : (currentIndex - 1 + playlistTracks.length) % playlistTracks.length;
    }
  }

  const vibe = playlistTracks[nextIndex];

  let ytId = vibe.youtubeId;
  if (!ytId) {
    ytId = await searchYouTubeVideo(vibe.artist, vibe.title);
  }
  if (!ytId) ytId = "5lYlS8n8nZ9Lh6p3O6Y2y2";

  const updatedSong = {
    title: vibe.title,
    artist: vibe.artist,
    album: vibe.album,
    artwork: vibe.artwork,
    durationMs: vibe.durationMs,
    progressMs: 0,
    isPlaying: true,
    spotifyId: ytId,
  };

  await broadcastLocalAction(updatedSong, true);

  if (isYtReady && ytPlayer) {
    ytPlayer.loadVideoById(ytId, 0);
    ytPlayer.playVideo();
  } else {
    setSongPlayState(true);
  }
};

const [moodNote, setMoodNote] = useState("");
const [selectedMood, setSelectedMood] = useState<string>("happy");
const [showMoodHistory, setShowMoodHistory] = useState(false);

const [stickyNotes, setStickyNotes] = useState<{ id: string; text: string; senderId: string; color: string }[]>([]);
const [newNoteText, setNewNoteText] = useState("");
const [selectedNoteColor, setSelectedNoteColor] = useState("bg-rose-100/90 border-rose-200 text-rose-800");

useEffect(() => {
  const q = query(collection(db, "sticky_notes"), orderBy("created_at", "asc"));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const notes: any[] = [];
    snapshot.forEach((doc) => {
      const n = doc.data();
      notes.push({
        id: doc.id,
        text: n.text,
        senderId: n.sender_id,
        color: n.color,
      });
    });
    setStickyNotes(notes);
  }, (err) => {
    console.error("Error listening to sticky notes:", err);
  });

  return () => unsubscribe();
}, []);

// Listen for automatic song completion to skip or repeat
useEffect(() => {
  const handleFinished = () => {
    if (isRepeatActive) {
      const updatedSong = { ...currentSong, progressMs: 0, isPlaying: true };
      broadcastLocalAction(updatedSong, true);
      if (isYtReady && ytPlayer && currentSong.spotifyId) {
        ytPlayer.seekTo(0);
        ytPlayer.playVideo();
      } else {
        updateSongProgress(0);
      }
    } else {
      handleTrackSkip("next");
    }
  };
  window.addEventListener("spotifyTrackFinished", handleFinished);
  return () => window.removeEventListener("spotifyTrackFinished", handleFinished);
}, [isShuffleActive, isRepeatActive, currentSong, isYtReady, ytPlayer]);

const saveAndSyncNotes = async (notesList: any) => {
  // Left as compatibility wrapper, direct mutations are done in-place
};

const activeProfile = currentUser === "user_a" ? userA : userB;
const partnerProfile = currentUser === "user_a" ? userB : userA;

// Sync selected mood when user changes
useEffect(() => {
  if (activeProfile.mood) {
    setSelectedMood(activeProfile.mood);
  }
}, [currentUser, activeProfile.mood]);

// Calculate days together and countdowns using dynamic settings
useEffect(() => {
  const parseDateSafe = (dateVal: any): Date => {
    if (!dateVal) return new Date();
    if (typeof dateVal.toMillis === "function") {
      return new Date(dateVal.toMillis());
    }
    if (dateVal.seconds) {
      return new Date(dateVal.seconds * 1000);
    }
    if (typeof dateVal === "number") {
      return new Date(dateVal);
    }
    if (typeof dateVal === "string") {
      const parts = dateVal.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m, d);
        }
      }
      return new Date(dateVal);
    }
    return new Date();
  };

  const start = parseDateSafe(anniversaryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(today.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  setDaysCount(diffDays);

  const currentYear = today.getFullYear();

  // Calculate next anniversary countdown
  let nextAnniv = new Date(currentYear, start.getMonth(), start.getDate());
  if (today > nextAnniv) {
    nextAnniv = new Date(currentYear + 1, start.getMonth(), start.getDate());
  }
  const annivDiff = nextAnniv.getTime() - today.getTime();
  setNextAnniversaryDays(Math.ceil(annivDiff / (1000 * 60 * 60 * 24)));

  // Calculate birthdays
  const parseBirthdaySafe = (bdayStr: string, year: number): Date => {
    if (!bdayStr || typeof bdayStr !== "string") return new Date();
    const parts = bdayStr.split("-");
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10) - 1;
      const d = parseInt(parts[1], 10);
      if (!isNaN(m) && !isNaN(d)) {
        return new Date(year, m, d);
      }
    }
    return new Date();
  };

  // Birthday A
  const bdayA = parseBirthdaySafe(birthdayA || "11-18", currentYear);
  bdayA.setHours(0, 0, 0, 0);
  let nextBdayA = bdayA;
  if (today > nextBdayA) {
    nextBdayA = new Date(currentYear + 1, bdayA.getMonth(), bdayA.getDate());
  }
  const bdayADiff = nextBdayA.getTime() - today.getTime();

  // Birthday B
  const bdayB = parseBirthdaySafe(birthdayB || "04-05", currentYear);
  bdayB.setHours(0, 0, 0, 0);
  let nextBdayB = bdayB;
  if (today > nextBdayB) {
    nextBdayB = new Date(currentYear + 1, bdayB.getMonth(), bdayB.getDate());
  }
  const bdayBDiff = nextBdayB.getTime() - today.getTime();

  setBirthdayDays({
    userA: Math.ceil(bdayADiff / (1000 * 60 * 60 * 24)),
    userB: Math.ceil(bdayBDiff / (1000 * 60 * 60 * 24)),
  });
}, [anniversaryDate, birthdayA, birthdayB]);

// Weather city presets for manual selection
const CITY_PRESETS = [
  { name: "Seoul", lat: 37.5665, lon: 126.9780 },
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "New York", lat: 40.7128, lon: -74.0060 },
  { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 }
];

const getWeatherInfo = (code: number, isDay: boolean = true) => {
  if (code === 0) return { label: "Clear Skies", icon: Sun, color: "text-amber-500" };
  if (code === 1 || code === 2 || code === 3) {
    return { label: "Partly Cloudy", icon: CloudSun, color: "text-amber-400" };
  }
  if (code === 45 || code === 48) return { label: "Foggy Morn", icon: Cloud, color: "text-zinc-400" };
  if (code === 51 || code === 53 || code === 55) return { label: "Soft Drizzle", icon: CloudDrizzle, color: "text-indigo-400 animate-pulse" };
  if (code === 61 || code === 63 || code === 65) return { label: "Steady Rain", icon: CloudRain, color: "text-blue-500" };
  if (code === 71 || code === 73 || code === 75) return { label: "Gentle Snow", icon: CloudSnow, color: "text-sky-300 animate-bounce" };
  if (code === 80 || code === 81 || code === 82) return { label: "Passing Showers", icon: CloudRain, color: "text-blue-400" };
  if (code === 95 || code === 96 || code === 99) return { label: "Thunder Skies", icon: CloudLightning, color: "text-yellow-600 animate-pulse" };
  return { label: "Mild Breeze", icon: CloudSun, color: "text-amber-400" };
};

const [localWeather, setLocalWeather] = useState<{
  temp: number;
  description: string;
  code: number;
  name: string;
  windspeed: number;
  isDay: boolean;
} | null>(null);
const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
const [weatherError, setWeatherError] = useState<string | null>(null);

const [partnerCity, setPartnerCity] = useState<string>(() => {
  return currentUser === "user_a" ? "Paris" : "Seoul";
});
const [partnerWeather, setPartnerWeather] = useState<{
  temp: number;
  description: string;
  code: number;
} | null>(null);
const [partnerLoading, setPartnerLoading] = useState<boolean>(false);
const [showPartnerSelector, setShowPartnerSelector] = useState<boolean>(false);

const fetchWeatherByCoords = async (lat: number, lon: number, customName?: string) => {
  try {
    setWeatherLoading(true);
    setWeatherError(null);

    let locationName = customName || "My Location";
    if (!customName) {
      try {
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          locationName = geoData.locality || geoData.city || geoData.principalSubdivision || "My Place";
        }
      } catch (e) {
        console.warn("Reverse geocoding failed, using fallback label", e);
      }
    }

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
    );
    if (!weatherRes.ok) throw new Error("Could not fetch weather data");
    const weatherData = await weatherRes.json();

    if (weatherData.current_weather) {
      const curr = weatherData.current_weather;
      setLocalWeather({
        temp: Math.round(curr.temperature),
        description: getWeatherInfo(curr.weathercode, curr.is_day === 1).label,
        code: curr.weathercode,
        name: locationName,
        windspeed: Math.round(curr.windspeed),
        isDay: curr.is_day === 1
      });

      // Sync coordinates to Firestore so our partner can fetch our weather
      updateProfile(currentUser, {
        latitude: lat,
        longitude: lon,
        weatherCity: locationName
      });
    } else {
      throw new Error("No current weather data found");
    }
  } catch (err: any) {
    setWeatherError(err.message || "Failed to load weather");
  } finally {
    setWeatherLoading(false);
  }
};

const fetchPartnerWeather = async (cityName?: string) => {
  try {
    setPartnerLoading(true);

    // Check if partner profile has coordinates
    const hasCoords = partnerProfile.latitude !== undefined && partnerProfile.longitude !== undefined && partnerProfile.latitude !== null && partnerProfile.longitude !== null;
    let targetLat: number;
    let targetLon: number;
    let targetName: string;

    if (hasCoords && !cityName) {
      targetLat = partnerProfile.latitude!;
      targetLon = partnerProfile.longitude!;
      targetName = partnerProfile.weatherCity || "Partner's Place";
    } else {
      // Fallback to preset or selected city name
      const activeName = cityName || partnerCity;
      const preset = CITY_PRESETS.find(c => c.name.toLowerCase() === activeName.toLowerCase()) || CITY_PRESETS[1];
      targetLat = preset.lat;
      targetLon = preset.lon;
      targetName = preset.name;
    }

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&current_weather=true&timezone=auto`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.current_weather) {
        const curr = data.current_weather;
        setPartnerWeather({
          temp: Math.round(curr.temperature),
          description: getWeatherInfo(curr.weathercode, curr.is_day === 1).label,
          code: curr.weathercode,
          name: targetName
        });
        if (cityName) {
          setPartnerCity(cityName);
        } else {
          setPartnerCity(targetName);
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch partner weather", e);
  } finally {
    setPartnerLoading(false);
  }
};

const triggerGeolocation = () => {
  setWeatherLoading(true);
  setWeatherError(null);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn("Geolocation permission or hardware error", error);
        setWeatherError("Unavailable (using default)");
        // Fallback to Seoul for user A or Paris for user B
        const fallback = currentUser === "user_a" ? CITY_PRESETS[0] : CITY_PRESETS[1];
        fetchWeatherByCoords(fallback.lat, fallback.lon, fallback.name);
      },
      { timeout: 8000 }
    );
  } else {
    setWeatherError("Geolocation not supported");
    const fallback = currentUser === "user_a" ? CITY_PRESETS[0] : CITY_PRESETS[1];
    fetchWeatherByCoords(fallback.lat, fallback.lon, fallback.name);
  }
};

// Initial loads
useEffect(() => {
  triggerGeolocation();
  fetchPartnerWeather();
}, [currentUser]);

// Refetch partner weather whenever partner coordinates change or manual selection is changed
useEffect(() => {
  fetchPartnerWeather();
}, [partnerProfile.latitude, partnerProfile.longitude, partnerProfile.weatherCity, partnerCity]);

const changeQuote = () => {
  fetchRomanticQuote(true);
  awardXp(5, "finding daily inspiration 🌸");
};

const handleMoodSelect = (mood: string) => {
  updateProfile(currentUser, { mood });
  awardXp(10, "sharing your feelings");
};

const moodsList = [
  { value: "happy", emoji: "🌸", label: "Happy" },
  { value: "cozy", emoji: "☕", label: "Cozy" },
  { value: "sleepy", emoji: "🌙", label: "Sleepy" },
  { value: "excited", emoji: "🎉", label: "Excited" },
  { value: "loved", emoji: "💖", label: "Loved" },
];

// Song duration parser
const formatTime = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

return (
  <div className="space-y-8" id="home-view-container">
    {/* 1. Welcoming Hero Banner */}
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl glass-panel p-10 text-center md:text-left md:flex items-center justify-between"
      id="home-welcome-hero"
    >
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-semibold">
          <Heart className="w-3.5 h-3.5 fill-current animate-heartbeat" />
          Our Private Digital Sanctuary
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-[var(--text-main)] font-semibold leading-tight">
          Welcome home, <span className="font-sans font-bold underline decoration-rose-400 decoration-3">{activeProfile.name.split(" ")[0]}</span>
        </h1>
        <p className="text-base text-[var(--text-muted)] max-w-md">
          Everything is warm and peaceful in our little bubble. {partnerProfile.name.split(" ")[0]} is currently{" "}
          <span className="font-semibold text-[var(--primary)] font-mono text-sm bg-black/5 px-2 py-0.5 rounded-md">
            {partnerProfile.status}
          </span>.
        </p>
      </div>

      {/* Big Heart-Shaped Counter */}
      <div className="mt-6 md:mt-0 flex flex-col items-center bg-[var(--primary)] text-white px-10 py-8 rounded-2xl shadow-xl border border-white/20 relative overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
        <Heart className="w-10 h-10 fill-white/20 text-white/40 absolute -top-2 -left-2" />
        <span className="text-sm font-semibold tracking-wider uppercase text-white/70">Days of Love</span>
        <span className="text-6xl font-extrabold font-display my-1">{daysCount}</span>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
          Since {(() => {
            const parts = anniversaryDate.split("-");
            if (parts.length === 3) {
              const y = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10) - 1;
              const d = parseInt(parts[2], 10);
              const dateObj = new Date(y, m, d);
              if (!isNaN(dateObj.getTime())) {
                return dateObj.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
              }
            }
            return "Oct 15, 2024";
          })()}
        </span>
      </div>
    </motion.div>

    {/* Relationship Streak & Growing-Plant Card */}
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.02 }}
      className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-[var(--border-color)] bg-white/20 backdrop-blur-md shadow-lg"
      id="relationship-streak-plant-card"
    >
      {/* Particle Overlay (Water Drops / Hearts) */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {plantParticles.map((p) => {
          if (p.type === "water") {
            return (
              <motion.div
                key={p.id}
                className="absolute text-blue-400 select-none pointer-events-none text-sm"
                style={{ left: `${p.x}%`, top: `0px` }}
                animate={{ y: [0, 180], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 0.9 + Math.random() * 0.4, ease: "easeIn" }}
              >
                💧
              </motion.div>
            );
          } else {
            return (
              <motion.div
                key={p.id}
                className="absolute select-none pointer-events-none text-xs"
                style={{ left: `${p.x}%`, top: `120px` }}
                animate={{
                  y: [0, -90],
                  x: [0, (Math.random() - 0.5) * 45],
                  opacity: [0, 1, 0.8, 0],
                  scale: [0.5, 1.3, 0]
                }}
                transition={{ duration: 1.2 + Math.random() * 0.4, ease: "easeOut" }}
              >
                {p.type === "heart" ? "💖" : "✨"}
              </motion.div>
            );
          }
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 items-center">

        {/* Left Column: Interactive Plant Garden SVG */}
        <div className="md:col-span-4 lg:col-span-3 flex justify-center">
          <div className="relative flex-shrink-0 w-36 h-36 bg-gradient-to-b from-amber-50/50 to-emerald-50/30 rounded-2xl border border-white/50 shadow-inner flex items-center justify-center select-none overflow-hidden group">

            {/* Ambient Sunshine Rays background */}
            <div className="absolute inset-0 bg-radial-gradient from-yellow-100/20 to-transparent pointer-events-none animate-pulse" />

            <svg viewBox="0 0 100 120" className="w-28 h-28 overflow-visible">
              {/* Pot */}
              <rect x="35" y="92" width="30" height="20" rx="3" fill="#dda15e" opacity="0.9" />
              <ellipse cx="50" cy="92" rx="15" ry="3.5" fill="#bc6c25" />
              <rect x="38" y="95" width="24" height="14" rx="2" fill="#c38a4d" />
              <circle cx="50" cy="102" r="2.5" fill="#fefae0" />

              {/* Plant Stem */}
              <motion.path
                d={`M 50 92 C 46 75 54 58 50 ${Math.max(30, 92 - (streakCount * 1.8))}`}
                stroke="#4caf50"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />

              {/* Leaf Left (Low) - Grows on Streak >= 3 */}
              {streakCount >= 3 && (
                <motion.path
                  d="M 48 76 C 30 72 32 62 48 68"
                  fill="#81c784"
                  stroke="#388e3c"
                  strokeWidth="1.5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
                  style={{ transformOrigin: "48px 76px" }}
                />
              )}

              {/* Leaf Right (Mid) - Grows on Streak >= 7 */}
              {streakCount >= 7 && (
                <motion.path
                  d="M 52 64 C 70 60 68 50 52 56"
                  fill="#66bb6a"
                  stroke="#2e7d32"
                  strokeWidth="1.5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 80, delay: 0.4 }}
                  style={{ transformOrigin: "52px 64px" }}
                />
              )}

              {/* Leaf Left (High) - Grows on Streak >= 14 */}
              {streakCount >= 14 && (
                <motion.path
                  d="M 49 52 C 34 46 36 38 49 44"
                  fill="#4caf50"
                  stroke="#1b5e20"
                  strokeWidth="1.5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 80, delay: 0.6 }}
                  style={{ transformOrigin: "49px 52px" }}
                />
              )}

              {/* Flower Blooming at the top - Blooms on Streak >= 25 */}
              {streakCount >= 25 ? (
                <motion.g
                  className="cursor-pointer"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                  transition={{
                    scale: { type: "spring", stiffness: 100, delay: 0.8 },
                    rotate: { repeat: Infinity, duration: 6, ease: "easeInOut" }
                  }}
                  style={{ transformOrigin: `50px ${Math.max(30, 92 - (streakCount * 1.8))}px` }}
                >
                  {/* Blossom circles */}
                  <circle cx="50" cy={Math.max(30, 92 - (streakCount * 1.8))} r="9" fill="#f43f5e" />
                  <circle cx="41" cy={Math.max(30, 92 - (streakCount * 1.8))} r="7" fill="#fda4af" />
                  <circle cx="59" cy={Math.max(30, 92 - (streakCount * 1.8))} r="7" fill="#fda4af" />
                  <circle cx="50" cy={Math.max(30, 92 - (streakCount * 1.8)) - 9} r="7" fill="#fda4af" />
                  <circle cx="50" cy={Math.max(30, 92 - (streakCount * 1.8)) + 9} r="7" fill="#fda4af" />
                  <circle cx="50" cy={Math.max(30, 92 - (streakCount * 1.8))} r="4.5" fill="#f59e0b" />
                </motion.g>
              ) : (
                /* Bud if growing but not yet bloomed */
                streakCount >= 10 && (
                  <motion.circle
                    cx="50"
                    cy={Math.max(30, 92 - (streakCount * 1.8))}
                    r="5.5"
                    fill="#ec4899"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, delay: 0.8 }}
                  />
                )
              )}
            </svg>

            {/* Micro watering badge overlay */}
            <button
              onClick={() => {
                triggerHaptic("light");
                triggerWaterAnimation();
              }}
              title="Click to water the plant!"
              className="absolute bottom-1 right-1 p-1 bg-white/80 hover:bg-white rounded-full border border-black/5 text-[var(--primary)] shadow-sm hover:scale-110 active:scale-95 transition-transform"
            >
              <Droplets className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
            </button>
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4 text-center md:text-left min-w-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                <Flame className="w-5 h-5 fill-current animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[var(--text-main)] font-display flex items-center gap-1.5">
                  {streakCount} Day Love Streak
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono font-bold tracking-wider uppercase">
                  Consecutive Check-ins
                </p>
              </div>
            </div>

            <span className="text-xs bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] px-3 py-1 rounded-full font-bold">
              {streakCount >= 25
                ? "Fully Bloomed 🌸"
                : streakCount >= 14
                  ? "Budding Tree 🌳"
                  : streakCount >= 5
                    ? "Fresh Sprout 🌿"
                    : "Tiny Seedling 🌱"}
            </span>
          </div>

          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {isCheckedInToday
              ? "You have watered our bond today! Every single check-in fuels the growth of our shared plant and earns XP. Keep watering to keep the flame alive!"
              : "Our shared plant is waiting for today's love! Click the button to check in together, water the soil, and maintain our active daily streak."}
          </p>

          {/* Growth milestone indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--text-muted)] font-mono">
              <span>Current Stage Progress</span>
              <span>{streakCount >= 30 ? "Maximum Stage" : `${Math.round((streakCount % 10) * 10)}%`}</span>
            </div>
            <div className="h-2 bg-black/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-400 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: streakCount >= 30 ? "100%" : `${Math.max(5, (streakCount % 10) * 10)}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-muted)]/80 italic font-medium">
              {streakCount >= 30
                ? "Incredible work! You are nursing a giant eternal forest of love together!"
                : `Just ${10 - (streakCount % 10)} more days to grow our plant to the next evolution stage!`}
            </p>
          </div>

          {/* Check-In Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              onClick={handleCheckIn}
              className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${isCheckedInToday
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-gradient-to-r from-rose-400 to-amber-500 hover:opacity-95 text-white animate-pulse"
                }`}
            >
              {isCheckedInToday ? (
                <>
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Pour Extra Water (+5 XP)</span>
                </>
              ) : (
                <>
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Nurture Daily Streak & Check In (+25 XP)</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic("heavy");
                setStreakCount(1);
                localStorage.setItem("couple_relationship_streak", "1");
              }}
              className="text-[9px] text-gray-300 hover:text-rose-400/80 transition-colors font-mono self-end py-1 px-2"
              title="Only use if you want to reset and grow a brand new plant together!"
            >
              Reset Streak
            </button>
          </div>

        </div>
      </div>
    </motion.div>

    {/* SPOTLIGHT: MEMORY OF THE DAY WIDGET */}
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.04 }}
      className="glass-panel p-6 rounded-3xl relative overflow-hidden border border-[var(--border-color)] bg-white/30 backdrop-blur-md shadow-lg"
      id="spotlight-memory-widget"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-200/20 to-transparent rounded-full pointer-events-none blur-2xl" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 items-center">

        {/* Left: Text Info block */}
        <div className="md:col-span-7 lg:col-span-8 space-y-3.5 text-center md:text-left min-w-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/5 border border-[var(--primary)]/10 rounded-full text-[11px] font-extrabold uppercase tracking-widest text-[var(--primary)] shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current animate-spin-slow" />
            <span>Memory Spotlight of the Day</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-serif text-[var(--text-main)] font-semibold italic tracking-tight">
            {spotlightMemory ? spotlightMemory.title : "Capture a Moment Today!"}
          </h2>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-lg font-medium">
            {spotlightMemory
              ? (spotlightMemory.description || "A beautiful moment frozen in time. No description was left, but the feelings are forever shared in our digital home.")
              : "Your digital timeline is waiting for its next gorgeous chapter. Capture a photobooth strip or log a cozy milestone, and it might be spotlighted here for 24 hours!"}
          </p>

          {/* Date and Countdown details */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs pt-1">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-[10.5px]">
              <Calendar className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {spotlightMemory
                  ? `Captured: ${new Date(spotlightMemory.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                  : "No memories added yet"}
              </span>
            </div>

            {spotlightMemory && (
              <div className="text-[9px] bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 px-2.5 py-0.5 rounded font-mono uppercase font-black tracking-wider flex items-center gap-1 shadow-xs">
                <span className="animate-pulse">●</span> Rotates In: {rotationCountdown}
              </div>
            )}
          </div>

          {/* Actions: Love & Explore */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2.5 pt-2">
            {spotlightMemory ? (
              <>
                <button
                  onClick={() => {
                    triggerHaptic("success");
                    awardXp(15, "showering love on our Spotlight Memory of the Day!");

                    // Confetti / Floating Emojis explosion
                    const count = 14;
                    const rect = document.getElementById("spotlight-frame")?.getBoundingClientRect();
                    const xBase = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
                    const yBase = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
                    for (let i = 0; i < count; i++) {
                      const star = document.createElement("div");
                      star.innerText = ["💖", "🌸", "✨", "🥰", "🎀", "🧸"][Math.floor(Math.random() * 6)];
                      star.style.position = "fixed";
                      star.style.left = `${xBase + (Math.random() - 0.5) * 120}px`;
                      star.style.top = `${yBase + (Math.random() - 0.5) * 120}px`;
                      star.style.fontSize = `${20 + Math.random() * 24}px`;
                      star.style.pointerEvents = "none";
                      star.style.zIndex = "9999";
                      star.style.transition = "all 1s cubic-bezier(0.1, 0.8, 0.3, 1)";
                      document.body.appendChild(star);
                      setTimeout(() => {
                        star.style.transform = `translateY(-140px) scale(0.2) rotate(${(Math.random() - 0.5) * 200}deg)`;
                        star.style.opacity = "0";
                      }, 50);
                      setTimeout(() => star.remove(), 1050);
                    }
                  }}
                  className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                >
                  <span>🥰 Aww, Love This! (+15 XP)</span>
                </button>
                <button
                  onClick={() => {
                    triggerHaptic("light");
                    window.dispatchEvent(new CustomEvent("changeTab", { detail: "memories" }));
                  }}
                  className="px-4 py-2.5 bg-white/75 hover:bg-white text-gray-700 hover:text-rose-600 border border-gray-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1 hover:scale-103 shadow-xs"
                >
                  <span>View Full Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  triggerHaptic("medium");
                  window.dispatchEvent(new CustomEvent("changeTab", { detail: "memories" }));
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow hover:scale-105 active:scale-95"
              >
                <Camera className="w-4 h-4 animate-bounce" />
                <span>Open Photobooth & Save Memories</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: The stylized framed photo */}
        <div className="md:col-span-5 lg:col-span-4 flex justify-center md:justify-end w-full">
          {spotlightMemory ? (
            <motion.div
              id="spotlight-frame"
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              className="relative bg-white p-4 pb-12 rounded-sm shadow-[0_15px_40px_rgba(0,0,0,0.18)] border border-gray-200/70 flex flex-col items-center gap-3 w-56 -rotate-2 group"
            >
              {/* Visual paper tape design sticking polaroid onto card */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-100/60 border-x border-dashed border-yellow-200/80 backdrop-blur-[1px] rotate-2 shadow-sm" />

              {/* Image layout container */}
              <div className="w-full aspect-square overflow-hidden bg-gray-50 border border-gray-100 rounded relative shadow-inner">
                <img
                  src={spotlightMemory.imageUrl}
                  alt={spotlightMemory.title}
                  className="w-full h-full object-cover pointer-events-none select-none group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-300/5 via-transparent to-white/10 pointer-events-none" />
              </div>

              {/* Handwriting handwriting style typography */}
              <div className="text-center w-full pt-1.5 font-serif select-none">
                <p className="text-xs font-black text-gray-800 italic tracking-wide truncate max-w-full">
                  ✨ {spotlightMemory.title} ✨
                </p>
                <p className="text-[8px] font-mono text-gray-400 mt-1 uppercase tracking-widest font-bold">
                  ♥ {new Date(spotlightMemory.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} ♥
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="relative bg-white/40 border-2 border-dashed border-gray-300/80 p-6 rounded-3xl flex flex-col items-center justify-center text-center w-52 aspect-square shadow-inner">
              <Camera className="w-10 h-10 text-gray-300 mb-2 animate-pulse" />
              <p className="text-[11px] font-semibold text-gray-500 font-serif italic">No memories spotlighted yet</p>
              <p className="text-[9px] text-gray-400 mt-1">Photos from your photobooth or milestones will shine here!</p>
            </div>
          )}
        </div>

      </div>
    </motion.div>

    {/* 2. Key Widgets Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">

      {/* Anniversary & Milestones Card */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-[var(--primary)]/10 flex flex-col justify-between"
        id="anniversary-milestone-widget"
      >
        <div className="absolute -top-4 -right-4 p-4 opacity-[0.02] pointer-events-none">
          <Heart className="w-24 h-24 text-[var(--primary)]" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm md:text-base font-extrabold text-[var(--text-main)] flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="w-4.5 h-4.5 text-rose-500" />
            Special Milestones
          </h3>
          <span className="text-xs bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full font-serif italic">
            {(() => {
              const parts = anniversaryDate.split("-");
              if (parts.length === 3) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                const dateObj = new Date(y, m, d);
                if (!isNaN(dateObj.getTime())) {
                  return dateObj.toLocaleDateString("en-US", { month: 'long', day: 'numeric' });
                }
              }
              return "December 14";
            })()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center py-2">
          {/* Left Side: Days Countdown */}
          <div className="sm:col-span-4 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-[var(--border-color)] pb-2 sm:pb-0 sm:pr-2 text-center">
            <span className="font-serif text-5xl font-light italic tracking-tight text-[var(--primary)] leading-none animate-pulse-slow">
              {nextAnniversaryDays}
            </span>
            <span className="text-xs font-mono tracking-widest uppercase text-[var(--text-muted)] mt-1.5 text-center font-bold">
              Days Left
            </span>
          </div>

          {/* Right Side: List of special days */}
          <div className="sm:col-span-8 space-y-2">
            <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-[var(--text-main)]">
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-pink-500 fill-current" />
                Next Anniversary
              </span>
              <span className="font-mono text-xs md:text-sm font-extrabold text-pink-600">{nextAnniversaryDays}d</span>
            </div>

            <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-[var(--text-main)]">
              <span className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-yellow-500" />
                {userA.name}'s Birthday
              </span>
              <span className="font-mono text-xs md:text-sm font-extrabold text-yellow-600">{birthdayDays.userA}d</span>
            </div>

            <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-[var(--text-main)]">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                {userB.name}'s Birthday
              </span>
              <span className="font-mono text-xs md:text-sm font-extrabold text-blue-600">{birthdayDays.userB}d</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] text-center font-serif italic border-t border-[var(--border-color)] pt-2.5 mt-2">
          "We write our love story, one day at a time."
        </p>
      </motion.div>

      {/* Daily Objectives Card */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-panel p-5 rounded-2xl flex flex-col justify-between"
        id="daily-missions-widget"
      >
        {(() => {
          const dailyMissions = missions.filter(m => m.type === "daily");
          const completedCount = dailyMissions.filter(m => m.completed).length;
          const totalCount = dailyMissions.length;
          const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          const allDone = totalCount > 0 && completedCount === totalCount;

          return (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm md:text-base font-extrabold text-[var(--text-main)] flex items-center gap-1.5 uppercase tracking-wider">
                    <Compass className="w-4 h-4 text-emerald-600 animate-spin-slow" />
                    Daily Challenges
                  </h3>
                  <p className="text-[10px] md:text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider mt-0.5 font-bold">
                    {completedCount} of {totalCount} completed ({Math.round(progressPercent)}%)
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[var(--text-muted)]/10 rounded-full h-2 overflow-hidden shadow-inner relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {allDone && (
                <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-center flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-amber-700">
                    Perfect score! XP claimed! 🌟
                  </span>
                </div>
              )}

              {/* Compact Mission buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dailyMissions.map((mission) => (
                  <button
                    key={mission.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic("medium");
                      toggleMission(mission.id);
                    }}
                    className={`flex items-center justify-between text-left px-3 py-2 rounded-xl border transition-all ${mission.completed
                      ? "bg-[var(--primary)]/5 border-[var(--primary)]/10 text-[var(--text-muted)] line-through"
                      : "bg-white/40 border-[var(--border-color)] hover:bg-white/80 text-[var(--text-main)]"
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${mission.completed
                        ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                        : "border-[var(--border-color)] bg-white text-transparent"
                        }`}>
                        <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <span className="text-xs md:text-sm font-semibold text-[var(--text-main)] truncate">{mission.text}</span>
                    </div>
                    <span className="text-[10px] md:text-xs font-mono font-bold text-[var(--primary)] px-1.5 py-0.5 bg-[var(--primary)]/10 rounded ml-1 flex-shrink-0">
                      +{mission.xpReward} XP
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Goal Form */}
              <form onSubmit={handleCustomMissionAdd} className="flex gap-2 pt-2 border-t border-[var(--border-color)]">
                <input
                  type="text"
                  placeholder="Create a daily team task..."
                  value={customMissionText}
                  onChange={(e) => setCustomMissionText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs md:text-sm text-[var(--text-main)] bg-white/70 border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--primary)] font-serif italic"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs md:text-sm font-bold transition-colors"
                >
                  Add
                </button>
              </form>
            </div>
          );
        })()}
      </motion.div>

      {/* Skies & Daily Whisper Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="glass-panel p-5 rounded-2xl border border-[var(--primary)]/10 flex flex-col justify-between"
        id="skies-whisper-widget"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 divide-y sm:divide-y-0 sm:divide-r divide-[var(--border-color)] items-center">
          {/* Skies Weather */}
          <div className="sm:col-span-5 flex flex-col justify-between h-full space-y-2">
            <div className="flex justify-between items-center text-xs uppercase tracking-wider text-[var(--text-muted)] font-extrabold">
              <span>Skies Weather</span>
              <button
                onClick={triggerGeolocation}
                className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--primary)]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              {/* Local Weather */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-[var(--text-muted)] tracking-tight">Me</span>
                {localWeather ? (
                  <>
                    <div className="h-7 w-7 flex items-center justify-center my-0.5">
                      <ArtisticWeatherIcon code={localWeather.code} isDay={localWeather.isDay} className="w-6.5 h-6.5" />
                    </div>
                    <span className="text-base font-black text-[var(--text-main)]">{localWeather.temp}°</span>
                    <span className="text-xs text-[var(--primary)] font-bold truncate max-w-[65px]">{localWeather.description}</span>
                  </>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">Hazy</span>
                )}
              </div>

              {/* Partner Weather */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-[var(--text-muted)] tracking-tight">{partnerProfile.name}</span>
                <div className="relative inline-block">
                  <button
                    onClick={() => setShowPartnerSelector(!showPartnerSelector)}
                    className="text-xs text-[var(--primary)] hover:bg-black/5 font-extrabold flex items-center gap-0.5"
                  >
                    <span>{partnerWeather?.name || partnerCity}</span>
                    <span>▼</span>
                  </button>
                  {showPartnerSelector && (
                    <div className="absolute right-0 top-5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg py-1 shadow-lg z-50 w-24 text-left glass-panel-dark text-white">
                      {CITY_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setPartnerCity(preset.name);
                            setShowPartnerSelector(false);
                          }}
                          className={`w-full px-2.5 py-1 text-left text-xs hover:bg-white/10 transition-colors ${partnerCity === preset.name ? "text-[var(--accent)] font-bold" : "text-white/85"
                            }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {partnerWeather ? (
                  <>
                    <div className="h-7 w-7 flex items-center justify-center my-0.5">
                      <ArtisticWeatherIcon code={partnerWeather.code} isDay={true} className="w-6.5 h-6.5" />
                    </div>
                    <span className="text-base font-black text-[var(--text-main)]">{partnerWeather.temp}°</span>
                    <span className="text-xs text-[var(--primary)] font-bold truncate max-w-[65px]">{partnerWeather.description}</span>
                  </>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">Hazy</span>
                )}
              </div>
            </div>
          </div>

          {/* Daily Quote (Compact Right Column) */}
          <div className="sm:col-span-7 sm:pl-4 pt-2.5 sm:pt-0 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-[var(--primary)] font-extrabold">
              <span>Daily Whisper</span>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  changeQuote();
                }}
                className="p-0.5 text-[var(--text-muted)] hover:text-[var(--primary)]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-sm md:text-base font-serif italic text-[var(--text-main)] leading-relaxed py-1 font-medium min-h-[38px] flex flex-col justify-center">
              {quoteLoading ? (
                <span className="text-xs text-[var(--text-muted)] animate-pulse">Sensing whisper...</span>
              ) : fetchedQuote ? (
                <>
                  "{fetchedQuote.content.slice(0, 75)}{fetchedQuote.content.length > 75 ? '...' : ''}"
                  {fetchedQuote.author && (
                    <span className="text-right text-xs text-[var(--text-muted)] font-mono not-italic mt-1">— {fetchedQuote.author}</span>
                  )}
                </>
              ) : (
                `"In your smile, I see something more beautiful than stars."`
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Couple Mood Sync Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-panel p-5 rounded-2xl flex flex-col justify-between"
        id="mood-widget"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-bold text-[var(--text-main)] flex items-center gap-1.5 uppercase tracking-wider">
              <Smile className="w-4 h-4 text-amber-600" />
              Mood Sync
            </h3>
            <button
              onClick={() => setShowMoodHistory(!showMoodHistory)}
              className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-0.5"
            >
              <span>{showMoodHistory ? "Hide Log" : "View History"}</span>
              <span>{showMoodHistory ? "▲" : "▼"}</span>
            </button>
          </div>

          {/* Display partner mood (compact bar) */}
          <div className="p-2.5 bg-white/40 border border-white/50 rounded-xl flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <img
                src={partnerProfile.avatar}
                alt={partnerProfile.name}
                className="w-6 h-6 rounded-full border border-white object-cover shadow-xs"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs md:text-sm text-[var(--text-muted)] font-medium">
                {partnerProfile.name.split(" ")[0]} is feeling:
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">
                {moodsList.find((m) => m.value === partnerProfile.mood)?.emoji || "🌸"}
              </span>
              <span className="text-xs md:text-sm text-[var(--primary)] font-bold capitalize">{partnerProfile.mood}</span>
            </div>
          </div>

          {/* Interactive Mood Selector Buttons */}
          <div className="flex items-center justify-between gap-1.5 bg-black/5 p-1 rounded-xl">
            {moodsList.map((moodItem) => (
              <button
                key={moodItem.value}
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  setSelectedMood(moodItem.value);
                }}
                className={`flex-1 py-2 text-center rounded-lg transition-all ${selectedMood === moodItem.value
                  ? "bg-white text-[var(--text-main)] shadow-xs scale-105 font-bold border border-[var(--primary)]/10"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
                title={moodItem.label}
              >
                <span className="block text-base">{moodItem.emoji}</span>
                <span className="text-[9.5px] block capitalize mt-0.5">{moodItem.value}</span>
              </button>
            ))}
          </div>

          {/* Mood input form */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Mood note (optional)..."
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              className="flex-1 px-3 py-2 text-xs md:text-sm font-serif italic text-[var(--text-main)] bg-white/70 border border-[var(--border-color)] rounded-xl focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                triggerHaptic("success");
                addMoodHistoryEntry(selectedMood, moodNote);
                setMoodNote("");
              }}
              className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider"
            >
              Share
            </button>
          </div>

          {/* Collapsible history log list */}
          {showMoodHistory && (
            <div className="pt-2 border-t border-[var(--border-color)] space-y-2 max-h-36 overflow-y-auto pr-0.5 scrollbar-thin">
              {moodHistory && moodHistory.length > 0 ? (
                moodHistory.slice(0, 4).map((entry) => {
                  const mInfo = moodsList.find((m) => m.value === entry.mood);
                  return (
                    <div key={entry.id} className="flex gap-2 text-left items-center p-1.5 bg-white/20 border border-white/10 rounded-lg">
                      <span className="text-sm">{mInfo?.emoji || "🌸"}</span>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5 text-xs">
                        <span className="font-bold text-[var(--text-main)] truncate max-w-[100px]">
                          {entry.userName.split(" ")[0]}: {entry.mood}
                        </span>
                        {entry.note && (
                          <span className="font-serif italic text-[var(--primary)] truncate max-w-[90px]">
                            "{entry.note}"
                          </span>
                        )}
                        <span className="text-[9.5px] text-[var(--text-muted)]">{formatRelativeTime(entry.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[var(--text-muted)] text-center py-1">No log entries.</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>

    {/* 3. Spotify Player & Activity Logging Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Spotify Integration Component - Immersive Theme-Synced Player */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="glass-panel relative rounded-[28px] overflow-hidden flex flex-col shadow-2xl"
        id="spotify-widget"
      >
        {/* Dynamic ambient glow behind the whole card based on active track */}
        <div
          className="absolute inset-0 transition-all duration-1000 ease-in-out pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 30%, ${activeGlowColor} 0%, transparent 72%)` }}
        />
        {/* Decorative floating dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-[12%] left-[18%] w-1.5 h-1.5 rounded-full blur-[1px] animate-pulse" style={{ backgroundColor: activeHighlightColor }} />
          <div className="absolute top-[40%] right-[12%] w-1 h-1 rounded-full blur-[1px] animate-pulse" style={{ backgroundColor: activeHighlightColor, animationDelay: '0.5s' }} />
          <div className="absolute bottom-[20%] left-[8%] w-2 h-2 rounded-full blur-[1px] animate-pulse" style={{ backgroundColor: activeHighlightColor, animationDelay: '1.2s' }} />
        </div>
        {/* Sleek top accent line */}
        <div className="absolute top-0 inset-x-0 h-[1px]" style={{ backgroundImage: `linear-gradient(to right, transparent, ${activeHighlightColor}33, transparent)` }} />

        <div className="relative z-10 p-5 flex flex-col gap-0">
          {/* ── New immersive player inner content ── */}


          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className={`absolute w-3 h-3 rounded-full blur-[4px] ${currentSong.isPlaying ? 'animate-pulse' : ''}`} style={{ backgroundColor: activeHighlightColor }} />
                <div className={`relative w-2 h-2 rounded-full ${currentSong.isPlaying ? '' : 'bg-[var(--text-muted)]/20'}`} style={currentSong.isPlaying ? { backgroundColor: activeHighlightColor } : undefined} />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-1.5 font-display" style={{ color: activeHighlightColor }}>
                  <Music className={`w-3 h-3 ${currentSong.isPlaying ? 'animate-pulse' : ''}`} style={{ color: activeHighlightColor }} />
                  Listening Together
                </span>
                <span className="text-[8px] text-[var(--text-muted)] tracking-wider mt-0.5 uppercase font-mono block">Room Connected Sync</span>
              </div>
            </div>
            {/* Mode toggle */}
            <label className="flex items-center gap-2 bg-[var(--text-muted)]/10 px-3 py-1.5 rounded-full border border-[var(--border-color)] cursor-pointer select-none">
              <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Link Mode</span>
              <div className="relative">
                <input type="checkbox" checked={isLinkMode} onChange={(e) => setIsLinkMode(e.target.checked)} className="sr-only" />
                <div className="w-7 h-4 rounded-full transition-colors" style={isLinkMode ? { backgroundColor: activeHighlightColor } : { backgroundColor: "rgba(var(--text-muted-rgb, 120,120,120), 0.1)", border: "1px solid var(--border-color)" }} />
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${isLinkMode ? 'translate-x-3' : ''}`} />
              </div>
            </label>
          </div>


          {/* SDK Token box (default SDK mode) */}
          {!isLinkMode && (
            <div className="mb-4 p-3.5 rounded-2xl border space-y-2" style={{ backgroundColor: activeHighlightColor + '0d', borderColor: activeHighlightColor + '20' }}>
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-mono uppercase tracking-widest flex items-center gap-1.5 font-bold" style={{ color: activeHighlightColor }}>
                  <Wifi className={`w-3 h-3 ${isSdkConnected ? 'animate-pulse' : 'text-[var(--text-muted)]/30'}`} style={isSdkConnected ? { color: activeHighlightColor } : undefined} />
                  Spotify Premium Token
                </span>
                <a href="https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started" target="_blank" rel="noopener noreferrer"
                  className="text-[8px] hover:opacity-85 hover:underline flex items-center gap-1 font-bold uppercase" style={{ color: activeHighlightColor }}>
                  Get Token ↗
                </a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Paste Spotify OAuth Token (BQC...)"
                  value={spotifyToken}
                  onChange={(e) => setSpotifyToken(e.target.value)}
                  className="w-full pl-3 pr-12 py-2 text-xs font-mono bg-white/50 border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)]/40 focus:outline-none focus:border-[var(--primary)]/50 transition-all"
                />
                {spotifyToken && (
                  <button onClick={() => setSpotifyToken("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-[8px] font-bold uppercase">Clear</button>
                )}
              </div>
              <div className="text-[8px] font-mono">
                {spotifyErrorState ? (
                  <p className="text-rose-500 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> {spotifyErrorState}
                  </p>
                ) : isSdkConnected ? (
                  <p className="flex items-center gap-1.5 font-semibold" style={{ color: activeHighlightColor }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: activeHighlightColor }} />
                    Ready · Device: <span className="text-[var(--text-main)] bg-[var(--text-muted)]/10 px-1.5 py-0.5 rounded border border-[var(--border-color)] font-bold">{spotifyDeviceId?.substring(0, 12)}...</span>
                  </p>
                ) : (
                  <p className="text-[var(--text-muted)]/50 flex items-center gap-1 uppercase tracking-wider text-[7px]">
                    <span className="w-1 h-1 bg-[var(--text-muted)]/30 rounded-full" /> Waiting for token...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Link Mode: playlist URL + direct track paste */}
          {isLinkMode && (
            <div className="mb-4 space-y-3 p-3.5 rounded-2xl border" style={{ backgroundColor: activeHighlightColor + '0d', borderColor: activeHighlightColor + '20' }}>
              <form onSubmit={handleSpotifyUrlSubmit} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest">Paste Spotify Track URL</span>
                  {spotifyError && <span className="text-rose-500 font-mono text-[8px] font-bold animate-pulse">{spotifyError}</span>}
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="https://open.spotify.com/track/..."
                    value={spotifyUrlInput}
                    onChange={(e) => setSpotifyUrlInput(e.target.value)}
                    className="w-full bg-white/50 border border-[var(--border-color)] rounded-xl py-2 pl-3 pr-20 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/45 outline-none transition-all"
                    style={{ focusBorderColor: activeHighlightColor }}
                  />
                  <button type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 text-white text-[8px] font-black uppercase px-3 rounded-lg active:scale-95 transition-all cursor-pointer" style={{ backgroundColor: activeHighlightColor }}>Sync</button>
                </div>
              </form>
              <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
                <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-widest block">Playlist to Sync From</span>
                <input
                  type="text"
                  placeholder="Paste Spotify Playlist Link..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="w-full bg-white/50 border border-[var(--border-color)] rounded-xl py-2 px-3 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)]/45 outline-none"
                />
              </div>
            </div>
          )}

          {/* Vinyl + Track Info */}
          <div className="flex items-center gap-5 my-3 p-4 border rounded-2xl relative overflow-hidden" style={{ backgroundColor: activeHighlightColor + '0d', borderColor: activeHighlightColor + '10' }}>
            <div className="absolute top-1/2 left-8 w-20 h-20 rounded-full blur-2xl pointer-events-none -translate-y-1/2" style={{ backgroundColor: activeHighlightColor + '1a' }} />
            {/* Vinyl art */}
            <div className="relative w-16 h-16 flex-shrink-0 select-none flex items-center justify-center cursor-pointer" onClick={() => setSongPlayState(!currentSong.isPlaying)}>
              <div className="absolute -inset-2 rounded-full blur-lg opacity-75 animate-pulse" style={{ backgroundColor: activeHighlightColor + '26' }} />
              {/* Spinning vinyl record */}
              <div className={`absolute w-14 h-14 bg-zinc-950 rounded-full border border-zinc-800/80 flex items-center justify-center transition-all duration-1000 ${currentSong.isPlaying ? "translate-x-5 animate-spin-slow" : "translate-x-0"}`} style={{ zIndex: 1 }}>
                <div className="absolute inset-1.5 border border-zinc-900/50 rounded-full" />
                <div className="w-5 h-5 bg-slate-950 rounded-full border border-zinc-700/80 overflow-hidden">
                  <img src={currentSong.artwork} className="w-full h-full object-cover opacity-60" alt="vinyl center" referrerPolicy="no-referrer" />
                </div>
              </div>
              {/* Album cover */}
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 shadow-xl" style={{ zIndex: 2, borderColor: activeHighlightColor + '4d' }}>
                <img src={currentSong.artwork} alt={currentSong.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 m-auto w-5 h-5 bg-black/95 rounded-full border border-white/10 flex items-center justify-center">
                  <div className="w-1 h-1 bg-white/40 rounded-full" />
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(currentSong.title); }}
                  className="absolute bottom-1 right-1 p-1 rounded-full bg-black/80 border border-white/10 text-slate-300 transition-all active:scale-90"
                  style={{ hoverBackgroundColor: activeHighlightColor }}
                >
                  <Heart className={`w-2.5 h-2.5 ${likedSongs[currentSong.title] ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
              </div>
            </div>
            {/* Track details */}
            <div className="flex-1 space-y-1.5 min-w-0 z-10">
              <span className="text-[8px] font-mono font-bold tracking-[0.2em] uppercase px-2 py-0.5 rounded-full border inline-block" style={{ color: activeHighlightColor, borderColor: activeHighlightColor + '33', backgroundColor: activeHighlightColor + '1a' }}>NOW SYNCED</span>
              <p className="text-base font-bold text-[var(--text-main)] truncate font-display italic">{currentSong.title}</p>
              <p className="font-semibold text-xs truncate" style={{ color: activeHighlightColor }}>
                {currentSong.artist}
                {currentSong.album && <span className="text-[var(--text-muted)] text-[9px] font-normal italic ml-1">• {currentSong.album}</span>}
              </p>
              {/* EQ bars */}
              <div className="flex items-end gap-0.5 h-3">
                {currentSong.isPlaying ? (
                  <>
                    <span className="w-0.5 rounded-full animate-bounce h-3" style={{ backgroundColor: activeHighlightColor, animationDuration: '0.8s' }} />
                    <span className="w-0.5 rounded-full animate-bounce h-2" style={{ backgroundColor: activeHighlightColor, animationDuration: '1.1s', animationDelay: '0.1s' }} />
                    <span className="w-0.5 rounded-full animate-bounce h-1.5" style={{ backgroundColor: activeHighlightColor, animationDuration: '0.7s', animationDelay: '0.3s' }} />
                    <span className="w-0.5 rounded-full animate-bounce h-2.5" style={{ backgroundColor: activeHighlightColor, animationDuration: '1.3s', animationDelay: '0.2s' }} />
                    <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider ml-1.5 leading-3">Playing in sync</span>
                  </>
                ) : (
                  <span className="text-[8px] text-[var(--text-muted)]/50 uppercase tracking-wider">Sync paused</span>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2 px-0.5 space-y-1">
            <div
              className="h-1.5 w-full bg-[var(--text-muted)]/10 rounded-full overflow-hidden cursor-pointer relative group hover:bg-[var(--text-muted)]/20 transition-all"
              onClick={handleProgressBarClick}
            >
              <div
                className="h-full rounded-full relative transition-all duration-300"
                style={{ width: `${(currentSong.progressMs / (currentSong.durationMs || 1)) * 100}%`, backgroundColor: activeHighlightColor, boxShadow: `0 0 8px ${activeHighlightColor}66` }}
              >
                {currentSong.isPlaying && <div className="absolute inset-0 shimmer-bg opacity-20" />}
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${(currentSong.progressMs / (currentSong.durationMs || 1)) * 100}% - 5px)`, boxShadow: `0 0 6px ${activeHighlightColor}` }}
              />
            </div>
            <div className="flex justify-between text-[8px] font-mono text-[var(--text-muted)] tracking-widest">
              <span>{formatPlayerTime(currentSong.progressMs)}</span>
              <span>{formatPlayerTime(currentSong.durationMs)}</span>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-6 mt-4 py-2 px-4 bg-[var(--primary)]/[0.02] border rounded-2xl relative" style={{ borderColor: activeHighlightColor + '20' }}>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[7px] font-mono text-[var(--text-muted)] uppercase hidden sm:block">
              {isSdkConnected ? "SDK ACTIVE 🔊" : "Vibe Synced 🎧"}
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleShuffle}
                className={`p-1.5 transition-all hover:scale-110 active:scale-90 cursor-pointer ${isShuffleActive ? "opacity-100 scale-105" : "opacity-40 hover:opacity-75"}`}
                style={{ color: isShuffleActive ? activeHighlightColor : 'var(--text-muted)' }}
                title="Shuffle playlist"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => handleTrackSkip("prev")} className="p-1.5 text-[var(--text-muted)]/60 hover:opacity-100 active:scale-90 transition-all hover:scale-110 cursor-pointer" style={{ hoverColor: activeHighlightColor }}>
                <SkipBack className="w-4 h-4 fill-current" />
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  const nextPlayingState = !currentSong.isPlaying;
                  
                  broadcastLocalAction({
                    title: currentSong.title,
                    artist: currentSong.artist,
                    album: currentSong.album,
                    artwork: currentSong.artwork,
                    durationMs: currentSong.durationMs,
                    progressMs: spotifyPlaybackState?.position || currentSong.progressMs || 0,
                    spotifyId: currentSong.spotifyId || "5lYlS8n8nZ9Lh6p3O6Y2y2"
                  }, nextPlayingState);

                  if (isYtReady && ytPlayer) {
                    if (nextPlayingState) {
                      ytPlayer.playVideo();
                    } else {
                      ytPlayer.pauseVideo();
                    }
                  } else {
                    setSongPlayState(nextPlayingState);
                  }
                }}
                className="w-11 h-11 text-white active:scale-95 rounded-full transition-all hover:scale-105 flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: activeHighlightColor, boxShadow: `0 4px 15px ${activeHighlightColor}40` }}
              >
                {currentSong.isPlaying ? <Pause className="w-4.5 h-4.5 fill-current" /> : <Play className="w-4.5 h-4.5 fill-current ml-0.5" />}
              </button>
              <button type="button" onClick={() => handleTrackSkip("next")} className="p-1.5 text-[var(--text-muted)]/60 hover:opacity-100 active:scale-90 transition-all hover:scale-110 cursor-pointer" style={{ hoverColor: activeHighlightColor }}>
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
              <button
                type="button"
                onClick={toggleRepeat}
                className={`p-1.5 transition-all hover:scale-110 active:scale-90 cursor-pointer ${isRepeatActive ? "opacity-100 scale-105" : "opacity-40 hover:opacity-75"}`}
                style={{ color: isRepeatActive ? activeHighlightColor : 'var(--text-muted)' }}
                title="Repeat track"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[7px] font-mono text-[var(--text-muted)] bg-[var(--text-muted)]/10 px-2 py-0.5 rounded-full border border-[var(--border-color)]">
              <Volume2 className="w-2.5 h-2.5 animate-pulse" style={{ color: activeHighlightColor }} />
              <span>Stereo</span>
            </div>
          </div>

          {/* YouTube Stealth Audio Engine */}
          <div id="youtube-audio-engine" style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }} />

          {/* Lyrics section */}
          <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2 hover:text-[var(--text-main)] transition-colors"
            >
              <span className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5" style={{ color: activeHighlightColor }} />
                Lyrics
              </span>
              {showLyrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showLyrics && (
              <div className="bg-[var(--text-muted)]/10 p-3 rounded-xl border border-[var(--border-color)] text-xs text-center leading-relaxed">
                {(() => {
                  const lyricData = TRACK_LYRICS[currentSong.title];
                  if (!lyricData) return <p className="text-[var(--text-muted)] italic py-1">No lyrics found for this track.</p>;
                  return (
                    <div className="space-y-1.5">
                      {lyricData.lines.map((line, i) => {
                        const [start, end] = lyricData.ranges[i];
                        const isActive = currentSong.progressMs >= start && (end === null || currentSong.progressMs < end);
                        return (
                          <p key={i} className={isActive ? "font-bold text-sm" : "text-[var(--text-muted)]/50"} style={isActive ? { color: activeHighlightColor } : undefined}>{line}</p>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Playlist track selector */}
          <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3 h-3" style={{ color: activeHighlightColor }} />
                Sync Romantic Playlist
              </p>
              {isLoadingPlaylist && <Loader2 className="w-3 h-3 animate-spin" style={{ color: activeHighlightColor }} />}
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {playlistTracks.map((vibe) => {
                const isActive = currentSong.title.toLowerCase() === vibe.title.toLowerCase();
                return (
                  <button
                    key={vibe.title + vibe.spotifyId}
                    onClick={async () => {
                      triggerHaptic("light");
                      
                      let ytId = vibe.youtubeId;
                      if (!ytId) {
                        ytId = await searchYouTubeVideo(vibe.artist, vibe.title);
                      }
                      if (!ytId) ytId = "5lYlS8n8nZ9Lh6p3O6Y2y2";

                      const targetSong = {
                        title: vibe.title,
                        artist: vibe.artist,
                        album: vibe.album,
                        artwork: vibe.artwork,
                        durationMs: vibe.durationMs,
                        progressMs: 0,
                        isPlaying: true,
                        spotifyId: ytId,
                      };

                      broadcastLocalAction(targetSong, true);

                      if (isYtReady && ytPlayer) {
                        ytPlayer.loadVideoById(ytId, 0);
                        ytPlayer.playVideo();
                      } else {
                        setSongPlayState(true);
                      }
                    }}
                    className="text-left p-2 flex items-center gap-2 rounded-xl border transition-all duration-200 cursor-pointer"
                    style={isActive ? {
                      backgroundColor: activeHighlightColor + '1a',
                      borderColor: activeHighlightColor + '4d',
                    } : {
                      backgroundColor: "rgba(var(--text-muted-rgb, 120,120,120), 0.05)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <img src={vibe.artwork} className={`w-8 h-8 rounded-lg object-cover flex-shrink-0 ${isActive ? "" : "grayscale"}`} alt={vibe.title} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[var(--text-main)] truncate">{vibe.title}</p>
                      <p className="text-[9px] truncate mt-0.5" style={isActive ? { color: activeHighlightColor, fontWeight: "bold" } : { color: "var(--text-muted)" }}>
                        {isActive ? "● Playing" : vibe.artist}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Activities Log */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="glass-panel p-6 rounded-2xl flex flex-col justify-between"
        id="activity-widget"
      >
        <div>
          <h3 className="text-sm md:text-base font-semibold text-[var(--text-main)] mb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-500" />
            Recent Bubble Activities
          </h3>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {activityLogs.map((log) => {
              const isUserA = log.userId === "user_a";
              return (
                <div key={log.id} className="flex items-start gap-2.5 text-xs md:text-sm">
                  <span className="mt-0.5">{isUserA ? "🌸" : "☕"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-main)] leading-relaxed">
                      <span className="font-bold">{isUserA ? userA.name.split(" ")[0] : userB.name.split(" ")[0]}</span>{" "}
                      {log.text}
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider & Shared Sweet Notes Board */}
          <div className="border-t border-[var(--border-color)] my-4 pt-3">
            <h3 className="text-sm md:text-base font-bold text-[var(--text-main)] mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-current animate-pulse" />
                <span>Sweet Love Notes Board</span>
              </span>
              <span className="text-xs text-[var(--text-muted)] font-normal">Tap note to remove 📌</span>
            </h3>

            {/* Sticky Notes Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {stickyNotes.map((note, idx) => {
                const isSenderA = note.senderId === "user_a";
                const senderName = isSenderA ? userA.name.split(" ")[0] : userB.name.split(" ")[0];
                const rotations = [-2, 1.5, -1, 1];
                return (
                  <motion.div
                    key={note.id}
                    whileHover={{ scale: 1.03, rotate: 0 }}
                    onClick={async () => {
                      triggerHaptic("medium");
                      try {
                        await deleteDoc(doc(db, "sticky_notes", note.id));
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className={`p-3.5 rounded-xl border shadow-sm cursor-pointer relative overflow-hidden transition-all duration-300 ${note.color} hover:shadow-md`}
                    style={{ rotate: rotations[idx % 4] }}
                  >
                    <div className="absolute top-1 right-1 text-[8.5px] opacity-35 font-mono">✕</div>
                    <p className="text-xs md:text-sm font-serif leading-snug break-words mb-1.5">"{note.text}"</p>
                    <div className="flex justify-between items-center text-[10px] md:text-xs opacity-80 font-semibold">
                      <span>✏️ {senderName}</span>
                      <span>📌</span>
                    </div>
                  </motion.div>
                );
              })}
              {stickyNotes.length === 0 && (
                <div className="col-span-2 text-center py-4 bg-white/20 border border-dashed border-black/5 rounded-xl">
                  <p className="text-xs md:text-sm text-[var(--text-muted)] italic font-serif">The love notes board is empty... leave a sweet note below! ✍️</p>
                </div>
              )}
            </div>

            {/* Add Note Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newNoteText.trim()) return;
                triggerHaptic("success");
                try {
                  const noteId = "note-" + Date.now();
                  await setDoc(doc(db, "sticky_notes", noteId), {
                    text: newNoteText.trim(),
                    sender_id: currentUser,
                    color: selectedNoteColor,
                    created_at: new Date().toISOString()
                  });
                  setNewNoteText("");
                } catch (err) {
                  console.error(err);
                }
              }}
              className="space-y-2.5"
            >
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  maxLength={60}
                  placeholder="Write a sweet whisper note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs md:text-sm text-[var(--text-main)] bg-white/70 border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--primary)] font-serif italic"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs md:text-sm font-bold transition-all flex-shrink-0"
                >
                  Post 📌
                </button>
              </div>
              {/* Note color selectors */}
              <div className="flex gap-1.5 justify-end">
                {[
                  { color: "bg-rose-100/90 border-rose-200 text-rose-800", label: "Rose" },
                  { color: "bg-amber-100/90 border-amber-200 text-amber-800", label: "Amber" },
                  { color: "bg-pink-100/90 border-pink-200 text-pink-800", label: "Pink" },
                  { color: "bg-indigo-100/90 border-indigo-200 text-indigo-800", label: "Blue" },
                ].map((colorObj) => (
                  <button
                    key={colorObj.label}
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setSelectedNoteColor(colorObj.color);
                    }}
                    className={`h-4.5 px-2 text-[9px] rounded-full border transition-all ${colorObj.color} ${selectedNoteColor === colorObj.color ? "ring-2 ring-[var(--primary)] font-bold scale-105" : "opacity-60"
                      }`}
                  >
                    {colorObj.label}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>

        <div className="border-t border-[var(--border-color)] pt-3 mt-4 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
          <span>Only readable by the two of you</span>
          <span className="flex items-center gap-1 font-semibold text-[var(--primary)] font-mono">
            Active Connection <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </motion.div>
    </div>
  </div>
);
}
