# PHASE 6: Architecture Documentation — Couple_Private_Place

> **Project**: Couple_Private_Place — "Our Little Universe"  
> **Stack**: React 19 + Vite 6 + Tailwind CSS 4 + Firebase  
> **Date**: July 13, 2026

---

## 6.1 Routing Structure

The app uses **no React Router** — navigation is handled entirely through React state + conditional rendering in `App.tsx`.

```
/ (root)
├── LoginView          🔓  Google OAuth gate — shown when !session
├── OnboardingView     🔒  Slot claim — shown when session && isOnboarding
└── 🏠 The Treehouse   🔒  Main app — shown when session && !isOnboarding
    ├── 🏠 The Foyer        ✅  HomeView (default tab)
    ├── 📸 Our Archive      ✅  MemoriesView
    │   ├── 📖 Our Story        ✅  StorySection (default subtab)
    │   └── 📸 The Photobooth   ✅  PhotoboothSection
    ├── 💌 The Heartbeat    ✅  TogetherView
    │   ├── 💌 Letters & Capsules ✅  LettersPanel (default subtab)
    │   ├── 👁️ Activity Status   ✅  StatusPanel
    │   ├── 📺 Theater Sync      ✅  WatchPanel
    │   └── 📅 Calendar          ✅  SharedCalendar
    ├── 🎮 Game Attic       ✅  PlayView
    │   ├── ⭕❌ Tic Tac Toe      ✅  (inline component)
    │   ├── 🤔 Would You Rather   ✅  (inline component)
    │   ├── 🎡 Spin the Dare      ✅  (inline component)
    │   ├── 🎨 Sketch Canvas      ✅  (inline component)
    │   └── 🎹 Grand Piano        ✅  VirtualPiano
    ├── 🌿 Secret Garden    ✅  AdventureView
    │   └── 🌱 Interactive Terrarium ✅  InteractiveTerrarium
    │       ├── 🌄 The View       ✅  Scene tab
    │       └── 📝 Garden Whisper ✅  Diary tab
    └── 🔧 Workshop         ✅  SettingsView
        ├── 🔨 Slots            ✅  Profile display
        ├── 📝 Profile          ✅  ProfileSettingsPanel
        ├── 💖 Emotions         ✅  EmotionalAdminPanel
        │   ├── ☀️ Greetings    ✅  GreetingsEditor
        │   ├── 💌 Letters      ✅  ScheduledLettersPanel
        │   └── 📅 Dates        ✅  SpecialDatesEditor
        ├── 🔧 Utilities        ✅  WorkspaceUtilitiesPanel
        ├── 🚪 Sign Out         ✅  Logout button
        └── 🔐 Admin Panel      ✅  AdminSection (gated)
```

**Navigation**: Floating dock at bottom with 6 tabs + animated indicator.  
**Transitions**: `AnimatePresence` with slide + opacity.  
**Code-splitting**: All 6 views are `React.lazy()` loaded.

---

## 6.2 Folder Structure

