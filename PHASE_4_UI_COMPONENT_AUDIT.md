# PHASE 4: UI Component Audit — Couple_Private_Place

> **Project**: Couple_Private_Place — "Our Little Universe"  
> **Stack**: React 19 + Vite 6 + Tailwind CSS 4 + Firebase  
> **Auth**: Google OAuth (Firebase Auth)  
> **Date**: July 13, 2026  

---

## Table of Contents

1. [LoginView — Welcome to the Treehouse](#1-loginview)
2. [OnboardingView — Claim Your Spot](#2-onboardingview)
3. [App — Root Shell & Navigation Dock](#3-app)
4. [The Foyer (Home) Components](#4-the-foyer)
   - 4.1 WelcomeHero & MemorySpotlight
   - 4.2 DailyVibeVinyl
   - 4.3 WeatherSection & MoodSelector
   - 4.4 AnniversaryCountdown
   - 4.5 MilestonesSection & DailyQuote
   - 4.6 GratitudePrompt
   - 4.7 StickyNotes
   - 4.8 MusicPlayer
   - 4.9 PlaylistBuilder
   - 4.10 SharedCalendar
5. [Our Archive (Memories) Components](#5-our-archive)
   - 5.1 MemoriesView
   - 5.2 StorySection
   - 5.3 PhotoboothSection
6. [The Heartbeat (Together) Components](#6-the-heartbeat)
   - 6.1 TogetherView
   - 6.2 LettersPanel
   - 6.3 StatusPanel
   - 6.4 WatchPanel
7. [Game Attic (Play) Components](#7-game-attic)
   - 7.1 PlayView
   - 7.2 TicTacToe
   - 7.3 WouldYouRather
   - 7.4 SpinDare
   - 7.5 SketchCanvas
   - 7.6 VirtualPiano
8. [Secret Garden (Adventure) Components](#8-secret-garden)
   - 8.1 AdventureView
   - 8.2 InteractiveTerrarium
9. [Workshop (Settings) Components](#9-workshop)
   - 9.1 SettingsView
   - 9.2 ProfileSettingsPanel
   - 9.3 WorkspaceUtilitiesPanel
   - 9.4 AdminSection
   - 9.5 EmotionalAdminPanel
10. [Emotional Experiences (Cross-Tab)](#10-emotional)
    - 10.1 TimeGreeting & NightAmbient
    - 10.2 SpecialDateBanner
    - 10.3 MemoryToday
    - 10.4 ConfettiEffect
    - 10.5 WeatherBadge
11. [Shared / Reusable Components](#11-shared)
    - 11.1 ErrorBoundary
    - 11.2 ScrapbookPage
    - 11.3 WashiTapeDivider
    - 11.4 StickerButton
    - 11.5 PolaroidFrame
    - 11.6 EmptyJournalPage
    - 11.7 SectionHeader
    - 11.8 Skeleton Family

---

<a name="1-loginview"></a>
## 1. LoginView — Welcome to the Treehouse

- **File Location**: `src/components/LoginView.tsx`
- **Route URL**: `/` (when unauthenticated)
- **DOM Selector**: ScrapbookPage wrapper with Google Sign-In button
- **Purpose**: Google OAuth authentication gate — entry point to the couple's private app.
- **Primary Function**: Sign in with Google via Firebase Auth popup.
- **User Interaction**:
  - **Click**: "Climb up with Google" button → triggers `signInWithPopup(auth, googleProvider)`
  - **Keyboard**: Default button focus for Enter/Space
- **Data Source**:
  - **API**: Firebase Auth (`signInWithPopup`)
  - **Storage**: `localStorage.getItem/setItem("auth_error_msg")` for error persistence across redirects
- **Relationships**:
  - **Triggers**: On success, `session` is set → App transitions to `OnboardingView` or `HomeView`
  - **Conditional render**: Shown when `session` is null (not authenticated)
- **States**:
  - **Loading**: Button shows "Climbing the rope ladder..." with disabled state
  - **Error**: Red alert box with `AlertCircle` icon, shows Firebase error messages (popup closed, config missing, etc.)
  - **Success**: Redirects to treehouse interior
- **Access Control**: Public (no auth required)
- **UX Impact**: Critical — single authentication gate; must be reliable
- **Visual Notes**: Scrapbook-themed page; warm treehouse lighting (blurred circles); decorative SVG hearts/stars; Google button with colored SVG icon

---

<a name="2-onboardingview"></a>
## 2. OnboardingView — Claim Your Spot

- **File Location**: `src/components/OnboardingView.tsx`
- **Route URL**: `/` (when authenticated but no profile slot claimed)
- **DOM Selector**: ScrapbookPage with two slot buttons (Slot A / Slot B)
- **Purpose**: First-run profile slot selection for new users.
- **Primary Function**: Claim a profile slot (`user_a` or `user_b`) after Google Auth.
- **User Interaction**:
  - **Click**: Select Slot A/B → highlights selected slot; "Enter as..." button becomes active
  - **Click**: "Enter as..." → calls `claimProfileSlot(slot)` → sets profile in Firebase
  - **Click**: "Switch Account" → calls `logout()` to return to LoginView
  - **Hover**: Slot cards scale up slightly, cursor changes
- **Data Source**:
  - **API**: Firestore `collection("profiles")` — real-time listener for slot availability
  - **Context**: `useCouple()` for `claimProfileSlot`, `logout`
- **Relationships**:
  - **Triggers**: On success, `isOnboarding` becomes false → App renders `HomeView`
  - **Conditional render**: Shown when authenticated AND `isOnboarding === true`
- **States**:
  - **Empty**: Both slots show placeholder User icon with "Available" badge
  - **Occupied**: Shows avatar + name + "Occupied" badge, slot disabled
  - **Selected**: Slot card scales up with highlighted border, "Selected" badge
  - **Error**: Red error message below slot grid
  - **Loading**: "Climbing in..." text on confirm button
- **Access Control**: Authenticated only
- **UX Impact**: Critical — determines which user slot the authenticated Google account maps to
- **Visual Notes**: Two-column grid; wooden emblems; gender labels (Pria ♂️ / Wanita ♀️); warm background glow

---

<a name="3-app"></a>
## 3. App — Root Shell & Navigation Dock

- **File Location**: `src/App.tsx`
- **Route URL**: All authenticated routes
- **DOM Selector**: `#app-root-wrapper`
- **Purpose**: Root orchestrator — manages auth flow, navigation, music playback, dark mode, global overlays.
- **Primary Function**: Render the correct view based on auth state + active tab, manage global state.
- **User Interaction**:
  - **Click (Dock)**: 6 nav buttons → switch between rooms (Home/Memories/Together/Play/Adventure/Settings)
  - **Click (Dark Mode)**: Floating toggle button → circular reveal transition to dark/light mode
  - **Keyboard**: Arrow Left/Right → cycle tabs; Escape → close surprise overlay
  - **Hover (Dock)**: Dock buttons show tooltip with room name
  - **Click (Surprise)**: Surprise overlay with "Dismiss Moment" button
- **Data Source**:
  - **Context**: `useCouple()` — session, profiles, currentSong, darkMode, activeSurprise, etc.
  - **API**: Firestore `doc("rooms", "watch_room")` — cross-tab sync for watch room
  - **Storage**: `localStorage.getItem("music_volume")` for volume persistence
  - **Custom Events**: `toggleNavbar`, `setMusicVolume`, `changeTab`, `theaterSizeChanged`
- **Relationships**:
  - **Triggered by**: Auth state changes, tab navigation, custom events
  - **Triggers**: Renders lazy-loaded views (HomeView, MemoriesView, etc.) inside `ErrorBoundary` + `Suspense`
  - **Conditional render**: 
    - `!session` → LoginView
    - `isOnboarding` → OnboardingView
    - Otherwise → full shell with dock, header, main content area
- **States**:
  - **Loading**: Suspense fallback with spinner + "Unfolding a new page..."
  - **Error**: ErrorBoundary catches render errors per view
  - **Empty**: N/A (shell always has content)
- **Access Control**: Public shell (LoginView for unauthenticated)
- **UX Impact**: Critical — every user action flows through App
- **Visual Notes**: 
  - 6-tab floating wooden dock at bottom with `layoutId` animated bubble
  - Couple profile header (logo + both partner avatars + status)
  - Smooth view transitions (slide + opacity with `AnimatePresence`)
  - Room arrival doorplate label that fades in/out on tab switch
  - Dark mode toggle with `clip-path` circle reveal animation
  - Hidden YouTube iframe for persistent music playback

---

<a name="4-the-foyer"></a>
## 4. The Foyer (Home) Components

### 4.1 WelcomeHero & MemorySpotlight

- **File Location**: `src/components/home/WelcomeHero.tsx`
- **Route URL**: `/` (home tab)
- **DOM Selector**: `.flex.flex-col.md:flex-row` (WelcomeHero), `#spotlight-memory-widget` (MemorySpotlight)
- **Purpose**: Welcome cover page — greets the user with a daily message, days count, partner status, and a rotating spotlight memory.
- **Primary Function**: Display personalized welcome + highlight a random memory (rotates every 24h).
- **User Interaction**:
  - **Click (Memory Spotlight)**: 🥰 "Love This!" button → triggers haptic + floating emoji burst effect; "View Timeline" → navigates to Memories tab via `changeTab` custom event
  - **Click (Polaroid Frame)**: Triggers `triggerLoveEffect` — 14 floating emojis animate upward and fade
  - **Hover**: Spotlight image scales slightly on hover
- **Data Source**:
  - **Props**: `activeProfile`, `partnerProfile`, `daysCount`, `anniversaryDate`, `message`
  - **Context**: `useCouple()` for `memories`
  - **Storage**: `localStorage` for `couple_spotlight_memory_id`, `couple_spotlight_selected_at`
- **Relationships**:
  - **Triggered by**: HomeView renders it with props from context
  - **Triggers**: MemorySpotlight updates countdown every 15s, re-selects after 24h
- **States**:
  - **No memories**: Shows Camera icon + "No memories spotlighted yet" + link to Photobooth
  - **Active memory**: Shows Polaroid frame + title + description + date + rotation countdown
- **Access Control**: Authenticated
- **UX Impact**: High — sets emotional tone for the entire app
- **Visual Notes**: Large handwrite welcome font; "Days of Love" stamp with drop-shadow; Polaroid frame with `PolaroidFrame` component; gradient badge for "Memory Spotlight"

---

### 4.2 DailyVibeVinyl

- **File Location**: `src/components/home/DailyVibeVinyl.tsx`
- **Route URL**: `/` (home tab, "Nest" section)
- **DOM Selector**: `.relative.px-2.py-4`
- **Purpose**: Daily mood picker shaped like a vintage vinyl record — one vibe per day, searches YouTube for matching music.
- **Primary Function**: Let user pick a daily mood/vibe → plays a YouTube song through shared player.
- **User Interaction**:
  - **Click (Vibe Grid)**: Select one of 6 vibes (Romantic/Mellow/Happy/Nostalgic/Energetic/Cozy) → searches YouTube, plays song, saves to history
  - **Click (History toggle)**: "Recent vibes" button → expands/collapses last 7 days history
  - **Hover**: Vibe buttons scale up; history dots show emoji
  - **Keyboard**: N/A (mouse/touch only)
- **Data Source**:
  - **API**: YouTube Data API v3 (`VITE_YOUTUBE_API_KEY`)
  - **Context**: `useCouple().syncSongToPartner` — sends song to shared player
  - **Storage**: `daily_vibe_today`, `daily_vibe_history` (localStorage)
  - **Custom Events**: Listens for `dailyVinylReset` (admin reset)
- **Relationships**:
  - **Triggers**: Syncs song to partner player via CoupleContext
  - **Conditional render**: Vibe selection grid OR active vibe card (mutually exclusive)
- **States**:
  - **Empty (no vibe today)**: Shows 3×2 vibe grid
  - **Active (vibe selected)**: Shows spinning vinyl record with active vibe emoji, now-playing card
  - **Loading**: Shows spinner on selected vibe button
  - **Error**: Falls back gracefully if YouTube API fails (saves vibe without song)
  - **History collapsed/expanded**: Accordion toggle
- **Access Control**: Authenticated
- **UX Impact**: Medium — daily ritual for music discovery
- **Visual Notes**: Conic-gradient vinyl disc with grooves; tonearm animation on active; color-coded vibe buttons; animated equalizer bars when playing

---

### 4.3 WeatherSection & MoodSelector

- **File Location**: `src/components/home/WeatherSection.tsx`
- **Route URL**: `/` (home tab, "Our World" section)
- **DOM Selector**: `#mood-skies-sync-card`
- **Purpose**: Dual weather display (both partners' cities) + mood lantern selector + mood note.
- **Primary Function**: Show real-time weather for both partners, let user set mood with visual lantern.
- **User Interaction**:
  - **Click (Lantern)**: Opens mood grid — pick from 8 moods
  - **Click (Mood button)**: Updates profile mood, closes lantern
  - **Click (Save Mood)**: Saves mood note to history
  - **Input**: Text field for mood whisper note
  - **Hover**: Weather icon (SVG) scales up
- **Data Source**:
  - **Context**: `useCouple()` — profiles, weather data, GPS coordinates
  - **API**: `wttr.in` — free weather API (no key needed)
  - **GPS**: `navigator.geolocation.getCurrentPosition` — auto-detect location
  - **Storage**: Profile fields (weatherCity, latitude, longitude, timezone)
- **Relationships**:
  - **Triggered by**: HomeView
  - **Triggers**: Updates `liveWeather` context, profile location/timezone
- **States**:
  - **Loading**: Skeleton placeholders
  - **Empty**: "Skies hazy" fallback with "Load fallback" button
  - **Weather loaded**: Two-column comparison of both partners' weather + time + mood
- **Access Control**: Authenticated
- **UX Impact**: Medium — emotional connection through shared weather
- **Visual Notes**: Custom SVG weather icons (sunny/cloudy/rainy/snowy/stormy); glowing lantern with CSS pulse animation; decorative elements

---

### 4.4 AnniversaryCountdown

- **File Location**: `src/components/home/AnniversaryCountdown.tsx`
- **Route URL**: `/` (home tab)
- **DOM Selector**: `#anniversary-countdown-card`
- **Purpose**: Live countdown timer to the next anniversary date (updates every second).
- **Primary Function**: Display days/hours/minutes/seconds until next anniversary.
- **User Interaction**: None (passive display)
- **Data Source**:
  - **Context**: `useCouple().anniversaryDate`
  - **State**: `setInterval` every 1000ms for live countdown
- **Relationships**:
  - **Triggered by**: HomeView
  - **Triggers**: Nothing
- **States**:
  - **No anniversary date**: Returns null (hidden)
  - **Not anniversary**: Shows countdown with 4 unit displays
  - **Anniversary today**: Shows celebration banner with heart animations + "Happy Anniversary!" message
- **Access Control**: Authenticated
- **UX Impact**: Medium — builds anticipation for special dates
- **Visual Notes**: Gradient rose-to-pink background; floating heart sparkles; milestone badge with emoji; `tabular-nums` for aligned numbers

---

### 4.5 MilestonesSection & DailyQuote

- **File Location**: `src/components/home/MilestonesSection.tsx`
- **Route URL**: `/` (home tab, "Our Story" section)
- **DOM Selector**: `#milestone-special-days-card`, `#quote-card`
- **Purpose**: Display and edit milestones (anniversary count) + birthdays + daily love quote.
- **Primary Function**: Show next anniversary/milestone dates + birthdays, fetch daily romantic quote.
- **User Interaction**:
  - **Click (Tinker Dates)**: Opens modal to edit anniversary and both birthdays
  - **Click (Refresh Quote)**: Draws a new quote (random from API or curated pool)
  - **Click (Save Changes)**: Updates couple settings in Firebase
- **Data Source**:
  - **Context**: `useCouple()` — anniversaryDate, birthdayA/B, user profiles
  - **API**: `api.quotable.io/random?tags=love` — random love quote (with 4s timeout fallback to curated pool)
  - **Storage**: `romantic_daily_quote`, `romantic_daily_quote_time`
- **Relationships**:
  - **Triggers**: `updateCoupleSettings` on save
  - **Conditional render**: Edit modal (shown/hidden)
- **States**:
  - **Quote loading**: Spinner + "Fetching romantic whisper..."
  - **Quote loaded**: Display quote text + author
  - **Quote fallback**: Curated pool of 10 quotes if API fails
  - **Edit modal**: Overlay with date inputs
- **Access Control**: Authenticated
- **UX Impact**: Medium — milestone tracking + daily inspiration
- **Visual Notes**: Two-column grid (milestones / birthdays); avatar + countdown per person; modal overlay for editing; decorative heart watermark

---

### 4.6 GratitudePrompt

- **File Location**: `src/components/emotional/GratitudePrompt.tsx`
- **Route URL**: `/` (home tab, "Our Story" section)
- **DOM Selector**: `.relative.overflow-hidden.rounded-2xl` with gradient pink background
- **Purpose**: Daily gratitude practice — each partner shares one thing they're grateful for about the other.
- **Primary Function**: Submit today's gratitude, view partner's entry, track streak.
- **User Interaction**:
  - **Input**: Textarea (280 char limit) with character counter
  - **Keyboard**: Enter to submit
  - **Button**: "Share Gratitude" — sends to context, shows optimistic update
- **Data Source**:
  - **Context**: `useCouple().gratitudes`, `addGratitude`
  - **State**: Local text + optimistic entry
- **Relationships**:
  - **Triggered by**: HomeView
  - **Triggers**: `addGratitude()` in context
- **States**:
  - **Input mode**: Shows prompt text + textarea + submit
  - **Result mode**: Shows both partners' entries (or "Waiting for partner...")
  - **Streak**: Shows flame badge with streak count
  - **History**: Shows last 3 partner gratitudes
- **Access Control**: Authenticated
- **UX Impact**: High — daily emotional ritual, strengthens couple connection
- **Visual Notes**: Pink gradient background; side-by-side avatar display; streak badge with flame; decorative heart watermark

---

### 4.7 StickyNotes

- **File Location**: `src/components/home/StickyNotes.tsx`
- **Route URL**: `/` (home tab, "Nest" section)
- **DOM Selector**: `#sweet-notes-board`
- **Purpose**: Shared sticky notes board — partners leave notes for each other.
- **Primary Function**: Add/view/delete sticky notes synced to Firestore.
- **User Interaction**:
  - **Input**: Text field + Enter key to add note
  - **Click (Post)**: Adds note with random color
  - **Click (X)**: Delete note on hover
  - **Hover**: Delete button appears on note
- **Data Source**:
  - **API**: Firestore `collection("sticky_notes")` — ordered by `createdAt desc`, limit 12
  - **Context**: `useCouple()` for currentUser, profiles
- **Relationships**:
  - **Triggered by**: HomeView
  - **Triggers**: Adds activity log to Firestore `activity_logs`
- **States**:
  - **Empty**: `EmptyJournalPage` with 💕 icon
  - **Has notes**: 2-3 column grid of colored note cards
- **Access Control**: Authenticated
- **UX Impact**: Medium — quick communication tool
- **Visual Notes**: 5 color variants (yellow/pink/blue/green/purple); colored borders; author attribution

---

### 4.8 MusicPlayer

- **File Location**: `src/components/home/MusicPlayer.tsx`
- **Route URL**: `/` (home tab, "Listening Treehouse" section)
- **DOM Selector**: `.relative.space-y-5`
- **Purpose**: Full music player — search YouTube, playlist, lyrics, controls, shared queue integration.
- **Primary Function**: Play, search, queue music via YouTube; display synchronized lyrics.
- **User Interaction**:
  - **Click (Play/Pause)**: Toggle play state
  - **Click (Skip)**: Next/previous track
  - **Click (Shuffle/Repeat)**: Toggle modes
  - **Slider**: Volume control
  - **Search**: Text input + Enter → searches YouTube
  - **Paste URL**: Extracts video ID, loads track
  - **Click (Track)**: Select from playlist
  - **Scroll (Lyrics)**: Auto-scrolls synced lyrics
- **Data Source**:
  - **Context**: `useCouple()` — `currentSong`, `syncSongToPartner`, `setSongPlayState`
  - **API**: YouTube Data API v3 for search; YouTube IFrame Player API for playback
  - **API**: `fetchLyrics` for lyrics (via `MusicPlayerUtils`)
  - **Firestore**: `collection("shared_queue")` — real-time queue
  - **Storage**: `music_volume` (localStorage)
- **Relationships**:
  - **Triggered by**: HomeView
  - **Triggers**: `syncSongToPartner` for real-time sync, `shared_queue` Firestore writes
  - **Conditional render**: Lyrics panel (only when playing), expanded/collapsed
- **States**:
  - **No song**: "Pick a song or paste a YouTube link"
  - **Playing**: Shows controls + lyrics + playlist
  - **Loading**: Skeleton states
  - **Error**: "Lyrics not found," "Search failed," etc.
- **Access Control**: Authenticated
- **UX Impact**: High — core entertainment feature
- **Visual Notes**: Brass-knob styled header; expandable/collapsible; scrollable shared queue

---

### 4.9 PlaylistBuilder

- **File Location**: `src/components/home/PlaylistBuilder.tsx`
- **Route URL**: `/` (home tab, "Shared Queue" section)
- **DOM Selector**: `#playlist-builder`
- **Purpose**: Shared collaborative music queue — partners add songs that auto-play when current song ends.
- **Primary Function**: Add songs to shared queue via search or YouTube URL.
- **User Interaction**:
  - **Input**: Search or paste YouTube URL
  - **Enter**: Submit search
  - **Click (Play)**: Play a queued song immediately, removes from queue
  - **Click (Trash)**: Remove own queued song
  - **Click (Add Song +)**: Expand/collapse search form
- **Data Source**:
  - **API**: YouTube Data API v3
  - **Firestore**: `collection("shared_queue")` — ordered by `addedAt asc`
  - **Context**: `useCouple()` — currentUser, profiles
- **Relationships**:
  - **Triggered by**: HomeView
  - **Triggers**: `syncSongToPartner`, queue Firestore writes
  - **Integration**: MusicPlayer reads from shared_queue for auto-advance
- **States**:
  - **Loading**: Skeleton placeholders (3 queue items)
  - **Empty**: "Queue is empty. Add a song together! 🎵"
  - **Has items**: List with play button + thumbnail + info + remove
- **Access Control**: Authenticated
- **UX Impact**: Medium — collaborative music sharing
- **Visual Notes**: Fabric-cream background; play button with hover states; thumbnail images; optimized with `motion` animations

---

### 4.10 SharedCalendar

- **File Location**: `src/components/home/SharedCalendar.tsx`
- **Route URL**: `/` (within Together tab via TogetherView)
- **DOM Selector**: `#shared-calendar`
- **Purpose**: Shared couple calendar — both partners can add/view/delete events.
- **Primary Function**: Monthly calendar grid with event management.
- **User Interaction**:
  - **Click (Day)**: Select day → shows events for that day
  - **Click (Add Event)**: Opens inline form with title, date, description
  - **Click (Save)**: Adds event to Firestore
  - **Click (X on event)**: Delete own event
  - **Click (Month nav)**: Left/Right arrows to change month
- **Data Source**:
  - **Firestore**: `collection("calendar_events")` — ordered by `date asc`
  - **Context**: `useCouple()` — currentUser, profiles
- **Relationships**:
  - **Triggered by**: TogetherView (within "Calendar" tab)
- **States**:
  - **Loading**: Full skeleton with calendar grid, month nav, event cards
  - **Empty (month)**: Calendar grid with no dots
  - **Has events**: Dots on days; selected day expands event list
  - **Add form**: Animated expand/collapse
- **Access Control**: Authenticated
- **UX Impact**: Medium — coordination tool
- **Visual Notes**: Grid layout with day headers; selected/highlighted day; events show heart icon + author

---

<a name="5-our-archive"></a>
## 5. Our Archive (Memories) Components

### 5.1 MemoriesView

- **File Location**: `src/components/MemoriesView.tsx`
- **Route URL**: `/memories`
- **DOM Selector**: `#memories-section`
- **Purpose**: Orchestrator — switches between StorySection (timeline) and PhotoboothSection (live studio).
- **Primary Function**: Tab-based navigation between "Our Story" and "The Photobooth".
- **User Interaction**:
  - **Click**: Tab buttons with animated underline (`layoutId`)
- **Data Source**: None directly (passes to children)
- **Relationships**:
  - **Triggers**: Renders StorySection or PhotoboothSection
- **States**:
  - **Active sub-tab**: Animated indicator line
- **Access Control**: Authenticated
- **Visual Notes**: Centered pill-style tab switcher with `layoutId` spring animation; `WashiTapeDivider` separator

---

### 5.2 StorySection

- **File Location**: `src/components/memories/StorySection.tsx`
- **Route URL**: `/memories` (first tab)
- **DOM Selector**: `.text-left` (storyContent root)
- **Purpose**: Chronological scrapbook timeline — milestones, journal entries, drawings in a unified feed.
- **Primary Function**: Browse, create, edit, delete memories and journal entries with search/filter.
- **User Interaction**:
  - **Click (Add Milestone/Diary)**: Opens inline form
  - **Click (Memory card)**: Opens detail modal with reactions, comments, download/print
  - **Click (Reaction emoji)**: Toggle reaction on a memory
  - **Click (Edit)**: Inline edit title/description
  - **Click (Delete)**: Confirm + delete
  - **Input**: Search bar — filters by title/description/tags
  - **Select**: Tag/weather/mood dropdown filters
  - **Click (Load More)**: Pagination for both memories and journals
  - **Hover (Timeline cards)**: Hover-expand effect with date labels
  - **Keyboard**: Escape to close modal
- **Data Source**:
  - **Context**: `useCouple()` — memories, journals, reactions, comments, CRUD operations
  - **Storage**: Image upload via Cloudinary (or data URL fallback)
  - **API**: Unsplash fallback images for mood-based placeholders
- **Relationships**:
  - **Triggered by**: MemoriesView
  - **Triggers**: Firestore writes for add/update/delete
  - **Custom events**: `toggleNavbar` (hide/show on modal)
- **States**:
  - **Initial loading**: Full skeleton with placeholder cards
  - **Empty**: `EmptyJournalPage` with 📖 icon
  - **Has items**: HoverExpandFeed timeline with grouped rows
  - **Filter active**: Filtered subset
  - **Modal**: Memory detail overlay with reactions, comments, actions
  - **Edit mode**: Inline edit form inside modal
- **Access Control**: Authenticated
- **UX Impact**: High — central memory-keeping feature
- **Visual Notes**: Hover-expand rows with date labels; timeline connector line; gradient overlays; modal with wooden header; detailed filter/search bar

---

### 5.3 PhotoboothSection

- **File Location**: `src/components/memories/PhotoboothSection.tsx`
- **Route URL**: `/memories` (second tab)
- **DOM Selector**: `.space-y-6.text-left`
- **Purpose**: Real-time synchronized photobooth studio — partners take photos together remotely.
- **Primary Function**: Create/join a photobooth room, take synchronized photos, assemble strips, save to gallery.
- **User Interaction**:
  - **Click (Start/Close Camera)**: Toggle webcam
  - **Click (Host Room)**: Create room with random code
  - **Input (Join Room)**: Enter room code
  - **Click (Copy Code)**: Copy room code to clipboard
  - **Click (Layout button)**: Select strip layout (2-cut/4-cut/6-cut/Polaroid)
  - **Click (Capture)**: Auto-captures on countdown (3s)
  - **Click (Preset/Filter/Caption)**: Customize strip in editing phase
  - **Click (Save to Library)**: Composes strip + uploads to Cloudinary + adds to memories
  - **Click (Download)**: Download strip as PNG via html2canvas
  - **Swipe (Gallery)**: Swiper carousel of past photobooth strips
- **Data Source**:
  - **API**: Cloudinary for image upload; Camera API (webcam)
  - **Firestore**: `collection("photobooth_rooms")` — real-time room state
  - **Context**: `useCouple()` — addMemory, cloudinary config
  - **Storage**: `html2canvas` for strip rendering
- **Relationships**:
  - **Triggered by**: MemoriesView
  - **Triggers**: `addMemory()` to save strip to timeline
  - **Custom events**: `toggleNavbar` for lightbox
- **States**:
  - **Lobby (no room)**: Start camera button + Host/Join options + gallery history
  - **Waiting**: Room code with "Waiting for partner..." 
  - **Countdown**: Overlay with large countdown number (3-2-1)
  - **Shooting**: Auto-capture when countdown hits 0
  - **Editing**: Strip preset/filter/caption customization (host only)
  - **Done**: Strip saved, download option, "New Session" button
  - **Camera error**: Error message display
- **Access Control**: Authenticated
- **UX Impact**: High — key shared experience feature
- **Visual Notes**: Live camera feed with mirror transform; strip mockup with real photos; countdown overlay; Swiper carousel for history; room code with copy button

---

<a name="6-the-heartbeat"></a>
## 6. The Heartbeat (Together) Components

### 6.1 TogetherView

- **File Location**: `src/components/TogetherView.tsx`
- **Route URL**: `/together`
- **DOM Selector**: `#together-hub-container`
- **Purpose**: Orchestrator — 4-tab switcher between Letters, Status, Watch, Calendar.
- **Primary Function**: Tab-based navigation with animated indicator.
- **User Interaction**:
  - **Click**: Tab buttons with spring `layoutId` animation
  - **Haptic**: Light trigger on tab change
- **Data Source**: None directly
- **Relationships**:
  - **Triggers**: Renders LettersPanel/StatusPanel/WatchPanel/SharedCalendar
- **States**: Active sub-tab
- **Access Control**: Authenticated
- **Visual Notes**: Sticker-style pill tab switcher; `WashiTapeDivider` separators; fabric-cream background

---

### 6.2 LettersPanel

- **File Location**: `src/components/together/LettersPanel.tsx`
- **Route URL**: `/together` (first tab)
- **DOM Selector**: `.space-y-6` (root)
- **Purpose**: Private messages + time capsules — compose letters, seal time capsules for future.
- **Primary Function**: Send/receive letters with optional scheduled delivery, create/open time capsules.
- **User Interaction**:
  - **Mode toggle**: Switch between "Letters Cabinet" and "Time Capsules"
  - **Click (Write a Letter)**: Opens compose form with title, content, optional schedule date
  - **Click (Seal Capsule)**: Opens capsule form with message + future open date
  - **Click (Letter card)**: Opens letter in overlay modal
  - **Click (React)**: React to opened letter with emoji
  - **Click (Open Capsule)**: Open a time capsule if unlock date has passed
  - **Keyboard**: Escape to close modal
- **Data Source**:
  - **Context**: `useCouple()` — letters, timeCapsules, sendLetter, openLetter, reactToLetter, addTimeCapsule, openTimeCapsule
  - **State**: Local compose/capsule form state
- **Relationships**:
  - **Triggered by**: TogetherView
  - **Triggers**: Firestore writes for letters and capsules
- **States**:
  - **Empty letters**: `EmptyJournalPage` with 💌 icon
  - **Empty capsules**: `EmptyJournalPage` with ⏳ icon
  - **List**: Grid of letter/capsule cards
  - **Letter opened**: Modal overlay with content + reactions
  - **Composing**: Animated form with lined paper texture
  - **Locked letter**: Shows "Locked" badge with lock icon
  - **Capsule locked**: Shows days left countdown
  - **Capsule ready**: Animated pulse + "Open Capsule" button
  - **Sending**: Paper airplane fly-away animation
- **Access Control**: Authenticated
- **UX Impact**: High — emotional core feature
- **Visual Notes**: Lined paper texture on compose form; sealed envelope metaphors; capsule with lock/unlock states; modal with wooden header and heart seal; paper airplane sending animation

---

### 6.3 StatusPanel

- **File Location**: `src/components/together/StatusPanel.tsx`
- **Route URL**: `/together` (second tab)
- **DOM Selector**: `.max-w-xl.mx-auto`
- **Purpose**: Live activity status — set and view both partners' current status.
- **Primary Function**: Choose from preset statuses or set custom text.
- **User Interaction**:
  - **Click (Preset)**: Select from 12 status presets (Studying, Coding, Sleeping, etc.)
  - **Input (Custom)**: Type custom status + Enter to set
  - **Click (Set)**: Submit custom status
- **Data Source**:
  - **Context**: `useCouple().updateProfile` — updates profile status
  - **State**: Custom status input
- **Relationships**:
  - **Triggers**: `updateProfile` writes to Firebase
- **States**:
  - **Presets grid**: 3×4 grid of emoji + label buttons
  - **Custom input**: Text field with submit
  - **Selected**: Highlighted preset
- **Access Control**: Authenticated
- **UX Impact**: Medium — connection awareness
- **Visual Notes**: Two-column partner comparison (you vs partner); avatar with online/offline indicator; preset grid with emoji

---

### 6.4 WatchPanel

- **File Location**: `src/components/together/WatchPanel.tsx`
- **Route URL**: `/together` (third tab)
- **DOM Selector**: `.grid.grid-cols-1.lg:grid-cols-12`
- **Purpose**: Co-watching theater — sync YouTube videos with partner + chat.
- **Primary Function**: Load YouTube video, view together, chat in real-time.
- **User Interaction**:
  - **Input**: YouTube URL or ID → Load
  - **Click (Load)**: Sets video in Firestore room
  - **Click (Refresh)**: Force re-render iframe
  - **Click (Clear)**: Clear current video
  - **Input (Chat)**: Type message, Enter to send
  - **Click (Emoji burst)**: 6 emoji buttons → floating emoji animation
  - **Keyboard**: Enter to send chat
- **Data Source**:
  - **Firestore**: `doc("rooms", "watch_room")` — real-time room state (videoId, chatMessages)
  - **Context**: `useCouple()` — profiles, session
  - **Storage**: `couple_theater_size` (localStorage)
  - **Custom events**: `theaterSizeChanged`
- **Relationships**:
  - **Triggers**: `setDoc` on watch room; auto-syncs partner's music player state
  - **Auto-cleanup**: Removes chat messages older than 24h
- **States**:
  - **Empty (no video)**: TV icon placeholder + "Enter a YouTube URL"
  - **Video loaded**: YouTube iframe with wooden frame
  - **Chat empty**: "No entries in the log yet."
  - **Chat has messages**: Scrollable log with avatars
  - **Emoji burst**: Floating emoji animation
- **Access Control**: Authenticated
- **UX Impact**: High — shared viewing experience
- **Visual Notes**: Wooden TV frame with easel legs; theater size selector (compact/medium/expanded); chat panel with fabric-cream background; emoji burst buttons

---

<a name="7-game-attic"></a>
## 7. Game Attic (Play) Components

### 7.1 PlayView

- **File Location**: `src/components/PlayView.tsx`
- **Route URL**: `/play`
- **DOM Selector**: `#play-view`
- **Purpose**: Toy box grid orchestrator — manages 5 activities (games + sketch + piano).
- **Primary Function**: Open/close activity boxes, track play stats via Firestore.
- **User Interaction**:
  - **Click (Toy Box)**: Opens activity (animated expand)
  - **Click (Back)**: Returns to grid
  - **Click (Game sub-tab)**: Switch between TicTacToe/WYR/SpinDare
- **Data Source**:
  - **API**: Firestore `doc("rooms", "game_stats")` — play counts and streaks
  - **Context**: `useCouple()` — user profiles
- **Relationships**:
  - **Triggers**: Renders TicTacToe/WYR/SpinDare/SketchCanvas/VirtualPiano
  - **Conditional render**: Grid view vs active activity view
- **States**:
  - **Grid**: 5 toy boxes (TicTacToe, WYR, SpinDare, Sketch, Piano) with play stats
  - **Active game**: Expanded view with game content + back button
- **Access Control**: Authenticated
- **UX Impact**: High — entertainment hub
- **Visual Notes**: Wooden lid that lifts on hover (3D `rotateX`); fabric-cream box body; play count badge; vintage sticker badge; `LayoutGroup` for smooth layout animation

---

### 7.2 TicTacToe

- **File Location**: `src/components/PlayView.tsx` (inline)
- **DOM Selector**: `#ttt-cell-*`, `#ttt-reset-btn`
- **Purpose**: Real-time Tic Tac Toe (Hearts vs Rings) synced via Firestore.
- **Primary Function**: Play turn-based TicTacToe with partner.
- **User Interaction**:
  - **Click (Cell)**: Place X (heart) or O (ring)
  - **Click (New Round)**: Reset board
- **Data Source**:
  - **Firestore**: `doc("rooms", "ttt_room")` — board state, scores
  - **Context**: `useCouple()` — currentUser, profiles
- **Relationships**:
  - **Triggered by**: PlayView
  - **Triggers**: `setDoc` on ttt_room
- **States**:
  - **Loading**: Skeleton grid with avatars
  - **Playing**: Board with active turn indicator
  - **Winner**: "Victory!" or "Draw!" status
  - **My turn**: Highlighted "Your turn 🌸"
  - **Waiting**: "Waiting..." text
- **Access Control**: Authenticated
- **UX Impact**: Medium — competitive fun
- **Visual Notes**: Heart (X) and ring (O) SVG icons; brushstroke grid lines; scoreboard with avatars

---

### 7.3 WouldYouRather

- **File Location**: `src/components/PlayView.tsx` (inline)
- **DOM Selector**: `#wyr-option-*`, `#wyr-next-btn`
- **Purpose**: Romantic dilemma game — partners vote separately, compare answers.
- **Primary Function**: Vote on "Would You Rather" questions, see partner's choice.
- **User Interaction**:
  - **Click (Option A/B)**: Vote for one option
  - **Click (Next Question)**: Move to next question
- **Data Source**:
  - **Firestore**: `doc("rooms", "wyr_room")` — question index, votes
- **Relationships**:
  - **Triggers**: Firestore writes
- **States**:
  - **Loading**: Skeleton layout
  - **Voted**: Shows both partners' choices
  - **Not voted**: Both options available
- **Access Control**: Authenticated
- **UX Impact**: Medium — conversation starter
- **Visual Notes**: Two-option layout; selected option highlighted; result display with partner names

---

### 7.4 SpinDare

- **File Location**: `src/components/PlayView.tsx` (inline)
- **DOM Selector**: `#spin-dare-btn`, `#wheel-mode-truth`, `#wheel-mode-dare`
- **Purpose**: Spin wheel for truth or dare challenges.
- **Primary Function**: Spin a segmented wheel, land on a truth or dare item.
- **User Interaction**:
  - **Click (Truth/Dare toggle)**: Switch wheel mode
  - **Click (Spin Wheel)**: Animate wheel spin
  - **Click (Settings gear)**: Open editor to add/remove items
  - **Click (Add/Remove item)**: Customize wheel items
- **Data Source**:
  - **Firestore**: `doc("rooms", "spindare_room")` — truths, dares, rotation, state
- **Relationships**:
  - **Triggers**: Firestore writes
- **States**:
  - **Loading**: Skeleton with wheel placeholder
  - **Spinning**: 3.5s CSS transition
  - **Result**: Shows truth/dare text in card
  - **Editor**: Expandable item editor
  - **Empty**: Disabled spin button
- **Access Control**: Authenticated
- **UX Impact**: Medium — playful interaction
- **Visual Notes**: SVG-drawn wheel with color segments; golden needle pointer; editor with add/remove items; truth/dare toggle pills

---

### 7.5 SketchCanvas

- **File Location**: `src/components/PlayView.tsx` (inline)
- **DOM Selector**: Canvas element + toolbar
- **Purpose**: Collaborative real-time sketch canvas — both partners draw together.
- **Primary Function**: Draw, erase, undo/redo, save sketches to gallery.
- **User Interaction**:
  - **Mouse/Touch**: Draw on canvas
  - **Click (Pen/Eraser toggle)**: Switch drawing tools
  - **Click (Color)**: Choose from 10 colors
  - **Click (Brush size)**: Select from 4 weights
  - **Click (Undo/Redo)**: Step through stroke history
  - **Click (Clear)**: Clear entire canvas
  - **Click (Save)**: Upload to Cloudinary, save to gallery
  - **Click (Gallery image)**: Open lightbox preview
  - **Click (Download/Delete/Save to Memories)**: Actions on gallery items
  - **Keyboard**: Escape to close lightbox
- **Data Source**:
  - **Firestore**: `doc("rooms", "sketch_room")` — strokes array, session ID
  - **Firestore**: `collection("saved_sketches")` — saved drawings gallery
  - **API**: Cloudinary for image upload
  - **Context**: `useCouple()` — cloudinary config, addMemory
  - **Custom events**: `toggleNavbar` for lightbox
- **Relationships**:
  - **Triggers**: Firestore writes for strokes; Cloudinary upload; addMemory
- **States**:
  - **Loading**: Canvas awaiting first sync
  - **Drawing**: Active stroke collection
  - **Undo/Redo**: Stroke history management
  - **Limit reached**: Warning at 30,000 points
  - **Saving**: "Saving..." on save button
  - **Gallery empty**: "No drawings saved yet"
  - **Gallery has items**: Grid with preview + actions
  - **Lightbox**: Full-screen preview modal
- **Access Control**: Authenticated
- **UX Impact**: High — creative collaboration
- **Visual Notes**: Easel frame (top wood bar, canvas, bottom tray, legs); detailed toolbar; color palette; gallery grid; lightbox modal with download/save

---

### 7.6 VirtualPiano

- **File Location**: `src/components/VirtualPiano.tsx`
- **Route URL**: `/play` (piano activity)
- **DOM Selector**: Piano keyboard UI
- **Purpose**: Shared virtual piano — play melodies together.
- **Primary Function**: Interactive piano keyboard with real-time note sync.
- **User Interaction**:
  - **Click/Keyboard**: Play piano keys
  - **Note**: Sounds play via Web Audio API
- **Data Source**: Local state (purely client-side)
- **Access Control**: Authenticated
- **UX Impact**: Medium — creative expression
- **Visual Notes**: Full piano keyboard layout

---

<a name="8-secret-garden"></a>
## 8. Secret Garden (Adventure) Components

### 8.1 AdventureView

- **File Location**: `src/components/AdventureView.tsx`
- **Route URL**: `/adventure`
- **DOM Selector**: `.space-y-...` (root)
- **Purpose**: Secret Garden orchestrator — wraps InteractiveTerrarium.
- **Primary Function**: Render terrarium scene with description.
- **User Interaction**: None directly
- **Data Source**: None directly
- **Relationships**:
  - **Triggers**: Renders InteractiveTerrarium
- **Access Control**: Authenticated
- **Visual Notes**: Description text: "A little world that grows with you — no numbers, just nature."

---

### 8.2 InteractiveTerrarium

- **File Location**: `src/components/adventure/InteractiveTerrarium.tsx`
- **Route URL**: `/adventure`
- **DOM Selector**: `.space-y-5` (root)
- **Purpose**: Peaceful, living terrarium scene — changes with time of day, no XP/levels, pure aesthetic.
- **Primary Function**: Interactive landscape with time-of-day lighting, click interactions, garden diary.
- **User Interaction**:
  - **Click (Scene)**: Tap pond → ripple animation; tap ground → flower sparkles; tap sky (night) → shooting star
  - **Click (Water button)**: Water the garden (fills water bar, grows plant)
  - **Tab switch**: "The View" / "Garden Whispers" tabs
  - **Input (Diary)**: Type thought + Enter or "Plant 🌱" button
  - **Click (Dock)**: Tab buttons with `layoutId` animation
- **Data Source**:
  - **Context**: `useCouple()` — currentUser, userA, userB
  - **Storage**: `terrarium_water`, `terrarium_plant_stage`, `terrarium_last_visit`, `garden_diary` (localStorage)
  - **Custom events**: Listens for `terrariumReset` (admin)
- **Relationships**:
  - **Triggered by**: AdventureView
  - **Custom events**: `terrariumReset` listener
- **States**:
  - **Time-of-day**: 4 variants (dawn/day/sunset/night) — changes sky, sun/moon, stars, colors
  - **Plant stages**: 1-5 (seed → sprout → flower → bloom → mature)
  - **Water level**: 0-100% (decorative only)
  - **Ripple/Sparkle/Shooting star**: Temporary click effects
  - **Diary empty**: "No whispers yet... plant your first thought above!"
  - **Diary has entries**: List with author names (user A/B), emoji, text, date
  - **Night**: Stars, moon, fireflies
  - **Day**: Sun, clouds, petals
- **Access Control**: Authenticated
- **UX Impact**: High — core peaceful aesthetic experience
- **Visual Notes**: 
  - Layered landscape (sky → mountains → ground → pond → flowers → trees)
  - Gradient sky changes with time (dawn/day/sunset/night)
  - Animated clouds, sun, moon, stars
  - Ambient particles (fireflies at night, petals during day)
  - SVG-based pond, trees, mountains
  - Click animations (ripples, sparkles, shooting stars)
  - Diary with author tagging and emoji randomization
  - Water bar with animated fill

---

<a name="9-workshop"></a>
## 9. Workshop (Settings) Components

### 9.1 SettingsView

- **File Location**: `src/components/SettingsView.tsx`
- **Route URL**: `/settings`
- **DOM Selector**: `#settings-view-wrapper`
- **Purpose**: Full workshop — profile editing, utilities, emotional admin, catastrophic reset panel.
- **Primary Function**: User settings, Cloudinary config, admin-only reset tools.
- **User Interaction**:
  - **Scroll**: Single-page workbench layout
  - **Click (Lathe button)**: Triple-tap to unlock admin panel ("Access Workshop Lathe → confirm → unlocked")
  - **Click (Logout)**: Sign out
- **Data Source**:
  - **Context**: `useCouple()` — all settings
- **Relationships**:
  - **Triggers**: Renders sub-panels (ProfileSettingsPanel, WorkspaceUtilitiesPanel, EmotionalAdminPanel, AdminSection)
- **States**:
  - **Lathe locked/confirm/unlocked**: Three-state security gate
- **Access Control**: Authenticated; admin section gated by email check
- **Visual Notes**: Wooden workshop theme; side-by-side plaque portrait display; section dividers with WashiTape

---

### 9.2 ProfileSettingsPanel

- **File Location**: `src/components/SettingsView.tsx` (inline)
- **DOM Selector**: Inline within settings
- **Purpose**: Edit display name, emoji badge, upload avatar.
- **Primary Function**: Update user profile details.
- **User Interaction**:
  - **Input**: Name field, emoji badge field
  - **Click (Upload)**: Trigger file input → compress image → upload
  - **Click (Save)**: Save profile changes
- **Data Source**:
  - **Context**: `updateProfile`
  - **Storage**: Image compression via canvas API
- **States**:
  - **Saving**: "Saving..."
  - **Saved**: Green check + "Saved Portrait Details!"
- **Access Control**: Authenticated
- **Visual Notes**: 12-column grid layout; avatar with upload button overlay

---

### 9.3 WorkspaceUtilitiesPanel

- **File Location**: `src/components/SettingsView.tsx` (inline)
- **DOM Selector**: Inline within settings
- **Purpose**: Configure Cloudinary settings and theater screen size.
- **Primary Function**: Update Cloudinary credentials, select theater size.
- **User Interaction**:
  - **Input**: Cloud name + upload preset
  - **Select**: Theater size dropdown (compact/medium/expanded)
  - **Click (Save)**: Save settings
- **Data Source**:
  - **Context**: `updateCoupleSettings`
  - **Storage**: `couple_theater_size` (localStorage)
  - **Custom events**: `theaterSizeChanged`
- **States**:
  - **Saving/Saved**: Toggle state
- **Access Control**: Authenticated
- **Visual Notes**: Two-column input grid; dropdown with 3 options

---

### 9.4 AdminSection

- **File Location**: `src/components/SettingsView.tsx` (inline)
- **DOM Selector**: Gated behind lathe unlock
- **Purpose**: Admin-only destructive actions — reset missions, delete memories, kick slots, full reset.
- **Primary Function**: Execute dangerous operations with confirmation.
- **User Interaction**:
  - **Click (Execute Reset)**: Enter confirm mode
  - **Click (Confirm Action)**: Execute operation
  - **Click (Cancel)**: Cancel confirmation
- **Data Source**:
  - **Context**: Admin functions (resetMissions, clearLogs, deleteMemories, kickSlot, resetAllData, etc.)
  - **Storage**: localStorage operations (reset vinyl, reset terrarium)
  - **Custom events**: `dailyVinylReset`, `terrariumReset`
- **Relationships**:
  - **Triggers**: Various Firebase + localStorage operations
- **States**:
  - **Default**: Execute button per action
  - **Confirm**: Red "Confirm Action" + cancel buttons
  - **Done**: Green check + "Reset Completed" for 3 seconds
- **Access Control**: Admin only (email check)
- **UX Impact**: Critical — data safety
- **Visual Notes**: Shield warning icon; grid of action cards with icons; color-coded by severity

---

### 9.5 EmotionalAdminPanel

- **File Location**: `src/components/emotional/EmotionalAdminPanel.tsx`
- **Route URL**: `/settings` (Emotions section)
- **DOM Selector**: `.mt-4.space-y-4`
- **Purpose**: Manage emotional experiences — custom greetings, scheduled letters, special dates.
- **Primary Function**: Edit time-of-day greetings, view scheduled letters, configure special dates.
- **User Interaction**:
  - **Tab click**: Switch between Greetings/Letters/Dates tabs
  - **Input**: Edit greeting text for morning/afternoon/evening/night
  - **Click (Save)**: Save greetings
  - **Click (Reset Defaults)**: Reset to default greetings
  - **Input**: Anniversary date, birthday A/B dates
- **Data Source**:
  - **Context**: `useCouple()` — customGreetings, letters, updateCoupleSettings
  - **Types**: `CustomGreetings`, `DEFAULT_GREETINGS`
- **Relationships**:
  - **Triggers**: `updateCustomGreetings`, `updateCoupleSettings`
- **States**:
  - **Greetings tab**: 4 editable fields + save/reset
  - **Letters tab**: Upcoming scheduled letters list + summary
  - **Dates tab**: Date inputs + save
  - **Empty (letters)**: "No scheduled letters" message
- **Access Control**: Authenticated
- **UX Impact**: Medium — customization tool
- **Visual Notes**: Three-tab layout; rose-to-amber gradient header; inline inputs

---

<a name="10-emotional"></a>
## 10. Emotional Experiences (Cross-Tab)

### 10.1 TimeGreeting & NightAmbient

- **File Location**: `src/components/emotional/TimeGreeting.tsx`
- **Route URL**: All authenticated tabs (rendered in HomeView)
- **DOM Selector**: `.relative.overflow-hidden.rounded-2xl` banner
- **Purpose**: Time-of-day greeting banner + subtle night overlay.
- **Primary Function**: Show contextual greeting (morning/afternoon/evening/night), auto-dismiss after 6s.
- **User Interaction**:
  - **Click (Dismiss)**: Closes greeting (re-shows on period change)
  - **Passive**: Auto-hides after 6 seconds
- **Data Source**:
  - **Hook**: `useTimeOfDay()` — detects period, provides greeting + emoji
  - **Context**: `useCouple().customGreetings`
- **Relationships**:
  - **NightAmbient**: Rendered in App.tsx (cross-tab)
  - **Triggers**: Nothing
- **States**:
  - **Morning**: Amber gradient, sun icon
  - **Afternoon**: Sky gradient, cloud-sun icon
  - **Evening**: Orange gradient, sun icon
  - **Night**: Indigo gradient, moon icon
  - **Late night**: Additional "Time to rest" text
  - **Dismissed**: Hidden until period changes
- **Access Control**: Authenticated
- **UX Impact**: Medium — ambient warmth
- **Visual Notes**: Gradient background per period; period-specific icons; floating decorative stars at night

---

### 10.2 SpecialDateBanner

- **File Location**: `src/components/emotional/SpecialDateBanner.tsx`
- **Route URL**: All authenticated tabs (rendered in HomeView)
- **DOM Selector**: `.relative.overflow-hidden.rounded-2xl` celebration banner
- **Purpose**: Anniversary & birthday celebration banners.
- **Primary Function**: Show celebration banner when today is anniversary or birthday.
- **User Interaction**:
  - **Click (Dismiss)**: Close banner (re-shows next day)
- **Data Source**:
  - **Context**: `useCouple()` — anniversaryDate, birthdayA, birthdayB
- **States**:
  - **Anniversary**: Rose gradient, heart decorations, years-count message
  - **Birthday**: Amber gradient, cake icon, birthday messages
  - **Normal day**: Returns null (hidden)
- **Access Control**: Authenticated
- **UX Impact**: High — emotional celebration trigger
- **Visual Notes**: Floating decorative hearts; gradient backgrounds; age-specific messages (1 year, 3 years, 5+ years)

---

### 10.3 MemoryToday

- **File Location**: `src/components/emotional/MemoryToday.tsx`
- **Route URL**: All authenticated tabs (rendered in HomeView)
- **DOM Selector**: `.relative.overflow-hidden.rounded-2xl` (rose-to-amber gradient)
- **Purpose**: "On This Day" feature — shows memories/journals from the same date in previous years.
- **Primary Function**: Surface past memories from the same calendar date.
- **User Interaction**:
  - **Click (See all)**: Navigate to Memories tab via `changeTab` event
  - **Click (Memory card)**: No action (static display)
- **Data Source**:
  - **Context**: `useCouple()` — memories, journals
- **Relationships**:
  - **Triggers**: `changeTab` custom event → navigates to Memories tab
- **States**:
  - **No matching memories**: Returns null (hidden)
  - **Has memories**: Shows up to 2 entries with years-ago labels
  - **Has more than 2**: "See all N memories" link
- **Access Control**: Authenticated
- **UX Impact**: High — nostalgia trigger
- **Visual Notes**: Rose-to-amber gradient; calendar icon; "years ago" labels; diary badge on journal entries

---

### 10.4 ConfettiEffect

- **File Location**: `src/components/emotional/ConfettiEffect.tsx`
- **Route URL**: All authenticated tabs (rendered in App.tsx on special dates)
- **DOM Selector**: Fixed overlay
- **Purpose**: Confetti celebration animation on special dates.
- **Primary Function**: Burst confetti particles on anniversary/birthday.
- **User Interaction**: None (automatic)
- **Data Source**:
  - **Props**: `active`, `count`, `duration`
  - **Hook**: `useConfetti()` — detects anniversary/birthday, fires once per day
- **Relationships**:
  - **Triggered by**: App.tsx — fires on mount if special date
- **States**:
  - **Active**: Confetti particles animate
  - **Inactive**: Hidden
- **Access Control**: Authenticated
- **UX Impact**: Medium — celebratory delight
- **Visual Notes**: Animated confetti particles with CSS keyframes

---

### 10.5 WeatherBadge

- **File Location**: `src/components/emotional/WeatherBadge.tsx`
- **Route URL**: All authenticated tabs (rendered in App.tsx)
- **DOM Selector**: `.fixed.top-2.right-2` (top-right corner)
- **Purpose**: Persistent weather indicator badge — shows when it's raining in either partner's city.
- **Primary Function**: Display small rain alert badge.
- **User Interaction**:
  - **Click (Dismiss)**: Close badge group
- **Data Source**:
  - **Context**: `liveWeather` — shared weather data
  - **Logic**: `isRainy()` — checks weather code + description
- **Relationships**:
  - **Triggered by**: App.tsx (persistent across tabs)
- **States**:
  - **Rainy**: Shows 1-2 badges with location + weather description
  - **Not rainy**: Hidden
  - **Dismissed**: Hidden until rain stops and returns
- **Access Control**: Authenticated
- **UX Impact**: Low — ambient notification
- **Visual Notes**: Small badge with map pin icon; weather emoji; partner name label; dismiss button

---

<a name="11-shared"></a>
## 11. Shared / Reusable Components

### 11.1 ErrorBoundary

- **File Location**: `src/components/common/ErrorBoundary.tsx`
- **Route URL**: All routes (wraps each view)
- **Purpose**: Catches render errors and displays themed fallback UI.
- **Primary Function**: Prevent full app crash on view-level errors.
- **User Interaction**:
  - **Click (Try Again)**: Reset error state, re-render children
  - **Click (Reload Page)**: `window.location.reload()`
- **Data Source**: React Error Boundary lifecycle
- **Relationships**:
  - **Wraps**: Every view in App.tsx
- **States**:
  - **Normal**: Renders children
  - **Error**: Warning icon + error message + actions + dev error details
- **Access Control**: N/A (app-wide)
- **UX Impact**: Critical — prevents white screen of death
- **Visual Notes**: Amber warning icon; themed message; dev-only error details in collapsible `details` element

---

### 11.2 ScrapbookPage

- **File Location**: `src/components/scrapbook/ScrapbookPage.tsx`
- **Route URL**: Multiple (home, memories, together)
- **Purpose**: Visual container that mimics a physical scrapbook page.
- **Primary Function**: Wrap content with scrapbook aesthetic.
- **Data Source**: Props (children, className, compact)
- **Visual Notes**: Fabric-cream background; rounded corners; subtle border; light shadow

---

### 11.3 WashiTapeDivider

- **File Location**: `src/components/scrapbook/WashiTapeDivider.tsx`
- **Route URL**: Multiple (all views)
- **Purpose**: Decorative section divider styled like washi (masking) tape.
- **Primary Function**: Visually separate sections with a colored label.
- **User Interaction**: None (decorative)
- **Data Source**: Props (`color`, `label`)
- **Visual Notes**: Colored horizontal bar with optional centered label; 6 color variants

---

### 11.4 StickerButton

- **File Location**: `src/components/scrapbook/StickerButton.tsx`
- **Route URL**: Multiple (all views)
- **Purpose**: Themed button styled like a sticker patch.
- **Primary Function**: Reusable button with scrapbook aesthetic.
- **User Interaction**: Click (standard button behavior)
- **Data Source**: Props (`color`, `size`, `icon`, `onClick`, `disabled`, `className`, `children`)
- **Visual Notes**: Colored background; optional icon; size variants (sm/lg); rounded corners

---

### 11.5 PolaroidFrame

- **File Location**: `src/components/scrapbook/PolaroidFrame.tsx`
- **Route URL**: Home (WelcomeHero/MemorySpotlight)
- **Purpose**: Decorative Polaroid-style frame with caption.
- **Primary Function**: Display images in a Polaroid aesthetic.
- **Data Source**: Props (`rotation`, `caption`, `onClick`, `children`)
- **Visual Notes**: White border; slight rotation; caption text below image; shadow

---

### 11.6 EmptyJournalPage

- **File Location**: `src/components/scrapbook/EmptyJournalPage.tsx`
- **Route URL**: Multiple (StickyNotes, StorySection, LettersPanel, PlaylistBuilder)
- **Purpose**: Empty state placeholder for when a list has no items.
- **Primary Function**: Show empty state with icon + message + optional subtitle.
- **Data Source**: Props (`icon`, `message`, `subtitle`)
- **Visual Notes**: Centered icon + text; optional subtitle in muted color

---

### 11.7 SectionHeader

- **File Location**: `src/components/extras/SectionHeader.tsx`
- **Route URL**: TogetherView (LettersPanel, StatusPanel, WatchPanel)
- **Purpose**: Section title bar with optional action button.
- **Primary Function**: Standardized section heading with chapter/subtitle.
- **Data Source**: Props (`chapter`, `title`, `subtitle`, `action`)
- **Visual Notes**: Chapter label; title; subtitle; action slot

---

### 11.8 Skeleton Family

- **File Location**: `src/components/extras/Skeleton.tsx`
- **Route URL**: Multiple (WeatherSection, PlayView, StickyNotes, etc.)
- **Purpose**: Loading placeholder components.
- **Primary Function**: Display animated skeleton during data loading.
- **Exports**: `Skeleton`, `SkeletonCard`, `SkeletonImage`, `SkeletonButton`, `SkeletonAvatar`
- **Data Source**: Props (`width`, `height`, `rounded`, `className`)
- **Visual Notes**: Gray animated pulse skeleton shapes

---

## Summary Statistics

| Category | Count | Key Routes |
|----------|-------|------------|
| **View Orchestrators** | 7 | Home, Memories, Together, Play, Adventure, Settings, App |
| **The Foyer (Home)** | 10 | WelcomeHero, DailyVibeVinyl, WeatherSection, AnniversaryCountdown, MilestonesSection, GratitudePrompt, StickyNotes, MusicPlayer, PlaylistBuilder, SharedCalendar |
| **Our Archive (Memories)** | 3 (+ inline) | MemoriesView, StorySection, PhotoboothSection |
| **The Heartbeat (Together)** | 4 | TogetherView, LettersPanel, StatusPanel, WatchPanel |
| **Game Attic (Play)** | 6 (+ 4 inline games) | PlayView, TicTacToe, WouldYouRather, SpinDare, SketchCanvas, VirtualPiano |
| **Secret Garden** | 2 | AdventureView, InteractiveTerrarium |
| **Workshop (Settings)** | 5 | SettingsView, ProfileSettings, WorkspaceUtilities, AdminSection, EmotionalAdmin |
| **Emotional Experiences** | 5 | TimeGreeting, SpecialDateBanner, MemoryToday, ConfettiEffect, WeatherBadge |
| **Shared/Reusable** | 8 | ErrorBoundary, ScrapbookPage, WashiTapeDivider, StickerButton, PolaroidFrame, EmptyJournalPage, SectionHeader, Skeleton |
| **Total Verified Components** | ~50 | |

---

*Audit generated: July 13, 2026*  
*Based on code analysis of all exported components across src/components/*