```
src/
├── App.tsx                    # Root component: auth gating, nav dock, music iframe, dark mode, overlays
├── main.tsx                   # Entry point: renders <App /> + <Toaster />
├── index.css                  # Global CSS: Tailwind directives, CSS variables, animations
├── types.ts                   # All TypeScript interfaces (Profile, Memory, Journal, Letter, etc.)
├── firebaseClient.ts          # Firebase init (Auth, Firestore, RTDB, Cloudinary helpers)
│
├── assets/                    # (14 files) Backgrounds, paper textures, polaroid frames,
│   ├── backgrounds/           #   stamps, stickers, tape, textures — mostly .gitkeep placeholders
│   ├── paper/
│   ├── polaroid/
│   ├── stamps/
│   ├── stickers/
│   └── tape/
│
├── components/                # (50 files) — All UI components
│   ├── adventure/
│   │   └── InteractiveTerrarium.tsx     # Terrarium scene + diary
│   ├── common/
│   │   └── ErrorBoundary.tsx            # React Error Boundary with fallback UI
│   ├── emotional/
│   │   ├── index.ts                     # Barrel exports
│   │   ├── ConfettiEffect.tsx           # Confetti celebration animation
│   │   ├── EmotionalAdminPanel.tsx      # Greetings/Letters/Dates admin
│   │   ├── GratitudePrompt.tsx          # Daily gratitude practice
│   │   ├── MemoryToday.tsx              # "On This Day" feature
│   │   ├── SpecialDateBanner.tsx        # Anniversary/birthday banners
│   │   ├── TimeGreeting.tsx             # Time-of-day greeting + NightAmbient
│   │   └── WeatherBadge.tsx             # Persistent rain badge
│   ├── extras/
│   │   ├── SectionHeader.tsx            # Reusable section header
│   │   └── Skeleton.tsx                 # Skeleton loading placeholders (5 variants)
│   ├── home/
│   │   ├── AnniversaryCountdown.tsx     # Live anniversary countdown
│   │   ├── DailyVibeVinyl.tsx           # One-per-day vinyl mood picker
│   │   ├── MilestonesSection.tsx        # Milestones + DailyQuote
│   │   ├── MusicPlayer.tsx              # Music player orchestrator
│   │   ├── MusicPlayerControls.tsx      # Play/pause/volume/skip controls
│   │   ├── MusicPlayerLyrics.tsx        # Synced lyrics display
│   │   ├── MusicPlayerPlaylist.tsx      # Playlist + search
│   │   ├── MusicPlayerUtils.ts          # YouTube API helpers (fetch, parse, search)
│   │   ├── PlaylistBuilder.tsx          # Shared queue
│   │   ├── RelationshipStreak.tsx       # (DELETED — old XP streak)
│   │   ├── SharedCalendar.tsx           # Couple calendar
│   │   ├── StickyNotes.tsx              # Sticky notes board
│   │   ├── WeatherSection.tsx           # Weather + MoodSelector
│   │   └── WelcomeHero.tsx              # Welcome hero + MemorySpotlight
│   ├── memories/
│   │   ├── PhotoboothSection.tsx        # Live photobooth studio
│   │   └── StorySection.tsx             # Chronological scrapbook timeline
│   ├── scrapbook/
│   │   ├── index.ts                     # Barrel exports
│   │   ├── EmptyJournalPage.tsx         # Empty state component
│   │   ├── PolaroidFrame.tsx            # Polaroid-style frame
│   │   ├── ScrapbookPage.tsx            # Scrapbook page container
│   │   ├── StickerButton.tsx            # Themed button
│   │   └── WashiTapeDivider.tsx         # Decorative section divider
│   ├── together/
│   │   ├── LettersPanel.tsx             # Letters + Time Capsules
│   │   ├── StatusPanel.tsx              # Activity status presets
│   │   └── WatchPanel.tsx               # Co-watching theater
│   ├── ui/
│   │   ├── button.tsx                   # shadcn Button component
│   │   └── sonner.tsx                   # shadcn Toaster wrapper
│   ├── AdventureView.tsx                # Secret Garden orchestrator
│   ├── HomeView.tsx                     # The Foyer orchestrator
│   ├── LoginView.tsx                    # Google OAuth login page
│   ├── MemoriesView.tsx                 # Our Archive orchestrator
│   ├── OnboardingView.tsx               # Profile slot selection
│   ├── PlayView.tsx                     # Game Attic (with inline TTT, WYR, SpinDare, Sketch)
│   ├── SettingsView.tsx                 # Workshop (with inline Profile, Utilities, Admin panels)
│   ├── TogetherView.tsx                 # The Heartbeat orchestrator
│   └── VirtualPiano.tsx                 # Virtual piano keyboard
│
├── context/                   # (7 files) — React Context + state management
│   ├── CoupleContext.tsx       # Main context provider — composes all sub-hooks
│   ├── defaults.ts            # Initial/default state values + localStorage helpers
│   ├── useAuthState.ts        # Auth session, slot claiming, onboarding
│   ├── useProfileState.ts     # Profile CRUD + Firestore sync
│   ├── useContentState.ts     # Memories, journals, letters, time capsules
│   ├── useEngagementState.ts  # Missions, garden, song, moods, gratitudes
│   └── useSettingsState.ts    # Dark mode, dates, Cloudinary, greetings, weather
│
├── hooks/                     # (2 files)
│   ├── useCamera.ts           # Webcam hook (start/stop/error)
│   └── useTimeOfDay.ts        # Time-of-day detection + greeting logic
│
├── lib/                       # (2 files)
│   ├── haptics.ts             # Haptic feedback utility
│   └── utils.ts               # cn() utility (clsx + tailwind-merge)
│
└── services/
    └── cloudinary.ts          # Cloudinary upload helper
```

**Total: 79 source files** (excluding `_design-audit/`, `node_modules/`, `dist/`, config files)

---

## 6.3 Database Schema

### Firebase Firestore Collections

#### `profiles/{userId}` (userId = "user_a" | "user_b")

| Field | Type | Req. | Default | Notes |
|-------|------|------|---------|-------|
| `auth_id` | string | ❌ | `null` | Firebase Auth UID — `null` = slot unclaimed |
| `name` | string | ✅ | "Partner A/B" | Display name |
| `avatar_url` | string | ✅ | Unsplash default | Photo URL (base64 or Cloudinary) |
| `status` | string | ❌ | "Waiting for connection..." | Live status text |
| `mood` | string | ❌ | "happy" | Current mood key |
| `mood_note` | string | ❌ | — | Mood whisper text |
| `gender` | "pria"\|"wanita" | ❌ | — | Pre-configured per slot |
| `emoji` | string | ❌ | "💖" / "✨" | Profile badge emoji |
| `latitude` | number | ❌ | — | GPS latitude (auto-detected) |
| `longitude` | number | ❌ | — | GPS longitude (auto-detected) |
| `weather_city` | string | ❌ | — | Resolved city name |
| `timezone_offset` | number | ❌ | — | Minutes from UTC |
| `timezone_name` | string | ❌ | — | IANA timezone name |
| `updated_at` | ISO string | ✅ | — | Last update timestamp |

**Relationships**: Referenced by `memories.created_by`, `gratitudes.userId`, etc.

---

#### `memories/{memoryId}`

| Field | Type | Req. | Notes |
|-------|------|------|-------|
| `type` | "milestone"\|"photobooth"\|"drawing" | ✅ | Memory type |
| `title` | string | ✅ | Display title |
| `description` | string | ❌ | Caption text |
| `image_url` | string | ❌ | Cloudinary or URL |
| `date` | YYYY-MM-DD | ✅ | Memory date |
| `created_at` | ISO string | ✅ | Auto-generated |
| `created_by` | "user_a"\|"user_b" | ✅ | Author |
| `reactions.user_a` | string[] | ❌ | Emojis reacted by user_a |
| `reactions.user_b` | string[] | ❌ | Emojis reacted by user_b |
| `comments` | `Comment[]` | ❌ | Array of `{ id, authorId, text, date }` |
| `bg_style` | string | ❌ | Photobooth background style |
| `filter_class` | string | ❌ | Photo filter applied |
| `layout` | string | ❌ | Photobooth strip layout |
| `photos_list` | string[] | ❌ | Photobooth strip photos |
| `show_on_timeline` | boolean | ❌ | default `true` |

---

#### `journals/{journalId}`

| Field | Type | Req. | Notes |
|-------|------|------|-------|
| `title` | string | ✅ | Entry title |
| `description` | string | ✅ | Diary content |
| `date` | ISO string | ✅ | Entry date |
| `location` | string | ❌ | Where |
| `weather` | string | ❌ | "sunny" \| "rainy" \| etc. |
| `mood` | string | ❌ | "cozy" \| "excited" \| etc. |
| `tags` | string[] | ❌ | e.g. ["date-night", "cafe"] |
| `imageUrl` | string | ❌ | Optional photo |
| `created_at` | ISO string | ✅ | Timestamp |
| `created_by` | "user_a"\|"user_b" | ✅ | Author |
| `edited_at` | ISO string | ❌ | Last edit timestamp |

---

#### `missions/{missionId}`

| Field | Type | Req. | Notes |
|-------|------|------|-------|
| `text` | string | ✅ | Mission description |
| `completed` | boolean | ✅ | Toggle state |
| `type` | "daily"\|"weekly" | ✅ | Frequency |
| `created_at` | ISO string | ✅ | Auto-generated |

---

#### `settings/couple_settings`

| Field | Type | Req. | Notes |
|-------|------|------|-------|
| `anniversary_date` | string | ✅ | ISO date "2024-10-15" |
| `birthday_a` | string | ✅ | "MM-DD" format |
| `birthday_b` | string | ✅ | "MM-DD" format |
| `cloudinary_cloud_name` | string | ❌ | Cloudinary account |
| `cloudinary_upload_preset` | string | ❌ | Cloudinary preset |
| `custom_greetings` | object | ❌ | `{ morning, afternoon, evening, night }` |

---

#### `settings/shared_song`

| Field | Type | Req. | Notes |
|-------|------|------|-------|
| `title` | string | ✅ | Song title |
| `artist` | string | ✅ | Artist name |
| `album` | string | ❌ | Album title |
| `artwork` | string | ❌ | Thumbnail URL |
| `duration_ms` | number | ❌ | Track length in ms |
| `video_id` | string | ❌ | YouTube video ID |
| `is_playing` | boolean | ✅ | Play/pause state |
| `synced_at` | ISO string | ❌ | Last sync timestamp |

---

#### `rooms/ttt_room`, `rooms/wyr_room`, `rooms/spindare_room`, `rooms/sketch_room`, `rooms/watch_room`

These are **real-time game/activity rooms** with schemas detailed in [Phase 5](#17-multiplayer-games).

#### `rooms/game_stats`

| Field | Type | Notes |
|-------|------|-------|
| `tictactoe.{playCount, streak}` | number | Play stats |
| `wyr.{playCount, streak}` | number | Play stats |
| `spindare.{playCount, streak}` | number | Play stats |
| `sketch.{playCount, streak}` | number | Play stats |
| `piano.{playCount, streak}` | number | Play stats |

#### Other Collections

| Collection | Fields | Purpose |
|-----------|--------|---------|
| `gratitudes/{userId_date}` | `userId, text, date, createdAt` | Daily gratitude entries |
| `calendar_events/{docId}` | `title, date, description, createdBy, createdAt` | Shared calendar events |
| `sticky_notes/{docId}` | `text, author, color, createdAt` | Sticky notes |
| `shared_queue/{docId}` | `videoId, title, artist, artwork, addedBy, addedAt` | Music queue |
| `saved_sketches/{docId}` | `url, createdAt, createdBy` | Saved drawings |
| `photobooth_rooms/{code}` | `hostId, guestId, layout, state, round, photosA/B, ...` | Photobooth sessions |
| `activity_logs/{docId}` | `user_id, text, timestamp` | Activity history |

---

## 6.4 Environment Variables

| Variable | Required | Used In | Purpose | Sensitive |
|----------|----------|---------|---------|-----------|
| `VITE_FIREBASE_API_KEY` | ✅ | `firebaseClient.ts` | Firebase project API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | `firebaseClient.ts` | Firebase Auth domain | No |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | `firebaseClient.ts` | Firebase project ID | No |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | `firebaseClient.ts` | Firebase sender ID | No |
| `VITE_FIREBASE_APP_ID` | ✅ | `firebaseClient.ts` | Firebase app ID | No |
| `VITE_FIREBASE_DATABASE_URL` | ❌ | `firebaseClient.ts` | Firebase RTDB URL | No |
| `VITE_FIREBASE_STORAGE_BUCKET` | ❌ | `firebaseClient.ts` | Firebase Storage bucket | No |
| `VITE_CLOUDINARY_CLOUD_NAME` | ❌ | `PhotoboothSection`, `StorySection`, `SketchCanvas` | Cloudinary account name | Yes |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | ❌ | Same as above | Cloudinary unsigned preset | Yes |
| `VITE_YOUTUBE_API_KEY` | ❌ | `DailyVibeVinyl`, `MusicPlayer`, `PlaylistBuilder` | YouTube Data API v3 | Yes |
| `VITE_ADMIN_EMAIL` | ❌ | `SettingsView`, `useAuthState` | Admin email for gating | No |
| `VITE_SUPABASE_URL` | ❌ | `firebaseClient.ts` (unused?) | Supabase URL | No |
| `VITE_SUPABASE_ANON_KEY` | ❌ | `firebaseClient.ts` (unused?) | Supabase anon key | Yes |
| `GEMINI_API_KEY` | ❌ | (unused in code) | Gemini AI API | Yes |
| `APP_URL` | ❌ | (unused in code) | App deployment URL | No |

**Total: 15 variables** — 5 required for Firebase, others optional with feature degradation.

---

## 6.5 Third-Party Services

| Service | Purpose | Integration Point | Status |
|---------|---------|-------------------|--------|
| **Firebase Auth** | Google OAuth authentication | `firebaseClient.ts` → `signInWithPopup` + `onAuthStateChanged` | **Active** |
| **Firebase Firestore** | Real-time database for all shared data | `firebaseClient.ts` → `onSnapshot`, `setDoc`, `addDoc`, `deleteDoc`, `updateDoc` | **Active** |
| **Firebase RTDB** | (Declared but unused in runtime code) | `firebaseClient.ts` → `getDatabase()` | **Inactive** |
| **Cloudinary** | Image upload & hosting (photobooth, sketches, memories) | `cloudinary.ts` → `https://api.cloudinary.com/v1_1/.../image/upload` | **Test** |
| **YouTube Data API v3** | Search tracks, get video metadata | Search endpoints in `DailyVibeVinyl`, `MusicPlayer`, `MusicPlayerUtils`, `PlaylistBuilder` | **Test** |
| **YouTube IFrame API** | Embed & control video playback | Hidden iframe in `App.tsx` + `postMessage` commands | **Test** |
| **wttr.in** | Free weather data (no API key) | `WeatherSection.tsx` → `https://wttr.in/{city}?format=j1` | **Active** |
| **quotable.io** | Random love quotes | `MilestonesSection.tsx` → `https://api.quotable.io/random?tags=love` | **Test** |
| **Supabase** | (Migration file only) | `supabase/migration.sql` — not integrated in code | **Inactive** |
| **Gemini API** | (Env var defined, unused in code) | — | **Inactive** |

---

## 6.6 Library Inventory

| Library | Version | Purpose | Usage Count | Notes |
|---------|---------|---------|-------------|-------|
| `react` | ^19.0.1 | UI framework | 30+ files | Latest React 19 |
| `react-dom` | ^19.0.1 | DOM renderer | 2 files | Root render |
| `vite` | ^6.2.3 | Bundler & dev server | 5 configs | Fast builds |
| `@vitejs/plugin-react` | ^5.0.4 | React Fast Refresh | 1 file | vite.config |
| `typescript` | ~5.8.2 | Type checking | 2 configs | Strict mode |
| `tailwindcss` | ^4.1.14 | Utility CSS framework | 3 files | v4 with `@tailwindcss/vite` |
| `@tailwindcss/vite` | ^4.1.14 | Tailwind Vite plugin | 1 file | PostCSS-free v4 |
| `firebase` | ^12.15.0 | Firebase SDK | 10+ files | Auth + Firestore |
| `motion` | ^12.23.24 | Animation library | 20+ files | Formerly Framer Motion |
| `lucide-react` | ^0.546.0 | Icon library | 20+ files | 50+ unique icons used |
| `lenis` | ^1.3.25 | Smooth scrolling | 1 file | `App.tsx` initialization |
| `sonner` | ^2.0.7 | Toast notifications | 8+ files | `toast.success/error` |
| `swiper` | ^14.0.5 | Touch carousel | 1 file | Photobooth gallery |
| `html2canvas` | ^1.4.1 | DOM to canvas rendering | 2 files | Photobooth strip + print |
| `tone` | ^15.1.22 | Audio synthesis | 1 file | VirtualPiano sounds |
| `shadcn` | ^4.13.0 | UI component CLI | — | Used for Button + Toaster only |
| `@radix-ui/react-dialog` | ^1.1.19 | Accessible dialog | — | shadcn dependency |
| `@radix-ui/react-slot` | ^1.3.0 | Slot composition | 1 file | shadcn Button |
| `class-variance-authority` | ^0.7.1 | Variant management | 1 file | shadcn Button |
| `tailwind-merge` | ^3.6.0 | Tailwind class merging | 1 file | `cn()` utility |
| `clsx` | ^2.1.1 | Class name construction | 1 file | `cn()` utility |
| `tw-animate-css` | ^1.4.0 | Tailwind animation CSS | 1 file | Custom animations |
| `@fontsource-variable/geist` | ^5.2.9 | Geist font | 1 file | CSS import |
| `tsx` (dev) | ^4.21.0 | TS execution | — | Script runner |
| `esbuild` (dev) | ^0.25.0 | Fast bundler | — | Vite internal |

---

## 6.7 State Management Architecture

### Architecture: React Context + Sub-hooks Pattern

```
                    ┌──────────────────────────────────┐
                    │        CoupleProvider            │
                    │    (CoupleContext.tsx)            │
                    │                                  │
                    │  ┌────────────┐ ┌──────────────┐ │
                    │  │useAuthState│ │useProfileState│ │
                    │  │            │ │              │ │
                    │  │ session    │ │ userA        │ │
                    │  │ currentUser│ │ userB        │ │
                    │  │ isOnboarding│ │ updateProfile│ │
                    │  └────────────┘ └──────────────┘ │
                    │  ┌────────────┐ ┌──────────────┐ │
                    │  │useContent  │ │useEngagement │ │
                    │  │State       │ │State         │ │
                    │  │            │ │              │ │
                    │  │ memories   │ │ missions     │ │
                    │  │ journals   │ │ songs        │ │
                    │  │ letters    │ │ gratitudes   │ │
                    │  │ timeCaps   │ │ moodHistory  │ │
                    │  └────────────┘ └──────────────┘ │
                    │  ┌──────────────┐                │
                    │  │useSettings   │                │
                    │  │State         │                │
                    │  │              │                │
                    │  │ darkMode     │                │
                    │  │ anniversary  │                │
                    │  │ greetings    │                │
                    │  └──────────────┘                │
                    │                                  │
                    │  Cross-domain actions:           │
                    │  addMemory, updateProfile,       │
                    │  syncSongToPartner, etc.         │
                    └──────────┬───────────────────────┘
                               │ useCouple() hook
                               ▼
                    ┌──────────────────────┐
                    │  All Consumer         │
                    │  Components           │
                    └──────────────────────┘
```

### State Categories

| Category | Sub-hook | Data | Persistence |
|----------|----------|------|-------------|
| **Auth** | `useAuthState` | `session`, `currentUser`, `isOnboarding` | Firebase Auth SDK |
| **Profiles** | `useProfileState` | `userA`, `userB` | Firestore `profiles/` + localStorage cache |
| **Content** | `useContentState` | `memories`, `journals`, `letters`, `timeCapsules`, `userReactions` | Firestore (memories, journals) + localStorage (letters, capsules) |
| **Engagement** | `useEngagementState` | `missions`, `activityLogs`, `moodHistory`, `gratitudes`, `gardenPlant`, `waterLevel`, `currentSong` | Firestore (missions, gratitudes) + localStorage (garden, song) |
| **Settings** | `useSettingsState` | `darkMode`, `anniversaryDate`, `birthdayA/B`, `cloudinaryConfig`, `customGreetings`, `liveWeather` | Firestore (settings) + localStorage (darkMode) |

### Persistence Strategy

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Component  │────▶│  Context Action   │────▶│  Firestore   │
│  (dispatch) │     │  (optimistic)    │     │  (authority) │
└─────────────┘     └───────┬──────────┘     └──────┬───────┘
                            │                        │
                            ▼                        ▼
                     ┌──────────────┐        ┌──────────────┐
                     │  Local state  │        │  onSnapshot  │
                     │  (useState)   │◀───────│  listener    │
                     └──────┬───────┘        └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  localStorage │
                     │  (rAF batch)  │
                     └──────────────┘
```

**Key insight**: Every render triggers a `requestAnimationFrame` that batch-writes all context state to localStorage. This means:
- Firestore is the **source of truth** for shared data
- localStorage is a **read cache + fallback** (read on initial mount via `lsGet`)
- Firestore `onSnapshot` listeners update local state → which gets written to localStorage on next rAF

---

## 6.8 Authentication Flow

```
User Action                  Browser                         Firebase
────────────                  ───────                         ───────
   │                           │                                │
   ├─ Clicks "Climb up         │                                │
   │  with Google"             │                                │
   │                           ├─ signInWithPopup(              │
   │                           │    auth, googleProvider) ──────▶│
   │                           │                                ├─ Google OAuth popup
   │                           │                                │  (new window)
   │  ┌────────────────────────┘                                │
   │  │ Google account selection                                 │
   │  └────────────────────────┐                                │
   │                           │◀──────────────────────────────┤
   │                           │  UserCredential (token, user)  │
   │                           │                                │
   │                           ├─ onAuthStateChanged fires      │
   │                           │                                │
   │                           ├─ resolveSlot(user)             │
   │                           │  ├─ Check email whitelist      │
   │                           │  │  (adminEmail / "nicole")    │
   │                           │  │                                │
   │                           │  ├─ getDoc("profiles/user_a") ──▶│
   │                           │  ├─ getDoc("profiles/user_b") ──▶│
   │                           │  │◀───────────────────────────┤
   │                           │  │                            │
   │                           │  ├─ Auto-link whitelisted user │
   │                           │  │  → setDoc("profiles/...") ──▶│
   │                           │  │    { auth_id, name, status }│
   │                           │  │                            │
   │                           │  ├─ OR set isOnboarding=true   │
   │                           │  │  (non-whitelisted user)    │
   │                           │                                │
   │                           ├─ setSession(user)              │
   │                           │                                │
   │                           ├─ React re-render               │
   │                           │  ├─ session exists:            │
   │                           │  │  ├─ isOnboarding?           │
   │                           │  │  │  → OnboardingView        │
   │                           │  │  └─ !isOnboarding?          │
   │                           │  │     → HomeView (treehouse)  │
   │                           │  └─ !session: LoginView         │
   │                           │                                │
```

**Flow after whitelisted login:**
```
[Whitelisted] → isOnboarding=false automatically → HomeView
[Non-whitelisted] → isOnboarding=true → OnboardingView 
                   → Select slot → claimProfileSlot()
                   → setDoc("profiles/{slot}") → isOnboarding=false → HomeView
```

---

## 6.9 Data Persistence Flow

### General Pattern (Firestore-backed features)

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  User     │    │  Component    │    │  Context      │    │ Firestore│
│  Action   │    │  (UI)        │    │  Action       │    │          │
└────┬─────┘    └──────┬───────┘    └──────┬───────┘    └────┬─────┘
     │                 │                   │                 │
     │ Click "Save"    │                   │                 │
     │────────────────▶│                   │                 │
     │                 │ handleSubmit()     │                 │
     │                 │──────────────────▶│                 │
     │                 │                   │                 │
     │                 │   Optimistic      │                 │
     │                 │   update state    │                 │
     │                 │◀──────────────────│                 │
     │                 │                   │                 │
     │   UI updates    │                   │ setDoc()/      │
     │   immediately   │                   │ addDoc()       │
     │                 │                   │────────────────▶│
     │                 │                   │                 │
     │                 │                   │                 ├── Write
     │                 │                   │                 │  complete
     │                 │                   │◀────────────────┤
     │                 │                   │                 │
     │                 │   onSnapshot      │                 │
     │                 │   fires with      │                 │
     │                 │   confirmed data  │                 │
     │                 │◀──────────────────│                 │
     │                 │                   │                 │
     │  Final render    │                   │                 │
     │◀────────────────│                   │                 │
```

### Local-only Pattern (Letters, Time Capsules, Terrarium)

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│  User     │    │  Component    │    │  State +      │
│  Action   │    │  (UI)        │    │  localStorage │
└────┬─────┘    └──────┬───────┘    └──────┬───────┘
     │                 │                   │
     │ Click "Send"    │                   │
     │────────────────▶│                   │
     │                 │ sendLetter()      │
     │                 │──────────────────▶│
     │                 │                   │
     │                 │   Optimistic      │
     │                 │   update state    │
     │                 │   + rAF sync      │
     │                 │◀──────────────────│
     │                 │                   │
     │   UI updates    │                   │
     │   immediately   │                   │
     │◀────────────────│                   │
```

---

## 6.10 File Upload Flow

### Cloudinary Upload Path

```
┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐
│  User     │    │  Component    │    │  Canvas /     │    │Cloudinary│
│  Selects  │    │              │    │  Blob         │    │          │
│  File     │    │              │    │  Processing   │    │          │
└────┬─────┘    └──────┬───────┘    └──────┬───────┘    └────┬─────┘
     │                 │                   │                 │
     │ Pick image      │                   │                 │
     │────────────────▶│                   │                 │
     │                 │                   │                 │
     │                 ├─ [Avatar Flow]    │                 │
     │                 │  compressAvatar()  │                 │
     │                 │  → canvas resize   │                 │
     │                 │    256px max       │                 │
     │                 │  → toDataURL()     │                 │
     │                 │  → updateDoc()     │                 │
     │                 │  (base64 stored    │                 │
     │                 │   directly in      │                 │
     │                 │   Firestore)       │                 │
     │                 │                   │                 │
     │                 ├─ [Photobooth      │                 │
     │                 │   / Sketch Flow]  │                 │
     │                 │  canvas.toBlob()   │                 │
     │                 │──────────────────▶│                 │
     │                 │                   │                 │
     │                 │                   │ uploadTo        │
     │                 │                   │ Cloudinary()    │
     │                 │                   │────────────────▶│
     │                 │                   │                 │
     │                 │                   │                 ├── Upload
     │                 │                   │                 │  to /upload/
     │                 │                   │                 │  f_auto,q_auto,
     │                 │                   │                 │  w_1200,c_limit
     │                 │                   │◀────────────────┤
     │                 │                   │  secure_url     │
     │                 │                   │                 │
     │                 │   setURL(secure)  │                 │
     │                 │◀──────────────────│                 │
     │                 │                   │                 │
     │                 ├─ Save to Firestore│                 │
     │                 │  addDoc/updateDoc  │                 │
     │                 │  with secure_url   │                 │
```

### Upload Paths by Feature

| Feature | Source | Processing | Destination | Storage |
|---------|--------|------------|-------------|---------|
| **Avatar** | File input | Canvas resize 256px, JPEG 60% | Firebase `profiles/{id}.avatar_url` | Base64 (no Cloudinary) |
| **Milestone** | File/URL/preset | Optional Cloudinary upload | Firebase `memories/{id}.image_url` | Cloudinary URL |
| **Photobooth** | Canvas composition | WebP compression (quality 0.85→0.4), max 260KB | Cloudinary + `memories/{id}.image_url` | Cloudinary URL |
| **Journal** | File/URL | Optional Cloudinary upload | Firebase `journals/{id}.imageUrl` | Cloudinary URL |
| **Sketch** | Canvas → Blob | PNG/WebP | Cloudinary + `saved_sketches/{id}.url` | Cloudinary URL |

---

## 6.11 Realtime Architecture

### Core Pattern: Firestore `onSnapshot`

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│  User A       │         │   Firestore       │         │  User B       │
│  (Device 1)   │         │   (Server)        │         │  (Device 2)   │
└──────┬───────┘         └────────┬─────────┘         └──────┬───────┘
       │                         │                          │
       │  onSnapshot()           │                          │
       │  (listener attached)    │                          │
       │────────────────────────▶│                          │
       │                         │    onSnapshot()          │
       │                         │◀─────────────────────────│
       │                         │                          │
       │                         │                          │
       │  User Action            │                          │
       │  (e.g., react to        │                          │
       │   memory)               │                          │
       │                         │                          │
       │  setDoc/updateDoc/      │                          │
       │  addDoc()               │                          │
       │────────────────────────▶│                          │
       │                         │                          │
       │                         ├── Firestore writes        │
       │                         │  + triggers change       │
       │                         │  event                   │
       │                         │                          │
       │                         │  onSnapshot fires         │
       │  onSnapshot fires       │◀─────────────────────────│
       │◀────────────────────────│                          │
       │                         │                          │
       │  Local re-render        │   Local re-render        │
       │  with new data          │   with new data          │
```

### All Real-time Listeners (set up in `CoupleContext.tsx`)

| Listener | Collection | Purpose | Re-renders |
|----------|------------|---------|------------|
| `profiles` | `profiles/` | Both partners' profile data | userA, userB state |
| `memories` | `memories/` | Memory timeline + reactions | memories, userReactions |
| `journals` | `journals/` | Journal entries | journals |
| `missions` | `missions/` | Adventure missions | missions |
| `settings` | `settings/couple_settings` | Anniversary, birthdays, Cloudinary, greetings | anniversaryDate, birthdayA/B, etc. |
| `shared_song` | `settings/shared_song` | Currently playing song | currentSong |
| `gratitudes` | `gratitudes/` | Daily gratitude entries | gratitudes |
| `shared_queue` | `shared_queue/` | Music queue | (in PlaylistBuilder) |
| `calendar_events` | `calendar_events/` | Calendar events | (in SharedCalendar) |
| `sticky_notes` | `sticky_notes/` | Sticky notes | (in StickyNotes) |
| Game rooms (5) | `rooms/*` | TTT, WYR, SpinDare, Sketch, Watch | (in respective components) |
| `photobooth_rooms` | `photobooth_rooms/` | Photobooth sessions | (in PhotoboothSection) |
| `saved_sketches` | `saved_sketches/` | Saved drawing gallery | (in SketchCanvas) |

### Non-real-time Features (local-only)

| Feature | Sync Mechanism |
|---------|---------------|
| Letters | ❌ None — local state + localStorage only |
| Time Capsules | ❌ None — local state + localStorage only |
| Interactive Terrarium | ❌ None — localStorage only |
| Dark Mode | ❌ None — localStorage only |
| Daily Vibe Vinyl | ⚠️ YouTube search is live, but vibe data is localStorage only |

---

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        CoupleProvider                           │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ useAuthState │  │useProfileSt. │  │  Firestore Listeners  │  │
│  │ ─ session   │  │ ─ userA/B    │  │  (7 permanent)        │  │
│  │ ─ currentUsr │  │ ─ updateProf │  │  + 10+ dynamic       │  │
│  └─────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │useContentSt.│  │useEngagement │  │  Cross-domain actions  │  │
│  │ ─ memories  │  │ ─ missions   │  │  ─ addMemory          │  │
│  │ ─ journals  │  │ ─ song       │  │  ─ syncSongToPartner  │  │
│  │ ─ letters   │  │ ─ gratitudes │  │  ─ adminReset*        │  │
│  │ ─ capsules  │  │ ─ garden     │  │  ─ resetAllData       │  │
│  └─────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌──────────────────────────────────┐                          │
│  │      useSettingsState            │                          │
│  │  ─ darkMode, dates, cloudinary   │                          │
│  │  ─ greetings, liveWeather        │                          │
│  └──────────────────────────────────┘                          │
│                                   │                            │
│                                   ▼                            │
│                   ┌─────────────────────────────┐              │
│                   │  useCouple() hook exports    │              │
│                   │  60+ properties + methods   │              │
│                   └─────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
   ┌──────────────────────────────────────────────────────────────┐
   │                    Component Tree                             │
   │  App.tsx (root)                                               │
   │  ├─ LoginView (public)                                       │
   │  ├─ OnboardingView (auth, no slot)                           │
   │  └─ Authenticated Shell                                       │
   │      ├─ Header (logo + couple profiles)                      │
   │      ├─ Main Content (lazy-loaded views)                     │
   │      │  ├─ HomeView → WelcomeHero, WeatherSection, Music...  │
   │      │  ├─ MemoriesView → StorySection, PhotoboothSection   │
   │      │  ├─ TogetherView → LettersPanel, StatusPanel, ...     │
   │      │  ├─ PlayView → TicTacToe, WYR, Sketch, Piano          │
   │      │  ├─ AdventureView → InteractiveTerrarium              │
   │      │  └─ SettingsView → Profile, Admin, EmotionalPanel     │
   │      ├─ Nav Dock (6 tabs)                                    │
   │      ├─ Dark Mode Toggle                                     │
   │      ├─ Hidden YouTube iframe (persistent music)             │
   │      ├─ NightAmbient overlay                                 │
   │      ├─ ConfettiEffect                                       │
   │      └─ Surprise overlay                                     │
   └──────────────────────────────────────────────────────────────┘
```

---

*Audit generated: July 13, 2026*  
*Based on full codebase analysis*
